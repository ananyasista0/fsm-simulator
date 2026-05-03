// ============================================================
// examples.js — Pre-built automaton examples
// ============================================================

export const EXAMPLES = {
  'nfa_ab': {
    label:  "NFA — ends with 'ab'",
    states: 'q0,q1,q2',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q2',
    trans:  'q0,a,q0\nq0,b,q0\nq0,a,q1\nq1,b,q2',
  },
  'nfa_eps': {
    label:  'NFA — ε-transitions',
    states: 'q0,q1,q2,q3',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q3',
    trans:  'q0,ε,q1\nq0,ε,q2\nq1,a,q3\nq2,b,q3\nq3,a,q3\nq3,b,q3',
  },
  'dfa_even': {
    label:  "DFA — even # of a's",
    states: 'q0,q1',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q0',
    trans:  'q0,a,q1\nq0,b,q0\nq1,a,q0\nq1,b,q1',
  },
  'nfa_a_or_b': {
    label:  'NFA — starts with a or b',
    states: 'q0,q1,q2,q3',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q1,q2',
    trans:  'q0,a,q1\nq0,b,q2\nq1,a,q1\nq1,b,q1\nq2,a,q2\nq2,b,q2',
  },
  'dfa_div3': {
    label:  'DFA — binary divisible by 3',
    states: 'q0,q1,q2',
    alpha:  '0,1',
    start:  'q0',
    accept: 'q0',
    trans:  'q0,0,q0\nq0,1,q1\nq1,0,q2\nq1,1,q0\nq2,0,q1\nq2,1,q2',
  },
  // ── 5 new examples ─────────────────────────────────────────
  'dfa_ends_b': {
    label:  "DFA — ends with 'b'",
    states: 'q0,q1',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q1',
    trans:  'q0,a,q0\nq0,b,q1\nq1,a,q0\nq1,b,q1',
  },
  'nfa_contains_aa': {
    label:  "NFA — contains 'aa'",
    states: 'q0,q1,q2',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q2',
    trans:  'q0,a,q0\nq0,b,q0\nq0,a,q1\nq1,a,q2\nq2,a,q2\nq2,b,q2',
  },
  'dfa_no_consec_a': {
    label:  "DFA — no consecutive a's",
    states: 'q0,q1,q2',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q0,q1',
    trans:  'q0,a,q1\nq0,b,q0\nq1,a,q2\nq1,b,q0\nq2,a,q2\nq2,b,q2',
  },
  'dfa_even_len': {
    label:  'DFA — even length strings',
    states: 'q0,q1',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q0',
    trans:  'q0,a,q1\nq0,b,q1\nq1,a,q0\nq1,b,q0',
  },
  'nfa_a_star_b_star': {
    label:  'NFA — a*b*',
    states: 'q0,q1',
    alpha:  'a,b',
    start:  'q0',
    accept: 'q0,q1',
    trans:  'q0,a,q0\nq0,b,q1\nq1,b,q1',
  },
}
