const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Activity logger helper for Admin actions
async function logAdminActivity(adminName, action, description) {
  try {
    await db.query(
      'INSERT INTO activity_logs (username, role, action, description) VALUES (?, ?, ?, ?)',
      [adminName, 'ADMINISTRATOR', action, description]
    );
  } catch (err) {
    console.error('Admin activity logging failed:', err);
  }
}

// ==========================================
// STATS & METRICS
// ==========================================
exports.getStats = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalPolice }]] = await db.query('SELECT COUNT(*) AS totalPolice FROM police_officers');
    const [[{ totalAdmins }]] = await db.query('SELECT COUNT(*) AS totalAdmins FROM administrators');
    const [[{ activeAlerts }]] = await db.query('SELECT COUNT(*) AS activeAlerts FROM emergency_alerts WHERE alert_status != "resolved"');
    const [[{ resolvedAlerts }]] = await db.query('SELECT COUNT(*) AS resolvedAlerts FROM emergency_alerts WHERE alert_status = "resolved"');

    return res.status(200).json({
      success: true,
      stats: { totalUsers, totalPolice, totalAdmins, activeAlerts, resolvedAlerts }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve system statistics' });
  }
};

// ==========================================
// USER MANAGEMENT
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const [records] = await db.query('SELECT id, full_name, username, phone, address, emergency_contact, status, created_at FROM users ORDER BY created_at DESC');
    return res.status(200).json({ success: true, users: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  const { fullName, username, password, phone, address, emergencyContact } = req.body;
  if (!fullName || !username || !password || !phone || !address || !emergencyContact) {
    return res.status(400).json({ success: false, message: 'All user fields are required' });
  }

  try {
    const [existing] = await db.query('SELECT username FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (full_name, username, password_hash, phone, address, emergency_contact, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [fullName, username, passwordHash, phone, address, emergencyContact]
    );

    await logAdminActivity(req.user.username, 'CREATE_USER', `Created Citizen User account: ${username} (ID: ${result.insertId})`);
    return res.status(201).json({ success: true, message: 'User account created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create user account' });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, phone, address, emergencyContact } = req.body;

  try {
    const [existing] = await db.query('SELECT username FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    await db.query(
      `UPDATE users SET full_name = ?, phone = ?, address = ?, emergency_contact = ? WHERE id = ?`,
      [fullName, phone, address, emergencyContact, id]
    );

    await logAdminActivity(req.user.username, 'UPDATE_USER', `Updated profile details for Citizen User: ${existing[0].username} (ID: ${id})`);
    return res.status(200).json({ success: true, message: 'User profile updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user profile' });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT username FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    await db.query('DELETE FROM users WHERE id = ?', [id]);
    await logAdminActivity(req.user.username, 'DELETE_USER', `Deleted Citizen User account: ${existing[0].username} (ID: ${id})`);

    return res.status(200).json({ success: true, message: 'User account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete user account' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'inactive'

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const [existing] = await db.query('SELECT username FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
    await logAdminActivity(req.user.username, 'TOGGLE_USER_STATUS', `Set status of user ${existing[0].username} (ID: ${id}) to: ${status}`);

    return res.status(200).json({ success: true, message: `User status set to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle user status' });
  }
};

exports.resetUserPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ success: false, message: 'New password is required' });

  try {
    const [existing] = await db.query('SELECT username FROM users WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'User not found' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    await logAdminActivity(req.user.username, 'RESET_USER_PASSWORD', `Administratively reset password for User: ${existing[0].username} (ID: ${id})`);
    return res.status(200).json({ success: true, message: 'User password reset successful' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset user password' });
  }
};

exports.getUserAlerts = async (req, res) => {
  const { id } = req.params;
  try {
    const [alerts] = await db.query(
      `SELECT ea.id, ea.latitude, ea.longitude, ea.alert_status, ea.response_time, ea.created_at, ea.resolved_at,
              po.full_name AS police_name 
       FROM emergency_alerts ea
       LEFT JOIN police_officers po ON ea.assigned_police_id = po.id
       WHERE ea.user_id = ?
       ORDER BY ea.created_at DESC`,
      [id]
    );
    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user emergency logs' });
  }
};

// ==========================================
// POLICE MANAGEMENT
// ==========================================
exports.getAllPolice = async (req, res) => {
  try {
    const [records] = await db.query('SELECT id, full_name, username, police_id, rank, station_name, phone, status, created_at FROM police_officers ORDER BY created_at DESC');
    return res.status(200).json({ success: true, police: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch police officers' });
  }
};

exports.createPolice = async (req, res) => {
  const { fullName, username, password, policeId, rank, stationName, phone } = req.body;
  if (!fullName || !username || !password || !policeId || !rank || !stationName || !phone) {
    return res.status(400).json({ success: false, message: 'All police fields are required' });
  }

  try {
    const [existing] = await db.query('SELECT username FROM police_officers WHERE username = ? OR police_id = ?', [username, policeId]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Username or Police ID already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO police_officers (full_name, username, password_hash, police_id, rank, station_name, phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [fullName, username, passwordHash, policeId, rank, stationName, phone]
    );

    await logAdminActivity(req.user.username, 'CREATE_POLICE', `Created Police Officer account: ${username} (Police ID: ${policeId})`);
    return res.status(201).json({ success: true, message: 'Police officer account created' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create police account' });
  }
};

exports.updatePolice = async (req, res) => {
  const { id } = req.params;
  const { fullName, policeId, rank, stationName, phone } = req.body;

  try {
    const [existing] = await db.query('SELECT username FROM police_officers WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Police officer not found' });

    await db.query(
      `UPDATE police_officers SET full_name = ?, police_id = ?, rank = ?, station_name = ?, phone = ? WHERE id = ?`,
      [fullName, policeId, rank, stationName, phone, id]
    );

    await logAdminActivity(req.user.username, 'UPDATE_POLICE', `Updated Police Officer account: ${existing[0].username} (ID: ${id})`);
    return res.status(200).json({ success: true, message: 'Police profile updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update police details' });
  }
};

exports.deletePolice = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.query('SELECT username FROM police_officers WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Police officer not found' });

    await db.query('DELETE FROM police_officers WHERE id = ?', [id]);
    await logAdminActivity(req.user.username, 'DELETE_POLICE', `Deleted Police Officer account: ${existing[0].username} (ID: ${id})`);

    return res.status(200).json({ success: true, message: 'Police account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete police account' });
  }
};

exports.togglePoliceStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const [existing] = await db.query('SELECT username FROM police_officers WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Police officer not found' });

    await db.query('UPDATE police_officers SET status = ? WHERE id = ?', [status, id]);
    await logAdminActivity(req.user.username, 'TOGGLE_POLICE_STATUS', `Set status of police officer ${existing[0].username} (ID: ${id}) to: ${status}`);

    return res.status(200).json({ success: true, message: `Police officer status set to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle police status' });
  }
};

exports.resetPolicePassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ success: false, message: 'New password is required' });

  try {
    const [existing] = await db.query('SELECT username FROM police_officers WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Police officer not found' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE police_officers SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    await logAdminActivity(req.user.username, 'RESET_POLICE_PASSWORD', `Administratively reset password for Police Officer: ${existing[0].username} (ID: ${id})`);
    return res.status(200).json({ success: true, message: 'Police password reset successful' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset police password' });
  }
};

// ==========================================
// ADMINISTRATOR MANAGEMENT
// ==========================================
exports.getAllAdmins = async (req, res) => {
  try {
    const [records] = await db.query('SELECT id, full_name, username, email, status, created_at FROM administrators ORDER BY created_at DESC');
    return res.status(200).json({ success: true, administrators: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch administrators' });
  }
};

exports.createAdmin = async (req, res) => {
  const { fullName, username, password, email } = req.body;
  if (!fullName || !username || !password || !email) {
    return res.status(400).json({ success: false, message: 'All admin fields are required' });
  }

  try {
    const [existing] = await db.query('SELECT username FROM administrators WHERE username = ? OR email = ?', [username, email]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Username or Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO administrators (full_name, username, password_hash, email, status) 
       VALUES (?, ?, ?, ?, 'active')`,
      [fullName, username, passwordHash, email]
    );

    await logAdminActivity(req.user.username, 'CREATE_ADMIN', `Created Administrator account: ${username} (Email: ${email})`);
    return res.status(201).json({ success: true, message: 'Admin account created successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create admin account' });
  }
};

exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { fullName, email } = req.body;

  try {
    const [existing] = await db.query('SELECT username FROM administrators WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });

    await db.query(
      `UPDATE administrators SET full_name = ?, email = ? WHERE id = ?`,
      [fullName, email, id]
    );

    await logAdminActivity(req.user.username, 'UPDATE_ADMIN', `Updated profile of Admin: ${existing[0].username} (ID: ${id})`);
    return res.status(200).json({ success: true, message: 'Admin details updated successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update admin profile' });
  }
};

exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own Administrator account' });
  }

  try {
    const [existing] = await db.query('SELECT username FROM administrators WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });

    await db.query('DELETE FROM administrators WHERE id = ?', [id]);
    await logAdminActivity(req.user.username, 'DELETE_ADMIN', `Deleted Administrator account: ${existing[0].username} (ID: ${id})`);

    return res.status(200).json({ success: true, message: 'Admin account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete admin account' });
  }
};

exports.toggleAdminStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own Administrator account' });
  }

  if (!status || !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const [existing] = await db.query('SELECT username FROM administrators WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });

    await db.query('UPDATE administrators SET status = ? WHERE id = ?', [status, id]);
    await logAdminActivity(req.user.username, 'TOGGLE_ADMIN_STATUS', `Set status of administrator ${existing[0].username} (ID: ${id}) to: ${status}`);

    return res.status(200).json({ success: true, message: `Admin status set to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to toggle admin status' });
  }
};

exports.resetAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ success: false, message: 'New password is required' });

  try {
    const [existing] = await db.query('SELECT username FROM administrators WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE administrators SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    await logAdminActivity(req.user.username, 'RESET_ADMIN_PASSWORD', `Administratively reset password for Admin: ${existing[0].username} (ID: ${id})`);
    return res.status(200).json({ success: true, message: 'Admin password reset successful' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset admin password' });
  }
};

// ==========================================
// EMERGENCY SOS MANAGEMENT
// ==========================================
exports.getAllAlerts = async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        ea.id, ea.latitude, ea.longitude, ea.alert_status, ea.response_time, ea.created_at, ea.resolved_at,
        u.full_name AS user_name, u.phone AS user_phone, u.address AS user_address, u.emergency_contact AS user_emergency_contact,
        po.full_name AS police_name, po.police_id, po.phone AS police_phone, po.station_name AS police_station
      FROM emergency_alerts ea
      JOIN users u ON ea.user_id = u.id
      LEFT JOIN police_officers po ON ea.assigned_police_id = po.id
      ORDER BY ea.created_at DESC
    `;
    const [records] = await db.query(queryStr);
    return res.status(200).json({ success: true, alerts: records });
  } catch (error) {
    console.error('Fetch all alerts error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve SOS alerts' });
  }
};

exports.assignPoliceToAlert = async (req, res) => {
  const { id } = req.params; // alertId
  const { policeId } = req.body; // police officer user database PK (id)

  if (!policeId) {
    return res.status(400).json({ success: false, message: 'Police Officer primary ID is required' });
  }

  try {
    // Check if alert exists
    const [alertRecords] = await db.query('SELECT alert_status, user_id FROM emergency_alerts WHERE id = ?', [id]);
    if (alertRecords.length === 0) return res.status(404).json({ success: false, message: 'Alert not found' });
    
    if (alertRecords[0].alert_status === 'resolved') {
      return res.status(400).json({ success: false, message: 'Cannot assign officers to a resolved alert' });
    }

    // Check if police officer exists and is active
    const [policeRecords] = await db.query('SELECT full_name, status FROM police_officers WHERE id = ?', [policeId]);
    if (policeRecords.length === 0) return res.status(404).json({ success: false, message: 'Police officer not found' });

    if (policeRecords[0].status === 'inactive') {
      return res.status(400).json({ success: false, message: 'Cannot assign an inactive police officer' });
    }

    // Update alert
    await db.query(
      'UPDATE emergency_alerts SET assigned_police_id = ?, alert_status = "acknowledged" WHERE id = ?',
      [policeId, id]
    );

    // Get user details for logging
    const [userRecords] = await db.query('SELECT username FROM users WHERE id = ?', [alertRecords[0].user_id]);

    await logAdminActivity(
      req.user.username,
      'ASSIGN_POLICE_ALERT',
      `Assigned Police Officer ${policeRecords[0].full_name} (ID: ${policeId}) to Alert ID ${id} (Citizen: ${userRecords[0] ? userRecords[0].username : 'unknown'})`
    );

    return res.status(200).json({
      success: true,
      message: `Alert assigned to Police Officer ${policeRecords[0].full_name} successfully`
    });

  } catch (error) {
    console.error('Assign police to alert error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign police officer' });
  }
};

// ==========================================
// SYSTEM LOGS AUDITING
// ==========================================
exports.getActivityLogs = async (req, res) => {
  try {
    const [records] = await db.query('SELECT id, username, role, action, description, created_at FROM activity_logs ORDER BY created_at DESC LIMIT 200');
    return res.status(200).json({ success: true, logs: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch activity logs' });
  }
};

exports.getLoginLogs = async (req, res) => {
  try {
    const [records] = await db.query('SELECT id, username, role, login_status, ip_address, created_at FROM login_logs ORDER BY created_at DESC LIMIT 200');
    return res.status(200).json({ success: true, logs: records });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch login logs' });
  }
};

// Update Admin Profile (Self)
exports.updateProfile = async (req, res) => {
  const { fullName, email } = req.body;
  const adminId = req.user.id;

  if (!fullName || !email) {
    return res.status(400).json({ success: false, message: 'Full name and email are required' });
  }

  try {
    await db.query(
      `UPDATE administrators 
       SET full_name = ?, email = ? 
       WHERE id = ?`,
      [fullName, email, adminId]
    );

    await logAdminActivity(
      req.user.username,
      'UPDATE_PROFILE',
      `Updated self profile details (Email: ${email})`
    );

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully!'
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    return res.status(500).json({ success: false, message: 'Database error updating profile' });
  }
};
