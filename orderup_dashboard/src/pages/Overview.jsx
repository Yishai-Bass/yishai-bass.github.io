import React, { useMemo, useState } from 'react';
import { Wallet, Landmark, TrendingUp, AlertCircle, Coins, Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useCollection, useCollectionGroup } from '../hooks/useFirestore';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { orderBy, limit, where } from 'firebase/firestore';
import { startOfDay, subDays, startOfWeek, subWeeks, startOfMonth, subMonths, isAfter } from 'date-fns';

const COLORS = ['#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899'];

export default function Overview() {
  const { data: accounts, loading: loadingAccounts, error } = useCollection('accounts');
  const { data: shops } = useCollection('coffee_shops');

  // Use collection group for all orders globally to power the graph
  const { data: recentOrders, loading: loadingOrders, error: errorOrders } = useCollectionGroup('orders', [
    orderBy('createdAt', 'desc'),
    limit(500)
  ]);

  // Compatibility Fix: We remove the accountId filter from the query to avoid 
  // complex composite index requirements. We'll filter for "REVENUE:" in memory instead.
  const sixtyDaysAgo = subDays(new Date(), 60);
  const { data: revenuePostings, loading: loadingProfit, error: errorProfit } = useCollectionGroup('postings', [
    where('createdAt', '>=', sixtyDaysAgo),
    orderBy('createdAt', 'desc')
  ]);

  const [showBBPie, setShowBBPie] = useState(false);

  const isIndexError = errorProfit?.code === 'failed-precondition' || errorOrders?.code === 'failed-precondition';
  const indexLink = (errorProfit?.message || errorOrders?.message || '').split('here: ')[1];

  const metrics = useMemo(() => {
    if (!accounts.length) return { totalAssets: 0, merchantLiabilities: 0, userLiabilities: 0, bbReserves: 0, revenue: 0 };

    let totalAssets = 0;
    let merchantLiabilities = 0;
    let userLiabilities = 0;
    let bbReserves = 0;
    let revenue = 0;

    accounts.forEach(acc => {
      if (acc.type === 'ASSET' && acc.currency === 'ZAR') totalAssets += acc.balance || 0;
      if (acc.type === 'LIABILITY' && acc.ownerType === 'MERCHANT' && acc.currency === 'ZAR') merchantLiabilities += acc.balance || 0;
      if (acc.type === 'LIABILITY' && acc.ownerType === 'USER' && acc.currency === 'ZAR') userLiabilities += acc.balance || 0;
      if (acc.type === 'LIABILITY' && acc.id.includes(':BBV_')) bbReserves += acc.balance || 0;
      if (acc.type === 'REVENUE' && acc.currency === 'ZAR') revenue += acc.balance || 0;
    });

    return { totalAssets, merchantLiabilities, userLiabilities, bbReserves, revenue };
  }, [accounts]);

  const profitPerformance = useMemo(() => {
    // We now filter for REVENUE accounts in memory to avoid index errors
    if (!revenuePostings || revenuePostings.length === 0) return null;

    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = subDays(todayStart, 1);
    const yesterdayCompEnd = subDays(now, 1); // Point-in-time yesterday

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(weekStart, 1);
    const lastWeekCompEnd = subWeeks(now, 1); // Point-in-time last week

    const monthStart = startOfMonth(now);
    const lastMonthStart = subMonths(monthStart, 1);
    const lastMonthCompEnd = subMonths(now, 1); // Point-in-time last month

    const calc = {
      today: 0, yesterday: 0,
      week: 0, lastWeek: 0,
      month: 0, lastMonth: 0
    };

    revenuePostings.forEach(p => {
      // Memory filter for Revenue accounts
      if (!p.accountId || !p.accountId.startsWith('REVENUE:')) return;

      try {
        const tsRaw = p.createdAt?.toDate ? p.createdAt.toDate() : p.createdAt;
        if (!tsRaw) return;
        const ts = new Date(tsRaw);
        if (isNaN(ts.getTime())) return;

        const amount = p.amount || 0;
        const val = p.direction === 'CREDIT' ? amount : -amount;

        // Today vs Point-in-time Yesterday
        if (isAfter(ts, todayStart)) {
          calc.today += val;
        } else if (isAfter(ts, yesterdayStart) && ts < yesterdayCompEnd) {
          calc.yesterday += val;
        }

        // This Week vs Point-in-time Last Week
        if (isAfter(ts, weekStart)) {
          calc.week += val;
        } else if (isAfter(ts, lastWeekStart) && ts < lastWeekCompEnd) {
          calc.lastWeek += val;
        }

        // This Month vs Point-in-time Last Month
        if (isAfter(ts, monthStart)) {
          calc.month += val;
        } else if (isAfter(ts, lastMonthStart) && ts < lastMonthCompEnd) {
          calc.lastMonth += val;
        }
      } catch (e) {
        console.warn('Error processing posting for metrics:', e);
      }
    });

    return calc;
  }, [revenuePostings]);

  const bbPieData = useMemo(() => {
    if (!accounts.length) return [];
    const pieMap = {};
    accounts.forEach(acc => {
      if (acc.type === 'LIABILITY' && acc.currency === 'ZAR' && acc.id.includes(':BBV_')) {
        let name = 'OrderUp Platform';
        if (acc.ownerType === 'MERCHANT') {
          const shop = shops?.find(s => s.id === acc.ownerId);
          name = shop?.name || `Shop: ${acc.ownerId.substring(0, 6)}`;
        }
        if (!pieMap[name]) pieMap[name] = 0;
        pieMap[name] += (acc.balance || 0) / 100;
      }
    });
    return Object.keys(pieMap).map(key => ({ name: key, value: pieMap[key] })).filter(d => d.value > 0);
  }, [accounts, shops]);

  // Chart Data: Grouping profit by date
  const chartData = useMemo(() => {
    const grouped = {};

    // Pre-populate last 7 days with zeros to ensure a line is always visible
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const ds = d.toISOString().split('T')[0];
      grouped[ds] = { date: ds, profit: 0, orders: 0 };
    }

    if (recentOrders && recentOrders.length > 0) {
      recentOrders.forEach(order => {
        try {
          const tsRaw = order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt;
          if (!tsRaw) return;
          const dateObj = new Date(tsRaw);
          if (isNaN(dateObj.getTime())) return;

          const dateStr = dateObj.toISOString().split('T')[0];
          // We only care about the last 7 days for the basic view if we want consistency, 
          // but we'll accept any date that fits our 500 limit.
          if (!grouped[dateStr]) {
            grouped[dateStr] = { date: dateStr, profit: 0, orders: 0 };
          }

          grouped[dateStr].profit += (order.platformRevenueCents || 0) / 100;
          grouped[dateStr].orders += 1;
        } catch (e) {
          console.warn('Error processing order for graph:', e);
        }
      });
    }

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [recentOrders]);

  const formatZAR = (cents) => `R${(cents / 100).toFixed(2)}`;

  const formatDeltaZAR = (cents) => {
    const amount = (cents / 100).toFixed(2);
    return cents >= 0 ? `+R${amount}` : `-R${Math.abs(amount).toFixed(2)}`;
  };

  const renderTrend = (current, previous) => {
    const diff = current - previous;
    const isUp = diff >= 0;

    // Calculate percentage, handling division by zero
    let percentStr = '';
    if (previous !== 0) {
      const percent = ((current / previous) - 1) * 100;
      percentStr = `${isUp ? '+' : '-'}${Math.abs(percent).toFixed(2)}% `;
    } else if (current !== 0) {
      percentStr = `${isUp ? '+' : '-'}100.00% `;
    } else {
      return <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>No activity</div>;
    }

    const color = isUp ? 'var(--accent-success)' : 'var(--accent-danger)';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color, marginTop: '8px' }}>
        <div style={{ padding: '2px', borderRadius: '4px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
        <span>{percentStr}({formatDeltaZAR(diff)})</span>
      </div>
    );
  };

  if (error || (errorProfit && !isIndexError) || (errorOrders && !isIndexError)) {
    return (
      <div className="animate-fade-in">
        <h1>Dashboard Overview</h1>
        <div className="glass-panel" style={{ padding: '2rem', color: 'var(--accent-danger)' }}>
          <AlertCircle style={{ marginBottom: '1rem' }} />
          <h2>Connection Error</h2>
          <p>{error?.message || errorProfit?.message || errorOrders?.message}</p>
        </div>
      </div>
    );
  }

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    if (percent === 0) return null;
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '12px', fontWeight: 'bold' }}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="animate-fade-in">
      <h1>Financial Overview</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Real-time aggregated ledger and platform profit statistics.</p>

      {isIndexError && (
        <div className="glass-panel animate-pulse" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-secondary)', marginBottom: '2rem', background: 'rgba(139, 92, 246, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <AlertCircle color="var(--accent-secondary)" />
            <h3 style={{ margin: 0 }}>Firestore Index Required</h3>
          </div>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>To display historical profit analytics, you need to create a simple collection-group index in Firestore. Click the button below to open the creation link.</p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a
              href={indexLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Create Firestore Index
            </a>
            {window.location.port === '5173' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-danger)', fontWeight: 600 }}>Note: Check if your latest dashboard is actually running on port 5174.</span>
            )}
          </div>
        </div>
      )}

      {/* PROFIT SECTION */}
      <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Platform Profit Performance</h2>
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>TODAY</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {loadingProfit ? <div className="loading-pulse" style={{ width: '80px', height: '1.5rem', borderRadius: '4px' }} /> : (profitPerformance ? formatZAR(profitPerformance.today) : 'R 0.00')}
          </div>
          {profitPerformance && renderTrend(profitPerformance.today, profitPerformance.yesterday)}
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>THIS WEEK</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {loadingProfit ? <div className="loading-pulse" style={{ width: '80px', height: '1.5rem', borderRadius: '4px' }} /> : (profitPerformance ? formatZAR(profitPerformance.week) : 'R 0.00')}
          </div>
          {profitPerformance && renderTrend(profitPerformance.week, profitPerformance.lastWeek)}
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem' }}>THIS MONTH</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {loadingProfit ? <div className="loading-pulse" style={{ width: '80px', height: '1.5rem', borderRadius: '4px' }} /> : (profitPerformance ? formatZAR(profitPerformance.month) : 'R 0.00')}
          </div>
          {profitPerformance && renderTrend(profitPerformance.month, profitPerformance.lastMonth)}
        </div>
      </div>

      <h2>Orders & Platform Profit (Global)</h2>
      <div className="glass-panel" style={{ height: '350px', padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loadingOrders ? (
          <div className="loading-pulse" style={{ height: '100%', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
        ) : (chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />

              <YAxis yAxisId="left" stroke="var(--text-secondary)" axisLine={false} tickLine={false} tickFormatter={(val) => `R${val.toFixed(0)}`} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" axisLine={false} tickLine={false} />

              <Tooltip
                contentStyle={{ background: 'rgba(17, 24, 39, 0.8)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(12px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#fff' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                formatter={(val, name) => name === 'Platform Profit' ? `R ${val.toFixed(2)}` : val}
              />

              <Bar yAxisId="right" dataKey="orders" name="Total Orders" fill="url(#barGradient)" barSize={40} radius={[6, 6, 0, 0]} />
              <Line
                yAxisId="left"
                type="linear"
                dataKey="profit"
                name="Platform Profit"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 8, fill: '#f59e0b', strokeWidth: 0 }}
                connectNulls={true}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            <TrendingUp size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>{isIndexError ? 'Waiting for Firestore Index...' : 'No order data found to graph.'}</p>
          </div>
        ))}
      </div>

      {/* Primary Metrics Layer */}
      <h2>Ledger Assets & Liabilities</h2>
      <div className="grid-3">
        <StatCard
          title="Total Platform Assets"
          value={loadingAccounts ? "..." : formatZAR(metrics.totalAssets)}
          icon={<Landmark />}
          color="primary"
          subtext="Main Bank Account Holdings"
        />
        <StatCard
          title="Platform Revenue (All Time)"
          value={loadingAccounts ? "..." : formatZAR(metrics.revenue)}
          icon={<TrendingUp />}
          color="success"
          subtext="Total cumulative earnings"
        />
        <StatCard
          title="Bean Buck Reserves"
          value={loadingAccounts ? "..." : formatZAR(metrics.bbReserves)}
          icon={<Coins />}
          color="primary"
          subtext="Click to see backing breakdown"
          onClick={() => setShowBBPie(!showBBPie)}
        />
      </div>

      {showBBPie && (
        <div className="animate-fade-in glass-panel" style={{ padding: '2rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ alignSelf: 'flex-start' }}>Bean Bucks Reservers Breakdown</h2>
          <div style={{ width: '100%', height: 300 }}>
            {bbPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bbPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bbPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `R ${value.toFixed(2)}`}
                    contentStyle={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', backdropFilter: 'var(--glass-blur)', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted">No Bean Buck reserves data available.</p>}
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
            {bbPieData.map((entry, i) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: COLORS[i % COLORS.length] }}></div>
                {entry.name} (R {entry.value.toFixed(2)})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Metrics */}
      <div className="grid-2">
        <StatCard
          title="Owed to Merchants"
          value={loadingAccounts ? "..." : formatZAR(metrics.merchantLiabilities)}
          icon={<Wallet />}
          color="danger"
          subtext="Cleared and uncleared merchant payables"
        />
        <StatCard
          title="User Wallet Balances"
          value={loadingAccounts ? "..." : formatZAR(metrics.userLiabilities)}
          icon={<Users />}
          color="danger"
          subtext="Total fiat liability to users"
        />
      </div>
    </div>
  );
}
