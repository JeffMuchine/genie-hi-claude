import { useState, useEffect } from 'react';
import { X, Check, RefreshCw } from 'lucide-react';
import { saveResumeVersion } from '../api';

function parseSections(text) {
  if (!text) return [];
  // Split on common section headers (lines in ALL CAPS or followed by a colon)
  const lines = text.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const isHeader =
      /^[A-Z][A-Z\s&\/\-]{2,}$/.test(line.trim()) ||
      /^#{1,3}\s/.test(line.trim()) ||
      /^[A-Z].{0,40}:$/.test(line.trim());

    if (isHeader && line.trim().length > 0) {
      if (current) sections.push(current);
      current = { title: line.trim(), content: '' };
    } else {
      if (!current) current = { title: 'Header', content: '' };
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);
  return sections.filter((s) => s.content.trim() || s.title);
}

function SectionPanel({ originalSection, tailoredSection, onAccept, onReject, accepted, rejected }) {
  const hasDiff =
    tailoredSection &&
    Math.abs(
      (tailoredSection.content || '').length - (originalSection?.content || '').length
    ) > 100;

  const displayContent = accepted
    ? tailoredSection?.content || originalSection?.content
    : rejected
    ? originalSection?.content
    : tailoredSection?.content || originalSection?.content;

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        border: `1px solid ${accepted ? '#3DB6B1' : rejected ? '#e5e7eb' : '#e5e7eb'}`,
        background: accepted ? '#f0fdfb' : rejected ? '#fafafa' : '#fff',
        marginBottom: 10,
        transition: 'all 0.2s',
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {tailoredSection?.title || originalSection?.title || 'Section'}
          </span>
          {hasDiff && !accepted && !rejected && (
            <span
              style={{
                fontSize: 11,
                background: '#ede6fc',
                color: '#6F38C5',
                padding: '2px 8px',
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Updated
            </span>
          )}
          {accepted && (
            <span
              style={{
                fontSize: 11,
                background: '#f0fdfb',
                color: '#3DB6B1',
                padding: '2px 8px',
                borderRadius: 10,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <Check size={10} strokeWidth={3} /> Accepted
            </span>
          )}
          {rejected && (
            <span
              style={{
                fontSize: 11,
                background: '#f3f4f6',
                color: '#9ca3af',
                padding: '2px 8px',
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              Reverted
            </span>
          )}
        </div>

        {/* Accept / Reject buttons */}
        {!accepted && !rejected && tailoredSection && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onReject}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                background: '#fff',
                color: '#6b7280',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#FF5555';
                e.currentTarget.style.color = '#FF5555';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                border: '1px solid #3DB6B1',
                borderRadius: 6,
                background: '#f0fdfb',
                color: '#3DB6B1',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3DB6B1';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f0fdfb';
                e.currentTarget.style.color = '#3DB6B1';
              }}
            >
              Accept
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {hasDiff && !accepted && !rejected && (
        <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 8px', fontStyle: 'italic' }}>
          Edits are significant — showing updated version only.
        </p>
      )}
      <pre
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.6,
          color: rejected ? '#9ca3af' : '#374151',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'inherit',
          textDecoration: rejected ? 'line-through' : 'none',
          opacity: rejected ? 0.6 : 1,
        }}
      >
        {displayContent || '(empty)'}
      </pre>
    </div>
  );
}

export default function ResumeReviewModal({
  isOpen,
  onClose,
  jobId,
  sessionId,
  originalResume,
  tailoredResume,
  onSave,
}) {
  const [sectionStates, setSectionStates] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [version, setVersion] = useState(0);

  const originalSections = parseSections(originalResume);
  const tailoredSections = parseSections(tailoredResume);

  // Build map of tailored sections by title for quick lookup
  const tailoredMap = {};
  tailoredSections.forEach((s) => { tailoredMap[s.title] = s; });

  // Use original sections as the master list; show tailored where available
  const allSectionTitles = [
    ...new Set([
      ...originalSections.map((s) => s.title),
      ...tailoredSections.map((s) => s.title),
    ]),
  ];

  useEffect(() => {
    if (isOpen) {
      setSectionStates({});
      setSaveError('');
      setVersion(0);
    }
  }, [isOpen, jobId]);

  function handleAccept(title) {
    setSectionStates((prev) => ({ ...prev, [title]: 'accepted' }));
    setVersion((v) => v + 1);
  }

  function handleReject(title) {
    setSectionStates((prev) => ({ ...prev, [title]: 'rejected' }));
    setVersion((v) => v + 1);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    try {
      // Build accepted content
      const acceptedContent = {};
      allSectionTitles.forEach((title) => {
        const state = sectionStates[title];
        const tailored = tailoredMap[title];
        const original = originalSections.find((s) => s.title === title);
        if (state === 'accepted' && tailored) {
          acceptedContent[title] = tailored.content;
        } else if (state === 'rejected' && original) {
          acceptedContent[title] = original.content;
        } else {
          // Neither accepted nor rejected — use tailored if available, else original
          acceptedContent[title] = tailored?.content ?? original?.content ?? '';
        }
      });

      await saveResumeVersion(jobId, sessionId, acceptedContent);
      if (onSave) onSave(acceptedContent);
      onClose();
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const reviewedCount = Object.keys(sectionStates).length;
  const totalSections = allSectionTitles.length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        zIndex: 60,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 1100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          animation: 'slide-up 0.3s ease-out',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>
              Review Tailored Resume
            </h2>
            {/* Version indicator */}
            <span
              style={{
                fontSize: 11,
                background: '#ede6fc',
                color: '#6F38C5',
                padding: '3px 8px',
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              v{version}
            </span>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>
              {reviewedCount}/{totalSections} sections reviewed
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {saveError && (
              <span style={{ fontSize: 13, color: '#FF5555' }}>{saveError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '8px 20px',
                background: saving ? '#EEEEEE' : '#6F38C5',
                color: saving ? '#999' : '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {saving ? (
                <>
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
                  Saving...
                </>
              ) : (
                'Done & Save'
              )}
            </button>
            <button
              onClick={onClose}
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
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Two-panel body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Original resume */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              borderRight: '1px solid #f3f4f6',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: 16,
              }}
            >
              Original Resume
            </div>
            {originalSections.length > 0 ? (
              originalSections.map((section) => (
                <div
                  key={section.title}
                  style={{
                    padding: '12px 14px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: '1px solid #f3f4f6',
                    background: '#fafafa',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 6 }}>
                    {section.title}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: '#374151',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'inherit',
                    }}
                  >
                    {section.content}
                  </pre>
                </div>
              ))
            ) : (
              <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                Original resume not available.
              </div>
            )}
          </div>

          {/* Right: Tailored sections with accept/reject */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#6F38C5',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: 16,
              }}
            >
              Tailored Resume
            </div>
            {allSectionTitles.length > 0 ? (
              allSectionTitles.map((title) => {
                const original = originalSections.find((s) => s.title === title);
                const tailored = tailoredMap[title];
                const state = sectionStates[title];
                return (
                  <SectionPanel
                    key={title}
                    originalSection={original}
                    tailoredSection={tailored}
                    accepted={state === 'accepted'}
                    rejected={state === 'rejected'}
                    onAccept={() => handleAccept(title)}
                    onReject={() => handleReject(title)}
                  />
                );
              })
            ) : (
              <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                Tailored resume not available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
