import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Landmark, ShieldAlert, ArrowLeft, RefreshCw, Lock } from 'lucide-react';

const PoliceLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const fetchCaptcha = async () => {
    try {
      setError('');
      const res = await fetch('http://localhost:5001/api/auth/captcha');
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
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          captchaAnswer,
          captchaToken,
          role: 'POLICE',
        }),
      });

      const data = await res.json();

      if (data.success) {
        loginUser(data.token, data.user);
        navigate('/police/dashboard');
      } else {
        setError(data.message || 'Login failed.');
        fetchCaptcha();
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
        
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '24px', left: '24px', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', padding: '0' }}
        >
          <ArrowLeft size={16} /> Home
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '20px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Landmark size={24} color="#d97706" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>Police Responder Sign In</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '4px' }}>
            Access law enforcement assigned SOS alerts
          </p>
        </div>

        {/* Demo Credential Quick Helper */}
        <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '20px', fontSize: '12px', color: '#b45309', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Demo Account: <strong>police</strong> / <strong>police123</strong></span>
          <button 
            type="button"
            onClick={() => { setUsername('police'); setPassword('police123'); }}
            style={{ background: '#d97706', color: '#fff', padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
          >
            Auto Fill
          </button>
        </div>

        {error && (
          <div className="alert-box alert-error">
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Officer Username</label>
            <input 
              type="text" 
              placeholder="Enter police username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Security Verification</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {captchaImage ? (
                <img 
                  src={captchaImage} 
                  alt="Captcha challenge" 
                  style={{ height: '42px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'block' }}
                />
              ) : (
                <div style={{ height: '42px', width: '130px', background: 'rgba(0,0,0,0.03)', borderRadius: '6px', border: '1px solid var(--border-color)' }}></div>
              )}
              <button 
                type="button" 
                onClick={fetchCaptcha} 
                className="btn-outline" 
                style={{ height: '42px', width: '42px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#d97706', color: '#ffffff' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <Lock size={16} /> Secure Sign In
              </>
            )}
          </button>

        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          Note: Police responder accounts must be registered and authorized by the Central Command.
        </div>

      </div>
    </div>
  );
};

export default PoliceLogin;
