// ============================================================
// popupData.js — Content for all help/theory popups
// ============================================================

export const POPUP_DATA = {
  automaton: {
    tag: 'Theory · Fundamentals',
    title: 'What is a Finite Automaton?',
    sections: [
      { type: 'p', text: 'A finite automaton reads an input string one symbol at a time, transitions between states, and decides: accept or reject. Think of it as a directed graph — nodes are states, edges are transitions.' },
      { type: 'divider' },
      { type: 'heading', text: 'The 5-tuple  (Q, Σ, δ, q₀, F)' },
      { type: 'keyval', items: [
        ['Q',    'Finite set of all states'],
        ['Σ',    'The alphabet — symbols the machine reads'],
        ['δ',    'Transition function — (state, symbol) → next state(s)'],
        ['q₀',   'The unique start state'],
        ['F ⊆ Q','Accept states — landing here means accepted'],
      ]},
      { type: 'divider' },
      { type: 'heading', text: 'DFA vs NFA' },
      { type: 'twoCol',
        left:  { label: 'DFA', text: 'Each (state, symbol) pair leads to exactly one next state. Fully deterministic — no guessing.' },
        right: { label: 'NFA', text: 'A symbol can lead to multiple states or none. ε-transitions move without reading input. Same expressive power as DFA.' },
      },
    ],
  },

  transitions: {
    tag: 'How-to · Input',
    title: 'Defining Transitions',
    sections: [
      { type: 'p', text: 'Each transition is one line: from,symbol,to — the state you leave, the symbol consumed, and where you arrive.' },
      { type: 'steps', items: [
        ['States',       'Comma-separated names. Example: q0,q1,q2'],
        ['Alphabet',     'Symbols your machine reads. Example: a,b or 0,1'],
        ['Start state',  'Exactly one state. Example: q0'],
        ['Accept states','One or more states. Example: q2 or q1,q3'],
        ['Transitions',  'One per line: from,symbol,to\nUse ε or eps for epsilon.\nMultiple lines with same from + symbol → NFA.'],
      ]},
    ],
  },

  epsClosure: {
    tag: 'Theory · ε-Closure',
    title: 'What is ε-closure?',
    sections: [
      { type: 'p', text: 'The ε-closure of state q is all states reachable from q using only ε-transitions — without consuming input. Always includes q itself.' },
      { type: 'code', text: 'ε-closure(q) = {q} ∪ {p | q →ε*→ p}\nε-closure(S) = ⋃ ε-closure(q)  for q ∈ S' },
      { type: 'divider' },
      { type: 'heading', text: 'BFS Algorithm' },
      { type: 'steps', items: [
        ['Start',  'Add all initial states to the worklist and closure set'],
        ['Expand', 'Pop a state. Follow every ε-arrow. Add new targets to worklist + closure'],
        ['Repeat', 'Until the worklist is empty — closure set is your result'],
      ]},
      { type: 'note', text: 'Applied at start (to q₀) and after every move() during simulation and subset construction.' },
    ],
  },

  subset: {
    tag: 'Theory · NFA → DFA',
    title: 'Subset Construction',
    sections: [
      { type: 'p', text: 'Every DFA state represents a set of NFA states active simultaneously. Instead of guessing which path, track all paths at once.' },
      { type: 'divider' },
      { type: 'steps', items: [
        ['Start',  'DFA start state = ε-closure({q₀})'],
        ['Expand', 'For each DFA state S and symbol a, compute T = ε-closure(move(S, a))'],
        ['Record', 'Set δ(S, a) = T. If T is new, add to the worklist'],
        ['Accept', 'Any DFA state containing an NFA accept state becomes a DFA accept state'],
        ['Done',   'Repeat until no new DFA states appear'],
      ]},
      { type: 'note', text: 'Worst case: 2ⁿ DFA states for n NFA states. In practice far fewer are reachable. A dead state ∅ is added when move returns ∅.' },
    ],
  },

  minimize: {
    tag: 'Theory · Minimization',
    title: "Hopcroft's Algorithm",
    sections: [
      { type: 'p', text: 'Two states are distinguishable if some string causes one to accept and the other to reject. Indistinguishable states can be merged.' },
      { type: 'divider' },
      { type: 'steps', items: [
        ['Remove',    'Delete unreachable states via BFS from start'],
        ['Partition', 'Split into {accept states} and {non-accept states}'],
        ['Refine',    'If two states in a group go to different groups on any symbol — split the group'],
        ['Repeat',    'Until no more splits are possible'],
        ['Build',     'Each final group becomes one state in the minimal DFA'],
      ]},
      { type: 'note', text: 'The minimal DFA is unique up to state renaming. Runtime: O(|Q| log|Q| · |Σ|).' },
    ],
  },

  testing: {
    tag: 'How-to · Simulation',
    title: 'Testing a String',
    sections: [
      { type: 'heading', text: 'DFA Simulation' },
      { type: 'steps', items: [
        ['Start',  'Current state = q₀'],
        ['Read',   'For each symbol, follow the unique transition'],
        ['Dead',   'No transition → dead state ∅ → reject'],
        ['Decide', 'Accept iff final state ∈ F'],
      ]},
      { type: 'divider' },
      { type: 'heading', text: 'NFA Simulation' },
      { type: 'p', text: 'Maintain a set of active states. Each step: active = ε-closure(move(active, symbol)). Accept if any active state ∈ F.' },
      { type: 'note', text: 'Use ε or eps for the empty string. "Animate" steps through the computation one symbol at a time.' },
    ],
  },

  diagram: {
    tag: 'Guide · Diagram',
    title: 'Reading the State Diagram',
    sections: [
      { type: 'keyval', items: [
        ['Circle',       'Each circle is a state'],
        ['→ Arrow',      'Incoming arrow with no source = start state'],
        ['Double ring',  'Accept state'],
        ['Labeled edge', 'Transition on that symbol'],
        ['Dashed arrow', 'ε-transition — no input consumed'],
        ['Self-loop',    'Transition back to the same state'],
      ]},
      { type: 'divider' },
      { type: 'heading', text: 'Colour Key' },
      { type: 'colorKey', items: [
        { color: '#4d9ef7', label: 'Blue — start state' },
        { color: '#36d68a', label: 'Green double ring — accept state' },
        { color: '#e05c72', label: 'Red — dead / trap state (∅)' },
        { color: '#f59e0b', label: 'Amber dashed — ε-transition' },
      ]},
    ],
  },
}
