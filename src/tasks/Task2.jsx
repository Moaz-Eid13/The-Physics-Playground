import { useRef, useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Equation, InlineEq } from '../components/Equation'

const CANVAS_SIZE = 500
const TRAIL_LENGTH = 300
const HISTORY_LENGTH = 200

function initParticles(N, m, r, largeParticle) {
    const particles = []
    let attempts = 0
    while (particles.length < N && attempts < N * 10) {
        attempts++
        const x = r + Math.random() * (CANVAS_SIZE - 2 * r)
        const y = r + Math.random() * (CANVAS_SIZE - 2 * r)
        const dx = x - largeParticle.x
        const dy = y - largeParticle.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < largeParticle.R + r + 5) continue
        const speed = 2.0
        const angle = Math.random() * 2 * Math.PI
        particles.push({
            x, y,
            vx: speed * Math.cos(angle),
            vy: speed * Math.sin(angle),
            m, r,
        })
    }
    return particles
}

function computeMomentumEnergy(small, large) {
    const px = small.m * small.vx + large.m * large.vx
    const py = small.m * small.vy + large.m * large.vy
    const ke = 0.5 * small.m * (small.vx ** 2 + small.vy ** 2) +
        0.5 * large.m * (large.vx ** 2 + large.vy ** 2)
    return { px, py, ke }
}

function resolveCollision(small, large) {
    const dx = large.x - small.x
    const dy = large.y - small.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist <= 0) return null
    const nx = dx / dist
    const ny = dy / dist

    const dvx = small.vx - large.vx
    const dvy = small.vy - large.vy
    const relVel = dvx * nx + dvy * ny

    if (relVel <= 0) return null

    const before = computeMomentumEnergy(small, large)

    const J = (2 * small.m * large.m * relVel) / (small.m + large.m)
    small.vx -= (J / small.m) * nx
    small.vy -= (J / small.m) * ny
    large.vx += (J / large.m) * nx
    large.vy += (J / large.m) * ny

    const after = computeMomentumEnergy(small, large)

    return {
        dPx: Math.abs(after.px - before.px),
        dPy: Math.abs(after.py - before.py),
        dKE: Math.abs(after.ke - before.ke),
    }
}

function separateParticles(small, large) {
    const dx = large.x - small.x
    const dy = large.y - small.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const minDist = small.r + large.R

    if (dist < minDist && dist > 0) {
        const overlap = minDist - dist
        const nx = dx / dist
        const ny = dy / dist
        small.x -= overlap * nx
        small.y -= overlap * ny
    }
}

const equation = String.raw`\\vec{p}`

