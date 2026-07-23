const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pool = null;
let useMock = false;

// Mock database tables in-memory
const mockDb = {
  users: [],
  police_officers: [],
  administrators: [],
  emergency_alerts: [],
  activity_logs: [],
  login_logs: []
};

// Seed in-memory databases with default records
function seedMockDatabase() {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  mockDb.administrators.push({
    id: 1,
    full_name: 'System Administrator',
    username: 'admin',
    password_hash: adminPasswordHash,
    email: 'admin@safewatch.gov',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  });

  const policePasswordHash = bcrypt.hashSync('police123', 10);
  mockDb.police_officers.push({
    id: 1,
    full_name: 'Officer Jane Doe',
    username: 'police',
    password_hash: policePasswordHash,
    police_id: 'POL-10029',
    rank: 'Inspector',
    station_name: 'Downtown Safety Hub',
    phone: '+15550199',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  });

  const userPasswordHash = bcrypt.hashSync('user123', 10);
  mockDb.users.push({
    id: 1,
    full_name: 'Sarah Jenkins',
    username: 'user',
    password_hash: userPasswordHash,
    phone: '+15550143',
    address: '742 Evergreen Terrace, Springfield',
    emergency_contact: '+15559999',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  });

  console.log('Seeded in-memory mock database.');
}

async function initializeDatabase() {
  try {
    console.log('Attempting to connect to MySQL database...');
    
    // Try to create the database if not exists
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      connectTimeout: 5000
    });

    const dbName = process.env.DB_NAME || 'women_safety_db';
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await tempConnection.end();

    // Establish connection pool
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log(`Connected to MySQL database: ${dbName}`);

    // Create tables
    await createTables();

    // Seed default accounts
    await seedDefaultData();

  } catch (error) {
    console.warn('================================================================');
    console.warn('⚠️ WARNING: Failed to connect to MySQL database:', error.message);
    console.warn('🔄 Switching to Self-Healing In-Memory Database Simulator.');
    console.warn('All features will remain functional (saved in-memory for testing).');
    console.warn('================================================================');
    
    useMock = true;
    seedMockDatabase();
  }
}

async function createTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      address TEXT NOT NULL,
      emergency_contact VARCHAR(20) NOT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS police_officers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      police_id VARCHAR(50) UNIQUE NOT NULL,
      rank VARCHAR(50) NOT NULL,
      station_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS administrators (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS emergency_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      alert_status ENUM('pending', 'acknowledged', 'responding', 'resolved') DEFAULT 'pending',
      assigned_police_id INT NULL,
      response_time INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_police_id) REFERENCES police_officers(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      role ENUM('USER', 'POLICE', 'ADMINISTRATOR') NOT NULL,
      action VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS login_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      role ENUM('USER', 'POLICE', 'ADMINISTRATOR') NOT NULL,
      login_status ENUM('success', 'failed') NOT NULL,
      ip_address VARCHAR(45) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const query of queries) {
    await pool.query(query);
  }
}

