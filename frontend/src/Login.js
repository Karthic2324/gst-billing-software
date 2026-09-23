import React, { useState } from 'react';
import axios from 'axios';
import { setToken, setUser } from './auth';

const Login = ({ BASE_URL, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, { username, password });
      if (response.data && response.data.token) {
        setToken(response.data.token);
        setUser({ username: response.data.username, role: response.data.role });
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: '380px', padding: '32px', borderRadius: '12px', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#f8fafc' }}>GST Billing Studio</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>Sign in to create & manage invoices</p>
        
        {error && <div style={{ backgroundColor: '#ef444422', color: '#ef4444', border: '1px solid #ef4444', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            placeholder="admin or staff"
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            placeholder="admin123 or staff123"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-add-item" style={{ width: '100%', padding: '12px' }}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default Login;