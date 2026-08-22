import { useEffect, useRef, useState } from 'react'
import type { AudioAnalysis, OrbState } from '../types/orb'

interface UseAudioAnalyserOptions {
  stream?: MediaStream | null
  state?: OrbState
  enabled?: boolean
}

const DEFAULT_ANALYSIS: AudioAnalysis = {
  amplitude: 0,
  frequencies: {
    bass: 0,
    mid: 0,
    treble: 0,
  },
}

export function useAudioAnalyser({
  stream = null,
  state = 'idle',
  enabled = true,
}: UseAudioAnalyserOptions = {}) {
  const [analysis, setAnalysis] = useState<AudioAnalysis>(DEFAULT_ANALYSIS)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const simPhaseRef = useRef(0)

  // Initialize or connect Web Audio API when stream is provided
  useEffect(() => {
    if (!enabled) return

    // If we have a live media stream from microphone
    if (stream && stream.active) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioCtx) {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioCtx()
          }

          const ctx = audioContextRef.current
          if (ctx.state === 'suspended') {
            ctx.resume()
          }

          const analyser = ctx.createAnalyser()
          analyser.fftSize = 256
          analyser.smoothingTimeConstant = 0.8
          analyserRef.current = analyser

          const source = ctx.createMediaStreamSource(stream)
          source.connect(analyser)
          sourceRef.current = source

          const bufferLength = analyser.frequencyBinCount
          dataArrayRef.current = new Uint8Array(bufferLength)
        }
      } catch {
        // Fall back gracefully if Web Audio cannot be initialized
      }
    } else {
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
    }

    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [stream, enabled])

  // Continuous analysis / simulation render loop
  useEffect(() => {
    let active = true

    function update() {
      if (!active) return

      if (stream && analyserRef.current && dataArrayRef.current) {
        const analyser = analyserRef.current
        const data = dataArrayRef.current
        analyser.getByteFrequencyData(data)

        let sum = 0
        let bassSum = 0
        let midSum = 0
        let trebleSum = 0

        const len = data.length // 128 bins for fftSize 256
        const bassEnd = Math.floor(len * 0.1) // 0-12 bins
        const midEnd = Math.floor(len * 0.45) // 13-57 bins

        for (let i = 0; i < len; i++) {
          const val = data[i]
          sum += val
          if (i <= bassEnd) bassSum += val
          else if (i <= midEnd) midSum += val
          else trebleSum += val
        }

        const rawAmp = sum / (len * 255)
        // Gate out quiet background ambient noise
        const amplitude = rawAmp > 0.04 ? Math.min((rawAmp - 0.04) * 2.2, 1) : 0
        const bass = Math.min((bassSum / ((bassEnd + 1) * 255)) * 1.5, 1)
        const mid = Math.min((midSum / ((midEnd - bassEnd) * 255)) * 1.5, 1)
        const treble = Math.min((trebleSum / ((len - midEnd) * 255)) * 1.8, 1)

        setAnalysis({
          amplitude,
          frequencies: { bass, mid, treble },
          rawFrequencies: data,
        })
      } else if (state === 'speaking') {
        // Generate realistic voice cadence for AI speaking state
        simPhaseRef.current += 0.08
        const p = simPhaseRef.current
        const cadence = (Math.sin(p * 0.9) * 0.5 + 0.5) * (Math.sin(p * 2.3) * 0.3 + 0.7)
        const amp = Math.max(0, cadence * 0.65 + Math.sin(p * 5.1) * 0.15)
        const bass = Math.max(0, Math.sin(p * 1.2) * 0.5 + 0.3)
        const mid = Math.max(0, Math.sin(p * 2.4 + 1) * 0.6 + 0.25)
        const treble = Math.max(0, Math.sin(p * 4.2 + 2) * 0.4 + 0.2)

        setAnalysis({
          amplitude: amp,
          frequencies: { bass, mid, treble },
        })
      } else if (state === 'thinking') {
        simPhaseRef.current += 0.04
        const p = simPhaseRef.current
        setAnalysis({
          amplitude: 0.12 + Math.sin(p * 1.5) * 0.06,
          frequencies: {
            bass: 0.15 + Math.sin(p) * 0.08,
            mid: 0.2 + Math.cos(p * 1.3) * 0.1,
            treble: 0.25 + Math.sin(p * 2.1) * 0.1,
          },
        })
      } else {
        // Idle state: subtle ambient breath
        simPhaseRef.current += 0.02
        setAnalysis(DEFAULT_ANALYSIS)
      }

      rafIdRef.current = requestAnimationFrame(update)
    }

    rafIdRef.current = requestAnimationFrame(update)

    return () => {
      active = false
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [stream, state, enabled])

  return analysis
}
