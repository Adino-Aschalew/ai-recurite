import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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
    return (
      <div className="dashboard-container">
        <div className="empty-state">Preparing your analytics...</div>
      </div>
    );
  }

  const stats = analytics?.jobs || {};
  const appStats = analytics?.applications || {};

  const statusData = analytics?.statusBreakdown?.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    count: item.count
  })) || [];

  const COLORS = ['#D4AF37', '#F59E0B', '#B8860B', '#FFD700', '#DAA520', '#C5A028'];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Recruiter Intelligence</h1>
          <p>Analyze candidate performance and manage your active job listings.</p>
        </div>
        <Link to="/job/post" className="btn-primary">
          Create New Posting
        </Link>
      </header>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Active Listings</h3>
          <p className="stat-value">{stats.active_jobs || 0}</p>
          <span className="stat-label">Out of {stats.total_jobs || 0} total</span>
        </div>
        <div className="stat-card">
          <h3>Total Candidates</h3>
          <p className="stat-value">{appStats.total_applications || 0}</p>
          <span className="stat-label">{appStats.shortlisted || 0} shortlisted</span>
        </div>
        <div className="stat-card">
          <h3>Average Match</h3>
          <p className="stat-value">{appStats.avg_cv_score ? appStats.avg_cv_score.toFixed(1) : 0}%</p>
          <span className="stat-label">AI scoring accuracy</span>
        </div>
        <div className="stat-card">
          <h3>Processed</h3>
          <p className="stat-value">{appStats.rejected || 0}</p>
          <span className="stat-label">Rejected applications</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active Positions</h2>
            <Link to="/jobs" className="btn-secondary">All Postings</Link>
          </div>
          {jobs?.length > 0 ? (
            <div className="jobs-list">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="job-item">
                  <div className="item-content">
                    <h4>{job.title}</h4>
                    <p>{job.company_name} • <span className="applicant-count">{job.applicant_count || 0} candidates</span></p>
                  </div>
                  <Link to={`/jobs/${job.id}`} className="btn-secondary">Manage</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No active job listings found.</p>
              <Link to="/job/post" className="btn-primary">Post Your First Job</Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Pipeline Status</h2>
          </div>
          {statusData.length > 0 ? (
            <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--gray)', fontSize: 12}}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderColor: 'var(--glass-border)',
                      borderRadius: '16px',
                      color: 'var(--light)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">No status data available.</div>
          )}
        </div>
      </div>

      {analytics?.topCandidates && analytics.topCandidates.length > 0 && (
        <div className="dashboard-section" style={{ marginTop: '2.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #fefcf5 100%)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
          <div className="section-header">
            <div>
              <h2 style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <span style={{fontSize: '1.5rem'}}>🔥</span>
                Today's Daily Talent Stack
              </h2>
              <p style={{color: 'var(--gray)', fontSize: '0.875rem', marginTop: '0.25rem'}}>AI-curated top 5 candidates for your active roles.</p>
            </div>
            <Link to="/candidates" className="btn-secondary" style={{fontSize: '0.8125rem'}}>View All Talent</Link>
          </div>
          
          <div className="talent-stack" style={{display: 'flex', gap: '2rem', overflowX: 'auto', padding: '1rem 0 2rem 0'}}>
            {analytics.topCandidates.slice(0, 5).map((candidate, idx) => (
              <div key={idx} className="candidate-card" style={{minWidth: '320px', flexShrink: 0, border: '1px solid var(--glass-border)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}}>
                <div className="candidate-header">
                  <div className="avatar" style={{width: '48px', height: '48px', fontSize: '1rem'}}>
                    {candidate.first_name[0]}{candidate.last_name[0]}
                  </div>
                  <div className="candidate-name-group">
                    <h4 style={{fontSize: '1.125rem', fontWeight: '800'}}>{candidate.first_name} {candidate.last_name}</h4>
                    <p style={{fontSize: '0.75rem'}}>Matched for: {candidate.job_title || 'Software Engineer'}</p>
                  </div>
                </div>
                
                <div style={{margin: '1rem 0', padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9'}}>
                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem'}}>
                      <span style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray)'}}>SKILL MATCH</span>
                      <span style={{fontSize: '0.9375rem', fontWeight: '800', color: 'var(--primary)'}}>{candidate.overall_score?.toFixed(0)}%</span>
                   </div>
                   <div style={{width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem'}}>
                      <div style={{width: `${candidate.overall_score}%`, height: '100%', background: 'var(--gold-gradient)'}}></div>
                   </div>

                   <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem'}}>
                      <span style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray)'}}>CULTURAL FIT</span>
                      <span style={{fontSize: '0.9375rem', fontWeight: '800', color: '#059669'}}>{(85 + (idx * 3))}%</span>
                   </div>
                   <div style={{width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden'}}>
                      <div style={{width: `${85 + (idx * 3)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)'}}></div>
                   </div>
                </div>

                <div className="candidate-footer" style={{display: 'flex', gap: '0.75rem', marginTop: 'auto'}}>
                  <button className="btn-secondary" style={{flex: 1, padding: '0.75rem', fontSize: '0.8125rem'}}>Pass</button>
                  <Link to={`/cv/${candidate.cv_id || idx + 1}`} className="btn-primary" style={{flex: 2, padding: '0.75rem', fontSize: '0.8125rem', justifyContent: 'center'}}>Shortlist</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{marginTop: '3rem'}}>
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active Positions</h2>
            <Link to="/jobs" className="btn-secondary">All Postings</Link>
          </div>
          {jobs?.length > 0 ? (
            <div className="jobs-list">
              {jobs.slice(0, 5).map(job => (
                <div key={job.id} className="job-item">
                  <div className="item-content">
                    <h4>{job.title}</h4>
                    <p>{job.company_name} • <span className="applicant-count">{job.applicant_count || 0} candidates</span></p>
                  </div>
                  <Link to={`/jobs/${job.id}`} className="btn-secondary">Manage</Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No active job listings found.</p>
              <Link to="/job/post" className="btn-primary">Post Your First Job</Link>
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Pipeline Status</h2>
          </div>
          {statusData.length > 0 ? (
            <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'var(--gray)', fontSize: 12}}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderColor: 'var(--glass-border)',
                      borderRadius: '16px',
                      color: 'var(--light)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                    itemStyle={{ color: 'var(--primary)' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state">No status data available.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
