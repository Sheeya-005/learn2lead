import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, User, Phone, MapPin, Eye, Lock, LogOut, History, Shield, CheckCircle, XCircle, Compass, Volume2 } from 'lucide-react';
import DistrictMap from '../../components/DistrictMap';
import DistrictGatewayModal from '../../components/DistrictGatewayModal';
import { playSOSTone } from '../../utils/audioAlert';

const UserDashboard = () => {
  const { user, token, logoutUser, updateProfile } = useAuth();
  
  // Tab states: 'dashboard', 'history', 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDistrictId, setSelectedDistrictId] = useState('chennai');
  const [showDistrictGateway, setShowDistrictGateway] = useState(true);
  
  // SOS & Emergency states
  const [activeSOS, setActiveSOS] = useState(null);
  const [sosCountdown, setSosCountdown] = useState(null);
  const [loadingSOS, setLoadingSOS] = useState(false);
  const [sosError, setSosError] = useState('');
  const [history, setHistory] = useState([]);
  
  // Form states (Change Password)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState(user.fullName || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileAddress, setProfileAddress] = useState(user.address || '');
  const [profileEmergencyContact, setProfileEmergencyContact] = useState(user.emergencyContact || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Synchronize profile states with authenticated user context
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
      setProfileEmergencyContact(user.emergencyContact || '');
    }
  }, [user]);

  const countdownIntervalRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Fetch active SOS status
  const fetchActiveSOS = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/user/active-sos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.activeAlert) {
        setActiveSOS(data.activeAlert);
        // Start polling if an active alert is running
        startPolling();
      } else {
        setActiveSOS(null);
        stopPolling();
      }
    } catch (err) {
      console.error('Error fetching active SOS:', err);
    }
  };

  // Fetch Emergency History
  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/user/sos-history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Error fetching SOS history:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchActiveSOS();
      fetchHistory();
    }
    return () => {
      stopPolling();
      clearInterval(countdownIntervalRef.current);
    };
  }, [token]);

  // Start polling active SOS status every 5 seconds
  const startPolling = () => {
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        fetchActiveSOS();
        fetchHistory(); // Refresh logs to check resolved states
      }, 5000);
    }
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Trigger SOS button click - Starts countdown
  const handleSOSClick = () => {
    setSosError('');
    setSosCountdown(3);
    
    countdownIntervalRef.current = setInterval(() => {
      setSosCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          transmitSOS(); // Countdown finished, transmit SOS
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cancel Countdown
  const cancelSOSCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setSosCountdown(null);
      setSosError('SOS trigger aborted.');
      setTimeout(() => setSosError(''), 3000);
    }
  };

  // Transmit SOS details with real coordinates or fallback mock coordinates
  const transmitSOS = () => {
    setLoadingSOS(true);
    playSOSTone(); // Play emergency audio siren tone

    const sendRequest = (lat, lng) => {
      fetch('http://localhost:5001/api/user/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchActiveSOS();
          fetchHistory();
        } else {
          setSosError(data.message || 'Failed to dispatch SOS alarm.');
        }
      })
      .catch(() => setSosError('Network failure dispatching emergency request.'))
      .finally(() => setLoadingSOS(false));
    };

    // Use Geolocation API if available, else fallback to standard coordinates (Chennai City Center mockup)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          sendRequest(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Fallback coordinate mapping
          const mockLat = 13.0827 + (Math.random() - 0.5) * 0.01;
          const mockLng = 80.2707 + (Math.random() - 0.5) * 0.01;
          sendRequest(mockLat, mockLng);
        },
        { timeout: 6000 }
      );
    } else {
      const mockLat = 13.0827 + (Math.random() - 0.5) * 0.01;
      const mockLng = 80.2707 + (Math.random() - 0.5) * 0.01;
      sendRequest(mockLat, mockLng);
    }
  };

  // Handle Profile Details update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileName || !profilePhone || !profileAddress || !profileEmergencyContact) {
      setProfileError('Please fill in all profile fields.');
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileName,
          phone: profilePhone,
          address: profileAddress,
          emergencyContact: profileEmergencyContact
        })
      });
      const data = await res.json();

      if (data.success) {
        setProfileSuccess('Profile details updated successfully!');
        updateProfile({
          fullName: profileName,
          phone: profilePhone,
          address: profileAddress,
          emergencyContact: profileEmergencyContact
        });
      } else {
        setProfileError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError('Failed to connect to backend.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Update
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setPwSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwError(data.message || 'Failed to change password.');
      }
    } catch (err) {
      setPwError('Connection failed.');
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Mandatory District Selection Gateway Modal */}
      {showDistrictGateway && (
        <DistrictGatewayModal 
          role="CITIZEN"
          initialDistrictId={selectedDistrictId}
          onSelectDistrict={(district) => {
            setSelectedDistrictId(district.id);
            setShowDistrictGateway(false);
          }}
        />
      )}

      {/* Navbar Dashboard Header */}
      <header style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={28} color="#059669" className="animate-pulse-sos" />
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a' }}>CITIZEN MONITOR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            className="btn-outline" 
            onClick={() => setShowDistrictGateway(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
          >
            <Compass size={16} color="#059669" /> Select District
          </button>
          <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#0f172a' }}>{user.fullName}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>@{user.username}</div>
          </div>
          <button className="btn-outline" onClick={logoutUser} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Grid Content Workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'clamp(220px, 15vw, 280px) 1fr', minHeight: 'calc(100vh - 73px)' }}>
        
        {/* Sidebar */}
        <aside style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* User Quick Profile info */}
          <div className="glass-panel" style={{ padding: '18px 12px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(15,23,42,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700' }}>
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Citizen Profile</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Phone size={13} /> {user.phone}</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><Shield size={13} color="#ef4444" /> Guardian: {user.emergencyContact}</div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}><MapPin size={13} /> {user.address}</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('dashboard')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'dashboard' ? 'var(--primary)' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Shield size={18} /> SOS Panel
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'history' ? 'var(--primary)' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <History size={18} /> Alert Logs
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'settings' ? 'var(--primary)' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Lock size={18} /> Account Settings
            </button>
          </nav>
          
          <div style={{ marginTop: 'auto', textAlign: 'center', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '11px', color: '#fca5a5' }}>
            Emergency: Dial 100/112 in immediate physical danger
          </div>

        </aside>

        {/* Dashboard Main Workspace */}
        <main style={{ padding: '30px 5%' }}>
          
          {/* TAB 1: SOS & MONITOR PANEL */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-slide-in">
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                
                {/* SOS Button Panel */}
                <div className="glass-panel" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '380px' }}>
                  
                  {sosError && (
                    <div className="alert-box alert-error" style={{ width: '100%', maxWidth: '340px' }}>
                      <ShieldAlert size={16} /> <span>{sosError}</span>
                    </div>
                  )}

                  {!activeSOS && sosCountdown === null && (
                    <>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Press Trigger in Danger</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '280px', marginBottom: '35px' }}>
                        Tapping the button starts a 3s countdown before transmitting coordinates.
                      </p>

                      <button 
                        onClick={handleSOSClick} 
                        className="animate-pulse-sos"
                        style={{ 
                          width: '180px', 
                          height: '180px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                          border: '8px solid rgba(239, 68, 68, 0.2)',
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '800',
                          fontSize: '28px',
                          letterSpacing: '1px',
                          cursor: 'pointer',
                          boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <ShieldAlert size={48} style={{ marginBottom: '5px' }} />
                        SOS
                      </button>
                    </>
                  )}

                  {/* SOS Countdown State */}
                  {sosCountdown !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                      <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#ef4444' }}>TRANSMITTING SOS ALARM...</h3>
                      <div style={{ width: '140px', height: '140px', borderRadius: '50%', border: '4px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '64px', fontWeight: '800', color: '#ef4444' }}>
                        {sosCountdown}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Tapping cancel will abort the alarm dispatch.</p>
                      <button className="btn-outline" onClick={cancelSOSCountdown} style={{ borderColor: '#ef4444', color: '#ef4444', padding: '10px 30px' }}>
                        Abort Cancel
                      </button>
                    </div>
                  )}

                  {/* Sending SOS loader state */}
                  {loadingSOS && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                      <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#ef4444', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite' }}></div>
                      <p style={{ color: '#ef4444', fontWeight: '600' }}>Locating GPS & Dispatching Alerts...</p>
                    </div>
                  )}

                  {/* Active SOS Active Monitoring Screen */}
                  {activeSOS && !loadingSOS && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '24px' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: '700' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 10px #ef4444' }}></span>
                        SOS EMERGENCY TRANSMITTING
                      </div>

                      <div style={{ width: '100%', padding: '20px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', fontSize: '13px' }}>
                        <div><strong>SOS Incident ID:</strong> #{activeSOS.id}</div>
                        <div><strong>Current Location:</strong> Lat: {parseFloat(activeSOS.latitude).toFixed(5)}, Lng: {parseFloat(activeSOS.longitude).toFixed(5)}</div>
                        <div>
                          <strong>Alert Status:</strong>{' '}
                          <span className={`badge badge-${activeSOS.alert_status}`}>
                            {activeSOS.alert_status}
                          </span>
                        </div>
                        <div><strong>Triggered At:</strong> {new Date(activeSOS.created_at).toLocaleTimeString()}</div>
                      </div>

                      <div style={{ width: '100%', textAlign: 'left' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', color: '#a78bfa' }}>ASSIGNED RESPONDER</h4>
                        {activeSOS.police_name ? (
                          <div className="glass-panel" style={{ padding: '16px', background: 'rgba(15,23,42,0.6)', borderLeft: '4px solid #f59e0b', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div><strong>Officer:</strong> {activeSOS.police_name} ({activeSOS.police_rank})</div>
                            <div><strong>Police ID:</strong> {activeSOS.police_id}</div>
                            <div><strong>Station:</strong> {activeSOS.police_station}</div>
                            <div style={{ color: '#f59e0b', fontWeight: '600' }}><strong>Contact:</strong> {activeSOS.police_phone}</div>
                          </div>
                        ) : (
                          <div style={{ padding: '14px', borderRadius: '8px', border: '1px dashed var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)' }}>
                            Emergency coordinates logged. Central Command is assigning the nearest police patrol...
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>

                {/* Safety Status Info Console */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}><Shield size={20} color="#8b5cf6" /> Live Safety Status</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Emergency Alert Link</span>
                        <span style={{ color: activeSOS ? '#ef4444' : '#10b981', fontWeight: '600' }}>{activeSOS ? 'ACTIVE' : 'READY / SECURED'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>GPS Geolocation Tracking</span>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>CONNECTED</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Guardian Notification SMS</span>
                        <span style={{ color: '#10b981', fontWeight: '600' }}>ACTIVE (Primary)</span>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: '30px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Emergency Safety Guidelines</h3>
                    <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <li>Triggering the SOS alert immediately logs your coordinates and notifies guards.</li>
                      <li>Keep the browser dashboard open so responders can receive updated device coordinates.</li>
                      <li>Try to seek a public/safe area while law enforcement responders route to your location.</li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* District Selection & Live GPS Map */}
              <div style={{ marginTop: '10px' }}>
                <DistrictMap 
                  selectedDistrictId={selectedDistrictId}
                  onDistrictChange={(district) => setSelectedDistrictId(district.id)}
                  userLat={activeSOS ? parseFloat(activeSOS.latitude) : null}
                  userLng={activeSOS ? parseFloat(activeSOS.longitude) : null}
                />
              </div>

            </div>
          )}

          {/* TAB 2: EMERGENCY HISTORY */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Emergency Alert Logs</h3>
                <button className="btn-outline" onClick={fetchHistory} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Refresh Logs
                </button>
              </div>

              <div className="custom-table-container">
                {history.length > 0 ? (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Incident ID</th>
                        <th>Coordinates</th>
                        <th>Status</th>
                        <th>Assigned Police</th>
                        <th>Response Time</th>
                        <th>Triggered At</th>
                        <th>Resolved At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((alert) => (
                        <tr key={alert.id}>
                          <td style={{ fontWeight: '700' }}>#{alert.id}</td>
                          <td>{parseFloat(alert.latitude).toFixed(4)}, {parseFloat(alert.longitude).toFixed(4)}</td>
                          <td>
                            <span className={`badge badge-${alert.alert_status}`}>
                              {alert.alert_status}
                            </span>
                          </td>
                          <td>{alert.police_name ? `${alert.police_name} (${alert.police_station})` : 'Unassigned'}</td>
                          <td>{alert.response_time ? `${Math.floor(alert.response_time / 60)}m ${alert.response_time % 60}s` : 'N/A'}</td>
                          <td>{new Date(alert.created_at).toLocaleString()}</td>
                          <td>{alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No safety incidents logged. Profile has no emergency history record.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }} className="animate-slide-in">
              
              {/* Profile Details Update Form */}
              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Update Profile Details</h3>
                
                {profileError && (
                  <div className="alert-box alert-error">
                    <ShieldAlert size={16} /> <span>{profileError}</span>
                  </div>
                )}

                {profileSuccess && (
                  <div className="alert-box alert-success">
                    <CheckCircle size={16} /> <span>{profileSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Number</label>
                    <input 
                      type="tel" 
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Emergency Contact (Guardian)</label>
                    <input 
                      type="tel" 
                      value={profileEmergencyContact}
                      onChange={(e) => setProfileEmergencyContact(e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Residential Address</label>
                    <textarea 
                      value={profileAddress}
                      onChange={(e) => setProfileAddress(e.target.value)}
                      rows="3"
                      style={{ resize: 'none' }}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={profileLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px' }}>
                    {profileLoading ? 'Updating...' : 'Save Profile Details'}
                  </button>
                </form>
              </div>

              {/* Password Change Form */}
              <div className="glass-panel" style={{ padding: '30px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Change Account Password</h3>

                {pwError && (
                  <div className="alert-box alert-error">
                    <ShieldAlert size={16} /> <span>{pwError}</span>
                  </div>
                )}

                {pwSuccess && (
                  <div className="alert-box alert-success">
                    <CheckCircle size={16} /> <span>{pwSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Current Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter current password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>New Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter new password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="Re-enter new password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={pwLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px' }}>
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </main>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default UserDashboard;
