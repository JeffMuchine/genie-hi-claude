import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import JobCard from '../components/JobCard.jsx'

const baseJob = {
  id: 'j1',
  title: 'Software Engineer',
  company: 'Acme Corp',
  input: 'https://example.com/job/123',
  status: 'pending',
}

describe('JobCard', () => {
  it('renders job title and company', () => {
    render(<JobCard job={baseJob} onRemove={() => {}} showStatus={false} />)
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })

  it('shows Failed badge when status is failed', () => {
    render(<JobCard job={{ ...baseJob, status: 'failed' }} onRemove={() => {}} showStatus={true} />)
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('shows Ready badge when status is ready', () => {
    render(<JobCard job={{ ...baseJob, status: 'ready' }} onRemove={() => {}} showStatus={true} />)
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('calls onRemove when X button is clicked', async () => {
    const onRemove = vi.fn()
    render(<JobCard job={baseJob} onRemove={onRemove} showStatus={false} />)
    const removeBtn = screen.getByRole('button')
    await userEvent.click(removeBtn)
    expect(onRemove).toHaveBeenCalledWith('j1')
  })
})
