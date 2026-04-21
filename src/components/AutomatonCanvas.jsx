// ── AutomatonCanvas.jsx ──────────────────────────────────────
// Premium canvas-based automaton visualizer with:
//   • RAF-driven animation loop (pulse, glow)
//   • Active state highlighting (mint glow + scale)
//   • History trail (faded visited states)
//   • Active edge lighting on transitions
//   • Responsive, HiDPI aware

import { useRef, useEffect, useCallback } from 'react'

/* ─── Layout helpers ──────────────────────────────────────── */
function computePositions(states, W, H) {
  const n = states.length
  if (n === 0) return {}
  const R_orbit = Math.min(W, H) * 0.36
  const cx = W / 2, cy = H / 2
  const pos = {}
  states.forEach((s, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2
    pos[s] = { x: cx + R_orbit * Math.cos(angle), y: cy + R_orbit * Math.sin(angle) }
  })
  return pos
}

function buildEdgeMap(auto, pos) {
  const eMap = {}
  for (const from of auto.states) {
    for (const sym of [...auto.alpha, 'ε']) {
      for (const to of (auto.T[from]?.[sym] || [])) {
        if (!pos[to]) continue
        const k = `${from}§${to}`
        if (!eMap[k]) eMap[k] = []
        eMap[k].push(sym)
      }
    }
  }
  return eMap
}

