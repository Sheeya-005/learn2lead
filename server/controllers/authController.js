const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createCaptcha, verifyCaptcha } = require('../services/captcha');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_women_safety_key_2026_safe';

// Activity Logger helper
async function logActivity(username, role, action, description) {
  try {
    await db.query(
      'INSERT INTO activity_logs (username, role, action, description) VALUES (?, ?, ?, ?)',
      [username, role, action, description]
    );
  } catch (err) {
    console.error('Activity logging failed:', err);
  }
}

// Login Logger helper
async function logLogin(username, role, loginStatus, ipAddress) {
  try {
    await db.query(
      'INSERT INTO login_logs (username, role, login_status, ip_address) VALUES (?, ?, ?, ?)',
      [username, role, loginStatus, ipAddress]
    );
  } catch (err) {
    console.error('Login logging failed:', err);
  }
}

// Generate new CAPTCHA
exports.getCaptcha = (req, res) => {
  try {
    const captcha = createCaptcha();
    return res.status(200).json({
      success: true,
      image: captcha.image,
      captchaToken: captcha.token
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Captcha generation failed' });
  }
};

// Register Citizen User
exports.registerUser = async (req, res) => {
  const { fullName, username, password, phone, address, emergencyContact } = req.body;

  if (!fullName || !username || !password || !phone || !address || !emergencyContact) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    // Check if user already exists in users, police_officers, or administrators
    const [existingUser] = await db.query('SELECT username FROM users WHERE username = ?', [username]);
    const [existingPolice] = await db.query('SELECT username FROM police_officers WHERE username = ?', [username]);
    const [existingAdmin] = await db.query('SELECT username FROM administrators WHERE username = ?', [username]);

    if (existingUser.length > 0 || existingPolice.length > 0 || existingAdmin.length > 0) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (full_name, username, password_hash, phone, address, emergency_contact, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullName, username, hashedPassword, phone, address, emergencyContact, 'active']
    );

    await logActivity(username, 'USER', 'REGISTER', `User registered successfully under ID: ${result.insertId}`);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! You can now log in.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Database error occurred during registration' });
  }
};

// Unified Role-based Login
exports.login = async (req, res) => {
  const { username, password, captchaAnswer, captchaToken, role } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (!username || !password || !captchaAnswer || !captchaToken || !role) {
    return res.status(400).json({ success: false, message: 'All login fields are required' });
  }

  // Validate CAPTCHA
  const isCaptchaValid = verifyCaptcha(captchaToken, captchaAnswer);
  if (!isCaptchaValid) {
    await logLogin(username, role, 'failed', ipAddress);
    return res.status(400).json({ success: false, message: 'Invalid or expired CAPTCHA code' });
  }

  try {
    let userRecord = null;
    let table = '';

    if (role === 'USER') {
      table = 'users';
    } else if (role === 'POLICE') {
      table = 'police_officers';
    } else if (role === 'ADMINISTRATOR') {
      table = 'administrators';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid login role specified' });
    }

    // Fetch user details from appropriate table
    const [records] = await db.query(`SELECT * FROM ${table} WHERE username = ?`, [username]);
    if (records.length === 0) {
      await logLogin(username, role, 'failed', ipAddress);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    userRecord = records[0];

    // Check account status
    if (userRecord.status === 'inactive') {
      await logLogin(username, role, 'failed', ipAddress);
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact Administrator.' });
    }

    // Verify Password Hash
    const isPasswordMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!isPasswordMatch) {
      await logLogin(username, role, 'failed', ipAddress);
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Generate JWT Token (payload contains id, username, role)
    const token = jwt.sign(
      { id: userRecord.id, username: userRecord.username, role: role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Track Login Success
    await logLogin(username, role, 'success', ipAddress);
    await logActivity(username, role, 'LOGIN', `Logged in from IP: ${ipAddress}`);

    // Standardize user object
    const user = {
      id: userRecord.id,
      fullName: userRecord.full_name,
      username: userRecord.username,
      role: role,
      phone: userRecord.phone || '',
      address: userRecord.address || '',
      emergencyContact: userRecord.emergency_contact || '',
      email: userRecord.email || '',
      policeId: userRecord.police_id || '',
      rank: userRecord.rank || '',
      stationName: userRecord.station_name || '',
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Database error occurred during login' });
  }
};

// Change Password for All Roles
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id, username, role } = req.user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
  }

  try {
    let table = '';
    if (role === 'USER') {
      table = 'users';
    } else if (role === 'POLICE') {
      table = 'police_officers';
    } else if (role === 'ADMINISTRATOR') {
      table = 'administrators';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // Get current password hash
    const [records] = await db.query(`SELECT password_hash FROM ${table} WHERE id = ?`, [id]);
    if (records.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userRecord = records[0];

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, userRecord.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.query(`UPDATE ${table} SET password_hash = ? WHERE id = ?`, [hashedNewPassword, id]);

    // Log password change activity
    await logActivity(username, role, 'CHANGE_PASSWORD', 'Successfully updated profile password');

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully!'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Database error occurred while updating password' });
  }
};
