import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import './Dashboard.css';

const RecruiterDashboard = () => {
  const { data: analytics, isLoading } = useQuery('recruiter-analytics', async () => {
    const response = await api.get('/analytics/recruiter');
    return response.data;
  });

  const { data: jobs } = useQuery('my-jobs', async () => {
    const response = await api.get('/jobs', { params: { status: 'active' } });
    return response.data;
  });

  if (isLoading) {
    return <div className="dashboard"><p>Loading...</p></div>;
  }

  const stats = analytics?.jobs || {};
  const appStats = analytics?.applications || {};

  const statusData = analytics?.statusBreakdown?.map(item => ({
    name: item.status,
    count: item.count
  })) || [];

  return (
    <div className="dashboard">
      <h1>Recruiter Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <p className="stat-value">{stats.total_jobs || 0}</p>
          <p className="stat-label">{stats.active_jobs || 0} active</p>
        </div>
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-value">{appStats.total_applications || 0}</p>
          <p className="stat-label">{appStats.shortlisted || 0} shortlisted</p>
        </div>
        <div className="stat-card">
          <h3>Average CV Score</h3>
          <p className="stat-value">{appStats.avg_cv_score ? appStats.avg_cv_score.toFixed(1) : 0}%</p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p className="stat-value">{appStats.rejected || 0}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active Jobs</h2>
            <Link to="/job/post" className="btn-primary">Post New Job</Link>
          </div>
          {jobs?.length > 0 ? (
            <div className="jobs-list">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="job-item">
                  <div>
                    <h4>{job.title}</h4>
                    <p>{job.company_name}</p>
                    <p className="applicant-count">{job.applicant_count || 0} applicants</p>
                  </div>
                  <Link to={`/jobs/${job.id}`} className="btn-secondary">View</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No active jobs</p>
              <Link to="/job/post" className="btn-primary">Post Your First Job</Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <h2>Applications by Status</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>

      {analytics?.topCandidates && analytics.topCandidates.length > 0 && (
        <div className="dashboard-section">
          <h2>Top Candidates</h2>
          <div className="candidates-list">
            {analytics.topCandidates.slice(0, 5).map((candidate, idx) => (
              <div key={idx} className="candidate-item">
                <div>
                  <h4>{candidate.first_name} {candidate.last_name}</h4>
                  <p>{candidate.email}</p>
                </div>
                <div className="score-badge large">
                  {candidate.overall_score?.toFixed(1) || 'N/A'}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
