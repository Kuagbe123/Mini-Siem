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
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'events' | 'audit' | 'settings'>('overview');
  
  // Data States
  const [alerts, setAlerts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [integrityState, setIntegrityState] = useState<{ isValid: boolean; tamperedEventIds: string[]; totalChecked: number } | null>(null);

  // Filter States
  const [eventFilterType, setEventFilterType] = useState('');
  const [eventFilterSeverity, setEventFilterSeverity] = useState('');
  const [eventFilterSource, setEventFilterSource] = useState('');

  // Selected details
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [newSourceName, setNewSourceName] = useState('');
  const [alertStatusUpdate, setAlertStatusUpdate] = useState('');
  const [alertNotesUpdate, setAlertNotesUpdate] = useState('');

  // Injection helper state
  const [mockEventType, setMockEventType] = useState('failed_login');
  const [mockSeverity, setMockSeverity] = useState('HIGH');
  const [mockPayloadKey, setMockPayloadKey] = useState('username');
  const [mockPayloadVal, setMockPayloadVal] = useState('attacker');
  const [mockSourceToken, setMockSourceToken] = useState('');

  // Loading/UX States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();

  // 1. Session Check & Initial Fetch
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

  const fetchAllData = async (currentUser: User) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAlerts(),
        fetchEvents(),
        fetchSources(),
        fetchIntegrity(),
        ...(currentUser.role === 'ADMINISTRATOR' || currentUser.role === 'AUDITOR' ? [fetchAuditLogs()] : []),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    const res = await fetch('/api/alerts');
    if (res.ok) {
      const data = await res.json();
      setAlerts(data.alerts);
    }
  };

  const fetchEvents = async (type = '', severity = '', source = '') => {
    let url = '/api/events?';
    if (type) url += `eventType=${type}&`;
    if (severity) url += `severity=${severity}&`;
    if (source) url += `sourceId=${source}&`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events);
    }
  };

  const fetchSources = async () => {
    const res = await fetch('/api/sources');
    if (res.ok) {
      const data = await res.json();
      setSources(data.sources);
      if (data.sources.length > 0 && !mockSourceToken) {
        setMockSourceToken(data.sources[0].token);
      }
    }
  };

  const fetchAuditLogs = async () => {
    const res = await fetch('/api/audit');
    if (res.ok) {
      const data = await res.json();
      setAuditLogs(data.auditLogs);
    }
  };

  const fetchIntegrity = async () => {
    const res = await fetch('/api/integrity');
    if (res.ok) {
      const data = await res.json();
      setIntegrityState(data);
    }
  };

  // Actions
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleRegisterSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSourceName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to register source.');
      } else {
        setSuccessMsg(`Source "${newSourceName}" registered successfully!`);
        setNewSourceName('');
        fetchSources();
        if (user) fetchAllData(user);
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/alerts/${selectedAlert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: alertStatusUpdate, notes: alertNotesUpdate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update alert.');
      } else {
        setSuccessMsg('Alert updated successfully.');
        setSelectedAlert(null);
        fetchAlerts();
        if (user) fetchAllData(user);
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInjectMockEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockSourceToken) {
      setErrorMsg('Please register and select an event source first.');
      return;
    }
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

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
        setErrorMsg(data.error || 'Mock event injection failed.');
      } else {
        setSuccessMsg(`Event Ingested! ID: ${data.eventId}. Chain Secured.`);
        if (user) fetchAllData(user);
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyEventFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents(eventFilterType, eventFilterSeverity, eventFilterSource);
  };

  const handleResetEventFilters = () => {
    setEventFilterType('');
    setEventFilterSeverity('');
    setEventFilterSource('');
    fetchEvents();
  };

  if (loading || !user) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '20px', color: '#a1a1aa' }}>Loading dashboard session...</p>
      </div>
    );
  }

  // Dashboard calculations
  const openAlerts = alerts.filter(a => a.status === 'NEW' || a.status === 'INVESTIGATING');
  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');

  return (
    <div style={styles.container}>
      {/* Upper Navigation Header */}
      <header className="glass-panel" style={styles.header}>
        <div style={styles.brand}>
          <span style={styles.logo}>🛡️</span>
          <div>
            <h1 style={styles.brandTitle}>Mini-SIEM Admin</h1>
            <span style={styles.brandSubtitle}>Cybersecurity Monitoring System</span>
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <div style={styles.userInfo}>
            <span style={styles.username}>{user.username}</span>
            <span className="pill pill-info" style={{ fontSize: '0.65rem' }}>{user.role}</span>
          </div>
          <button className="glass-button-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <div style={styles.mainGrid}>
        {/* Left Navigation Sidebar */}
        <aside className="glass-panel" style={styles.sidebar}>
          <button 
            style={{ ...styles.sidebarBtn, ...(activeTab === 'overview' ? styles.sidebarBtnActive : {}) }}
            onClick={() => { setActiveTab('overview'); fetchAllData(user); }}
          >
            📊 Security Overview
          </button>
          <button 
            style={{ ...styles.sidebarBtn, ...(activeTab === 'alerts' ? styles.sidebarBtnActive : {}) }}
            onClick={() => { setActiveTab('alerts'); fetchAlerts(); }}
          >
            🚨 Alert Center ({openAlerts.length})
          </button>
          <button 
            style={{ ...styles.sidebarBtn, ...(activeTab === 'events' ? styles.sidebarBtnActive : {}) }}
            onClick={() => { setActiveTab('events'); fetchEvents(); }}
          >
            🔎 Event Explorer
          </button>
          
          {(user.role === 'ADMINISTRATOR' || user.role === 'AUDITOR') && (
            <button 
              style={{ ...styles.sidebarBtn, ...(activeTab === 'audit' ? styles.sidebarBtnActive : {}) }}
              onClick={() => { setActiveTab('audit'); fetchAuditLogs(); }}
            >
              📜 Audit Logging
            </button>
          )}

          <button 
            style={{ ...styles.sidebarBtn, ...(activeTab === 'settings' ? styles.sidebarBtnActive : {}) }}
            onClick={() => { setActiveTab('settings'); fetchSources(); }}
          >
            ⚙️ System Settings
          </button>
        </aside>

        {/* Right Content Area */}
        <main style={styles.content}>
          {/* Notification Messages */}
          {successMsg && <div style={styles.successAlert} onClick={() => setSuccessMsg('')}>✓ {successMsg}</div>}
          {errorMsg && <div style={styles.errorAlert} onClick={() => setErrorMsg('')}>✗ {errorMsg}</div>}

          {/* Overview Dashboard Tab */}
          {activeTab === 'overview' && (
            <div style={styles.tabContent}>
              <div style={styles.statsRow}>
                <div className="glass-panel" style={styles.statsCard}>
                  <span style={styles.statsCardLabel}>TOTAL EVENTS INGESTED</span>
                  <h2 style={styles.statsCardVal}>{events.length}</h2>
                  <span style={styles.statsCardDesc}>Append-Only log verified</span>
                </div>
                <div className="glass-panel" style={styles.statsCard}>
                  <span style={styles.statsCardLabel}>OPEN ALERTS</span>
                  <h2 style={{ ...styles.statsCardVal, color: openAlerts.length > 0 ? '#f97316' : '#22c55e' }}>
                    {openAlerts.length}
                  </h2>
                  <span style={styles.statsCardDesc}>{criticalAlerts.length} Critical unresolved</span>
                </div>
                <div className="glass-panel" style={styles.statsCard}>
                  <span style={styles.statsCardLabel}>LOG CHAIN INTEGRITY</span>
                  <h2 style={{ ...styles.statsCardVal, color: integrityState?.isValid ? '#22c55e' : '#ef4444' }}>
                    {integrityState?.isValid ? 'SECURED' : 'COMPROMISED'}
                  </h2>
                  <span style={styles.statsCardDesc}>
                    {integrityState?.totalChecked} events checked via SHA-256
                  </span>
                </div>
              </div>

              {/* Ingestion Mocking Helper (Highly requested for verification) */}
              <div className="glass-panel" style={styles.panelCard}>
                <h3 style={styles.panelTitle}>🧪 Rapid Verification: Inject Mock Security Event</h3>
                <p style={styles.panelSubtitle}>Simulate security occurrences dynamically to test schema validation, hash chaining, and detection rules in real-time.</p>
                <form onSubmit={handleInjectMockEvent} style={styles.inlineForm}>
                  <div style={styles.formGroupInline}>
                    <label style={styles.formLabel}>Source Token</label>
                    <select 
                      value={mockSourceToken} 
                      onChange={(e) => setMockSourceToken(e.target.value)} 
                      className="glass-input" 
                      style={{ fontSize: '0.8rem', padding: '6px 10px', minWidth: '150px' }}
                    >
                      {sources.map(s => (
                        <option key={s.id} value={s.token}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroupInline}>
                    <label style={styles.formLabel}>Event Type</label>
                    <select 
                      value={mockEventType} 
                      onChange={(e) => setMockEventType(e.target.value)} 
                      className="glass-input"
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    >
                      <option value="failed_login">Failed Login (failed_login)</option>
                      <option value="privilege_change">Privilege Change (privilege_change)</option>
                      <option value="log_clearance">Clear Log File (log_clearance)</option>
                      <option value="port_scan">Network Port Scan (port_scan)</option>
                    </select>
                  </div>
                  <div style={styles.formGroupInline}>
                    <label style={styles.formLabel}>Severity</label>
                    <select 
                      value={mockSeverity} 
                      onChange={(e) => setMockSeverity(e.target.value)} 
                      className="glass-input"
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                  <div style={styles.formGroupInline}>
                    <label style={styles.formLabel}>Payload detail</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <input 
                        type="text" 
                        placeholder="key" 
                        value={mockPayloadKey} 
                        onChange={(e) => setMockPayloadKey(e.target.value)} 
                        className="glass-input"
                        style={{ fontSize: '0.8rem', padding: '6px 8px', width: '80px' }}
                      />
                      <input 
                        type="text" 
                        placeholder="val" 
                        value={mockPayloadVal} 
                        onChange={(e) => setMockPayloadVal(e.target.value)} 
                        className="glass-input"
                        style={{ fontSize: '0.8rem', padding: '6px 8px', width: '90px' }}
                      />
                    </div>
                  </div>
                  <button type="submit" className="glass-button" style={{ padding: '8px 16px', alignSelf: 'flex-end', fontSize: '0.8rem' }} disabled={actionLoading}>
                    {actionLoading ? 'Ingesting...' : 'Inject Event'}
                  </button>
                </form>
              </div>

              {/* Critical Alerts Dashboard View */}
              <div style={styles.dashboardSplit}>
                <div className="glass-panel" style={{ ...styles.panelCard, flex: 1.5 }}>
                  <h3 style={styles.panelTitle}>⚠️ Recent High Severity Alerts</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Severity</th>
                          <th>Rule Name</th>
                          <th>Event Source</th>
                          <th>Timestamp</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={styles.emptyRow}>No alerts triggered. System healthy.</td>
                          </tr>
                        ) : (
                          alerts.slice(0, 5).map((a) => (
                            <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedAlert(a); setActiveTab('alerts'); }}>
                              <td>
                                <span className={`pill pill-${a.severity.toLowerCase()}`}>{a.severity}</span>
                              </td>
                              <td style={styles.boldText}>{a.ruleName}</td>
                              <td>{a.event?.source?.name || 'Unknown'}</td>
                              <td>{new Date(a.createdAt).toLocaleString()}</td>
                              <td>
                                <span style={styles.statusText}>{a.status}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alert Center Tab */}
          {activeTab === 'alerts' && (
            <div style={styles.tabContent}>
              <div style={styles.detailSplit}>
                {/* Alerts List */}
                <div className="glass-panel" style={{ ...styles.panelCard, flex: 2 }}>
                  <h3 style={styles.panelTitle}>🚨 Alert Center</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Severity</th>
                          <th>Rule</th>
                          <th>Source</th>
                          <th>Status</th>
                          <th>Triggered</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={styles.emptyRow}>No alerts recorded.</td>
                          </tr>
                        ) : (
                          alerts.map((a) => (
                            <tr 
                              key={a.id} 
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: selectedAlert?.id === a.id ? 'var(--bg-hover)' : 'transparent' 
                              }} 
                              onClick={() => {
                                setSelectedAlert(a);
                                setAlertStatusUpdate(a.status);
                                setAlertNotesUpdate(a.notes || '');
                              }}
                            >
                              <td>
                                <span className={`pill pill-${a.severity.toLowerCase()}`}>{a.severity}</span>
                              </td>
                              <td style={styles.boldText}>{a.ruleName}</td>
                              <td>{a.event?.source?.name || 'Unknown'}</td>
                              <td>
                                <span style={styles.statusText}>{a.status}</span>
                              </td>
                              <td>{new Date(a.createdAt).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Selected Alert Details & Triage Panel */}
                <div className="glass-panel" style={{ ...styles.panelCard, flex: 1.2 }}>
                  <h3 style={styles.panelTitle}>🔍 Triage & Investigation</h3>
                  {selectedAlert ? (
                    <div style={styles.detailsContent}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Alert ID:</span>
                        <code style={styles.codeText}>{selectedAlert.id}</code>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Rule Triggered:</span>
                        <span>{selectedAlert.ruleName}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Severity:</span>
                        <span className={`pill pill-${selectedAlert.severity.toLowerCase()}`}>{selectedAlert.severity}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Timestamp:</span>
                        <span>{new Date(selectedAlert.createdAt).toLocaleString()}</span>
                      </div>

                      <div style={styles.detailsDivider}></div>

                      <h4 style={styles.subPanelTitle}>Triggering Event Payload</h4>
                      <pre style={styles.payloadBox}>
                        {JSON.stringify(selectedAlert.event?.payload || {}, null, 2)}
                      </pre>

                      <div style={styles.detailsDivider}></div>

                      {/* Triage Form (RBAC restricted: Auditors cannot edit) */}
                      <form onSubmit={handleUpdateAlert} style={styles.formVertical}>
                        <div style={styles.formGroup}>
                          <label style={styles.formLabel}>Resolution Status</label>
                          <select
                            value={alertStatusUpdate}
                            onChange={(e) => setAlertStatusUpdate(e.target.value)}
                            className="glass-input"
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
                          <label style={styles.formLabel}>Analyst Notes / Resolution Strategy</label>
                          <textarea
                            value={alertNotesUpdate}
                            onChange={(e) => setAlertNotesUpdate(e.target.value)}
                            className="glass-input"
                            style={{ width: '100%', height: '80px', resize: 'none' }}
                            placeholder="Add forensic annotations or resolution details..."
                            disabled={user.role === 'AUDITOR' || actionLoading}
                          />
                        </div>

                        {user.role !== 'AUDITOR' && (
                          <button type="submit" className="glass-button" style={{ width: '100%' }} disabled={actionLoading}>
                            {actionLoading ? 'Updating Alert...' : 'Save Resolution'}
                          </button>
                        )}
                      </form>
                    </div>
                  ) : (
                    <div style={styles.emptyDetail}>Select an alert from the table to investigate.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Event Explorer Tab */}
          {activeTab === 'events' && (
            <div style={styles.tabContent}>
              {/* Filter controls */}
              <div className="glass-panel" style={styles.filterCard}>
                <form onSubmit={handleApplyEventFilters} style={styles.filterForm}>
                  <div style={styles.formGroupInline}>
                    <label style={styles.formLabel}>Event Type</label>
                    <input 
                      type="text" 
                      placeholder="e.g. failed_login"
                      value={eventFilterType} 
                      onChange={(e) => setEventFilterType(e.target.value)} 
                      className="glass-input" 
                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    />
                  </div>
                  <div style={styles.formGroupInline}>
                    <label style={styles.formLabel}>Severity</label>
                    <select
                      value={eventFilterSeverity}
                      onChange={(e) => setEventFilterSeverity(e.target.value)}
                      className="glass-input"
                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    >
                      <option value="">All</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>
                  <div style={styles.formGroupInline}>
                    <label style={styles.formLabel}>Source</label>
                    <select
                      value={eventFilterSource}
                      onChange={(e) => setEventFilterSource(e.target.value)}
                      className="glass-input"
                      style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                    >
                      <option value="">All</option>
                      {sources.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                    <button type="submit" className="glass-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      Apply Filters
                    </button>
                    <button type="button" className="glass-button-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={handleResetEventFilters}>
                      Reset
                    </button>
                  </div>
                </form>
              </div>

              <div style={styles.detailSplit}>
                {/* Events list */}
                <div className="glass-panel" style={{ ...styles.panelCard, flex: 2 }}>
                  <h3 style={styles.panelTitle}>🔎 Event Logs</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Severity</th>
                          <th>Type</th>
                          <th>Source</th>
                          <th>Event Date</th>
                          <th>Received Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={styles.emptyRow}>No events match filters.</td>
                          </tr>
                        ) : (
                          events.map((e) => (
                            <tr 
                              key={e.id} 
                              style={{ 
                                cursor: 'pointer',
                                backgroundColor: selectedEvent?.id === e.id ? 'var(--bg-hover)' : 'transparent' 
                              }} 
                              onClick={() => setSelectedEvent(e)}
                            >
                              <td>
                                <span className={`pill pill-${e.severity.toLowerCase()}`}>{e.severity}</span>
                              </td>
                              <td style={styles.boldText}>{e.eventType}</td>
                              <td>{e.source?.name || 'Unknown'}</td>
                              <td>{new Date(e.timestamp).toLocaleString()}</td>
                              <td>{new Date(e.receivedAt).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Event Inspection & Hash Integrity Chain */}
                <div className="glass-panel" style={{ ...styles.panelCard, flex: 1.2 }}>
                  <h3 style={styles.panelTitle}>🔬 Event Integrity Inspection</h3>
                  {selectedEvent ? (
                    <div style={styles.detailsContent}>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Event ID:</span>
                        <code style={styles.codeText}>{selectedEvent.id}</code>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Event Type:</span>
                        <span>{selectedEvent.eventType}</span>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Severity:</span>
                        <span className={`pill pill-${selectedEvent.severity.toLowerCase()}`}>{selectedEvent.severity}</span>
                      </div>

                      <div style={styles.detailsDivider}></div>

                      <h4 style={styles.subPanelTitle}>Log Hash Chain Properties (FR-2.4)</h4>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Current SHA-256:</span>
                        <code style={styles.hashText}>{selectedEvent.payload._hash || 'N/A'}</code>
                      </div>
                      <div style={styles.detailRow}>
                        <span style={styles.detailLabel}>Previous SHA-256:</span>
                        <code style={styles.hashText}>{selectedEvent.payload._prevHash || 'N/A'}</code>
                      </div>

                      <div style={styles.detailsDivider}></div>

                      <h4 style={styles.subPanelTitle}>Event Payload Details</h4>
                      <pre style={styles.payloadBox}>
                        {(() => {
                          const { _hash, _prevHash, ...cleanPayload } = selectedEvent.payload;
                          return JSON.stringify(cleanPayload, null, 2);
                        })()}
                      </pre>
                    </div>
                  ) : (
                    <div style={styles.emptyDetail}>Select an event to inspect its cryptographic seals and properties.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Tab */}
          {activeTab === 'audit' && (user.role === 'ADMINISTRATOR' || user.role === 'AUDITOR') && (
            <div className="glass-panel" style={styles.panelCard}>
              <h3 style={styles.panelTitle}>📜 Immutable System Audit Trails (FR-7.1)</h3>
              <p style={styles.panelSubtitle}>Append-only listing of all security activities occurring within the Mini-SIEM system. Modification or clearance is prohibited.</p>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Acting Identity</th>
                      <th>Role</th>
                      <th>Action Performed</th>
                      <th>Audit Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={styles.emptyRow}>No system activities logged.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td style={styles.boldText}>{log.user ? log.user.username : 'SYSTEM'}</td>
                          <td>
                            {log.user ? (
                              <span className="pill pill-info" style={{ fontSize: '0.65rem' }}>{log.user.role}</span>
                            ) : (
                              <span className="pill pill-low" style={{ fontSize: '0.65rem' }}>AUTOMATED</span>
                            )}
                          </td>
                          <td>
                            <code style={styles.codeText}>{log.action}</code>
                          </td>
                          <td style={{ color: '#d4d4d8', fontSize: '0.85rem' }}>{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={styles.tabContent}>
              <div style={styles.detailSplit}>
                {/* Event Source List */}
                <div className="glass-panel" style={{ ...styles.panelCard, flex: 2 }}>
                  <h3 style={styles.panelTitle}>🔌 Registered Event Sources (FR-1.5)</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th>Source Name</th>
                          <th>Authentication Ingestion Token (Keep Secure)</th>
                          <th>Registered Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={styles.emptyRow}>No sources registered.</td>
                          </tr>
                        ) : (
                          sources.map((s) => (
                            <tr key={s.id}>
                              <td style={styles.boldText}>{s.name}</td>
                              <td>
                                <code style={styles.codeText}>{s.token}</code>
                              </td>
                              <td>{new Date(s.createdAt).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Event Source Registration (Requires Admin role: FR-6.3) */}
                <div className="glass-panel" style={{ ...styles.panelCard, flex: 1.2 }}>
                  <h3 style={styles.panelTitle}>➕ Register Event Source</h3>
                  <p style={styles.panelSubtitle}>Add an external agent, network device, or microservice to inject structured logs into the SIEM.</p>
                  
                  {user.role === 'ADMINISTRATOR' ? (
                    <form onSubmit={handleRegisterSource} style={styles.formVertical}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Source Identifier / Name</label>
                        <input
                          type="text"
                          value={newSourceName}
                          onChange={(e) => setNewSourceName(e.target.value)}
                          placeholder="e.g. AWS-Ingest, Localhost-Win"
                          className="glass-input"
                          style={{ width: '100%' }}
                          disabled={actionLoading}
                          required
                        />
                      </div>
                      <button type="submit" className="glass-button" style={{ width: '100%' }} disabled={actionLoading}>
                        {actionLoading ? 'Registering...' : 'Register & Generate Token'}
                      </button>
                    </form>
                  ) : (
                    <div style={styles.emptyDetail}>Only Administrators are authorized to register event sources.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    overflowX: 'hidden',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#07080a',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.05)',
    borderTop: '3px solid var(--primary)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    fontSize: '2rem',
    filter: 'drop-shadow(0 0 8px rgba(79,70,229,0.3))',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '0.75rem',
    color: '#71717a',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  username: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  mainGrid: {
    display: 'flex',
    gap: '20px',
    flex: 1,
    alignItems: 'stretch',
  },
  sidebar: {
    width: '240px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '20px 12px',
    flexShrink: 0,
  },
  sidebarBtn: {
    textAlign: 'left',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#a1a1aa',
    fontSize: '0.85rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  sidebarBtnActive: {
    background: 'var(--bg-hover)',
    color: '#ffffff',
    borderLeft: '3px solid var(--primary)',
    paddingLeft: '13px',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  successAlert: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    borderRadius: '6px',
    padding: '12px 18px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '6px',
    padding: '12px 18px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  statsCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statsCardLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#71717a',
    letterSpacing: '0.08em',
  },
  statsCardVal: {
    fontSize: '2.25rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  statsCardDesc: {
    fontSize: '0.75rem',
    color: '#a1a1aa',
  },
  panelCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  panelTitle: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#ffffff',
  },
  panelSubtitle: {
    fontSize: '0.8rem',
    color: '#71717a',
    marginTop: '-8px',
  },
  inlineForm: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '8px',
  },
  formGroupInline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '0.75rem',
    color: '#a1a1aa',
    fontWeight: '500',
  },
  dashboardSplit: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    marginTop: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  emptyRow: {
    textAlign: 'center',
    color: '#71717a',
    padding: '30px',
    fontSize: '0.9rem',
  },
  boldText: {
    fontWeight: '600',
    color: '#ffffff',
    fontSize: '0.85rem',
  },
  statusText: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#a1a1aa',
  },
  detailSplit: {
    display: 'flex',
    gap: '20px',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  emptyDetail: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    color: '#71717a',
    fontSize: '0.85rem',
    textAlign: 'center',
    padding: '40px',
    border: '1px dashed var(--border-color)',
    borderRadius: '8px',
  },
  detailsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    fontSize: '0.85rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
  },
  detailLabel: {
    color: '#a1a1aa',
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '3px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#06b6d4',
  },
  hashText: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: '3px 6px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    wordBreak: 'break-all',
    color: '#eab308',
    maxWidth: '200px',
  },
  detailsDivider: {
    height: '1px',
    backgroundColor: 'var(--border-color)',
    margin: '8px 0',
  },
  subPanelTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  payloadBox: {
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    backgroundColor: '#050608',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    overflowX: 'auto',
    maxHeight: '160px',
    color: '#a1a1aa',
  },
  formVertical: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginTop: '6px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterCard: {
    padding: '16px 20px',
  },
  filterForm: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
};
