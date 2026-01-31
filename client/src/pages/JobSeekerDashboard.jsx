import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import CVScoreCard from '../components/CVScoreCard.jsx';
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
          ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
          : 0
      });
    }
  }, [cvs, applications]);

  const latestCV = cvs?.find(cv => cv.is_current) || cvs?.[0];
  const recentApplications = applications?.slice(0, 5) || [];

  return (
    <div className="dashboard">
      <h1>Job Seeker Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>CVs Uploaded</h3>
          <p className="stat-value">{stats.cvs}</p>
        </div>
        <div className="stat-card">
          <h3>Applications</h3>
          <p className="stat-value">{stats.applications}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p className="stat-value">{stats.avgScore}%</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Latest CV</h2>
            <Link to="/cv/upload" className="btn-primary">Upload New CV</Link>
          </div>
          {cvsLoading ? (
            <p>Loading...</p>
          ) : latestCV ? (
            <div className="cv-preview">
              <h3>{latestCV.file_name}</h3>
              <p>Version {latestCV.version}</p>
              <Link to={`/cv/${latestCV.id}`} className="btn-secondary">View Details</Link>
            </div>
          ) : (
            <div className="empty-state">
              <p>No CV uploaded yet</p>
              <Link to="/cv/upload" className="btn-primary">Upload Your First CV</Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Applications</h2>
            <Link to="/my-applications" className="btn-secondary">View All</Link>
          </div>
          {appsLoading ? (
            <p>Loading...</p>
          ) : recentApplications.length > 0 ? (
            <div className="applications-list">
              {recentApplications.map(app => (
                <div key={app.id} className="application-item">
                  <div>
                    <h4>{app.title || app.job_title}</h4>
                    <p>{app.company_name}</p>
                  </div>
                  {app.overall_score && (
                    <div className="score-badge">
                      {app.overall_score.toFixed(1)}%
                    </div>
                  )}
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
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
