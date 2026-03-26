import { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { regenerateCoverLetter } from '../api';

const TONE_OPTIONS = [
  { id: 'formal', label: 'Formal email' },
  { id: 'chat', label: 'Chat message' },
  { id: 'referral', label: 'Referral blurb' },
];

const LENGTH_OPTIONS = [
  { id: '50-100', label: '50–100 words' },
  { id: '100-150', label: '100–150 words' },
  { id: '150-250', label: '150–250 words' },
  { id: '250-350', label: '250–350 words' },
];

export default function CoverLetterModal({
  isOpen,
  onClose,
  jobId,
  sessionId,
  initialCoverLetter,
}) {
  const [currentText, setCurrentText] = useState(initialCoverLetter || '');
  const [lastSuccessText, setLastSuccessText] = useState(initialCoverLetter || '');
  const [tone, setTone] = useState('formal');
  const [length, setLength] = useState('100-150');
  const [highlight, setHighlight] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentText(initialCoverLetter || '');
      setLastSuccessText(initialCoverLetter || '');
      setTone('formal');
      setLength('100-150');
      setHighlight('');
      setError('');
    }
  }, [isOpen, initialCoverLetter]);

  async function handleRegenerate() {
    setRegenerating(true);
    setError('');
    try {
      const result = await regenerateCoverLetter(jobId, sessionId, {
        tone,
        length,
        highlight,
        currentText,
      });
      const newText = result.cover_letter || '';
      setCurrentText(newText);
      setLastSuccessText(newText);
    } catch (err) {
      setError('Fail to generate, try again.');
      // Restore last successful version
      setCurrentText(lastSuccessText);
    } finally {
      setRegenerating(false);
    }
  }

  if (!isOpen) return null;

  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;

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
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 900,
          height: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
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
            padding: '16px 24px',
            borderBottom: '1px solid #f3f4f6',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>
              Cover Letter
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>
              {wordCount} words
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 20px',
                background: '#6F38C5',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              LGTM
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

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: editable cover letter */}
          <div
            style={{
              flex: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRight: '1px solid #f3f4f6',
            }}
          >
            {regenerating && (
              <div
                style={{
                  padding: '8px 16px',
                  background: '#f3eeff',
                  fontSize: 13,
                  color: '#6F38C5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid #d8c6f5',
                    borderTopColor: '#6F38C5',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                Regenerating cover letter...
              </div>
            )}
            {error && (
              <div
                style={{
                  padding: '8px 16px',
                  background: '#fff1f1',
                  borderBottom: '1px solid #fca5a5',
                  fontSize: 13,
                  color: '#FF5555',
                  flexShrink: 0,
                }}
              >
                {error}
              </div>
            )}
            <textarea
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              disabled={regenerating}
              placeholder="Cover letter will appear here..."
              style={{
                flex: 1,
                padding: '20px 24px',
                border: 'none',
                resize: 'none',
                fontSize: 14,
                lineHeight: 1.7,
                color: '#374151',
                fontFamily: 'inherit',
                background: regenerating ? '#fafafa' : '#fff',
                outline: 'none',
              }}
            />
          </div>

          {/* Right: options panel */}
          <div
            style={{
              width: 280,
              padding: '20px',
              overflowY: 'auto',
              background: '#fafafa',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              flexShrink: 0,
            }}
          >
            {/* Tone */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: 8,
                }}
              >
                Tone
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TONE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTone(opt.id)}
                    disabled={regenerating}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${tone === opt.id ? '#6F38C5' : '#e5e7eb'}`,
                      background: tone === opt.id ? '#f3eeff' : '#fff',
                      color: tone === opt.id ? '#6F38C5' : '#6b7280',
                      fontSize: 13,
                      fontWeight: tone === opt.id ? 600 : 500,
                      cursor: regenerating ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: 8,
                }}
              >
                Length
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LENGTH_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setLength(opt.id)}
                    disabled={regenerating}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 8,
                      border: `1.5px solid ${length === opt.id ? '#6F38C5' : '#e5e7eb'}`,
                      background: length === opt.id ? '#f3eeff' : '#fff',
                      color: length === opt.id ? '#6F38C5' : '#6b7280',
                      fontSize: 13,
                      fontWeight: length === opt.id ? 600 : 500,
                      cursor: regenerating ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlight */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#374151',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: 8,
                }}
              >
                Highlight
              </div>
              <input
                type="text"
                value={highlight}
                onChange={(e) => setHighlight(e.target.value)}
                disabled={regenerating}
                placeholder="e.g. leadership, Python, remote work"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#374151',
                  background: regenerating ? '#f3f4f6' : '#fff',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#6F38C5')}
                onBlur={(e) => (e.target.style.borderColor = '#e5e7eb')}
              />
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9ca3af' }}>
                Specific skills or experience to emphasize
              </p>
            </div>

            {/* Regenerate button */}
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              style={{
                padding: '11px',
                background: regenerating ? '#EEEEEE' : '#6F38C5',
                color: regenerating ? '#999' : '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: regenerating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s',
                marginTop: 'auto',
              }}
              onMouseEnter={(e) => {
                if (!regenerating) e.currentTarget.style.background = '#5a2da8';
              }}
              onMouseLeave={(e) => {
                if (!regenerating) e.currentTarget.style.background = '#6F38C5';
              }}
            >
              <RefreshCw size={15} style={{ animation: regenerating ? 'spin 1s linear infinite' : 'none' }} />
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
