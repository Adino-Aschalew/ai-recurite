import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Candidates.css';

const Candidates = () => {
  const [search, setSearch] = useState('');

  const { data: candidates, isLoading } = useQuery(['candidates', search], async () => {
    const response = await api.get('/cvs/all', { params: { search } });
    return response.data;
  });

  return (
    <div className="candidates-container">
      <header className="dashboard-header">
        <div>
          <h1>Talent Discovery</h1>
          <p>Search across your entire database of AI-processed candidates.</p>
        </div>
      </header>

      <div className="filters-bar">
        <div className="search-wrapper">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Search by name, email, skills, or experience..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="empty-state">Scanning talent pool...</div>
      ) : candidates?.length > 0 ? (
        <div className="candidates-grid">
          {candidates.map(candidate => (
            <div key={candidate.id} className="candidate-card">
              <div className="candidate-header">
                <div className="avatar">
                  {candidate.first_name[0]}{candidate.last_name[0]}
                </div>
                <div className="candidate-name-group">
                  <h3>{candidate.first_name} {candidate.last_name}</h3>
                  <p>{candidate.email}</p>
                </div>
              </div>

              <div className="skills-tags">
                {(candidate.extracted_data.skills || []).slice(0, 5).map((skill, i) => (
                  <span key={i} className="skill-tag">{skill}</span>
                ))}
                {(candidate.extracted_data.skills || []).length > 5 && (
                  <span className="skill-tag more">+{(candidate.extracted_data.skills || []).length - 5} more</span>
                )}
              </div>

              <div className="candidate-meta">
                <div className="meta-item">
                  <strong>Experience:</strong> {candidate.extracted_data.experience?.totalYears || 0} years
                </div>
                <div className="meta-item">
                  <strong>Education:</strong> {candidate.extracted_data.education?.highestDegree || 'N/A'}
                </div>
              </div>

              <div className="candidate-footer">
                <Link to={`/cv/${candidate.id}`} className="btn-primary">
                  View Full Profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No candidates found matching your search.</p>
          <button onClick={() => setSearch('')} className="btn-secondary">Reset Search</button>
        </div>
      )}
    </div>
  );
};

export default Candidates;
