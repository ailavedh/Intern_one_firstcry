import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import LoginPortal from './components/LoginPortal';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ParentPortal from './components/ParentPortal';
import CounsellorDashboard from './components/CounsellorDashboard';
import ProfileModal from './components/ProfileModal';
export default function App() {
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Fetch the list of user accounts (primarily for Admin relation mapping)
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      } else {
        setError('Could not connect to database backend.');
      }
    } catch (err) {
      setError('Backend server is offline. Please launch backend/server.js.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const savedUser = sessionStorage.getItem('currentUser');
    const savedTab = sessionStorage.getItem('activeTab');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      if (savedTab) setActiveTab(savedTab);
      else setTabForRole(JSON.parse(savedUser).role);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      sessionStorage.setItem('activeTab', activeTab);
    } else {
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('activeTab');
    }
  }, [currentUser, activeTab]);

  // Premium dark mode is now default out-of-the-box in index.css

  // Set the default dashboard view tab based on role type
  const setTabForRole = (role) => {
    switch (role) {
      case 'admin':
        setActiveTab('users');
        break;
      case 'teacher':
        setActiveTab('roster');
        break;
      case 'parent':
        setActiveTab('timeline');
        break;
      case 'counsellor':
        setActiveTab('assessments');
        break;
      default:
        setActiveTab('');
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setTabForRole(user.role);
    fetchUsers(); // Refresh listings to ensure admin has newly registered parents
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('');
  };

  const handleThemeToggle = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Render correct dashboard component
  const renderDashboard = () => {
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case 'admin':
        return (
          <AdminDashboard 
            activeTab={activeTab} 
            allUsers={allUsers} 
            refreshUsers={fetchUsers} 
            setAllUsers={setAllUsers}
            currentUser={currentUser}
          />
        );
      case 'teacher':
        return (
          <TeacherDashboard 
            activeTab={activeTab} 
            currentUser={currentUser} 
          />
        );
      case 'parent':
        return (
          <ParentPortal 
            activeTab={activeTab} 
            currentUser={currentUser} 
          />
        );
      case 'counsellor':
        return (
          <CounsellorDashboard 
            currentUser={currentUser} 
          />
        );
      default:
        return (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <h2>Access Denied</h2>
            <p>Your role "{currentUser.role}" has no matching dashboard interface.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#6366f1', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <strong>Loading Dashboard Persona Directory...</strong>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: 'sans-serif', padding: '1rem' }}>
        <div className="card" style={{ maxWidth: '450px', textAlign: 'center', borderTop: '4px solid var(--color-danger)' }}>
          <h2 style={{ color: 'var(--color-danger)', marginBottom: '0.5rem' }}>Connection Offline</h2>
          <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            {error}
          </p>
          <button className="btn btn-primary" onClick={fetchUsers}>
            Retry Backend Handshake
          </button>
        </div>
      </div>
    );
  }

  // Render Login Gate if no active user session
  if (!currentUser) {
    return <LoginPortal onLoginSuccess={handleLoginSuccess} />;
  }

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  return (
    <div className="app-container">
      <Sidebar 
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />
      <main className="main-content" style={{ position: 'relative' }}>
        {/* Profile Icon Top Right */}
        <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', zIndex: 10 }}>
          <button 
            onClick={() => setIsProfileOpen(true)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              color: 'var(--color-primary)'
            }}
            title="Profile Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
        </div>

        {renderDashboard()}

        {isProfileOpen && (
          <ProfileModal 
            currentUser={currentUser} 
            onClose={() => setIsProfileOpen(false)} 
            onUpdateUser={handleUpdateUser}
          />
        )}
      </main>
    </div>
  );
}
