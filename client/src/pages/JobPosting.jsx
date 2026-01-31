import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import api from '../services/api';
import './JobPosting.css';

const JobPosting = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    location: '',
    employmentType: 'full-time',
    salaryMin: '',
    salaryMax: '',
    status: 'draft',
    requirements: {
      requiredSkills: [],
      preferredSkills: [],
      minExperienceYears: '',
      educationLevel: '',
      requiredCertifications: []
    }
  });

  const [skillInput, setSkillInput] = useState('');

  const { data: job, isLoading } = useQuery(
    ['job', id],
    async () => {
      const response = await api.get(`/jobs/${id}`);
      return response.data;
    },
    { enabled: isEdit }
  );

  useEffect(() => {
    if (job && isEdit) {
      setFormData({
        title: job.title || '',
        description: job.description || '',
        companyName: job.company_name || '',
        location: job.location || '',
        employmentType: job.employment_type || 'full-time',
        salaryMin: job.salary_min || '',
        salaryMax: job.salary_max || '',
        status: job.status || 'draft',
        requirements: {
          requiredSkills: job.required_skills || [],
          preferredSkills: job.preferred_skills || [],
          minExperienceYears: job.min_experience_years || '',
          educationLevel: job.education_level || '',
          requiredCertifications: job.required_certifications || []
        }
      });
    }
  }, [job, isEdit]);

  const createMutation = useMutation(
    async (data) => {
      const response = await api.post('/jobs', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('my-jobs');
        toast.success('Job created successfully!');
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Failed to create job');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('requirements.')) {
      const reqField = name.split('.')[1];
      setFormData({
        ...formData,
        requirements: {
          ...formData.requirements,
          [reqField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const addSkill = (type) => {
    if (!skillInput.trim()) return;
    
    const skills = formData.requirements[type];
    if (!skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        requirements: {
          ...formData.requirements,
          [type]: [...skills, skillInput.trim()]
        }
      });
    }
    setSkillInput('');
  };

  const removeSkill = (type, skill) => {
    setFormData({
      ...formData,
      requirements: {
        ...formData.requirements,
        [type]: formData.requirements[type].filter(s => s !== skill)
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  if (isLoading && isEdit) {
    return <div className="job-posting"><p>Loading...</p></div>;
  }

  return (
    <div className="job-posting">
      <h1>{isEdit ? 'Edit Job' : 'Post New Job'}</h1>
      
      <form onSubmit={handleSubmit} className="job-form">
        <div className="form-section">
          <h2>Basic Information</h2>
          <div className="form-group">
            <label>Job Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Company Name *</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Employment Type</label>
              <select
                name="employmentType"
                value={formData.employmentType}
                onChange={handleChange}
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Requirements</h2>
          <div className="form-group">
            <label>Required Skills</label>
            <div className="skill-input-group">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('requiredSkills'))}
                placeholder="Type skill and press Enter"
              />
              <button type="button" onClick={() => addSkill('requiredSkills')}>Add</button>
            </div>
            <div className="skills-list">
              {formData.requirements.requiredSkills.map((skill, idx) => (
                <span key={idx} className="skill-tag">
                  {skill}
                  <button type="button" onClick={() => removeSkill('requiredSkills', skill)}>×</button>
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Preferred Skills</label>
            <div className="skill-input-group">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('preferredSkills'))}
                placeholder="Type skill and press Enter"
              />
              <button type="button" onClick={() => addSkill('preferredSkills')}>Add</button>
            </div>
            <div className="skills-list">
              {formData.requirements.preferredSkills.map((skill, idx) => (
                <span key={idx} className="skill-tag">
                  {skill}
                  <button type="button" onClick={() => removeSkill('preferredSkills', skill)}>×</button>
                </span>
              ))}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Experience (Years)</label>
              <input
                type="number"
                name="requirements.minExperienceYears"
                value={formData.requirements.minExperienceYears}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Education Level</label>
              <select
                name="requirements.educationLevel"
                value={formData.requirements.educationLevel}
                onChange={handleChange}
              >
                <option value="">Any</option>
                <option value="high school">High School</option>
                <option value="bachelor">Bachelor's</option>
                <option value="master">Master's</option>
                <option value="phd">PhD</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={createMutation.isLoading} className="btn-primary">
            {createMutation.isLoading ? 'Saving...' : isEdit ? 'Update Job' : 'Create Job'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPosting;
