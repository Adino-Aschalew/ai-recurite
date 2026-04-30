import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import api from '../services/api';
import './CVUpload.css';

const CVUpload = () => {
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation(
    async (file) => {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await api.post('/cvs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('my-cvs');
        toast.success('CV processed successfully!');
        navigate(`/cv/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Upload failed');
      },
      onSettled: () => {
        setUploading(false);
      }
    }
  );

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF or DOCX files only.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    uploadMutation.mutate(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: uploading
  });

  return (
    <div className="upload-wrapper">
      <header className="dashboard-header">
        <div>
          <h1>Upload Your CV</h1>
          <p>Our AI will analyze your experience and match you with the perfect roles.</p>
        </div>
      </header>

      <div className="upload-card">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
        >
          <input {...getInputProps()} />
          
          {uploading ? (
            <div className="upload-content">
              <span className="loader"></span>
              <p className="upload-title">Processing with AI...</p>
              <p className="upload-subtitle">We're extracting your skills and experience to build your profile.</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="icon-circle">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="upload-title">
                {isDragActive ? 'Release to upload' : 'Select your CV file'}
              </p>
              <p className="upload-subtitle">
                Drag and drop your document here, or click to browse your files.
              </p>
              
              <div className="file-specs">
                <div className="spec-item">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  PDF or DOCX
                </div>
                <div className="spec-item">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  Max 10MB
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div style={{marginTop: '3rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--glass-border)'}}>
          <h4 style={{marginBottom: '0.5rem', color: 'white'}}>Why upload your CV?</h4>
          <ul style={{color: 'var(--gray)', fontSize: '0.9375rem', lineHeight: '1.6', paddingLeft: '1.25rem'}}>
            <li>Instantly match with jobs based on your actual skills.</li>
            <li>Get a detailed AI analysis of your career performance.</li>
            <li>Skip lengthy application forms—your CV tells the whole story.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CVUpload;
