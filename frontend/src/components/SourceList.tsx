import { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import type { SourceDocument } from '../types/rag'

export function SourceList({ sources }: { sources: SourceDocument[] }) {
  const [expanded, setExpanded] = useState<string | null>(sources[0]?.chunk_id ?? null)

  if (!sources.length) {
    return <p className="text-sm text-slate-500">No retrieved passages were returned.</p>
  }

  return (
    <div className="space-y-2">
      {sources.map((source, index) => {
        const open = expanded === source.chunk_id
        const metadata = Object.keys(source.metadata || {}).length
          ? JSON.stringify(source.metadata)
          : null
        return (
          <article key={source.chunk_id} className="rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            <button
              type="button"
              onClick={() => setExpanded(open ? null : source.chunk_id)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-50 font-mono text-[11px] font-bold text-indigo-600">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">Document {source.document_id}</span>
                <span className="block truncate font-mono text-[10px] text-slate-500">Chunk {source.chunk_id}</span>
              </span>
              <span className="font-mono text-[11px] font-medium text-slate-400">
                {Number.isFinite(source.score) ? source.score.toFixed(4) : '—'}
              </span>
              <FiChevronDown className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
              <div className="space-y-3 border-t border-slate-100 px-4 py-4 text-sm leading-6 text-slate-700">
                <p>{source.text}</p>
                {metadata && (
                  <p className="break-all font-mono text-[11px] text-slate-500">{metadata}</p>
                )}
              </div>
            )}
          </article>
        )
      })}
    </div>
  )
}
