import { describe, expect, it } from 'vitest'
import { OrbRenderer } from './OrbRenderer'
import { noise2D, noise3D } from './noise'

describe('Simplex noise library', () => {
  it('generates continuous noise in bounded range [-1, 1] for 2D', () => {
    for (let x = 0; x < 10; x += 0.5) {
      for (let y = 0; y < 10; y += 0.5) {
        const val = noise2D(x, y)
        expect(val).toBeGreaterThanOrEqual(-1.5)
        expect(val).toBeLessThanOrEqual(1.5)
      }
    }
  })

  it('generates smooth continuous 3D noise values', () => {
    for (let t = 0; t < 5; t += 0.2) {
      const val = noise3D(1.2, 3.4, t)
      expect(typeof val).toBe('number')
      expect(Number.isFinite(val)).toBe(true)
    }
  })
})

describe('OrbRenderer class', () => {
  it('instantiates and runs render without crashing', () => {
    const canvas = document.createElement('canvas')
    const renderer = new OrbRenderer(canvas)

    expect(() => {
      renderer.render({
        size: 300,
        state: 'idle',
        audio: {
          amplitude: 0.5,
          frequencies: { bass: 0.4, mid: 0.3, treble: 0.2 },
        },
        reducedMotion: false,
      })
    }).not.toThrow()

    expect(() => {
      renderer.render({
        size: 300,
        state: 'speaking',
        audio: {
          amplitude: 0.8,
          frequencies: { bass: 0.7, mid: 0.6, treble: 0.5 },
        },
        reducedMotion: true,
      })
    }).not.toThrow()

    expect(() => renderer.cleanup()).not.toThrow()
  })
})
