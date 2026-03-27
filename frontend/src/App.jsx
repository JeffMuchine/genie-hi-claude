import { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MainApp from './pages/MainApp';
import './index.css';

// ── Auth Context ──────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// In DEV_MODE (VITE_DEV_MODE=true) we skip Firebase auth and use a mock user
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEV_USER = DEV_MODE ? { uid: 'dev-user-001', email: 'dev@genie-hi.local', displayName: 'Dev User' } : null;
const DEV_TOKEN = DEV_MODE ? 'dev-token' : null;

function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_USER);
  const [token, setToken] = useState(DEV_TOKEN);
  const [loading, setLoading] = useState(!DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) {
      if (DEV_TOKEN) localStorage.setItem('genie_token', DEV_TOKEN);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          localStorage.setItem('genie_token', idToken);
          setUser(firebaseUser);
          setToken(idToken);
        } catch (err) {
          console.error('Failed to get ID token:', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('genie_token');
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('genie_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);  // eslint-disable-line

  // Refresh token every 50 minutes (Firebase tokens expire after 1 hour)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const idToken = await user.getIdToken(true);
        localStorage.setItem('genie_token', idToken);
        setToken(idToken);
      } catch (err) {
        console.error('Token refresh failed:', err);
      }
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Route guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f9f9fc',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Purple G logo */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #6F38C5, #87A2FB)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>G</span>
        </div>
        <div
          className="spinner"
          style={{
            width: 32,
            height: 32,
            border: '3px solid #e5e7eb',
            borderTopColor: '#6F38C5',
            borderRadius: '50%',
            margin: '0 auto',
          }}
        />
      </div>
    </div>
  );
}

// ── Root redirect ─────────────────────────────────────────────────────────────
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return <Navigate to={user ? '/app' : '/login'} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/register"
            element={
              <RedirectIfAuthed>
                <RegisterPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <MainApp />
              </RequireAuth>
            }
          />
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
