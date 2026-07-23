import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, ShieldAlert, ArrowLeft, RefreshCw, Lock } from 'lucide-react';

const UserLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // Load CAPTCHA from API
  const fetchCaptcha = async () => {
    try {
      setError('');
      const res = await fetch('/api/auth/captcha');
      const data = await res.json();
      if (data.success) {
        setCaptchaImage(data.image);
        setCaptchaToken(data.captchaToken);
        setCaptchaAnswer('');
      } else {
        setError('Failed to fetch CAPTCHA challenge.');
      }
    } catch (err) {
      setError('Connection to backend failed. Check if server is running.');
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password || !captchaAnswer) {
      setError('Please fill in all input fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          captchaAnswer,
          captchaToken,
          role: 'USER',
        }),
      });

      const data = await res.json();

      if (data.success) {
        loginUser(data.token, data.user);
        navigate('/user/dashboard');
      } else {
        setError(data.message || 'Login failed.');
        fetchCaptcha(); // Refresh captcha on failure
      }
    } catch (err) {
      setError('Server connection error. Failed to login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 30px', position: 'relative' }}>
        
        {/* Back navigation */}
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '24px', left: '24px', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', padding: '0' }}
        >
          <ArrowLeft size={16} /> Home
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '30px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Users size={24} color="#059669" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>Citizen Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '4px' }}>
            Access emergency SOS status & profile logs
          </p>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Username</label>
            <input 
              type="text" 
              placeholder="Enter registered username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {/* CAPTCHA section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Security CAPTCHA</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {captchaImage ? (
                <img 
                  src={captchaImage} 
                  alt="Captcha challenge" 
                  style={{ height: '42px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                />
              ) : (
                <div style={{ height: '42px', width: '130px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', border: '1px solid var(--border-color)' }}></div>
              )}
              <button 
                type="button" 
                onClick={fetchCaptcha} 
                className="btn-outline" 
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Refresh CAPTCHA"
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <input 
              type="text" 
              placeholder="Enter CAPTCHA code" 
              value={captchaAnswer}
              onChange={(e) => setCaptchaAnswer(e.target.value)}
              style={{ marginTop: '4px' }}
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <Lock size={16} /> Secure Sign In
              </>
            )}
          </button>

        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have a profile?{' '}
          <button 
            onClick={() => navigate('/register')} 
            style={{ background: 'transparent', padding: '0', color: '#059669', fontWeight: '600' }}
          >
            Register citizen profile
          </button>
        </div>

      </div>
    </div>
  );
};

export default UserLogin;
