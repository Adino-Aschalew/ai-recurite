import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import JobSeekerDashboard from './pages/JobSeekerDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import JobsList from './pages/JobsList';
import JobDetails from './pages/JobDetails';
import CVUpload from './pages/CVUpload';
import CVView from './pages/CVView';
import JobPosting from './pages/JobPosting';
import Applications from './pages/Applications';
import Analytics from './pages/Analytics';
import Candidates from './pages/Candidates';
import MockInterview from './pages/MockInterview';
import Profile from './pages/Profile';
import Layout from './components/Layout';

const queryClient = new QueryClient();

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={
          user?.role === 'job_seeker' ? <JobSeekerDashboard /> : <RecruiterDashboard />
        } />
        
        <Route path="profile" element={
          <PrivateRoute allowedRoles={['job_seeker', 'recruiter', 'admin']}>
            <Profile />
          </PrivateRoute>
        } />
        {/* Job Seeker Routes */}
        <Route path="cv/upload" element={
          <PrivateRoute allowedRoles={[ 'job_seeker', 'admin' ]}>
            <CVUpload />
          </PrivateRoute>
        } />
        <Route path="cv/:id" element={
          <PrivateRoute>
            <CVView />
          </PrivateRoute>
        } />
        <Route path="jobs" element={
          <PrivateRoute>
            <JobsList />
          </PrivateRoute>
        } />
        <Route path="jobs/:id" element={
          <PrivateRoute>
            <JobDetails />
          </PrivateRoute>
        } />
        <Route path="my-applications" element={
          <PrivateRoute allowedRoles={[ 'job_seeker', 'admin' ]}>
            <Applications />
          </PrivateRoute>
        } />
        <Route path="interview/:jobId" element={
          <PrivateRoute allowedRoles={[ 'job_seeker', 'admin' ]}>
            <MockInterview />
          </PrivateRoute>
        } />
        
        {/* Recruiter Routes */}
        <Route path="job/post" element={
          <PrivateRoute allowedRoles={[ 'recruiter', 'admin' ]}>
            <JobPosting />
          </PrivateRoute>
        } />
        <Route path="job/:id/edit" element={
          <PrivateRoute allowedRoles={[ 'recruiter', 'admin' ]}>
            <JobPosting />
          </PrivateRoute>
        } />
        <Route path="analytics" element={
          <PrivateRoute allowedRoles={[ 'recruiter', 'admin' ]}>
            <Analytics />
          </PrivateRoute>
        } />
        <Route path="candidates" element={
          <PrivateRoute allowedRoles={[ 'recruiter', 'admin' ]}>
            <Candidates />
          </PrivateRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <ToastContainer position="top-right" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
