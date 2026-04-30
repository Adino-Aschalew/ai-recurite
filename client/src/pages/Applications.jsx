import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Applications.css';

const Applications = () => {
  const { data: applications, isLoading } = useQuery('my-applications', async () => {
    const response = await api.get('/applications/my-applications');
    return response.data;
  });

  const getStatusClass = (status) => {
    return `status-${status.toLowerCase()}`;
  };

  if (isLoading) {
    return (
      <div className="apps-container">
        <div className="empty-state">Loading your application history...</div>
      </div>
    );
  }

  return (
    <div className="apps-container">
      <header className="dashboard-header">
        <div>
          <h1>My Applications</h1>
          <p>Monitor your journey and AI matching scores for every role.</p>
        </div>
      </header>
      
      {applications && applications.length > 0 ? (
        <div className="apps-list">
          {applications.map(app => (
            <div key={app.id} className="application-card">
              <div className="app-header">
                <div className="app-title-group">
                  <h3>{app.title || app.job_title}</h3>
                  <p className="company">{app.company_name}</p>
                </div>
                <div className="app-meta-group">
                  {app.overall_score && (
                    <div className="score-badge">
                      {Number(app.overall_score).toFixed(0)}% AI Match
                    </div>
                  )}
                  <span className={`status-badge ${getStatusClass(app.status)}`}>
                    {app.status}
                  </span>
                </div>
              </div>
              
              <div className="app-footer">
                <div className="applied-date">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Applied on {new Date(app.applied_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <Link to={`/jobs/${app.job_id}`} className="btn-secondary">
                    View Job Posting
                  </Link>
                  {app.cv_id && (
                    <Link to={`/cv/${app.cv_id}`} className="btn-secondary">
                      View CV Analysis
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>You haven't submitted any applications yet.</p>
          <Link to="/jobs" className="btn-primary">Browse Open Roles</Link>
        </div>
      )}
    </div>
  );
};

export default Applications;