function ExplanationPanel() {
    const [isOpen, setIsOpen] = useState(true)

    return (
        <div className="bg-[#111118] border border-[#222233] rounded-lg mb-6 overflow-hidden">
            <div
                onClick={() => setIsOpen(o => !o)}
                className="px-5 py-3 cursor-pointer flex justify-between items-center border-b 
                border-[#222233] hover:bg-[#16161f] transition-colors"
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
                        <strong className="text-white">Brownian motion</strong> is the random motion of a
                        large particle suspended in a fluid of smaller particles. It was first observed by
                        botanist Robert Brown in 1827 and explained mathematically by Einstein in 1905.
                    </p>
                    <p>
                        Each small particle of mass <InlineEq>m</InlineEq> moves in a straight line until it hits a wall
                        or the large particle of mass <InlineEq>M</InlineEq>. Collisions conserve both momentum and kinetic energy:
                    </p>
                    <Equation>p_total = m·v + M·V = constant</Equation>
                    <Equation>KE_total = ½mv² + ½MV² = constant</Equation>
                    <p>The impulse delivered to the large particle in each collision is:</p>
                    <Equation>J = 2mM(v_rel · n̂) / (m + M)</Equation>
                    <p>
                        where <InlineEq>v_rel</InlineEq> is the relative velocity and{' '}
                        <InlineEq>n̂</InlineEq> is the unit vector along the collision axis.
                    </p>
                    <p>
                        <strong className="text-white">Note on small-small collisions:</strong> in the dilute-gas
                        limit used to derive Einstein's Brownian motion theory, fluid particles are treated as
                        an uncorrelated random bath — particle-particle collisions are neglected because the
                        suspended particle is assumed to be vastly outnumbered and the fluid extremely dilute.
                        This simulation follows the same assumption: small particles only interact with walls
                        and the large particle, not with each other.
                    </p>
                    <p>
                        Over many collisions, the large particle undergoes a random walk, and its mean squared
                        displacement grows linearly with time:
                    </p>
                    <Equation>⟨x²⟩ ∝ t</Equation>
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

function Controls({ N, setN, M, setM, R, setR, r, setR_small, m, setM_small, onStart, onReset, isRunning }) {
    return (
        <div className="bg-[#111118] border border-[#222233] rounded-lg p-5 mb-4">
            <div className="text-[11px] text-neutral-600 tracking-wider mb-4">
                PARAMETERS
            </div>
            <SliderControl
                label="N - Small particles"
                value={N} min={10} max={200} step={10}
                onChange={setN}
                disabled={isRunning}
            />
            <SliderControl
                label="r - Small particles radius"
                value={r} min={1} max={8} step={1}
                onChange={setR_small}
                disabled={isRunning}
            />
            <SliderControl
                label="m - Small particles mass"
                value={m} min={0.5} max={5} step={0.5}
                onChange={setM_small}
                disabled={isRunning}
            />
            <SliderControl
                label="M - Large particle mass"
                value={M} min={2} max={30} step={1}
                onChange={setM}
                disabled={isRunning}
            />
            <SliderControl
                label="R - Large particle radius"
                value={R} min={10} max={60} step={5}
                onChange={setR}
                disabled={isRunning}
            />

            <div className="flex gap-3 mt-2">
                <button
                    onClick={onStart}
                    disabled={isRunning}
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-600 
                    disabled:bg-neutral-800 disabled:text-neutral-600 text-white 
                    text-[13px] rounded cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                    {isRunning ? 'Running...' : 'Start'}
                </button>
                <button
                    onClick={onReset}
                    className="px-5 py-2 bg-transparent hover:border-neutral-500 hover:text-white text-neutral-400
                    text-[13px] rounded border border-neutral-700 cursor-pointer transition-colors"
                >
                    Reset
                </button>
            </div>
        </div>
    )
}

function SimCanvas({ particlesRef, largeRef, trailRef }) {
    const canvasRef = useRef(null)
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let frameId
        const draw = () => {
            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
            ctx.fillStyle = '#0a0a0f'
            ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

            ctx.strokeStyle = '#4f8ef7'
            ctx.lineWidth = 2
            ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2)

            const trail = trailRef.current
            if (trail.length > 1) {
                for (let i = 1; i < trail.length; i++) {
                    const alpha = (i / trail.length) * 0.4
                    ctx.strokeStyle = `rgba(100, 160, 255, ${alpha})`
                    ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
                    ctx.lineTo(trail[i].x, trail[i].y)
                    ctx.stroke()
                }
            }
            const particles = particlesRef.current
            particles.forEach(p => {
                ctx.fillStyle = 'rgba(120, 180, 255, 0.7)'
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fill()
            })
            const large = largeRef.current
            if (large) {
                ctx.strokeStyle = 'rgba(100, 160, 255, 0.3)'
                ctx.lineWidth = 6
                ctx.beginPath()
                ctx.arc(large.x, large.y, large.R + 4, 0, Math.PI * 2)
                ctx.stroke()

                ctx.fillStyle = 'rgba(60, 120, 220, 0.5)'
                ctx.beginPath()
                ctx.arc(large.x, large.y, large.R, 0, Math.PI * 2)
                ctx.fill()

                ctx.strokeStyle = '#4f8ef7'
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(large.x, large.y, large.R, 0, Math.PI * 2)
                ctx.stroke()
            }
            frameId = requestAnimationFrame(draw)
        }
        frameId = requestAnimationFrame(draw)
        return () => cancelAnimationFrame(frameId)
    }, [particlesRef, largeRef, trailRef])

    return (
        <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-lg block w-full"
        />
    )
}

