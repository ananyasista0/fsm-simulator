import { useState, useRef } from 'react'

// ── HelpBtn ───────────────────────────────────────────────
export function HelpBtn({ popupKey, onOpen }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => onOpen(popupKey)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 17, height: 17, borderRadius: '50%',
        background: hov ? 'var(--blue2)' : 'transparent',
        border: `1px solid ${hov ? 'var(--blue)' : 'var(--t3)'}`,
        color: hov ? 'var(--blue)' : 'var(--t3)',
        fontSize: '9.5px', fontWeight: 600, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all .15s', marginLeft: 'auto',
        fontFamily: 'var(--sans)', lineHeight: 1,
      }}
    >
      ?
    </button>
  )
}

// ── Card ──────────────────────────────────────────────────
export function Card({ title, helpKey, onOpen, children, style }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--s1)',
        border: `1px solid ${hov ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 10, padding: '18px 20px', marginBottom: 14,
        transition: 'border-color .2s', ...style,
      }}
    >
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 2, height: 12, background: 'var(--blue)', borderRadius: 2, opacity: 0.7, flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '0.60rem', letterSpacing: '0.14em', color: 'var(--t3)', textTransform: 'uppercase' }}>
            {title}
          </span>
          {helpKey && onOpen && <HelpBtn popupKey={helpKey} onOpen={onOpen} />}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Empty placeholder ─────────────────────────────────────
export function Empty({ text }) {
  return (
    <div style={{ padding: 22, textAlign: 'center', fontFamily: 'var(--mono)', fontSize: '0.70rem', color: 'var(--t3)', border: '1px dashed var(--border)', borderRadius: 7, letterSpacing: '0.04em' }}>
      {text}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────
const BADGE_STYLES = {
  accept: { bg: 'var(--green2)',  color: 'var(--green)', border: 'rgba(54,214,138,.25)' },
  start:  { bg: 'var(--blue2)',   color: 'var(--blue)',  border: 'rgba(77,158,247,.25)' },
  dead:   { bg: 'var(--red2)',    color: 'var(--red)',   border: 'rgba(224,92,114,.25)' },
}

export function Badge({ type, children }) {
  const s = BADGE_STYLES[type] || {}
  return (
    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 4, fontSize: '0.60rem', fontFamily: 'var(--mono)', letterSpacing: '0.06em', marginLeft: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {children}
    </span>
  )
}

// ── Transition Table ──────────────────────────────────────
export function TransTable({ auto }) {
  if (!auto) return <Empty text="Build an automaton to see its table" />
  const hasEps = auto.states.some(s => (auto.T[s]?.['ε'] || []).length > 0)
  const syms = [...auto.alpha, ...(hasEps ? ['ε'] : [])]
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--mono)', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border2)' }}>
            <th style={thStyle}>State</th>
            {syms.map(s => <th key={s} style={thStyle}>{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {auto.states.map(s => (
            <tr key={s} style={{ borderBottom: '1px solid rgba(255,255,255,.025)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '8px 12px', color: 'var(--blue)', fontWeight: 500 }}>
                {s}
                {s === auto.start && <Badge type="start">start</Badge>}
                {auto.accept.includes(s) && <Badge type="accept">accept</Badge>}
                {s === '∅' && <Badge type="dead">dead</Badge>}
              </td>
              {syms.map(sym => {
                const nx = auto.T[s]?.[sym] || []
                return <td key={sym} style={{ padding: '8px 12px', color: nx.length ? 'var(--t2)' : 'var(--t4)' }}>{nx.length ? nx.join(', ') : '—'}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thStyle = { textAlign: 'left', padding: '7px 12px', color: 'var(--t3)', fontSize: '0.62rem', letterSpacing: '0.10em', fontWeight: 400, background: 'var(--s2)' }

// ── Step Log ──────────────────────────────────────────────
export function StepLog({ steps, activeIdx }) {
  return (
    <div style={{ maxHeight: 290, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {steps.length === 0 && <Empty text="Steps appear here after running" />}
      {steps.map((s, i) => (
        <div key={i} style={{
          padding: '9px 13px',
          background: i === activeIdx ? 'rgba(77,158,247,.07)' : 'var(--s2)',
          border: '1px solid var(--border)',
          borderLeft: `2px solid ${i <= activeIdx ? 'var(--green)' : 'var(--border)'}`,
          borderRadius: 5, transition: 'all .2s',
          animation: 'step-slide-in .2s ease',
        }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.60rem', color: 'var(--t3)', marginBottom: 3 }}>
            STEP {String(i + 1).padStart(2, '0')}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--t1)', fontWeight: 500 }}>{s.title} — {s.desc}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.70rem', color: 'var(--t3)', marginTop: 3, lineHeight: 1.5, wordBreak: 'break-all' }}>{s.detail}</div>
        </div>
      ))}
    </div>
  )
}

// ── Info chips row ────────────────────────────────────────
export function InfoChips({ chips }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
      {chips.map(([k, v, hi], i) => (
        <div key={i} style={{ padding: '3px 10px', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'var(--mono)', fontSize: '0.68rem', color: 'var(--t3)' }}>
          {k} <strong style={{ fontWeight: 500, color: hi ? 'var(--blue)' : 'var(--t2)' }}>{v}</strong>
        </div>
      ))}
    </div>
  )
}

// ── Algo / pseudocode block ───────────────────────────────
export function AlgoBlock({ label, children }) {
  return (
    <div style={{ background: 'rgba(0,0,0,.30)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
      <div style={{ padding: '7px 14px', borderBottom: '1px solid var(--border)', background: 'var(--s3)', fontFamily: 'var(--mono)', fontSize: '0.60rem', letterSpacing: '0.14em', color: 'var(--t3)', textTransform: 'uppercase' }}>
        {label}
      </div>
      <pre style={{ padding: '14px 16px', fontFamily: 'var(--mono)', fontSize: '0.75rem', lineHeight: 2, color: 'var(--t3)', whiteSpace: 'pre', overflowX: 'auto', margin: 0 }}>
        {children}
      </pre>
    </div>
  )
}

// ── Btn ───────────────────────────────────────────────────
const BTN_VARIANTS = {
  blue:  { bg: 'var(--blue2)',  border: 'rgba(77,158,247,.35)',  color: 'var(--blue)',  hov: 'rgba(77,158,247,.22)',  hovB: 'rgba(77,158,247,.6)' },
  green: { bg: 'var(--green2)', border: 'rgba(54,214,138,.30)',  color: 'var(--green)', hov: 'rgba(54,214,138,.22)',  hovB: 'rgba(54,214,138,.5)' },
  amber: { bg: 'var(--amber2)', border: 'rgba(245,158,11,.30)',  color: 'var(--amber)', hov: 'rgba(245,158,11,.22)',  hovB: 'rgba(245,158,11,.5)' },
  ghost: { bg: 'transparent',   border: 'var(--border)',          color: 'var(--t3)',    hov: 'var(--s3)',             hovB: 'var(--border2)' },
}

export function Btn({ onClick, variant = 'blue', size = 'md', children }) {
  const [hov, setHov] = useState(false)
  const v = BTN_VARIANTS[variant]
  const sz = size === 'sm' ? { padding: '6px 13px', fontSize: '0.64rem' } : size === 'xs' ? { padding: '4px 10px', fontSize: '0.60rem' } : { padding: '8px 18px', fontSize: '0.70rem' }
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onMouseDown={e => e.currentTarget.style.transform = 'scale(.97)'}
      onMouseUp={e => e.currentTarget.style.transform = 'none'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 6, border: `1px solid ${hov ? v.hovB : v.border}`, background: hov ? v.hov : v.bg, color: v.color, fontFamily: 'var(--mono)', letterSpacing: '0.05em', cursor: 'pointer', transition: 'all .15s', fontWeight: 400, ...sz }}>
      {children}
    </button>
  )
}

// ── Field wrapper ─────────────────────────────────────────
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontFamily: 'var(--mono)', fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--t3)', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Input / Textarea / Select ─────────────────────────────
export function Input({ value, onChange, placeholder, id }) {
  return (
    <input id={id} value={value} onChange={onChange} placeholder={placeholder}
      style={inputStyle}
      onFocus={e => { e.target.style.borderColor = 'rgba(77,158,247,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(77,158,247,.08)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows = 5 }) {
  return (
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ ...inputStyle, minHeight: 110, lineHeight: 1.8, resize: 'vertical' }}
      onFocus={e => { e.target.style.borderColor = 'rgba(77,158,247,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(77,158,247,.08)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
    />
  )
}

export function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange}
      style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath fill='%234a5270' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28 }}
      onFocus={e => { e.target.style.borderColor = 'rgba(77,158,247,.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(77,158,247,.08)' }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}>
      {children}
    </select>
  )
}

const inputStyle = {
  width: '100%', background: 'rgba(0,0,0,.32)', border: '1px solid var(--border)',
  borderRadius: 6, color: 'var(--t1)', fontFamily: 'var(--mono)', fontSize: '0.8rem',
  padding: '8px 11px', outline: 'none', transition: 'border-color .15s, box-shadow .15s', caretColor: 'var(--blue)',
}

// ── Syntax-highlighted pseudo-code ───────────────────────
// Usage: <CodeLine kw="function" fn="nfaToDfa" ... />
// For convenience, just use raw HTML inside AlgoBlock with <span> tags.
// See tabs that use dangerouslySetInnerHTML for the algo blocks.

// ── Theory block ──────────────────────────────────────────
export function TheoryBlock({ children }) {
  return (
    <div style={{ background: 'rgba(0,0,0,.25)', border: '1px solid var(--border)', borderRadius: 7, padding: '14px 16px', fontSize: '0.84rem', lineHeight: 1.85, color: 'var(--t2)' }}>
      {children}
    </div>
  )
}

export const HL  = ({ children }) => <span style={{ color: 'var(--blue)',  fontWeight: 500 }}>{children}</span>
export const HLG = ({ children }) => <span style={{ color: 'var(--green)' }}>{children}</span>
export const HLA = ({ children }) => <span style={{ color: 'var(--amber)' }}>{children}</span>
export const HLR = ({ children }) => <span style={{ color: 'var(--red)'   }}>{children}</span>

// ── Toast list ────────────────────────────────────────────
export function ToastList({ toasts }) {
  const colorMap = { ok: 'rgba(54,214,138,.1)', err: 'rgba(224,92,114,.1)', info: 'rgba(77,158,247,.1)' }
  const borderMap = { ok: 'rgba(54,214,138,.3)', err: 'rgba(224,92,114,.3)', info: 'rgba(77,158,247,.3)' }
  const textMap   = { ok: 'var(--green)', err: 'var(--red)', info: 'var(--blue)' }
  return (
    <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 7, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ padding: '9px 15px', borderRadius: 7, fontFamily: 'var(--mono)', fontSize: '0.70rem', border: `1px solid ${borderMap[t.type]}`, background: colorMap[t.type], color: textMap[t.type], pointerEvents: 'all', whiteSpace: 'nowrap', animation: 'toast-in .22s cubic-bezier(.34,1.28,.64,1) forwards' }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
