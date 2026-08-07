import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Equation, InlineEq } from '../components/Equation'
import { range } from 'three/tsl'

function generateWalkPath(N, s) {
  const points = [{ x: 0, y: 0 }]
  for (let i = 0; i < N; i++) {
    const theta = Math.random() * 2 * Math.PI
    const prev = points[points.length - 1]
    points.push({
      x: prev.x + s * Math.cos(theta),
      y: prev.y + s * Math.sin(theta),
    })
  }
  return points
}

function getDisplacement(points) {
  const last = points[points.length - 1]
  return Math.sqrt(last.x ** 2 + last.y ** 2)
}

function ExplanationPanel() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="bg-[#111118] border border-[#222233] rounded-lg mb-6 overflow-hidden">
      <div
        onClick={() => setIsOpen(o => !o)}
        className="px-5 py-3 cursor-pointer flex justify-between items-center border-b border-[#222233] hover:bg-[#16161f] transition-colors"
      >
        <span className="text-[13px] text-blue-400 font-semibold tracking-wider">
          PHYSICS BACKGROUND
        </span>
        <span className="text-[12px] text-neutral-600">
          {isOpen ? '▲ collapse' : '▼ expand'}
        </span>
      </div>

      {isOpen && (
        <div className="px-5 py-5 text-[13px] text-neutral-400 leading-relaxed space-y-3">
          <p>
            A <strong className="text-white">random walk</strong> is a path
            consisting of <InlineEq>N</InlineEq> steps, each of size{' '}
            <InlineEq>s</InlineEq>, taken in a completely random direction. 
            At each step, the angle <InlineEq>θ</InlineEq> is drawn from a uniform
            distribution over <InlineEq>[0, 2π]</InlineEq>.
          </p>
          <p>The position after each step is updated as:</p>
          <Equation>xₙ₊₁ = xₙ + s·cos(θ)</Equation>
          <Equation>yₙ₊₁ = yₙ + s·sin(θ),  θ ~ Uniform(0, 2π)</Equation>
          <p>
            For a large number of steps, the{' '}
            <strong className="text-white">expected displacement</strong>{' '}
            averaged over many walks grows as:
          </p>
          <Equation>⟨d⟩ = s√N</Equation>
          <p>
            Any single walk may land far from this value — the formula is a
            statistical average. Run multiple walks to see the average converge.
            This is fundamental to{' '}
            <strong className="text-white">diffusion theory</strong> — it
            describes molecular motion in gases, photons escaping the Sun's
            core, and financial price fluctuations.
          </p>
        </div>
      )}
    </div>
  )
}

function SliderControl({ label, value, min, max, step, onChange, disabled }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1.5 text-[12px] text-neutral-400">
        <span>{label}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full accent-blue-500"
      />
    </div>
  )
}

