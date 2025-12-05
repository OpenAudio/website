import { useEffect, useRef, useState } from 'react'
import { Application, Graphics, TilingSprite, Texture } from 'pixi.js'

function hslToHex(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (0 <= h && h < 60) [r, g, b] = [c, x, 0]
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0]
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x]
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c]
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const R = Math.round((r + m) * 255), G = Math.round((g + m) * 255), B = Math.round((b + m) * 255)
  return (R << 16) | (G << 8) | B
}

type OrbProps = {
  className?: string
  style?: React.CSSProperties
  onReady?: () => void
}

function Orb({ className, style, onReady }: OrbProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [nowPlaying, setNowPlaying] = useState<{ title: string; artist: string } | null>(null)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const readyFiredRef = useRef<boolean>(false)
  const onReadyRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const app = new Application()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

    const getSize = () => ({ width: container.clientWidth, height: container.clientHeight })
    let { width, height } = getSize()

    const init = async () => {
      await app.init({
        antialias: true,
        backgroundAlpha: 1,
        background: 0x000000,
        resolution: pixelRatio,
        hello: false,
        autoDensity: true,
        resizeTo: undefined
      })
      container.querySelectorAll('canvas').forEach((c) => c.parentNode?.removeChild(c))
      container.appendChild(app.canvas)
      // Allow vertical scrolling gestures on mobile while still handling taps
      try { (app.canvas as HTMLCanvasElement).style.touchAction = 'pan-y' } catch { /* ignore */ }

      app.renderer.resize(width, height)

      // Seamless tiling grid for infinite parallax
      const createGridTexture = (step: number, line: number, alpha: number) => {
        const cvs = document.createElement('canvas')
        // Scale for crisp lines on high-DPI
        const scale = pixelRatio
        cvs.width = Math.max(1, Math.round(step * scale))
        cvs.height = Math.max(1, Math.round(step * scale))
        const ctx = cvs.getContext('2d', { alpha: true })!
        ctx.clearRect(0, 0, cvs.width, cvs.height)
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#141414'
        const w = cvs.width
        const h = cvs.height
        const lw = Math.max(1, Math.round(line * scale))
        // vertical line at x=0 and horizontal at y=0
        ctx.fillRect(0, 0, lw, h)
        ctx.fillRect(0, 0, w, lw)
        return Texture.from(cvs)
      }

      const gridStep = 24
      const gridLine = 1
      const gridTexture = createGridTexture(gridStep, gridLine, 0.6)
      const grid = new TilingSprite(gridTexture)
      grid.width = width
      grid.height = height
      app.stage.addChild(grid)

      const circle = new Graphics()
      app.stage.addChild(circle)

      let pointerX = width / 2
      let pointerY = height / 2
      let pointerActive = false
      let pressedOnOrb = false
      const handlePointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect()
        const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom
        const px = Math.min(rect.right, Math.max(rect.left, e.clientX)) - rect.left
        const py = Math.min(rect.bottom, Math.max(rect.top, e.clientY)) - rect.top
        pointerX = px
        pointerY = py
        pointerActive = inside
      }
      // No explicit pointerleave handler; we compute "inside" via window pointermove bounds checks
      const handlePointerDown = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect()
        const px = e.clientX - rect.left
        const py = e.clientY - rect.top
        const dx = px - centerX
        const dy = py - centerY
        let ang = Math.atan2(dy, dx)
        if (ang < 0) ang += Math.PI * 2
        const idx = Math.round((ang / (Math.PI * 2)) * NUM_POINTS) % NUM_POINTS
        const rAt = radii[idx]
        const d = Math.hypot(dx, dy)
        pressedOnOrb = d <= rAt
        if (pressedOnOrb) {
          pressTarget = 1
        }
      }
      const handlePointerUp = async () => {
        if (pressedOnOrb) {
          pressedOnOrb = false
          pressTarget = 0
          pressVelocity -= 8
          if (isRing) {
            isRing = false
            await stopAudio()
            setIsPlaying(false)
          } else {
            isRing = true
            if (selectedTrackBaseUrl && audioEl) {
              // resume existing track; keep metadata
              startAudio()
            } else {
              setNowPlaying(null)
              await playRandomTrack()
            }
            setIsPlaying(true)
          }
        }
      }
      window.addEventListener('pointermove', handlePointerMove)
      container.addEventListener('pointerdown', handlePointerDown)
      window.addEventListener('pointerup', handlePointerUp)

      // Drift for organic motion when pointer inactive
      let driftPhase = 0
      const driftSpeed = 0.12 // radians/sec
      const driftRadiusRatio = 0.06 // relative to min(width,height)

      const NUM_POINTS = 96
      let baseRadius = Math.min(width, height) * 0.8 * 0.5
      const angles: number[] = Array.from({ length: NUM_POINTS }, (_, i) => (i / NUM_POINTS) * Math.PI * 2)
      const radii: number[] = Array.from({ length: NUM_POINTS }, () => baseRadius)
      const velocities: number[] = Array.from({ length: NUM_POINTS }, () => 0)

      let pressValue = 0
      let pressVelocity = 0
      let pressTarget = 0
      const pressStiffness = 30
      const pressDamping = 10

      let isRing = false
      let audioCtx: AudioContext | null = null
      let analyser: AnalyserNode | null = null
      let audioEl: HTMLAudioElement | null = null
      let mediaNode: MediaElementAudioSourceNode | null = null
      let gainNode: GainNode | null = null
      let floatFreqDb: Float32Array | null = null
      const TRACKS: string[] = [
        'https://api.audius.co/v1/tracks/17Rbb65',
        'https://api.audius.co/v1/tracks/aAqxE3z',
        'https://api.audius.co/v1/tracks/daqwaoJ',
        'https://api.audius.co/v1/tracks/oR4wmVa',
        'https://api.audius.co/v1/tracks/83XyGxW',
        'https://api.audius.co/v1/tracks/mQj6a5Q',
        'https://api.audius.co/v1/tracks/lpyrbGZ',
        'https://api.audius.co/v1/tracks/J83vpaz',
        'https://api.audius.co/v1/tracks/VE6wl7W',
        'https://api.audius.co/v1/tracks/wkAp0qr',
        'https://api.audius.co/v1/tracks/OovgEBR',
      ]
      let selectedTrackBaseUrl: string | null = null

      const FFT_SIZE = 2048
      const VIS_BINS = 96
      const repeats = 18
      const ringSmoothing = 1
      const audioMaxOffsetRatio = 0.28

      let phaseOffset = 0
      let spinVel = 0
      let spinVelTarget = 0

      const ATTACK_TC = 0.025
      const DECAY_TC = 0.16
      const visPrev: number[] = new Array(VIS_BINS).fill(0)
      const prevDbBins: number[] = new Array(VIS_BINS).fill(-120)

      const HISTORY = 60
      const history: number[][] = Array.from({ length: HISTORY }, () => new Array(VIS_BINS).fill(-120))
      let histIdx = 0

      const BASE_LINE = 1
      const MAX_LINE = 40
      let kickEnv = 0
      let hiEnv = 0

      const ensureAudioElement = (src?: string) => {
        if (!audioEl) {
          audioEl = new Audio(src || '')
          audioEl.crossOrigin = 'anonymous'
          audioEl.preload = 'auto'
          try { audioEl.load() } catch { /* ignore */ }
        }
        if (src) {
          try { audioEl.src = src } catch { /* ignore */ }
        }
      }

      const startAudio = async (streamSrc?: string) => {
        // If we already initialized audio, just resume and play
        if (audioCtx) {
          try {
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume()
            }
          } catch {
            // ignore resume errors
          }
          try {
            if (streamSrc) ensureAudioElement(streamSrc)
            else ensureAudioElement()
            if (audioEl && audioEl.paused) {
              await audioEl.play()
            }
          } catch {
            // ignore play errors
          }
          // Fade in on resume
          try {
            if (gainNode) {
              const now = audioCtx.currentTime
              gainNode.gain.cancelScheduledValues(now)
              gainNode.gain.setValueAtTime(0, now)
              gainNode.gain.linearRampToValueAtTime(1, now + 1)
            }
          } catch { /* ignore */ }
          return
        }
        const w = window as unknown as { webkitAudioContext?: { new (): AudioContext } }
        const AudioContextCtor = window.AudioContext ?? w.webkitAudioContext
        if (!AudioContextCtor) return
        audioCtx = new AudioContextCtor()
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = FFT_SIZE
        analyser.smoothingTimeConstant = 0
        if (streamSrc) ensureAudioElement(streamSrc)
        else ensureAudioElement()
        if (audioEl && !mediaNode) {
          mediaNode = audioCtx.createMediaElementSource(audioEl)
          gainNode = audioCtx.createGain()
          // start silent
          // try { gainNode.gain.setValueAtTime(0, audioCtx.currentTime) } catch { /* ignore */ }
          mediaNode.connect(gainNode)
          gainNode.connect(analyser)
          analyser.connect(audioCtx.destination)
        }
        floatFreqDb = new Float32Array(analyser.frequencyBinCount)
        if (audioEl) audioEl.loop = true
        try {
          if (audioEl) await audioEl.play()
        } catch {
          // ignore autoplay errors
        }
        // Fade in on first start
        try {
          if (gainNode && audioCtx) {
            // const now = audioCtx.currentTime
            // gainNode.gain.cancelScheduledValues(now)
            // gainNode.gain.setValueAtTime(0, now)
            // gainNode.gain.linearRampToValueAtTime(1, now + 1)
          }
        } catch { /* ignore */ }
      }

      const pickRandomTrack = (): string => {
        const idx = Math.floor(Math.random() * TRACKS.length)
        return TRACKS[Math.max(0, Math.min(TRACKS.length - 1, idx))]
      }

      const playRandomTrack = async () => {
        if (!selectedTrackBaseUrl) selectedTrackBaseUrl = pickRandomTrack()
        const base = selectedTrackBaseUrl
        const streamSrc = `${base}/stream`
        // Fire-and-forget start; do not await to avoid blocking UI
        startAudio(streamSrc)
        // Fetch metadata separately
        try {
          const res = await fetch(base, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            const title: string | undefined = json?.data?.title
            const name: string | undefined = json?.data?.user?.name
            if (title && name) setNowPlaying({ title, artist: name })
          }
        } catch { /* ignore meta errors */ }
      }

      const stopAudio = async () => {
        // Only pause so we can resume later
        if (audioEl) {
          try { audioEl.pause() } catch { /* ignore */ }
        }
        if (audioCtx && audioCtx.state === 'running') {
          try { await audioCtx.suspend() } catch { /* ignore */ }
        }
        // Keep references intact to allow fast resume
      }

      let centerX = width / 2
      let centerY = height / 2
      let centerVX = 0
      let centerVY = 0

      const physics = {
        pointStiffness: 22,
        pointDamping: 10,
        attractionStrength: 0.32,
        attractionSigma: 0.78,
        centerStiffness: 2.6,
        centerDamping: 5.6,
        parallaxFactor: 0.42,
        // Non-linear tether length for center offset (feels like string to center)
        tetherLengthRatio: 0.32,
      }

      let hoverValue = 0
      const hoverFadeSpeed = 2
      const maxDarken = 0.14

      let effectiveBaseRadius = baseRadius
      const computeTargetRadius = (idx: number): number => {
        const angle = angles[idx]
        const dxC = pointerX - centerX
        const dyC = pointerY - centerY
        const distToCenter = Math.hypot(dxC, dyC)
        const pointerAngle = Math.atan2(dyC, dxC)
        let dTheta = Math.abs(pointerAngle - angle)
        if (dTheta > Math.PI) dTheta = 2 * Math.PI - dTheta
        // Only deform when pointer is near or just outside the orb edge
        const edgeRadius = effectiveBaseRadius
        if (!pointerActive) return edgeRadius
        // Distance falloff: use smoothstep from edge outward (corner vs side consistent)
        const over = Math.max(0, distToCenter - edgeRadius)
        const overNorm = Math.min(1, over / Math.max(1, edgeRadius * 0.45))
        const overSmooth = overNorm * overNorm * (3 - 2 * overNorm) // smoothstep
        if (overSmooth <= 0) return edgeRadius
        const gauss = Math.exp(-(dTheta * dTheta) / (2 * physics.attractionSigma * physics.attractionSigma))
        const maxDeform = 0.10
        const influence = Math.min(maxDeform, physics.attractionStrength * gauss * overSmooth)
        return edgeRadius * (1 - influence)
      }

      const drawCircle = () => {
        const midX = width / 2
        const midY = height / 2
        const dx = pointerX - midX
        const dy = pointerY - midY
        // Axis-wise non-linear tether for consistent approach to edges and corners
        const tetherLen = Math.min(width, height) * physics.tetherLengthRatio
        const offXToTarget = tetherLen * Math.tanh(dx / Math.max(1e-6, tetherLen))
        const offYToTarget = tetherLen * Math.tanh(dy / Math.max(1e-6, tetherLen))
        let targetCX = midX + offXToTarget
        let targetCY = midY + offYToTarget
        // Add subtle drift when pointer inactive
        const dt = app.ticker.deltaMS / 1000
        driftPhase = (driftPhase + driftSpeed * dt) % (Math.PI * 2)
        if (!pointerActive) {
          const r = Math.min(width, height) * driftRadiusRatio * (0.6 + 0.4 * (1 + Math.sin(driftPhase * 0.7)) / 2)
          targetCX += Math.cos(driftPhase) * r
          targetCY += Math.sin(driftPhase * 1.7) * r
        }
        const ax = physics.centerStiffness * (targetCX - centerX) - physics.centerDamping * centerVX
        const ay = physics.centerStiffness * (targetCY - centerY) - physics.centerDamping * centerVY
        centerVX += ax * dt
        centerVY += ay * dt
        centerX += centerVX * dt
        centerY += centerVY * dt

        // Removed hard/soft clamps to avoid sudden damping near corners
        const aPress = pressStiffness * (pressTarget - pressValue) - pressDamping * pressVelocity
        pressVelocity += aPress * dt
        pressValue += pressVelocity * dt
        if (pressValue < 0) { pressValue = 0; pressVelocity = 0 }
        if (pressValue > 1) { pressValue = 1; pressVelocity = 0 }

        effectiveBaseRadius = baseRadius * (1 - 0.6 * pressValue) * (1 + 0.08 * kickEnv)

        const offX = centerX - midX
        const offY = centerY - midY
        const offLen = Math.hypot(offX, offY)

        // Parallax via tiling offset; subtle easing with decay
        {
          const decayLen = Math.max(1, Math.min(width, height) * 0.6)
          const k = 2.0
          const decay = 1 - Math.exp(-(k * offLen) / decayLen)
          const factor = physics.parallaxFactor * decay
          const shiftX = -offX * factor
          const shiftY = -offY * factor
          grid.tilePosition.set(shiftX, shiftY)
        }

        let visValues: number[] | null = null
        let bassLevel = 0
        let highLevel = 0

        if (isRing && floatFreqDb && analyser) {
          const halfLen = Math.max(1, Math.floor(floatFreqDb.length / 2))
          const dbBins = new Array<number>(VIS_BINS)
          for (let b = 0; b < VIS_BINS; b++) {
            const t = b / (VIS_BINS - 1)
            const kf = 1 + (halfLen - 1) * Math.pow(t, 1.8)
            const k0 = Math.max(1, Math.floor(kf))
            const k1 = Math.min(halfLen - 1, k0 + 2)
            let sum = 0, count = 0
            for (let k = k0; k <= k1; k++) { sum += floatFreqDb[k]; count++ }
            dbBins[b] = sum / Math.max(1, count)
          }

          history[histIdx] = dbBins.slice()
          histIdx = (histIdx + 1) % HISTORY
          const agcBins = new Array<number>(VIS_BINS)
          for (let b = 0; b < VIS_BINS; b++) {
            const column = new Array<number>(HISTORY)
            for (let i = 0; i < HISTORY; i++) column[i] = history[i][b]
            column.sort((a, c) => a - c)
            const p10 = column[Math.floor(0.10 * (HISTORY - 1))]
            const p90 = column[Math.floor(0.90 * (HISTORY - 1))]
            const span = Math.max(6, p90 - p10)
            agcBins[b] = Math.max(0, (dbBins[b] - p10) / span)
          }

          let maxDb = -1e9
          for (let b = 0; b < VIS_BINS; b++) if (dbBins[b] > maxDb) maxDb = dbBins[b]
          const soft: number[] = new Array(VIS_BINS)
          let softSum = 0
          const SOFTMAX_TAU = 0.6
          for (let b = 0; b < VIS_BINS; b++) { const s = Math.exp((dbBins[b] - maxDb) / SOFTMAX_TAU); soft[b] = s; softSum += s }
          for (let b = 0; b < VIS_BINS; b++) soft[b] = soft[b] / (softSum || 1)

          let mean = 0; for (let b = 0; b < VIS_BINS; b++) mean += dbBins[b]; mean /= VIS_BINS
          let varSum = 0; for (let b = 0; b < VIS_BINS; b++) { const d = dbBins[b] - mean; varSum += d * d }
          const std = Math.sqrt(varSum / VIS_BINS) + 1e-6
          const zRect: number[] = new Array(VIS_BINS)
          for (let b = 0; b < VIS_BINS; b++) zRect[b] = Math.max(0, (dbBins[b] - mean) / std)
          let zMax = 1e-6; for (let b = 0; b < VIS_BINS; b++) if (zRect[b] > zMax) zMax = zRect[b]
          for (let b = 0; b < VIS_BINS; b++) zRect[b] = Math.min(1, Math.pow(zRect[b] / zMax, 0.8))

          const flux: number[] = new Array(VIS_BINS)
          for (let b = 0; b < VIS_BINS; b++) {
            const df = dbBins[b] - prevDbBins[b]
            flux[b] = Math.max(0, df / 6)
            prevDbBins[b] = dbBins[b]
          }

          const contrast: number[] = new Array(VIS_BINS)
          const R = 2
          for (let b = 0; b < VIS_BINS; b++) {
            let sum = 0; let cnt = 0
            for (let r = -R; r <= R; r++) {
              if (r === 0) continue
              const j = Math.min(VIS_BINS - 1, Math.max(0, b + r))
              sum += dbBins[j]; cnt++
            }
            const neigh = sum / Math.max(1, cnt)
            const d = dbBins[b] - neigh
            contrast[b] = Math.max(0, d / 6)
          }

          const MIX_ALPHA = 0.30
          const MIX_BETA  = 0.20
          const MIX_GAMMA = 0.30
          const MIX_DELTA = 0.20

          visValues = new Array<number>(VIS_BINS)
          const dtSec = app.ticker.deltaMS / 1000
          const attackK = Math.min(1, dtSec / ATTACK_TC)
          const decayK = Math.min(1, dtSec / DECAY_TC)
          for (let b = 0; b < VIS_BINS; b++) {
            let amp = MIX_ALPHA * soft[b] + MIX_BETA * zRect[b] + MIX_GAMMA * flux[b] + MIX_DELTA * contrast[b]
            amp *= 0.6 + 0.8 * Math.min(1, agcBins[b])
            amp = Math.min(1, Math.max(0, amp))
            const prev = visPrev[b]
            const k = amp > prev ? attackK : decayK
            const env = prev + (amp - prev) * k
            visPrev[b] = env
            visValues[b] = env
          }

          const bassEnd = Math.floor(VIS_BINS * 0.12)
          const highStart = Math.floor(VIS_BINS * 0.60)
          let bSum = 0, bCnt = 0, hSum = 0, hCnt = 0
          for (let b = 0; b < VIS_BINS; b++) {
            if (b <= bassEnd) { bSum += visValues[b]; bCnt++ }
            if (b >= highStart) { hSum += visValues[b]; hCnt++ }
          }
          bassLevel = (bCnt ? bSum / bCnt : 0)
          highLevel = (hCnt ? hSum / hCnt : 0)

          const kickIn = Math.min(1, bassLevel * 1.6)
          kickEnv += (kickIn - kickEnv) * (kickIn > kickEnv ? 0.35 : 0.1)

          const hiIn = Math.min(1, highLevel * 1.4)
          hiEnv += (hiIn - hiEnv) * (hiIn > hiEnv ? 0.25 : 0.08)

          spinVelTarget = 0.2 + 3.2 * hiEnv
          spinVel += (spinVelTarget - spinVel) * 0.08
          phaseOffset = (phaseOffset + spinVel * dtSec) % 1
        }

        // Compute base targets for all points first
        const baseTargets: number[] = new Array(NUM_POINTS)
        for (let i = 0; i < NUM_POINTS; i++) {
          baseTargets[i] = computeTargetRadius(i)
        }
        // Neighbor smoothing to make deformation feel organic
        const SMOOTH_PASSES = 2
        const SMOOTH_K = 0.28
        let from = baseTargets
        let to: number[] = new Array(NUM_POINTS)
        for (let p = 0; p < SMOOTH_PASSES; p++) {
          for (let i = 0; i < NUM_POINTS; i++) {
            const im1 = (i - 1 + NUM_POINTS) % NUM_POINTS
            const ip1 = (i + 1) % NUM_POINTS
            const neighborAvg = 0.5 * (from[im1] + from[ip1])
            to[i] = from[i] * (1 - SMOOTH_K) + neighborAvg * SMOOTH_K
          }
          const tmp = from
          from = to
          to = tmp
        }
        const finalTargets = from

        for (let i = 0; i < NUM_POINTS; i++) {
          let targetR = finalTargets[i]
          if (visValues) {
            const phase = ((i / NUM_POINTS) * repeats + phaseOffset) % 1
            const x = Math.round(phase * (VIS_BINS - 1))
            const amp = visValues[x]
            const maxOff = effectiveBaseRadius * audioMaxOffsetRatio
            const targetOff = Math.pow(amp, 1.3) * maxOff
            audioOffsets[i] += (targetOff - audioOffsets[i]) * ringSmoothing
            targetR += audioOffsets[i]
          } else {
            audioOffsets[i] += (0 - audioOffsets[i]) * ringSmoothing
          }

          const disp = targetR - radii[i]
          const acc = physics.pointStiffness * disp - physics.pointDamping * velocities[i]
          velocities[i] += acc * dt
          radii[i] += velocities[i] * dt
        }

        const dxPtr = pointerX - centerX
        const dyPtr = pointerY - centerY
        const distPtr = Math.hypot(dxPtr, dyPtr)
        let pAngle = Math.atan2(dyPtr, dxPtr)
        if (pAngle < 0) pAngle += Math.PI * 2
        const idx = Math.round((pAngle / (Math.PI * 2)) * NUM_POINTS) % NUM_POINTS
        const radiusAtPointer = radii[idx]
        const isInsideOrb = pointerActive && distPtr <= radiusAtPointer

        const dtHover = app.ticker.deltaMS / 1000
        const hoverTarget = isInsideOrb ? 1 : 0
        const k = Math.min(1, dtHover * hoverFadeSpeed)
        hoverValue += (hoverTarget - hoverValue) * k

        container.style.cursor = isInsideOrb ? 'pointer' : 'default'

        const baseHue = (360 * (phaseOffset % 1))
        const hue = (baseHue + 20 * hiEnv) % 360
        const sat = 0.65 + 0.25 * hiEnv
        const light = (0.70 + 0.18 * kickEnv) * (1 - hoverValue * maxDarken)
        const strokeColor = hslToHex(hue, Math.min(1, sat), Math.min(1, light))
        const lineWidth = BASE_LINE + (MAX_LINE - BASE_LINE) * Math.min(1, 0.85 * kickEnv + 0.25 * hiEnv)

        circle.clear()
        if (isRing) {
          circle.lineStyle(lineWidth, strokeColor, 1)
          circle.moveTo(centerX + radii[0] * Math.cos(angles[0]), centerY + radii[0] * Math.sin(angles[0]))
          for (let i = 1; i < NUM_POINTS; i++) {
            const r = radii[i]
            const a = angles[i]
            const px = centerX + Math.cos(a) * r
            const py = centerY + Math.sin(a) * r
            circle.lineTo(px, py)
          }
          circle.closePath()
          circle.stroke()
        } else {
          circle.lineStyle(0, 0, 0)
          const fillColor = 0xffffff
          circle.beginFill(fillColor)
          circle.moveTo(centerX + radii[0] * Math.cos(angles[0]), centerY + radii[0] * Math.sin(angles[0]))
          for (let i = 1; i < NUM_POINTS; i++) {
            const r = radii[i]
            const a = angles[i]
            const px = centerX + Math.cos(a) * r
            const py = centerY + Math.sin(a) * r
            circle.lineTo(px, py)
          }
          circle.closePath()
          circle.endFill()
        }

        // No need to move sprite; tilePosition handles panning seamlessly
      }

      const audioOffsets: number[] = Array.from({ length: NUM_POINTS }, () => 0)

      const onResize = () => {
        const size = getSize()
        width = size.width
        height = size.height
        app.renderer.resize(width, height)
        baseRadius = Math.min(width, height) * 0.8 * 0.5
        for (let i = 0; i < audioOffsets.length; i++) audioOffsets[i] = 0
        for (let i = 0; i < radii.length; i++) { radii[i] = baseRadius; velocities[i] = 0 }
        centerX = width / 2
        centerY = height / 2
        // Resize tiling grid and regenerate texture for crispness
        const newTex = createGridTexture(gridStep, gridLine, 0.6)
        grid.texture = newTex
        grid.width = width
        grid.height = height
        drawCircle()
      }

      window.addEventListener('resize', onResize)
      // Begin preloading stream early to reduce first-play latency
      ensureAudioElement()
      drawCircle()

      // Signal readiness after the canvas is in the DOM and first frame drawn
      requestAnimationFrame(() => {
        if (!readyFiredRef.current) {
          readyFiredRef.current = true
          try {
            const cb = onReadyRef.current
            if (cb) cb()
          } catch { /* ignore */ }
        }
      })

      app.ticker.add(() => {
        if (analyser && isRing && floatFreqDb) {
          analyser.getFloatFrequencyData(floatFreqDb)
          const minDb = analyser.minDecibels ?? -120
          const maxDb = analyser.maxDecibels ?? -30
          for (let i = 0; i < floatFreqDb.length; i++) {
            const v = floatFreqDb[i]
            if (!Number.isFinite(v)) floatFreqDb[i] = minDb
            else if (v < minDb) floatFreqDb[i] = minDb
            else if (v > maxDb) floatFreqDb[i] = maxDb
          }
        }
        drawCircle()
      })

      return () => {
        window.removeEventListener('resize', onResize)
        window.removeEventListener('pointermove', handlePointerMove)
        container.removeEventListener('pointerdown', handlePointerDown)
        window.removeEventListener('pointerup', handlePointerUp)
        if (audioEl) { try { audioEl.pause() } catch { /* ignore */ } }
        if (audioCtx) { try { audioCtx.close() } catch { /* ignore */ } }
        container.style.cursor = 'default'
        app.destroy(true)
        if (app.canvas && app.canvas.parentNode) {
          app.canvas.parentNode.removeChild(app.canvas)
        }
      }
    }

    let cleanup: (() => void) | undefined
    init().then((dispose) => {
      cleanup = dispose
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        position: 'relative',
        touchAction: 'pan-y',
        ...style,
      }}
    >
      {nowPlaying && isPlaying ? (
        <div
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            fontFamily: 'new-science, sans-serif',
            fontSize: 8,
            letterSpacing: '0.12em',
            color: '#ffffff',
            textTransform: 'uppercase',
            opacity: 0.85,
            pointerEvents: 'none',
            zIndex: 2,
            userSelect: 'none',
          }}
        >
          {`Now Playing ${nowPlaying.title} by ${nowPlaying.artist}`}
        </div>
      ) : null}
    </div>
  )
}

export default Orb