async function seedDefaultData() {
  const [admins] = await pool.query('SELECT * FROM administrators WHERE username = ?', ['admin']);
  if (admins.length === 0) {
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO administrators (full_name, username, password_hash, email, status) VALUES (?, ?, ?, ?, ?)`,
      ['System Administrator', 'admin', adminPasswordHash, 'admin@safewatch.gov', 'active']
    );
  }

  const [police] = await pool.query('SELECT * FROM police_officers WHERE username = ?', ['police']);
  if (police.length === 0) {
    const policePasswordHash = await bcrypt.hash('police123', 10);
    await pool.query(
      `INSERT INTO police_officers (full_name, username, password_hash, police_id, rank, station_name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Officer Jane Doe', 'police', policePasswordHash, 'POL-10029', 'Inspector', 'Downtown Safety Hub', '+15550199', 'active']
    );
  }

  const [users] = await pool.query('SELECT * FROM users WHERE username = ?', ['user']);
  if (users.length === 0) {
    const userPasswordHash = await bcrypt.hash('user123', 10);
    await pool.query(
      `INSERT INTO users (full_name, username, password_hash, phone, address, emergency_contact, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Sarah Jenkins', 'user', userPasswordHash, '+15550143', '742 Evergreen Terrace, Springfield', '+15559999', 'active']
    );
  }
}

// In-Memory Database Simulator for Stateless Fallback
async function simulateQuery(sql, params = []) {
  const queryStr = sql.trim().replace(/\s+/g, ' ');
  
  // 1. STATS OVERVIEW
  if (queryStr.includes('COUNT(*)') && queryStr.includes('totalUsers')) {
    return [[{
      totalUsers: mockDb.users.length,
      totalPolice: mockDb.police_officers.length,
      totalAdmins: mockDb.administrators.length,
      activeAlerts: mockDb.emergency_alerts.filter(a => a.alert_status !== 'resolved').length,
      resolvedAlerts: mockDb.emergency_alerts.filter(a => a.alert_status === 'resolved').length
    }]];
  }

  // 2. USERS QUERY & UPDATE
  if (queryStr.includes('FROM users')) {
    if (queryStr.includes('WHERE username = ?')) {
      const records = mockDb.users.filter(u => u.username === params[0]);
      return [records];
    }
    if (queryStr.includes('WHERE id = ?')) {
      const records = mockDb.users.filter(u => u.id === parseInt(params[0]));
      return [records];
    }
    const sorted = [...mockDb.users].sort((a, b) => b.created_at - a.created_at);
    return [sorted];
  }

  if (queryStr.includes('INSERT INTO users')) {
    const id = mockDb.users.length + 1;
    mockDb.users.push({
      id,
      full_name: params[0],
      username: params[1],
      password_hash: params[2],
      phone: params[3],
      address: params[4],
      emergency_contact: params[5],
      status: params[6] || 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    return [{ insertId: id }];
  }

  if (queryStr.includes('UPDATE users')) {
    if (queryStr.includes('password_hash = ?')) {
      const user = mockDb.users.find(u => u.id === parseInt(params[1]));
      if (user) user.password_hash = params[0];
      return [{ affectedRows: 1 }];
    }
    if (queryStr.includes('status = ?')) {
      const user = mockDb.users.find(u => u.id === parseInt(params[1]));
      if (user) user.status = params[0];
      return [{ affectedRows: 1 }];
    }
    const user = mockDb.users.find(u => u.id === parseInt(params[4]));
    if (user) {
      user.full_name = params[0];
      user.phone = params[1];
      user.address = params[2];
      user.emergency_contact = params[3];
    }
    return [{ affectedRows: 1 }];
  }

  if (queryStr.includes('DELETE FROM users')) {
    const index = mockDb.users.findIndex(u => u.id === parseInt(params[0]));
    if (index !== -1) mockDb.users.splice(index, 1);
    return [{ affectedRows: 1 }];
  }

  // 3. POLICE QUERY & UPDATE
  if (queryStr.includes('FROM police_officers')) {
    if (queryStr.includes('WHERE username = ?')) {
      const records = mockDb.police_officers.filter(p => p.username === params[0] || (p.police_id && p.police_id === params[1]));
      return [records];
    }
    if (queryStr.includes('WHERE id = ?')) {
      const records = mockDb.police_officers.filter(p => p.id === parseInt(params[0]));
      return [records];
    }
    const sorted = [...mockDb.police_officers].sort((a, b) => b.created_at - a.created_at);
    return [sorted];
  }

  if (queryStr.includes('INSERT INTO police_officers')) {
    const id = mockDb.police_officers.length + 1;
    mockDb.police_officers.push({
      id,
      full_name: params[0],
      username: params[1],
      password_hash: params[2],
      police_id: params[3],
      rank: params[4],
      station_name: params[5],
      phone: params[6],
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    return [{ insertId: id }];
  }

  if (queryStr.includes('UPDATE police_officers')) {
    if (queryStr.includes('password_hash = ?')) {
      const item = mockDb.police_officers.find(p => p.id === parseInt(params[1]));
      if (item) item.password_hash = params[0];
      return [{ affectedRows: 1 }];
    }
    if (queryStr.includes('status = ?')) {
      const item = mockDb.police_officers.find(p => p.id === parseInt(params[1]));
      if (item) item.status = params[0];
      return [{ affectedRows: 1 }];
    }
    const item = mockDb.police_officers.find(p => p.id === parseInt(params[5]));
    if (item) {
      item.full_name = params[0];
      item.police_id = params[1];
      item.rank = params[2];
      item.station_name = params[3];
      item.phone = params[4];
    }
    return [{ affectedRows: 1 }];
  }

  if (queryStr.includes('DELETE FROM police_officers')) {
    const index = mockDb.police_officers.findIndex(p => p.id === parseInt(params[0]));
    if (index !== -1) mockDb.police_officers.splice(index, 1);
    return [{ affectedRows: 1 }];
  }

  // 4. ADMINISTRATORS QUERY & UPDATE
  if (queryStr.includes('FROM administrators')) {
    if (queryStr.includes('WHERE username = ?')) {
      const records = mockDb.administrators.filter(a => a.username === params[0] || (params[1] && a.email === params[1]));
      return [records];
    }
    if (queryStr.includes('WHERE id = ?')) {
      const records = mockDb.administrators.filter(a => a.id === parseInt(params[0]));
      return [records];
    }
    const sorted = [...mockDb.administrators].sort((a, b) => b.created_at - a.created_at);
    return [sorted];
  }

  if (queryStr.includes('INSERT INTO administrators')) {
    const id = mockDb.administrators.length + 1;
    mockDb.administrators.push({
      id,
      full_name: params[0],
      username: params[1],
      password_hash: params[2],
      email: params[3],
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    return [{ insertId: id }];
  }

  if (queryStr.includes('UPDATE administrators')) {
    if (queryStr.includes('password_hash = ?')) {
      const item = mockDb.administrators.find(a => a.id === parseInt(params[1]));
      if (item) item.password_hash = params[0];
      return [{ affectedRows: 1 }];
    }
    if (queryStr.includes('status = ?')) {
      const item = mockDb.administrators.find(a => a.id === parseInt(params[1]));
      if (item) item.status = params[0];
      return [{ affectedRows: 1 }];
    }
    const item = mockDb.administrators.find(a => a.id === parseInt(params[2]));
    if (item) {
      item.full_name = params[0];
      item.email = params[1];
    }
    return [{ affectedRows: 1 }];
  }

  if (queryStr.includes('DELETE FROM administrators')) {
    const index = mockDb.administrators.findIndex(a => a.id === parseInt(params[0]));
    if (index !== -1) mockDb.administrators.splice(index, 1);
    return [{ affectedRows: 1 }];
  }

  // 5. EMERGENCY ALERTS QUERY & UPDATE
  if (queryStr.includes('INSERT INTO emergency_alerts')) {
    const id = mockDb.emergency_alerts.length + 1;
    mockDb.emergency_alerts.push({
      id,
      user_id: params[0],
      latitude: params[1],
      longitude: params[2],
      alert_status: 'pending',
      assigned_police_id: null,
      response_time: null,
      created_at: new Date(),
      resolved_at: null
    });
    return [{ insertId: id }];
  }

  if (queryStr.includes('FROM emergency_alerts')) {
    let list = mockDb.emergency_alerts.map(alert => {
      const citizen = mockDb.users.find(u => u.id === alert.user_id) || {};
      const officer = mockDb.police_officers.find(p => p.id === alert.assigned_police_id) || {};
      
      return {
        ...alert,
        user_name: citizen.full_name || 'Citizen User',
        user_phone: citizen.phone || '',
        user_address: citizen.address || '',
        user_emergency_contact: citizen.emergency_contact || '',
        police_name: officer.full_name || null,
        police_phone: officer.phone || '',
        police_id: officer.police_id || '',
        police_rank: officer.rank || '',
        police_station: officer.station_name || ''
      };
    });

    if (queryStr.includes('WHERE ea.user_id = ? AND ea.alert_status != \'resolved\'')) {
      const active = list.filter(a => a.user_id === parseInt(params[0]) && a.alert_status !== 'resolved');
      return [active];
    }
    if (queryStr.includes('WHERE ea.user_id = ?')) {
      const hist = list.filter(a => a.user_id === parseInt(params[0]));
      return [hist.sort((a,b) => b.created_at - a.created_at)];
    }
    if (queryStr.includes('WHERE ea.assigned_police_id = ?')) {
      const assn = list.filter(a => a.assigned_police_id === parseInt(params[0]));
      return [assn.sort((a,b) => b.created_at - a.created_at)];
    }
    if (queryStr.includes('WHERE id = ? AND assigned_police_id = ?')) {
      const records = list.filter(a => a.id === parseInt(params[0]) && a.assigned_police_id === parseInt(params[1]));
      return [records];
    }

    return [list.sort((a, b) => b.created_at - a.created_at)];
  }

  if (queryStr.includes('UPDATE emergency_alerts')) {
    if (queryStr.includes('assigned_police_id = ?')) {
      const alert = mockDb.emergency_alerts.find(a => a.id === parseInt(params[1]));
      if (alert) {
        alert.assigned_police_id = parseInt(params[0]);
        alert.alert_status = 'acknowledged';
      }
      return [{ affectedRows: 1 }];
    }
    if (queryStr.includes('alert_status = \'resolved\'')) {
      const alert = mockDb.emergency_alerts.find(a => a.id === parseInt(params[0]));
      if (alert) {
        alert.alert_status = 'resolved';
        alert.resolved_at = new Date();
        alert.response_time = Math.floor((alert.resolved_at - alert.created_at) / 1000);
      }
      return [{ affectedRows: 1 }];
    }
    if (queryStr.includes('alert_status = ? WHERE id = ?')) {
      const alert = mockDb.emergency_alerts.find(a => a.id === parseInt(params[1]));
      if (alert) alert.alert_status = params[0];
      return [{ affectedRows: 1 }];
    }
  }

  // 6. LOGS
  if (queryStr.includes('INSERT INTO activity_logs')) {
    mockDb.activity_logs.push({
      id: mockDb.activity_logs.length + 1,
      username: params[0],
      role: params[1],
      action: params[2],
      description: params[3],
      created_at: new Date()
    });
    return [{ affectedRows: 1 }];
  }

  if (queryStr.includes('INSERT INTO login_logs')) {
    mockDb.login_logs.push({
      id: mockDb.login_logs.length + 1,
      username: params[0],
      role: params[1],
      login_status: params[2],
      ip_address: params[3],
      created_at: new Date()
    });
    return [{ affectedRows: 1 }];
  }

  if (queryStr.includes('FROM activity_logs')) {
    return [[...mockDb.activity_logs].sort((a,b) => b.created_at - a.created_at).slice(0, 200)];
  }

  if (queryStr.includes('FROM login_logs')) {
    return [[...mockDb.login_logs].sort((a,b) => b.created_at - a.created_at).slice(0, 200)];
  }

  return [[], []];
}

module.exports = {
  initializeDatabase,
  query: (sql, params) => {
    if (useMock) {
      return simulateQuery(sql, params);
    }
    return pool.query(sql, params);
  },
  getPool: () => pool
};
