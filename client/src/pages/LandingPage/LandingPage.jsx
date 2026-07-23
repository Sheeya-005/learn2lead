import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ShieldAlert, Users, Landmark, AlertTriangle, PhoneCall } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, #1e1b4b 0%, #0b0f19 100%)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <header style={{ padding: '20px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldAlert size={32} color="#8b5cf6" style={{ filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.5))' }} />
          <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '1px', background: 'linear-gradient(to right, #f8fafc, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
        
        <div className="glass-panel" style={{ padding: '8px 20px', borderRadius: '40px', marginBottom: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(139,92,246,0.3)' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }}></span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#c084fc', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Active Safety Monitoring Platform
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '800', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-1px' }}>
          Empowering Safety Through <br />
          <span style={{ background: 'linear-gradient(to right, #c084fc, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
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
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <Users size={28} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Citizen Safety Console</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
              Access emergency SOS utilities, register dynamic coordinates, configure emergency notification contacts, and request safety monitoring.
            </p>
            <button className="btn-primary" onClick={() => navigate('/login/user')} style={{ width: '100%', marginTop: '10px' }}>
              User Login / Register
            </button>
          </div>

          {/* Police Portal Card */}
          <div className="glass-panel" style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <Landmark size={28} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Police Responder Panel</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
              Dispatch monitoring dashboard, coordinate routing for active threats, report on incident handling status, and review security logs.
            </p>
            <button className="btn-outline" onClick={() => navigate('/login/police')} style={{ width: '100%', borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', marginTop: '10px' }}>
              Police Officer Login
            </button>
          </div>

          {/* Admin Portal Card */}
          <div className="glass-panel" style={{ padding: '40px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
              <Shield size={28} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700' }}>Central Command</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>
              Full operations oversight, manage law enforcement deployment, seed user records, review audit trails, and access system telemetry.
            </p>
            <button className="btn-outline" onClick={() => navigate('/login/admin')} style={{ width: '100%', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444', marginTop: '10px' }}>
              Administrator Login
            </button>
          </div>

        </div>

        {/* Feature Highlights */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#ef4444" /> Instant 3-Second SOS Countdown
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PhoneCall size={18} color="#10b981" /> Automated Emergency Contact Notifications
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#8b5cf6" /> Cryptographic Access Protection & Logs
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer style={{ padding: '30px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        &copy; {new Date().getFullYear()} Women Safety Management System (SafeWatch). Prepared for emergency deployment.
      </footer>

    </div>
  );
};

export default LandingPage;
