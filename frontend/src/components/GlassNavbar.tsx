import { FiActivity, FiCheckCircle, FiCpu, FiRadio } from 'react-icons/fi'
import type { OrbState } from '../types/orb'
import type { SystemStatus } from '../types/rag'

interface GlassNavbarProps {
  status: SystemStatus
  orbState?: OrbState
  onStateChange?: (newState: OrbState) => void
  showStateControls?: boolean
}

export function GlassNavbar({
  status,
  orbState = 'idle',
  onStateChange,
  showStateControls = false,
}: GlassNavbarProps) {
  return (
    <header className="sticky top-4 z-40 w-full max-w-4xl mx-auto px-4 sm:px-6">
      <nav
        aria-label="Main Navigation"
        className="flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.62)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.78)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Brand Logo / Wordmark */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-100/90 to-purple-100/70 text-indigo-600 shadow-inner border border-white/80">
            <FiRadio className="size-4 text-indigo-600" aria-hidden="true" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-indigo-500 ring-2 ring-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase font-bold tracking-[0.24em] text-indigo-500">
                HH Goa 2026
              </span>
            </div>
            <h1 className="text-sm font-semibold text-slate-800 tracking-tight leading-none">
              Aura Voice RAG
            </h1>
          </div>
        </div>

        {/* State Simulator / Selector (when enabled for testing/demos) */}
        {showStateControls && onStateChange && (
          <div className="hidden md:flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-white/60 shadow-xs text-xs font-medium text-slate-600">
            <span className="px-2 text-[11px] font-mono uppercase text-slate-600 tracking-wider">
              State:
            </span>
            {(['idle', 'listening', 'thinking', 'speaking'] as OrbState[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => onStateChange(st)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all capitalize ${
                  orbState === st
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {/* System Health / Status indicator */}
        <div className="flex items-center gap-2 text-xs" aria-live="polite">
          {status === 'ready' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/50 shadow-2xs">
              <FiCheckCircle className="size-3.5 text-emerald-500" aria-hidden="true" />
              <span>System ready</span>
            </span>
          )}
          {status === 'warming' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-200/50 shadow-2xs">
              <FiActivity className="size-3.5 animate-pulse text-indigo-500" aria-hidden="true" />
              <span>Warming up…</span>
            </span>
          )}
          {status === 'preparing' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200/50 shadow-2xs">
              <FiCpu className="size-3.5 text-slate-400" aria-hidden="true" />
              <span>Preparing…</span>
            </span>
          )}
          {status === 'degraded' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200/50 shadow-2xs">
              <FiActivity className="size-3.5 text-amber-500" aria-hidden="true" />
              <span>Backend connected</span>
            </span>
          )}
          {status === 'unavailable' && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50/80 px-3 py-1 text-xs font-medium text-rose-700 border border-rose-200/50 shadow-2xs">
              <FiActivity className="size-3.5 text-rose-500" aria-hidden="true" />
              <span>Backend unavailable</span>
            </span>
          )}
        </div>
      </nav>
    </header>
  )
}
