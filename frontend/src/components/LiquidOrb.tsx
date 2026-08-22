import { useCallback, useEffect, useRef, useState } from 'react'
import { OrbRenderer } from '../lib/OrbRenderer'
import type { AudioAnalysis, OrbState } from '../types/orb'

interface LiquidOrbProps {
  state?: OrbState
  audio?: AudioAnalysis
  onClick?: () => void
  disabled?: boolean
  size?: number
  ariaLabel?: string
  className?: string
}

const DEFAULT_AUDIO: AudioAnalysis = {
  amplitude: 0,
  frequencies: {
    bass: 0,
    mid: 0,
    treble: 0,
  },
}

export function LiquidOrb({
  state = 'idle',
  audio = DEFAULT_AUDIO,
  onClick,
  disabled = false,
  size = 320,
  ariaLabel,
  className = '',
}: LiquidOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<OrbRenderer | null>(null)
  const rafRef = useRef<number | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Listen for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [])

  // Initialize renderer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    try {
      const renderer = new OrbRenderer(canvas)
      rendererRef.current = renderer
    } catch {
      // Graceful canvas context fallback
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.cleanup()
        rendererRef.current = null
      }
    }
  }, [])

  // Animation render loop
  const renderFrame = useCallback(() => {
    if (rendererRef.current) {
      rendererRef.current.render({
        size,
        state,
        audio,
        reducedMotion,
      })
    }
    rafRef.current = requestAnimationFrame(renderFrame)
  }, [size, state, audio, reducedMotion])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(renderFrame)
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [renderFrame])

  // Derive accessible label
  const computedAriaLabel =
    ariaLabel ??
    (state === 'listening'
      ? 'Stop voice recording'
      : state === 'speaking'
        ? 'Assistant speaking'
        : state === 'thinking'
          ? 'Processing request'
          : 'Start voice recording')

  const isInteractive = Boolean(onClick) && !disabled

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Soft Ambient Ethereal Aura Glow */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70 pointer-events-none transition-all duration-700"
        aria-hidden="true"
        style={{
          background:
            state === 'listening'
              ? 'radial-gradient(circle, rgba(117, 72, 253, 0.45) 0%, rgba(36, 184, 255, 0.25) 50%, transparent 75%)'
              : state === 'speaking'
                ? 'radial-gradient(circle, rgba(255, 89, 72, 0.45) 0%, rgba(244, 63, 94, 0.25) 50%, transparent 75%)'
                : state === 'thinking'
                  ? 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(6, 182, 212, 0.25) 50%, transparent 75%)'
                  : 'radial-gradient(circle, rgba(93, 107, 252, 0.35) 0%, rgba(122, 140, 255, 0.18) 50%, transparent 75%)',
          transform: 'scale(1.3)',
        }}
      />

      {/* Main Interactive Spherical Container */}
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-label={computedAriaLabel}
        aria-pressed={state === 'listening'}
        aria-expanded={state === 'listening'}
        className={`relative rounded-full overflow-hidden block transition-transform duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60 ${
          isInteractive ? 'cursor-pointer hover:scale-[1.025] active:scale-[0.975]' : 'cursor-default'
        }`}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow:
            state === 'listening'
              ? '0 20px 50px rgba(117, 72, 253, 0.28), 0 6px 20px rgba(36, 184, 255, 0.18), inset 0 1.5px 3px rgba(255, 255, 255, 0.9), inset 0 -3px 10px rgba(0, 0, 0, 0.08)'
              : state === 'speaking'
                ? '0 20px 50px rgba(255, 89, 72, 0.28), 0 6px 20px rgba(244, 63, 94, 0.18), inset 0 1.5px 3px rgba(255, 255, 255, 0.9), inset 0 -3px 10px rgba(0, 0, 0, 0.08)'
                : '0 20px 48px rgba(15, 23, 42, 0.08), 0 4px 14px rgba(0, 0, 0, 0.03), inset 0 1.5px 3px rgba(255, 255, 255, 0.9), inset 0 -3px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Edge-to-Edge WebGL Domain-Warped Smoke Shader Canvas */}
        <canvas
          ref={canvasRef}
          className="w-full h-full block rounded-full pointer-events-none"
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </button>
    </div>
  )
}
