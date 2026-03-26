import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  function friendlyError(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      default:
        return 'Registration failed. Please try again.';
    }
  }

  function validate() {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!validateEmail(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigate('/app');
    } catch (err) {
      setServerError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '10px 14px',
    border: `1.5px solid ${hasError ? '#FF5555' : '#d1d5db'}`,
    borderRadius: 10,
    fontSize: 15,
    color: '#1a1a2e',
    background: loading ? '#f9f9fc' : '#fff',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f3eeff 0%, #eef1ff 50%, #e8f8f7 100%)',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(111,56,197,0.12)',
          padding: '40px 36px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #6F38C5, #87A2FB)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 28, lineHeight: 1 }}>G</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' }}>
            Create your account
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Start your AI-powered job search
          </p>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div
            style={{
              background: '#fff1f1',
              border: '1px solid #fca5a5',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 14,
              color: '#FF5555',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <span style={{ flexShrink: 0, marginTop: 1 }}>&#9888;</span>
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              placeholder="you@example.com"
              disabled={loading}
              style={inputStyle(!!errors.email)}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = '#6F38C5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(111,56,197,0.12)';
                }
              }}
              onBlur={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.email && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#FF5555' }}>{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              placeholder="At least 6 characters"
              disabled={loading}
              style={inputStyle(!!errors.password)}
              onFocus={(e) => {
                if (!errors.password) {
                  e.target.style.borderColor = '#6F38C5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(111,56,197,0.12)';
                }
              }}
              onBlur={(e) => {
                if (!errors.password) {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.password && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#FF5555' }}>{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="confirm-password"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }}
              placeholder="Repeat your password"
              disabled={loading}
              style={inputStyle(!!errors.confirmPassword)}
              onFocus={(e) => {
                if (!errors.confirmPassword) {
                  e.target.style.borderColor = '#6F38C5';
                  e.target.style.boxShadow = '0 0 0 3px rgba(111,56,197,0.12)';
                }
              }}
              onBlur={(e) => {
                if (!errors.confirmPassword) {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }
              }}
            />
            {errors.confirmPassword && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#FF5555' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#EEEEEE' : '#6F38C5',
              color: loading ? '#999' : '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        {/* Login link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 14,
            color: '#6b7280',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#6F38C5', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
