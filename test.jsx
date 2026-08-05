import { useRef, useState, useEffect, useCallback } from 'react'

// ─── Physics constants and helpers ───────────────────────────────────────────

// Generate a single random walk path
// Returns an array of {x, y} points
function generateWalkPath(N, s) {
  const points = [{ x: 0, y: 0 }]
  
  for (let i = 0; i < N; i++) {
    // Pick a uniformly random angle between 0 and 2π
    const theta = Math.random() * 2 * Math.PI
    
    const prev = points[points.length - 1]
    points.push({
      x: prev.x + s * Math.cos(theta),
      y: prev.y + s * Math.sin(theta),
    })
  }
  
  return points
}

// Calculate straight-line distance from start to end of path
function finalDisplacement(points) {
  const last = points[points.length - 1]
  return Math.sqrt(last.x ** 2 + last.y ** 2)
}

// ─── Explanation Panel ────────────────────────────────────────────────────────

function ExplanationPanel() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #222233',
      borderRadius: '8px',
      marginBottom: '24px',
      overflow: 'hidden',
    }}>
      {/* Clickable header to collapse/expand */}
      <div
        onClick={() => setIsOpen(o => !o)}
        style={{
          padding: '12px 20px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: isOpen ? '1px solid #222233' : 'none',
        }}
      >
        <span style={{ fontSize: '13px', color: '#4f8ef7', fontWeight: '600', letterSpacing: '1px' }}>
          PHYSICS BACKGROUND
        </span>
        <span style={{ color: '#555', fontSize: '12px' }}>{isOpen ? '▲ collapse' : '▼ expand'}</span>
      </div>

      {/* Content — only rendered when open */}
      {isOpen && (
        <div style={{ padding: '20px', lineHeight: '1.8', fontSize: '13px', color: '#bbb' }}>
          <p style={{ marginBottom: '12px' }}>
            A <strong style={{ color: '#fff' }}>random walk</strong> is a path consisting of N steps,
            each of size s, taken in a completely random direction. At each step, the angle θ is
            drawn from a uniform distribution over [0, 2π].
          </p>
          <p style={{ marginBottom: '12px' }}>
            The position after each step is updated as:
          </p>
          {/* Equation block */}
          <div style={{
            background: '#0a0a0f',
            border: '1px solid #222233',
            borderRadius: '4px',
            padding: '12px 20px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#4f8ef7',
            marginBottom: '12px',
          }}>
            x(n+1) = x(n) + s·cos(θ)<br />
            y(n+1) = y(n) + s·sin(θ)<br />
            θ ~ Uniform(0, 2π)
          </div>
          <p style={{ marginBottom: '12px' }}>
            For a large number of steps, the expected displacement from the origin grows as:
          </p>
          <div style={{
            background: '#0a0a0f',
            border: '1px solid #222233',
            borderRadius: '4px',
            padding: '12px 20px',
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#4f8ef7',
            marginBottom: '12px',
          }}>
            {'<'}d{'>'} = s·√N
          </div>
          <p>
            This result is fundamental to <strong style={{ color: '#fff' }}>diffusion theory</strong>,
            describing the motion of molecules in a gas, photons escaping from the Sun's core,
            and even stock price fluctuations.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Controls Panel ───────────────────────────────────────────────────────────

function Controls({ N, setN, s, setS, onStart, onReset, isRunning }) {
  return (
    <div style={{
      background: '#111118',
      border: '1px solid #222233',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '24px',
    }}>
      <div style={{ fontSize: '11px', color: '#555', letterSpacing: '1px', marginBottom: '16px' }}>
        PARAMETERS
      </div>

      {/* N slider */}
      <SliderControl
        label="N — Number of steps"
        value={N}
        min={10}
        max={2000}
        step={10}
        onChange={setN}
        display={N}
      />

      {/* s slider */}
      <SliderControl
        label="s — Step size"
        value={s}
        min={1}
        max={20}
        step={1}
        onChange={setS}
        display={s}
      />

      {/* Expected displacement (theoretical) */}
      <div style={{
        fontSize: '12px',
        color: '#666',
        marginBottom: '16px',
        fontFamily: 'monospace',
      }}>
        Expected displacement: s·√N = {(s * Math.sqrt(N)).toFixed(2)}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onStart}
          disabled={isRunning}
          style={{
            padding: '8px 20px',
            background: isRunning ? '#222' : '#4f8ef7',
            color: isRunning ? '#555' : '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '13px',
          }}
        >
          {isRunning ? 'Running...' : 'Start'}
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            color: '#aaa',
            border: '1px solid #333',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

// Reusable slider component
function SliderControl({ label, value, min, max, step, onChange, display }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
        fontSize: '12px',
        color: '#aaa',
      }}>
        <span>{label}</span>
        <span style={{ color: '#fff', fontFamily: 'monospace' }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#4f8ef7' }}
      />
    </div>
  )
}

// ─── Canvas Simulation ────────────────────────────────────────────────────────

function WalkCanvas({ points, stepIndex, canvasSize }) {
  const canvasRef = useRef(null)

  // This effect redraws the canvas every time points or stepIndex changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize)

    // Fill background
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    if (points.length < 2) return

    // Find the bounding box of the full path to scale it to fit the canvas
    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const padding = 40
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scale = Math.min(
      (canvasSize - padding * 2) / rangeX,
      (canvasSize - padding * 2) / rangeY
    )

    // Convert a physics coordinate to canvas pixel
    // We center the path in the canvas
    const toCanvas = (x, y) => ({
      cx: padding + (x - minX) * scale + (canvasSize - padding * 2 - rangeX * scale) / 2,
      cy: padding + (y - minY) * scale + (canvasSize - padding * 2 - rangeY * scale) / 2,
    })

    // Draw the path up to current stepIndex
    // Color shifts from blue to red as the walk progresses
    for (let i = 0; i < stepIndex - 1; i++) {
      const { cx: x1, cy: y1 } = toCanvas(points[i].x, points[i].y)
      const { cx: x2, cy: y2 } = toCanvas(points[i + 1].x, points[i + 1].y)

      // t goes from 0 to 1 as i goes from 0 to stepIndex
      const t = i / points.length
      // Interpolate color from blue (0,100,255) to red (255,50,50)
      const r = Math.round(t * 255)
      const b = Math.round((1 - t) * 255)
      ctx.strokeStyle = `rgb(${r}, 80, ${b})`
      ctx.lineWidth = 1

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    // Draw start point (green dot)
    const { cx: sx, cy: sy } = toCanvas(points[0].x, points[0].y)
    ctx.fillStyle = '#00ff88'
    ctx.beginPath()
    ctx.arc(sx, sy, 4, 0, Math.PI * 2)
    ctx.fill()

    // Draw current position (white dot)
    if (stepIndex > 0) {
      const { cx, cy } = toCanvas(points[stepIndex - 1].x, points[stepIndex - 1].y)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
    }

  }, [points, stepIndex, canvasSize])

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{ borderRadius: '8px', display: 'block' }}
    />
  )
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────

