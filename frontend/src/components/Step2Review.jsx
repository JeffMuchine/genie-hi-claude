import { useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import ResumeReviewModal from './ResumeReviewModal';
import CoverLetterModal from './CoverLetterModal';

export default function Step2Review({ jobs, sessionId, generationResults, setCurrentStep }) {
  const [resumeModal, setResumeModal] = useState({ open: false, jobId: null });
  const [coverLetterModal, setCoverLetterModal] = useState({ open: false, jobId: null });

  const readyJobs = jobs.filter((j) => j.status === 'ready');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  function openResume(jobId) {
    setResumeModal({ open: true, jobId });
  }

  function openCoverLetter(jobId) {
    setCoverLetterModal({ open: true, jobId });
  }

  const activeResumeJob = jobs.find((j) => j.id === resumeModal.jobId);
  const activeClJob = jobs.find((j) => j.id === coverLetterModal.jobId);
  const activeResults = generationResults[resumeModal.jobId] || {};
  const activeClResults = generationResults[coverLetterModal.jobId] || {};

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>
          Review your documents
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          {readyJobs.length} document{readyJobs.length !== 1 ? 's' : ''} ready.
          Review and customize each resume and cover letter before downloading.
        </p>
      </div>

      {/* Failed jobs notice */}
      {failedJobs.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fff1f1',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 14,
            color: '#FF5555',
          }}
        >
          {failedJobs.length} job{failedJobs.length !== 1 ? 's' : ''} failed to generate:{' '}
          {failedJobs.map((j) => `${j.title} at ${j.company}`).join(', ')}.
        </div>
      )}

      {/* Job cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {jobs.map((job) => {
          const results = generationResults[job.id] || {};
          const hasResume = !!results.resume;
          const hasCoverLetter = !!results.cover_letter;
          const isFailed = job.status === 'failed';

          return (
            <div
              key={job.id}
              style={{
                background: '#ffffff',
                border: `1px solid ${isFailed ? '#fca5a5' : '#e5e7eb'}`,
                borderRadius: 16,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {/* Job info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
                      {job.title || 'Untitled Role'}
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                      {job.company || 'Unknown Company'}
                    </p>
                  </div>
                  {isFailed ? (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#fff1f1',
                        color: '#FF5555',
                        padding: '3px 8px',
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      Failed
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: '#f0fdfb',
                        color: '#3DB6B1',
                        padding: '3px 8px',
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      Ready
                    </span>
                  )}
                </div>
                {isFailed && job.error && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#FF5555' }}>{job.error}</p>
                )}
              </div>

              {/* Action buttons */}
              {!isFailed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Review Resume */}
                  <button
                    onClick={() => openResume(job.id)}
                    disabled={!hasResume}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      border: `1.5px solid ${hasResume ? '#6F38C5' : '#e5e7eb'}`,
                      borderRadius: 10,
                      background: hasResume ? '#faf8ff' : '#fafafa',
                      color: hasResume ? '#6F38C5' : '#9ca3af',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: hasResume ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (hasResume) {
                        e.currentTarget.style.background = '#ede6fc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasResume) {
                        e.currentTarget.style.background = '#faf8ff';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={15} />
                      Review Resume
                    </div>
                    <ChevronRight size={14} />
                  </button>

                  {/* Review Cover Letter */}
                  <button
                    onClick={() => openCoverLetter(job.id)}
                    disabled={!hasCoverLetter}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      border: `1.5px solid ${hasCoverLetter ? '#87A2FB' : '#e5e7eb'}`,
                      borderRadius: 10,
                      background: hasCoverLetter ? '#f5f7ff' : '#fafafa',
                      color: hasCoverLetter ? '#6F38C5' : '#9ca3af',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: hasCoverLetter ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (hasCoverLetter) {
                        e.currentTarget.style.background = '#ede6fc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hasCoverLetter) {
                        e.currentTarget.style.background = '#f5f7ff';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={15} />
                      Review Cover Letter
                    </div>
                    <ChevronRight size={14} />
                  </button>

                  {/* Proceed to Download (skip review) */}
                  <button
                    onClick={() => setCurrentStep(3)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 14px',
                      border: 'none',
                      borderRadius: 10,
                      background: 'transparent',
                      color: '#9ca3af',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'color 0.15s',
                      gap: 4,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#6F38C5')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                  >
                    Skip review — Proceed to Download
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue to Download */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setCurrentStep(3)}
          style={{
            padding: '13px 32px',
            background: 'linear-gradient(135deg, #6F38C5, #87A2FB)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Continue to Download
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Resume Review Modal */}
      {resumeModal.open && activeResumeJob && (
        <ResumeReviewModal
          isOpen={resumeModal.open}
          onClose={() => setResumeModal({ open: false, jobId: null })}
          jobId={resumeModal.jobId}
          sessionId={sessionId}
          originalResume={activeResumeJob.jd_text || ''}
          tailoredResume={activeResults.resume || ''}
          onSave={() => {}}
        />
      )}

      {/* Cover Letter Modal */}
      {coverLetterModal.open && activeClJob && (
        <CoverLetterModal
          isOpen={coverLetterModal.open}
          onClose={() => setCoverLetterModal({ open: false, jobId: null })}
          jobId={coverLetterModal.jobId}
          sessionId={sessionId}
          initialCoverLetter={activeClResults.cover_letter || ''}
        />
      )}
    </div>
  );
}
