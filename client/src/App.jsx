import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import LandingPage from './pages/LandingPage/LandingPage';
import UserLogin from './pages/UserLogin/UserLogin';
import PoliceLogin from './pages/PoliceLogin/PoliceLogin';
import AdministratorLogin from './pages/AdministratorLogin/AdministratorLogin';
import UserRegister from './pages/UserRegister/UserRegister';
import UserDashboard from './pages/UserDashboard/UserDashboard';
import PoliceDashboard from './pages/PoliceDashboard/PoliceDashboard';
import AdministratorDashboard from './pages/AdministratorDashboard/AdministratorDashboard';

// Route Protection Wrapper Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#0b0f19', 
        color: '#fff', 
        fontFamily: 'sans-serif' 
      }}>
        Loading SafeWatch monitoring system...
      </div>
    );
  }

  // Redirect if unauthenticated
  if (!user) {
    if (allowedRole === 'USER') return <Navigate to="/login/user" replace />;
    if (allowedRole === 'POLICE') return <Navigate to="/login/police" replace />;
    if (allowedRole === 'ADMINISTRATOR') return <Navigate to="/login/admin" replace />;
    return <Navigate to="/" replace />;
  }

  // Redirect if authenticated but lacks the correct role permissions
  if (user.role !== allowedRole) {
    if (user.role === 'USER') return <Navigate to="/user/dashboard" replace />;
    if (user.role === 'POLICE') return <Navigate to="/police/dashboard" replace />;
    if (user.role === 'ADMINISTRATOR') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Landing & Auth Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login/user" element={<UserLogin />} />
          <Route path="/login/police" element={<PoliceLogin />} />
          <Route path="/login/admin" element={<AdministratorLogin />} />
          <Route path="/register" element={<UserRegister />} />

          {/* Citizen Protected Dashboard Route */}
          <Route 
            path="/user/dashboard" 
            element={
              <ProtectedRoute allowedRole="USER">
                <UserDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Police Protected Dashboard Route */}
          <Route 
            path="/police/dashboard" 
            element={
              <ProtectedRoute allowedRole="POLICE">
                <PoliceDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Administrator Protected Dashboard Route */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRole="ADMINISTRATOR">
                <AdministratorDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Universal Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
