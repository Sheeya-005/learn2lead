const express = require('express');
const router = express.Router();

// Middlewares
const { protect, authorize } = require('../middleware/authMiddleware');

// Controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const policeController = require('../controllers/policeController');
const adminController = require('../controllers/adminController');

// ==========================================
// PUBLIC & AUTHENTICATION ROUTES
// ==========================================
router.get('/auth/captcha', authController.getCaptcha);
router.post('/auth/register', authController.registerUser);
router.post('/auth/login', authController.login);

// Generic Protected Route (Available to USER, POLICE, ADMINISTRATOR)
router.post('/auth/change-password', protect, authController.changePassword);

// ==========================================
// CITIZEN USER ROUTES
// ==========================================
router.get('/user/profile', protect, authorize('USER'), userController.getProfile);
router.put('/user/profile', protect, authorize('USER'), userController.updateProfile);
router.post('/user/sos', protect, authorize('USER'), userController.triggerSOS);
router.get('/user/active-sos', protect, authorize('USER'), userController.getActiveSOS);
router.get('/user/sos-history', protect, authorize('USER'), userController.getEmergencyHistory);

// ==========================================
// POLICE OFFICER ROUTES
// ==========================================
router.get('/police/profile', protect, authorize('POLICE'), policeController.getProfile);
router.put('/police/profile', protect, authorize('POLICE'), policeController.updateProfile);
router.get('/police/alerts', protect, authorize('POLICE'), policeController.getAssignedAlerts);
router.patch('/police/alerts/status', protect, authorize('POLICE'), policeController.updateAlertStatus);

// ==========================================
// ADMINISTRATOR ROUTES
// ==========================================
router.get('/admin/stats', protect, authorize('ADMINISTRATOR'), adminController.getStats);
router.put('/admin/profile', protect, authorize('ADMINISTRATOR'), adminController.updateProfile);

// Citizen User CRUD
router.get('/admin/users', protect, authorize('ADMINISTRATOR'), adminController.getAllUsers);
router.post('/admin/users', protect, authorize('ADMINISTRATOR'), adminController.createUser);
router.put('/admin/users/:id', protect, authorize('ADMINISTRATOR'), adminController.updateUser);
router.delete('/admin/users/:id', protect, authorize('ADMINISTRATOR'), adminController.deleteUser);
router.patch('/admin/users/:id/status', protect, authorize('ADMINISTRATOR'), adminController.toggleUserStatus);
router.patch('/admin/users/:id/reset-password', protect, authorize('ADMINISTRATOR'), adminController.resetUserPassword);
router.get('/admin/users/:id/alerts', protect, authorize('ADMINISTRATOR'), adminController.getUserAlerts);

// Police Officer CRUD
router.get('/admin/police', protect, authorize('ADMINISTRATOR'), adminController.getAllPolice);
router.post('/admin/police', protect, authorize('ADMINISTRATOR'), adminController.createPolice);
router.put('/admin/police/:id', protect, authorize('ADMINISTRATOR'), adminController.updatePolice);
router.delete('/admin/police/:id', protect, authorize('ADMINISTRATOR'), adminController.deletePolice);
router.patch('/admin/police/:id/status', protect, authorize('ADMINISTRATOR'), adminController.togglePoliceStatus);
router.patch('/admin/police/:id/reset-password', protect, authorize('ADMINISTRATOR'), adminController.resetPolicePassword);

// Administrator CRUD
router.get('/admin/admins', protect, authorize('ADMINISTRATOR'), adminController.getAllAdmins);
router.post('/admin/admins', protect, authorize('ADMINISTRATOR'), adminController.createAdmin);
router.put('/admin/admins/:id', protect, authorize('ADMINISTRATOR'), adminController.updateAdmin);
router.delete('/admin/admins/:id', protect, authorize('ADMINISTRATOR'), adminController.deleteAdmin);
router.patch('/admin/admins/:id/status', protect, authorize('ADMINISTRATOR'), adminController.toggleAdminStatus);
router.patch('/admin/admins/:id/reset-password', protect, authorize('ADMINISTRATOR'), adminController.resetAdminPassword);

// SOS emergency management
router.get('/admin/alerts', protect, authorize('ADMINISTRATOR'), adminController.getAllAlerts);
router.patch('/admin/alerts/:id/assign', protect, authorize('ADMINISTRATOR'), adminController.assignPoliceToAlert);

// Audit System logs
router.get('/admin/logs/activity', protect, authorize('ADMINISTRATOR'), adminController.getActivityLogs);
router.get('/admin/logs/login', protect, authorize('ADMINISTRATOR'), adminController.getLoginLogs);

module.exports = router;
