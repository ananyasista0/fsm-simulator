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
export function drawDiagram(canvas, auto, testResult, animIdx) {
  if (!canvas || !auto) return
  const dpr = window.devicePixelRatio || 1
  const W = canvas.offsetWidth || 900
  const H = 500
  canvas.width  = W * dpr
  canvas.height = H * dpr
  canvas.style.height = H + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#E4DDD3' // Ice Latte
  ctx.fillRect(0, 0, W, H)

  // dot grid
  ctx.fillStyle = 'rgba(0,0,0,0.04)'
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

  // Extract active path info
  let activeState = null;
  let activeTransCount = 0; // if we want to trace the path
  let activeSet = new Set();
  
  if (testResult && testResult.path && animIdx >= 0 && animIdx < testResult.path.length) {
    const step = testResult.path[animIdx];
    if (step.state) activeState = step.state;
    if (step.sets) {
       // Extract states from "{q0,q1}|{q2}" format
       const matches = step.sets.match(/[^{}|,]+/g);
       if (matches) matches.forEach(m => activeSet.add(m));
    }
  }

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
    
    // Animate edge if it's currently active (we could track last state to current state)
    // For simplicity, just use base colors
    const col = isEps ? '#ea580c' : '#8a8f9c' // Amber for eps, muted grey for rest
    ctx.save()
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6
    if (isEps) ctx.setLineDash([4, 4]); else ctx.setLineDash([])

    const p1 = pos[f], p2 = pos[t], isSelf = f === t
    const hasBoth = !!eMap[t + '§' + f] && f !== t

    if (isSelf) {
      const ax = p1.x, ay = p1.y - R
      ctx.beginPath(); ctx.arc(ax, ay - 20, 20, 0.6 * Math.PI, 2.4 * Math.PI); ctx.stroke()
      ctx.setLineDash([])
      ctx.beginPath(); ctx.moveTo(ax + 13, ay - 4); ctx.lineTo(ax + 6, ay - 8); ctx.lineTo(ax + 6, ay + 1); ctx.closePath(); ctx.fill()
      ctx.font = "600 10px 'JetBrains Mono',monospace"; ctx.fillStyle = '#5c6270'
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
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-10, -5); ctx.lineTo(-10, 5); ctx.closePath(); ctx.fill()
      ctx.restore()

      ctx.font = "600 10px 'JetBrains Mono',monospace"; ctx.fillStyle = '#5c6270'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      const lx = bend ? bx : mx, ly = bend ? by : my
      
      // Draw a solid rect behind text to hide the line 
      ctx.save()
      ctx.fillStyle = '#E4DDD3'
      const tx = lx - uy * 12;
      const ty = ly + ux * 12;
      ctx.fillRect(tx - 12, ty - 8, 24, 16)
      ctx.restore()
      
      ctx.fillText(syms.join(','), tx, ty)
    }
    ctx.restore()
  }

  // Draw nodes
  for (const s of auto.states) {
    const p = pos[s]; if (!p) continue
    const isAcc   = auto.accept.includes(s)
    const isStart = s === auto.start
    const isDead  = s === '∅'
    const isActive = activeState === s || activeSet.has(s);
    
    // Colors
    const baseCol = isDead ? '#ef4444' : isAcc ? '#10b981' : isStart ? '#3b82f6' : '#8a8f9c'
    const col = isActive ? '#00A19B' : baseCol; // Mint for active

    if (isAcc || isStart || isActive) {
      const g = ctx.createRadialGradient(p.x, p.y, R, p.x, p.y, R + 15)
      g.addColorStop(0, col + '2A'); g.addColorStop(1, 'transparent')
      ctx.beginPath(); ctx.arc(p.x, p.y, R + 20, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill()
    }
    
    if (isActive) {
      // additional pulse ring for active
      ctx.beginPath(); ctx.arc(p.x, p.y, R + 8, 0, Math.PI * 2)
      ctx.strokeStyle = col + '60'; ctx.lineWidth = 2.5; ctx.stroke()
    }

    if (isAcc) {
      ctx.beginPath(); ctx.arc(p.x, p.y, R - 4, 0, Math.PI * 2)
      ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke()
    }

    ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2)
    ctx.fillStyle = isActive ? '#FFFFFF' : '#F4EFE6'
    ctx.fill()
    ctx.strokeStyle = col; ctx.lineWidth = isActive ? 2.5 : 1.5; ctx.stroke()

    if (isStart) {
      ctx.beginPath(); ctx.moveTo(p.x - R - 30, p.y); ctx.lineTo(p.x - R - 2, p.y)
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, isActive ? 2.5 : 1.4); ctx.stroke()
      ctx.fillStyle = col
      ctx.beginPath(); ctx.moveTo(p.x - R - 2, p.y); ctx.lineTo(p.x - R - 12, p.y - 5); ctx.lineTo(p.x - R - 12, p.y + 5); ctx.closePath(); ctx.fill()
    }

    ctx.font = (isActive ? "700 " : "500 ") + "12px 'JetBrains Mono', monospace"
    ctx.fillStyle = isActive ? '#1a1b1e' : '#373a40'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(s.length > 7 ? s.slice(0, 6) + '…' : s, p.x, p.y)
  }
}

