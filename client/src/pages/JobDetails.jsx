import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './JobDetails.css';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCV, setSelectedCV] = useState('');
  const [skillGap, setSkillGap] = useState(null);

  const { data: job, isLoading } = useQuery(['job', id], async () => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  });

  const { data: myCVs } = useQuery('my-cvs', async () => {
    if (user?.role === 'job_seeker') {
      const response = await api.get('/cvs/job-seeker');
      return response.data;
    }
    return [];
  }, { enabled: user?.role === 'job_seeker' });

  useEffect(() => {
    if (job && myCVs && myCVs.length > 0) {
      const currentCV = myCVs.find(cv => cv.is_current) || myCVs[0];
      const userSkills = (currentCV.extracted_data?.skills || []).map(s => s.toLowerCase());
      const jobSkills = (job.required_skills || []).map(s => s.toLowerCase());

      const matched = jobSkills.filter(s => userSkills.includes(s));
      const missing = jobSkills.filter(s => !userSkills.includes(s));

      setSkillGap({ matched, missing });
    }
  }, [job, myCVs]);

  const applyMutation = useMutation(
    async () => {
      const response = await api.post(`/applications/job/${id}`, {
        cvId: parseInt(selectedCV)
      });
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-applications');
        toast.success('Application submitted successfully!');
        navigate('/my-applications');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Application failed');
      }
    }
  );

  if (isLoading) {
    return <div className="empty-state">Loading job details...</div>;
  }

  if (!job) {
    return <div className="empty-state">Job not found.</div>;
  }

  const canApply = user?.role === 'job_seeker' && myCVs && myCVs.length > 0;

  return (
    <div className="job-details-container">
      <header className="job-details-header">
        <div className="header-main">
          <p className="company">{job.company_name}</p>
          <h1>{job.title}</h1>
          <div className="location">
            <svg style={{width: '20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {job.location || 'Remote / Multiple Locations'}
          </div>
        </div>
        <div className="job-tags">
          <span className="tag" style={{fontSize: '1rem', padding: '0.75rem 1.5rem'}}>
            {job.salary_min ? `${job.salary_min.toLocaleString()} ${job.currency}` : 'Competitive'}
          </span>
        </div>
      </header>

      <div className="job-details-grid">
        <div className="details-main">
          <div className="details-section">
            <h2>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
              Role Description
            </h2>
            <p style={{whiteSpace: 'pre-line'}}>{job.description}</p>
          </div>

          {user?.role === 'job_seeker' && skillGap && (
            <div className="details-section skill-gap-analysis">
              <h2>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                AI Skill Gap Analysis
              </h2>
              <div className="gap-lists">
                <div>
                  <h4 style={{marginBottom: '1rem', color: '#059669'}}>Skills You Have</h4>
                  {skillGap.matched.map((skill, i) => (
                    <div key={i} className="gap-item match">
                      <svg style={{width: '18px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {skill.toUpperCase()}
                    </div>
                  ))}
                </div>
                <div>
                  <h4 style={{marginBottom: '1rem', color: '#dc2626'}}>Skills To Improve</h4>
                  {skillGap.missing.map((skill, i) => (
                    <div key={i} className="gap-item missing">
                      <svg style={{width: '18px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {skill.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              {skillGap.missing.length > 0 && (
                <div className="learning-resources">
                  <h4 style={{color: 'var(--light)'}}>Recommended Learning Path</h4>
                  <p style={{fontSize: '0.875rem', marginTop: '0.5rem'}}>Based on your missing skills, we recommend these top courses:</p>
                  {skillGap.missing.slice(0, 2).map((skill, i) => (
                    <a key={i} href={`https://www.coursera.org/search?query=${skill}`} target="_blank" rel="noreferrer" className="resource-link">
                      <svg style={{width: '18px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                      Master {skill.toUpperCase()} on Coursera
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="job-sidebar">
          <div className="apply-card">
            <h3>Interested?</h3>
            {user?.role === 'job_seeker' ? (
              canApply ? (
                <>
                  <p style={{color: 'var(--gray)', marginBottom: '1.5rem', fontSize: '0.875rem'}}>Select your preferred CV to apply.</p>
                  <select
                    value={selectedCV}
                    onChange={(e) => setSelectedCV(e.target.value)}
                    className="cv-select"
                  >
                    <option value="">Select a CV</option>
                    {myCVs.map(cv => (
                      <option key={cv.id} value={cv.id}>
                        {cv.file_name} (v{cv.version})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => applyMutation.mutate()}
                    disabled={!selectedCV || applyMutation.isLoading}
                    className="btn-primary apply-btn"
                  >
                    {applyMutation.isLoading ? 'Applying...' : 'Apply Now'}
                  </button>
                  
                  <div className="interview-teaser">
                    <p>Want to stand out? Practice with our AI Mock Interviewer before you apply.</p>
                    <button onClick={() => navigate(`/interview/${id}`)} className="btn-secondary" style={{width: '100%', fontSize: '0.8125rem'}}>
                      Start Mock Interview
                    </button>
                  </div>
                </>
              ) : (
                <div style={{padding: '1rem'}}>
                  <p style={{color: 'var(--gray)', marginBottom: '1.5rem'}}>You need to upload a CV to apply.</p>
                  <button onClick={() => navigate('/cv/upload')} className="btn-primary apply-btn">
                    Upload CV
                  </button>
                </div>
              )
            ) : (
              <p style={{color: 'var(--gray)'}}>Log in as a Job Seeker to apply for this position.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