function Controls({ N, setN, s, setS, numWalks, setNumWalks, onStart, onReset, isRunning }) {
  return (
    <div className="bg-[#111118] border border-[#222233] rounded-lg p-5 mb-4">
      <div className="text-[11px] text-neutral-600 tracking-wider mb-4">
        PARAMETERS
      </div>

      <SliderControl
        label="N - Steps per walk"
        value={N} min={10} max={2000} step={10}
        onChange={setN}
        disabled={isRunning}
      />
      <SliderControl
        label="s - Step size"
        value={s} min={1} max={20} step={1}
        onChange={setS}
        disabled={isRunning}
      />
      <SliderControl
        label="Walks - Number of walks"
        value={numWalks} min={1} max={20} step={1}
        onChange={setNumWalks}
        disabled={isRunning}
      />

      <div className="text-[12px] text-neutral-600 font-mono mb-4">
        Theoretical s·√N = {(s * Math.sqrt(N)).toFixed(2)}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onStart}
          disabled={isRunning}
          className="px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-800 disabled:text-neutral-600 
          text-white text-[13px] rounded cursor-pointer disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running...' : 'Start'}
        </button>
        <button
          onClick={onReset}
          className="px-5 py-2 bg-transparent hover:border-neutral-500 hover:text-white text-neutral-400 text-[13px] 
          rounded border border-neutral-700 cursor-pointer transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function walkColor(index, total) {
  const hue = (index / total) * 360
  return `hsla(${hue}, 80%, 60%, 1)`
}

function WalkCanvas({ walks, stepIndex, showVector }) {
  const canvasRef = useRef(null)

  const viewport = useMemo(() => {
    if (walks.length === 0) return null
    const allPoints = walks.flat()
    const xs = allPoints.map(p => p.x)
    const ys = allPoints.map(p => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    const size = 500
    const padding = 40
    const rangeX = maxX - minX || 1
    const rangeY = maxY - minY || 1
    const scale = Math.min(
      (size - padding * 2) / rangeX,
      (size - padding * 2) / rangeY
    )
    return { minX, minY, rangeX, rangeY, scale, padding, size }
  }, [walks])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !viewport ) return
    const ctx = canvas.getContext('2d')
    const { minX, minY, rangeX, rangeY, scale, padding, size } = viewport

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, size, size)

    const toCanvas = (x, y) => ({
      cx: padding + (x - minX) * scale + (size - padding * 2 - rangeX * scale) / 2,
      cy: padding + (y - minY) * scale + (size - padding * 2 - rangeY * scale) / 2,
    })

    walks.forEach((points, walkIdx) => {
      const color = walkColor(walkIdx, walks.length)
      const visiblePoints = points.slice(0, stepIndex + 1)

      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      visiblePoints.forEach((p, i) => {
        const { cx, cy } = toCanvas(p.x, p.y)
        if (i === 0) ctx.moveTo(cx, cy)
        else ctx.lineTo(cx, cy)
      })
      ctx.stroke()
      ctx.globalAlpha = 1

      const last = visiblePoints[visiblePoints.length - 1]
      if (!last) return

      if (showVector && stepIndex >= points.length - 1) {
        const { cx: x0, cy: y0 } = toCanvas(0, 0)
        const { cx: x1, cy: y1 } = toCanvas(last.x, last.y)

        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(x1, y1)
        ctx.stroke()
        ctx.setLineDash([])

        const angle = Math.atan2(y1 - y0, x1 - x0)
        const arrowSize = 7
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(
          x1 - arrowSize * Math.cos(angle - Math.PI / 6),
          y1 - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          x1 - arrowSize * Math.cos(angle + Math.PI / 6),
          y1 - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()
      }

      const { cx, cy } = toCanvas(last.x, last.y)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(cx, cy, 3, 0, Math.PI * 2)
      ctx.fill()
    })

    const { cx: ox, cy: oy } = toCanvas(0, 0)
    ctx.fillStyle = '#00ff88'
    ctx.beginPath()
    ctx.arc(ox, oy, 5, 0, Math.PI * 2)
    ctx.fill()

  }, [walks, stepIndex, showVector])

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={500}
      className="rounded-lg block w-full"
    />
  )
}

