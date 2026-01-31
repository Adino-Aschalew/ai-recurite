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
        toast.success('CV uploaded successfully!');
        navigate(`/cv/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Upload failed');
      }
    }
  );

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload PDF or DOCX files only.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit.');
      return;
    }

    setUploading(true);
    uploadMutation.mutate(file);
    setUploading(false);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  return (
    <div className="cv-upload">
      <h1>Upload CV</h1>
      <div className="upload-container">
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="upload-status">
              <p>Uploading...</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📄</div>
              <p className="upload-text">
                {isDragActive
                  ? 'Drop your CV here'
                  : 'Drag & drop your CV here, or click to select'}
              </p>
              <p className="upload-hint">
                Supported formats: PDF, DOCX (Max 10MB)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVUpload;

