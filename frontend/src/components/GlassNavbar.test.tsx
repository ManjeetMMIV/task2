import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GlassNavbar } from './GlassNavbar'

describe('GlassNavbar component', () => {
  it('renders brand name and system status', () => {
    render(<GlassNavbar status="ready" />)
    expect(screen.getByText('Aura Voice RAG')).toBeInTheDocument()
    expect(screen.getByText('System ready')).toBeInTheDocument()
  })

  it('renders different system status states accurately', () => {
    const { rerender } = render(<GlassNavbar status="warming" />)
    expect(screen.getByText('Warming up…')).toBeInTheDocument()

    rerender(<GlassNavbar status="unavailable" />)
    expect(screen.getByText('Backend unavailable')).toBeInTheDocument()
  })

  it('renders state simulator controls when showStateControls is true', async () => {
    const user = userEvent.setup()
    const handleStateChange = vi.fn()
    render(
      <GlassNavbar
        status="ready"
        orbState="idle"
        showStateControls={true}
        onStateChange={handleStateChange}
      />,
    )

    const speakingBtn = screen.getByRole('button', { name: 'speaking' })
    expect(speakingBtn).toBeInTheDocument()
    await user.click(speakingBtn)
    expect(handleStateChange).toHaveBeenCalledWith('speaking')
  })
})
