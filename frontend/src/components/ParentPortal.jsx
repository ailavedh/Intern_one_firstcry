import React, { useState, useEffect } from 'react';
import { 
  Baby, 
  Clock, 
  Utensils, 
  Moon, 
  Sparkles, 
  Puzzle, 
  Heart, 
  FileHeart, 
  Activity, 
  Droplet 
} from 'lucide-react';

export default function ParentPortal({ activeTab, currentUser }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [activities, setActivities] = useState([]);
  const [counsellorNotes, setCounsellorNotes] = useState([]);

  // Fetch children mapped to this parent
  const fetchChildren = async () => {
    try {
      const res = await fetch(`/api/children?parentId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
        if (data.length > 0) {
          setSelectedChildId(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch activities of selected child
  const fetchActivities = async (childId) => {
    if (!childId) return;
    try {
      const res = await fetch(`/api/activities?childId=${childId}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch counselor logs
  const fetchCounsellorNotes = async (childId) => {
    if (!childId) return;
    try {
      const res = await fetch(`/api/counsellor/notes/${childId}`);
      if (res.ok) {
        const data = await res.json();
        setCounsellorNotes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchChildren();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedChildId) {
      fetchActivities(selectedChildId);
      fetchCounsellorNotes(selectedChildId);
    }
  }, [selectedChildId]);

  const activeChild = children.find(c => c.id === selectedChildId);

  // Icon switcher helper for activities
  const getActivityIcon = (type) => {
    switch (type) {
      case 'Meal': return <Utensils size={16} />;
      case 'Nap': return <Moon size={16} />;
      case 'Play': return <Puzzle size={16} />;
      case 'Study': return <Sparkles size={16} />;
      case 'Diaper': return <Heart size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'Meal': return 'var(--color-success)';
      case 'Nap': return 'var(--color-warning)';
      case 'Play': return 'var(--color-info)';
      case 'Study': return 'var(--color-secondary)';
      case 'Diaper': return 'var(--color-danger)';
      default: return 'var(--color-primary)';
    }
  };

  const getBadgeClass = (type) => {
    switch (type) {
      case 'Meal': return 'badge-meal';
      case 'Nap': return 'badge-nap';
      case 'Play': return 'badge-play';
      case 'Study': return 'badge-study';
      case 'Diaper': return 'badge-diaper';
      default: return 'badge-observation';
    }
  };

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Parent Portal</h2>
          <p className="text-muted">Stay connected to your children's development and daily schedules.</p>
        </div>

        {/* Child Selector Tabs */}
        {children.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            {children.map(c => (
              <button
                key={c.id}
                className={`btn ${selectedChildId === c.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: 'none' }}
                onClick={() => setSelectedChildId(c.id)}
              >
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeChild ? (
        <div>
          {/* Child Profile summary card */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', lineHeight: 1 }}>
                {activeChild.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{activeChild.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Age: {activeChild.age} years | Class: {activeChild.class_name}</p>
              </div>
            </div>

            {/* Simulated Live Trackers (e.g. hydration, rest) */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-info)' }}>
                  <Droplet size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Water Intake</span>
                  <strong style={{ fontSize: '0.9rem' }}>{activeChild.water_intake || 'Not updated'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
                  <Moon size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Rest Logger</span>
                  <strong style={{ fontSize: '0.9rem' }}>{activeChild.rest || 'Not updated'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--color-secondary)' }}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Focus Meter</span>
                  <strong style={{ fontSize: '0.9rem' }}>{activeChild.focus || 'Not updated'}</strong>
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'timeline' ? (
            /* Timeline Tab */
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Clock size={20} /> Today's Activity Feed
              </h3>

              {activities.length > 0 ? (
                <div className="timeline">
                  {activities.map(a => (
                    <div key={a.id} className="timeline-item">
                      <div 
                        className="timeline-marker" 
                        style={{ borderColor: getMarkerColor(a.type), backgroundColor: 'var(--bg-secondary)' }}
                      ></div>
                      <div className="timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span className="timeline-time">
                            {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(a.timestamp).toLocaleDateString()}
                          </span>
                          <span className={`badge ${getBadgeClass(a.type)}`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {getActivityIcon(a.type)}
                            {a.type}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                          {a.description}
                        </p>
                        {a.photo_url && (
                          <img 
                            src={a.photo_url} 
                            alt={`${a.type} activity snapshot`} 
                            style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '0.5rem', marginTop: '1rem' }}
                          />
                        )}
                        <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          Logged by: {a.teacher_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Baby size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>No activity logs reported for {activeChild.name} today.</p>
                </div>
              )}
            </div>
          ) : (
            /* Counselor notes Tab */
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <FileHeart size={20} /> Counselor Guidance Reports
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {counsellorNotes.map(n => (
                  <div 
                    key={n.id} 
                    className="card" 
                    style={{ 
                      backgroundColor: 'var(--bg-secondary)', 
                      borderLeft: '4px solid var(--color-secondary)',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{n.counsellor_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          Assessment date: {new Date(n.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="badge badge-study">Active Report</span>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                        Observations
                      </h5>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {n.notes}
                      </p>
                    </div>

                    <div>
                      <h5 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                        Recommendations
                      </h5>
                      <p style={{ fontSize: '0.9375rem', color: 'var(--text-primary)', lineHeight: '1.5', padding: '0.75rem', backgroundColor: 'rgba(168, 85, 247, 0.05)', borderRadius: '0.5rem', border: '1px dashed rgba(168, 85, 247, 0.2)' }}>
                        {n.recommendations}
                      </p>
                    </div>
                  </div>
                ))}
                {counsellorNotes.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FileHeart size={36} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No developmental reports published for {activeChild.name} yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <p className="text-muted">No child records associated with this parent account.</p>
        </div>
      )}
    </div>
  );
}
