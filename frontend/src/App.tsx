import { useCallback, useEffect, useState } from 'react'
import { FiAlertCircle, FiArrowRight, FiRefreshCw } from 'react-icons/fi'
import { getHealth, submitVoiceQuery, warmupRag } from './api/ragApi'
import { AnswerPanel } from './components/AnswerPanel'
import { EvidenceCard } from './components/EvidenceCard'
import { Header } from './components/Header'
import { LatencyPanel } from './components/LatencyPanel'
import { PipelineStrip } from './components/PipelineStrip'
import { ProcessingState } from './components/ProcessingState'
import { RequestMeta } from './components/RequestMeta'
import { VoiceRecorder } from './components/VoiceRecorder'
import { useVoiceRecorder } from './hooks/useVoiceRecorder'
import type { ExperienceState, SystemStatus, VoiceRagResponse } from './types/rag'

function App() {
  const [state, setState] = useState<ExperienceState>('idle')
  const [result, setResult] = useState<VoiceRagResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('preparing')

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
    setError(null)
    try {
      const response = await submitVoiceQuery(blob)
      setResult(response)
      setState(response.refused ? 'refused' : 'success')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.')
      setState('error')
    }
  }, [])

  const recorder = useVoiceRecorder({ onRecordingReady: handleRecording, maxDurationSeconds: 30 })

  useEffect(() => {
    if (recorder.error) {
      setError(recorder.error)
      setState('error')
    }
  }, [recorder.error])

  const start = async () => {
    setResult(null)
    setError(null)
    recorder.setError(null)
    setState('idle')
    await recorder.startRecording()
  }

  useEffect(() => {
    if (recorder.isRecording) setState('recording')
  }, [recorder.isRecording])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="noise-layer" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <Header status={systemStatus} />

        <main className="py-8 sm:py-16 flex flex-col items-center text-center">
          <div className="mb-10 flex flex-col items-center">
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-indigo-600 font-semibold">Voice-first retrieval</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              Ask. Retrieve. Answer with evidence.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600">
              ElevenLabs speech recognition meets hybrid retrieval and transparent grounding. Every result shows measured latency, grounding status, and compact evidence.
            </p>
          </div>

          <VoiceRecorder
            state={state}
            elapsedSeconds={recorder.elapsedSeconds}
            supported={recorder.supported}
            onStart={start}
            onStop={recorder.stopRecording}
            onCancel={() => {
              recorder.cancelRecording()
              setState('idle')
            }}
          />

          {error && (
            <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-rose-300/15 bg-rose-300/5 p-5 sm:flex-row sm:items-center" role="alert">
              <FiAlertCircle className="size-6 shrink-0 text-rose-300" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-medium text-rose-100">Something went wrong while processing your request.</p>
                <p className="mt-1 text-sm text-rose-200/65">{error}</p>
              </div>
              <button type="button" onClick={start} className="secondary-button">
                <FiRefreshCw aria-hidden="true" /> Try again
              </button>
            </section>
          )}

          {state === 'processing' && <div className="mt-8 w-full max-w-2xl mx-auto"><ProcessingState /></div>}

          {result && (state === 'success' || state === 'refused') && (
            <div className="mt-10 space-y-6 w-full max-w-3xl mx-auto text-left">
              <AnswerPanel result={result} />
              <div className="grid sm:grid-cols-2 gap-4">
                <LatencyPanel latency={result.latency} />
                <div className="flex items-center">
                  <button type="button" onClick={start} className="primary-button w-full h-full">
                    Ask another question <FiArrowRight aria-hidden="true" />
                  </button>
                </div>
              </div>
              <PipelineStrip />
              <EvidenceCard result={result} />
              <RequestMeta result={result} />
            </div>
          )}

          {!result && state === 'idle' && !error && (
            <section className="mt-10 grid gap-4 sm:grid-cols-2 w-full max-w-3xl mx-auto text-left">
              {['What causes high blood pressure?', 'What is a corporation?'].map((question) => (
                <div key={question} className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-sm transition-shadow hover:shadow-md cursor-default">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-500 font-semibold">Try asking</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">“{question}”</p>
                </div>
              ))}
            </section>
          )}
        </main>

        <footer className="flex flex-col items-center gap-3 border-t border-slate-200 py-8 text-xs text-slate-500 sm:flex-row sm:justify-between w-full max-w-3xl mx-auto">
          <span className="font-medium">HH Goa 2026 · Voice RAG</span>
          <span>Actual request timings · No fake streaming · Grounded responses</span>
        </footer>
      </div>
    </div>
  )
}

export default App
