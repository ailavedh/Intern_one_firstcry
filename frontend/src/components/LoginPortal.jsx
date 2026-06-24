import React, { useState, useEffect } from 'react';
import { Baby, LogIn, UserPlus, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPortal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [forgotStep, setForgotStep] = useState(0); // 0=none, 1=email, 2=otp, 3=reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: ''
  });

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

  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!forgotEmail.trim()) return setError('Please enter your email.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('OTP sent to your email.');
        setForgotStep(2);
      } else setError(data.error || 'Failed to send OTP.');
    } catch (err) {
      setError('Network error.');
    } finally { setLoading(false); }
  };

  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!forgotOtp.trim()) return setError('Please enter the OTP.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('OTP verified. Please set a new password.');
        setForgotStep(3);
      } else setError(data.error || 'Invalid OTP.');
    } catch (err) {
      setError('Network error.');
    } finally { setLoading(false); }
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!forgotNewPassword || forgotNewPassword !== forgotConfirmPassword) {
      return setError('Passwords do not match.');
    }
    if (forgotNewPassword.length < 8 || !/[A-Z]/.test(forgotNewPassword) || !/[a-z]/.test(forgotNewPassword) || !/[0-9]/.test(forgotNewPassword) || !/[^A-Za-z0-9]/.test(forgotNewPassword)) {
      return setError('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.');
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Password updated successfully! You can now log in.');
        setTimeout(() => {
          setForgotStep(0);
          setUsername(forgotEmail);
          setPassword('');
        }, 1500);
      } else setError(data.error || 'Failed to reset password.');
    } catch (err) {
      setError('Network error.');
    } finally { setLoading(false); }
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
        {forgotStep > 0 ? (
          /* Forgot Password Flow */
          <div className="forgot-password-flow">
            {forgotStep === 1 && (
              <form onSubmit={handleForgotRequestOtp}>
                <div className="form-group">
                  <label className="form-label">Enter your registered email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. richard@gmail.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerifyOtp}>
                <div className="form-group">
                  <label className="form-label">Enter 6-digit OTP sent to your email</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123456"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotResetPassword}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Enter new password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and symbol.
                  </p>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Confirm new password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                  {loading ? 'Resetting...' : 'Create new password'}
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => { setForgotStep(0); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : !isRegister ? (
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

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setForgotStep(1); setError(''); setSuccess(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', textDecoration: 'underline', fontFamily: 'inherit' }}
              >
                Forgot Password?
              </button>
            </div>

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
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Create password"
                value={regForm.password}
                onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                disabled={loading}
              />
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.5rem', lineHeight: '1.4' }}>
                Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and symbol.
              </p>
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
