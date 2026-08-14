'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';

// Custom SVG Icons following Apple Outlined aesthetic
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.inputIconLeftSvg}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.inputIconLeftSvg}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={styles.eyeIcon}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={styles.eyeIcon}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const ShieldLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={styles.logoSvg}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);

function CyberAuditingBackground() {
  return (
    <div style={styles.backgroundWrapper}>
      {/* Mesh Glow 1 */}
      <div style={styles.meshGlowIndigo} />
      {/* Mesh Glow 2 */}
      <div style={styles.meshGlowCyan} />
      {/* Grid overlay */}
      <div style={styles.gridOverlay} />
      
      {/* SVG Audit Rings */}
      <svg
        viewBox="0 0 1000 1000"
        style={styles.svgContainer}
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Crosshair Lines */}
        <line x1="500" y1="100" x2="500" y2="900" stroke="rgba(255, 255, 255, 0.025)" strokeDasharray="4 4" />
        <line x1="100" y1="500" x2="900" y2="500" stroke="rgba(255, 255, 255, 0.025)" strokeDasharray="4 4" />

        {/* Center Glow */}
        <circle cx="500" cy="500" r="300" fill="url(#centerGlow)" />

        {/* Outer Ticks (Clockwise, slow) */}
        <circle
          cx="500"
          cy="500"
          r="420"
          stroke="rgba(99, 102, 241, 0.08)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="2 12"
          className="rotate-cw-slow"
        />

        {/* Outer Audit Ring with long dashes (Counter-Clockwise) */}
        <circle
          cx="500"
          cy="500"
          r="380"
          stroke="rgba(6, 182, 212, 0.12)"
          strokeWidth="1.2"
          fill="none"
          strokeDasharray="180 40 80 40 240 60"
          className="rotate-ccw-medium"
        />

        {/* Dotted Auditing Ring (Clockwise, fast) */}
        <circle
          cx="500"
          cy="500"
          r="330"
          stroke="rgba(0, 229, 255, 0.15)"
          strokeWidth="2"
          fill="none"
          strokeDasharray="2 6"
          className="rotate-cw-fast"
        />

        {/* Segmented Inner Ring (Counter-Clockwise, slow) */}
        <circle
          cx="500"
          cy="500"
          r="260"
          stroke="rgba(99, 102, 241, 0.2)"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="60 30 120 40"
          className="rotate-ccw-slow"
        />

        {/* Very Inner Solid Hairline */}
        <circle
          cx="500"
          cy="500"
          r="200"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
          fill="none"
        />

        {/* Radar Scanning Sweep Sector (Clockwise) */}
        <g className="rotate-cw-radar">
          <path
            d="M500,500 L500,120 A380,380 0 0,1 768.7,231.3 Z"
            fill="url(#radarGrad)"
          />
          {/* Leading edge line */}
          <line
            x1="500"
            y1="500"
            x2="500"
            y2="120"
            stroke="rgba(6, 182, 212, 0.35)"
            strokeWidth="1.5"
          />
          {/* Scan Nodes */}
          <circle cx="500" cy="180" r="3.5" fill="#00e5ff" className="radar-node" />
          <circle cx="680" cy="300" r="2.5" fill="#6366f1" className="radar-node" />
        </g>

        {/* Monospace Tech Labels */}
        <g style={{ opacity: 0.55 }}>
          <text x="515" y="160" className="tech-label" fill="#00e5ff">[SEC_AUDIT: ACTIVE]</text>
          <circle cx="505" cy="156" r="3.5" fill="#00e5ff" className="ping-dot" />

          <text x="140" y="495" className="tech-label" fill="#6366f1">[INTEGRITY: SECURE]</text>
          <circle cx="130" cy="491" r="3.5" fill="#6366f1" className="ping-dot" />

          <text x="515" y="850" className="tech-label" fill="#00e5ff">[DATABASE: OK]</text>
          <circle cx="505" cy="846" r="3.5" fill="#00e5ff" className="ping-dot" />

          <text x="800" y="495" className="tech-label" fill="#6366f1">[SYS_STATUS: RUNNING]</text>
          <circle cx="790" cy="491" r="3.5" fill="#6366f1" className="ping-dot" />
        </g>
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Styles Injections */}
      <style>{`
        .apple-input {
          width: 100%;
          padding: 14px 44px 14px 44px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background-color: rgba(15, 23, 42, 0.45);
          color: #ffffff;
          font-size: 0.9rem;
          font-family: var(--font-sans), system-ui, sans-serif;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
        }
        .apple-input:hover {
          border-color: rgba(255, 255, 255, 0.16);
          background-color: rgba(15, 23, 42, 0.55);
        }
        .apple-input:focus {
          border-color: #00e5ff;
          background-color: rgba(15, 23, 42, 0.75);
          box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.4);
        }
        .apple-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .apple-btn {
          display: flex;
          align-items: center;
          justifyContent: center;
          gap: 10px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(180deg, #00d2ff 0%, #00a8cc 100%);
          color: #ffffff;
          font-weight: 600;
          letter-spacing: 0.05em;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 210, 255, 0.25);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .apple-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.08);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .apple-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(0, 210, 255, 0.35);
        }
        .apple-btn:hover::after {
          opacity: 1;
        }
        .apple-btn:active {
          transform: scale(0.985);
          box-shadow: 0 2px 10px rgba(0, 210, 255, 0.15);
        }
        .apple-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .apple-link {
          font-size: 0.8rem;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .apple-link:hover {
          color: #00e5ff;
          text-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
        }
        .togglePasswordBtn:hover {
          color: #ffffff !important;
        }
        
        @keyframes rotateCw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateCcw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @keyframes scanNodePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        .rotate-cw-slow {
          transform-origin: 500px 500px;
          animation: rotateCw 90s linear infinite;
        }
        .rotate-ccw-medium {
          transform-origin: 500px 500px;
          animation: rotateCcw 50s linear infinite;
        }
        .rotate-cw-fast {
          transform-origin: 500px 500px;
          animation: rotateCw 25s linear infinite;
        }
        .rotate-ccw-slow {
          transform-origin: 500px 500px;
          animation: rotateCcw 120s linear infinite;
        }
        .rotate-cw-radar {
          transform-origin: 500px 500px;
          animation: rotateCw 14s linear infinite;
        }
        .tech-label {
          font-family: var(--font-mono), monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          font-weight: 500;
          text-shadow: 0 0 6px rgba(0, 229, 255, 0.2);
        }
        .ping-dot {
          transform-origin: center;
          animation: pulseGlow 2s ease-in-out infinite;
        }
        .radar-node {
          animation: scanNodePulse 2s ease-in-out infinite;
        }
      `}</style>

      {/* Cyber Auditing Background Graphics */}
      <CyberAuditingBackground />

      <div style={styles.cardContainer}>
        {/* Glassmorphic Card Panel */}
        <div style={styles.glassCard}>
          
          {/* Header section with SIEM Portal Logo */}
          <div style={styles.header}>
            <div style={styles.logoRow}>
              <ShieldLogo />
              <span style={styles.logoTitle}>Mini-SIEM</span>
            </div>
            <div style={styles.logoSubtitle}>Portal</div>
            <p style={styles.tagline}>Security Information and Event Management</p>
          </div>

          {error && <div style={styles.errorText}>{error}</div>}

          {/* Form fields styled like Apple customize layout */}
          <form onSubmit={handleSubmit} style={styles.form}>
            
            {/* Username Field */}
            <div style={styles.inputContainer}>
              <UserIcon />
              <input
                type="text"
                placeholder="Username/Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="apple-input"
                disabled={loading}
                required
              />
            </div>

            {/* Password Field */}
            <div style={styles.inputContainer}>
              <LockIcon />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="apple-input"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePasswordBtn}
                className="togglePasswordBtn"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Glowing Sign In Button */}
            <button
              type="submit"
              className="apple-btn"
              disabled={loading}
            >
              <span style={styles.buttonText}>{loading ? 'CONNECTING...' : 'SIGN IN'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={styles.buttonIcon}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </button>
          </form>

          {/* Links Section */}
          <div style={styles.linksRow}>
            <a href="#" className="apple-link">Forgot Password?</a>
            <a href="#" className="apple-link">Admin Access</a>
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
    backgroundColor: '#030508',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  cardContainer: {
    width: '100%',
    maxWidth: '440px',
    zIndex: 10,
  },
  glassCard: {
    backgroundColor: 'rgba(10, 12, 18, 0.65)',
    backdropFilter: 'blur(35px) saturate(180%)',
    WebkitBackdropFilter: 'blur(35px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '18px',
    padding: '44px 38px',
    boxShadow: '0 30px 70px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    alignItems: 'stretch',
    transition: 'all 0.3s ease',
  },
  header: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  logoSvg: {
    width: '2rem',
    height: '2rem',
    color: '#00e5ff',
    filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.4))',
  },
  logoTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '1.9rem',
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: '-0.02em',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  logoSubtitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.3em',
    marginTop: '-2px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    paddingTop: '3px',
    width: '110px',
  },
  tagline: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: '12px',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  errorText: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#f87171',
    padding: '12px 16px',
    fontSize: '0.8rem',
    textAlign: 'center',
    fontFamily: 'var(--font-mono)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  inputIconLeftSvg: {
    position: 'absolute',
    left: '14px',
    width: '18px',
    height: '18px',
    color: 'rgba(255, 255, 255, 0.45)',
    pointerEvents: 'none',
  },
  togglePasswordBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    color: 'rgba(255, 255, 255, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s ease',
    outline: 'none',
  },
  eyeIcon: {
    width: '18px',
    height: '18px',
  },
  buttonText: {
    fontSize: '0.95rem',
    fontWeight: '700',
    letterSpacing: '0.05em',
  },
  buttonIcon: {
    width: '18px',
    height: '18px',
    filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))',
  },
  linksRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginTop: '4px',
  },
  
  // Cyber Auditing Background Styles
  backgroundWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meshGlowIndigo: {
    width: '800px',
    height: '800px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)',
    filter: 'blur(100px)',
    position: 'absolute',
    top: '-15%',
    left: '-15%',
    pointerEvents: 'none',
  },
  meshGlowCyan: {
    width: '900px',
    height: '900px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, rgba(6, 182, 212, 0) 70%)',
    filter: 'blur(120px)',
    position: 'absolute',
    bottom: '-15%',
    right: '-15%',
    pointerEvents: 'none',
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `
      linear-gradient(rgba(255, 255, 255, 0.01) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.01) 1px, transparent 1px)
    `,
    backgroundSize: '50px 50px',
    pointerEvents: 'none',
  },
  svgContainer: {
    position: 'absolute',
    width: '110vh',
    height: '110vh',
    maxWidth: '1100px',
    maxHeight: '1100px',
    minWidth: '650px',
    minHeight: '650px',
    opacity: 0.8,
    pointerEvents: 'none',
  },
};
