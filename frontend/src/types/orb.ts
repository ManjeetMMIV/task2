export type OrbState = 'idle' | 'listening' | 'speaking' | 'thinking'

export interface FrequencyBands {
  bass: number
  mid: number
  treble: number
}

export interface AudioAnalysis {
  amplitude: number
  frequencies: FrequencyBands
  rawFrequencies?: Uint8Array
}

export interface OrbPalette {
  primary: string
  secondary: string
  accent: string
  highlight: string
  core: string
}

export interface OrbRenderOptions {
  size: number
  state: OrbState
  audio: AudioAnalysis
  reducedMotion: boolean
}
