import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import Sidebar from '../components/Sidebar';
import ProgressTracker from '../components/ProgressTracker';
import Step1InsertJobs from '../components/Step1InsertJobs';
import Step2Review from '../components/Step2Review';
import Step3Download from '../components/Step3Download';
import { getResume } from '../api';

export default function MainApp() {
  const { user } = useAuth();

  // ── Core state ───────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [generationResults, setGenerationResults] = useState({});
  const [resumeStored, setResumeStored] = useState(false);

  // Sidebar
  const [activeTab, setActiveTab] = useState('apply');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if resume is already stored on mount
  useEffect(() => {
    async function checkResume() {
      try {
        const data = await getResume();
        setResumeStored(data?.exists !== false);
      } catch {
        setResumeStored(false);
      }
    }
    checkResume();
  }, []);

  // Reset to step 1
  function handleReset() {
    setCurrentStep(1);
    setJobs([]);
    setSessionId(null);
    setGenerationResults({});
  }

  const contentMarginLeft = sidebarCollapsed ? 64 : 220;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f9f9fc' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Main content */}
      <div
        style={{
          marginLeft: contentMarginLeft,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'margin-left 0.25s ease',
        }}
      >
        {/* Progress tracker header */}
        <div
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px 32px',
            flexShrink: 0,
          }}
        >
          <ProgressTracker currentStep={currentStep} />
        </div>

        {/* Step content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px',
          }}
        >
          {currentStep === 1 && (
            <Step1InsertJobs
              jobs={jobs}
              setJobs={setJobs}
              resumeStored={resumeStored}
              setResumeStored={setResumeStored}
              setCurrentStep={setCurrentStep}
              setSessionId={setSessionId}
              sessionId={sessionId}
              generationResults={generationResults}
              setGenerationResults={setGenerationResults}
            />
          )}

          {currentStep === 2 && (
            <Step2Review
              jobs={jobs}
              sessionId={sessionId}
              generationResults={generationResults}
              setCurrentStep={setCurrentStep}
            />
          )}

          {currentStep === 3 && (
            <Step3Download
              jobs={jobs}
              sessionId={sessionId}
              user={user}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
