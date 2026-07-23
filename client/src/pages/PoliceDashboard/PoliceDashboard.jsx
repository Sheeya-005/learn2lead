import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Landmark, ShieldAlert, Phone, MapPin, Eye, Lock, LogOut, CheckCircle, Radio, Clock, Compass } from 'lucide-react';
import DistrictMap from '../../components/DistrictMap';
import DistrictGatewayModal from '../../components/DistrictGatewayModal';

const PoliceDashboard = () => {
  const { user, token, logoutUser, updateProfile } = useAuth();
  
  // Tab states: 'alerts', 'settings'
  const [activeTab, setActiveTab] = useState('alerts');
  const [selectedDistrictId, setSelectedDistrictId] = useState('chennai');
  const [showDistrictGateway, setShowDistrictGateway] = useState(true);
  
  // Alert states
  const [assignedAlerts, setAssignedAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [errorAlerts, setErrorAlerts] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Form states (Change Password)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState(user.fullName || '');
  const [profilePoliceId, setProfilePoliceId] = useState(user.policeId || '');
  const [profileRank, setProfileRank] = useState(user.rank || '');
  const [profileStation, setProfileStation] = useState(user.stationName || '');
  const [profilePhone, setProfilePhone] = useState(user.phone || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Synchronize profile states with authenticated user context
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfilePoliceId(user.policeId || '');
      setProfileRank(user.rank || '');
      setProfileStation(user.stationName || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Fetch assigned alerts
  const fetchAssignedAlerts = async () => {
    setLoadingAlerts(true);
    setErrorAlerts('');
    try {
      const res = await fetch('/api/police/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAssignedAlerts(data.alerts);
        // Sync selected alert details if currently viewed
        if (selectedAlert) {
          const updatedSelected = data.alerts.find(a => a.id === selectedAlert.id);
          setSelectedAlert(updatedSelected || null);
        }
      } else {
        setErrorAlerts(data.message || 'Failed to fetch assigned alerts.');
      }
    } catch (err) {
      setErrorAlerts('Network error fetching alert logs.');
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAssignedAlerts();
      // Poll alerts list updates every 7 seconds
      const interval = setInterval(fetchAssignedAlerts, 7000);
      return () => clearInterval(interval);
    }
  }, [token, selectedAlert ? selectedAlert.id : null]);

  // Update response status of alert
  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      const res = await fetch('/api/police/alerts/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ alertId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchAssignedAlerts();
      } else {
        alert(data.message || 'Failed to update alert status');
      }
    } catch (err) {
      alert('Network failure updating response status.');
    }
  };

  // Handle Profile Details update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileName || !profilePoliceId || !profileRank || !profileStation || !profilePhone) {
      setProfileError('Please fill in all profile fields.');
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch('/api/police/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileName,
          policeId: profilePoliceId,
          rank: profileRank,
          stationName: profileStation,
          phone: profilePhone
        })
      });
      const data = await res.json();

      if (data.success) {
        setProfileSuccess('Profile details updated successfully!');
        updateProfile({
          fullName: profileName,
          policeId: profilePoliceId,
          rank: profileRank,
          stationName: profileStation,
          phone: profilePhone
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

  // Change Password
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
      const res = await fetch('/api/auth/change-password', {
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

  const activeAlertsCount = assignedAlerts.filter(a => a.alert_status !== 'resolved').length;
  const resolvedAlertsCount = assignedAlerts.filter(a => a.alert_status === 'resolved').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Mandatory District Selection Gateway Modal */}
      {showDistrictGateway && (
        <DistrictGatewayModal 
          role="POLICE"
          initialDistrictId={selectedDistrictId}
          onSelectDistrict={(district) => {
            setSelectedDistrictId(district.id);
            setShowDistrictGateway(false);
          }}
        />
      )}

      {/* Header */}
      <header style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Landmark size={28} color="#d97706" />
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px', color: '#0f172a' }}>POLICE CENTRAL RESPONSE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            className="btn-outline" 
            onClick={() => setShowDistrictGateway(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
          >
            <Compass size={16} color="#d97706" /> Select District
          </button>
          <button className="btn-outline" onClick={logoutUser} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Grid Body Workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'clamp(240px, 16vw, 300px) 1fr', minHeight: 'calc(100vh - 73px)' }}>
        
        {/* Sidebar */}
        <aside style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Police Officer Profile Details Card */}
          <div className="glass-panel" style={{ padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(15,23,42,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0f19', fontWeight: '800' }}>
                P
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName}</div>
                <div style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: '600' }}>{user.rank}</div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '6px', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div><strong>Badge ID:</strong> {user.policeId}</div>
              <div><strong>Station:</strong> {user.stationName}</div>
              <div><strong>Contact:</strong> {user.phone}</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="glass-panel" style={{ padding: '12px 6px', textAlign: 'center', borderColor: activeAlertsCount > 0 ? '#ef4444' : 'var(--border-color)' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: activeAlertsCount > 0 ? '#ef4444' : '#fff' }}>{activeAlertsCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Active SOS</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{resolvedAlertsCount}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Resolved</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('alerts')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'alerts' ? '#059669' : 'transparent', color: activeTab === 'alerts' ? '#ffffff' : '#334155', padding: '12px 16px', borderRadius: '10px', fontWeight: activeTab === 'alerts' ? '700' : '600', fontSize: '14px', border: 'none', cursor: 'pointer' }}
            >
              <ShieldAlert size={18} /> Assigned Alerts
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'settings' ? '#059669' : 'transparent', color: activeTab === 'settings' ? '#ffffff' : '#334155', padding: '12px 16px', borderRadius: '10px', fontWeight: activeTab === 'settings' ? '700' : '600', fontSize: '14px', border: 'none', cursor: 'pointer' }}
            >
              <Lock size={18} /> Update Password
            </button>
          </nav>

        </aside>

        {/* Workspace Content */}
        <main style={{ padding: '30px 4%' }}>
          
          {/* TAB 1: ASSIGNED ALERTS LIST & DISPATCH MANAGEMENT */}
          {activeTab === 'alerts' && (
            <div style={{ display: 'grid', gridTemplateColumns: selectedAlert ? '1.2fr 1fr' : '1fr', gap: '30px' }} className="animate-slide-in">
              
              {/* Left Side: Alerts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Assigned Emergency Incidents</h3>
                  <button className="btn-outline" onClick={fetchAssignedAlerts} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Sync Incidents
                  </button>
                </div>

                <div className="custom-table-container">
                  {assignedAlerts.length > 0 ? (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>SOS ID</th>
                          <th>Citizen Name</th>
                          <th>Status</th>
                          <th>Triggered At</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedAlerts.map((alert) => (
                          <tr 
                            key={alert.id} 
                            style={{ 
                              cursor: 'pointer',
                              background: selectedAlert && selectedAlert.id === alert.id ? 'rgba(245, 158, 11, 0.05)' : '',
                              borderLeft: selectedAlert && selectedAlert.id === alert.id ? '4px solid var(--warning)' : ''
                            }}
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <td style={{ fontWeight: '700' }}>#{alert.id}</td>
                            <td>{alert.user_name}</td>
                            <td>
                              <span className={`badge badge-${alert.alert_status}`}>
                                {alert.alert_status}
                              </span>
                            </td>
                            <td>{new Date(alert.created_at).toLocaleTimeString()}</td>
                            <td>
                              <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Eye size={12} /> View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No safety incidents are currently assigned to your badge number.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Selected SOS Dispatch Details card */}
              {selectedAlert && (
                <div className="glass-panel animate-slide-in" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', alignSelf: 'start', border: '1px solid rgba(245,158,11,0.2)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>SOS Dispatch #{selectedAlert.id}</h3>
                    <span className={`badge badge-${selectedAlert.alert_status}`}>{selectedAlert.alert_status}</span>
                  </div>

                  {/* Citizen information details block */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Citizen Info</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 12px', fontSize: '13px' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>Full Name:</div>
                      <div style={{ fontWeight: '600' }}>{selectedAlert.user_name}</div>
                      
                      <div style={{ color: 'var(--text-secondary)' }}>Phone:</div>
                      <div style={{ fontWeight: '600', color: 'var(--warning)' }}>{selectedAlert.user_phone}</div>
                      
                      <div style={{ color: 'var(--text-secondary)' }}>Guardian:</div>
                      <div style={{ fontWeight: '600' }}>{selectedAlert.user_emergency_contact}</div>
                      
                      <div style={{ color: 'var(--text-secondary)' }}>Address:</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{selectedAlert.user_address}</div>
                    </div>
                  </div>

                  {/* Coordinates & Location maps metadata */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location Geolocation</h4>
                      
                      {/* Navigate to Person Link Button */}
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedAlert.latitude},${selectedAlert.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary"
                        style={{ background: '#dc2626', color: '#ffffff', fontSize: '12px', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '6px' }}
                      >
                        <Compass size={14} /> Navigate to Reach Person 🗺️
                      </a>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <MapPin size={16} color="#dc2626" />
                      <strong>Target Coordinates:</strong> Lat: {parseFloat(selectedAlert.latitude).toFixed(5)}, Lng: {parseFloat(selectedAlert.longitude).toFixed(5)}
                    </div>

                    {/* Interactive District Map preview */}
                    <div style={{ width: '100%' }}>
                      <DistrictMap 
                        selectedDistrictId={selectedDistrictId}
                        onDistrictChange={(district) => setSelectedDistrictId(district.id)}
                        userLat={selectedAlert ? parseFloat(selectedAlert.latitude) : null}
                        userLng={selectedAlert ? parseFloat(selectedAlert.longitude) : null}
                        height="260px"
                      />
                    </div>
                  </div>

                  {/* Action Dispatcher Response Status update options */}
                  {selectedAlert.alert_status !== 'resolved' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Responder Status Action</h4>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        
                        {/* Acknowledge (if pending) */}
                        {selectedAlert.alert_status === 'pending' && (
                          <button 
                            className="btn-primary" 
                            style={{ flex: 1, background: '#3b82f6', color: '#fff' }}
                            onClick={() => handleUpdateStatus(selectedAlert.id, 'acknowledged')}
                          >
                            Acknowledge Alert
                          </button>
                        )}

                        {/* Mark Responding */}
                        {(selectedAlert.alert_status === 'pending' || selectedAlert.alert_status === 'acknowledged') && (
                          <button 
                            className="btn-primary" 
                            style={{ flex: 1, background: 'var(--warning)', color: '#0b0f19' }}
                            onClick={() => handleUpdateStatus(selectedAlert.id, 'responding')}
                          >
                            Mark Responding
                          </button>
                        )}

                        {/* Mark Resolved */}
                        {selectedAlert.alert_status !== 'resolved' && (
                          <button 
                            className="btn-primary" 
                            style={{ flex: 1, background: '#10b981', color: '#fff' }}
                            onClick={() => handleUpdateStatus(selectedAlert.id, 'resolved')}
                          >
                            Mark Resolved
                          </button>
                        )}

                      </div>
                    </div>
                  )}

                  {/* Resolved time display */}
                  {selectedAlert.alert_status === 'resolved' && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: '700' }}>
                        <CheckCircle size={16} /> INCIDENT RESOLVED
                      </div>
                      <div><strong>Response duration:</strong> {Math.floor(selectedAlert.response_time / 60)}m {selectedAlert.response_time % 60}s</div>
                      <div><strong>Resolved At:</strong> {new Date(selectedAlert.resolved_at).toLocaleString()}</div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 2: UPDATE PASSWORD & PROFILE */}
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
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Badge ID (Police ID)</label>
                    <input 
                      type="text" 
                      value={profilePoliceId}
                      onChange={(e) => setProfilePoliceId(e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rank</label>
                    <input 
                      type="text" 
                      value={profileRank}
                      onChange={(e) => setProfileRank(e.target.value)}
                      required 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Station Name</label>
                    <input 
                      type="text" 
                      value={profileStation}
                      onChange={(e) => setProfileStation(e.target.value)}
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
                  <button type="submit" className="btn-primary" disabled={profileLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px', background: 'var(--warning)', color: '#0b0f19' }}>
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

                  <button type="submit" className="btn-primary" disabled={pwLoading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', marginTop: '10px', background: 'var(--warning)', color: '#0b0f19' }}>
                    {pwLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </main>

      </div>

    </div>
  );
};

export default PoliceDashboard;
