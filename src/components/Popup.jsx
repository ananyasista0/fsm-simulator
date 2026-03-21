import { useEffect } from 'react'
import { POPUP_DATA } from '../utils/popupData'

// ── Section renderers ────────────────────────────────────
function Section({ section }) {
  const s = section
  if (s.type === 'p') return <p style={styles.p}>{s.text}</p>
  if (s.type === 'divider') return <hr style={styles.divider} />
  if (s.type === 'heading') return <div style={styles.sectionTitle}>{s.text}</div>
  if (s.type === 'code')    return <pre style={styles.code}>{s.text}</pre>
  if (s.type === 'note')    return <div style={styles.note}>{s.text}</div>

  if (s.type === 'keyval') return (
    <div style={{ marginBottom: 12 }}>
      {s.items.map(([k, v], i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
          <code style={styles.key}>{k}</code>
          <span style={styles.kvVal}>{v}</span>
        </div>
      ))}
    </div>
  )

  if (s.type === 'steps') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 12 }}>
      {s.items.map(([title, body], i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={styles.stepNum}>{i + 1}</div>
          <div style={styles.stepText}>
            <strong style={{ color: 'var(--t0)', fontWeight: 500 }}>{title}: </strong>
            {body.split('\n').map((line, j) => j === 0 ? line : <span key={j}><br />{line}</span>)}
          </div>
        </div>
      ))}
    </div>
  )

  if (s.type === 'twoCol') return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
      {[s.left, s.right].map((col, i) => (
        <div key={i} style={styles.col}>
          <div style={styles.colLabel}>{col.label}</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--t2)', lineHeight: 1.7, margin: 0 }}>{col.text}</p>
        </div>
      ))}
    </div>
  )

  if (s.type === 'colorKey') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {s.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--t2)' }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', border: `1.5px solid ${item.color}`, background: item.color + '30', flexShrink: 0 }} />
          {item.label}
        </div>
      ))}
    </div>
  )

  return null
}

// ── Main Popup component ─────────────────────────────────
export default function Popup({ popupKey, onClose }) {
  const data   = POPUP_DATA[popupKey]
  const isOpen = !!popupKey

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className={`popup-overlay${isOpen ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="popup-box">
        {/* Close button */}
        <button onClick={onClose} style={styles.closeBtn}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--border3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--border2)' }}>
          ✕
        </button>

        {data && (
          <>
            <div style={styles.tag}>{data.tag}</div>
            <h2 style={styles.title}>{data.title}</h2>
            {data.sections.map((section, i) => <Section key={i} section={section} />)}
          </>
        )}
      </div>
    </div>
  )
}

// ── Inline styles ─────────────────────────────────────────
const styles = {
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 28, height: 28, borderRadius: '50%',
    background: 'var(--s3)', border: '1px solid var(--border2)',
    color: 'var(--t3)', fontSize: 13, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s', lineHeight: 1,
  },
  tag: {
    fontFamily: 'var(--mono)', fontSize: '0.60rem', letterSpacing: '0.18em',
    color: 'rgba(77,158,247,0.75)', textTransform: 'uppercase', marginBottom: 7,
  },
  title: {
    fontSize: '1.15rem', fontWeight: 700, color: 'var(--t0)',
    letterSpacing: '-0.02em', marginBottom: 18, lineHeight: 1.3,
  },
  p: {
    fontSize: '0.86rem', color: 'var(--t2)', lineHeight: 1.75, marginBottom: 10,
  },
  divider: { border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' },
  sectionTitle: {
    fontFamily: 'var(--mono)', fontSize: '0.60rem', letterSpacing: '0.14em',
    color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 10,
  },
  code: {
    fontFamily: 'var(--mono)', fontSize: '0.78rem', background: 'var(--s3)',
    padding: '12px 16px', borderRadius: 8, color: 'var(--t2)', lineHeight: 1.9,
    whiteSpace: 'pre', marginBottom: 12, border: '1px solid var(--border)', overflowX: 'auto',
  },
  note: {
    fontFamily: 'var(--mono)', fontSize: '0.70rem', color: 'var(--t3)',
    background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 6,
    padding: '9px 12px', lineHeight: 1.6, marginTop: 4,
  },
  key: {
    fontFamily: 'var(--mono)', fontSize: '0.70rem', background: 'var(--s3)',
    padding: '2px 8px', borderRadius: 4, color: 'var(--amber)',
    border: '1px solid rgba(245,158,11,0.22)', flexShrink: 0,
    whiteSpace: 'nowrap', marginTop: 2,
  },
  kvVal: { fontSize: '0.85rem', color: 'var(--t2)', lineHeight: 1.65 },
  stepNum: {
    width: 20, height: 20, borderRadius: '50%',
    background: 'var(--blue2)', border: '1px solid rgba(77,158,247,0.30)',
    color: 'var(--blue)', fontSize: '0.65rem', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, fontFamily: 'var(--mono)', marginTop: 1,
  },
  stepText: { fontSize: '0.85rem', color: 'var(--t2)', lineHeight: 1.65 },
  col: {
    background: 'var(--s3)', border: '1px solid var(--border)', borderRadius: 8, padding: 13,
  },
  colLabel: {
    fontFamily: 'var(--mono)', fontSize: '0.60rem', letterSpacing: '0.12em',
    color: 'var(--blue)', textTransform: 'uppercase', marginBottom: 7,
  },
}
