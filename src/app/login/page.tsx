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
      <div style={styles.cardContainer}>
        {/* Glassmorphic Card Panel */}
        <div style={styles.glassCard}>
          
          {/* Header section with SIEM Portal Logo */}
          <div style={styles.header}>
            <div style={styles.logoRow}>
              <span style={styles.logoHex}>⬢</span>
              <span style={styles.logoTitle}>Mini-SIEM</span>
            </div>
            <div style={styles.logoSubtitle}>Portal</div>
            <p style={styles.tagline}>Security Information and Event Management</p>
          </div>

          {error && <div style={styles.errorText}>{error}</div>}

          {/* Form fields styled exactly like the provided screenshot */}
          <form onSubmit={handleSubmit} style={styles.form}>
            
            {/* Username Field */}
            <div style={styles.inputContainer}>
              <span style={styles.inputIconLeft}>👤</span>
              <input
                type="text"
                placeholder="Username/Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.pillInput}
                disabled={loading}
                required
              />
              <span style={styles.inputIconRight}>🔑</span>
            </div>

            {/* Password Field */}
            <div style={styles.inputContainer}>
              <span style={styles.inputIconLeft}>🔒</span>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.pillInput}
                disabled={loading}
                required
              />
              <span style={styles.inputIconRight}>🔒</span>
            </div>

            {/* Glowing Sign In Pill Button */}
            <button
              type="submit"
              style={styles.pillButton}
              disabled={loading}
            >
              <span style={styles.buttonText}>{loading ? 'CONNECTING...' : 'SIGN IN'}</span>
              <span style={styles.buttonIcon}>🛡️</span>
            </button>
          </form>

          {/* Links Section */}
          <div style={styles.linksRow}>
            <a href="#" style={styles.link}>Forgot Password?</a>
            <a href="#" style={styles.link}>Admin Access</a>
          </div>

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
    backgroundImage: 'url("/login-bg-cropped.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '460px',
    zIndex: 10,
  },
  glassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '40px 36px',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.65)',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    alignItems: 'stretch',
    transition: 'all 0.3s ease',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  logoHex: {
    fontSize: '2rem',
    color: '#00e5ff',
    fontWeight: '700',
    filter: 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.6))',
  },
  logoTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1.8rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.02em',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  logoSubtitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1rem',
    fontWeight: '500',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.25em',
    marginTop: '-4px',
    borderTop: '1px solid rgba(255, 255, 255, 0.15)',
    paddingTop: '2px',
    width: '120px',
  },
  tagline: {
    fontSize: '0.85rem',
    color: '#e2e8f0',
    marginTop: '16px',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  errorText: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '8px',
    color: '#f87171',
    padding: '10px 14px',
    fontSize: '0.8rem',
    textAlign: 'center',
    fontFamily: 'var(--font-mono)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  pillInput: {
    width: '100%',
    padding: '12px 42px',
    borderRadius: '9999px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    color: '#ffffff',
    fontSize: '0.85rem',
    outline: 'none',
    transition: 'all 0.2s ease',
  },
  inputIconLeft: {
    position: 'absolute',
    left: '16px',
    fontSize: '0.9rem',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  inputIconRight: {
    position: 'absolute',
    right: '16px',
    fontSize: '0.9rem',
    color: '#94a3b8',
    pointerEvents: 'none',
  },
  pillButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '12px',
    borderRadius: '9999px',
    border: 'none',
    background: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
    color: '#ffffff',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(0, 180, 219, 0.45)',
    transition: 'all 0.2s ease',
  },
  buttonText: {
    fontSize: '0.9rem',
    fontWeight: '700',
    letterSpacing: '0.08em',
  },
  buttonIcon: {
    fontSize: '0.95rem',
    filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))',
  },
  linksRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px',
  },
  link: {
    fontSize: '0.8rem',
    color: '#00e5ff',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.15s ease',
    opacity: 0.85,
  },
};
