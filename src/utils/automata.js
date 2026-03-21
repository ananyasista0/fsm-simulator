// ============================================================
// automata.js — Pure automata theory algorithms (no React)
// ============================================================

/** ε-closure: all states reachable from stateSet via ε only */
export function epsCl(T, stateSet) {
  const visited = new Set(stateSet)
  const queue = [...stateSet]
  while (queue.length) {
    for (const t of (T[queue.pop()]?.['ε'] || [])) {
      if (!visited.has(t)) { visited.add(t); queue.push(t) }
    }
  }
  return [...visited].sort()
}

/** move: states reachable from stateSet on symbol sym */
export function mvFn(T, stateSet, sym) {
  const result = new Set()
  for (const s of stateSet) (T[s]?.[sym] || []).forEach(n => result.add(n))
  return [...result].sort()
}

/** Parse raw form values → automaton object or { error } */
export function parseAuto(raw) {
  const states = raw.states.split(',').map(s => s.trim()).filter(Boolean)
  const alpha  = raw.alpha.split(',').map(s => s.trim()).filter(Boolean)
  const start  = raw.start.trim()
  const accept = raw.accept.split(',').map(s => s.trim()).filter(Boolean)

  const errs = []
  if (!states.length) errs.push('No states defined')
  if (!alpha.length)  errs.push('No alphabet defined')
  if (!start)         errs.push('No start state')
  if (start && !states.includes(start)) errs.push(`"${start}" not in Q`)
  accept.forEach(a => { if (!states.includes(a)) errs.push(`Accept state "${a}" not in Q`) })

  const T = {}
  states.forEach(s => {
    T[s] = {}
    alpha.forEach(a => { T[s][a] = [] })
    T[s]['ε'] = []
  })

  for (const line of raw.trans.trim().split('\n')) {
    const l = line.trim()
    if (!l) continue
    const parts = l.split(',').map(p => p.trim())
    if (parts.length < 3) { errs.push(`Bad line: "${l}"`); continue }
    const [from, sym, to] = parts
    const ns = sym === 'eps' ? 'ε' : sym
    if (!states.includes(from)) errs.push(`Unknown state "${from}"`)
    if (!states.includes(to))   errs.push(`Unknown state "${to}"`)
    if (ns !== 'ε' && !alpha.includes(ns)) errs.push(`"${ns}" not in alphabet`)
    if (!errs.length) {
      if (!T[from][ns]) T[from][ns] = []
      if (!T[from][ns].includes(to)) T[from][ns].push(to)
    }
  }

  if (errs.length) return { error: errs[0] }

  let isNFA = false
  outer: for (const s of states) {
    if (T[s]['ε']?.length) { isNFA = true; break }
    for (const a of alpha) {
      if ((T[s][a] || []).length > 1) { isNFA = true; break outer }
    }
  }

  return { states, alpha, start, accept, T, isNFA }
}

