import { useCallback, useEffect, useState } from 'react'
import { FiAlertCircle, FiArrowRight, FiRefreshCw, FiVolume2 } from 'react-icons/fi'
import { getHealth, submitVoiceQuery, warmupRag } from './api/ragApi'
import { AnswerPanel } from './components/AnswerPanel'
import { EvidenceCard } from './components/EvidenceCard'
import { LatencyPanel } from './components/LatencyPanel'
import { PipelineStrip } from './components/PipelineStrip'
import { ProcessingState } from './components/ProcessingState'
import { RequestMeta } from './components/RequestMeta'
import { VoiceRecorder } from './components/VoiceRecorder'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import type { OrbState } from './types/orb'
import type { ExperienceState, SystemStatus, VoiceRagResponse } from './types/rag'

function App() {
  const [state, setState] = useState<ExperienceState>('idle')
  const [result, setResult] = useState<VoiceRagResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, setSystemStatus] = useState<SystemStatus>('preparing')
  const [activeOrbState, setActiveOrbState] = useState<OrbState>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    let mounted = true
    async function initialize() {
      try {
        setSystemStatus('warming')
        const health = await getHealth()
        if (!mounted) return
        if (health.status === 'ok') {
          try {
            await warmupRag()
            if (mounted) setSystemStatus('ready')
          } catch {
            if (mounted) setSystemStatus('ready')
          }
        } else {
          if (mounted) setSystemStatus('degraded')
        }
      } catch {
        if (mounted) setSystemStatus('unavailable')
      }
    }
    initialize()
    return () => {
      mounted = false
    }
  }, [])

  const handleRecording = useCallback(async (blob: Blob) => {
    setState('processing')
    setActiveOrbState('thinking')
    setIsSpeaking(false)
    setError(null)
    try {
      const response = await submitVoiceQuery(blob)
      setResult(response)
      setState(response.refused ? 'refused' : 'success')
      setActiveOrbState('idle')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.')
      setState('error')
      setActiveOrbState('idle')
    }
  }, [])

  const recorder = useVoiceRecorder({ onRecordingReady: handleRecording, maxDurationSeconds: 30 })

  useEffect(() => {
    if (recorder.error) {
      setError(recorder.error)
      setState('error')
      setActiveOrbState('idle')
    }
  }, [recorder.error])

  const start = async () => {
    setResult(null)
    setError(null)
    setIsSpeaking(false)
    recorder.setError(null)
    setState('idle')
    setActiveOrbState('listening')
    await recorder.startRecording()
  }

  useEffect(() => {
    if (recorder.isRecording) {
      setState('recording')
      setActiveOrbState('listening')
    }
  }, [recorder.isRecording])

  // Derive current visual state for the orb
  const currentOrbState: OrbState = isSpeaking
    ? 'speaking'
    : recorder.isRecording || state === 'recording'
      ? 'listening'
      : state === 'processing'
        ? 'thinking'
        : activeOrbState

  return (
    <div className="relative min-h-screen text-slate-800 flex flex-col justify-between">
      {/* Subtle micro-texture layer */}
      <div className="noise-layer" aria-hidden="true" />

      {/* Main Experience Container (No Nav Bar) */}
      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24 flex flex-col items-center">
        {/* Subtle Brand Watermark & Tag */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="font-mono text-[10px] uppercase font-medium tracking-[0.3em] text-slate-400">
            Aura Voice AI
          </span>
          <h2 className="mt-3 font-serif text-4xl sm:text-6xl font-normal tracking-tight text-slate-900 leading-[1.15]">
            Ask. Retrieve. Answer with evidence.
          </h2>
          <p className="mt-3.5 max-w-lg text-sm sm:text-base text-slate-500 font-light leading-relaxed">
            ElevenLabs speech recognition meets hybrid retrieval and transparent grounding. Every result shows measured latency, grounding status, and compact evidence.
          </p>
        </div>

        {/* Liquid Glass Orb Hero Interaction */}
        <div className="w-full mt-4">
          <VoiceRecorder
            state={state}
            stream={recorder.stream}
            orbStateOverride={currentOrbState}
            elapsedSeconds={recorder.elapsedSeconds}
            supported={recorder.supported}
            onStart={start}
            onStop={recorder.stopRecording}
            onCancel={() => {
              recorder.cancelRecording()
              setState('idle')
              setActiveOrbState('idle')
              setIsSpeaking(false)
            }}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <section
            className="mt-6 w-full flex flex-col gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/80 backdrop-blur-md p-5 sm:flex-row sm:items-center shadow-xs"
            role="alert"
          >
            <FiAlertCircle className="size-6 shrink-0 text-rose-500" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-rose-950">Something went wrong while processing your request.</p>
              <p className="mt-0.5 text-xs sm:text-sm text-rose-700 font-light">{error}</p>
            </div>
            <button type="button" onClick={start} className="secondary-button shrink-0">
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          </section>
        )}

        {/* Processing State Indicator */}
        {state === 'processing' && (
          <div className="mt-8 w-full max-w-2xl mx-auto">
            <ProcessingState />
          </div>
        )}

        {/* Grounded RAG Results Display */}
        {result && (state === 'success' || state === 'refused') && (
          <div className="mt-12 space-y-6 w-full text-left animate-fade-in">
            <AnswerPanel result={result} />
            <div className="grid sm:grid-cols-2 gap-4">
              <LatencyPanel latency={result.latency} />
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsSpeaking((prev) => !prev)}
                  className="secondary-button flex-1"
                  aria-label={isSpeaking ? 'Pause AI voice' : 'Listen to AI voice'}
                >
                  <FiVolume2 className={`size-4 ${isSpeaking ? 'text-indigo-600 animate-pulse' : ''}`} aria-hidden="true" />
                  {isSpeaking ? 'Speaking…' : 'Simulate voice'}
                </button>
                <button type="button" onClick={start} className="primary-button flex-1">
                  Ask another question <FiArrowRight aria-hidden="true" />
                </button>
              </div>
            </div>
            <PipelineStrip />
            <EvidenceCard result={result} />
            <RequestMeta result={result} />
          </div>
        )}

        {/* Suggested Starter Questions — Glassmorphism Cards */}
        {!result && state === 'idle' && !error && (
          <section className="mt-12 grid gap-4 sm:grid-cols-2 w-full text-left">
            {['What causes high blood pressure?', 'What is a corporation?'].map((question) => (
              <div
                key={question}
                className="group p-5 transition-all duration-300 cursor-default"
                style={{
                  background: 'rgba(255, 255, 255, 0.35)',
                  backdropFilter: 'blur(20px) saturate(170%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(170%)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  boxShadow: '0 8px 32px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.55)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)'
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03), inset 0 1px 1px rgba(255, 255, 255, 1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02), inset 0 1px 1px rgba(255, 255, 255, 0.9)'
                }}
              >
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-slate-400 font-semibold">Try asking</p>
                <p className="mt-2 font-serif text-base font-normal text-slate-800 leading-snug">“{question}”</p>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Minimal End-Product Footer */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto px-4 border-t border-slate-200/50 py-8 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 font-light">
        <span>TRICALITES</span>
      </footer>
    </div>
  )
}

export default App
