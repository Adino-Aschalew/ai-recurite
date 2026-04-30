import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './JobsList.css';

const JobsList = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');

  const { data: jobs, isLoading } = useQuery(
    ['jobs', status, search],
    async () => {
      const response = await api.get('/jobs', {
        params: { status, search }
      });
      return response.data;
    }
  );

  return (
    <div className="jobs-list-container">
      <header className="jobs-header">
        <div>
          <h1>Browse Opportunities</h1>
          <p style={{color: 'var(--gray)'}}>Discover roles that match your AI-scored talent profile.</p>
        </div>
      </header>
      
      <div className="filters-bar">
        <div className="search-wrapper">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search roles, skills, or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="search-wrapper">
          <svg style={{width: '18px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <input
            type="text"
            placeholder="Location..."
            className="search-input"
            style={{paddingLeft: '3rem !important'}}
          />
        </div>

        <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active Only</option>
          <option value="draft">Drafts</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="empty-state">Finding the best roles for you...</div>
      ) : jobs?.length > 0 ? (
        <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-tags">
                <span className="tag">{job.employment_type || 'Full-time'}</span>
                {job.location && <span className="tag">{job.location}</span>}
              </div>
              
              <h3>{job.title}</h3>
              
              <div className="job-info-row">
                <div className="info-item">
                  <svg style={{width: '16px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {job.company_name}
                </div>
                <div className="info-item">
                  <svg style={{width: '16px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {job.salary_min ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} ${job.currency}` : 'Competitive Salary'}
                </div>
              </div>

              <p className="job-description">{job.description}</p>
              
              <div className="job-footer">
                <span className="applicants-count">
                  {job.applicant_count || 0} candidates applied
                </span>
                <Link to={`/jobs/${job.id}`} className="btn-primary">
                  View Role
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No opportunities found matching your criteria.</p>
          <button onClick={() => setSearch('')} className="btn-secondary">Clear Search</button>
        </div>
      )}
    </div>
  );
};

export default JobsList;
