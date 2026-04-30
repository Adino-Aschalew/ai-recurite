import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';
import api from '../services/api';
import CVScoreCard from '../components/CVScoreCard';
import './CVView.css';

const CVView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [upvotes, setUpvotes] = useState(12);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [notes, setNotes] = useState([
    { author: 'Sarah (HR Manager)', date: '2026-04-28', content: 'Strong technical background, but needs to work on team leading experience.' },
    { author: 'John (Tech Lead)', date: '2026-04-29', content: 'Excellent React skills. The AI match score seems very accurate for this candidate.' }
  ]);

  const handleUpvote = () => {
    if (!hasUpvoted) {
      setUpvotes(upvotes + 1);
      setHasUpvoted(true);
      toast.success('Candidate upvoted!');
    }
  };

  const { data: cv, isLoading } = useQuery(['cv', id], async () => {
    const response = await api.get(`/cvs/${id}`);
    return response.data;
  });

  const handleAddNote = () => {
    if (!note.trim()) return;
    const newNote = {
      author: 'You (Recruiter)',
      date: new Date().toISOString().split('T')[0],
      content: note.trim()
    };
    setNotes([newNote, ...notes]);
    setNote('');
    toast.success('Note added successfully!');
  };

  if (isLoading) {
    return <div className="empty-state">Analyzing candidate profile...</div>;
  }

  if (!cv) {
    return <div className="empty-state">Candidate profile not found.</div>;
  }

  const extractedData = cv.extracted_data || {};
  const latestScore = cv.scores?.[0];

  return (
    <div className="cv-view-container">
      <header className="cv-view-header">
        <div>
          <h1>Candidate Intelligence</h1>
          <p style={{color: 'var(--gray)', marginTop: '0.5rem'}}>AI-Powered Profile Analysis & Collaborative Review</p>
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button 
            onClick={handleUpvote} 
            className={`btn-secondary ${hasUpvoted ? 'active' : ''}`}
            style={{borderColor: hasUpvoted ? 'var(--primary)' : '', color: hasUpvoted ? 'var(--primary)' : ''}}
          >
            <svg style={{width: '20px'}} fill={hasUpvoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            Upvote ({upvotes})
          </button>
          <button onClick={() => navigate(-1)} className="btn-secondary">
            Back to List
          </button>
        </div>
      </header>

      <div className="cv-view-grid">
        <div className="cv-main">
          <div className="info-section">
            <h2>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Basic Information
            </h2>
            <div className="info-row">
              <span className="info-label">Full Name</span>
              <span className="info-value">{extractedData.basicInfo?.name || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email Address</span>
              <span className="info-value">{extractedData.basicInfo?.email || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Phone Number</span>
              <span className="info-value">{extractedData.basicInfo?.phone || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Uploaded On</span>
              <span className="info-value">{new Date(cv.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="info-section">
            <h2>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Core Expertise & Skills
            </h2>
            <div className="skills-tags">
              {(extractedData.skills || []).map((skill, idx) => (
                <span key={idx} className="skill-tag">{skill.toUpperCase()}</span>
              ))}
            </div>
          </div>

          {extractedData.experience && (
            <div className="info-section">
              <h2>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Professional Background
              </h2>
              <div className="info-row">
                <span className="info-label">Total Experience</span>
                <span className="info-value">{extractedData.experience.totalYears || 0} Years</span>
              </div>
              <div style={{marginTop: '1.5rem'}}>
                <h4 style={{marginBottom: '1rem', color: 'var(--gray)'}}>Recent Roles</h4>
                <div className="skills-tags">
                  {(extractedData.experience.jobTitles || []).map((title, idx) => (
                    <span key={idx} className="skill-tag" style={{background: '#f8fafc', color: 'var(--primary)'}}>{title}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {latestScore && (
            <CVScoreCard
              score={latestScore.overall_score}
              breakdown={latestScore.score_breakdown}
              suggestions={latestScore.suggestions?.split('\n')}
            />
          )}
        </div>

        <div className="cv-sidebar">
          <div className="info-section notes-section">
            <h2>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
              Internal Notes
            </h2>
            <div className="notes-list">
              {notes.map((n, i) => (
                <div key={i} className="note-item">
                  <div className="note-header">
                    <span className="note-author">{n.author}</span>
                    <span className="note-date">{n.date}</span>
                  </div>
                  <div className="note-content">{n.content}</div>
                </div>
              ))}
            </div>
            <div className="add-note-area">
              <textarea
                placeholder="Add an internal note or feedback..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button onClick={handleAddNote} className="btn-primary" style={{width: '100%', justifyContent: 'center'}}>
                Post Note
              </button>
            </div>
          </div>

          <div className="video-analysis-card">
            <h3 style={{fontSize: '1.25rem', fontWeight: '800'}}>AI Video Analysis</h3>
            <div className="video-placeholder">
              <svg style={{width: '48px', opacity: 0.5}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <div className="analysis-pills">
              <span className="analysis-pill">Confidence: 94%</span>
              <span className="analysis-pill">Tone: Professional</span>
            </div>
            <p style={{fontSize: '0.8125rem', opacity: 0.9}}>Candidate shows strong communication skills and positive body language.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVView;
