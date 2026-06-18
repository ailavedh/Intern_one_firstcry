import React, { useState, useEffect, useRef } from 'react';
import { Baby, CalendarDays, PlusCircle, CheckCircle, Upload, X, Trash2 } from 'lucide-react';

export default function TeacherDashboard({ activeTab, currentUser }) {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedKids, setSelectedKids] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [activityType, setActivityType] = useState('Meal');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [toast, setToast] = useState('');

  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsChildId, setStatsChildId] = useState(null);
  const [statsForm, setStatsForm] = useState({ water_intake: '', rest: '', focus: '' });

  const fileInputRef = useRef(null);

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children');
      if (res.ok) setChildren(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/activities');
      if (res.ok) setActivities(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchChildren();
    fetchActivities();
  }, []);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const toggleSelectKid = (id) => {
    if (selectedKids.includes(id)) setSelectedKids(selectedKids.filter(kId => kId !== id));
    else setSelectedKids([...selectedKids, id]);
  };

  const handleSelectAll = () => setSelectedKids(children.map(c => c.id));
  const handleClearSelection = () => setSelectedKids([]);

  const handleSubmitActivity = async (e) => {
    e.preventDefault();
    if (selectedKids.length === 0) return triggerToast('Please select at least one student.');
    if (!description.trim()) return triggerToast('Please write a short description.');

    const formData = new FormData();
    formData.append('childIds', JSON.stringify(selectedKids));
    formData.append('teacherId', currentUser.id);
    formData.append('type', activityType);
    formData.append('description', description);
    if (photoFile) formData.append('photo', photoFile);

    try {
      const res = await fetch('/api/activities', { method: 'POST', body: formData });
      if (res.ok) {
        triggerToast(`Successfully logged activity!`);
        setShowModal(false);
        setDescription('');
        setPhotoFile(null);
        setPhotoPreview(null);
        setSelectedKids([]);
        fetchActivities();
      } else {
        triggerToast('Failed to save log.');
      }
    } catch (err) { triggerToast('Error connecting to backend API.'); }
  };

  // COMPLETELY DYNAMIC DELETE FUNCTION
  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity log?')) return;

    // Instantly remove it from the screen for a dynamic feel
    setActivities(prev => prev.filter(a => a.id !== activityId));

    try {
      const res = await fetch(`/api/activities/${activityId}`, { method: 'DELETE' });
      if (!res.ok) {
        triggerToast('Failed to delete from database.');
        fetchActivities(); // Put it back on screen if database failed
      }
    } catch (err) {
      triggerToast('Network error while deleting.');
      fetchActivities(); // Put it back on screen if network failed
    }
  };

  const openDirectLog = (childId) => {
    setSelectedKids([childId]);
    setShowModal(true);
  };

  const openStatsModal = (childId) => {
    const child = children.find(c => c.id === childId);
    setStatsChildId(childId);
    setStatsForm({
      water_intake: child.water_intake || '',
      rest: child.rest || '',
      focus: child.focus || ''
    });
    setShowStatsModal(true);
  };

  const handleStatsSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/children/${statsChildId}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statsForm)
      });
      if (res.ok) {
        triggerToast('Stats updated successfully!');
        setShowStatsModal(false);
        fetchChildren();
      } else {
        triggerToast('Failed to update stats.');
      }
    } catch (err) {
      triggerToast('Error connecting to backend API.');
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
          <h2 className="dashboard-title">Teacher Portal</h2>
          <p className="text-muted">Welcome back, {currentUser?.name}.</p>
        </div>
      </div>

      {activeTab === 'roster' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Baby size={20} /> Students Roster
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={handleSelectAll}>Select All</button>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={handleClearSelection}>Clear</button>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} 
                onClick={() => {
                  if(selectedKids.length === 0) return triggerToast('Please select at least one student first.');
                  setShowModal(true);
                }}
              >
                <PlusCircle size={16} /> Log Selected
              </button>
            </div>
          </div>
          <div className="roster-grid">
            {children.map(c => {
              const isSelected = selectedKids.includes(c.id);
              return (
                <div key={c.id} className={`roster-card ${isSelected ? 'selected' : ''}`} onClick={() => toggleSelectKid(c.id)}>
                  <input type="checkbox" className="roster-card-checkbox" checked={isSelected} readOnly onClick={(e) => e.stopPropagation()} />
                  <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '0.25rem' }}>{c.name}</h4>
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem' }}>{c.class_name}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', flex: 1 }} onClick={(e) => { e.stopPropagation(); openDirectLog(c.id); }}>Activity</button>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.5rem', fontSize: '0.75rem', flex: 1 }} onClick={(e) => { e.stopPropagation(); openStatsModal(c.id); }}>Stats</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <CalendarDays size={20} /> Class Logs History
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activities.map(a => (
              <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(a.timestamp).toLocaleString()}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.25rem' }}>{a.child_name}</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className={`badge ${getBadgeClass(a.type)}`}>{a.type}</span>
                    {/* TRASH CAN BUTTON FOR DYNAMIC DELETE */}
                    <button onClick={() => handleDeleteActivity(a.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete Log">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{a.description}</p>
              </div>
            ))}
            {activities.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No activities logged yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Activity Logging Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <PlusCircle size={20} className="text-primary" /> Log New Activity
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmitActivity}>
              <div className="form-group">
                <label className="form-label">Activity Type</label>
                <select className="form-select" value={activityType} onChange={e => setActivityType(e.target.value)}>
                  <option value="Meal">Meal</option>
                  <option value="Nap">Nap</option>
                  <option value="Play">Play</option>
                  <option value="Study">Study</option>
                  <option value="Diaper">Diaper</option>
                  <option value="Observation">Observation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  rows="3" 
                  placeholder="What did they do?..." 
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label">Photo (Optional)</label>
                <div style={{ border: '2px dashed var(--border-color)', borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.01)' }} onClick={() => fileInputRef.current.click()}>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    accept="image/*" 
                    onChange={e => {
                      if (e.target.files[0]) {
                        setPhotoFile(e.target.files[0]);
                        setPhotoPreview(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                  />
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: '0.5rem' }} />
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Upload size={24} style={{ margin: '0 auto 0.5rem' }} />
                      <span style={{ fontSize: '0.85rem' }}>Click to upload photo</span>
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Activity Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Stats Update Modal */}
      {showStatsModal && (
        <div className="modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <CheckCircle size={20} className="text-primary" /> Update Daily Stats
              </h3>
              <button onClick={() => setShowStatsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleStatsSubmit}>
              <div className="form-group">
                <label className="form-label">Water Intake (e.g., 500ml)</label>
                <input type="text" className="form-input" value={statsForm.water_intake} onChange={e => setStatsForm({ ...statsForm, water_intake: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Rest (e.g., 2 hrs)</label>
                <input type="text" className="form-input" value={statsForm.rest} onChange={e => setStatsForm({ ...statsForm, rest: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Focus (e.g., Excellent)</label>
                <input type="text" className="form-input" value={statsForm.focus} onChange={e => setStatsForm({ ...statsForm, focus: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Save Stats
              </button>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}