import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, updateUserInfo } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Mock API call for profile update
      // await api.put('/auth/profile', { firstName: formData.firstName, lastName: formData.lastName });
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setIsLoading(true);
    try {
      // Mock API call
      toast.success('Password changed successfully!');
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Account Settings</h1>
        <p>Manage your personal information and security preferences.</p>
      </header>

      <div className="profile-grid">
        <div className="profile-card">
          <h2>Personal Information</h2>
          <form onSubmit={handleUpdateProfile}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                style={{ background: '#f8fafc', cursor: 'not-allowed' }}
              />
              <span className="form-hint">Email cannot be changed for security reasons.</span>
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="profile-card">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="btn-secondary" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="profile-card status-card">
          <h2>Account Status</h2>
          <div className="status-badge">
            <span className="pulse"></span>
            Active {user?.role?.replace('_', ' ')}
          </div>
          <div className="account-meta">
            <div className="meta-item">
              <span>Member Since</span>
              <strong>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
            </div>
            <div className="meta-item">
              <span>Last Login</span>
              <strong>Today, 10:45 AM</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
