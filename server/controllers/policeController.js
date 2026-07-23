const db = require('../config/db');

// Activity logger helper
async function logActivity(username, role, action, description) {
  try {
    await db.query(
      'INSERT INTO activity_logs (username, role, action, description) VALUES (?, ?, ?, ?)',
      [username, 'POLICE', action, description]
    );
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
}

// Fetch Profile
exports.getProfile = async (req, res) => {
  try {
    const [records] = await db.query(
      'SELECT id, full_name, username, police_id, rank, station_name, phone, status, created_at FROM police_officers WHERE id = ?',
      [req.user.id]
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'Police profile not found' });
    }

    return res.status(200).json({ success: true, police: records[0] });
  } catch (error) {
    console.error('Fetch police profile error:', error);
    return res.status(500).json({ success: false, message: 'Database error fetching profile' });
  }
};

// View Assigned emergency alerts (both active and resolved)
exports.getAssignedAlerts = async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        ea.id, ea.latitude, ea.longitude, ea.alert_status, ea.response_time, ea.created_at, ea.resolved_at,
        u.full_name AS user_name, u.phone AS user_phone, u.address AS user_address, u.emergency_contact AS user_emergency_contact
      FROM emergency_alerts ea
      JOIN users u ON ea.user_id = u.id
      WHERE ea.assigned_police_id = ?
      ORDER BY ea.created_at DESC
    `;
    const [records] = await db.query(queryStr, [req.user.id]);

    return res.status(200).json({ success: true, alerts: records });
  } catch (error) {
    console.error('Get assigned alerts error:', error);
    return res.status(500).json({ success: false, message: 'Database error fetching alerts' });
  }
};

// Update Emergency Alert Response Status
exports.updateAlertStatus = async (req, res) => {
  const { alertId, status } = req.body; // status: 'acknowledged', 'responding', 'resolved'

  if (!alertId || !status) {
    return res.status(400).json({ success: false, message: 'Alert ID and target status are required' });
  }

  const validStatuses = ['acknowledged', 'responding', 'resolved'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid response status target' });
  }

  try {
    // Check if alert is assigned to this officer
    const [records] = await db.query(
      'SELECT id, alert_status FROM emergency_alerts WHERE id = ? AND assigned_police_id = ?',
      [alertId, req.user.id]
    );

    if (records.length === 0) {
      return res.status(403).json({ success: false, message: 'Alert not found or not assigned to you' });
    }

    const alert = records[0];
    if (alert.alert_status === 'resolved') {
      return res.status(400).json({ success: false, message: 'Alert has already been resolved.' });
    }

    if (status === 'resolved') {
      // Set resolved timestamp and calculate response duration in seconds
      await db.query(
        `UPDATE emergency_alerts 
         SET alert_status = 'resolved', 
             resolved_at = CURRENT_TIMESTAMP,
             response_time = TIMESTAMPDIFF(SECOND, created_at, CURRENT_TIMESTAMP)
         WHERE id = ?`,
        [alertId]
      );
    } else {
      await db.query(
        'UPDATE emergency_alerts SET alert_status = ? WHERE id = ?',
        [status, alertId]
      );
    }

    await logActivity(
      req.user.username,
      'POLICE',
      `ALERT_${status.toUpperCase()}`,
      `Updated Alert ID ${alertId} status to: ${status}`
    );

    return res.status(200).json({
      success: true,
      message: `Alert successfully marked as ${status}`
    });

  } catch (error) {
    console.error('Update alert status error:', error);
    return res.status(500).json({ success: false, message: 'Database error updating alert status' });
  }
};

// Update Police Profile
exports.updateProfile = async (req, res) => {
  const { fullName, policeId, rank, stationName, phone } = req.body;
  const officerId = req.user.id;

  if (!fullName || !policeId || !rank || !stationName || !phone) {
    return res.status(400).json({ success: false, message: 'All profile fields are required' });
  }

  try {
    await db.query(
      `UPDATE police_officers 
       SET full_name = ?, police_id = ?, rank = ?, station_name = ?, phone = ? 
       WHERE id = ?`,
      [fullName, policeId, rank, stationName, phone, officerId]
    );

    await logActivity(
      req.user.username,
      'POLICE',
      'UPDATE_PROFILE',
      `Updated police profile details`
    );

    return res.status(200).json({
      success: true,
      message: 'Profile details updated successfully!'
    });
  } catch (error) {
    console.error('Update police profile error:', error);
    return res.status(500).json({ success: false, message: 'Database error updating police profile' });
  }
};
