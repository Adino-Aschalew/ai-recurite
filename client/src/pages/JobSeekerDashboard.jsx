import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

const JobSeekerDashboard = () => {
  const [stats, setStats] = useState({
    cvs: 0,
    applications: 0,
    avgScore: 0
  });

  const { data: cvs, isLoading: cvsLoading } = useQuery('my-cvs', async () => {
    const response = await api.get('/cvs/job-seeker');
    return response.data;
  });

  const { data: applications, isLoading: appsLoading } = useQuery('my-applications', async () => {
    const response = await api.get('/applications/my-applications');
    return response.data;
  });

  useEffect(() => {
    if (cvs && applications) {
      const scores = applications
        .filter(app => app.overall_score)
        .map(app => app.overall_score);
      
      setStats({
        cvs: cvs.length,
        applications: applications.length,
        avgScore: scores.length > 0 
          ? (scores.reduce((a, b) => Number(a) + Number(b), 0) / scores.length).toFixed(1)
          : 0
      });
    }
  }, [cvs, applications]);

  const latestCV = cvs?.find(cv => cv.is_current) || cvs?.[0];
  const recentApplications = applications?.slice(0, 5) || [];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Your Career Hub</h1>
          <p>Track your applications and AI-powered CV performance.</p>
        </div>
        <Link to="/jobs" className="btn-primary">
          Explore New Roles
        </Link>
      </header>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Documents</h3>
          <p className="stat-value">{stats.cvs}</p>
          <span className="stat-label">Active CVs in system</span>
        </div>
        <div className="stat-card">
          <h3>Active Applications</h3>
          <p className="stat-value">{stats.applications}</p>
          <span className="stat-label">Jobs you've applied for</span>
        </div>
        <div className="stat-card">
          <h3>AI Talent Score</h3>
          <p className="stat-value">{stats.avgScore}%</p>
          <span className="stat-label">Average match across jobs</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link to="/my-applications" className="btn-secondary">View All Applications</Link>
          </div>
          
          {appsLoading ? (
            <div className="empty-state">Loading your applications...</div>
          ) : recentApplications.length > 0 ? (
            <div className="applications-list">
              {recentApplications.map(app => (
                <div key={app.id} className="application-item">
                  <div className="item-content">
                    <h4>{app.title || app.job_title}</h4>
                    <p>{app.company_name} • Applied on {new Date(app.applied_at).toLocaleDateString()}</p>
                  </div>
                  {app.overall_score && (
                    <div className="score-badge">
                      {Number(app.overall_score).toFixed(0)}% Match
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven't applied to any jobs yet.</p>
              <Link to="/jobs" className="btn-primary">Find Your First Job</Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Your Portfolio</h2>
          </div>
          
          {cvsLoading ? (
            <div className="empty-state">Loading documents...</div>
          ) : latestCV ? (
            <div className="cv-preview">
              <div className="file-icon" style={{fontSize: '3rem', marginBottom: '1rem'}}>📄</div>
              <h3>{latestCV.file_name}</h3>
              <p>Last updated: {new Date(latestCV.created_at).toLocaleDateString()}</p>
              <div style={{display: 'flex', gap: '1rem', marginTop: '1rem'}}>
                <Link to={`/cv/${latestCV.id}`} className="btn-secondary">View Analysis</Link>
                <Link to="/cv/upload" className="btn-primary">Update</Link>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No CV found. Upload one to start applying.</p>
              <Link to="/cv/upload" className="btn-primary">Upload CV Now</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
