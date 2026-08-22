import type { OrbState } from '../types/orb'
import type { SystemStatus } from '../types/rag'
import { GlassNavbar } from './GlassNavbar'

interface HeaderProps {
  status: SystemStatus
  orbState?: OrbState
  onStateChange?: (state: OrbState) => void
  showStateControls?: boolean
}

export function Header({
  status,
  orbState,
  onStateChange,
  showStateControls,
}: HeaderProps) {
  return (
    <GlassNavbar
      status={status}
      orbState={orbState}
      onStateChange={onStateChange}
      showStateControls={showStateControls}
    />
  )
}
