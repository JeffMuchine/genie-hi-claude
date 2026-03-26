import { X, Briefcase } from 'lucide-react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: '#f3f4f6',
    color: '#6b7280',
    dot: '#9ca3af',
  },
  generating: {
    label: 'Generating...',
    bg: '#eff6ff',
    color: '#3b82f6',
    dot: '#3b82f6',
  },
  ready: {
    label: 'Ready',
    bg: '#f0fdfb',
    color: '#3DB6B1',
    dot: '#3DB6B1',
  },
  failed: {
    label: 'Failed',
    bg: '#fff1f1',
    color: '#FF5555',
    dot: '#FF5555',
  },
};

export default function JobCard({ job, onRemove, showStatus }) {
  const statusKey = job.status || 'pending';
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        transition: 'box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(111,56,197,0.08)';
        e.currentTarget.style.borderColor = '#c4b0f0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#e5e7eb';
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: '#f3eeff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Briefcase size={16} color="#6F38C5" />
      </div>

      {/* Title + company */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1a1a2e',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {job.title || 'Untitled Role'}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#6b7280',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 1,
          }}
        >
          {job.company || 'Unknown Company'}
        </div>
      </div>

      {/* Status badge */}
      {showStatus && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            borderRadius: 20,
            background: statusCfg.bg,
            color: statusCfg.color,
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusCfg.dot,
              display: 'inline-block',
              animation: statusKey === 'generating' ? 'pulse-soft 1.5s ease-in-out infinite' : 'none',
            }}
          />
          {statusCfg.label}
        </div>
      )}

      {/* Error message */}
      {job.error && statusKey === 'failed' && (
        <div
          style={{
            position: 'absolute',
            bottom: -22,
            left: 64,
            fontSize: 11,
            color: '#FF5555',
          }}
        >
          {job.error}
        </div>
      )}

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={() => onRemove(job.id)}
          title="Remove job"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fff1f1';
            e.currentTarget.style.color = '#FF5555';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
