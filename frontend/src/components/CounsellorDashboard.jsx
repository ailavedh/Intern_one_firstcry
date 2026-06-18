import React, { useState, useEffect } from 'react';
import { BrainCircuit, Baby, ScrollText, CheckCircle2, ChevronRight, FileHeart, CalendarRange } from 'lucide-react';

export default function CounsellorDashboard({ currentUser }) {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childActivities, setChildActivities] = useState([]);
  const [notesHistory, setNotesHistory] = useState([]);

  // Form states
  const [notes, setNotes] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [toast, setToast] = useState('');

  const fetchChildren = async () => {
    try {
      const res = await fetch('/api/children');
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

  const fetchChildLogs = async (childId) => {
    if (!childId) return;
    try {
      // Fetch teacher activity history
      const actRes = await fetch(`/api/activities?childId=${childId}`);
      if (actRes.ok) {
        const data = await actRes.json();
        setChildActivities(data);
      }

      // Fetch counselor assessment history
      const noteRes = await fetch(`/api/counsellor/notes/${childId}`);
      if (noteRes.ok) {
        const data = await noteRes.json();
        setNotesHistory(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchChildLogs(selectedChildId);
    }
  }, [selectedChildId]);

  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    if (!notes.trim() || !recommendations.trim()) {
      triggerToast('Please complete both observations and recommendations.');
      return;
    }

    try {
      const res = await fetch('/api/counsellor/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: selectedChildId,
          counsellorId: currentUser.id,
          notes,
          recommendations
        })
      });
      const data = await res.json();

      if (res.ok) {
        triggerToast('Assessment report published successfully!');
        setNotes('');
        setRecommendations('');
        fetchChildLogs(selectedChildId);
      } else {
        triggerToast(data.error || 'Failed to submit report.');
      }
    } catch (err) {
      triggerToast('Network communication error.');
    }
  };

  const activeChild = children.find(c => c.id === selectedChildId);

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Counsellor Assessment Console</h2>
          <p className="text-muted">Welcome, {currentUser?.name}. Select a student to compile reports.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Child Selector & History Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Child Picker Card */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Baby size={20} /> Active Students
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
              {children.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedChildId(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    backgroundColor: selectedChildId === c.id ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
                    borderColor: selectedChildId === c.id ? 'var(--color-primary)' : 'var(--border-color)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{c.name}</strong>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>Class: {c.class_name}</span>
                  </div>
                  <ChevronRight size={18} style={{ color: selectedChildId === c.id ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Log reviews */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <CalendarRange size={20} /> Classroom Logs History
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {childActivities.map(a => (
                <div key={a.id} style={{ padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', backgroundColor: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(a.timestamp).toLocaleDateString()}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{a.type}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.description}</p>
                </div>
              ))}
              {childActivities.length === 0 && (
                <p className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                  No teacher activities logged for this child.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Note Logging Form & Past Evaluations Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeChild && (
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <BrainCircuit size={20} style={{ color: 'var(--color-secondary)' }} /> New Developmental Assessment
              </h3>
              <form onSubmit={handleSubmitAssessment}>
                <div className="form-group">
                  <label className="form-label">Developmental Observations ({activeChild.name})</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Document behavioral progress, skills acquired, social milestones..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Actionable Recommendations</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Provide recommendations for home reinforcement or special exercises..."
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Submit & Publish Note
                </button>
              </form>
            </div>
          )}

          {/* Past Evaluations list */}
          <div className="card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FileHeart size={20} /> Evaluation Archives
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
              {notesHistory.map(n => (
                <div key={n.id} style={{ borderLeft: '3px solid var(--color-secondary)', paddingLeft: '0.75rem', margin: '0.25rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <strong>{n.counsellor_name}</strong>
                    <span>{new Date(n.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    <strong>Obs: </strong>{n.notes}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontStyle: 'italic' }}>
                    <strong>Rec: </strong>{n.recommendations}
                  </p>
                </div>
              ))}
              {notesHistory.length === 0 && (
                <p className="text-muted" style={{ fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>
                  No counselor notes archived for this child.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
