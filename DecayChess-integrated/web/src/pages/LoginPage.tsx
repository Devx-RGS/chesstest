import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, storeAuth } from '../lib/api';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      storeAuth(data.token, data.user);
      navigate('/lobby');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo-icon">♛</div>
          <h1 className="app-title">DecayChess</h1>
          <p className="app-subtitle">Where pieces fade under pressure</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Logging in...' : 'Play DecayChess'}
          </button>
        </form>

        <div className="login-footer">
          <p className="rules-hint">
            ♛ Move your queen → 25s decay timer starts<br />
            ❄ Timer expires → piece freezes permanently<br />
            ♜ After queen freezes → major pieces start decaying
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
