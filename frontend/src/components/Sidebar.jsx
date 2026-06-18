import React from 'react';
import { 
  Shield, 
  BookOpen, 
  Users, 
  BrainCircuit, 
  Sun, 
  Moon, 
  UserCircle2, 
  ChevronDown,
  LayoutDashboard,
  CalendarDays,
  FileHeart,
  Baby
} from 'lucide-react';

export default function Sidebar({ 
  currentUser, 
  theme, 
  onThemeToggle,
  activeTab,
  setActiveTab,
  onLogout
}) {
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield size={18} />;
      case 'teacher': return <BookOpen size={18} />;
      case 'parent': return <Users size={18} />;
      case 'counsellor': return <BrainCircuit size={18} />;
      default: return <UserCircle2 size={18} />;
    }
  };

  const getMenuOptions = (role) => {
    switch (role) {
      case 'admin':
        return [
          { id: 'users', label: 'Manage Users', icon: <Users size={18} /> },
          { id: 'children', label: 'Manage Children', icon: <Baby size={18} /> }
        ];
      case 'teacher':
        return [
          { id: 'roster', label: 'Student Portal', icon: <Baby size={18} /> },
          { id: 'activities', label: 'Activity Logs', icon: <CalendarDays size={18} /> }
        ];
      case 'parent':
        return [
          { id: 'timeline', label: 'Activity Timeline', icon: <CalendarDays size={18} /> },
          { id: 'counsellor', label: 'Counsellor Notes', icon: <FileHeart size={18} /> }
        ];
      case 'counsellor':
        return [
          { id: 'assessments', label: 'Child Assessments', icon: <BrainCircuit size={18} /> }
        ];
      default:
        return [];
    }
  };

  const menuOptions = getMenuOptions(currentUser?.role);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Baby size={24} />
        <span>Daily Activity Portal</span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Menu Navigation */}
        <ul className="sidebar-menu">
          <li style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
            Menu
          </li>
          {menuOptions.map((opt) => (
            <li key={opt.id}>
              <button
                className={`sidebar-item ${activeTab === opt.id ? 'active' : ''}`}
                onClick={() => setActiveTab(opt.id)}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* User Settings & Log Out */}
        <div className="role-switcher-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Settings
            </span>
          </div>

          {/* Active User Card with Log Out option */}
          {currentUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  width: '2.25rem', 
                  height: '2.25rem', 
                  borderRadius: '50%', 
                  backgroundColor: currentUser.role === 'admin' ? 'var(--color-danger)' : 
                                   currentUser.role === 'teacher' ? 'var(--color-primary)' : 
                                   currentUser.role === 'counsellor' ? 'var(--color-secondary)' : 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {currentUser.name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                    {getRoleIcon(currentUser.role)}
                    <span>{currentUser.role}</span>
                  </div>
                </div>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={onLogout}
                style={{ 
                  width: '100%', 
                  padding: '0.4rem', 
                  fontSize: '0.8rem', 
                  backgroundColor: 'transparent', 
                  color: 'var(--text-primary)', 
                  borderColor: 'var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
