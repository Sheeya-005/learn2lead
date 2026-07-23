import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, Users, Landmark, AlertTriangle, PhoneCall } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #ecfdf5 0%, #f8fafc 100%)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', backdropFilter: 'blur(10px)', background: 'rgba(255,255,255,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={32} color="#059669" style={{ filter: 'drop-shadow(0 0 8px rgba(5,150,105,0.3))' }} />
          <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '1px', background: 'linear-gradient(to right, #065f46, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SAFEWATCH
          </span>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="btn-outline" onClick={() => navigate('/login/user')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> Citizens
          </button>
          <button className="btn-outline" onClick={() => navigate('/login/police')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Landmark size={16} /> Police
          </button>
          <button className="btn-primary" onClick={() => navigate('/login/admin')}>
            Admin Portal
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        
        <div className="glass-panel" style={{ padding: '8px 20px', borderRadius: '40px', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(5,150,105,0.3)', background: '#ffffff' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block', boxShadow: '0 0 8px #dc2626' }}></span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#059669', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Active Safety Monitoring Platform
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '800', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-1px', color: '#0f172a' }}>
          Empowering Safety Through <br />
          <span style={{ background: 'linear-gradient(to right, #059669, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Instant Response Systems
          </span>
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(1rem, 2vw, 1.2rem)', maxWidth: '750px', marginBottom: '45px', lineHeight: '1.7' }}>
          SafeWatch is a professional full-stack Women Safety Management System. Providing direct, real-time links between citizens, local law enforcement departments, and response agencies in moments of critical danger.
        </p>

        {/* Portal Cards Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', width: '100%', padding: '0 20px', marginBottom: '60px' }}>
          
          {/* User Portal Card */}
          <div className="glass-panel" style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <Users size={28} color="#059669" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Citizen Safety Console</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
              Access emergency SOS utilities, register dynamic coordinates, configure emergency notification contacts, and request safety monitoring.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login/user')} style={{ width: '100%', marginTop: '10px' }}>
              User Login / Register
            </button>
          </div>

          {/* Police Portal Card */}
          <div className="glass-panel" style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <Landmark size={28} color="#d97706" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Police Responder Panel</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
              Dispatch monitoring dashboard, coordinate routing for active threats, report on incident handling status, and review security logs.
            </p>
            <button className="btn-outline" onClick={() => navigate('/login/police')} style={{ width: '100%', borderColor: '#d97706', color: '#d97706', marginTop: '10px' }}>
              Police Officer Login
            </button>
          </div>

          {/* Admin Portal Card */}
          <div className="glass-panel" style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <Shield size={28} color="#dc2626" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>Central Command</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
              Full operations oversight, manage law enforcement deployment, seed user records, review audit trails, and access system telemetry.
            </p>
            <button className="btn-outline" onClick={() => navigate('/login/admin')} style={{ width: '100%', borderColor: '#dc2626', color: '#dc2626', marginTop: '10px' }}>
              Administrator Login
            </button>
          </div>

        </div>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#dc2626" /> Instant 3-Second SOS Countdown
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={18} color="#059669" /> Automated Emergency Contact Notifications
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#059669" /> Cryptographic Access Protection & Logs
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ padding: '30px 20px', borderTop: '1px solid var(--border-color)', background: '#ffffff', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()} Women Safety Management System (SafeWatch). Prepared for emergency deployment.
      </footer>

    </div>
  );
};

export default LandingPage;
