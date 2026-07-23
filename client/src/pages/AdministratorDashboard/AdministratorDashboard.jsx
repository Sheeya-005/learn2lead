import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Shield, Users, Landmark, AlertTriangle, Activity, 
  Lock, LogOut, CheckCircle, ShieldAlert, XCircle, 
  Plus, Edit2, Trash2, Key, ToggleLeft, ToggleRight, Info 
} from 'lucide-react';
import DistrictMap from '../../components/DistrictMap';

const AdministratorDashboard = () => {
  const { user, token, logoutUser, updateProfile } = useAuth();
  
  // Navigation: 'overview', 'users', 'police', 'admins', 'emergencies', 'logs', 'settings'
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDistrictId, setSelectedDistrictId] = useState('chennai');

  // Stats State
  const [stats, setStats] = useState({ totalUsers: 0, totalPolice: 0, totalAdmins: 0, activeAlerts: 0, resolvedAlerts: 0 });

  // Management Lists
  const [users, setUsers] = useState([]);
  const [police, setPolice] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);

  // Modal / Form States
  const [modalType, setModalType] = useState(null); // 'user_create', 'user_edit', 'police_create', 'police_edit', 'admin_create', 'admin_edit', 'pw_reset', 'assign_police', 'delete_confirm'
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Settings (Password) State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState(user.fullName || '');
  const [profileEmail, setProfileEmail] = useState(user.email || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Synchronize profile states with authenticated user context
  useEffect(() => {
    if (user) {
      setProfileName(user.fullName || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  // Fetch Stats Metrics
  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (err) { console.error(err); }
  };

  // Fetch Users
  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) { console.error(err); }
  };

  // Fetch Police
  const fetchPolice = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/police', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPolice(data.police);
    } catch (err) { console.error(err); }
  };

  // Fetch Admins
  const fetchAdmins = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAdmins(data.administrators);
    } catch (err) { console.error(err); }
  };

  // Fetch SOS Alerts
  const fetchAlerts = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/admin/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAlerts(data.alerts);
    } catch (err) { console.error(err); }
  };

  // Fetch Logs
  const fetchLogs = async () => {
    try {
      const res1 = await fetch('http://localhost:5001/api/admin/logs/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data1 = await res1.json();
      if (data1.success) setActivityLogs(data1.logs);

      const res2 = await fetch('http://localhost:5001/api/admin/logs/login', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data2 = await res2.json();
      if (data2.success) setLoginLogs(data2.logs);
    } catch (err) { console.error(err); }
  };

  // Sync active tab resources
  useEffect(() => {
    if (token) {
      fetchStats();
      if (activeTab === 'overview') {
        fetchAlerts(); // Show active notifications on overview
      } else if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'police') {
        fetchPolice();
      } else if (activeTab === 'admins') {
        fetchAdmins();
      } else if (activeTab === 'emergencies') {
        fetchAlerts();
        fetchPolice(); // Needed for assignment dropdown
      } else if (activeTab === 'logs') {
        fetchLogs();
      }
    }
  }, [activeTab, token]);

  // Open forms/modals
  const openModal = (type, item = null) => {
    setErrorMsg('');
    setSuccessMsg('');
    setModalType(type);
    setSelectedItem(item);
    
    if (type.endsWith('_edit') && item) {
      setFormData(item);
    } else {
      setFormData({});
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setFormData({});
  };

  // API Call handlers
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setModalLoading(true);

    let url = 'http://localhost:5001/api/admin/';
    let method = 'POST';

    // Build API endpoints based on type
    if (modalType === 'user_create') {
      url += 'users';
    } else if (modalType === 'user_edit') {
      url += `users/${selectedItem.id}`;
      method = 'PUT';
    } else if (modalType === 'police_create') {
      url += 'police';
    } else if (modalType === 'police_edit') {
      url += `police/${selectedItem.id}`;
      method = 'PUT';
    } else if (modalType === 'admin_create') {
      url += 'admins';
    } else if (modalType === 'admin_edit') {
      url += `admins/${selectedItem.id}`;
      method = 'PUT';
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Operation successful!');
        setTimeout(() => {
          closeModal();
          // Reload current tab content
          if (activeTab === 'users') fetchUsers();
          if (activeTab === 'police') fetchPolice();
          if (activeTab === 'admins') fetchAdmins();
          fetchStats();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Operation failed.');
      }
    } catch (err) {
      setErrorMsg('Network error processing request.');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteItem = async () => {
    setModalLoading(true);
    setErrorMsg('');
    
    let url = 'http://localhost:5001/api/admin/';
    if (activeTab === 'users') url += `users/${selectedItem.id}`;
    if (activeTab === 'police') url += `police/${selectedItem.id}`;
    if (activeTab === 'admins') url += `admins/${selectedItem.id}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Account deleted successfully!');
        setTimeout(() => {
          closeModal();
          if (activeTab === 'users') fetchUsers();
          if (activeTab === 'police') fetchPolice();
          if (activeTab === 'admins') fetchAdmins();
          fetchStats();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to delete record.');
      }
    } catch (err) {
      setErrorMsg('Connection error deleting item.');
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle account active status
  const handleToggleStatus = async (item, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    let url = 'http://localhost:5001/api/admin/';
    if (activeTab === 'users') url += `users/${item.id}/status`;
    if (activeTab === 'police') url += `police/${item.id}/status`;
    if (activeTab === 'admins') url += `admins/${item.id}/status`;

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'police') fetchPolice();
        if (activeTab === 'admins') fetchAdmins();
      } else {
        alert(data.message || 'Failed to toggle account status.');
      }
    } catch (err) {
      alert('Network failure toggling status.');
    }
  };

  // Handle Profile Details update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileName || !profileEmail) {
      setProfileError('Please fill in all profile fields.');
      return;
    }

    setProfileLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/admin/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profileName,
          email: profileEmail
        })
      });
      const data = await res.json();

      if (data.success) {
        setProfileSuccess('Profile details updated successfully!');
        updateProfile({
          fullName: profileName,
          email: profileEmail
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

  // Admin Change Password API
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

  // Assign Police to SOS incident
  const handleAssignPoliceSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setModalLoading(true);

    const policeId = formData.policeId;
    if (!policeId) {
      setErrorMsg('Please select a police responder.');
      setModalLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/admin/alerts/${selectedItem.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ policeId })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Officer assigned successfully!');
        setTimeout(() => {
          closeModal();
          fetchAlerts();
          fetchStats();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to assign officer.');
      }
    } catch (err) {
      setErrorMsg('Connection error assigning officer.');
    } finally {
      setModalLoading(false);
    }
  };

  // Administratively reset passwords
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setModalLoading(true);

    let url = 'http://localhost:5001/api/admin/';
    if (activeTab === 'users') url += `users/${selectedItem.id}/reset-password`;
    if (activeTab === 'police') url += `police/${selectedItem.id}/reset-password`;
    if (activeTab === 'admins') url += `admins/${selectedItem.id}/reset-password`;

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword: formData.newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Account password reset successfully!');
        setTimeout(() => {
          closeModal();
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setErrorMsg('Connection error resetting password.');
    } finally {
      setModalLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', padding: '16px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={28} color="#ef4444" />
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '0.5px' }}>SAFEWATCH COMMAND</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button className="btn-outline" onClick={logoutUser} style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'clamp(240px, 15vw, 290px) 1fr', minHeight: 'calc(100vh - 73px)' }}>
        
        {/* Sidebar Nav */}
        <aside style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Admin Tag */}
          <div className="glass-panel" style={{ padding: '14px', background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800' }}>
              A
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '13px' }}>{user.fullName}</div>
              <div style={{ fontSize: '10px', color: '#fca5a5', fontWeight: '600' }}>System Admin</div>
            </div>
          </div>

          {/* Nav list */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'overview' ? '#ef4444' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Activity size={18} /> Telemetry Overview
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'users' ? '#ef4444' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Users size={18} /> Manage Citizens
            </button>
            <button 
              onClick={() => setActiveTab('police')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'police' ? '#ef4444' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Landmark size={18} /> Manage Police
            </button>
            <button 
              onClick={() => setActiveTab('admins')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'admins' ? '#ef4444' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Shield size={18} /> Manage Admins
            </button>
            <button 
              onClick={() => setActiveTab('emergencies')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'emergencies' ? '#ef4444' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <AlertTriangle size={18} /> SOS Incidents
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'logs' ? '#ef4444' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Activity size={18} /> System Audit Logs
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px', background: activeTab === 'settings' ? '#ef4444' : 'transparent', color: '#fff', padding: '12px' }}
            >
              <Lock size={18} /> Update Password
            </button>
          </nav>

        </aside>

        {/* Dashboard Workspace */}
        <main style={{ padding: '30px 4%', overflowY: 'auto' }}>
          
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }} className="animate-slide-in">
              
              {/* Stat card grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Total Citizens</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', margin: '10px 0 0' }}>{stats.totalUsers}</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Police Force</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', margin: '10px 0 0', color: 'var(--warning)' }}>{stats.totalPolice}</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px', borderColor: stats.activeAlerts > 0 ? '#ef4444' : 'var(--border-color)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Active SOS Alerts</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', margin: '10px 0 0', color: '#ef4444' }}>{stats.activeAlerts}</div>
                </div>
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase' }}>Resolved SOS Incidents</div>
                  <div style={{ fontSize: '32px', fontWeight: '800', margin: '10px 0 0', color: '#10b981' }}>{stats.resolvedAlerts}</div>
                </div>
              </div>

              {/* Active Alerts Live ticker */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle color="#ef4444" size={18} /> Active Dispatch Board</h3>
                
                <div className="custom-table-container">
                  {alerts.filter(a => a.alert_status !== 'resolved').length > 0 ? (
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>SOS ID</th>
                          <th>Citizen Name</th>
                          <th>Coordinates</th>
                          <th>Status</th>
                          <th>Responder Assigned</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.filter(a => a.alert_status !== 'resolved').map((alert) => (
                          <tr key={alert.id}>
                            <td style={{ fontWeight: '700' }}>#{alert.id}</td>
                            <td>{alert.user_name}</td>
                            <td>{parseFloat(alert.latitude).toFixed(4)}, {parseFloat(alert.longitude).toFixed(4)}</td>
                            <td><span className={`badge badge-${alert.alert_status}`}>{alert.alert_status}</span></td>
                            <td>{alert.police_name ? `${alert.police_name} (${alert.police_station})` : 'Unassigned'}</td>
                            <td>
                              <button className="btn-outline" onClick={() => openModal('assign_police', alert)} style={{ fontSize: '12px', padding: '6px 12px' }}>
                                Assign Officer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No active emergency alerts logged. Safe state verified.
                    </div>
                  )}
                </div>
              </div>

              {/* District Live Location Map */}
              <div style={{ marginTop: '10px' }}>
                <DistrictMap 
                  selectedDistrictId={selectedDistrictId}
                  onDistrictChange={(district) => setSelectedDistrictId(district.id)}
                  height="360px"
                />
              </div>

            </div>
          )}

          {/* CITIZEN MANAGEMENT PANEL */}
          {activeTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Citizen Accounts</h3>
                <button className="btn-primary" onClick={() => openModal('user_create')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Add Citizen
                </button>
              </div>

              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Phone</th>
                      <th>Guardian Contact</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td style={{ fontWeight: '600' }}>{item.full_name}</td>
                        <td>@{item.username}</td>
                        <td>{item.phone}</td>
                        <td>{item.emergency_contact}</td>
                        <td>
                          <button 
                            style={{ background: 'transparent', border: 'none', padding: '0', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleToggleStatus(item, item.status)}
                          >
                            {item.status === 'active' ? (
                              <span className="badge badge-active">Active</span>
                            ) : (
                              <span className="badge badge-inactive">Inactive</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-outline" onClick={() => openModal('user_edit', item)} style={{ padding: '6px' }} title="Edit Citizen"><Edit2 size={12} /></button>
                            <button className="btn-outline" onClick={() => openModal('pw_reset', item)} style={{ padding: '6px' }} title="Reset Password"><Key size={12} /></button>
                            <button className="btn-outline" onClick={() => openModal('delete_confirm', item)} style={{ padding: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.1)' }} title="Delete Citizen"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* POLICE MANAGEMENT PANEL */}
          {activeTab === 'police' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Law Enforcement Responders</h3>
                <button className="btn-primary" onClick={() => openModal('police_create')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Add Police Officer
                </button>
              </div>

              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Badge ID</th>
                      <th>Rank</th>
                      <th>Station</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {police.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td style={{ fontWeight: '600' }}>{item.full_name}</td>
                        <td>{item.police_id}</td>
                        <td>{item.rank}</td>
                        <td>{item.station_name}</td>
                        <td>
                          <button 
                            style={{ background: 'transparent', border: 'none', padding: '0', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => handleToggleStatus(item, item.status)}
                          >
                            {item.status === 'active' ? (
                              <span className="badge badge-active">Active</span>
                            ) : (
                              <span className="badge badge-inactive">Inactive</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-outline" onClick={() => openModal('police_edit', item)} style={{ padding: '6px' }} title="Edit Officer"><Edit2 size={12} /></button>
                            <button className="btn-outline" onClick={() => openModal('pw_reset', item)} style={{ padding: '6px' }} title="Reset Password"><Key size={12} /></button>
                            <button className="btn-outline" onClick={() => openModal('delete_confirm', item)} style={{ padding: '6px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.1)' }} title="Delete Officer"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADMINISTRATOR MANAGEMENT PANEL */}
          {activeTab === 'admins' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Administrators</h3>
                <button className="btn-primary" onClick={() => openModal('admin_create')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} /> Add Admin Account
                </button>
              </div>

              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email Address</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td style={{ fontWeight: '600' }}>{item.full_name}</td>
                        <td>@{item.username}</td>
                        <td>{item.email}</td>
                        <td>
                          <button 
                            style={{ background: 'transparent', border: 'none', padding: '0', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            disabled={item.id === user.id}
                            onClick={() => handleToggleStatus(item, item.status)}
                          >
                            {item.status === 'active' ? (
                              <span className="badge badge-active">Active</span>
                            ) : (
                              <span className="badge badge-inactive">Inactive</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn-outline" onClick={() => openModal('admin_edit', item)} style={{ padding: '6px' }} title="Edit Admin"><Edit2 size={12} /></button>
                            <button className="btn-outline" onClick={() => openModal('pw_reset', item)} style={{ padding: '6px' }} title="Reset Password"><Key size={12} /></button>
                            <button 
                              className="btn-outline" 
                              onClick={() => openModal('delete_confirm', item)} 
                              disabled={item.id === user.id} 
                              style={{ padding: '6px', color: item.id === user.id ? 'var(--text-muted)' : '#ef4444', borderColor: 'rgba(239,68,68,0.1)' }} 
                              title="Delete Admin"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EMERGENCY INCIDENTS & DISPATCH MONITOR */}
          {activeTab === 'emergencies' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Emergency SOS Incident Board</h3>
                <button className="btn-outline" onClick={fetchAlerts} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Sync Alerts
                </button>
              </div>

              <div className="custom-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>SOS ID</th>
                      <th>Citizen Name</th>
                      <th>Phone</th>
                      <th>Coordinates</th>
                      <th>Status</th>
                      <th>Assigned Responder</th>
                      <th>Response Time</th>
                      <th>Triggered At</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert) => (
                      <tr key={alert.id}>
                        <td style={{ fontWeight: '700' }}>#{alert.id}</td>
                        <td style={{ fontWeight: '600' }}>{alert.user_name}</td>
                        <td>{alert.user_phone}</td>
                        <td>{parseFloat(alert.latitude).toFixed(4)}, {parseFloat(alert.longitude).toFixed(4)}</td>
                        <td><span className={`badge badge-${alert.alert_status}`}>{alert.alert_status}</span></td>
                        <td>{alert.police_name ? `${alert.police_name} (${alert.police_station})` : 'Unassigned'}</td>
                        <td>{alert.response_time ? `${Math.floor(alert.response_time / 60)}m ${alert.response_time % 60}s` : 'N/A'}</td>
                        <td>{new Date(alert.created_at).toLocaleString()}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            {alert.alert_status !== 'resolved' ? (
                              <button className="btn-primary" onClick={() => openModal('assign_police', alert)} style={{ fontSize: '11px', padding: '6px 10px' }}>
                                Assign Patrol
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                <CheckCircle size={12} /> Resolved
                              </span>
                            )}
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${alert.latitude},${alert.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-outline"
                              style={{ fontSize: '11px', padding: '6px 10px', textDecoration: 'none', color: '#dc2626', borderColor: '#fca5a5' }}
                              title="Navigate to Reach Person"
                            >
                              Navigate 🗺️
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AUDIT SYSTEM LOGS PANEL */}
          {activeTab === 'logs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }} className="animate-slide-in">
              
              {/* Activity Audit logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Action Audit Log</h3>
                <div className="custom-table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: '600' }}>@{log.username}</td>
                          <td><span style={{ fontSize: '10px' }}>{log.role}</span></td>
                          <td style={{ fontWeight: '700', fontSize: '12px' }}>{log.action}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Login Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Login Telemetry Log</h3>
                <div className="custom-table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>IP Address</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: '600' }}>@{log.username}</td>
                          <td><span style={{ fontSize: '10px' }}>{log.role}</span></td>
                          <td>
                            <span className={log.login_status === 'success' ? 'badge badge-active' : 'badge badge-inactive'}>
                              {log.login_status}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px' }}>{log.ip_address}</td>
                          <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* SETTINGS PANEL (CHANGE PASSWORD & PROFILE) */}
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
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
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

      {/* ==========================================
          MODALS & FORM BOX OVERLAYS
      ========================================== */}
      {modalType && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5,8,16,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          
          <div className="glass-panel" style={{ width: '100%', maxWidth: modalType === 'delete_confirm' ? '380px' : '480px', padding: '30px', background: 'var(--bg-sidebar)' }}>
            
            {/* Modal Title */}
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {modalType.includes('user_create') && 'Register Citizen Profile'}
              {modalType.includes('user_edit') && 'Edit Citizen Profile'}
              {modalType.includes('police_create') && 'Register Police Officer Account'}
              {modalType.includes('police_edit') && 'Edit Police Officer Profile'}
              {modalType.includes('admin_create') && 'Register Administrator Account'}
              {modalType.includes('admin_edit') && 'Edit Administrator Profile'}
              {modalType === 'pw_reset' && `Reset Account Password`}
              {modalType === 'assign_police' && 'Assign Patrol Officer'}
              {modalType === 'delete_confirm' && 'Confirm Action'}
            </h3>

            {errorMsg && <div className="alert-box alert-error"><span>{errorMsg}</span></div>}
            {successMsg && <div className="alert-box alert-success"><span>{successMsg}</span></div>}

            {/* A. CITIZEN USER SUBMIT FORM */}
            {(modalType === 'user_create' || modalType === 'user_edit') && (
              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input type="text" value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Username</label>
                  <input type="text" value={formData.username || ''} disabled={modalType === 'user_edit'} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                {modalType === 'user_create' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
                    <input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Number</label>
                  <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Emergency Contact (Guardian)</label>
                  <input type="tel" value={formData.emergencyContact || ''} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Address</label>
                  <textarea value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows="2" style={{ resize: 'none' }} required />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={modalLoading} style={{ flex: 1 }}>{modalLoading ? 'Processing...' : 'Submit Profile'}</button>
                </div>
              </form>
            )}

            {/* B. POLICE SUBMIT FORM */}
            {(modalType === 'police_create' || modalType === 'police_edit') && (
              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input type="text" value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Username</label>
                  <input type="text" value={formData.username || ''} disabled={modalType === 'police_edit'} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                {modalType === 'police_create' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
                    <input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Badge ID (Police ID)</label>
                  <input type="text" value={formData.policeId || ''} onChange={(e) => setFormData({ ...formData, policeId: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rank</label>
                  <input type="text" placeholder="e.g. Inspector" value={formData.rank || ''} onChange={(e) => setFormData({ ...formData, rank: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Station Name</label>
                  <input type="text" value={formData.stationName || ''} onChange={(e) => setFormData({ ...formData, stationName: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phone Number</label>
                  <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={modalLoading} style={{ flex: 1 }}>{modalLoading ? 'Processing...' : 'Submit Profile'}</button>
                </div>
              </form>
            )}

            {/* C. ADMINISTRATOR SUBMIT FORM */}
            {(modalType === 'admin_create' || modalType === 'admin_edit') && (
              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input type="text" value={formData.fullName || ''} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Username</label>
                  <input type="text" value={formData.username || ''} disabled={modalType === 'admin_edit'} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                </div>
                {modalType === 'admin_create' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Password</label>
                    <input type="password" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={modalLoading} style={{ flex: 1 }}>{modalLoading ? 'Processing...' : 'Submit Profile'}</button>
                </div>
              </form>
            )}

            {/* D. PASSWORD RESET FROM ADMIN FORM */}
            {modalType === 'pw_reset' && (
              <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', fontSize: '13px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
                  <strong>Resetting password for:</strong> @{selectedItem.username} ({selectedItem.full_name})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>New Password</label>
                  <input type="password" value={formData.newPassword || ''} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} required placeholder="Enter new password" />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={modalLoading} style={{ flex: 1 }}>{modalLoading ? 'Resetting...' : 'Save Password'}</button>
                </div>
              </form>
            )}

            {/* E. POLICE INCIDENT ASSIGNMENT FORM */}
            {modalType === 'assign_police' && (
              <form onSubmit={handleAssignPoliceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(259,68,68,0.05)', padding: '10px', borderRadius: '6px', fontSize: '13px', border: '1px solid rgba(239,68,68,0.15)', marginBottom: '8px' }}>
                  <strong>Emergency SOS ID:</strong> #{selectedItem.id} <br />
                  <strong>Citizen:</strong> {selectedItem.user_name}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Select Active Patrol Unit</label>
                  <select 
                    value={formData.policeId || ''} 
                    onChange={(e) => setFormData({ ...formData, policeId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Active Police Officer --</option>
                    {police.filter(p => p.status === 'active').map(p => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} - {p.rank} (Badge: {p.police_id}, Station: {p.station_name})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={modalLoading} style={{ flex: 1 }}>{modalLoading ? 'Assigning...' : 'Confirm Assignment'}</button>
                </div>
              </form>
            )}

            {/* F. DELETE ACCOUNT CONFIRMATION */}
            {modalType === 'delete_confirm' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ textAlign: 'center', color: '#ef4444', marginBottom: '10px' }}>
                  <ShieldAlert size={48} style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontWeight: '600', fontSize: '15px' }}>WARNING: Permanently delete account?</p>
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Are you sure you want to delete the account <strong>@{selectedItem.username}</strong> ({selectedItem.full_name})? This action is irreversible.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-outline" onClick={closeModal} style={{ flex: 1 }}>Cancel</button>
                  <button type="button" className="btn-primary" onClick={handleDeleteItem} disabled={modalLoading} style={{ flex: 1, background: '#ef4444' }}>
                    {modalLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default AdministratorDashboard;
