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
    <div className="jobs-list">
      <h1>Job Listings</h1>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {isLoading ? (
        <p>Loading...</p>
      ) : jobs?.length > 0 ? (
        <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p className="company">{job.company_name}</p>
              <p className="location">{job.location || 'Location not specified'}</p>
              <p className="description">{job.description.substring(0, 150)}...</p>
              <div className="job-footer">
                <span className="applicants">{job.applicant_count || 0} applicants</span>
                <Link to={`/jobs/${job.id}`} className="btn-primary">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No jobs found</p>
        </div>
      )}
    </div>
  );
};

export default JobsList;
