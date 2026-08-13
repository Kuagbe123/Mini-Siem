'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if session already active on mount
  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => {
        if (res.ok) {
          router.push('/');
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to authenticate.');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background decoration elements for glowing visuals */}
      <div style={styles.glow1}></div>
      <div style={styles.glow2}></div>

      <div className="glass-panel" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoIcon}>🛡️</div>
          <h1 style={styles.title}>Mini-SIEM Portal</h1>
          <p style={styles.subtitle}>Security Information & Event Management</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="glass-input"
              placeholder="Enter your username"
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input"
              placeholder="Enter your password"
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="glass-button"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Conforming to ISO/IEC 27001 & NIST Guidelines</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  glow1: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79, 70, 229, 0.25) 0%, rgba(79, 70, 229, 0) 70%)',
    top: '15%',
    left: '20%',
    zIndex: 1,
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0) 70%)',
    bottom: '15%',
    right: '20%',
    zIndex: 1,
    pointerEvents: 'none',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 30px',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '2.5rem',
    marginBottom: '8px',
    filter: 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.4))',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#a1a1aa',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    width: '100%',
    fontSize: '0.9rem',
  },
  button: {
    width: '100%',
    marginTop: '10px',
    padding: '12px',
    fontSize: '0.95rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '6px',
    color: '#ef4444',
    padding: '12px',
    fontSize: '0.85rem',
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    marginTop: '10px',
  },
  footerText: {
    fontSize: '0.7rem',
    color: '#71717a',
    letterSpacing: '0.02em',
  },
};
