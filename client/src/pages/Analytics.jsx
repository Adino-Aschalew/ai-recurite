import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import './Analytics.css';

const Analytics = () => {
  const { jobId } = useParams();
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const { data: analytics, isLoading } = useQuery(
    ['analytics', jobId, dateRange],
    async () => {
      if (jobId) {
        const response = await api.get(`/analytics/job/${jobId}`);
        return response.data;
      } else {
        const response = await api.get('/analytics/recruiter', {
          params: dateRange
        });
        return response.data;
      }
    }
  );

  const handleExport = async () => {
    if (!jobId) return;
    
    try {
      const response = await api.get(`/analytics/job/${jobId}/export`, {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `applications-${jobId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return <div className="analytics"><p>Loading...</p></div>;
  }

  const stats = analytics?.jobs || analytics || {};
  const scoreDistribution = analytics?.scoreDistribution || [];

  const COLORS = ['#667eea', '#f39c12', '#27ae60', '#e74c3c'];

  return (
    <div className="analytics">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        {jobId && (
          <button onClick={handleExport} className="btn-primary">
            Export CSV
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Jobs</h3>
          <p className="stat-value">{stats.total_jobs || stats.total_applicants || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p className="stat-value">{stats.total_applications || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p className="stat-value">
            {stats.avg_score || stats.avg_cv_score 
              ? (stats.avg_score || stats.avg_cv_score).toFixed(1) 
              : 0}%
          </p>
        </div>
        <div className="stat-card">
          <h3>Shortlisted</h3>
          <p className="stat-value">{stats.shortlisted_count || stats.shortlisted || 0}</p>
        </div>
      </div>

      {scoreDistribution.length > 0 && (
        <div className="chart-section">
          <h2>Score Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="score_range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {analytics?.statusBreakdown && analytics.statusBreakdown.length > 0 && (
        <div className="chart-section">
          <h2>Applications by Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusBreakdown}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {analytics.statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default Analytics;
