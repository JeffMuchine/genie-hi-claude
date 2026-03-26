import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach Firebase ID token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('genie_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — surface error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

/**
 * Parse a job from a URL or raw JD text.
 * @param {string} input - URL or pasted job description
 * @returns {Promise<{id, title, company, jd_text}>}
 */
export function parseJob(input) {
  return api.post('/jobs/parse', { input }).then((r) => r.data);
}

/**
 * Upload the user's resume file.
 * @param {File} file
 * @returns {Promise<{message, filename}>}
 */
export function uploadResume(file) {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
}

/**
 * Retrieve the stored resume metadata/text.
 * @returns {Promise<{filename, text, stored_at}>}
 */
export function getResume() {
  return api.get('/resume').then((r) => r.data);
}

/**
 * Kick off document generation for a set of job IDs.
 * @param {string[]} jobIds
 * @returns {Promise<{session_id: string}>}
 */
export function generateDocuments(jobIds) {
  return api.post('/generate', { job_ids: jobIds }).then((r) => r.data);
}

/**
 * Poll generation status for a session.
 * @param {string} sessionId
 * @returns {Promise<{status, jobs: {[jobId]: {status, resume, cover_letter, error}}}>}
 */
export function getGenerationStatus(sessionId) {
  return api.get(`/generate/${sessionId}/status`).then((r) => r.data);
}

/**
 * Download all generated docs as a zip blob.
 * @param {string} sessionId
 * @returns {Promise<Blob>}
 */
export function downloadZip(sessionId) {
  return api
    .get(`/download/${sessionId}`, { responseType: 'blob' })
    .then((r) => r.data);
}

/**
 * Save a reviewed/accepted resume version.
 * @param {string} jobId
 * @param {string} sessionId
 * @param {object} acceptedContent - sections that were accepted
 * @returns {Promise<{version, saved_at}>}
 */
export function saveResumeVersion(jobId, sessionId, acceptedContent) {
  return api
    .post('/resume/versions', { job_id: jobId, session_id: sessionId, content: acceptedContent })
    .then((r) => r.data);
}

/**
 * Regenerate a cover letter with custom options.
 * @param {string} jobId
 * @param {string} sessionId
 * @param {object} options - { tone, length, highlight, currentText }
 * @returns {Promise<{cover_letter: string}>}
 */
export function regenerateCoverLetter(jobId, sessionId, options) {
  return api
    .post('/cover-letter/regenerate', {
      job_id: jobId,
      session_id: sessionId,
      ...options,
    })
    .then((r) => r.data);
}

export default api;
