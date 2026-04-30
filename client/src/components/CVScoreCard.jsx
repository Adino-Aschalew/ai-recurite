import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import './CVScoreCard.css';

const CVScoreCard = ({ score, breakdown, suggestions }) => {
  const scoreData = [
    { name: 'Score', value: score, fill: 'var(--primary)' }
  ];

  return (
    <div className="cv-score-card">
      <h3>AI Matching Analysis</h3>
      <div className="score-display">
        <ResponsiveContainer width="100%" height={220}>
          <RadialBarChart
            innerRadius="75%"
            outerRadius="100%"
            data={scoreData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar dataKey="value" cornerRadius={20} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="score-value">{score.toFixed(1)}%</div>
      </div>

      {breakdown && (
        <div className="score-breakdown">
          <h4>Detailed Breakdown</h4>
          <div className="breakdown-item">
            <span>Core Skills</span>
            <span className="breakdown-score">{breakdown.skills?.score?.toFixed(1) || 0}%</span>
          </div>
          <div className="breakdown-item">
            <span>Relevant Exp</span>
            <span className="breakdown-score">{breakdown.experience?.score?.toFixed(1) || 0}%</span>
          </div>
          <div className="breakdown-item">
            <span>Academic fit</span>
            <span className="breakdown-score">{breakdown.education?.score?.toFixed(1) || 0}%</span>
          </div>
          <div className="breakdown-item">
            <span>CV Quality</span>
            <span className="breakdown-score">{breakdown.quality?.score?.toFixed(1) || 0}%</span>
          </div>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="suggestions">
          <h4>
            <svg style={{width: '20px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Optimization Tips
          </h4>
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
