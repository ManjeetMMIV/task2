import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LiquidOrb } from './LiquidOrb'

describe('LiquidOrb component', () => {
  it('renders a focusable button with correct accessibility attributes for idle state', () => {
    render(<LiquidOrb state="idle" onClick={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Start voice recording' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('updates accessibility attributes when in listening state', () => {
    render(<LiquidOrb state="listening" onClick={vi.fn()} />)
    const button = screen.getByRole('button', { name: 'Stop voice recording' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('reflects speaking and thinking states in aria labels', () => {
    const { rerender } = render(<LiquidOrb state="speaking" />)
    expect(screen.getByRole('button', { name: 'Assistant speaking' })).toBeInTheDocument()

    rerender(<LiquidOrb state="thinking" />)
    expect(screen.getByRole('button', { name: 'Processing request' })).toBeInTheDocument()
  })

  it('triggers onClick handler when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<LiquidOrb state="idle" onClick={handleClick} />)

    const button = screen.getByRole('button', { name: 'Start voice recording' })
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disables the button when disabled prop is true', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<LiquidOrb state="idle" onClick={handleClick} disabled />)

    const button = screen.getByRole('button', { name: 'Start voice recording' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('supports custom aria label', () => {
    render(<LiquidOrb ariaLabel="Custom Orb Action" />)
    expect(screen.getByRole('button', { name: 'Custom Orb Action' })).toBeInTheDocument()
  })
})
