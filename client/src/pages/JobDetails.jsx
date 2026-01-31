import React, { useState } from 'react';
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
    return <div className="job-details"><p>Loading...</p></div>;
  }

  if (!job) {
    return <div className="job-details"><p>Job not found</p></div>;
  }

  const canApply = user?.role === 'job_seeker' && myCVs && myCVs.length > 0;

  return (
    <div className="job-details">
      <div className="job-header">
        <h1>{job.title}</h1>
        <p className="company">{job.company_name}</p>
        <p className="location">{job.location || 'Location not specified'}</p>
      </div>

      <div className="job-content">
        <div className="job-main">
          <div className="section">
            <h2>Description</h2>
            <p>{job.description}</p>
          </div>

          {job.required_skills && job.required_skills.length > 0 && (
            <div className="section">
              <h2>Required Skills</h2>
              <div className="skills-list">
                {job.required_skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {job.min_experience_years && (
            <div className="section">
              <h2>Experience</h2>
              <p>Minimum {job.min_experience_years} years of experience required</p>
            </div>
          )}

          {job.education_level && (
            <div className="section">
              <h2>Education</h2>
              <p>{job.education_level}</p>
            </div>
          )}
        </div>

        {user?.role === 'job_seeker' && (
          <div className="job-sidebar">
            {canApply ? (
              <div className="apply-section">
                <h3>Apply for this job</h3>
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
              </div>
            ) : (
              <div className="apply-section">
                <p>Upload a CV to apply for this job</p>
                <button
                  onClick={() => navigate('/cv/upload')}
                  className="btn-primary"
                >
                  Upload CV
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;