/* ─── Canvas renderer ─────────────────────────────────────── */
function render(ctx, W, H, auto, pos, eMap, opts) {
  const {
    activeState,
    visitedStates,
    activeEdge,        // { from, to } — the edge currently being traversed
    pulseT,            // 0-1 animation time for pulse ring
    R_NODE = 26,
  } = opts

  // Background + dot grid
  ctx.fillStyle = '#E4DDD3'
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(0,0,0,0.045)'
  for (let x = 32; x < W; x += 40)
    for (let y = 32; y < H; y += 40) {
      ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill()
    }

  if (!auto || auto.states.length === 0) return

  // ── Draw edges ─────────────────────────────────────────────
  for (const [k, syms] of Object.entries(eMap)) {
    const [f, t] = k.split('§')
    if (!pos[f] || !pos[t]) continue

    const isEps = syms.includes('ε')
    const isActive = activeEdge && activeEdge.from === f && activeEdge.to === t

    let baseCol = isEps ? '#f59e0b' : '#b8bcc9'
    let lineW = isEps ? 1.4 : 1.2
    if (isActive) { baseCol = '#00A19B'; lineW = 2.2 }

    ctx.save()
    ctx.strokeStyle = baseCol
    ctx.fillStyle   = baseCol
    ctx.lineWidth   = lineW
    if (isEps) ctx.setLineDash([4, 4])
    else       ctx.setLineDash([])

    const p1 = pos[f], p2 = pos[t]
    const isSelf = f === t
    const hasBoth = !!eMap[`${t}§${f}`] && !isSelf

    if (isSelf) {
      _drawSelfLoop(ctx, p1, R_NODE, syms, baseCol)
    } else {
      _drawArc(ctx, p1, p2, hasBoth ? 28 : 0, R_NODE, syms, baseCol, isActive)
    }

    // Animated flow on active edge
    if (isActive) {
      _drawFlowParticle(ctx, p1, p2, hasBoth ? 28 : 0, R_NODE, pulseT)
    }

    ctx.restore()
  }

  // ── Draw nodes ─────────────────────────────────────────────
  for (const s of auto.states) {
    const p = pos[s]; if (!p) continue
    const isAcc   = auto.accept.includes(s)
    const isStart = s === auto.start
    const isDead  = s === '∅'
    const isActive = s === activeState
    const wasVisited = visitedStates?.has(s) && !isActive

    // Colors
    let baseNodeCol = isDead ? '#ef4444' : isAcc ? '#10b981' : isStart ? '#3b82f6' : '#7a8098'
    const nodeCol = isActive ? '#00A19B' : baseNodeCol

    // 1. Outer faded glow for visited
    if (wasVisited) {
      ctx.save()
      const g = ctx.createRadialGradient(p.x, p.y, R_NODE, p.x, p.y, R_NODE + 16)
      g.addColorStop(0, 'rgba(0,161,155,0.12)')
      g.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(p.x, p.y, R_NODE + 16, 0, Math.PI * 2)
      ctx.fillStyle = g; ctx.fill()
      ctx.restore()
    }

    // 2. Active glow ring (animated pulsing) 
    if (isActive) {
      // Outer glowing ring
      const glowR = R_NODE + 12 + pulseT * 10
      const glowAlpha = 0.6 * (1 - pulseT)
      ctx.save()
      const rg = ctx.createRadialGradient(p.x, p.y, R_NODE, p.x, p.y, glowR + 8)
      rg.addColorStop(0, `rgba(0,161,155,${glowAlpha})`)
      rg.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(p.x, p.y, glowR + 8, 0, Math.PI * 2)
      ctx.fillStyle = rg; ctx.fill()
      ctx.restore()

      // Hard glow ring
      ctx.save()
      ctx.beginPath(); ctx.arc(p.x, p.y, R_NODE + 8, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0,161,155,${0.55 - pulseT * 0.4})`
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.restore()
    }

    // 3. Accept double-ring
    if (isAcc) {
      ctx.save()
      ctx.beginPath(); ctx.arc(p.x, p.y, R_NODE - 5, 0, Math.PI * 2)
      ctx.strokeStyle = nodeCol; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.restore()
    }

    // 4. Node fill
    ctx.save()
    ctx.beginPath(); ctx.arc(p.x, p.y, R_NODE, 0, Math.PI * 2)
    if (isActive) {
      ctx.fillStyle = '#00A19B'
    } else if (wasVisited) {
      ctx.fillStyle = 'rgba(0,161,155,0.08)'
    } else {
      ctx.fillStyle = '#FFFFFF'
    }
    ctx.fill()
    ctx.strokeStyle = nodeCol
    ctx.lineWidth = isActive ? 2.5 : wasVisited ? 1.8 : 1.5
    ctx.stroke()
    ctx.restore()

    // 5. Label
    ctx.save()
    ctx.font = `${isActive ? '700' : '500'} 12px 'JetBrains Mono', monospace`
    ctx.fillStyle = isActive ? '#FFFFFF' : wasVisited ? '#00A19B' : '#2d3039'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(s.length > 7 ? s.slice(0, 6) + '…' : s, p.x, p.y)
    ctx.restore()

    // 6. Start arrow
    if (isStart) {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(p.x - R_NODE - 32, p.y)
      ctx.lineTo(p.x - R_NODE - 2, p.y)
      ctx.strokeStyle = nodeCol; ctx.lineWidth = isActive ? 2 : 1.5; ctx.stroke()
      ctx.fillStyle = nodeCol
      ctx.beginPath()
      ctx.moveTo(p.x - R_NODE - 2, p.y)
      ctx.lineTo(p.x - R_NODE - 12, p.y - 5)
      ctx.lineTo(p.x - R_NODE - 12, p.y + 5)
      ctx.closePath(); ctx.fill()
      ctx.restore()
    }
  }
}

/* ─── Drawing helpers ─────────────────────────────────────── */
function _drawSelfLoop(ctx, p, R, syms, col) {
  const ax = p.x, ay = p.y - R
  ctx.beginPath(); ctx.arc(ax, ay - 20, 20, 0.6 * Math.PI, 2.4 * Math.PI); ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath(); ctx.moveTo(ax + 13, ay - 4); ctx.lineTo(ax + 6, ay - 8); ctx.lineTo(ax + 6, ay + 1); ctx.closePath(); ctx.fill()
  ctx.setLineDash([])
  ctx.save()
  ctx.font = "600 10px 'JetBrains Mono',monospace"; ctx.fillStyle = col
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
  ctx.fillText(syms.join(','), ax, ay - 44)
  ctx.restore()
}

function _drawArc(ctx, p1, p2, bend, R, syms, col, isActive) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1) return
  const ux = dx / dist, uy = dy / dist
  const sx = p1.x + ux * R, sy = p1.y + uy * R
  const ex = p2.x - ux * R, ey = p2.y - uy * R
  const mx = (sx + ex) / 2, my = (sy + ey) / 2
  const bx = mx - uy * bend, by = my + ux * bend

  ctx.beginPath()
  if (bend) { ctx.moveTo(sx, sy); ctx.quadraticCurveTo(bx, by, ex, ey) }
  else       { ctx.moveTo(sx, sy); ctx.lineTo(ex, ey) }
  ctx.stroke(); ctx.setLineDash([])

  // Arrow head
  const ang = bend ? Math.atan2(ey - by, ex - bx) : Math.atan2(dy, dx)
  ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill()
  ctx.restore()

  // Label background
  const lx = bend ? bx : mx, ly = bend ? by : my
  const tx = lx - uy * 13, ty = ly + ux * 13
  ctx.save()
  ctx.fillStyle = '#E4DDD3'
  const lbl = syms.join(',')
  const lw = Math.max(lbl.length * 7 + 8, 20)
  ctx.fillRect(tx - lw / 2, ty - 8, lw, 16)
  ctx.font = `${isActive ? '700' : '600'} 10px 'JetBrains Mono',monospace`
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(lbl, tx, ty)
  ctx.restore()
}

function _drawFlowParticle(ctx, p1, p2, bend, R, t) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist < 1) return
  const ux = dx / dist, uy = dy / dist
  const sx = p1.x + ux * R, sy = p1.y + uy * R
  const ex = p2.x - ux * R, ey = p2.y - uy * R

  let px, py
  if (bend) {
    const mx = (sx + ex) / 2, my = (sy + ey) / 2
    const bx = mx - uy * bend, by = my + ux * bend
    // Quadratic bezier point
    const u = t
    px = (1-u)*(1-u)*sx + 2*(1-u)*u*bx + u*u*ex
    py = (1-u)*(1-u)*sy + 2*(1-u)*u*by + u*u*ey
  } else {
    px = sx + (ex - sx) * t
    py = sy + (ey - sy) * t
  }

  ctx.save()
  const g = ctx.createRadialGradient(px, py, 0, px, py, 6)
  g.addColorStop(0, 'rgba(0,161,155,0.9)')
  g.addColorStop(1, 'transparent')
  ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2)
  ctx.fillStyle = g; ctx.fill()
  ctx.restore()
}

/* ─── React Component ─────────────────────────────────────── */
export default function AutomatonCanvas({ auto, testResult, animIdx }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const pulseRef  = useRef(0)
  const lastTsRef = useRef(null)

  // Derive what to highlight
  const activeState = (() => {
    if (!testResult?.path || animIdx < 0) return null
    const step = testResult.path[animIdx]
    return step?.state || null
  })()

  const activeEdge = (() => {
    if (!testResult?.path || animIdx <= 0) return null
    const prev = testResult.path[animIdx - 1]
    const curr = testResult.path[animIdx]
    if (!prev?.state || !curr?.state) return null
    return { from: prev.state, to: curr.state }
  })()

  const visitedStates = (() => {
    const set = new Set()
    if (!testResult?.path || animIdx < 0) return set
    testResult.path.slice(0, animIdx).forEach(step => {
      if (step.state) set.add(step.state)
    })
    return set
  })()

  const draw = useCallback((ts) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dt = lastTsRef.current ? (ts - lastTsRef.current) / 1000 : 0.016
    lastTsRef.current = ts

    // Pulse animation (0→1 loop, ~1.2s per cycle)
    pulseRef.current = (pulseRef.current + dt / 1.2) % 1

    const dpr = window.devicePixelRatio || 1
    const W = canvas.clientWidth
    const H = canvas.clientHeight

    if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
      canvas.width  = W * dpr
      canvas.height = H * dpr
    }

    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.scale(dpr, dpr)

    const pos  = auto ? computePositions(auto.states, W, H) : {}
    const eMap = auto ? buildEdgeMap(auto, pos) : {}

    render(ctx, W, H, auto, pos, eMap, {
      activeState,
      visitedStates,
      activeEdge,
      pulseT: pulseRef.current,
    })

    ctx.restore()
    rafRef.current = requestAnimationFrame(draw)
  }, [auto, activeState, activeEdge, visitedStates])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
}