function DisplacementGraph({ history }) {
    if (history.length < 2) return null

    return (
        <div className="bg-[#111118] border border-[#222233] rounded-lg p-4 mt-4">
            <div className="text-[11px] text-neutral-600 tracking-wider mb-3">
                LARGE PARTICLE DISPLACEMENT VS TIME
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222233" />
                    <XAxis
                        dataKey="frame"
                        stroke="#555"
                        tick={{ fontSize: 11, fill: '#666' }}
                        label={{
                            value: 'Frame', position: 'insideBottom', offset: -5,
                            fontSize: 11, fill: '#666'
                        }}
                    />
                    <YAxis
                        stroke="#555"
                        tick={{ fontSize: 11, fill: '#666' }}
                        label={{
                            value: 'Displacement (px)', angle: -90, position: 'insideCenter',
                            fontSize: 11, fill: '#666'
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#111118', border: '1px solid #222233',
                            fontSize: 12
                        }}
                        labelStyle={{ color: '#aaa' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="displacement"
                        stroke="#4f8ef7"
                        strokeWidth={1.5}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

function StatsPanel({ stats, validation }) {
    if (!stats) return null
    return (
        <div className="bg-[#111118] border border-[#222233] 
        rounded-lg p-4 mt-4 font-mono text-[12px] text-neutral-400
        space-y-2">
            <div className="flex justify-between">
                <span>Collisions</span>
                <span className="text-white">{stats.collisions}</span>
            </div>
            <div className="flex justify-between">
                <span>Large Particle Displacement</span>
                <span className="text-blue-400">{stats.displacement.toFixed(2)} px</span>
            </div>
            <div className="flex justify-between">
                <span>Large Particle Speed</span>
                <span className="text-blue-400">{stats.speed.toFixed(3)} px/frame</span>
            </div>

            {validation && (
                <div className="border-t border-[#222233] pt-2 mt-2">
                    <div className="text-[11px] text-neutral-600 tracking-wider mb-2">
                        CONSERVATION CHECK (last collision)
                    </div>
                    <div className="flex justify-between">
                        <span>Momentum error (Δpx)</span>
                        <span className={validation.dPx < 0.01 ? 'text-green-400' : 'text-yellow-400'}>
                            {validation.dPx.toExponential(2)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Momentum error (Δpy)</span>
                        <span className={validation.dPy < 0.01 ? 'text-green-400' : 'text-yellow-400'}>
                            {validation.dPy.toExponential(2)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Energy error (ΔKE)</span>
                        <span className={validation.dKE < 0.01 ? 'text-green-400' : 'text-yellow-400'}>
                            {validation.dKE.toExponential(2)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function Task2() {
    const [N, setN] = useState(100)
    const [M, setM] = useState(8)
    const [R, setR] = useState(25)
    const [r, setR_small] = useState(3)
    const [m, setM_small] = useState(1)
    const [isRunning, setIsRunning] = useState(false)
    const [stats, setStats] = useState(null)
    const [validation, setValidation] = useState(null)
    const [history, setHistory] = useState([])

    const particlesRef = useRef([])
    const largeRef = useRef(null)
    const trailRef = useRef([])
    const physicsLoopRef = useRef(null)
    const collisionsRef = useRef(0)
    const startPosRef = useRef({ x: 0, y: 0 })
    const frameCountRef = useRef(0)
    const historyRef = useRef([])

    const handleReset = useCallback(() => {
        if (physicsLoopRef.current) {
            cancelAnimationFrame(physicsLoopRef.current)
            physicsLoopRef.current = null
        }
        particlesRef.current = []
        largeRef.current = null
        trailRef.current = []
        collisionsRef.current = 0
        frameCountRef.current = 0
        historyRef.current = []
        setIsRunning(false)
        setStats(null)
        setValidation(null)
        setHistory([])
    }, [])

    const handleStart = useCallback(() => {
        if (physicsLoopRef.current) {
            cancelAnimationFrame(physicsLoopRef.current)
            physicsLoopRef.current = null
        }

        const large = {
            x: CANVAS_SIZE / 2,
            y: CANVAS_SIZE / 2,
            vx: 0,
            vy: 0,
            m: M,
            R: R,
        }

        largeRef.current = large
        startPosRef.current = { x: large.x, y: large.y }
        trailRef.current = [{ x: large.x, y: large.y }]
        collisionsRef.current = 0
        frameCountRef.current = 0
        historyRef.current = []

        particlesRef.current = initParticles(N, m, r, large)
        setIsRunning(true)

        const loop = () => {
            const particles = particlesRef.current
            const lp = largeRef.current
            if (!lp) return

            let latestValidation = null

            particles.forEach(p => {
                p.x += p.vx
                p.y += p.vy

                if (p.x - p.r < 0) { p.x = p.r; p.vx *= -1 }
                if (p.x + p.r > CANVAS_SIZE) { p.x = CANVAS_SIZE - p.r; p.vx *= -1 }
                if (p.y - p.r < 0) { p.y = p.r; p.vy *= -1 }
                if (p.y + p.r > CANVAS_SIZE) { p.y = CANVAS_SIZE - p.r; p.vy *= -1 }

                const dx = p.x - lp.x
                const dy = p.y - lp.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < p.r + lp.R) {
                    separateParticles(p, lp)
                    const result = resolveCollision(p, lp)
                    if (result) {
                        collisionsRef.current += 1
                        latestValidation = result
                    }
                }
            })

            lp.x += lp.vx
            lp.y += lp.vy

            if (lp.x - lp.R < 0) { lp.x = lp.R; lp.vx *= -1 }
            if (lp.x + lp.R > CANVAS_SIZE) { lp.x = CANVAS_SIZE - lp.R; lp.vx *= -1 }
            if (lp.y - lp.R < 0) { lp.y = lp.R; lp.vy *= -1 }
            if (lp.y + lp.R > CANVAS_SIZE) { lp.y = CANVAS_SIZE - lp.R; lp.vy *= -1 }

            trailRef.current.push({ x: lp.x, y: lp.y })
            if (trailRef.current.length > TRAIL_LENGTH) {
                trailRef.current.shift()
            }

            frameCountRef.current += 1

            if (frameCountRef.current % 5 === 0) {
                const dx = lp.x - startPosRef.current.x
                const dy = lp.y - startPosRef.current.y
                const displacement = Math.sqrt(dx * dx + dy * dy)

                setStats({
                    collisions: collisionsRef.current,
                    displacement,
                    speed: Math.sqrt(lp.vx ** 2 + lp.vy ** 2),
                })

                if (latestValidation) {
                    setValidation(latestValidation)
                }
            }

            if (frameCountRef.current % 20 === 0) {
                const dx = lp.x - startPosRef.current.x
                const dy = lp.y - startPosRef.current.y
                const displacement = Math.sqrt(dx * dx + dy * dy)

                historyRef.current.push({
                    frame: frameCountRef.current,
                    displacement,
                })
                if (historyRef.current.length > HISTORY_LENGTH) {
                    historyRef.current.shift()
                }
                setHistory([...historyRef.current])
            }
            physicsLoopRef.current = requestAnimationFrame(loop)
        }
        physicsLoopRef.current = requestAnimationFrame(loop)
    }, [N, M, R, r, m])

    useEffect(() => {
        return () => {
            if (physicsLoopRef.current) cancelAnimationFrame(physicsLoopRef.current)
        }
    }, [])

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-4">
                <div className="text-[11px] text-neutral-600 tracking-widest mb-2">TASK 02</div>
                <h1 className="text-3xl font-bold text-white mb-2">Brownian Motion</h1>
                <p className="text-sm text-neutral-500">
                    N small particles colliding with a large particle, modelling <strong>Brownian Motion</strong>.
                </p>
            </div>
            <ExplanationPanel />
            <div className="flex gap-6 items-start">
                <div className="w-64 min-w-64">
                    <Controls
                        N={N} setN={setN}
                        M={M} setM={setM}
                        R={R} setR={setR}
                        r={r} setR_small={setR_small}
                        m={m} setM_small={setM_small}
                        onStart={handleStart}
                        onReset={handleReset}
                        isRunning={isRunning}
                    />
                </div>
                <div className="flex-1">
                    <SimCanvas
                        particlesRef={particlesRef}
                        largeRef={largeRef}
                        trailRef={trailRef}
                    />
                    <StatsPanel stats={stats} validation={validation} />
                    <DisplacementGraph history={history} />
                </div>
            </div>
        </div>
    )
}