import type { OrbPalette, OrbRenderOptions, OrbState } from '../types/orb'

interface RGB {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  }
}

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  }
}

export const PALETTES: Record<OrbState, OrbPalette> = {
  idle: {
    primary: '#5D6BFC', // Vibrant periwinkle blue (matches reference top half)
    secondary: '#7A8CFF', // Soft lavender blue
    accent: '#4353EA', // Deep royal periwinkle
    highlight: '#8EA1FF', // Luminous sky lavender
    core: '#FFFFFF', // Pure silky cloud white (matches reference bottom smoke)
  },
  listening: {
    primary: '#7548FD', // Electric violet
    secondary: '#24B8FF', // Vivid aqua cyan
    accent: '#A855F7', // Neon purple
    highlight: '#38BDF8', // Bright sky blue
    core: '#FFFFFF',
  },
  speaking: {
    primary: '#FF5948', // Vibrant warm coral
    secondary: '#F43F5E', // Warm rose
    accent: '#FB923C', // Amber orange
    highlight: '#FDE047', // Warm golden glow
    core: '#FFF8F0',
  },
  thinking: {
    primary: '#6366F1', // Indigo orchid
    secondary: '#06B6D4', // Iridescent teal
    accent: '#C084FC', // Luminous lilac
    highlight: '#2DD4BF', // Seafoam aqua
    core: '#F8FAFC',
  },
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform vec3 u_smokeColor;
uniform float u_amplitude;
uniform float u_bass;
uniform float u_mid;
uniform float u_treble;
uniform float u_reducedMotion;

// ─── Flow noise with more texture ───
float flowNoise(vec2 p) {
  return sin(p.x * 1.1 + sin(p.y * 1.0) * 1.0)
       * cos(p.y * 0.9 + cos(p.x * 1.2) * 0.9)
       + sin(p.x * 0.6 - p.y * 0.5 + sin(p.x * 0.5 + p.y * 0.6) * 1.4) * 0.5;
}

// ─── Stipple / dot grain texture ───
float stipple(vec2 p, float t) {
  // Animated soft dot pattern using high-freq sine interference
  float d = sin(p.x * 18.0 + t * 0.5) * sin(p.y * 18.0 - t * 0.4)
          + sin((p.x + p.y) * 12.0 + t * 0.3) * 0.5
          + sin((p.x - p.y) * 14.0 - t * 0.35) * 0.3;
  return d * 0.5 + 0.5; // normalize to [0, 1]
}

// ─── Multi-layer flow field ───
float smoothFlow(vec2 p, float t) {
  float f = 0.0;
  // Layer 1: broad wave
  f += 0.40 * sin(p.x * 1.0 + t * 0.4 + sin(p.y * 0.9 + t * 0.3) * 1.6);
  // Layer 2: cross-wave
  f += 0.25 * cos(p.y * 1.2 - t * 0.35 + cos(p.x * 1.1 - t * 0.2) * 1.4);
  // Layer 3: diagonal drift
  f += 0.18 * sin((p.x + p.y) * 0.9 + t * 0.45 + sin((p.x - p.y) * 0.5 + t * 0.15) * 1.1);
  // Layer 4: finer texture
  f += 0.10 * cos(p.x * 1.8 + p.y * 1.4 + t * 0.3 + sin(p.x * 0.8 - t * 0.4) * 0.9);
  // Layer 5: subtle high-freq shimmer
  f += 0.05 * sin(p.x * 2.5 - p.y * 2.2 + t * 0.5);
  return f;
}

// ─── 2D rotation ───
vec2 rotate2D(vec2 p, float a) {
  float c = cos(a), s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

// ─── Domain warping ───
float fluidWarp(vec2 p, float t, out vec2 q, out vec2 r) {
  q = vec2(
    smoothFlow(p + vec2(0.0, 0.0), t * 1.0),
    smoothFlow(p + vec2(4.8, 2.3), t * 0.95)
  );

  r = vec2(
    smoothFlow(p + 2.0 * q + vec2(1.7, 8.2), t * 0.85),
    smoothFlow(p + 2.0 * q + vec2(7.3, 1.8), t * 0.8)
  );

  return smoothFlow(p + 2.2 * r, t * 0.75);
}

void main() {
  vec2 p = (v_uv - 0.5) * 2.0;
  float dist = length(p);

  // Anti-aliased circle
  float edgeW = 3.0 / min(u_resolution.x, u_resolution.y);
  float mask = 1.0 - smoothstep(1.0 - edgeW * 2.0, 1.0, dist);
  if (mask <= 0.0) { gl_FragColor = vec4(0.0); return; }

  // Sphere curvature
  float z = sqrt(max(0.0, 1.0 - dot(p, p)));
  vec3 normal = vec3(p, z);

  // ─── Time: faster animation, boosted by audio ───
  float speed = u_reducedMotion > 0.5 ? 0.08 : 0.85;
  float audioBoost = u_amplitude * 0.6 + u_bass * 0.3 + u_mid * 0.2;
  float t = u_time * (speed + audioBoost * 0.35);

  // ─── Active swirl ───
  float swirlA = t * 0.07 + dist * 0.12;
  vec2 st = rotate2D(p, swirlA) * (0.9 + u_bass * 0.1);

  // ─── Primary fluid field ───
  vec2 q, r;
  float f = fluidWarp(st * 0.55, t, q, r);

  // ─── Secondary layer (counter-rotation) ───
  vec2 st2 = rotate2D(p, -t * 0.05 + 0.5) * 0.85;
  vec2 q2, r2;
  float f2 = fluidWarp(st2 * 0.5 + vec2(3.3, 6.1), t * 0.65, q2, r2);

  // ─── Merge layers ───
  float fluid = f * 0.6 + f2 * 0.4;
  vec2 qM = q * 0.6 + q2 * 0.4;
  vec2 rM = r * 0.55 + r2 * 0.45;

  // ─── Flowing boundary ───
  float boundary = p.y
    + fluid * 0.45
    + qM.y * 0.25
    + sin(p.x * 1.5 + t * 0.35) * 0.07
    + u_amplitude * 0.1;

  float blend = smoothstep(-0.8, 0.9, boundary);

  // ─── Color palette blending ───
  vec3 col = mix(u_color1, u_color2, clamp(length(qM) * 0.7, 0.0, 1.0));
  col = mix(col, u_color3, clamp(abs(rM.x) * 0.5, 0.0, 1.0));
  col = mix(col, u_color4, clamp(fluid * fluid * 1.0, 0.0, 1.0));

  // ─── Final color ───
  vec3 finalColor = mix(u_smokeColor, col, blend);

  // Cloud density in mist
  float cloud = smoothstep(-0.5, 0.8, fluid + qM.x * 0.1);
  finalColor = mix(finalColor, u_smokeColor * 1.01, (1.0 - blend) * cloud * 0.2);

  // ─── Stipple dot texture overlay ───
  float dots = stipple(p * 3.5 + rM * 0.5, t);
  float dotIntensity = 0.04 + u_amplitude * 0.03;
  // Dots are subtle - brighten slightly where dots are dense
  finalColor += (col - finalColor) * dots * dotIntensity * blend;
  // Also add faint dots in the mist region
  finalColor += u_smokeColor * dots * dotIntensity * 0.5 * (1.0 - blend);

  // Soft internal glow
  float glow = smoothstep(0.95, 0.0, dist);
  finalColor += u_smokeColor * (glow * 0.06);

  // ─── 3D Lighting ───
  vec3 lightDir = normalize(vec3(-0.35, 0.65, 0.68));
  float fresnel = pow(1.0 - z, 3.0);
  vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(0.0, dot(normal, halfVec)), 36.0);

  float sss = pow(max(0.0, dot(normal, -lightDir)), 2.0) * blend;
  finalColor += col * sss * 0.04;

  finalColor += mix(u_smokeColor, u_color4, blend) * fresnel * 0.16;
  finalColor += vec3(1.0) * spec * 0.24 * smoothstep(0.3, 0.9, dist);

  // Depth vignette
  float rim = smoothstep(0.65, 1.0, dist) * smoothstep(0.3, -0.9, p.y);
  finalColor = mix(finalColor, finalColor * 0.84, rim * 0.28);

  // Top bloom
  float top = smoothstep(0.6, 1.0, dist) * smoothstep(-0.3, 0.9, p.y);
  finalColor += vec3(1.0) * top * 0.025;

  gl_FragColor = vec4(finalColor, mask);
}
`

export class OrbRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null
  private program: WebGLProgram | null = null
  private buffer: WebGLBuffer | null = null

  // Uniform locations
  private uniforms: Record<string, WebGLUniformLocation | null> = {}

  // 2D Fallback context
  private ctx2d: CanvasRenderingContext2D | null = null

  private time = 0
  private smoothAmplitude = 0
  private smoothBass = 0
  private smoothMid = 0
  private smoothTreble = 0

  private currentRgb: Record<keyof OrbPalette, RGB> = {
    primary: hexToRgb(PALETTES.idle.primary),
    secondary: hexToRgb(PALETTES.idle.secondary),
    accent: hexToRgb(PALETTES.idle.accent),
    highlight: hexToRgb(PALETTES.idle.highlight),
    core: hexToRgb(PALETTES.idle.core),
  }

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.initWebGL()
  }

  private initWebGL(): void {
    if (!this.canvas || typeof this.canvas.getContext !== 'function') {
      return
    }

    try {
      this.gl =
        (this.canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false }) as WebGL2RenderingContext) ||
        (this.canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false }) as WebGLRenderingContext)
    } catch {
      this.gl = null
    }

    if (!this.gl) {
      // Fallback to 2D
      try {
        this.ctx2d = this.canvas.getContext('2d', { alpha: true })
      } catch {
        this.ctx2d = null
      }
      return
    }

    const gl = this.gl

    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)

    if (!vertShader || !fragShader) {
      this.gl = null
      return
    }

    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      this.gl = null
      return
    }

    this.program = program
    gl.useProgram(program)

    // Full-screen quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ])

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
    this.buffer = buffer

    const posAttr = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posAttr)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    // Cache uniform locations
    const uniformNames = [
      'u_resolution',
      'u_time',
      'u_color1',
      'u_color2',
      'u_color3',
      'u_color4',
      'u_smokeColor',
      'u_amplitude',
      'u_bass',
      'u_mid',
      'u_treble',
      'u_reducedMotion',
    ]

    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(program, name)
    }
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null
    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  public render(options: OrbRenderOptions): void {
    const { size, state, audio, reducedMotion } = options
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const targetPx = Math.round(size * dpr)

    if (this.canvas.width !== targetPx || this.canvas.height !== targetPx) {
      this.canvas.width = targetPx
      this.canvas.height = targetPx
    }

    // Audio smoothing
    const lerpRate = 0.15
    this.smoothAmplitude += (audio.amplitude - this.smoothAmplitude) * lerpRate
    this.smoothBass += (audio.frequencies.bass - this.smoothBass) * lerpRate
    this.smoothMid += (audio.frequencies.mid - this.smoothMid) * lerpRate
    this.smoothTreble += (audio.frequencies.treble - this.smoothTreble) * lerpRate

    // Palette smoothing
    const targetPalette = PALETTES[state]
    const colorLerp = 0.08
    for (const key of Object.keys(this.currentRgb) as (keyof OrbPalette)[]) {
      const targetRgb = hexToRgb(targetPalette[key])
      this.currentRgb[key] = lerpRgb(this.currentRgb[key], targetRgb, colorLerp)
    }

    // Time advancement
    let timeDelta = 0.016
    if (state === 'listening') {
      timeDelta = 0.02 + this.smoothAmplitude * 0.035
    } else if (state === 'speaking') {
      timeDelta = 0.024 + this.smoothMid * 0.03
    } else if (state === 'thinking') {
      timeDelta = 0.028
    }

    if (reducedMotion) {
      timeDelta = 0.003
    }

    this.time += timeDelta

    if (this.gl && this.program) {
      this.renderWebGL(targetPx, reducedMotion)
    } else if (this.ctx2d) {
      this.renderCanvas2DFallback(targetPx)
    }
  }

  private renderWebGL(targetPx: number, reducedMotion: boolean): void {
    const gl = this.gl!
    gl.viewport(0, 0, targetPx, targetPx)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.useProgram(this.program)

    if (this.uniforms.u_resolution) {
      gl.uniform2f(this.uniforms.u_resolution, targetPx, targetPx)
    }
    if (this.uniforms.u_time) {
      gl.uniform1f(this.uniforms.u_time, this.time)
    }
    if (this.uniforms.u_color1) {
      const c = this.currentRgb.primary
      gl.uniform3f(this.uniforms.u_color1, c.r, c.g, c.b)
    }
    if (this.uniforms.u_color2) {
      const c = this.currentRgb.secondary
      gl.uniform3f(this.uniforms.u_color2, c.r, c.g, c.b)
    }
    if (this.uniforms.u_color3) {
      const c = this.currentRgb.accent
      gl.uniform3f(this.uniforms.u_color3, c.r, c.g, c.b)
    }
    if (this.uniforms.u_color4) {
      const c = this.currentRgb.highlight
      gl.uniform3f(this.uniforms.u_color4, c.r, c.g, c.b)
    }
    if (this.uniforms.u_smokeColor) {
      const c = this.currentRgb.core
      gl.uniform3f(this.uniforms.u_smokeColor, c.r, c.g, c.b)
    }
    if (this.uniforms.u_amplitude) {
      gl.uniform1f(this.uniforms.u_amplitude, this.smoothAmplitude)
    }
    if (this.uniforms.u_bass) {
      gl.uniform1f(this.uniforms.u_bass, this.smoothBass)
    }
    if (this.uniforms.u_mid) {
      gl.uniform1f(this.uniforms.u_mid, this.smoothMid)
    }
    if (this.uniforms.u_treble) {
      gl.uniform1f(this.uniforms.u_treble, this.smoothTreble)
    }
    if (this.uniforms.u_reducedMotion) {
      gl.uniform1f(this.uniforms.u_reducedMotion, reducedMotion ? 1.0 : 0.0)
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  private renderCanvas2DFallback(targetPx: number): void {
    const ctx = this.ctx2d
    if (!ctx) return

    const center = targetPx / 2
    const radius = targetPx / 2

    ctx.clearRect(0, 0, targetPx, targetPx)

    ctx.save()
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.clip()

    // Smooth gradient fallback
    const grad = ctx.createLinearGradient(center, 0, center, targetPx)
    const c1 = this.currentRgb.primary
    const cCore = this.currentRgb.core
    grad.addColorStop(0, `rgb(${Math.round(c1.r * 255)}, ${Math.round(c1.g * 255)}, ${Math.round(c1.b * 255)})`)
    grad.addColorStop(1, `rgb(${Math.round(cCore.r * 255)}, ${Math.round(cCore.g * 255)}, ${Math.round(cCore.b * 255)})`)

    ctx.fillStyle = grad
    ctx.fillRect(0, 0, targetPx, targetPx)
    ctx.restore()
  }

  public cleanup(): void {
    if (this.gl) {
      if (this.program) {
        this.gl.deleteProgram(this.program)
        this.program = null
      }
      if (this.buffer) {
        this.gl.deleteBuffer(this.buffer)
        this.buffer = null
      }
      this.gl = null
    }
    this.ctx2d = null
  }
}