function StatsPanel({ points, stepIndex, s, N }) {
  if (stepIndex < 2) return null

  const currentPoints = points.slice(0, stepIndex)
  const displacement = finalDisplacement(currentPoints)
  const expected = s * Math.sqrt(N)
  const current = points[stepIndex - 1]

  return (
    <div style={{
      background: '#111118',
      border: '1px solid #222233',
      borderRadius: '8px',
      padding: '16px 20px',
      marginTop: '16px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaa',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
    }}>
      <div>Steps taken: <span style={{ color: '#fff' }}>{stepIndex - 1}</span></div>
      <div>Position: <span style={{ color: '#fff' }}>({current.x.toFixed(1)}, {current.y.toFixed(1)})</span></div>
      <div>Displacement: <span style={{ color: '#4f8ef7' }}>{displacement.toFixed(2)}</span></div>
      <div>Expected s·√N: <span style={{ color: '#4f8ef7' }}>{expected.toFixed(2)}</span></div>
    </div>
  )
}

// ─── Main Task1 Component ─────────────────────────────────────────────────────

export default function Task1() {
  const [N, setN] = useState(200)
  const [s, setS] = useState(5)
  const [points, setPoints] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // useRef to hold the animation frame ID
  // We need this to cancel the animation when Reset is clicked
  const animFrameRef = useRef(null)
  
  // useRef to hold current stepIndex inside the animation loop
  // If we used state inside the loop, it would always read the initial value
  // due to JavaScript closures — this is a common React gotcha
  const stepRef = useRef(0)

  const CANVAS_SIZE = 500

  const handleReset = useCallback(() => {
    // Cancel any ongoing animation
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
    setPoints([])
    setStepIndex(0)
    setIsRunning(false)
    stepRef.current = 0
  }, [])

  const handleStart = useCallback(() => {
    // Generate the full path upfront
    // We animate through it step by step
    const path = generateWalkPath(N, s)
    setPoints(path)
    setIsRunning(true)
    stepRef.current = 1

    // Animation loop using requestAnimationFrame
    // This is the browser's built-in way to run smooth animations
    // It calls our function before each screen repaint (~60fps)
    const animate = () => {
      stepRef.current += 3  // advance 3 steps per frame (speed control)

      if (stepRef.current >= path.length) {
        stepRef.current = path.length
        setStepIndex(path.length)
        setIsRunning(false)
        return  // stop the loop
      }

      setStepIndex(stepRef.current)
      // Schedule the next frame
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [N, s])

  // Cleanup: cancel animation if component unmounts
  // (e.g. user navigates to Task 2 while animation is running)
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [])

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: '#555', letterSpacing: '2px', marginBottom: '8px' }}>
          TASK 01
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
          Random Walk
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          A model of N steps of size s in uniformly random directions
        </p>
      </div>

      <ExplanationPanel />

      {/* Two column layout: controls left, canvas right */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ width: '260px', minWidth: '260px' }}>
          <Controls
            N={N} setN={setN}
            s={s} setS={setS}
            onStart={handleStart}
            onReset={handleReset}
            isRunning={isRunning}
          />
        </div>

        <div style={{ flex: 1 }}>
          <WalkCanvas
            points={points}
            stepIndex={stepIndex}
            canvasSize={CANVAS_SIZE}
          />
          <StatsPanel
            points={points}
            stepIndex={stepIndex}
            s={s}
            N={N}
          />
        </div>
      </div>
    </div>
  )
}