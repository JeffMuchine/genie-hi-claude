import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Check } from 'lucide-react';
import { uploadResume } from '../api';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/json': ['.json'],
};
const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.json'];
const MAX_SIZE_MB = 20;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef(null);

  function validateFile(file) {
    if (!file) return 'No file selected.';
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Please upload: ${ACCEPTED_EXTENSIONS.join(', ')}`;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return 'Resume seems to contain too much content. Use our resume builder to refine your resume.';
    }
    if (file.size === 0) {
      return 'No resume detected; try uploading your resume or build with the resume builder.';
    }
    return null;
  }

  function handleFileSelect(file) {
    setError('');
    setUploadDone(false);
    setUploadProgress(0);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  function handleInputChange(e) {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError('No resume detected; try uploading your resume or build with the resume builder.');
      return;
    }
    setUploading(true);
    setError('');
    setUploadProgress(0);

    // Simulate progress ticks
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 85));
    }, 200);

    try {
      await uploadResume(selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadDone(true);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    if (uploading) return;
    setSelectedFile(null);
    setError('');
    setUploadProgress(0);
    setUploadDone(false);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          animation: 'slide-up 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>
              Upload your resume
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
              We need your resume to tailor documents to each job
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={uploading}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: '#f3f4f6',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? '#6F38C5' : selectedFile ? '#3DB6B1' : '#d1d5db'}`,
              borderRadius: 14,
              padding: '32px 24px',
              textAlign: 'center',
              background: isDragging ? '#f3eeff' : selectedFile ? '#f0fdfb' : '#fafafa',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={handleInputChange}
              style={{ display: 'none' }}
              disabled={uploading}
            />

            {selectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#f0fdfb',
                    border: '2px solid #3DB6B1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={22} color="#3DB6B1" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setError('');
                    }}
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Choose a different file
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: isDragging ? '#ede6fc' : '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                >
                  <Upload size={24} color={isDragging ? '#6F38C5' : '#9ca3af'} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
                    {isDragging ? 'Drop your resume here' : 'Drag & drop or click to browse'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                    Supports PDF, DOC, DOCX, TXT, JSON — max {MAX_SIZE_MB}MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#fff1f1',
                border: '1px solid #fca5a5',
                borderRadius: 8,
                fontSize: 13,
                color: '#FF5555',
              }}
            >
              {error}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  height: 6,
                  background: '#e5e7eb',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #6F38C5, #87A2FB)',
                    borderRadius: 3,
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Success */}
          {uploadDone && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: '#f0fdfb',
                border: '1px solid #3DB6B1',
                borderRadius: 8,
                fontSize: 13,
                color: '#3DB6B1',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} />
              Resume uploaded successfully! Closing...
            </div>
          )}

          {/* Actions */}
          {!uploading && !uploadDone && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: '11px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#374151',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#6F38C5')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                style={{
                  flex: 2,
                  padding: '11px',
                  border: 'none',
                  borderRadius: 10,
                  background: selectedFile ? '#6F38C5' : '#EEEEEE',
                  color: selectedFile ? '#fff' : '#999',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: selectedFile ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedFile) e.currentTarget.style.background = '#5a2da8';
                }}
                onMouseLeave={(e) => {
                  if (selectedFile) e.currentTarget.style.background = '#6F38C5';
                }}
              >
                <Upload size={16} />
                Upload Resume
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