/** Subset construction: NFA → DFA */
export function subsetConstruct(auto) {
  const { states: nfaStates, alpha, start, accept, T } = auto
  const steps = [], sMap = {}, dfaStates = [], wl = [], dT = {}

  const sc = epsCl(T, [start])
  const sk = sc.join(',')
  sMap[sk] = sc; dfaStates.push(sk); wl.push(sk)
  steps.push({ title: 'Initialize', desc: `ε-closure({${start}}) = {${sc.join(', ')}}`, detail: `DFA start: [${sk}]` })

  const epsInfo = {}
  for (const s of nfaStates) epsInfo[s] = epsCl(T, [s])

  while (wl.length) {
    const cur = wl.shift()
    const curSet = sMap[cur]
    dT[cur] = {}

    for (const sym of alpha) {
      const moved = mvFn(T, curSet, sym)
      const cl    = epsCl(T, moved)
      const key   = cl.length ? cl.join(',') : '∅'
      dT[cur][sym] = key

      if (cl.length && !dfaStates.includes(key)) {
        sMap[key] = cl; dfaStates.push(key); wl.push(key)
        steps.push({ title: 'New state', desc: `δ([${cur}], ${sym}) = [${key}]`, detail: `move={${moved.join(',')}} · ε-cls={${cl.join(',')}}` })
      } else {
        steps.push({ title: 'Transition', desc: `δ([${cur}], ${sym}) = [${key}]`, detail: `ε-closure → {${cl.join(',') || '∅'}}` })
      }

      if (!cl.length && !dfaStates.includes('∅')) {
        dfaStates.push('∅'); sMap['∅'] = []
        alpha.forEach(a => { if (!dT['∅']) dT['∅'] = {}; dT['∅'][a] = '∅' })
        steps.push({ title: 'Dead state ∅', desc: 'Trap state added', detail: 'All ∅ transitions → ∅' })
      }
    }
  }

  const acc = dfaStates.filter(k => sMap[k]?.some(s => accept.includes(s)))
  const tObj = {}
  dfaStates.forEach(s => {
    tObj[s] = {}
    alpha.forEach(a => { tObj[s][a] = [dT[s]?.[a] || '∅'] })
    tObj[s]['ε'] = []
  })

  return { auto: { states: dfaStates, alpha, start: sk, accept: acc, T: tObj, isNFA: false }, steps, epsInfo }
}

/** BFS reachability check */
function isReach(dfa, target) {
  if (target === dfa.start) return true
  const vis = new Set([dfa.start]), q = [dfa.start]
  while (q.length) {
    const s = q.shift()
    for (const sym of dfa.alpha) {
      for (const n of (dfa.T[s]?.[sym] || [])) {
        if (n === target) return true
        if (!vis.has(n)) { vis.add(n); q.push(n) }
      }
    }
  }
  return false
}

function grpOf(s, P) { return P.findIndex(g => g.includes(s)) }

function sameGrp(a, b, alpha, P, T) {
  for (const sym of alpha) {
    const na = (T[a]?.[sym] || ['∅'])[0]
    const nb = (T[b]?.[sym] || ['∅'])[0]
    if (grpOf(na, P) !== grpOf(nb, P)) return false
  }
  return true
}

/** Hopcroft's minimization algorithm */
export function minimizeDFA(dfa) {
  const steps = []
  const sts = dfa.states.filter(s => isReach(dfa, s))
  const rm  = dfa.states.filter(s => !isReach(dfa, s))
  steps.push({ title: 'Remove unreachable', desc: `Kept: {${sts.join(', ')}}`, detail: `Removed: {${rm.join(', ') || 'none'}}` })

  let P = [
    sts.filter(s =>  dfa.accept.includes(s)),
    sts.filter(s => !dfa.accept.includes(s)),
  ].filter(g => g.length)
  steps.push({ title: 'Initial partition', desc: '{F} vs {Q\\F}', detail: P.map((g, i) => `G${i}:{${g.join(',')}}`).join(' · ') })

  let changed = true, iter = 0
  while (changed) {
    changed = false; iter++
    const nP = []
    for (const g of P) {
      if (g.length === 1) { nP.push(g); continue }
      const subs = [[g[0]]]
      for (let i = 1; i < g.length; i++) {
        let placed = false
        for (const sub of subs) {
          if (sameGrp(sub[0], g[i], dfa.alpha, P, dfa.T)) { sub.push(g[i]); placed = true; break }
        }
        if (!placed) subs.push([g[i]])
      }
      if (subs.length > 1) {
        changed = true; nP.push(...subs)
        steps.push({ title: `Split (iter ${iter})`, desc: `{${g.join(',')}} is distinguishable`, detail: subs.map((x, i) => `G${i}:{${x.join(',')}}`).join(' · ') })
      } else {
        nP.push(g)
      }
    }
    if (!changed) steps.push({ title: `Stable (iter ${iter})`, desc: 'No more splits — partition finalized', detail: P.map((g, i) => `G${i}:{${g.join(',')}}`).join(' · ') })
    P = nP
  }

  const gOf = {}; P.forEach((g, i) => g.forEach(s => (gOf[s] = i)))
  const mSts   = P.map((_, i) => `M${i}`)
  const mStart = `M${gOf[dfa.start]}`
  const mAcc   = P.map((g, i) => ({ g, i })).filter(({ g }) => g.some(s => dfa.accept.includes(s))).map(({ i }) => `M${i}`)
  const mT = {}
  P.forEach((g, i) => {
    const rep = g[0]; mT[`M${i}`] = {}
    dfa.alpha.forEach(sym => {
      const nx = (dfa.T[rep]?.[sym] || [])[0]
      mT[`M${i}`][sym] = [nx != null && gOf[nx] != null ? `M${gOf[nx]}` : '∅']
    })
    mT[`M${i}`]['ε'] = []
  })

  return { auto: { states: mSts, alpha: dfa.alpha, start: mStart, accept: mAcc, T: mT, isNFA: false }, steps, partition: P }
}