// ============================================================
// regexToAuto — Thompson's Construction (regex → ε-NFA)
// ============================================================

/**
 * Convert a regular expression string into an NFA automaton object
 * that is directly compatible with parseAuto's output format.
 *
 * Supported syntax:
 *   literals  — any character in the alphabet (single char)
 *   .         — wildcard (matches any alphabet symbol)
 *   |         — alternation (lowest precedence)
 *   (implicit concat) — concatenation (medium precedence)
 *   *         — Kleene star (highest precedence)
 *   +         — one-or-more  (desugared to r·r*)
 *   ?         — optional     (desugared to r|ε)
 *   ()        — grouping
 *
 * Returns { states, alpha, start, accept, T, isNFA: true }
 * or      { error: "message" } on failure.
 */
export function regexToAuto(regexStr, alphabetStr) {
  // ── Parse alphabet ──────────────────────────────────────────
  const alpha = alphabetStr.split(',').map(s => s.trim()).filter(Boolean)
  if (!alpha.length) return { error: 'Alphabet is empty' }
  if (alpha.some(a => a.length !== 1)) return { error: 'Each alphabet symbol must be a single character' }

  const regex = regexStr.trim()
  if (!regex) return { error: 'Regular expression is empty' }

  // ── State ID generator ──────────────────────────────────────
  let stateCounter = 0
  function newState() { return `s${stateCounter++}` }

  // ── NFA fragment: { start, accept, T } ─────────────────────
  // T[state][symbol] = [states...]  (ε is stored as 'ε')
  function makeT() { return {} }
  function ensureState(T, s) {
    if (!T[s]) T[s] = {}
  }
  function addTrans(T, from, sym, to) {
    ensureState(T, from)
    ensureState(T, to)
    if (!T[from][sym]) T[from][sym] = []
    if (!T[from][sym].includes(to)) T[from][sym].push(to)
  }

  // Merge two T objects into T1 (mutate T1)
  function mergeT(T1, T2) {
    for (const [s, syms] of Object.entries(T2)) {
      if (!T1[s]) T1[s] = {}
      for (const [sym, targets] of Object.entries(syms)) {
        if (!T1[s][sym]) T1[s][sym] = []
        for (const t of targets) if (!T1[s][sym].includes(t)) T1[s][sym].push(t)
      }
    }
  }

  // ── Thompson primitive builders ─────────────────────────────

  /** Matches a single symbol (literal or '.' wildcard) */
  function atomFrag(sym) {
    const s = newState(), a = newState()
    const T = makeT()
    if (sym === '.') {
      // wildcard: one transition per alphabet symbol
      for (const c of alpha) addTrans(T, s, c, a)
    } else {
      addTrans(T, s, sym, a)
    }
    return { start: s, accept: a, T }
  }

  /** Matches ε only */
  function epsFrag() {
    const s = newState(), a = newState()
    const T = makeT()
    addTrans(T, s, 'ε', a)
    return { start: s, accept: a, T }
  }

  /** Concatenation: f1 then f2 */
  function concatFrag(f1, f2) {
    const T = makeT()
    mergeT(T, f1.T)
    mergeT(T, f2.T)
    // link f1.accept → f2.start via ε
    addTrans(T, f1.accept, 'ε', f2.start)
    return { start: f1.start, accept: f2.accept, T }
  }

  /** Alternation: f1 | f2 */
  function altFrag(f1, f2) {
    const s = newState(), a = newState()
    const T = makeT()
    mergeT(T, f1.T)
    mergeT(T, f2.T)
    addTrans(T, s, 'ε', f1.start)
    addTrans(T, s, 'ε', f2.start)
    addTrans(T, f1.accept, 'ε', a)
    addTrans(T, f2.accept, 'ε', a)
    return { start: s, accept: a, T }
  }

  /** Kleene star: f* */
  function starFrag(f) {
    const s = newState(), a = newState()
    const T = makeT()
    mergeT(T, f.T)
    addTrans(T, s, 'ε', f.start)
    addTrans(T, s, 'ε', a)           // zero times
    addTrans(T, f.accept, 'ε', f.start) // repeat
    addTrans(T, f.accept, 'ε', a)    // exit
    return { start: s, accept: a, T }
  }

  // ── Recursive-descent parser ────────────────────────────────
  // Grammar (in precedence order, low → high):
  //   expr   = term ('|' term)*
  //   term   = factor+          (implicit concat)
  //   factor = base ('*'|'+'|'?')*
  //   base   = char | '.' | '(' expr ')'

  let pos = 0
  const src = regex

  function peek() { return pos < src.length ? src[pos] : null }
  function consume(ch) {
    if (peek() !== ch) throw new Error(`Expected '${ch}' at position ${pos}, got '${peek() ?? 'EOF'}'`)
    pos++
  }

  function parseExpr() {
    let frag = parseTerm()
    while (peek() === '|') {
      pos++
      const right = parseTerm()
      frag = altFrag(frag, right)
    }
    return frag
  }

  function parseTerm() {
    // A term is one or more factors concatenated
    // A factor starts with: a char in alpha, '.', '('
    let frag = null
    while (peek() !== null && peek() !== ')' && peek() !== '|') {
      const f = parseFactor()
      frag = frag === null ? f : concatFrag(frag, f)
    }
    if (frag === null) throw new Error(`Empty term at position ${pos}`)
    return frag
  }

  function parseFactor() {
    let frag = parseBase()
    // Handle postfix quantifiers
    while (peek() === '*' || peek() === '+' || peek() === '?') {
      const op = peek(); pos++
      if (op === '*') {
        frag = starFrag(frag)
      } else if (op === '+') {
        // r+ = r · r*
        const copy = parseBase_reparse(frag) // we need two instances — save before star
        frag = concatFrag(frag, starFrag(copy))
      } else {
        // r? = r | ε
        frag = altFrag(frag, epsFrag())
      }
    }
    return frag
  }

  // For r+ we need two independent copies of the sub-fragment.
  // Since we already built frag, rebuild a star from a fresh copy.
  // Trick: we track the "last base source" to rebuild it.
  let lastBaseExpr = null

  function parseBase() {
    const c = peek()
    if (c === null) throw new Error(`Unexpected end of expression at position ${pos}`)
    if (c === '(') {
      pos++
      const frag = parseExpr()
      consume(')')
      lastBaseExpr = { type: 'group', frag }
      return frag
    }
    if (c === '.') {
      pos++
      lastBaseExpr = { type: 'wild' }
      return atomFrag('.')
    }
    // Must be an alphabet literal
    if (!alpha.includes(c)) {
      throw new Error(`Character '${c}' at position ${pos} is not in the alphabet {${alpha.join(',')}}`)
    }
    pos++
    lastBaseExpr = { type: 'lit', c }
    return atomFrag(c)
  }

  // Rebuild a fresh copy of a fragment for r+ desugaring
  function parseBase_reparse(existing) {
    if (!lastBaseExpr) return existing
    const lb = lastBaseExpr
    if (lb.type === 'lit') return atomFrag(lb.c)
    if (lb.type === 'wild') return atomFrag('.')
    // group — re-use the accept-side fragment as a star target
    // For groups we can't trivially reparse, so we copy by
    // creating a new star-able wrapper via ε-bypass
    return existing
  }

  // ── Run the parser ──────────────────────────────────────────
  let frag
  try {
    frag = parseExpr()
    if (pos !== src.length) {
      throw new Error(`Unexpected character '${src[pos]}' at position ${pos}`)
    }
  } catch (e) {
    return { error: e.message }
  }

  // ── Build the automaton object (same shape as parseAuto) ────
  const allStates = Object.keys(frag.T)
  // Ensure start and accept appear in state list
  if (!allStates.includes(frag.start)) allStates.unshift(frag.start)
  if (!allStates.includes(frag.accept)) allStates.push(frag.accept)

  // Fill in missing transitions as empty arrays
  for (const s of allStates) {
    if (!frag.T[s]) frag.T[s] = {}
    for (const a of alpha) {
      if (!frag.T[s][a]) frag.T[s][a] = []
    }
    if (!frag.T[s]['ε']) frag.T[s]['ε'] = []
  }

  return {
    states:  allStates,
    alpha,
    start:   frag.start,
    accept:  [frag.accept],
    T:       frag.T,
    isNFA:   true,
  }
}
