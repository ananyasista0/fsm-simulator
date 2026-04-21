// ── Sidebar.jsx ──────────────────────────────────────────────
// Left navigation — "The Instruments" panel
// Uses Material Symbols Outlined icons per Stitch Balanced Palette design

const MODULES = [
  { id: 'build',    icon: 'architecture',  label: 'Build',    sub: 'Define automaton'      },
  { id: 'nfa2dfa',  icon: 'transform',     label: 'Convert',  sub: 'NFA → DFA'             },
  { id: 'minimize', icon: 'compress',      label: 'Minimize', sub: "Hopcroft's algorithm"  },
  { id: 'test',     icon: 'biotech',       label: 'Test',     sub: 'String simulation'     },
  { id: 'visual',   icon: 'account_tree',  label: 'Diagram',  sub: 'State graph'           },
  { id: 'theory',   icon: 'menu_book',     label: 'Theory',   sub: 'Reference'             },
]

export default function Sidebar({ tab, setTab, auto, dfaRes, minRes }) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          Automata<span>Lab</span>
        </div>
        <div className="sidebar-sub">Finite State Machine · Playground</div>
      </div>

      {/* Status indicator */}
      <div className="sidebar-status-bar">
        <span className="sidebar-status-dot" />
        <span className="sidebar-status-text">
          {auto ? 'Active' : 'Idle'}
        </span>
      </div>

      {/* Section label */}
      <div className="sidebar-section-label">Modules</div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {MODULES.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`sidebar-nav-item${tab === id ? ' active' : ''}`}
            onClick={() => setTab(id)}
          >
            <span className="nav-icon material-symbols-outlined">{icon}</span>
            <span>{label}</span>
            {id === 'nfa2dfa'  && dfaRes && <span className="nav-badge">DONE</span>}
            {id === 'minimize' && minRes && <span className="nav-badge">DONE</span>}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Footer / Utility links */}
      <div className="sidebar-footer">
        <button className="sidebar-footer-item" onClick={() => {}}>
          <span className="material-symbols-outlined">help</span>
          <span>Documentation</span>
        </button>
        <button className="sidebar-footer-item" onClick={() => {}}>
          <span className="material-symbols-outlined">contact_support</span>
          <span>Support</span>
        </button>

        {/* Engine Status */}
        <div className="sidebar-footer-status">
          <span className="status-dot" />
          <span>
            {auto ? (auto.isNFA ? 'NFA' : 'DFA') : 'No automaton'}&nbsp;·&nbsp;
            {auto ? `${auto.states.length} states` : '—'}
          </span>
        </div>
      </div>
    </aside>
  )
}