function DisplacementHistogram({ walks, stepIndex, theoretical }) {
    if (walks.length < 2 || stepIndex < 2) return null

    const displacements = walks.map(points => {
      const visible = points.slice(0, stepIndex + 1)
      return getDisplacement(visible)
    })

    const maxD = Math.max(...displacements, theoretical) * 1.2
    const numBins = Math.min(10, walks.length)
    const binWidth = maxD / numBins

    const bins = Array.from({ length: numBins }, (_, i) => {
      const binStart = i * binWidth
      const binEnd = binStart + binWidth
      const count = displacements.filter(d => d >= binStart && d < binEnd).length
      return {
        range: `${binStart.toFixed(0)}-${binEnd.toFixed(0)}`,
        count,
      }
    })

    return (
      <div className="bg-[#111118] border border-[#222233] rounded-lg p-4 mt-4">
        <div className="text-[11px] text-neutral-600 tracking-wider mb-1">
          DISPLACEMENT DISTRIBUTION
        </div>
        <div className="text-[10px] text-neutral-700 mb-3">
          n = {walks.length} walks · dashed reference = theoretical ⟨d⟩ = s√N = {theoretical.toFixed(2)}
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={bins}>
            <CartesianGrid 
              strokeDasharray="3 3"
              stroke="#222233"
            />
            <XAxis 
              dataKey="range"
              stroke="#555"
              tick={{ fontSize: 11, fill: '#666' }}
              label={{ value: 'Displacement (px)', position: 'insideBottom', offset: -5,
                fontSize: 11, fill: '#666'
              }}
            />
            <YAxis
              stroke="#555"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#666'}}
              label={{ value: 'Count', angle: -90, position: 'insideCenter', fontSize: 11, fill: '#666' }}
            />
            <Tooltip
              contentStyle={{ background: '#111118', border: '1px solid #222233', fontSize: 12 }}
              labelStyle={{ color: '#aaa' }}
            />
            <Bar
              dataKey="count"
              fill="#4f8ef7"
              fillOpacity={0.6}
              stroke="#4f8ef7"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
}

function StatsPanel({ walks, stepIndex, s, N }) {
  if (walks.length === 0 || stepIndex < 2) return null

  const displacements = walks.map(points => {
    const visible = points.slice(0, stepIndex + 1)
    return getDisplacement(visible)
  })

  const avgDisplacement = displacements.reduce((a, b) => a + b, 0) / displacements.length
  const theoretical = s * Math.sqrt(N)
  const isComplete = stepIndex >= N

  return (
    <div className="bg-[#111118] border border-[#222233] rounded-lg p-4 mt-4 
                    font-mono text-[12px] text-neutral-400 space-y-2"
    >
      <div className="flex justify-between">
        <span>Walks drawn</span>
        <span className="text-white">{walks.length}</span>
      </div>
      <div className="flex justify-between">
        <span>Steps taken</span>
        <span className="text-white">{Math.min(stepIndex, N)}</span>
      </div>

      <div className="border-t border-[#222233] pt-2 space-y-1">
        {displacements.map((d, i) => (
          <div key={i} className="flex justify-between">
            <span>Walk {i + 1} displacement</span>
            <span className="text-neutral-300">{d.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-[#222233] pt-2 space-y-1">
        <div className="flex justify-between">
          <span>Average displacement</span>
          <span className="text-blue-400">{avgDisplacement.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Theoretical s·√N</span>
          <span className="text-blue-400">{theoretical.toFixed(2)}</span>
        </div>
        {isComplete && (
          <div className="flex justify-between">
            <span>Difference</span>
            <span className="text-neutral-400">
              {Math.abs(avgDisplacement - theoretical).toFixed(2)}
              {' '}({((Math.abs(avgDisplacement - theoretical) / theoretical) * 100).toFixed(1)}%)
            </span>
          </div>
        )}
        {isComplete && (
          <div className="text-[10px] text-neutral-600 pt-1">
            Small differences are expected — this is sampling variance. Increase "Walks" to converge closer to theory.
          </div>
        )}
      </div>
    </div>
  )
}

export default function Task1() {
  const [N, setN] = useState(200)
  const [s, setS] = useState(5)
  const [numWalks, setNumWalks] = useState(5)
  const [walks, setWalks] = useState([])
  const [stepIndex, setStepIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [showVector, setShowVector] = useState(true)

  const animFrameRef = useRef(null)
  const stepRef = useRef(0)

  const handleReset = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    setWalks([])
    setStepIndex(0)
    setIsRunning(false)
    stepRef.current = 0
  }, [])

  const handleStart = useCallback(() => {
    const allWalks = Array.from({ length: numWalks }, () => generateWalkPath(N, s))
    setWalks(allWalks)
    setIsRunning(true)
    stepRef.current = 0

    const animate = () => {
      stepRef.current += 4

      if (stepRef.current >= N) {
        stepRef.current = N
        setStepIndex(N)
        setIsRunning(false)
        return
      }

      setStepIndex(stepRef.current)
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [N, s, numWalks])

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const theoretical = s * Math.sqrt(N)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] text-neutral-600 tracking-widest mb-2">TASK 01</div>
        <h1 className="text-3xl font-bold text-white mb-2">Random Walk</h1>
        <p className="text-sm text-neutral-500">
          A model of N steps of size s in uniformly random directions
        </p>
      </div>

      <ExplanationPanel />

      <div className="flex gap-6 items-start">
        <div className="w-64 min-w-64">
          <Controls
            N={N} setN={setN}
            s={s} setS={setS}
            numWalks={numWalks} setNumWalks={setNumWalks}
            onStart={handleStart}
            onReset={handleReset}
            isRunning={isRunning}
          />

          <div className="bg-[#111118] border border-[#222233] rounded-lg p-4">
            <div className="text-[11px] text-neutral-600 tracking-wider mb-3">
              DISPLAY OPTIONS
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showVector}
                onChange={e => setShowVector(e.target.checked)}
                className="accent-blue-500 w-3.5 h-3.5"
              />
              <span className="text-[13px] text-neutral-400">
                Show displacement vector
              </span>
            </label>
          </div>
        </div>

        <div className="flex-1">
          <WalkCanvas
            walks={walks}
            stepIndex={stepIndex}
            showVector={showVector}
          />
          <StatsPanel
            walks={walks}
            stepIndex={stepIndex}
            s={s}
            N={N}
          />
          <DisplacementHistogram
            walks={walks}
            stepIndex={stepIndex}
            theoretical={theoretical}
          />
        </div>
      </div>
    </div>
  )
}