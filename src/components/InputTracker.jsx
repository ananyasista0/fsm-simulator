// ── InputTracker.jsx ─────────────────────────────────────────
// Animated character-by-character input tracker display

export default function InputTracker({ inputStr, currentIdx, testResult }) {
  if (!inputStr && inputStr !== '') return null

  const chars = inputStr === '' ? [] : inputStr.split('')
  const isEmpty = chars.length === 0

  // Derive current state label
  let stateLabel = null
  let stateType = 'none'
  if (testResult?.path && currentIdx >= 0) {
    const step = testResult.path[currentIdx]
    if (step) {
      stateLabel = step.state || step.sets
      if (currentIdx === testResult.path.length - 1 && testResult.accepted !== null) {
        stateType = testResult.accepted ? 'accept' : 'reject'
      } else {
        stateType = 'active'
      }
    }
  }

  const stateColors = {
    accept: { bg: 'var(--success-10)', color: 'var(--success)', border: 'rgba(16,185,129,0.35)' },
    reject: { bg: 'var(--error-10)',   color: 'var(--error)',   border: 'rgba(239,68,68,0.35)'  },
    active: { bg: 'var(--mint-10)',    color: 'var(--mint)',    border: 'var(--mint-35)'         },
    none:   { bg: 'var(--surface-1)', color: 'var(--t3)',      border: 'var(--border-md)'       },
  }
  const sc = stateColors[stateType]

  return (
    <div className="input-tracker">
      <div className="input-tracker-label">
        {isEmpty ? 'ε (empty string)' : 'Input String'}
      </div>

      {isEmpty ? (
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '0.82rem',
          color: 'var(--mint)', fontWeight: 600, padding: '4px 0'
        }}>ε</div>
      ) : (
        <div className="input-chars">
          {chars.map((ch, i) => {
            // i corresponds to path[i+1] since path[0] is start before any char
            const charPathIdx = i + 1
            const visited = currentIdx >= charPathIdx
            const isCurrent = currentIdx === charPathIdx

            return (
              <div
                key={i}
                className={`input-char${visited ? ' visited' : ''}${isCurrent ? ' current' : ''}`}
              >
                <div className="input-char-symbol">{ch}</div>
                {isCurrent && (
                  <div className="input-char-pointer">▲</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {stateLabel && (
        <div className="tracker-state-info">
          <span>→</span>
          <span
            className="tracker-state-badge"
            style={{
              background: sc.bg, color: sc.color,
              border: `1px solid ${sc.border}`,
              padding: '1px 8px', borderRadius: 'var(--r-full)',
              fontFamily: 'var(--mono)', fontSize: '0.65rem', fontWeight: 600
            }}
          >
            {stateLabel}
          </span>
          <span style={{ fontSize: '0.60rem', color: 'var(--t4)' }}>
            {stateType === 'accept' ? '✓ accept' :
             stateType === 'reject' ? '✗ reject' :
             `step ${currentIdx}/${(testResult?.path?.length ?? 1) - 1}`}
          </span>
        </div>
      )}
    </div>
  )
}
