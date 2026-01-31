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

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      reviewing: '#3498db',
      shortlisted: '#27ae60',
      rejected: '#e74c3c',
      interviewed: '#9b59b6',
      offered: '#16a085',
      hired: '#2ecc71'
    };
    return colors[status] || '#999';
  };

  if (isLoading) {
    return <div className="applications"><p>Loading...</p></div>;
  }

  return (
    <div className="applications">
      <h1>My Applications</h1>
      
      {applications && applications.length > 0 ? (
        <div className="applications-list">
          {applications.map(app => (
            <div key={app.id} className="application-card">
              <div className="app-header">
                <div>
                  <h3>{app.title || app.job_title}</h3>
                  <p className="company">{app.company_name}</p>
                </div>
                <div className="app-meta">
                  {app.overall_score && (
                    <div className="score-badge">
                      {app.overall_score.toFixed(1)}%
                    </div>
                  )}
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(app.status) }}
                  >
                    {app.status}
                  </span>
                </div>
              </div>
              <div className="app-footer">
                <p className="applied-date">
                  Applied: {new Date(app.applied_at).toLocaleDateString()}
                </p>
                <Link to={`/jobs/${app.job_id}`} className="btn-secondary">
                  View Job
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No applications yet</p>
          <Link to="/jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      )}
    </div>
  );
};

export default Applications;
