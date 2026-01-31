import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import api from '../services/api';
import CVScoreCard from '../components/CVScoreCard';
import './CVView.css';

const CVView = () => {
  const { id } = useParams();
  const { data: cv, isLoading } = useQuery(['cv', id], async () => {
    const response = await api.get(`/cvs/${id}`);
    return response.data;
  });

  if (isLoading) {
    return <div className="cv-view"><p>Loading...</p></div>;
  }

  if (!cv) {
    return <div className="cv-view"><p>CV not found</p></div>;
  }

  const extractedData = cv.extracted_data || {};
  const latestScore = cv.scores?.[0];

  return (
    <div className="cv-view">
      <h1>CV Details</h1>
      
      <div className="cv-info">
        <div className="info-section">
          <h2>File Information</h2>
          <p><strong>File Name:</strong> {cv.file_name}</p>
          <p><strong>Version:</strong> {cv.version}</p>
          <p><strong>Uploaded:</strong> {new Date(cv.created_at).toLocaleDateString()}</p>
        </div>

        {extractedData.basicInfo && (
          <div className="info-section">
            <h2>Extracted Information</h2>
            {extractedData.basicInfo.name && (
              <p><strong>Name:</strong> {extractedData.basicInfo.name}</p>
            )}
            {extractedData.basicInfo.email && (
              <p><strong>Email:</strong> {extractedData.basicInfo.email}</p>
            )}
            {extractedData.basicInfo.phone && (
              <p><strong>Phone:</strong> {extractedData.basicInfo.phone}</p>
            )}
          </div>
        )}

        {extractedData.skills && extractedData.skills.length > 0 && (
          <div className="info-section">
            <h2>Skills</h2>
            <div className="skills-list">
              {extractedData.skills.map((skill, idx) => (
                <span key={idx} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        )}

        {extractedData.experience && (
          <div className="info-section">
            <h2>Experience</h2>
            <p><strong>Total Years:</strong> {extractedData.experience.totalYears || 0}</p>
            {extractedData.experience.jobTitles && extractedData.experience.jobTitles.length > 0 && (
              <div>
                <strong>Job Titles:</strong>
                <ul>
                  {extractedData.experience.jobTitles.map((title, idx) => (
                    <li key={idx}>{title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {extractedData.education && (
          <div className="info-section">
            <h2>Education</h2>
            <p><strong>Highest Degree:</strong> {extractedData.education.highestDegree || 'Not specified'}</p>
          </div>
        )}
      </div>

      {latestScore && (
        <CVScoreCard
          score={latestScore.overall_score}
          breakdown={latestScore.score_breakdown}
          suggestions={latestScore.suggestions?.split('\n')}
        />
      )}

      {cv.scores && cv.scores.length > 1 && (
        <div className="score-history">
          <h2>Score History</h2>
          <div className="history-list">
            {cv.scores.slice(1).map((score, idx) => (
              <div key={idx} className="history-item">
                <div>
                  <p><strong>Job:</strong> {score.job_title || 'N/A'}</p>
                  <p><strong>Date:</strong> {new Date(score.created_at).toLocaleDateString()}</p>
                </div>
                <div className="score-badge">{score.overall_score.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CVView;

