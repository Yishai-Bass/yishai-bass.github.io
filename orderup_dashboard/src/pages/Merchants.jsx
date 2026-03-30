import React, { useState, useMemo } from 'react';
import { useCollection } from '../hooks/useFirestore';
import { Store, Wallet } from 'lucide-react';
import MerchantStats from '../components/MerchantStats';
import { pickDisplayLocation } from '../utils/geoUtils';

export default function Merchants() {
  const { data: shops, loading: loadingShops } = useCollection('coffee_shops');
  const { data: accounts, loading: loadingAccounts } = useCollection('accounts');
  const [selectedShop, setSelectedShop] = useState(null);

  // Map merchant IDs to their ZAR liability balances
  const balances = useMemo(() => {
    const map = {};
    accounts.forEach(acc => {
      if (acc.ownerType === 'MERCHANT' && acc.currency === 'ZAR') {
        map[acc.ownerId] = acc.balance;
      }
    });
    return map;
  }, [accounts]);

  const formatZAR = (cents) => `R ${(cents / 100).toFixed(2)}`;

  return (
    <div className="animate-fade-in">
      <h1>Merchant Database</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Registered coffee shops and their current ledger liabilities. Click on any row to view detailed performance metrics.</p>

      <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
        {(loadingShops || loadingAccounts) ? <p className="text-muted">Loading merchants...</p> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Ledger Balance (Owed)</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((shop) => {
                  const balance = balances[shop.id] || 0;
                  const isSelected = selectedShop?.id === shop.id;
                  const locationText = pickDisplayLocation(shop) || 'No location provided';
                  return (
                    <tr 
                      key={shop.id} 
                      onClick={() => setSelectedShop(shop)}
                      style={{ cursor: 'pointer', background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.2s ease' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                          <div className="stat-icon" style={{ background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)', color: isSelected ? 'var(--accent-primary)' : '#fff', width: 32, height: 32, marginBottom: 0 }}>
                            <Store size={16} />
                          </div>
                          {shop.name || 'Unnamed Shop'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{locationText}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: balance > 0 ? 'var(--accent-secondary)' : '#fff' }}>
                        {formatZAR(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedShop && (
        <MerchantStats shop={selectedShop} onClose={() => setSelectedShop(null)} />
      )}
    </div>
  );
}
