import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Coffee, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login({ onLogin }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [correctPassword, setCorrectPassword] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const docRef = doc(db, 'dashboard', 'password');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCorrectPassword(docSnap.data().password);
        }
      } catch (err) {
        console.error('Error fetching password:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPassword();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setVerifying(true);
    setTimeout(() => {
      if (passwordInput === correctPassword) {
        onLogin(passwordInput, correctPassword);
      } else {
        setError('Incorrect password. Access denied.');
        setPasswordInput('');
        setVerifying(false);
      }
    }, 600); // Subtle delay for premium feel
  };

  return (
    <div className="login-screen">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-logo" style={{ textAlign: 'center' }}>
          <div className="sidebar-logo-icon" style={{ width: 64, height: 64, margin: '0 auto' }}>
            <Coffee size={32} color="#ffffff" />
          </div>
          <h1 style={{ marginTop: '1.25rem', fontSize: '1.8rem', fontWeight: 800 }}>OrderUp!</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Financial Performance Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '2.5rem' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Lock size={18} />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              className="login-input"
              placeholder="Enter Access Key"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setError('');
              }}
              disabled={loading || verifying}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginTop: '0.75rem', textAlign: 'center', fontWeight: 600 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading || verifying || !passwordInput}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              opacity: (loading || verifying || !passwordInput) ? 0.7 : 1
            }}
          >
            {verifying ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>Unlock Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Internal Access Only
          </p>
        </div>
      </div>

      <div className="login-bg-decorations">
        <div className="decor-blob primary"></div>
        <div className="decor-blob secondary"></div>
      </div>
    </div>
  );
}
