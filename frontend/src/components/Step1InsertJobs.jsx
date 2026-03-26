import { useState, useRef, useEffect } from 'react';
import JobCard from './JobCard';
import LoadingAnimation from './LoadingAnimation';
import ResumeUploadModal from './ResumeUploadModal';
import { parseJob, generateDocuments, getGenerationStatus } from '../api';

const MAX_JOBS = 5;
const POLL_INTERVAL_MS = 2000;

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function generateId() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function Step1InsertJobs({
  jobs,
  setJobs,
  resumeStored,
  setResumeStored,
  setCurrentStep,
  setSessionId,
  sessionId,
  generationResults,
  setGenerationResults,
}) {
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [addingJob, setAddingJob] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function validateInput(value) {
    const trimmed = value.trim();
    if (!trimmed) return 'Please enter a job link or paste a job description.';
    if (!isURL(trimmed) && trimmed.length < 50) {
      return 'Invalid job insert, try again.';
    }
    if (jobs.some((j) => j.raw === trimmed)) {
      return 'This job has already been added.';
    }
    if (jobs.length >= MAX_JOBS) {
      return `You can add up to ${MAX_JOBS} jobs at once.`;
    }
    return null;
  }

  async function handleAdd() {
    const trimmed = input.trim();
    const validationError = validateInput(trimmed);
    if (validationError) {
      setInputError(validationError);
      return;
    }
    setInputError('');
    setAddingJob(true);

    // Optimistic placeholder
    const tempId = generateId();
    const placeholder = {
      id: tempId,
      raw: trimmed,
      title: isURL(trimmed) ? new URL(trimmed).hostname : 'Loading...',
      company: isURL(trimmed) ? '' : '',
      status: 'pending',
      jd_text: '',
      error: null,
      parsing: true,
    };
    setJobs((prev) => [...prev, placeholder]);

    try {
      const result = await parseJob(trimmed);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === tempId
            ? {
                ...j,
                id: result.id || tempId,
                title: result.title || 'Untitled Role',
                company: result.company || 'Unknown Company',
                jd_text: result.jd_text || '',
                status: 'pending',
                parsing: false,
                error: null,
              }
            : j
        )
      );
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === tempId
            ? {
                ...j,
                title: isURL(trimmed) ? trimmed.slice(0, 40) + '...' : trimmed.slice(0, 40) + '...',
                status: 'failed',
                parsing: false,
                error: "We couldn't process this job. Please try again.",
              }
            : j
        )
      );
    } finally {
      setAddingJob(false);
      setInput('');
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function handleRemoveJob(jobId) {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }

  async function handleGenerate() {
    const validJobs = jobs.filter((j) => j.status !== 'failed');
    if (validJobs.length === 0) return;

    if (!resumeStored) {
      setShowUploadModal(true);
      return;
    }

    setGenerateError('');
    setGenerating(true);
    setCompletedCount(0);

    // Mark all as generating
    setJobs((prev) =>
      prev.map((j) =>
        j.status !== 'failed' ? { ...j, status: 'generating' } : j
      )
    );

    try {
      const jobIds = validJobs.map((j) => j.id);
      const { session_id } = await generateDocuments(jobIds);
      setSessionId(session_id);

      // Start polling
      pollRef.current = setInterval(async () => {
        try {
          const statusData = await getGenerationStatus(session_id);
          const jobStatuses = statusData.jobs || {};

          let doneCount = 0;
          const updatedResults = { ...generationResults };

          setJobs((prev) =>
            prev.map((j) => {
              const info = jobStatuses[j.id];
              if (!info) return j;

              if (info.status === 'ready' || info.status === 'completed') {
                doneCount++;
                updatedResults[j.id] = {
                  resume: info.resume,
                  cover_letter: info.cover_letter,
                };
                return { ...j, status: 'ready' };
              } else if (info.status === 'failed') {
                doneCount++;
                return { ...j, status: 'failed', error: info.error || 'Generation failed.' };
              }
              return j;
            })
          );

          setGenerationResults(updatedResults);
          setCompletedCount(doneCount);

          // Check if all done
          const allStatuses = Object.values(jobStatuses);
          const allDone =
            allStatuses.length > 0 &&
            allStatuses.every((s) => s.status === 'ready' || s.status === 'completed' || s.status === 'failed');

          if (allDone || statusData.status === 'completed') {
            clearInterval(pollRef.current);
            setGenerating(false);
            setTimeout(() => setCurrentStep(2), 600);
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setGenerating(false);
      setGenerateError(err.message || 'Failed to start generation. Please try again.');
      setJobs((prev) =>
        prev.map((j) => (j.status === 'generating' ? { ...j, status: 'pending' } : j))
      );
    }
  }

  function handleUploadSuccess() {
    setResumeStored(true);
    setShowUploadModal(false);
    // Automatically trigger generation after upload
    setTimeout(() => handleGenerate(), 300);
  }

  const validJobCount = jobs.filter((j) => j.status !== 'failed' || j.parsing).length;
  const canGenerate = validJobCount > 0 && !generating && !addingJob;
  const canAdd = jobs.length < MAX_JOBS && !generating;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>
          Add jobs to apply to
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Paste a job link or description. We'll tailor your resume and cover letter for each role.
          Add up to {MAX_JOBS} jobs.
        </p>
      </div>

      {/* Input bar */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (inputError) setInputError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Insert job link or paste job description..."
              disabled={!canAdd || addingJob}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1.5px solid ${inputError ? '#FF5555' : '#d1d5db'}`,
                borderRadius: 12,
                fontSize: 14,
                color: '#1a1a2e',
                background: !canAdd ? '#f9f9fc' : '#fff',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                if (!inputError) {
                  e.target.style.borderColor = '#6F38C5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(111,56,197,0.12)';
                }
              }}
              onBlur={(e) => {
                if (!inputError) {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!canAdd || addingJob || !input.trim()}
            style={{
              padding: '12px 20px',
              background: !canAdd || addingJob || !input.trim() ? '#EEEEEE' : '#6F38C5',
              color: !canAdd || addingJob || !input.trim() ? '#999' : '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: !canAdd || addingJob || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
              transition: 'background 0.2s',
              minWidth: 80,
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              if (canAdd && !addingJob && input.trim()) e.currentTarget.style.background = '#5a2da8';
            }}
            onMouseLeave={(e) => {
              if (canAdd && !addingJob && input.trim()) e.currentTarget.style.background = '#6F38C5';
            }}
          >
            {addingJob ? (
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid #ccc',
                  borderTopColor: '#6F38C5',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              '+ Add'
            )}
          </button>
        </div>

        {/* Inline input error */}
        {inputError && (
          <p style={{ margin: '6px 0 0 2px', fontSize: 12, color: '#FF5555' }}>{inputError}</p>
        )}
      </div>

      {/* Job count indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#9ca3af' }}>
          {jobs.length}/{MAX_JOBS} jobs added
        </span>
        {!resumeStored && (
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              fontSize: 13,
              color: '#6F38C5',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
            }}
          >
            + Upload resume
          </button>
        )}
        {resumeStored && (
          <span
            style={{
              fontSize: 13,
              color: '#3DB6B1',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>&#10003;</span> Resume on file
          </span>
        )}
      </div>

      {/* Loading animation during generation */}
      {generating ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <LoadingAnimation total={validJobCount} completed={completedCount} />
        </div>
      ) : (
        <>
          {/* Job list */}
          {jobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {jobs.map((job) => (
                <div key={job.id} style={{ animation: 'slide-up 0.2s ease-out' }}>
                  <JobCard
                    job={job}
                    onRemove={!generating ? handleRemoveJob : null}
                    showStatus={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 24px',
                background: '#fafafa',
                border: '2px dashed #e5e7eb',
                borderRadius: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>&#128218;</div>
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
                No jobs added yet. Paste a link or job description above to get started.
              </p>
            </div>
          )}

          {/* Generate error */}
          {generateError && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fff1f1',
                border: '1px solid #fca5a5',
                borderRadius: 10,
                fontSize: 13,
                color: '#FF5555',
                marginBottom: 16,
              }}
            >
              {generateError}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              width: '100%',
              padding: '14px',
              background: canGenerate ? 'linear-gradient(135deg, #6F38C5, #87A2FB)' : '#EEEEEE',
              color: canGenerate ? '#fff' : '#999',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s, transform 0.1s',
              letterSpacing: '0.3px',
            }}
            onMouseEnter={(e) => {
              if (canGenerate) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              if (canGenerate) e.currentTarget.style.opacity = '1';
            }}
          >
            Generate Documents ({validJobCount} job{validJobCount !== 1 ? 's' : ''})
          </button>
        </>
      )}

      {/* Resume upload modal */}
      <ResumeUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
