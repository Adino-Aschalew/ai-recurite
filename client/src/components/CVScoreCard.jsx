import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, Cell } from 'recharts';
import './CVScoreCard.css';

const CVScoreCard = ({ score, breakdown, suggestions }) => {
  const scoreData = [
    { name: 'Score', value: score, fill: score >= 80 ? '#27ae60' : score >= 60 ? '#f39c12' : '#e74c3c' }
  ];

  return (
    <div className="cv-score-card">
      <h3>CV Score</h3>
      <div className="score-display">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            innerRadius="60%"
            outerRadius="90%"
            data={scoreData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="score-value">{score.toFixed(1)}%</div>
      </div>

      {breakdown && (
        <div className="score-breakdown">
          <h4>Score Breakdown</h4>
          <div className="breakdown-item">
            <span>Skills</span>
            <span className="breakdown-score">{breakdown.skills?.score?.toFixed(1) || 0}%</span>
          </div>
          <div className="breakdown-item">
            <span>Experience</span>
            <span className="breakdown-score">{breakdown.experience?.score?.toFixed(1) || 0}%</span>
          </div>
          <div className="breakdown-item">
            <span>Education</span>
            <span className="breakdown-score">{breakdown.education?.score?.toFixed(1) || 0}%</span>
          </div>
          <div className="breakdown-item">
            <span>Quality</span>
            <span className="breakdown-score">{breakdown.quality?.score?.toFixed(1) || 0}%</span>
          </div>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="suggestions">
          <h4>Improvement Suggestions</h4>
          <ul>
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CVScoreCard;

