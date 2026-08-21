import { FiActivity, FiCheckCircle, FiDatabase } from 'react-icons/fi'
import type { SystemStatus } from '../types/rag'

interface HeaderProps {
  status: SystemStatus
}

export function Header({ status }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 py-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600">
          <FiDatabase aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-indigo-500 font-semibold">HH Goa 2026</p>
          <p className="text-sm font-bold text-slate-900">Voice RAG</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs" aria-live="polite">
        {status === 'ready' && (
          <>
            <FiCheckCircle className="size-4 text-emerald-500" aria-hidden="true" />
            <span className="font-medium text-emerald-700">System ready</span>
          </>
        )}
        {status === 'warming' && (
          <>
            <FiActivity className="size-4 animate-pulse text-indigo-500" aria-hidden="true" />
            <span className="font-medium text-indigo-600">Warming up…</span>
          </>
        )}
        {status === 'preparing' && (
          <>
            <FiActivity className="size-4 text-slate-400" aria-hidden="true" />
            <span className="font-medium text-slate-500">Preparing…</span>
          </>
        )}
        {status === 'degraded' && (
          <>
            <FiActivity className="size-4 text-amber-500" aria-hidden="true" />
            <span className="font-medium text-amber-700">Backend connected</span>
          </>
        )}
        {status === 'unavailable' && (
          <>
            <FiActivity className="size-4 text-rose-500" aria-hidden="true" />
            <span className="font-medium text-rose-700">Backend unavailable</span>
          </>
        )}
      </div>
    </header>
  )
}

