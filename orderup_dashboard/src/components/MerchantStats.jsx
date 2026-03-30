import React, { useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { orderBy, limit } from 'firebase/firestore';
import StatCard from './StatCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { X, TrendingUp, Receipt, Heart, PieChart, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { format, startOfDay, subDays, startOfWeek, subWeeks, startOfMonth, subMonths, isAfter } from 'date-fns';

export default function MerchantStats({ shop, onClose }) {
  // Fetch up to the last 500 orders for this specific shop
  const { data: orders, loading, error } = useCollection(`coffee_shops/${shop.id}/orders`, [
    orderBy('createdAt', 'desc'),
    limit(500)
  ]);

  const metrics = useMemo(() => {
    if (!orders || orders.length === 0) return {
      sales: 0, tips: 0, ordersCount: 0, aov: 0,
      chartData: [], topItems: [],
      orderHistory: [],
      periodStats: {
        today: 0, yesterday: 0,
        week: 0, lastWeek: 0,
        month: 0, lastMonth: 0
      }
    };

    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = subDays(todayStart, 1);
    const yesterdayCompEnd = subDays(now, 1);

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(weekStart, 1);
    const lastWeekCompEnd = subWeeks(now, 1);

    const monthStart = startOfMonth(now);
    const lastMonthStart = subMonths(monthStart, 1);
    const lastMonthCompEnd = subMonths(now, 1);

    const calc = {
      sales: 0, tips: 0, ordersCount: 0,
      itemCounts: {},
      groupedData: {},
      orderHistory: [],
      periodStats: {
        today: 0, yesterday: 0,
        week: 0, lastWeek: 0,
        month: 0, lastMonth: 0
      }
    };

    orders.forEach(doc => {
      // Use createdAt or placedAt
      const tsRaw = doc.createdAt?.toDate ? doc.createdAt.toDate() : (doc.placedAt?.toDate ? doc.placedAt.toDate() : doc.createdAt);
      if (!tsRaw) return;
      const ts = new Date(tsRaw);
      if (isNaN(ts.getTime())) return;

      const isCompleted = doc.status === 'completed';

      // Point-in-time Order Counts
      // Today vs Point-in-time Yesterday
      if (isAfter(ts, todayStart)) {
        calc.periodStats.today += 1;
      } else if (isAfter(ts, yesterdayStart) && ts < yesterdayCompEnd) {
        calc.periodStats.yesterday += 1;
      }

      // This Week vs Point-in-time Last Week
      if (isAfter(ts, weekStart)) {
        calc.periodStats.week += 1;
      } else if (isAfter(ts, lastWeekStart) && ts < lastWeekCompEnd) {
        calc.periodStats.lastWeek += 1;
      }

      // This Month vs Point-in-time Last Month
      if (isAfter(ts, monthStart)) {
        calc.periodStats.month += 1;
      } else if (isAfter(ts, lastMonthStart) && ts < lastMonthCompEnd) {
        calc.periodStats.lastMonth += 1;
      }

      // Financial Metrics (Only for completed orders)
      if (isCompleted) {
        const total = doc.total || 0;
        const grossTip = doc.tipAmount || doc.tip || 0;
        const netTip = doc.netTipRevenue || grossTip;
        const fee = doc.processingFee || 0;
        const grossSales = Math.max(0, total - grossTip - fee);

        calc.sales += grossSales;
        calc.tips += netTip;
        calc.ordersCount++;

        // Top Items
        if (doc.items && Array.isArray(doc.items)) {
          doc.items.forEach(item => {
            if (item && item.name) {
              if (!calc.itemCounts[item.name]) calc.itemCounts[item.name] = 0;
              calc.itemCounts[item.name] += (item.quantity || 1);
            }
          });
        }

        // Group for chart
        const dateStr = ts.toISOString().split('T')[0];
        if (!calc.groupedData[dateStr]) calc.groupedData[dateStr] = { date: dateStr, sales: 0 };
        calc.groupedData[dateStr].sales += grossSales;
      }

      // Add to history
      calc.orderHistory.push({
        id: doc.id,
        time: format(ts, 'HH:mm'),
        date: format(ts, 'MMM dd'),
        total: doc.total || 0,
        status: doc.status,
        itemsCount: (doc.items || []).length,
        userName: doc.pickupName || doc.userName || 'Guest'
      });
    });

    const topItems = Object.keys(calc.itemCounts)
      .map(name => ({ name, count: calc.itemCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const chartData = Object.values(calc.groupedData).sort((a, b) => a.date.localeCompare(b.date));

    return {
      sales: calc.sales,
      tips: calc.tips,
      ordersCount: calc.ordersCount,
      aov: calc.ordersCount > 0 ? calc.sales / calc.ordersCount : 0,
      chartData,
      topItems,
      orderHistory: calc.orderHistory,
      periodStats: calc.periodStats
    };
  }, [orders]);

  const formatZAR = (amount) => `R ${Number(amount).toFixed(2)}`;

  const renderOrderTrend = (current, previous) => {
    const diff = current - previous;
    const isUp = diff >= 0;

    let percentStr = '';
    if (previous !== 0) {
      const percent = ((current / previous) - 1) * 100;
      percentStr = `${isUp ? '+' : '-'}${Math.abs(percent).toFixed(2)}% `;
    } else if (current !== 0) {
      percentStr = `${isUp ? '+' : '-'}100.00% `;
    } else {
      return <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>No prior data</div>;
    }

    const color = isUp ? 'var(--accent-success)' : 'var(--accent-danger)';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color, marginTop: '4px' }}>
        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{percentStr}({isUp ? '+' : '-'}{Math.abs(diff)})</span>
      </div>
    );
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', position: 'relative', marginTop: '2rem', maxHeight: '80vh', overflowY: 'auto' }}>
      <button
        onClick={onClose}
        style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'var(--text-secondary)' }}
      >
        <X size={24} />
      </button>

      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-secondary)' }}></div>
          {shop.name} Performance Details
        </h2>
        <p className="text-muted">Detailed order analytics and point-in-time comparisons.</p>
      </div>

      {loading ? (
        <div className="loading-pulse" style={{ height: '300px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }} />
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid var(--accent-danger)' }}>
          <p style={{ color: 'var(--accent-danger)', marginBottom: '1rem' }}>Firestore Index Required</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>To view shop-specific orders, an index is required. Please check your browser console for the direct link.</p>
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Order Volume Performance</h3>
          <div className="grid-3" style={{ marginBottom: '3rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>ORDERS TODAY</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics.periodStats.today}</div>
              {renderOrderTrend(metrics.periodStats.today, metrics.periodStats.yesterday)}
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>THIS WEEK</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics.periodStats.week}</div>
              {renderOrderTrend(metrics.periodStats.week, metrics.periodStats.lastWeek)}
            </div>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem' }}>THIS MONTH</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{metrics.periodStats.month}</div>
              {renderOrderTrend(metrics.periodStats.month, metrics.periodStats.lastMonth)}
            </div>
          </div>

          <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Financial Overview</h3>
          <div className="grid-2" style={{ marginBottom: '3rem' }}>
            <StatCard
              title="Gross Sales"
              value={formatZAR(metrics.sales)}
              icon={<TrendingUp />}
              color="success"
            />
            <StatCard
              title="Avg Order Value"
              value={formatZAR(metrics.aov)}
              icon={<PieChart />}
              color="primary"
            />
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
            <div style={{ flex: 2 }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Sales Distribution</h3>
              <div style={{ height: '250px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                {metrics.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={metrics.chartData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.8)', border: '1px solid var(--glass-border)', borderRadius: '12px', backdropFilter: 'blur(12px)', color: '#fff' }} />
                      <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                      <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `R${val}`} />
                      <Area type="monotone" dataKey="sales" name="Sales (ZAR)" stroke="var(--accent-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted" style={{ textAlign: 'center', marginTop: '4rem' }}>Not enough data for chart.</p>}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--text-primary)' }}>Best Sellers</h3>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                {metrics.topItems.length > 0 ? (
                  metrics.topItems.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: idx < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: idx < 4 ? '0.75rem' : '0' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.count} sold</span>
                    </div>
                  ))
                ) : <p className="text-muted">No items sold yet.</p>}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Package size={20} className="text-muted" />
              Recent Order History
            </h3>
            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.orderHistory.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <div style={{ fontSize: '0.9rem' }}>{order.time}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{order.date}</div>
                        </td>
                        <td>{order.userName}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{order.itemsCount} items</td>
                        <td>
                          <span className={order.status === 'completed' ? 'status-paid' : 'status-processing'}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatZAR(order.total)}</td>
                      </tr>
                    ))}
                    {metrics.orderHistory.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No orders found for this shop.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
