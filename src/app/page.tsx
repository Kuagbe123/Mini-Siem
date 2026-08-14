'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';

interface User {
  id: string;
  username: string;
  role: 'ADMINISTRATOR' | 'ANALYST' | 'AUDITOR';
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  
  // Navigation / Panel states
  const [mainView, setMainView] = useState<'events' | 'audit' | 'sources'>('events');

  // Data States
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [integrityState, setIntegrityState] = useState<{ isValid: boolean; tamperedEventIds: string[]; totalChecked: number } | null>(null);

  // Selected Detail States
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [newSourceName, setNewSourceName] = useState('');
  const [alertStatusUpdate, setAlertStatusUpdate] = useState('');
  const [alertNotesUpdate, setAlertNotesUpdate] = useState('');

  // Event Filters
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterSource, setFilterSource] = useState('');

  // Log Simulation / Injection helper states
  const [mockEventType, setMockEventType] = useState('failed_login');
  const [mockSeverity, setMockSeverity] = useState('HIGH');
  const [mockPayloadKey, setMockPayloadKey] = useState('username');
  const [mockPayloadVal, setMockPayloadVal] = useState('attacker_ip');
  const [mockSourceToken, setMockSourceToken] = useState('');

  // Loader / Message states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.authenticated) {
          setUser(data.user);
          fetchAllData(data.user);
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  const fetchAllData = async (currentUser: User) => {
    try {
      const alertRes = await fetch('/api/alerts');
      if (alertRes.ok) {
        const data = await alertRes.json();
        setAlerts(data.alerts);
      }

      const eventRes = await fetch('/api/events');
      if (eventRes.ok) {
        const data = await eventRes.json();
        setEvents(data.events);
      }

      const sourceRes = await fetch('/api/sources');
      if (sourceRes.ok) {
        const data = await sourceRes.json();
        setSources(data.sources);
        if (data.sources.length > 0 && !mockSourceToken) {
          setMockSourceToken(data.sources[0].token);
        }
      }

      const integrityRes = await fetch('/api/integrity');
      if (integrityRes.ok) {
        const data = await integrityRes.json();
        setIntegrityState(data);
      }

      if (currentUser.role === 'ADMINISTRATOR' || currentUser.role === 'AUDITOR') {
        const auditRes = await fetch('/api/audit');
        if (auditRes.ok) {
          const data = await auditRes.json();
          setAuditLogs(data.auditLogs);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (user) fetchAllData(user);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleRegisterSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSourceName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg(data.error || 'Failed to register source.', 'error');
      } else {
        showMsg(`Source "${newSourceName}" registered successfully!`, 'success');
        setNewSourceName('');
        if (user) fetchAllData(user);
      }
    } catch {
      showMsg('Network error occurred.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/alerts/${selectedAlert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: alertStatusUpdate, notes: alertNotesUpdate }),
      });
      const data = await res.json();
      if (!res.ok) {
        showMsg(data.error || 'Failed to update alert.', 'error');
      } else {
        showMsg('Alert status triaged successfully.', 'success');
        setSelectedAlert(null);
        if (user) fetchAllData(user);
      }
    } catch {
      showMsg('Network error occurred.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInjectMockEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockSourceToken) {
      showMsg('Register an event source first.', 'error');
      return;
    }
    setActionLoading(true);

    try {
      const payload: Record<string, string> = {};
      if (mockPayloadKey.trim()) {
        payload[mockPayloadKey.trim()] = mockPayloadVal.trim();
      }

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockSourceToken}`,
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          eventType: mockEventType,
          severity: mockSeverity,
          payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showMsg(data.error || 'Failed to simulate event.', 'error');
      } else {
        showMsg(`Log Simulated! Event ID: ${data.eventId}. Chain hash created.`, 'success');
        if (user) fetchAllData(user);
      }
    } catch {
      showMsg('Network error occurred.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyFilters = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = '/api/events?';
    if (filterType) url += `eventType=${filterType}&`;
    if (filterSeverity) url += `severity=${filterSeverity}&`;
    if (filterSource) url += `sourceId=${filterSource}&`;
    
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
  };

  const handleResetFilters = () => {
    setFilterType('');
    setFilterSeverity('');
    setFilterSource('');
    if (user) fetchAllData(user);
  };

  const handleCheckIntegrity = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/integrity');
      if (res.ok) {
        const data = await res.json();
        setIntegrityState(data);
        if (data.isValid) {
          showMsg('SHA-256 seal integrity check PASSED successfully!', 'success');
        } else {
          showMsg('INTEGRITY COMPROMISED: Tampered event detected in log chain!', 'error');
        }
      }
    } catch {
      showMsg('Failed to execute integrity checks.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '20px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CONNECTING SEC-OPS SOC PLATFORM...</p>
      </div>
    );
  }

  // Dashboard counters
  const openAlerts = alerts.filter(a => a.status === 'NEW' || a.status === 'INVESTIGATING');

  return (
    <div style={styles.appContainer}>
      {/* 1. HeaderHUD - Command Center Panel */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIndicator}></span>
          <span style={styles.headerTitle}>SEC-OPS // MINI-SIEM CONSOLE</span>
          <span style={styles.headerSub}>v1.0.0-PRO</span>
        </div>

        <div style={styles.hudStats}>
          <div style={styles.hudStatItem}>
            <span style={styles.hudStatLabel}>EPS RATE</span>
            <span style={styles.hudStatVal}>{(events.length / 10).toFixed(1)} /s</span>
          </div>
          <div style={styles.hudStatItem}>
            <span style={styles.hudStatLabel}>LOG INTEGRITY</span>
            <span style={{ ...styles.hudStatVal, color: integrityState?.isValid ? '#22c55e' : '#ef4444' }}>
              {integrityState?.isValid ? 'SEALED (SHA-256)' : 'COMPROMISED'}
            </span>
          </div>
          <div style={styles.hudStatItem}>
            <span style={styles.hudStatLabel}>DATABASE STATE</span>
            <span style={{ ...styles.hudStatVal, color: '#06b6d4' }}>POSTGRES (ACTIVE)</span>
          </div>
          <div style={styles.hudStatItem}>
            <span style={styles.hudStatLabel}>ACTIVE RULES</span>
            <span style={styles.hudStatVal}>4</span>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.userBlock}>
            <span style={styles.userIcon}>👤</span>
            <span style={styles.userText}>{user.username} ({user.role})</span>
          </div>
          <button className="siem-btn-secondary" style={styles.headerBtn} onClick={handleRefresh}>
            🔄 Refresh
          </button>
          <button className="siem-btn-secondary" style={styles.headerBtn} onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </header>

      {/* 2. Interactive Status Notifications */}
      {msg && (
        <div 
          style={{ 
            ...styles.alertBanner, 
            backgroundColor: msg.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderColor: msg.type === 'success' ? '#22c55e' : '#ef4444',
            color: msg.type === 'success' ? '#22c55e' : '#ef4444' 
          }}
        >
          {msg.type === 'success' ? '⚡ ' : '🚨 '} {msg.text}
        </div>
      )}

      {/* 3. Main SIEM Grid - Dense Columns */}
      <div style={styles.dashboardGrid}>
        
        {/* Column 1: Live Alert Feed (30% Width) */}
        <section className="siem-panel" style={{ flex: 1.1, minWidth: '320px' }}>
          <div className="siem-panel-header">
            <span className="siem-panel-title">🚨 Open Triggered Alerts ({openAlerts.length})</span>
          </div>
          <div style={styles.alertsContainer}>
            {alerts.length === 0 ? (
              <div style={styles.emptyMsg}>NO ACTIVE INCIDENTS DETECTED</div>
            ) : (
              alerts.map((a) => {
                const borderColors = {
                  CRITICAL: 'var(--severity-critical)',
                  HIGH: 'var(--severity-high)',
                  MEDIUM: 'var(--severity-medium)',
                  LOW: 'var(--severity-low)',
                  INFO: 'var(--severity-info)'
                };
                const color = borderColors[a.severity as keyof typeof borderColors] || 'var(--border-dim)';

                return (
                  <div 
                    key={a.id} 
                    style={{ 
                      ...styles.alertCard, 
                      borderLeftColor: color,
                      backgroundColor: selectedAlert?.id === a.id ? 'var(--bg-accent)' : 'var(--bg-primary)'
                    }}
                    onClick={() => {
                      setSelectedAlert(a);
                      setSelectedEvent(null);
                      setAlertStatusUpdate(a.status);
                      setAlertNotesUpdate(a.notes || '');
                    }}
                  >
                    <div style={styles.alertCardHeader}>
                      <span className={`badge badge-${a.severity.toLowerCase()}`}>{a.severity}</span>
                      <span className="mono" style={{ color: 'var(--text-dim)' }}>{new Date(a.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div style={styles.alertCardTitle}>{a.ruleName}</div>
                    <div style={styles.alertCardFooter}>
                      <span>Source: <strong style={{ color: 'var(--text-bright)' }}>{a.event?.source?.name || 'API'}</strong></span>
                      <span className="mono" style={{ color: a.status === 'NEW' ? 'var(--severity-critical)' : 'var(--text-muted)' }}>{a.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Column 2: Event Explorer / Stream & Config View (45% Width) */}
        <section className="siem-panel" style={{ flex: 1.6, minWidth: '450px' }}>
          <div className="siem-panel-header" style={{ padding: '0 16px', height: '37px' }}>
            <div style={styles.tabBar}>
              <button 
                style={{ ...styles.tabItem, ...(mainView === 'events' ? styles.tabItemActive : {}) }}
                onClick={() => setMainView('events')}
              >
                🔎 Real-time Event Stream
              </button>
              {(user.role === 'ADMINISTRATOR' || user.role === 'AUDITOR') && (
                <button 
                  style={{ ...styles.tabItem, ...(mainView === 'audit' ? styles.tabItemActive : {}) }}
                  onClick={() => setMainView('audit')}
                >
                  📜 System Audit Log
                </button>
              )}
              <button 
                style={{ ...styles.tabItem, ...(mainView === 'sources' ? styles.tabItemActive : {}) }}
                onClick={() => setMainView('sources')}
              >
                🔌 Ingestion Config
              </button>
            </div>
            {mainView === 'events' && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {events.length} EVENTS LOADED
              </span>
            )}
          </div>

          {/* Tab Content: Real-time Event Stream */}
          {mainView === 'events' && (
            <div style={styles.eventsPane}>
              {/* Dense Filter bar */}
              <div style={styles.filterBar}>
                <form onSubmit={handleApplyFilters} style={styles.filterForm}>
                  <input
                    type="text"
                    placeholder="Filter Event Type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="siem-input"
                    style={{ flex: 1, minWidth: '90px', fontSize: '11px', padding: '4px 8px' }}
                  />
                  <select
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                    className="siem-input"
                    style={{ minWidth: '80px', fontSize: '11px', padding: '4px 8px' }}
                  >
                    <option value="">All Severity</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="siem-input"
                    style={{ minWidth: '90px', fontSize: '11px', padding: '4px 8px' }}
                  >
                    <option value="">All Sources</option>
                    {sources.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="siem-btn" style={{ padding: '4px 10px', fontSize: '11px' }}>Filter</button>
                  <button type="button" className="siem-btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleResetFilters}>Reset</button>
                </form>
              </div>

              {/* Event Table Grid */}
              <div style={styles.eventsTableWrapper}>
                <table style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '130px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '140px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Event Type</th>
                      <th>Source</th>
                      <th>Time Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={styles.emptyRow}>NO EVENT INGESTION LOGGED</td>
                      </tr>
                    ) : (
                      events.map((e) => (
                        <tr 
                          key={e.id} 
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: selectedEvent?.id === e.id ? 'var(--bg-accent)' : 'transparent' 
                          }}
                          onClick={() => {
                            setSelectedEvent(e);
                            setSelectedAlert(null);
                          }}
                        >
                          <td>
                            <span className={`badge badge-${e.severity.toLowerCase()}`}>{e.severity}</span>
                          </td>
                          <td style={styles.boldText}>{e.eventType}</td>
                          <td>{e.source?.name || 'Unknown'}</td>
                          <td className="mono">{new Date(e.receivedAt).toISOString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Log Simulation Console Block (Cyber style) */}
              <div style={styles.simulatorBlock}>
                <div style={styles.simulatorHeader}>🔌 Log Simulation Console (Ingestion Test)</div>
                <form onSubmit={handleInjectMockEvent} style={styles.simulatorForm}>
                  <div style={styles.simInputGroup}>
                    <label style={styles.simLabel}>Source Token</label>
                    <select 
                      value={mockSourceToken} 
                      onChange={(e) => setMockSourceToken(e.target.value)} 
                      className="siem-input" 
                      style={styles.simSelect}
                    >
                      {sources.length === 0 ? (
                        <option value="">No sources registered</option>
                      ) : (
                        sources.map(s => (
                          <option key={s.id} value={s.token}>{s.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div style={styles.simInputGroup}>
                    <label style={styles.simLabel}>Event Type</label>
                    <select 
                      value={mockEventType} 
                      onChange={(e) => setMockEventType(e.target.value)} 
                      className="siem-input"
                      style={styles.simSelect}
                    >
                      <option value="failed_login">failed_login (Failed Auth)</option>
                      <option value="privilege_change">privilege_change (Priv Escalation)</option>
                      <option value="log_clearance">log_clearance (Clear Audits)</option>
                      <option value="port_scan">port_scan (Reconnaissance)</option>
                    </select>
                  </div>

                  <div style={styles.simInputGroup}>
                    <label style={styles.simLabel}>Severity</label>
                    <select 
                      value={mockSeverity} 
                      onChange={(e) => setMockSeverity(e.target.value)} 
                      className="siem-input"
                      style={styles.simSelect}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div style={styles.simInputGroup}>
                    <label style={styles.simLabel}>Details Payload</label>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <input 
                        type="text" 
                        placeholder="key" 
                        value={mockPayloadKey} 
                        onChange={(e) => setMockPayloadKey(e.target.value)} 
                        className="siem-input"
                        style={{ ...styles.simSelect, width: '55px' }}
                      />
                      <input 
                        type="text" 
                        placeholder="value" 
                        value={mockPayloadVal} 
                        onChange={(e) => setMockPayloadVal(e.target.value)} 
                        className="siem-input"
                        style={{ ...styles.simSelect, width: '70px' }}
                      />
                    </div>
                  </div>

                  <button type="submit" className="siem-btn" style={{ padding: '4px 10px', height: '24px', fontSize: '11px', marginTop: '14px' }} disabled={actionLoading}>
                    {actionLoading ? 'Simulating...' : 'Ingest Log'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Tab Content: System Audit Logs */}
          {mainView === 'audit' && (user.role === 'ADMINISTRATOR' || user.role === 'AUDITOR') && (
            <div style={styles.paneContent}>
              <div style={styles.paneDescription}>
                System Audit Log records immutable actions performed within this console (**FR-7.1**).
              </div>
              <div style={styles.eventsTableWrapper}>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Identity</th>
                      <th>Action</th>
                      <th>Forensic Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={styles.emptyRow}>NO SYSTEM AUDITS LOGGED</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="mono">{new Date(log.timestamp).toISOString()}</td>
                          <td style={styles.boldText}>{log.user ? log.user.username : 'SYSTEM'}</td>
                          <td>
                            <span className="mono badge badge-info">{log.action}</span>
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'normal' }}>
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Ingestion / Settings Config */}
          {mainView === 'sources' && (
            <div style={styles.paneContent}>
              <div style={styles.settingsSplit}>
                <div style={{ flex: 1.5 }}>
                  <div style={styles.paneDescription}>
                    Currently registered API clients authorized to ship logs (**FR-1.5**).
                  </div>
                  <div style={styles.eventsTableWrapper}>
                    <table>
                      <thead>
                        <tr>
                          <th>Client Name</th>
                          <th>Secret Authorization Token</th>
                          <th>Registered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={styles.emptyRow}>NO AGENTS REGISTERED</td>
                          </tr>
                        ) : (
                          sources.map((s) => (
                            <tr key={s.id}>
                              <td style={styles.boldText}>{s.name}</td>
                              <td>
                                <code style={styles.codeText}>{s.token}</code>
                              </td>
                              <td className="mono">{new Date(s.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {user.role === 'ADMINISTRATOR' && (
                  <div className="siem-panel" style={{ flex: 1, padding: '14px', backgroundColor: 'var(--bg-accent)', height: 'fit-content' }}>
                    <div style={styles.panelTitle}>Register New Log Source</div>
                    <form onSubmit={handleRegisterSource} style={styles.formVertical}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Identifier / Agent Name</label>
                        <input
                          type="text"
                          value={newSourceName}
                          onChange={(e) => setNewSourceName(e.target.value)}
                          placeholder="e.g. AWS-Gateway, Nginx-Proxy"
                          className="siem-input"
                          style={{ width: '100%' }}
                          disabled={actionLoading}
                          required
                        />
                      </div>
                      <button type="submit" className="siem-btn" style={{ width: '100%' }} disabled={actionLoading}>
                        Generate Token
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Column 3: Forensic Inspector Panel (25% Width) */}
        <section className="siem-panel" style={{ flex: 0.9, minWidth: '280px' }}>
          <div className="siem-panel-header">
            <span className="siem-panel-title">🔬 Forensic Inspector</span>
            <button className="siem-btn-secondary" style={{ padding: '2px 8px', fontSize: '10px' }} onClick={handleCheckIntegrity} disabled={actionLoading}>
              Check Chain
            </button>
          </div>
          <div style={styles.inspectorContent}>
            {selectedAlert ? (
              // Alert Triaging Inspector View
              <div style={styles.inspectorTab}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>OBJECT:</span>
                  <span className="mono text-bright">ALERT_RECORD</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>INCIDENT ID:</span>
                  <code style={styles.codeText}>{selectedAlert.id}</code>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>MATCHED RULE:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{selectedAlert.ruleName}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>SEVERITY:</span>
                  <span className={`badge badge-${selectedAlert.severity.toLowerCase()}`}>{selectedAlert.severity}</span>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.metaLabel}>TRIGGERING EVENT PAYLOAD</div>
                <pre style={styles.preBox}>
                  {JSON.stringify(selectedAlert.event?.payload || {}, null, 2)}
                </pre>

                <div style={styles.divider}></div>

                {/* Triage Form */}
                <form onSubmit={handleUpdateAlert} style={styles.formVertical}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Forensic Resolution Status</label>
                    <select
                      value={alertStatusUpdate}
                      onChange={(e) => setAlertStatusUpdate(e.target.value)}
                      className="siem-input"
                      style={{ width: '100%' }}
                      disabled={user.role === 'AUDITOR' || actionLoading}
                    >
                      <option value="NEW">NEW</option>
                      <option value="INVESTIGATING">UNDER INVESTIGATION</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="FALSE_POSITIVE">FALSE POSITIVE</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Forensic Notes & Timeline</label>
                    <textarea
                      value={alertNotesUpdate}
                      onChange={(e) => setAlertNotesUpdate(e.target.value)}
                      className="siem-input"
                      style={{ width: '100%', height: '70px', resize: 'none', fontSize: '11px' }}
                      placeholder="Add investigation updates..."
                      disabled={user.role === 'AUDITOR' || actionLoading}
                    />
                  </div>

                  {user.role !== 'AUDITOR' && (
                    <button type="submit" className="siem-btn" style={{ width: '100%', padding: '6px' }} disabled={actionLoading}>
                      Commit Resolution
                    </button>
                  )}
                </form>
              </div>
            ) : selectedEvent ? (
              // Event Integrity Inspector View
              <div style={styles.inspectorTab}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>OBJECT:</span>
                  <span className="mono text-bright">RAW_EVENT_LOG</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>EVENT ID:</span>
                  <code style={styles.codeText}>{selectedEvent.id}</code>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>EVENT TYPE:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{selectedEvent.eventType}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>SOURCE ID:</span>
                  <span className="mono" style={{ color: 'var(--text-muted)' }}>{selectedEvent.sourceId}</span>
                </div>

                <div style={styles.divider}></div>

                {/* Cryptographic chain verification seals */}
                <div style={styles.metaLabel}>CRYPTO LOG SEALS (FR-2.4)</div>
                <div style={styles.sealBlock}>
                  <div style={styles.sealRow}>
                    <span style={styles.sealLabel}>CURRENT SHA-256</span>
                    <code style={styles.sealHash}>{selectedEvent.payload._hash || 'GENESIS'}</code>
                  </div>
                  <div style={styles.sealRow}>
                    <span style={styles.sealLabel}>PREVIOUS SHA-256</span>
                    <code style={styles.sealHash}>{selectedEvent.payload._prevHash || 'GENESIS'}</code>
                  </div>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.metaLabel}>STRUCTURED PAYLOAD DETAILS</div>
                <pre style={styles.preBox}>
                  {(() => {
                    const { _hash, _prevHash, ...clean } = selectedEvent.payload;
                    return JSON.stringify(clean, null, 2);
                  })()}
                </pre>
              </div>
            ) : (
              <div style={styles.emptyInspector}>
                <p>SELECT ALERT OR EVENT FROM THE PANELS FOR DEEP INSPECTION</p>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    padding: '8px',
    gap: '8px',
  },
  loadingContainer: {
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '2px solid rgba(255,255,255,0.03)',
    borderTop: '2px solid var(--brand)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-dim)',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 14px',
    height: '42px',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    boxShadow: '0 0 6px #22c55e',
  },
  headerTitle: {
    fontFamily: 'var(--font-mono)',
    fontWeight: '700',
    fontSize: '13px',
    color: '#ffffff',
    letterSpacing: '0.02em',
  },
  headerSub: {
    fontSize: '9px',
    fontFamily: 'var(--font-mono)',
    backgroundColor: 'var(--bg-tertiary)',
    border: '1px solid var(--border-dim)',
    color: 'var(--text-muted)',
    padding: '1px 4px',
    borderRadius: '2px',
  },
  hudStats: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  hudStatItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '1.2',
  },
  hudStatLabel: {
    fontSize: '9px',
    fontWeight: '600',
    color: 'var(--text-dim)',
    letterSpacing: '0.04em',
  },
  hudStatVal: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-bright)',
    fontFamily: 'var(--font-mono)',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  userIcon: {
    fontSize: '12px',
  },
  userText: {
    fontWeight: '500',
  },
  headerBtn: {
    padding: '4px 8px',
    fontSize: '11px',
  },
  alertBanner: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid',
    fontSize: '11px',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
  dashboardGrid: {
    display: 'flex',
    gap: '8px',
    flex: 1,
    overflow: 'hidden',
  },
  alertsContainer: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    overflowY: 'auto',
    flex: 1,
  },
  emptyMsg: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: 'var(--text-dim)',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    letterSpacing: '0.05em',
  },
  alertCard: {
    border: '1px solid var(--border-dim)',
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderRadius: '4px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  alertCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertCardTitle: {
    fontWeight: '600',
    fontSize: '12px',
    color: '#ffffff',
  },
  alertCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '10px',
    color: 'var(--text-muted)',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    height: '100%',
    alignItems: 'flex-end',
  },
  tabItem: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '11px',
    fontWeight: '600',
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'var(--transition-fast)',
  },
  tabItemActive: {
    color: '#ffffff',
    borderBottomColor: 'var(--brand)',
  },
  eventsPane: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  filterBar: {
    padding: '8px',
    borderBottom: '1px solid var(--border-dim)',
    backgroundColor: 'var(--bg-secondary)',
  },
  filterForm: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  formLabel: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  eventsTableWrapper: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'var(--bg-primary)',
  },
  emptyRow: {
    textAlign: 'center',
    color: 'var(--text-dim)',
    padding: '24px',
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
  },
  boldText: {
    fontWeight: '600',
    color: '#ffffff',
  },
  simulatorBlock: {
    borderTop: '1px solid var(--border-dim)',
    backgroundColor: 'var(--bg-tertiary)',
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0,
  },
  simulatorHeader: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.04em',
  },
  simulatorForm: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  simInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  simLabel: {
    fontSize: '9px',
    color: 'var(--text-dim)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  simSelect: {
    fontSize: '11px',
    padding: '3px 6px',
    height: '24px',
  },
  paneContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowY: 'auto',
    padding: '12px',
    gap: '12px',
  },
  paneDescription: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  settingsSplit: {
    display: 'flex',
    gap: '16px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  formVertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  codeText: {
    fontFamily: 'var(--font-mono)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    border: '1px solid var(--border-dim)',
    padding: '1px 4px',
    borderRadius: '2px',
    fontSize: '11px',
    color: '#06b6d4',
  },
  inspectorContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
  },
  emptyInspector: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: 'var(--text-dim)',
    fontSize: '10px',
    fontWeight: '600',
    textAlign: 'center',
    border: '1px dashed var(--border-dim)',
    borderRadius: '4px',
    padding: '20px',
  },
  inspectorTab: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    gap: '6px',
  },
  metaLabel: {
    color: 'var(--text-muted)',
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  divider: {
    height: '1px',
    backgroundColor: 'var(--border-dim)',
    margin: '6px 0',
  },
  preBox: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-dim)',
    borderRadius: '3px',
    padding: '8px',
    maxHeight: '140px',
    overflow: 'auto',
    color: 'var(--text-bright)',
  },
  sealBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-dim)',
    padding: '6px',
    borderRadius: '3px',
  },
  sealRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  sealLabel: {
    fontSize: '8px',
    color: 'var(--text-dim)',
    fontWeight: '700',
  },
  sealHash: {
    fontFamily: 'var(--font-mono)',
    fontSize: '9px',
    color: '#eab308',
    wordBreak: 'break-all',
  },
};
