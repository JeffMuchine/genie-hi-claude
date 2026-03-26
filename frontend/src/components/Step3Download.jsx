import { useState } from 'react';
import { Download, Settings, RefreshCw, FileText } from 'lucide-react';
import { downloadZip } from '../api';
import api from '../api';

const FORMAT_OPTIONS = ['PDF', 'DOCX', 'TXT'];

function slugify(str) {
  return (str || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1000);
}

function getUserName(user) {
  if (!user) return 'user';
  if (user.displayName) return user.displayName.replace(/\s+/g, '_');
  if (user.email) return user.email.split('@')[0];
  return 'user';
}

function JobDownloadRow({ job, sessionId, user, format, onFormatChange }) {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadingCL, setDownloadingCL] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [clError, setClError] = useState('');

  const userName = slugify(getUserName(user));
  const company = slugify(job.company);
  const title = slugify(job.title);
  const ext = format.toLowerCase();

  async function handleDownloadResume() {
    setDownloadingResume(true);
    setResumeError('');
    try {
      const resp = await api.get(
        `/download/${sessionId}/${job.id}/resume`,
        { responseType: 'blob', params: { format: ext } }
      );
      const filename = `${userName}_${company}_${title}_resume.${ext}`;
      triggerBlobDownload(resp.data, filename);
    } catch (err) {
      setResumeError('Download failed. Try again.');
    } finally {
      setDownloadingResume(false);
    }
  }

  async function handleDownloadCoverLetter() {
    setDownloadingCL(true);
    setClError('');
    try {
      const resp = await api.get(
        `/download/${sessionId}/${job.id}/cover-letter`,
        { responseType: 'blob', params: { format: ext } }
      );
      const filename = `${userName}_${company}_${title}_cover_letter.${ext}`;
      triggerBlobDownload(resp.data, filename);
    } catch (err) {
      setClError('Download failed. Try again.');
    } finally {
      setDownloadingCL(false);
    }
  }

  const isFailed = job.status === 'failed';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 20px',
        background: '#ffffff',
        border: `1px solid ${isFailed ? '#fca5a5' : '#e5e7eb'}`,
        borderRadius: 14,
        flexWrap: 'wrap',
      }}
    >
      {/* Job info */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>
          {job.title || 'Untitled Role'}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
          {job.company || 'Unknown Company'}
        </div>
        {isFailed && (
          <div style={{ fontSize: 12, color: '#FF5555', marginTop: 4 }}>
            Generation failed — no documents available
          </div>
        )}
      </div>

      {/* Download Resume */}
      {!isFailed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <button
            onClick={handleDownloadResume}
            disabled={downloadingResume}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: downloadingResume ? '#EEEEEE' : '#6F38C5',
              color: downloadingResume ? '#999' : '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: downloadingResume ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!downloadingResume) e.currentTarget.style.background = '#5a2da8';
            }}
            onMouseLeave={(e) => {
              if (!downloadingResume) e.currentTarget.style.background = '#6F38C5';
            }}
          >
            {downloadingResume ? (
              <span
                style={{
                  width: 13,
                  height: 13,
                  border: '2px solid #ccc',
                  borderTopColor: '#6F38C5',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <Download size={13} />
            )}
            Resume
          </button>
          {resumeError && (
            <span style={{ fontSize: 11, color: '#FF5555' }}>{resumeError}</span>
          )}
        </div>
      )}

      {/* Download Cover Letter */}
      {!isFailed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <button
            onClick={handleDownloadCoverLetter}
            disabled={downloadingCL}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: downloadingCL ? '#EEEEEE' : '#87A2FB',
              color: downloadingCL ? '#999' : '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: downloadingCL ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!downloadingCL) e.currentTarget.style.background = '#6b8bf7';
            }}
            onMouseLeave={(e) => {
              if (!downloadingCL) e.currentTarget.style.background = '#87A2FB';
            }}
          >
            {downloadingCL ? (
              <span
                style={{
                  width: 13,
                  height: 13,
                  border: '2px solid #ccc',
                  borderTopColor: '#87A2FB',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <Download size={13} />
            )}
            Cover Letter
          </button>
          {clError && (
            <span style={{ fontSize: 11, color: '#FF5555' }}>{clError}</span>
          )}
        </div>
      )}

      {/* Format selector gear */}
      {!isFailed && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFormatMenu((v) => !v)}
            title="Select file format"
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: '1.5px solid #e5e7eb',
              background: '#fff',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s, color 0.15s',
              fontSize: 11,
              fontWeight: 600,
              gap: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6F38C5';
              e.currentTarget.style.color = '#6F38C5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <Settings size={14} />
          </button>

          {showFormatMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 40,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                zIndex: 10,
                minWidth: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '6px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                Format
              </div>
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    onFormatChange(f);
                    setShowFormatMenu(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    textAlign: 'left',
                    border: 'none',
                    background: format === f ? '#f3eeff' : '#fff',
                    color: format === f ? '#6F38C5' : '#374151',
                    fontSize: 13,
                    fontWeight: format === f ? 600 : 400,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (format !== f) e.currentTarget.style.background = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    if (format !== f) e.currentTarget.style.background = '#fff';
                  }}
                >
                  {f}
                  {format === f && <span>&#10003;</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Step3Download({ jobs, sessionId, user, onReset }) {
  const [formats, setFormats] = useState(() => {
    const init = {};
    jobs.forEach((j) => { init[j.id] = 'PDF'; });
    return init;
  });
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadAllError, setDownloadAllError] = useState('');
  const [downloadAllSuccess, setDownloadAllSuccess] = useState(false);

  function handleFormatChange(jobId, fmt) {
    setFormats((prev) => ({ ...prev, [jobId]: fmt }));
  }

  async function handleDownloadAll() {
    if (!sessionId) return;
    setDownloadingAll(true);
    setDownloadAllError('');
    setDownloadAllSuccess(false);
    try {
      const blob = await downloadZip(sessionId);
      const now = new Date();
      const datetime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const filename = `genie-hi_${datetime}.zip`;
      triggerBlobDownload(blob, filename);
      setDownloadAllSuccess(true);
      setTimeout(() => setDownloadAllSuccess(false), 3000);
    } catch (err) {
      setDownloadAllError('Failed to download. Please try again.');
    } finally {
      setDownloadingAll(false);
    }
  }

  const readyJobs = jobs.filter((j) => j.status !== 'failed');
  const failedJobs = jobs.filter((j) => j.status === 'failed');

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', margin: '0 0 6px' }}>
          Download your documents
        </h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          {readyJobs.length} document{readyJobs.length !== 1 ? 's' : ''} ready to download.
          Use the gear icon to choose your preferred file format.
        </p>
      </div>

      {/* ZIP naming info */}
      <div
        style={{
          padding: '10px 14px',
          background: '#f3eeff',
          border: '1px solid #d8c6f5',
          borderRadius: 10,
          fontSize: 13,
          color: '#6F38C5',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <FileText size={14} />
        Files in zip are organized as: <code style={{ background: 'rgba(111,56,197,0.1)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>YYYYMMDD_HHMM-job-company/</code>
      </div>

      {/* Failed notice */}
      {failedJobs.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fff1f1',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            marginBottom: 16,
            fontSize: 13,
            color: '#FF5555',
          }}
        >
          {failedJobs.length} job{failedJobs.length !== 1 ? 's' : ''} failed and won't be included in the download.
        </div>
      )}

      {/* Job rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {jobs.map((job) => (
          <JobDownloadRow
            key={job.id}
            job={job}
            sessionId={sessionId}
            user={user}
            format={formats[job.id] || 'PDF'}
            onFormatChange={(fmt) => handleFormatChange(job.id, fmt)}
          />
        ))}
      </div>

      {/* Download all + Start new */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Start new */}
        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '11px 20px',
            border: '1.5px solid #e5e7eb',
            borderRadius: 10,
            background: '#fff',
            color: '#6b7280',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6F38C5';
            e.currentTarget.style.color = '#6F38C5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <RefreshCw size={15} />
          Start New Application
        </button>

        {/* Download All */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {downloadAllError && (
            <span style={{ fontSize: 12, color: '#FF5555' }}>{downloadAllError}</span>
          )}
          {downloadAllSuccess && (
            <span style={{ fontSize: 12, color: '#3DB6B1' }}>&#10003; Download started!</span>
          )}
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll || readyJobs.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 28px',
              background:
                downloadingAll || readyJobs.length === 0
                  ? '#EEEEEE'
                  : 'linear-gradient(135deg, #6F38C5, #87A2FB)',
              color: downloadingAll || readyJobs.length === 0 ? '#999' : '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: downloadingAll || readyJobs.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!downloadingAll && readyJobs.length > 0) e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              if (!downloadingAll && readyJobs.length > 0) e.currentTarget.style.opacity = '1';
            }}
          >
            {downloadingAll ? (
              <>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: '2px solid #ccc',
                    borderTopColor: '#6F38C5',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Preparing zip...
              </>
            ) : (
              <>
                <Download size={17} />
                Download All ({readyJobs.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
