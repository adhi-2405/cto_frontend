import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { ShieldAlert } from 'lucide-react';

const AdminLogin = () => {
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
      if (res.data.user.role === 'admin') {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/admin');
      } else {
        setError('Admin privileges required.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div className="glass-panel fade-in" style={{ padding: '40px', width: '100%', maxWidth: '420px', textAlign: 'center', borderColor: 'var(--border-glow)' }}>
        <div className="flex-center" style={{ marginBottom: '20px', color: 'var(--accent-red)' }}>
          <ShieldAlert size={48} />
        </div>
        <h1 className="heading-secondary" style={{ color: 'var(--accent-red)' }}>CONTROL CENTER</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
          <div>
            <input 
              type="text" 
              className="input-field" 
              placeholder="ADMIN USERNAME" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
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
          
          <button type="submit" className="btn btn-danger" disabled={loading} style={{ width: '100%', padding: '14px' }}>
            {loading ? <span className="loader"></span> : 'SECURE LOGIN'}
          </button>
        </form>
      </div>
      
      <div style={{ marginTop: '40px' }}>
        <Link to="/" className="text-muted" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>Back to Event</Link>
      </div>
    </div>
  );
};

export default AdminLogin;
