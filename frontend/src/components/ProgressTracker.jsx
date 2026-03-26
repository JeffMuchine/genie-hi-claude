import { Check } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Insert Jobs' },
  { number: 2, label: 'Review' },
  { number: 3, label: 'Download' },
];

export default function ProgressTracker({ currentStep }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const isFuture = currentStep < step.number;

        return (
          <div key={step.number} style={{ display: 'flex', alignItems: 'center', flex: index < STEPS.length - 1 ? '1' : 'unset' }}>
            {/* Step circle + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  transition: 'all 0.2s',
                  background: isCompleted
                    ? '#6F38C5'
                    : isCurrent
                    ? '#6F38C5'
                    : '#f3f4f6',
                  color: isCompleted || isCurrent ? '#ffffff' : '#9ca3af',
                  border: isCurrent ? '2px solid #6F38C5' : isCompleted ? 'none' : '2px solid #e5e7eb',
                  boxShadow: isCurrent ? '0 0 0 4px rgba(111,56,197,0.15)' : 'none',
                }}
              >
                {isCompleted ? (
                  <Check size={15} strokeWidth={3} />
                ) : (
                  step.number
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isCurrent ? 600 : 500,
                  color: isCompleted ? '#6F38C5' : isCurrent ? '#6F38C5' : '#9ca3af',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: '0 8px',
                  marginBottom: 18, // offset for label below
                  background: isCompleted ? '#6F38C5' : '#e5e7eb',
                  transition: 'background 0.3s',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
