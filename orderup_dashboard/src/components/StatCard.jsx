import React from 'react';

export default function StatCard({ title, value, icon, color = 'primary', subtext, onClick }) {
  return (
    <div 
      className="stat-card glass-panel animate-fade-in" 
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtext && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{subtext}</div>}
      </div>
    </div>
  );
}
