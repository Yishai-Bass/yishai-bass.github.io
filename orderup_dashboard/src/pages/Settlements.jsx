import React from 'react';
import { useCollection } from '../hooks/useFirestore';
import { orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { CheckCircle2, Clock } from 'lucide-react';

export default function Settlements() {
  const { data: settlements, loading } = useCollection('settlements', [
    orderBy('createdAt', 'desc'),
    limit(50)
  ]);

  const formatZAR = (amountRands) => `R ${amountRands?.toFixed(2)}`;

  return (
    <div className="animate-fade-in">
      <h1>Settlement History</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>Weekly automated payouts to merchants based on cleared ledger balances.</p>

      <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '75vh', overflowY: 'auto' }}>
        {loading ? <p className="text-muted">Loading settlements...</p> : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Batch / Date</th>
                  <th>Merchant Name</th>
                  <th style={{ textAlign: 'right' }}>Total Balance</th>
                  <th style={{ textAlign: 'right' }}>Held Back (48h)</th>
                  <th style={{ textAlign: 'right' }}>Settled Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {s.createdAt ? format(s.createdAt.toDate(), 'MMM d, yyyy') : 'Pending'}
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Batch: {s.batchId}</div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.shopName || s.shopId}</td>
                    <td style={{ textAlign: 'right', opacity: 0.8 }}>{formatZAR(s.totalBalance / 100)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent-danger)' }}>{formatZAR(s.heldBackRands)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                      {formatZAR(s.amountRands)}
                    </td>
                    <td>
                      {s.status === 'PAID' ? (
                        <span className="status-paid" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Paid
                        </span>
                      ) : (
                        <span className="status-processing" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> Processing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                      No settlement batches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