/** DFA string simulation */
export function simDFA(auto, str) {
  const path = [{ state: auto.start, sym: null }]
  let cur = auto.start
  for (const sym of str) {
    if (!auto.alpha.includes(sym)) return { accepted: false, path, reason: `'${sym}' not in Σ` }
    const nx = (auto.T[cur]?.[sym] || [])[0]
    if (!nx || nx === '∅') {
      path.push({ state: '∅', sym })
      return { accepted: false, path, reason: 'Reached dead state ∅' }
    }
    cur = nx; path.push({ state: cur, sym })
  }
  const accepted = auto.accept.includes(cur)
  return { accepted, path, reason: accepted ? `Ended in accept state "${cur}"` : `"${cur}" is not an accept state` }
}

/** NFA parallel simulation */
export function simNFA(auto, str) {
  let sets = [epsCl(auto.T, [auto.start])]
  const path = [{ sets: sets.map(s => '{' + s.join(',') + '}').join('|'), sym: null }]
  for (const sym of str) {
    if (!auto.alpha.includes(sym)) return { accepted: false, path, reason: `'${sym}' not in Σ` }
    const ns = []
    for (const set of sets) {
      const cl = epsCl(auto.T, mvFn(auto.T, set, sym))
      if (cl.length) ns.push(cl)
    }
    sets = ns.length ? ns : [[]]
    path.push({ sets: sets.map(s => '{' + s.join(',') + '}').join('|'), sym })
  }
  const accepted = sets.some(s => s.some(q => auto.accept.includes(q)))
  return { accepted, path, reason: accepted ? 'Some path reached an accept state' : 'No path reached an accept state' }
}

