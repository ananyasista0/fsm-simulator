import { useState, useEffect, useRef, useCallback } from 'react'
import Popup from './components/Popup'
import {
  Card, HelpBtn, Empty, Badge, TransTable, StepLog,
  InfoChips, AlgoBlock, Btn, Field, Input, Textarea, Select,
  TheoryBlock, HL, HLG, HLA, HLR, ToastList,
} from './components/shared'
import {
  parseAuto, subsetConstruct, minimizeDFA,
  simDFA, simNFA, drawDiagram,
} from './utils/automata'
import { EXAMPLES } from './utils/examples'

const TABS = [
  { id: 'build',    label: '01 Build'    },
  { id: 'nfa2dfa',  label: '02 NFA→DFA'  },
  { id: 'minimize', label: '03 Minimize' },
  { id: 'test',     label: '04 Test'     },
  { id: 'visual',   label: '05 Diagram'  },
  { id: 'theory',   label: '06 Theory'   },
]

export default function App() {
  // ── UI state ─────────────────────────────────────────────
  const [tab,    setTab]    = useState('build')
  const [popup,  setPopup]  = useState(null)
  const [toasts, setToasts] = useState([])

  // ── Automaton state ──────────────────────────────────────
  const [raw, setRaw] = useState({
    states: 'q0,q1,q2',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q2',
    trans:  'q0,a,q0\nq0,b,q0\nq0,a,q1\nq1,b,q2',
  })
  const [auto,    setAuto]    = useState(null)
  const [dfaRes,  setDfaRes]  = useState(null)
  const [minRes,  setMinRes]  = useState(null)

  // ── Step indices ─────────────────────────────────────────
  const [nfaIdx, setNfaIdx] = useState(0)
  const [minIdx, setMinIdx] = useState(0)

  // ── Test state ───────────────────────────────────────────
  const [testStr,     setTestStr]     = useState('ab')
  const [testTarget,  setTestTarget]  = useState('original')
  const [testResult,  setTestResult]  = useState(null)
  const [animIdx,     setAnimIdx]     = useState(-1)
  const [batchInput,  setBatchInput]  = useState('')
  const [batchResults,setBatchResults]= useState(null)

  // ── Diagram state ────────────────────────────────────────
  const [diagTarget, setDiagTarget] = useState('original')
  const canvasRef = useRef(null)

  // ── Toast helper ─────────────────────────────────────────
  const toast = useCallback((msg, type = 'ok') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  // ── Boot: build default automaton ────────────────────────
  useEffect(() => {
    const r = parseAuto(raw)
    if (!r.error) setAuto(r)
  }, []) // eslint-disable-line

  // ── Redraw diagram when tab / target changes ─────────────
  useEffect(() => {
    if (tab !== 'visual') return
    const a = diagTarget === 'min' ? minRes?.auto : diagTarget === 'dfa' ? dfaRes?.auto : auto
    if (canvasRef.current && a) drawDiagram(canvasRef.current, a)
  }, [tab, diagTarget, auto, dfaRes, minRes])

  useEffect(() => {
    const resize = () => {
      if (tab !== 'visual') return
      const a = diagTarget === 'min' ? minRes?.auto : diagTarget === 'dfa' ? dfaRes?.auto : auto
      if (canvasRef.current && a) drawDiagram(canvasRef.current, a)
    }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [tab, diagTarget, auto, dfaRes, minRes])

  // ── Handlers ─────────────────────────────────────────────
  function handleBuild() {
    const r = parseAuto(raw)
    if (r.error) { toast(r.error, 'err'); return }
    setAuto(r)
    setDfaRes(null); setMinRes(null)
    setTestResult(null); setBatchResults(null)
    setNfaIdx(0); setMinIdx(0)
    toast((r.isNFA ? 'NFA' : 'DFA') + ' built — ' + r.states.length + ' states', 'ok')
  }

  function loadExample(key) {
    const e = EXAMPLES[key]
    setRaw(e)
    const r = parseAuto(e)
    if (!r.error) { setAuto(r); setDfaRes(null); setMinRes(null) }
    toast('Loaded: ' + e.label, 'info')
  }

  function handleConvert() {
    if (!auto) { toast('Build an automaton first', 'err'); return }
    const res = subsetConstruct(auto)
    setDfaRes(res)
    setNfaIdx(res.steps.length - 1)
    toast(`Converted: NFA(${auto.states.length}) → DFA(${res.auto.states.length} states)`, 'ok')
  }

  function handleMinimize() {
    const dfa = dfaRes?.auto || (!auto?.isNFA ? auto : null)
    if (!dfa) { toast('Need a DFA — convert first or build one', 'err'); return }
    const res = minimizeDFA(dfa)
    setMinRes(res)
    setMinIdx(res.steps.length - 1)
    toast(`Minimized: ${dfa.states.length} → ${res.auto.states.length} states`, 'ok')
  }

  function getTestAuto() {
    if (testTarget === 'min'  && minRes)   return minRes.auto
    if (testTarget === 'dfa'  && dfaRes)   return dfaRes.auto
    return auto
  }

  function handleTest() {
    const a = getTestAuto()
    if (!a) { toast('Build an automaton first', 'err'); return }
    const s = testStr === 'ε' || testStr === 'eps' ? '' : testStr
    const res = a.isNFA ? simNFA(a, s) : simDFA(a, s)
    setTestResult(res); setAnimIdx(-1)
  }

  function handleAnimate() {
    const a = getTestAuto()
    if (!a || a.isNFA) { handleTest(); return }
    const s = testStr === 'ε' || testStr === 'eps' ? '' : testStr
    const { path } = simDFA(a, s)
    setTestResult({ path, accepted: null, animating: true })
    let i = 0
    const tick = () => {
      setAnimIdx(i); i++
      if (i < path.length) setTimeout(tick, 600)
      else setTestResult(simDFA(a, s))
    }
    tick()
  }

  function handleBatch() {
    const a = getTestAuto()
    if (!a) { toast('Build an automaton first', 'err'); return }
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast('Enter strings to test', 'err'); return }
    const results = lines.map(raw => {
      const s = (raw === 'ε' || raw === 'eps') ? '' : raw
      const res = a.isNFA ? simNFA(a, s) : simDFA(a, s)
      return { str: s === '' ? 'ε' : s, ...res }
    })
    setBatchResults(results)
  }

  // ── Status pills ─────────────────────────────────────────
  const statusPills = [
    ['TYPE', auto ? (auto.isNFA ? 'NFA' : 'DFA') : '—', !!auto],
    ['|Q|',  auto ? auto.states.length : '—',             false],
    ['|Σ|',  auto ? auto.alpha.length  : '—',             false],
    ['DFA',  dfaRes ? dfaRes.auto.states.length + ' st.'  : '—', !!dfaRes],
    ['MIN',  minRes ? minRes.auto.states.length + ' st.'  : '—', !!minRes],
  ]

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', padding: '0 24px 72px' }}>

      {/* ── HEADER ── */}
      <header style={{ padding: '48px 0 32px', borderBottom: '1px solid var(--border)', marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(77,158,247,.7)', marginBottom: 10, textTransform: 'uppercase' }}>
            Automata Theory · Interactive Simulator
          </div>
          <h1 style={{ fontFamily: 'var(--display)', fontSize: 'clamp(1.6rem, 3vw, 2.5rem)', fontWeight: 800, color: 'var(--t0)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 7 }}>
            Finite State Machine{' '}
            <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Simulator</span>
          </h1>
          <p style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--t3)', letterSpacing: '0.06em' }}>
            NFA · DFA · ε-Closure · Subset Construction · Hopcroft Minimization
          </p>
        </div>

        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Online indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'var(--s1)', border: '1px solid rgba(54,214,138,.3)', borderRadius: 100, fontFamily: 'var(--mono)', fontSize: '0.67rem' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', animation: 'blink 2.4s ease-in-out infinite' }} />
            <span style={{ color: 'var(--t3)' }}>SYS</span>
            <strong style={{ color: 'var(--green)', fontWeight: 500 }}>ONLINE</strong>
          </div>
          {/* Status pills */}
          {statusPills.map(([k, v, lit], i) => (
            <div key={i} style={{ padding: '4px 12px', borderRadius: 100, border: `1px solid ${lit ? 'var(--blue-b)' : 'var(--border)'}`, background: lit ? 'var(--blue2)' : 'var(--s1)', fontFamily: 'var(--mono)', fontSize: '0.67rem', color: lit ? 'var(--blue)' : 'var(--t3)', whiteSpace: 'nowrap' }}>
              {k} <strong style={{ fontWeight: 500, color: lit ? 'var(--blue)' : 'var(--t2)' }}>{v}</strong>
            </div>
          ))}
        </div>
      </header>

      {/* ── NAV TABS ── */}
      <nav style={{ display: 'flex', gap: 2, background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 10, padding: 3, marginBottom: 22, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, minWidth: 92, padding: '8px 14px', background: tab === id ? 'var(--s3)' : 'transparent', border: `1px solid ${tab === id ? 'rgba(77,158,247,.22)' : 'transparent'}`, borderRadius: 7, color: tab === id ? 'var(--blue)' : 'var(--t3)', fontFamily: 'var(--mono)', fontSize: '0.63rem', letterSpacing: '0.10em', cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap', textAlign: 'center', textTransform: 'uppercase', boxShadow: tab === id ? '0 1px 6px rgba(0,0,0,.4)' : 'none' }}
            onMouseEnter={e => { if (tab !== id) { e.currentTarget.style.color = 'var(--t2)'; e.currentTarget.style.background = 'var(--s2)' } }}
            onMouseLeave={e => { if (tab !== id) { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'transparent' } }}>
            {label}
          </button>
        ))}
      </nav>

      {/* ── TAB CONTENT ── */}
      <div key={tab} style={{ animation: 'tab-fade .2s ease' }}>

        {/* ══════════ BUILD ══════════ */}
        {tab === 'build' && (
          <div>
            <Card title="Load Example" helpKey="automaton" onOpen={setPopup}>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {Object.entries(EXAMPLES).map(([key, ex]) => (
                  <button key={key} onClick={() => loadExample(key)}
                    style={{ padding: '5px 14px', background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 100, color: 'var(--t2)', fontFamily: 'var(--mono)', fontSize: '0.68rem', cursor: 'pointer', transition: 'all .15s', letterSpacing: '0.03em' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--blue2)'; e.currentTarget.style.borderColor = 'var(--blue-b)'; e.currentTarget.style.color = 'var(--blue)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--s3)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--t2)' }}>
                    {ex.label}
                  </button>
                ))}
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Card title="Automaton Definition" helpKey="automaton" onOpen={setPopup}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[['States', 'states', 'q0,q1,q2'], ['Alphabet Σ', 'alpha', 'a,b'], ['Start State', 'start', 'q0'], ['Accept States F', 'accept', 'q2']].map(([label, key, ph]) => (
                      <Field key={key} label={label}>
                        <Input value={raw[key]} onChange={e => setRaw(r => ({ ...r, [key]: e.target.value }))} placeholder={ph} />
                      </Field>
                    ))}
                  </div>
                </Card>

                <Card title="Transition Function δ" helpKey="transitions" onOpen={setPopup}>
                  <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--t3)', marginBottom: 10, lineHeight: 1.7 }}>
                    One per line:&nbsp;
                    <span style={{ display: 'inline-block', padding: '1px 6px', background: 'var(--amber2)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 4, fontFamily: 'var(--mono)', fontSize: '0.70rem', color: 'var(--amber)' }}>from,symbol,to</span>
                    &nbsp;· epsilon:&nbsp;
                    <span style={{ display: 'inline-block', padding: '1px 6px', background: 'var(--amber2)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 4, fontFamily: 'var(--mono)', fontSize: '0.70rem', color: 'var(--amber)' }}>ε</span>
                    &nbsp;or&nbsp;
                    <span style={{ display: 'inline-block', padding: '1px 6px', background: 'var(--amber2)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 4, fontFamily: 'var(--mono)', fontSize: '0.70rem', color: 'var(--amber)' }}>eps</span>
                  </p>
                  <Textarea value={raw.trans} onChange={e => setRaw(r => ({ ...r, trans: e.target.value }))} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <Btn onClick={handleBuild} variant="blue">▶ Build &amp; Validate</Btn>
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
                    <InfoChips chips={[
                      ['Type',    auto.isNFA ? 'NFA' : 'DFA',                                                  true],
                      ['|Q|',     auto.states.length,                                                           false],
                      ['|Σ|',     auto.alpha.length,                                                            false],
                      ['|F|',     auto.accept.length,                                                           false],
                      ['ε-moves', auto.states.some(s => (auto.T[s]?.['ε'] || []).length > 0) ? 'yes' : 'no',   false],
                    ]} />
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--t3)' }}>
                      q₀ = <span style={{ color: 'var(--blue)' }}>{auto.start}</span>
                      &nbsp;·&nbsp; F = {'{'}<span style={{ color: 'var(--green)' }}>{auto.accept.join(', ')}</span>{'}'}
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '0.66rem', color: 'var(--t4)', marginTop: 7 }}>
                      {auto.isNFA ? '→ Proceed to tab 02 — NFA→DFA' : '→ Already a DFA — go to tab 03 or 04'}
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ NFA→DFA ══════════ */}
        {tab === 'nfa2dfa' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Card title="Subset Construction" helpKey="subset" onOpen={setPopup}>
                  <AlgoBlock label="// Powerset Construction">
                    <span style={{ color: '#c792ea' }}>function</span>{' '}
                    <span style={{ color: 'var(--blue)' }}>nfaToDfa</span>(nfa):{'\n'}
                    {'  '}start ← ε-closure(<span style={{ color: 'var(--amber)' }}>{'{nfa.q₀}'}</span>){'\n'}
                    {'  '}worklist ← [start]{'\n\n'}
                    {'  '}<span style={{ color: '#c792ea' }}>while</span> worklist ≠ ∅:{'\n'}
                    {'    '}S ← worklist.pop(){'\n'}
                    {'    '}<span style={{ color: '#c792ea' }}>for each</span> a <span style={{ color: '#c792ea' }}>in</span> Σ:{'\n'}
                    {'      '}T ← ε-closure(move(S, a)){'\n'}
                    {'      '}dfa.δ[S, a] ← T{'\n'}
                    {'      '}<span style={{ color: '#c792ea' }}>if</span> T ∉ dfa.Q: worklist.push(T){'\n\n'}
                    {'  '}dfa.F ← {'{'} S | S ∩ nfa.F ≠ ∅ {'}'}{'\n'}
                    {'  '}<span style={{ color: '#c792ea' }}>return</span> dfa
                  </AlgoBlock>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <Btn onClick={handleConvert} variant="blue">▶ Run Conversion</Btn>
                    <Btn onClick={() => setNfaIdx(i => Math.min(i + 1, (dfaRes?.steps.length || 1) - 1))} variant="amber" size="sm">⏭ Step</Btn>
                  </div>
                </Card>

                <Card title="ε-Closure Table" helpKey="epsClosure" onOpen={setPopup}>
                  {dfaRes ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--border2)' }}>
                          <th style={thSt}>State</th><th style={thSt}>ε-closure</th>
                        </tr></thead>
                        <tbody>
                          {auto.states.map(s => (
                            <tr key={s} style={{ borderBottom: '1px solid rgba(255,255,255,.025)' }}>
                              <td style={{ padding: '7px 11px', color: 'var(--blue)', fontWeight: 500 }}>{s}</td>
                              <td style={{ padding: '7px 11px', color: 'var(--t2)' }}>{'{' + dfaRes.epsInfo[s]?.join(', ') + '}'}</td>
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

        {/* ══════════ MINIMIZE ══════════ */}
        {tab === 'minimize' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Card title="Hopcroft's Algorithm" helpKey="minimize" onOpen={setPopup}>
                  <AlgoBlock label="// Partition Refinement">
                    <span style={{ color: '#c792ea' }}>function</span>{' '}
                    <span style={{ color: 'var(--blue)' }}>minimize</span>(dfa):{'\n'}
                    {'  '}remove unreachable states{'\n'}
                    {'  '}P ← {'{'}<span style={{ color: 'var(--amber)' }}>F</span>, <span style={{ color: 'var(--amber)' }}>Q \ F</span>{'}'}{'\n\n'}
                    {'  '}<span style={{ color: '#c792ea' }}>repeat</span>:{'\n'}
                    {'    '}<span style={{ color: '#c792ea' }}>for each</span> G <span style={{ color: '#c792ea' }}>in</span> P:{'\n'}
                    {'      '}<span style={{ color: '#c792ea' }}>if</span> ∃ a: states in G go to{'\n'}
                    {'         '}different groups on a:{'\n'}
                    {'        '}split G → G₁, G₂{'\n'}
                    {'  '}<span style={{ color: '#c792ea' }}>until</span> P stabilizes{'\n\n'}
                    {'  '}<span style={{ color: '#c792ea' }}>return</span> quotient automaton
                  </AlgoBlock>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <Btn onClick={handleMinimize} variant="blue">▶ Minimize DFA</Btn>
                    <Btn onClick={() => setMinIdx(i => Math.min(i + 1, (minRes?.steps.length || 1) - 1))} variant="amber" size="sm">⏭ Step</Btn>
                  </div>
                </Card>

                <Card title="Equivalence Classes">
                  {minRes ? (
                    <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {minRes.partition.map((g, i) => {
                        const dfa = dfaRes?.auto || auto
                        const isAcc = g.some(s => dfa?.accept.includes(s))
                        return (
                          <div key={i} style={{ padding: '9px 12px', background: 'var(--s2)', border: '1px solid var(--border)', borderLeft: '2px solid var(--green)', borderRadius: 5 }}>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.60rem', color: 'var(--t3)', marginBottom: 2 }}>BLOCK {i} → M{i}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--t1)', fontWeight: 500 }}>
                              {'{' + g.join(', ') + '}'}{isAcc && <Badge type="accept">accept</Badge>}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--t3)', marginTop: 2 }}>Rep: {g[0]} · {g.length} state(s) merged</div>
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

        {/* ══════════ TEST ══════════ */}
        {tab === 'test' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <Card title="String Test" helpKey="testing" onOpen={setPopup}>
                  <Field label="Input string">
                    <Input value={testStr} onChange={e => setTestStr(e.target.value)} placeholder="e.g. aab — use ε for empty" />
                  </Field>
                  <Field label="Run on">
                    <Select value={testTarget} onChange={e => setTestTarget(e.target.value)}>
                      <option value="original">Original (NFA or DFA)</option>
                      <option value="dfa">Converted DFA</option>
                      <option value="min">Minimized DFA</option>
                    </Select>
                  </Field>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <Btn onClick={handleTest} variant="blue">▶ Run Test</Btn>
                    <Btn onClick={handleAnimate} variant="amber" size="sm">⏭ Animate</Btn>
                  </div>
                </Card>

                <Card title="Batch Test">
                  <Field label="One string per line">
                    <Textarea value={batchInput} onChange={e => setBatchInput(e.target.value)} placeholder={'ab\naab\nba\nε'} rows={5} />
                  </Field>
                  <div style={{ marginTop: 10 }}>
                    <Btn onClick={handleBatch} variant="green">▶ Test All</Btn>
                  </div>
                </Card>
              </div>

              <div>
                <Card title="Verdict">
                  {!testResult && <Empty text="Enter a string and run test" />}
                  {testResult && testResult.accepted !== null && (
                    <div style={{ padding: 18, borderRadius: 8, textAlign: 'center', background: testResult.accepted ? 'var(--green2)' : 'var(--red2)', border: `1px solid ${testResult.accepted ? 'var(--green-b)' : 'var(--red-b)'}` }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: testResult.accepted ? 'var(--green)' : 'var(--red)', letterSpacing: '.01em' }}>
                        {testResult.accepted ? '✓ Accepted' : '✗ Rejected'}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.71rem', marginTop: 5, opacity: .75, color: testResult.accepted ? 'var(--green)' : 'var(--red)' }}>
                        {testResult.reason}
                      </div>
                    </div>
                  )}
                </Card>

                <Card title="Computation Path">
                  {!testResult?.path && <Empty text="Path trace shown after test" />}
                  {testResult?.path && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                      {testResult.path.map((step, i) => {
                        const label = step.state || step.sets
                        const isLast = i === testResult.path.length - 1
                        const isAnim = animIdx >= 0 && i === animIdx
                        const bc = isAnim ? 'rgba(245,158,11,.5)' : isLast ? (testResult.accepted ? 'rgba(54,214,138,.5)' : 'rgba(224,92,114,.45)') : i === 0 ? 'rgba(77,158,247,.45)' : 'var(--border)'
                        const tc = isAnim ? 'var(--amber)' : isLast ? (testResult.accepted ? 'var(--green)' : 'var(--red)') : i === 0 ? 'var(--blue)' : 'var(--t2)'
                        return (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {step.sym && <span style={{ fontSize: '0.65rem', color: 'var(--t3)', fontFamily: 'var(--mono)' }}>→{step.sym}→</span>}
                            <span style={{ padding: '2px 10px', background: 'var(--s2)', border: `1px solid ${bc}`, borderRadius: 100, fontFamily: 'var(--mono)', fontSize: '0.70rem', color: tc }}>{label}</span>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </Card>

                {batchResults && (
                  <Card title="Batch Results">
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
                        <thead><tr style={{ borderBottom: '1px solid var(--border2)' }}>
                          {['String', 'Result', 'Steps'].map(h => <th key={h} style={thSt}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {batchResults.map((r, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.025)' }}>
                              <td style={{ padding: '7px 11px', color: 'var(--t1)' }}>{r.str}</td>
                              <td style={{ padding: '7px 11px', fontWeight: 500, color: r.accepted ? 'var(--green)' : 'var(--red)' }}>{r.accepted ? '✓ accept' : '✗ reject'}</td>
                              <td style={{ padding: '7px 11px', color: 'var(--t3)' }}>{r.path?.length || '—'} states</td>
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

        {/* ══════════ DIAGRAM ══════════ */}
        {tab === 'visual' && (
          <div>
            <div style={{ background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 11, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--s2)', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '0.60rem', letterSpacing: '0.14em', color: 'var(--t3)', textTransform: 'uppercase' }}>State Diagram</span>
                {[['original', 'Original'], ['dfa', 'Converted DFA'], ['min', 'Minimized DFA']].map(([v, lbl]) => (
                  <button key={v} onClick={() => setDiagTarget(v)}
                    style={{ padding: '5px 13px', background: diagTarget === v ? 'var(--blue2)' : 'transparent', border: `1px solid ${diagTarget === v ? 'var(--blue-b)' : 'var(--border)'}`, borderRadius: 6, fontSize: '0.64rem', fontFamily: 'var(--mono)', color: diagTarget === v ? 'var(--blue)' : 'var(--t3)', cursor: 'pointer', transition: 'all .15s' }}>
                    {lbl}
                  </button>
                ))}
                <HelpBtn popupKey="diagram" onOpen={setPopup} />
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: '0.64rem', color: 'var(--blue)', padding: '2px 9px', border: '1px solid rgba(77,158,247,.22)', borderRadius: 4, background: 'var(--blue2)' }}>
                  {diagTarget === 'min' && minRes ? `Min DFA · ${minRes.auto.states.length} st.` : diagTarget === 'dfa' && dfaRes ? `DFA · ${dfaRes.auto.states.length} st.` : auto ? `Original · ${auto.states.length} st.` : 'No diagram'}
                </span>
              </div>
              <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
              <div style={{ display: 'flex', gap: 16, padding: '9px 14px', borderTop: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: '0.64rem', color: 'var(--t3)', flexWrap: 'wrap' }}>
                {[['#4d9ef7', 'Start state'], ['#36d68a', 'Accept state'], ['#e05c72', 'Dead state (∅)']].map(([col, lbl]) => (
                  <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', border: `1.5px solid ${col}`, background: col + '25', flexShrink: 0 }} />{lbl}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--amber)' }}>
                  <span style={{ letterSpacing: 2 }}>- -</span> ε-transition
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ THEORY ══════════ */}
        {tab === 'theory' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Card title="DFA — Deterministic FA" helpKey="automaton" onOpen={setPopup}>
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

              <Card title="NFA — Nondeterministic FA" helpKey="automaton" onOpen={setPopup}>
                <TheoryBlock>
                  <HL>δ : Q × (Σ ∪ {'{'}{'}'}ε) → </HL><HLR>2^Q</HLR><br /><br />
                  Transitions return a <HLR>set</HLR> of states. ε-transitions move without consuming input.<br /><br />
                  Accepts if <HLG>any</HLG> path ends in F. NFAs and DFAs recognize the same class — regular languages.
                </TheoryBlock>
              </Card>
            </div>
            <div>
              <Card title="ε-Closure" helpKey="epsClosure" onOpen={setPopup}>
                <AlgoBlock label="Definition">
                  ε-closure(q) = {'{'} q {'}'} ∪ {'{'} p | q →ε*→ p {'}'}{'\n'}
                  ε-closure(S) = ⋃ ε-closure(q)  for q ∈ S{'\n\n'}
                  <span style={{ color: 'var(--t4)', fontStyle: 'italic' }}>// BFS following only ε-edges{'\n'}// Applied at every step of subset construction</span>
                </AlgoBlock>
              </Card>

              <Card title="Minimization" helpKey="minimize" onOpen={setPopup}>
                <TheoryBlock>
                  States p, q are <HLR>distinguishable</HLR> if ∃ w where exactly one of δ*(p,w), δ*(q,w) ∈ F.<br /><br />
                  <HLG>Indistinguishable</HLG> states can be merged. Hopcroft runs in <HLA>O(|Q| log|Q| · |Σ|)</HLA>. The minimal DFA is <HL>unique</HL>.
                </TheoryBlock>
              </Card>

              <Card title="Complexity">
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border2)' }}>
                      <th style={thSt}>Operation</th><th style={thSt}>Time</th>
                    </tr></thead>
                    <tbody>
                      {[
                        ['DFA simulation',  'O(|w|)',              'var(--green)'],
                        ['NFA simulation',  'O(|Q|·|w|)',          'var(--green)'],
                        ['NFA → DFA',       'O(2^|Q|·|Σ|)',        'var(--amber)'],
                        ['DFA minimization','O(|Q| log|Q|·|Σ|)',   'var(--green)'],
                      ].map(([op, t, c]) => (
                        <tr key={op} style={{ borderBottom: '1px solid rgba(255,255,255,.025)' }}>
                          <td style={{ padding: '7px 11px', color: 'var(--t2)' }}>{op}</td>
                          <td style={{ padding: '7px 11px', color: c }}>{t}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ── POPUP ── */}
      <Popup popupKey={popup} onClose={() => setPopup(null)} />

      {/* ── TOASTS ── */}
      <ToastList toasts={toasts} />
    </div>
  )
}

// shared table header style
const thSt = { textAlign: 'left', padding: '7px 11px', color: 'var(--t3)', fontSize: '0.62rem', letterSpacing: '0.10em', fontWeight: 400, background: 'var(--s2)' }
