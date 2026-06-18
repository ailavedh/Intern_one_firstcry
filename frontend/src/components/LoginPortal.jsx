import React, { useState, useEffect } from 'react';
import { Baby, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPortal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    childId: ''
  });

  const [unassignedChildren, setUnassignedChildren] = useState([]);

  useEffect(() => {
    if (isRegister) {
      fetchUnassignedChildren();
    }
  }, [isRegister]);

  const fetchUnassignedChildren = async () => {
    try {
      const res = await fetch('/api/children/unassigned');
      if (res.ok) {
        const data = await res.json();
        setUnassignedChildren(data);
      }
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Authentication successful! Logging in...');
        setTimeout(() => {
          onLoginSuccess(data);
        }, 800);
      } else {
        setError(data.error || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Backend database is currently offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!regForm.name.trim() || !regForm.email.trim() || !regForm.password.trim()) {
      setError('Please fill in all details to register.');
      return;
    }

    if (regForm.password.length < 8 || !/[A-Z]/.test(regForm.password) || !/[a-z]/.test(regForm.password) || !/[0-9]/.test(regForm.password) || !/[^A-Za-z0-9]/.test(regForm.password)) {
      setError('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Account registered successfully! You can now sign in.');
        setTimeout(() => {
          setIsRegister(false);
          setUsername(regForm.email);
          setPassword(regForm.password);
        }, 1200);
      } else {
        setError(data.error || 'Failed to create account.');
      }
    } catch (err) {
      setError('Database communication error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '1rem',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Baby size={32} />
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem'
          }}>
            Daily Activity Portal
          </h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Welcome to the portal
          </p>
        </div>

        {/* Success/Error Notices */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderLeft: '4px solid var(--color-danger)',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            color: 'var(--color-danger)'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderLeft: '4px solid var(--color-success)',
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            color: 'var(--color-success)'
          }}>
            <Sparkles size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Authentication forms switcher */}
        {!isRegister ? (
          /* Sign In Form */
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Enter username or email</label>
              <input
                type="text"
                className="form-input"
                placeholder=""
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              <LogIn size={18} /> {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Create Account
                </button>
              </span>
            </div>
          </form>
        ) : (
          /* Create Account Form */
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Richard Vance"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Username)</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. richard@gmail.com"
                value={regForm.email}
                onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Your Child</label>
              <select
                className="form-select"
                value={regForm.childId}
                onChange={(e) => setRegForm({ ...regForm, childId: e.target.value })}
                disabled={loading}
              >
                <option value="">-- Select Child --</option>
                {unassignedChildren.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.class_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Create password"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={loading}
            >
              <UserPlus size={18} /> {loading ? 'Registering...' : 'Create Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Sign In
                </button>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
