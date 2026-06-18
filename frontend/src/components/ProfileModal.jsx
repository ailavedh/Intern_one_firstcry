import React, { useState, useEffect } from 'react';
import { UserCircle2, X, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfileModal({ currentUser, onClose, onUpdateUser }) {
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    password: ''
  });
  const [children, setChildren] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser.role === 'parent') {
      fetch(`/api/children?parentId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => setChildren(data))
        .catch(err => console.error(err));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name || !formData.email) {
      setError('Username and email are required.');
      return;
    }

    if (formData.name === currentUser.name && formData.email === currentUser.email && !formData.password) {
      setError('You must change at least one field to update your profile.');
      return;
    }

    if (formData.password) {
      if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[^A-Za-z0-9]/.test(formData.password)) {
        setError('New password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.');
        return;
      }
    }

    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSuccess('Profile updated successfully!');
        // Update user state in App.jsx
        onUpdateUser({
          ...currentUser,
          name: formData.name,
          email: formData.email
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Network error while updating profile.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{ width: '450px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>
        
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <UserCircle2 size={24} /> Profile Settings
        </h2>

        {/* Display details */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
          <p><strong>Username:</strong> {currentUser.name}</p>
          <p><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{currentUser.role}</span></p>
          
          {currentUser.role === 'parent' && children.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>Children:</strong>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                {children.map(child => (
                  <li key={child.id}>{child.name} ({child.age} yrs, {child.class_name})</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '0.5rem' }}>
            <CheckCircle size={18} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              name="name" 
              className="form-input" 
              value={formData.name} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              name="email" 
              className="form-input" 
              value={formData.email} 
              onChange={handleChange} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password (leave blank to keep current)</label>
            <input 
              type="password" 
              name="password" 
              className="form-input" 
              placeholder="Enter new password"
              value={formData.password} 
              onChange={handleChange} 
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