/** Draw state diagram on a canvas element */
export function drawDiagram(canvas, auto) {
  if (!canvas || !auto) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.offsetWidth || 900
  const H = 500
  canvas.width  = W * dpr
  canvas.height = H * dpr
  canvas.style.height = H + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#0b0c0f'
  ctx.fillRect(0, 0, W, H)

  // dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.022)'
  for (let x = 36; x < W; x += 44)
    for (let y = 36; y < H; y += 44) {
      ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill()
    }

  const n = auto.states.length, R = 28, cx = W / 2, cy = H / 2
  const rad = Math.min(W, H) / 2 - 82
  const pos = {}
  auto.states.forEach((s, i) => {
    const a = (2 * Math.PI * i / n) - Math.PI / 2
    pos[s] = { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) }
  })

  // Build edge map
  const eMap = {}
  for (const from of auto.states)
    for (const sym of [...auto.alpha, 'ε'])
      for (const to of (auto.T[from]?.[sym] || [])) {
        if (!pos[to]) continue
        const k = from + '§' + to
        if (!eMap[k]) eMap[k] = []
        eMap[k].push(sym)
      }

  // Draw edges
  for (const [k, syms] of Object.entries(eMap)) {
    const [f, t] = k.split('§')
    if (!pos[f] || !pos[t]) continue
    const isEps = syms.includes('ε')
    const col = isEps ? '#f59e0b' : '#2c3a56'
    ctx.save()
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.2
    if (isEps) ctx.setLineDash([4, 4]); else ctx.setLineDash([])

    const p1 = pos[f], p2 = pos[t], isSelf = f === t
    const hasBoth = !!eMap[t + '§' + f] && f !== t

    if (isSelf) {
      const ax = p1.x, ay = p1.y - R
      ctx.beginPath(); ctx.arc(ax, ay - 20, 20, 0.6 * Math.PI, 2.4 * Math.PI); ctx.stroke()
      ctx.setLineDash([])
      ctx.beginPath(); ctx.moveTo(ax + 13, ay - 4); ctx.lineTo(ax + 6, ay - 8); ctx.lineTo(ax + 6, ay + 1); ctx.closePath(); ctx.fill()
      ctx.font = "9px 'JetBrains Mono',monospace"; ctx.fillStyle = '#4a5270'
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'
      ctx.fillText(syms.join(','), ax, ay - 43)
    } else {
      const dx = p2.x - p1.x, dy = p2.y - p1.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ux = dx / dist, uy = dy / dist
      const sx = p1.x + ux * R, sy = p1.y + uy * R
      const ex = p2.x - ux * R, ey = p2.y - uy * R
      const bend = hasBoth ? 26 : 0
      const mx = (sx + ex) / 2, my = (sy + ey) / 2
      const bx = mx - uy * bend, by = my + ux * bend

      ctx.beginPath()
      if (bend) { ctx.moveTo(sx, sy); ctx.quadraticCurveTo(bx, by, ex, ey) }
      else       { ctx.moveTo(sx, sy); ctx.lineTo(ex, ey) }
      ctx.stroke(); ctx.setLineDash([])

      const ang = bend ? Math.atan2(ey - by, ex - bx) : Math.atan2(dy, dx)
      ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-9, -4); ctx.lineTo(-9, 4); ctx.closePath(); ctx.fill()
      ctx.restore()

      ctx.font = "9px 'JetBrains Mono',monospace"; ctx.fillStyle = '#3a4560'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const lx = bend ? bx : mx, ly = bend ? by : my
      ctx.fillText(syms.join(','), lx - uy * 12, ly + ux * 12)
    }
    ctx.restore()
  }

  // Draw nodes
  for (const s of auto.states) {
    const p = pos[s]; if (!p) continue
    const isAcc   = auto.accept.includes(s)
    const isStart = s === auto.start
    const isDead  = s === '∅'
    const col = isDead ? '#e05c72' : isAcc ? '#36d68a' : isStart ? '#4d9ef7' : '#4a5270'

    if (isAcc || isStart) {
      const g = ctx.createRadialGradient(p.x, p.y, R, p.x, p.y, R + 20)
      g.addColorStop(0, col + '20'); g.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(p.x, p.y, R + 20, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
    }
    if (isAcc) {
      ctx.beginPath(); ctx.arc(p.x, p.y, R + 6, 0, Math.PI * 2)
      ctx.strokeStyle = col + '45'; ctx.lineWidth = 1; ctx.stroke()
    }

    const gr = ctx.createRadialGradient(p.x - 4, p.y - 4, 2, p.x, p.y, R)
    gr.addColorStop(0, isDead ? '#1c0c12' : isAcc ? '#0a1a10' : isStart ? '#0c1422' : '#10131c')
    gr.addColorStop(1, '#090a0e')
    ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2)
    ctx.fillStyle = gr; ctx.fill()
    ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke()

    if (isStart) {
      ctx.beginPath(); ctx.moveTo(p.x - R - 30, p.y); ctx.lineTo(p.x - R - 2, p.y)
      ctx.strokeStyle = '#4d9ef7'; ctx.lineWidth = 1.4; ctx.stroke()
      ctx.fillStyle = '#4d9ef7'
      ctx.beginPath(); ctx.moveTo(p.x - R - 2, p.y); ctx.lineTo(p.x - R - 10, p.y - 4); ctx.lineTo(p.x - R - 10, p.y + 4); ctx.closePath(); ctx.fill()
    }

    ctx.font = "500 11px 'JetBrains Mono', monospace"
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(s.length > 7 ? s.slice(0, 6) + '…' : s, p.x, p.y)
  }
}
