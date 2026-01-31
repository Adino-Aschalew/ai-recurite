import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/dashboard" className="nav-logo">
            AI Recruitment
          </Link>
          <div className="nav-menu">
            {user?.role === 'job_seeker' && (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/cv/upload" className="nav-link">Upload CV</Link>
                <Link to="/jobs" className="nav-link">Browse Jobs</Link>
                <Link to="/my-applications" className="nav-link">My Applications</Link>
              </>
            )}
            {user?.role === 'recruiter' && (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/job/post" className="nav-link">Post Job</Link>
                <Link to="/jobs" className="nav-link">Jobs</Link>
                <Link to="/analytics" className="nav-link">Analytics</Link>
              </>
            )}
            <div className="nav-user">
              <span>{user?.email}</span>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

