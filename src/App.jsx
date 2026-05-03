// ============================================================
// App.jsx — FSM Simulator v3 — Digital Alchemist Design
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react'
import Sidebar            from './components/Sidebar'
import AutomatonFlow      from './components/flow/AutomatonFlow'
import SimulationControls from './components/SimulationControls'
import InputTracker       from './components/InputTracker'
import Popup              from './components/Popup'
import LenisSetup         from './components/LenisSetup'
import {
  parseAuto, subsetConstruct, minimizeDFA, simDFA, simNFA, regexToAuto,
} from './utils/automata'
import { EXAMPLES } from './utils/examples'

// ─── Tiny shared UI atoms ──────────────────────────────────
function Card({ title, children, style }) {
  return (
    <div className="card" style={style}>
      {title && (
        <div className="card-header">
          <div className="card-accent-bar" />
          <span className="card-title">{title}</span>
        </div>
      )}
      {children}
    </div>
  )
}

function Btn({ onClick, variant = 'outline', size = '', children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}${size ? ` btn-${size}` : ''}`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
    </div>
  )
}

function FInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="form-input"
    />
  )
}

function FTextarea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="form-input form-textarea"
    />
  )
}

function FSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="form-input form-select"
    >
      {children}
    </select>
  )
}

function Empty({ text }) {
  return <div className="empty-state">{text}</div>
}

function Badge({ type, children }) {
  const cls = { accept: 'success', start: 'mint', dead: 'error' }
  return <span className={`badge badge-${cls[type] || 'info'}`}>{children}</span>
}

function TransTable({ auto }) {
  if (!auto) return <Empty text="Build an automaton to see its transition table" />
  const hasEps = auto.states.some(s => (auto.T[s]?.['ε'] || []).length > 0)
  const syms = [...auto.alpha, ...(hasEps ? ['ε'] : [])]
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr><th>State</th>{syms.map(s => <th key={s}>{s}</th>)}</tr>
        </thead>
        <tbody>
          {auto.states.map(s => (
            <tr key={s}>
              <td style={{ color: 'var(--info)', fontWeight: 600 }}>
                {s}
                {s === auto.start && <Badge type="start">start</Badge>}
                {auto.accept.includes(s) && <Badge type="accept">accept</Badge>}
                {s === '∅' && <Badge type="dead">dead</Badge>}
              </td>
              {syms.map(sym => {
                const nx = auto.T[s]?.[sym] || []
                return <td key={sym} style={{ color: nx.length ? 'var(--t1)' : 'var(--t4)' }}>{nx.length ? nx.join(', ') : '—'}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StepLog({ steps, activeIdx }) {
  const endRef = useRef(null)
  useEffect(() => {
    if (activeIdx >= 0) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeIdx])
  return (
    <div className="step-log">
      {steps.length === 0 && <Empty text="Steps appear here after running" />}
      {steps.map((s, i) => {
        const cls = `step-entry${i === activeIdx ? ' active' : ''}${i < activeIdx ? ' done' : ''}`
        return (
          <div key={i} className={cls} ref={i === activeIdx ? endRef : null}>
            <div className="step-num">STEP {String(i + 1).padStart(2, '0')}</div>
            <div className="step-title">{s.title} — {s.desc}</div>
            <div className="step-detail">{s.detail}</div>
          </div>
        )
      })}
    </div>
  )
}

function ToastList({ toasts }) {
  return (
    <div className="toast-list">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}

function AlgoBlock({ label, children }) {
  return (
    <div className="algo-block">
      <div className="algo-block-header">// {label}</div>
      <pre>{children}</pre>
    </div>
  )
}

function TheoryBlock({ children }) {
  return <div className="theory-block">{children}</div>
}

const HL  = ({ children }) => <span className="hl-mint">{children}</span>
const HLG = ({ children }) => <span className="hl-success">{children}</span>
const HLA = ({ children }) => <span className="hl-warn">{children}</span>
const HLR = ({ children }) => <span className="hl-error">{children}</span>

// ─── Workspace section titles ──────────────────────────────
const MODULE_META = {
  build:    { title: 'Build',    sub: 'Define your finite automaton' },
  nfa2dfa:  { title: 'Convert',  sub: 'NFA → DFA via subset construction' },
  minimize: { title: 'Minimize', sub: "Hopcroft's partition-refinement algorithm" },
  test:     { title: 'Test',     sub: 'Simulate string acceptance' },
  visual:   { title: 'Diagram',  sub: 'Interactive state-transition graph' },
  theory:   { title: 'Theory',   sub: 'Formal definitions & complexity' },
}

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  // ── UI State ───────────────────────────────────────────────
  const [tab, setTab]     = useState('build')
  const [popup, setPopup] = useState(null)
  const [toasts, setToasts] = useState([])

  // ── Automaton State ────────────────────────────────────────
  const [raw, setRaw] = useState({
    states: 'q0,q1,q2',
    alpha: 'a,b',
    start: 'q0',
    accept: 'q2',
    trans: 'q0,a,q0\nq0,b,q0\nq0,a,q1\nq1,b,q2',
  })
  const [auto,    setAuto]    = useState(null)
  const [dfaRes,  setDfaRes]  = useState(null)
  const [minRes,  setMinRes]  = useState(null)

  // ── Step indices ───────────────────────────────────────────
  const [nfaIdx, setNfaIdx] = useState(0)
  const [minIdx, setMinIdx] = useState(0)

  // ── Test / Simulation State ────────────────────────────────
  const [testStr,      setTestStr]      = useState('ab')
  const [testTarget,   setTestTarget]   = useState('original')
  const [testResult,   setTestResult]   = useState(null)
  const [animIdx,      setAnimIdx]      = useState(-1)
  const [batchInput,   setBatchInput]   = useState('')
  const [batchResults, setBatchResults] = useState(null)

  // ── Regex Builder State ────────────────────────────────────
  const [regexStr,      setRegexStr]      = useState('(a|b)*abb')
  const [regexAlpha,    setRegexAlpha]    = useState('a,b')
  const [regexStatus,   setRegexStatus]   = useState(null)   // null | { ok, msg }
  const [showCheatsheet, setShowCheatsheet] = useState(false)

  // ── Simulation Controls ────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false)
  const [simSpeed,  setSimSpeed]  = useState(600)

  // ── Right panel diagram target ─────────────────────────────
  const [diagTarget, setDiagTarget] = useState('original')

  // ─── Toast helper ──────────────────────────────────────────
  const toast = useCallback((msg, type = 'ok') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  // ─── Boot: parse default automaton ────────────────────────
  useEffect(() => {
    const r = parseAuto(raw)
    if (!r.error) setAuto(r)
  }, []) // eslint-disable-line

  // ─── Handlers ─────────────────────────────────────────────
  function handleBuild() {
    const r = parseAuto(raw)
    if (r.error) { toast(r.error, 'err'); return }
    setAuto(r); setDfaRes(null); setMinRes(null)
    setTestResult(null); setBatchResults(null)
    setNfaIdx(0); setMinIdx(0)
    setAnimIdx(-1); setIsPlaying(false)
    toast(`${r.isNFA ? 'NFA' : 'DFA'} built — ${r.states.length} states`, 'ok')
  }

  function loadExample(key) {
    const e = EXAMPLES[key]
    setRaw(e)
    const r = parseAuto(e)
    if (!r.error) {
      setAuto(r); setDfaRes(null); setMinRes(null)
      setTestResult(null); setBatchResults(null)
      setAnimIdx(-1); setIsPlaying(false)
    }
    toast('Loaded: ' + e.label, 'info')
  }

  function handleRegexBuild() {
    // ── Step 1: Regex → NFA (Thompson's Construction) ──────────
    const nfa = regexToAuto(regexStr, regexAlpha)
    if (nfa.error) {
      setRegexStatus({ ok: false, msg: nfa.error })
      toast(nfa.error, 'err')
      return
    }

    // ── Step 2: NFA → DFA (Subset Construction) ────────────────
    const dfaResult = subsetConstruct(nfa)

    // ── Step 3: DFA → Minimized DFA (Hopcroft) ─────────────────
    const minResult = minimizeDFA(dfaResult.auto)

    // ── Commit all state at once ────────────────────────────────
    setAuto(nfa)
    setDfaRes(dfaResult)
    setMinRes(minResult)
    setNfaIdx(dfaResult.steps.length - 1)
    setMinIdx(minResult.steps.length - 1)
    setTestResult(null); setBatchResults(null)
    setAnimIdx(-1); setIsPlaying(false)
    setDiagTarget('min') // default diagram to minimized DFA

    // Fill the manual definition form with the minimized DFA
    const minAuto = minResult.auto
    const stateList  = minAuto.states.join(',')
    const alphaList  = minAuto.alpha.join(',')
    const acceptList = minAuto.accept.join(',')
    const transLines = []
    for (const s of minAuto.states) {
      for (const sym of minAuto.alpha) {
        for (const to of (minAuto.T[s]?.[sym] || [])) {
          transLines.push(`${s},${sym},${to}`)
        }
      }
    }
    setRaw({ states: stateList, alpha: alphaList, start: minAuto.start, accept: acceptList, trans: transLines.join('\n') })

    const msg = `Pipeline complete — NFA: ${nfa.states.length}Q → DFA: ${dfaResult.auto.states.length}Q → Min DFA: ${minResult.auto.states.length}Q`
    setRegexStatus({ ok: true, msg })
    toast(msg, 'ok')
  }

  function handleConvert() {
    if (!auto) { toast('Build an automaton first', 'err'); return }
    const res = subsetConstruct(auto)
    setDfaRes(res); setNfaIdx(res.steps.length - 1)
    toast(`NFA(${auto.states.length}) → DFA(${res.auto.states.length} states)`, 'ok')
  }

  function handleMinimize() {
    const dfa = dfaRes?.auto || (!auto?.isNFA ? auto : null)
    if (!dfa) { toast('Need a DFA — convert first or build one', 'err'); return }
    const res = minimizeDFA(dfa)
    setMinRes(res); setMinIdx(res.steps.length - 1)
    toast(`Minimized: ${dfa.states.length} → ${res.auto.states.length} states`, 'ok')
  }

  function getTestAuto() {
    if (testTarget === 'min' && minRes) return minRes.auto
    if (testTarget === 'dfa' && dfaRes) return dfaRes.auto
    return auto
  }

  function handleTest() {
    const a = getTestAuto()
    if (!a) { toast('Build an automaton first', 'err'); return }
    const s = (testStr === 'ε' || testStr === 'eps') ? '' : testStr
    const res = a.isNFA ? simNFA(a, s) : simDFA(a, s)
    setTestResult(res); setAnimIdx(0); setIsPlaying(false)
  }

  function handleBatch() {
    const a = getTestAuto()
    if (!a) { toast('Build an automaton first', 'err'); return }
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast('Enter strings to test', 'err'); return }
    const results = lines.map(r => {
      const s = (r === 'ε' || r === 'eps') ? '' : r
      const res = a.isNFA ? simNFA(a, s) : simDFA(a, s)
      return { str: s === '' ? 'ε' : s, ...res }
    })
    setBatchResults(results)
  }

  // ─── Simulation control callbacks ─────────────────────────
  const canStep  = !!(testResult?.path && animIdx < testResult.path.length - 1)
  const canReset = !!(testResult?.path)

  const handleSimNext = useCallback(() => {
    setAnimIdx(i => {
      const max = (testResult?.path?.length ?? 1) - 1
      return Math.min(i + 1, max)
    })
  }, [testResult])

  const handleSimReset = useCallback(() => {
    setAnimIdx(0)
    setIsPlaying(false)
  }, [])

  const handleSimPlay  = useCallback(() => setIsPlaying(true),  [])
  const handleSimPause = useCallback(() => setIsPlaying(false), [])

  // ─── Right panel target automaton ─────────────────────────
  const rightAuto = (() => {
    if (diagTarget === 'min' && minRes) return minRes.auto
    if (diagTarget === 'dfa' && dfaRes) return dfaRes.auto
    return auto
  })()

  const meta = MODULE_META[tab] || {}

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <LenisSetup />
      {/* ── LEFT SIDEBAR ── */}
      <Sidebar tab={tab} setTab={setTab} auto={auto} dfaRes={dfaRes} minRes={minRes} />

      {/* ── CENTER WORKSPACE ── */}
      <main className="workspace">
        <div className="workspace-header">
          <div className="workspace-title">
            {meta.title}<span>.</span>
          </div>
          <div className="workspace-sub">{meta.sub}</div>
        </div>

        <div className="workspace-content" key={tab}>
          {/* ══ BUILD ══ */}
          {tab === 'build' && (
            <div>
              {/* Examples row */}
              <Card title="Examples">
                <div className="flex-wrap">
                  {Object.entries(EXAMPLES).map(([key, ex]) => (
                    <button
                      key={key}
                      className="btn btn-ghost btn-sm"
                      onClick={() => loadExample(key)}
                      style={{ borderRadius: 'var(--r-full)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--mint-10)'; e.currentTarget.style.borderColor = 'var(--mint-35)'; e.currentTarget.style.color = 'var(--mint)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = '' }}
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* ── From Regular Expression ── */}
              <Card title="From Regular Expression">
                <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--t3)', marginBottom: 14, lineHeight: 1.7 }}>
                  Enter a regex and alphabet — the NFA is synthesised automatically via
                  {' '}<span style={{ color: 'var(--mint)', fontWeight: 600 }}>Thompson's Construction</span>.
                </p>

                <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
                  <Field label="Regular Expression">
                    <FInput
                      value={regexStr}
                      onChange={e => { setRegexStr(e.target.value); setRegexStatus(null) }}
                      placeholder="(a|b)*abb"
                    />
                  </Field>
                  <Field label="Alphabet (comma-separated)">
                    <FInput
                      value={regexAlpha}
                      onChange={e => { setRegexAlpha(e.target.value); setRegexStatus(null) }}
                      placeholder="a,b"
                    />
                  </Field>
                </div>

                {/* Syntax cheatsheet toggle */}
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginBottom: 12, fontSize: '0.65rem' }}
                  onClick={() => setShowCheatsheet(v => !v)}
                >
                  {showCheatsheet ? '▲ Hide' : '▼ Show'} syntax reference
                </button>

                {showCheatsheet && (
                  <div style={{
                    background: 'var(--surface-low)',
                    border: '1px solid var(--surface-hi)',
                    borderRadius: 'var(--r)',
                    padding: '12px 16px',
                    marginBottom: 14,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '6px 20px',
                  }}>
                    {[
                      ['a, b, …',   'literal character'],
                      ['.',         'any alphabet symbol (wildcard)'],
                      ['r*',        'Kleene star — zero or more'],
                      ['r+',        'one or more (r·r*)'],
                      ['r?',        'optional — zero or one'],
                      ['r|s',       'alternation — r or s'],
                      ['rs',        'concatenation — r then s'],
                      ['(r)',       'grouping / precedence'],
                    ].map(([op, desc]) => (
                      <div key={op} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <code style={{
                          fontFamily: 'var(--mono)', fontSize: '0.72rem',
                          color: 'var(--mint)', background: 'var(--mint-8)',
                          padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap',
                        }}>{op}</code>
                        <span style={{ fontSize: '0.68rem', color: 'var(--t3)' }}>{desc}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex-row" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Btn onClick={handleRegexBuild} variant="mint">▶ Build from Regex</Btn>
                  <Btn onClick={() => { setRegexStr(''); setRegexAlpha('a,b'); setRegexStatus(null) }} variant="ghost" size="sm">✕ Clear</Btn>
                  {regexStatus && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 'var(--r-full)',
                      background: regexStatus.ok ? 'var(--success-10, rgba(16,185,129,0.10))' : 'var(--error-10, rgba(239,68,68,0.10))',
                      border: `1px solid ${regexStatus.ok ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                      fontSize: '0.68rem', fontFamily: 'var(--mono)',
                      color: regexStatus.ok ? 'var(--success)' : 'var(--error)',
                      maxWidth: '100%',
                    }}>
                      <span>{regexStatus.ok ? '✓' : '✗'}</span>
                      <span>{regexStatus.msg}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Definition + Table side-by-side */}
              <div className="grid-2">
                <div>
                  <Card title="Automaton Definition">
                    <div className="grid-2" style={{ gap: 12 }}>
                      {[['States (Q)', 'states', 'q0,q1,q2'], ['Alphabet (Σ)', 'alpha', 'a,b'], ['Start State', 'start', 'q0'], ['Accept States (F)', 'accept', 'q2']].map(([label, key, ph]) => (
                        <Field key={key} label={label}>
                          <FInput value={raw[key]} onChange={e => setRaw(r => ({ ...r, [key]: e.target.value }))} placeholder={ph} />
                        </Field>
                      ))}
                    </div>
                  </Card>

                  <Card title="Transition Function (δ)">
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--t3)', marginBottom: 12, lineHeight: 1.7 }}>
                      One per line: <code style={{ background: 'var(--warn-10)', color: 'var(--warn)', padding: '1px 6px', borderRadius: 4 }}>from,symbol,to</code>
                      &nbsp;· epsilon: <code style={{ background: 'var(--warn-10)', color: 'var(--warn)', padding: '1px 6px', borderRadius: 4 }}>ε</code> or <code style={{ background: 'var(--warn-10)', color: 'var(--warn)', padding: '1px 6px', borderRadius: 4 }}>eps</code>
                    </p>
                    <FTextarea value={raw.trans} onChange={e => setRaw(r => ({ ...r, trans: e.target.value }))} placeholder="q0,a,q1" />
                    <div className="flex-row mt-3">
                      <Btn onClick={handleBuild} variant="mint">▶ Build & Validate</Btn>
                      <Btn onClick={() => { setRaw({ states: '', alpha: '', start: '', accept: '', trans: '' }); setAuto(null); setDfaRes(null); setMinRes(null) }} variant="ghost" size="sm">✕ Clear</Btn>
                    </div>
                  </Card>
                </div>

                <div>
                  <Card title="Transition Table">
                    <TransTable auto={auto} />
                  </Card>

                  {auto && (
                    <Card title="Status">
                      <div className="flex-wrap mb-2">
                        {[
                          ['Type', auto.isNFA ? 'NFA' : 'DFA', true],
                          ['|Q|', auto.states.length, false],
                          ['|Σ|', auto.alpha.length, false],
                          ['|F|', auto.accept.length, false],
                          ['ε-moves', auto.states.some(s => (auto.T[s]?.['ε'] || []).length > 0) ? 'yes' : 'no', false],
                        ].map(([k, v, hi], i) => (
                          <div key={i} className={`chip${hi ? ' active' : ''}`}>
                            <span>{k}</span>
                            <strong style={{ fontWeight: 700 }}>{v}</strong>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--t3)' }}>
                        q₀ = <span style={{ color: 'var(--mint)' }}>{auto.start}</span>
                        &nbsp;·&nbsp; F = {'{'}  <span style={{ color: 'var(--success)' }}>{auto.accept.join(', ')}</span>  {'}'}
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ NFA→DFA ══ */}
          {tab === 'nfa2dfa' && (
            <div>
              <div className="grid-2">
                <div>
                  <Card title="Subset Construction">
                    <AlgoBlock label="Powerset Construction">
                      <span style={{ color: '#7c3aed' }}>function</span>{' '}
                      <span style={{ color: 'var(--mint)' }}>nfaToDfa</span>(nfa):{'\n'}
                      {'  '}start ← ε-closure(<span style={{ color: 'var(--warn)' }}>{'{nfa.q₀}'}</span>){'\n'}
                      {'  '}worklist ← [start]{'\n\n'}
                      {'  '}<span style={{ color: '#7c3aed' }}>while</span> worklist ≠ ∅:{'\n'}
                      {'    '}S ← worklist.pop(){'\n'}
                      {'    '}<span style={{ color: '#7c3aed' }}>for each</span> a <span style={{ color: '#7c3aed' }}>in</span> Σ:{'\n'}
                      {'      '}T ← ε-closure(move(S, a)){'\n'}
                      {'      '}dfa.δ[S, a] ← T{'\n'}
                      {'      '}<span style={{ color: '#7c3aed' }}>if</span> T ∉ dfa.Q: worklist.push(T){'\n'}
                      {'  '}dfa.F ← {'{'}S | S ∩ nfa.F ≠ ∅{'}'}{'\n'}
                      {'  '}<span style={{ color: '#7c3aed' }}>return</span> dfa
                    </AlgoBlock>
                    <div className="flex-row mt-3">
                      <Btn onClick={handleConvert} variant="mint">▶ Run Conversion</Btn>
                      <Btn onClick={() => setNfaIdx(i => Math.min(i + 1, (dfaRes?.steps.length || 1) - 1))} variant="outline" size="sm">⏭ Step</Btn>
                    </div>
                  </Card>

                  {/* ε-Closure table */}
                  <Card title="ε-Closure Table">
                    {dfaRes ? (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                          <thead><tr><th>State</th><th>ε-closure</th></tr></thead>
                          <tbody>
                            {auto.states.map(s => (
                              <tr key={s}>
                                <td style={{ color: 'var(--info)', fontWeight: 600 }}>{s}</td>
                                <td>{'{' + dfaRes.epsInfo[s]?.join(', ') + '}'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : <Empty text="Run conversion to compute ε-closures" />}
                  </Card>
                </div>

                <Card title="Conversion Log">
                  <StepLog steps={dfaRes?.steps || []} activeIdx={nfaIdx} />
                </Card>
              </div>

              <Card title="Resulting DFA — Transition Table">
                <TransTable auto={dfaRes?.auto} />
              </Card>
            </div>
          )}

          {/* ══ MINIMIZE ══ */}
          {tab === 'minimize' && (
            <div>
              <div className="grid-2">
                <div>
                  <Card title="Hopcroft's Algorithm">
                    <AlgoBlock label="Partition Refinement">
                      <span style={{ color: '#7c3aed' }}>function</span>{' '}
                      <span style={{ color: 'var(--mint)' }}>minimize</span>(dfa):{'\n'}
                      {'  '}remove unreachable states{'\n'}
                      {'  '}P ← {'{'}<span style={{ color: 'var(--warn)' }}>F</span>, <span style={{ color: 'var(--warn)' }}>Q \ F</span>{'}'}{'\n\n'}
                      {'  '}<span style={{ color: '#7c3aed' }}>repeat</span>:{'\n'}
                      {'    '}<span style={{ color: '#7c3aed' }}>for each</span> G <span style={{ color: '#7c3aed' }}>in</span> P:{'\n'}
                      {'      '}<span style={{ color: '#7c3aed' }}>if</span> ∃ a: states in G go to{'\n'}
                      {'         '}different groups on a:{'\n'}
                      {'        '}split G → G₁, G₂{'\n'}
                      {'  '}<span style={{ color: '#7c3aed' }}>until</span> P stabilizes{'\n\n'}
                      {'  '}<span style={{ color: '#7c3aed' }}>return</span> quotient automaton
                    </AlgoBlock>
                    <div className="flex-row mt-3">
                      <Btn onClick={handleMinimize} variant="mint">▶ Minimize DFA</Btn>
                      <Btn onClick={() => setMinIdx(i => Math.min(i + 1, (minRes?.steps.length || 1) - 1))} variant="outline" size="sm">⏭ Step</Btn>
                    </div>
                  </Card>

                  <Card title="Equivalence Classes">
                    {minRes ? (
                      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {minRes.partition.map((g, i) => {
                          const dfa = dfaRes?.auto || auto
                          const isAcc = g.some(s => dfa?.accept.includes(s))
                          return (
                            <div key={i} style={{ padding: '10px 14px', background: 'var(--surface-low)', borderLeft: '3px solid var(--mint)', borderRadius: 'var(--r)' }}>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.56rem', color: 'var(--t3)', marginBottom: 3, letterSpacing: '0.10em', textTransform: 'uppercase' }}>Block {i} → M{i}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--t0)', fontWeight: 600 }}>
                                {'{' + g.join(', ') + '}'}{isAcc && <Badge type="accept">accept</Badge>}
                              </div>
                              <div style={{ fontSize: '0.70rem', color: 'var(--t3)', marginTop: 3 }}>Rep: {g[0]} · {g.length} state(s) merged</div>
                            </div>
                          )
                        })}
                      </div>
                    ) : <Empty text="Run minimization to see partitions" />}
                  </Card>
                </div>

                <Card title="Minimization Log">
                  <StepLog steps={minRes?.steps || []} activeIdx={minIdx} />
                </Card>
              </div>

              <Card title="Minimized DFA — Transition Table">
                <TransTable auto={minRes?.auto} />
              </Card>
            </div>
          )}

          {/* ══ TEST ══ */}
          {tab === 'test' && (
            <div>
              <div className="grid-2">
                <div>
                  <Card title="String Test">
                    <Field label="Input String">
                      <FInput value={testStr} onChange={e => setTestStr(e.target.value)} placeholder="e.g. aab — use ε for empty" />
                    </Field>
                    <Field label="Run on">
                      <FSelect value={testTarget} onChange={e => setTestTarget(e.target.value)}>
                        <option value="original">Original (NFA or DFA)</option>
                        <option value="dfa">Converted DFA</option>
                        <option value="min">Minimized DFA</option>
                      </FSelect>
                    </Field>
                    <div className="flex-row mt-3">
                      <Btn onClick={handleTest} variant="mint">▶ Run Test</Btn>
                      <Btn onClick={() => { if (!testResult) handleTest(); else handleSimReset() }} variant="outline" size="sm">🔁 Reset</Btn>
                    </div>
                  </Card>

                  <Card title="Batch Test">
                    <Field label="One string per line">
                      <FTextarea value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder={'ab\naab\nba\nε'} rows={5} />
                    </Field>
                    <div className="mt-2">
                      <Btn onClick={handleBatch} variant="outline">▶ Test All</Btn>
                    </div>
                  </Card>
                </div>

                <div>
                  {/* Verdict */}
                  {testResult && testResult.accepted !== null && (
                    <Card>
                      <div className={testResult.accepted ? 'verdict-accept' : 'verdict-reject'}>
                        <div className="verdict-text" style={{ color: testResult.accepted ? 'var(--success)' : 'var(--error)' }}>
                          {testResult.accepted ? '✓ Accepted' : '✗ Rejected'}
                        </div>
                        <div className="verdict-reason" style={{ color: testResult.accepted ? 'var(--success)' : 'var(--error)' }}>
                          {testResult.reason}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Path trace */}
                  {testResult?.path && (
                    <Card title="Computation Path">
                      <div className="path-trace">
                        {testResult.path.map((step, i) => {
                          const label = step.state || step.sets
                          const isLast = i === testResult.path.length - 1
                          const isAnim = animIdx >= 0 && i === animIdx
                          const visited = animIdx >= 0 && i < animIdx
                          let cls = 'path-state'
                          if (i === 0) cls += ' is-start'
                          if (isAnim) cls += ' is-active'
                          else if (isLast && testResult.accepted !== null) cls += testResult.accepted ? ' is-accept' : ' is-reject'
                          return (
                            <span key={i} className="path-node">
                              {step.sym && <span className="path-sym">→{step.sym}→</span>}
                              <span className={cls}>{label}</span>
                            </span>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  {/* Batch results */}
                  {batchResults && (
                    <Card title="Batch Results">
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                          <thead><tr><th>String</th><th>Result</th><th>Steps</th></tr></thead>
                          <tbody>
                            {batchResults.map((r, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 600 }}>{r.str}</td>
                                <td style={{ color: r.accepted ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>{r.accepted ? '✓ accept' : '✗ reject'}</td>
                                <td style={{ color: 'var(--t3)' }}>{r.path?.length || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ DIAGRAM ══ */}
          {tab === 'visual' && (
            <div>
              <Card title="Target Automaton">
                <div className="flex-row">
                  {[['original', 'Original'], ['dfa', 'Converted DFA'], ['min', 'Minimized DFA']].map(([v, lbl]) => (
                    <button
                      key={v}
                      onClick={() => setDiagTarget(v)}
                      className={`btn btn-sm ${diagTarget === v ? 'btn-mint' : 'btn-ghost'}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </Card>
              <Card style={{ padding: 0, overflow: 'hidden', height: 460 }}>
                <div style={{ height: '100%', position: 'relative' }}>
                  <AutomatonFlow auto={rightAuto} testResult={testResult} animIdx={animIdx} />
                </div>
              </Card>
            </div>
          )}

          {/* ══ THEORY ══ */}
          {tab === 'theory' && (
            <div className="grid-2">
              <div>
                <Card title="DFA — Deterministic FA">
                  <TheoryBlock>
                    A DFA is a 5-tuple <HL>(Q, Σ, δ, q₀, F)</HL>:<br /><br />
                    <HL>Q</HL> — finite set of states<br />
                    <HL>Σ</HL> — finite input alphabet<br />
                    <HL>δ : Q × Σ → Q</HL> — total transition function<br />
                    <HL>q₀ ∈ Q</HL> — unique start state<br />
                    <HL>F ⊆ Q</HL> — accept states<br /><br />
                    Each (state, symbol) leads to <HLG>exactly one</HLG> next state. Accepts w iff δ*(q₀, w) ∈ F.
                  </TheoryBlock>
                </Card>

                <Card title="NFA — Nondeterministic FA">
                  <TheoryBlock>
                    <HL>δ : Q × (Σ ∪ {'{'}{'}'}ε) → </HL><HLR>2^Q</HLR><br /><br />
                    Transitions return a <HLR>set</HLR> of states. ε-transitions move without consuming input.<br /><br />
                    Accepts if <HLG>any</HLG> path ends in F. NFAs and DFAs recognize the same class — regular languages.
                  </TheoryBlock>
                </Card>
              </div>
              <div>
                <Card title="ε-Closure">
                  <AlgoBlock label="Definition">
                    ε-closure(q) = {'{'} q {'}'} ∪ {'{'} p | q →ε*→ p {'}'}{'\n'}
                    ε-closure(S) = ⋃ ε-closure(q)  for q ∈ S{'\n\n'}
                    <span style={{ color: 'var(--t4)', fontStyle: 'italic' }}>// BFS following only ε-edges</span>
                  </AlgoBlock>
                </Card>

                <Card title="Minimization">
                  <TheoryBlock>
                    States p, q are <HLR>distinguishable</HLR> if ∃ w where exactly one of δ*(p,w), δ*(q,w) ∈ F.<br /><br />
                    <HLG>Indistinguishable</HLG> states can be merged. Hopcroft runs in <HLA>O(|Q| log|Q| · |Σ|)</HLA>. Minimal DFA is <HL>unique</HL>.
                  </TheoryBlock>
                </Card>

                <Card title="Complexity">
                  <table className="data-table">
                    <thead><tr><th>Operation</th><th>Time</th></tr></thead>
                    <tbody>
                      {[
                        ['DFA simulation',  'O(|w|)',           'success'],
                        ['NFA simulation',  'O(|Q|·|w|)',       'success'],
                        ['NFA → DFA',       'O(2^|Q|·|Σ|)',     'warn'],
                        ['Minimization',    'O(|Q|log|Q|·|Σ|)', 'success'],
                      ].map(([op, t, c]) => (
                        <tr key={op}>
                          <td>{op}</td>
                          <td style={{ color: `var(--${c})`, fontWeight: 600, fontFamily: 'var(--mono)' }}>{t}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── RIGHT PANEL — Live Visualization ── */}
      <aside className="right-panel">
        <div className="right-panel-header">
          <div className="panel-dot" />
          <span className="right-panel-title">Live Automaton</span>
          {auto && (
            <span className="chip active" style={{ marginLeft: 'auto', fontSize: '0.56rem' }}>
              {auto.isNFA ? 'NFA' : 'DFA'}&nbsp;·&nbsp;{auto.states.length}Q
            </span>
          )}
        </div>

        {/* Canvas */}
        <div className="canvas-area">
          {auto ? (
            <AutomatonFlow
              auto={rightAuto}
              testResult={testResult}
              animIdx={animIdx}
            />
          ) : (
            <div className="canvas-empty">
              <div className="canvas-empty-icon">◎</div>
              <div>Build an automaton to visualize</div>
              <div style={{ opacity: 0.6, marginTop: 2, fontSize: '0.62rem' }}>Use the Build module →</div>
            </div>
          )}
        </div>

        {/* Target selector */}
        {(dfaRes || minRes) && (
          <div style={{ padding: '8px 16px', background: 'var(--surface-low)', display: 'flex', gap: 6, flexShrink: 0 }}>
            {[['original', 'Orig'], ['dfa', 'DFA'], ['min', 'Min']].map(([v, lbl]) => (
              (v === 'original' || (v === 'dfa' && dfaRes) || (v === 'min' && minRes)) && (
                <button
                  key={v}
                  onClick={() => setDiagTarget(v)}
                  className={`btn btn-xs ${diagTarget === v ? 'btn-mint' : 'btn-ghost'}`}
                >
                  {lbl}
                </button>
              )
            ))}
          </div>
        )}

        {/* Input Tracker */}
        <InputTracker
          inputStr={testResult ? (testStr === 'ε' || testStr === 'eps' ? '' : testStr) : null}
          currentIdx={animIdx}
          testResult={testResult}
        />

        {/* Simulation Controls */}
        <SimulationControls
          isPlaying={isPlaying}
          onPlay={handleSimPlay}
          onPause={handleSimPause}
          onNext={handleSimNext}
          onReset={handleSimReset}
          speed={simSpeed}
          onSpeedChange={setSimSpeed}
          canStep={canStep}
          canReset={canReset}
        />

        {/* Legend */}
        <div className="canvas-legend">
          {[['#3b82f6', 'Start'], ['#10b981', 'Accept'], ['#ef4444', 'Dead'], ['#00A19B', 'Active']].map(([col, lbl]) => (
            <div key={lbl} className="legend-item">
              <div className="legend-dot" style={{ background: col }} />
              {lbl}
            </div>
          ))}
          <div className="legend-item" style={{ color: 'var(--warn)', gap: 4 }}>
            <span style={{ letterSpacing: 2 }}>--</span> ε
          </div>
        </div>
      </aside>

      {/* ── POPUP ── */}
      <Popup popupKey={popup} onClose={() => setPopup(null)} />

      {/* ── TOASTS ── */}
      <ToastList toasts={toasts} />
    </div>
  )
}
