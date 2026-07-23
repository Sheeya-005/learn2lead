const db = require('../config/db');

// Activity logger helper
async function logActivity(username, role, action, description) {
  try {
    await db.query(
      'INSERT INTO activity_logs (username, role, action, description) VALUES (?, ?, ?, ?)',
      [username, 'USER', action, description]
    );
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
}

// Fetch Profile
exports.getProfile = async (req, res) => {
  try {
    const [records] = await db.query(
      'SELECT id, full_name, username, phone, address, emergency_contact, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    return res.status(200).json({ success: true, user: records[0] });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({ success: false, message: 'Database error fetching profile' });
  }
};

const smsService = require('../services/smsService');

// Trigger SOS Alert
exports.triggerSOS = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Location latitude and longitude are required' });
  }

  try {
    // Fetch victim profile details
    const [userRecords] = await db.query(
      'SELECT full_name, phone, emergency_contact FROM users WHERE id = ?',
      [req.user.id]
    );

    const victim = userRecords[0] || { full_name: req.user.username, phone: '', emergency_contact: '' };

    // Prevent creating a new alert if there is already an active (unresolved) SOS alert from this user
    const [activeAlerts] = await db.query(
      'SELECT id FROM emergency_alerts WHERE user_id = ? AND alert_status != "resolved"',
      [req.user.id]
    );

    if (activeAlerts.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'An active SOS emergency is already open. Please resolve it or wait for response.' 
      });
    }

    const [result] = await db.query(
      `INSERT INTO emergency_alerts (user_id, latitude, longitude, alert_status) 
       VALUES (?, ?, ?, 'pending')`,
      [req.user.id, latitude, longitude]
    );

    // Fetch nearest police responder phone number
    const [policeRecords] = await db.query('SELECT phone FROM police_officers WHERE status = "active" LIMIT 1');
    const policePhone = (policeRecords && policeRecords[0]) ? policeRecords[0].phone : '100';
    const volunteerPhone = '9876543210';

    // Dispatch Emergency SMS to Police, Volunteer, and Emergency Contact (Guardian)
    const smsInfo = await smsService.dispatchEmergencySMSAlert({
      victimName: victim.full_name,
      victimPhone: victim.phone,
      emergencyContact: victim.emergency_contact,
      policePhone: policePhone,
      volunteerPhone: volunteerPhone,
      latitude: latitude,
      longitude: longitude
    });

    await logActivity(
      req.user.username,
      'USER',
      'SOS_TRIGGERED',
      `Triggered emergency SOS at location: Lat ${latitude}, Lng ${longitude}. SMS dispatched.`
    );

    return res.status(201).json({
      success: true,
      message: '🚨 EMERGENCY ALERT DISPATCHED! SMS sent to Police, Volunteer & Emergency Contact.',
      alertId: result.insertId,
      mapsUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
      smsSummary: smsInfo
    });

  } catch (error) {
    console.error('Trigger SOS error:', error);
    return res.status(500).json({ success: false, message: 'Database error triggering SOS' });
  }
};

// Fetch Active SOS Alert
exports.getActiveSOS = async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        ea.id, ea.latitude, ea.longitude, ea.alert_status, ea.created_at,
        po.full_name AS police_name, po.phone AS police_phone, po.police_id, 
        po.rank AS police_rank, po.station_name AS police_station
      FROM emergency_alerts ea
      LEFT JOIN police_officers po ON ea.assigned_police_id = po.id
      WHERE ea.user_id = ? AND ea.alert_status != 'resolved'
      LIMIT 1
    `;
    const [records] = await db.query(queryStr, [req.user.id]);

    if (records.length === 0) {
      return res.status(200).json({ success: true, activeAlert: null });
    }

    return res.status(200).json({ success: true, activeAlert: records[0] });
  } catch (error) {
    console.error('Get active SOS error:', error);
    return res.status(500).json({ success: false, message: 'Database error fetching active SOS' });
  }
};

// Fetch Emergency History
exports.getEmergencyHistory = async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        ea.id, ea.latitude, ea.longitude, ea.alert_status, ea.response_time, ea.created_at, ea.resolved_at,
        po.full_name AS police_name, po.phone AS police_phone, po.station_name AS police_station
      FROM emergency_alerts ea
      LEFT JOIN police_officers po ON ea.assigned_police_id = po.id
      WHERE ea.user_id = ?
      ORDER BY ea.created_at DESC
    `;
    const [records] = await db.query(queryStr, [req.user.id]);

    return res.status(200).json({ success: true, history: records });
  } catch (error) {
    console.error('Get emergency history error:', error);
    return res.status(500).json({ success: false, message: 'Database error fetching history' });
  }
};

// Update Citizen Profile
exports.updateProfile = async (req, res) => {
  const { fullName, phone, address, emergencyContact } = req.body;
  const userId = req.user.id;

  if (!fullName || !phone || !address || !emergencyContact) {
    return res.status(400).json({ success: false, message: 'All profile fields are required' });
  }

  try {
    await db.query(
      `UPDATE users 
       SET full_name = ?, phone = ?, address = ?, emergency_contact = ? 
       WHERE id = ?`,
      [fullName, phone, address, emergencyContact, userId]
    );

    await logActivity(
      req.user.username,
      'USER',
      'UPDATE_PROFILE',
      `Updated user profile details`
    );

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully!'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Database error updating profile' });
  }
};
