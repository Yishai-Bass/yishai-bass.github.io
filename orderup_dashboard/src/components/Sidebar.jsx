import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Clock, Users, Coffee, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Sidebar() {
  const { logout } = useAuth();
  const navItems = [
    { name: 'Overview', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Merchants', path: '/merchants', icon: <Users size={20} /> },
    { name: 'Settlements', path: '/settlements', icon: <Clock size={20} /> },
  ];

  return (
    <nav className="sidebar glass-panel">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Coffee size={24} color="#ffffff" />
        </div>
        <span>OrderUp!</span>
      </div>

      <div className="nav-links">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>

      <div style={{ marginTop: 'auto', padding: '1rem' }}>
        <button 
          onClick={logout}
          className="nav-item"
          style={{ 
            width: '100%', 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-secondary)',
            justifyContent: 'flex-start',
            cursor: 'pointer'
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
