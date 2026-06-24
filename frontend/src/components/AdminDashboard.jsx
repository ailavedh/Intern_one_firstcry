import React, { useState, useEffect } from 'react';
import { Users, Shield, Baby, BookOpen, BrainCircuit, PlusCircle, AlertCircle } from 'lucide-react';

export default function AdminDashboard({ activeTab, allUsers, refreshUsers, setAllUsers, currentUser }) {
  const PRIMARY_ADMIN_EMAIL = 'ailavedhsathvik2007@gmail.com';
  const isPrimaryAdmin = currentUser?.email === PRIMARY_ADMIN_EMAIL;
  const [childrenList, setChildrenList] = useState([]);
  const [stats, setStats] = useState({ users: 0, children: 0, activities: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-dismiss alerts after 5 seconds
  useEffect(() => {
    let timer;
    if (success || error) {
      timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [success, error]);

  // Form states for New User
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'teacher', password: '' });

  // Form states for New Child
  const [childForm, setChildForm] = useState({ name: '', age: '', class_name: '', parent_username: '' });

  // Fetch children list
  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children');
      if (res.ok) {
        const data = await res.json();
        setChildrenList(data);
      }
    } catch (err) {
      console.error('Error fetching children:', err);
    }
  };

  // Fetch stats summary
  const fetchStats = async () => {
    try {
      const usersRes = await fetch('/api/users');
      const childrenRes = await fetch('/api/children');
      const actRes = await fetch('/api/activities');
      if (usersRes.ok && childrenRes.ok && actRes.ok) {
        const u = await usersRes.json();
        const c = await childrenRes.json();
        const a = await actRes.json();
        setStats({
          users: u.length,
          children: c.length,
          activities: a.length
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchChildren();
  }, [allUsers]);

  // Handle creating a new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!userForm.name || !userForm.email || !userForm.password) {
      setError('Please fill in all user details.');
      return;
    }

    if (userForm.password.length < 8 || !/[A-Z]/.test(userForm.password) || !/[a-z]/.test(userForm.password) || !/[0-9]/.test(userForm.password) || !/[^A-Za-z0-9]/.test(userForm.password)) {
      setError('Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(`User "${data.name}" created successfully!`);
        setUserForm({ name: '', email: '', role: 'teacher', password: '' });
        refreshUsers();
      } else {
        setError(data.error || 'Failed to create user.');
      }
    } catch (err) {
      setError('Network error occurred.');
    }
  };

  // Handle creating a new child
  const handleCreateChild = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!childForm.name || !childForm.age || !childForm.class_name || !childForm.parent_username) {
      setError('Please fill in all child details and provide the Parent Username.');
      return;
    }

    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(childForm)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(`Child "${data.name}" registered successfully!`);
        setChildForm({ name: '', age: '', class_name: '', parent_username: '' });
        fetchChildren();
        fetchStats();
      } else {
        setError(data.error || 'Failed to register child.');
      }
    } catch (err) {
      setError('Network error occurred.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user account?')) {
      return;
    }
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/users/${userId}?requesterEmail=${encodeURIComponent(currentUser?.email || '')}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('User account deleted successfully.');
        refreshUsers(); // Sync with backend
        fetchStats();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete user.');
      }
    } catch (err) {
      setError('Network communication error.');
    }
  };

  const handleDeleteChild = async (childId) => {
    if (!window.confirm('Are you sure you want to delete this child record? This will delete all activities logged.')) {
      return;
    }
    setError('');
    setSuccess('');
    
    try {
      // First delete related activities to avoid foreign key constraints (if running on SQLite without cascade)
      await fetch(`/api/activities/child/${childId}`, { method: 'DELETE' }).catch(() => {});
      const res = await fetch(`/api/children/${childId}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('Student record deleted successfully.');
        fetchChildren(); // Sync with backend
        fetchStats();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete student.');
      }
    } catch (err) {
      setError('Network communication error.');
    }
  };

  const parentUsers = allUsers.filter(u => u.role === 'parent');

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Administrative Dashboard</h2>
          <p className="text-muted">Configure and manage users, students, and parent relationships.</p>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary)' }}>
            <Users size={20} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Total Users</p>
            <h3 className="stat-value">{stats.users}</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-success)' }}>
            <Baby size={20} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Registered Children</p>
            <h3 className="stat-value">{stats.children}</h3>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-secondary)' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Logged Activities</p>
            <h3 className="stat-value">{stats.activities}</h3>
          </div>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <AlertCircle style={{ color: 'var(--color-danger)' }} />
          <span style={{ color: 'var(--color-danger)', fontWeight: '500' }}>{error}</span>
        </div>
      )}
      {success && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <AlertCircle style={{ color: 'var(--color-success)' }} />
          <span style={{ color: 'var(--color-success)', fontWeight: '500' }}>{success}</span>
        </div>
      )}

      {/* Main split grid */}
      <div className="dashboard-grid">
        {activeTab === 'users' ? (
          <>
            {/* User List Panel */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> System Accounts
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge ${
                            u.role === 'admin' ? 'badge-diaper' : 
                            u.role === 'teacher' ? 'badge-observation' : 
                            u.role === 'counsellor' ? 'badge-study' : 'badge-meal'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {(u.role !== 'admin' || (isPrimaryAdmin && u.email !== PRIMARY_ADMIN_EMAIL)) ? (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDeleteUser(u.id)}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Creation Form */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} /> Create User
              </h3>
              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. john@school.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="text"
                    className="form-input"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assigned Role</label>
                  <select
                    className="form-select"
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                    <option value="counsellor">Counsellor</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Create User Account
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            {/* Children List Panel */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Baby size={20} /> Registered Students
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Age</th>
                      <th>Class Name</th>
                      <th>Assigned Parent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {childrenList.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.age} years old</td>
                        <td>{c.class_name}</td>
                        <td>
                          {c.parent_name ? (
                            c.parent_name
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                              Pending: {c.parent_username}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteChild(c.id)}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {childrenList.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No children registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Child Registration Form */}
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} /> Register Child
              </h3>
              <form onSubmit={handleCreateChild}>
                <div className="form-group">
                  <label className="form-label">Child Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tommy Miller"
                    value={childForm.name}
                    onChange={(e) => setChildForm({ ...childForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5"
                    min="1"
                    max="12"
                    value={childForm.age}
                    onChange={(e) => setChildForm({ ...childForm, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Class Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Kindergarten Bluebirds"
                    value={childForm.class_name}
                    onChange={(e) => setChildForm({ ...childForm, class_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Username / Email</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. parent@school.com"
                    value={childForm.parent_username || ''}
                    onChange={(e) => setChildForm({ ...childForm, parent_username: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Register Student
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
