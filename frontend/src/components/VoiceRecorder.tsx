import { FiSquare, FiX } from 'react-icons/fi'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser'
import type { OrbState } from '../types/orb'
import type { ExperienceState } from '../types/rag'
import { LiquidOrb } from './LiquidOrb'

interface VoiceRecorderProps {
  state: ExperienceState
  stream?: MediaStream | null
  orbStateOverride?: OrbState
  elapsedSeconds: number
  supported: boolean
  onStart: () => void
  onStop: () => void
  onCancel: () => void
}

function formatTime(seconds: number) {
  return `00:${seconds.toString().padStart(2, '0')}`
}

export function VoiceRecorder({
  state,
  stream = null,
  orbStateOverride,
  elapsedSeconds,
  supported,
  onStart,
  onStop,
  onCancel,
}: VoiceRecorderProps) {
  const recording = state === 'recording'
  const processing = state === 'processing'

  // Map application experience state to orb visual state
  const computedOrbState: OrbState =
    orbStateOverride ??
    (recording ? 'listening' : processing ? 'thinking' : 'idle')

  const audioAnalysis = useAudioAnalyser({
    stream,
    state: computedOrbState,
    enabled: true,
  })

  const handleOrbClick = () => {
    if (processing || !supported) return
    if (recording) {
      onStop()
    } else {
      onStart()
    }
  }

  return (
    <section
      aria-label="Voice Interaction"
      className="relative w-full max-w-xl mx-auto flex flex-col items-center py-4 text-center"
    >
      {/* Liquid Glass Orb as the Hero Centerpiece */}
      <div className="relative mb-8">
        <LiquidOrb
          size={320}
          state={computedOrbState}
          audio={audioAnalysis}
          onClick={handleOrbClick}
          disabled={processing || !supported}
          ariaLabel={recording ? 'Stop voice recording' : 'Start voice recording'}
        />
      </div>

      {/* Voice Status Heading with Editorial Serif Typography */}
      <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 transition-all duration-300">
        {recording
          ? 'Listening to your voice…'
          : processing
            ? 'Thinking & retrieving knowledge…'
            : computedOrbState === 'speaking'
              ? 'Assistant speaking'
              : 'Tap the orb to speak'}
      </h1>

      {/* Quiet Subtitle Description */}
      <p className="mt-2.5 max-w-md text-sm text-slate-500 font-light leading-relaxed">
        {recording
          ? 'Speak naturally, then tap the orb when you are finished.'
          : processing
            ? 'Transcribing speech, retrieving context, and grounding the response.'
            : computedOrbState === 'speaking'
              ? 'Synthesizing voice response with verified citations.'
              : supported
                ? 'Grounded knowledge retrieval powered by ElevenLabs voice AI'
                : 'Microphone is not supported in this browser'}
      </p>

      {/* Active Recording Controls */}
      {recording && (
        <div className="mt-6 flex items-center gap-3 animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-50/90 border border-rose-200/60 px-4 py-1.5 font-mono text-xs font-semibold text-rose-600 shadow-2xs">
            <span className="size-2 rounded-full bg-rose-500 animate-ping" />
            {formatTime(elapsedSeconds)}
          </span>
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-50 shadow-2xs focus-visible:outline-slate-400"
          >
            <FiSquare className="size-3" aria-hidden="true" /> Done
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/70 px-4 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 shadow-2xs focus-visible:outline-slate-400"
          >
            <FiX className="size-3.5" aria-hidden="true" /> Cancel
          </button>
        </div>
      )}
    </section>
  )
}
