import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios before importing api
vi.mock('axios', () => {
  const mockAxios = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    post: vi.fn(),
    get: vi.fn(),
  }
  return { default: mockAxios }
})

import axios from 'axios'
import { parseJob, uploadResume, generateDocuments } from '../api.js'

describe('api module', () => {
  it('creates axios instance on import', () => {
    expect(axios.create).toHaveBeenCalled()
  })
})

describe('generateDocuments', () => {
  it('maps job array to job_ids and jobs payload', async () => {
    axios.post.mockResolvedValue({ data: { session_id: 'abc123' } })
    const jobs = [
      { id: 'j1', title: 'Engineer', company: 'Acme', jd_text: 'Build things' },
    ]
    const result = await generateDocuments(jobs)
    expect(result).toEqual({ session_id: 'abc123' })
    expect(axios.post).toHaveBeenCalledWith(
      '/generate',
      { job_ids: ['j1'], jobs }
    )
  })
})
