import { useEffect, useState } from 'react';

const MESSAGES = [
  (n, total) => `Generating ${n} of ${total}...`,
  () => 'Analyzing your experience...',
  () => 'Tailoring resume keywords...',
  () => 'Crafting your cover letter...',
  () => 'Optimizing for ATS...',
  () => 'Almost there...',
];

export default function LoadingAnimation({ total = 1, completed = 0 }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const currentMsg = MESSAGES[msgIndex](completed + 1, total);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 28,
      }}
    >
      {/* Spinner ring with G logo */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {/* SVG spinner ring */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* Track */}
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="5"
          />
          {/* Animated arc */}
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="#6F38C5"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="90 150"
            strokeDashoffset="-10"
            style={{
              transformOrigin: 'center',
              animation: 'spin 1.2s linear infinite',
            }}
          />
        </svg>

        {/* G logo in the center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6F38C5, #87A2FB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 24, lineHeight: 1 }}>G</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 320 }}>
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
              width: total > 0 ? `${Math.max(5, (completed / total) * 100)}%` : '5%',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          <span>{completed} of {total} complete</span>
          <span>{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
        </div>
      </div>

      {/* Cycling message */}
      <div
        key={msgIndex}
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: '#6F38C5',
          textAlign: 'center',
          animation: 'fade-in 0.4s ease-out',
        }}
      >
        {currentMsg}
      </div>

      {/* Job chips */}
      {total > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 400 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: i < completed ? '#f0fdfb' : i === completed ? '#ede6fc' : '#f3f4f6',
                color: i < completed ? '#3DB6B1' : i === completed ? '#6F38C5' : '#9ca3af',
                border: `1px solid ${i < completed ? '#3DB6B1' : i === completed ? '#6F38C5' : '#e5e7eb'}`,
                transition: 'all 0.3s',
              }}
            >
              Job {i + 1}
              {i < completed ? ' ✓' : i === completed ? ' ...' : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
