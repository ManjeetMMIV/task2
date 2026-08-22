import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useAudioAnalyser } from './useAudioAnalyser'

describe('useAudioAnalyser hook', () => {
  it('returns default initial values for idle state', () => {
    const { result } = renderHook(() => useAudioAnalyser({ state: 'idle' }))
    expect(result.current.amplitude).toBe(0)
    expect(result.current.frequencies.bass).toBe(0)
    expect(result.current.frequencies.mid).toBe(0)
    expect(result.current.frequencies.treble).toBe(0)
  })

  it('generates simulated speech frequencies for speaking state', () => {
    const { result } = renderHook(() => useAudioAnalyser({ state: 'speaking' }))
    expect(typeof result.current.amplitude).toBe('number')
    expect(typeof result.current.frequencies.bass).toBe('number')
  })
})
