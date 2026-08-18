import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Code, Terminal } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/login', { username, password });
      if (res.data.user.role === 'team') {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/challenge');
      } else {
        setError('Invalid team credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div className="glass-panel fade-in" style={{ padding: '40px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div className="flex-center" style={{ marginBottom: '20px', color: 'var(--accent-cyan)' }}>
          <Terminal size={48} />
        </div>
        <h1 className="heading-primary" style={{ fontSize: '2rem' }}>CODE THE OUTPUT</h1>
        <p className="text-muted" style={{ marginBottom: '30px', fontFamily: 'var(--font-mono)' }}>Think. Code. Execute.</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="TEAM ID (e.g., TEAM01)" 
              value={username} 
              onChange={(e) => setUsername(e.target.value.toUpperCase())}
              required 
            />
          </div>
          <div>
            <input 
              type="password" 
              className="input-field" 
              placeholder="PASSWORD" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          {error && <div className="text-red" style={{ fontSize: '0.9rem' }}>{error}</div>}
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
            {loading ? <span className="loader"></span> : 'LOGIN'}
          </button>
        </form>
        
        <p className="text-muted" style={{ marginTop: '30px', fontSize: '0.85rem' }}>
          15 Teams • One Question • One Chance
        </p>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <Link to="/admin-login" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>Admin Login</Link>
      </div>
    </div>
  );
};

export default Login;
