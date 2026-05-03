# AutomataLab — Finite State Machine Playground

**AutomataLab** is a fully client-side, interactive finite automata simulator built for students, educators, and anyone working through automata theory. It lets you build finite automata from scratch, convert NFAs to DFAs, minimize DFAs, animate string simulations, and synthesize automata directly from regular expressions — all in the browser with no backend and no installation required.

---

## What it does

AutomataLab is organised as a six-module pipeline. Each module feeds into the next, so the output of one step is immediately available to the next without any manual copying.

### 1. Build

The starting point for every automaton. You have two ways to define one:

**Manual definition** — Fill in the five components of a formal automaton:
- **Q** — a comma-separated list of state names (e.g. `q0,q1,q2`)
- **Σ** — the input alphabet (e.g. `a,b`)
- **q₀** — the start state
- **F** — one or more accept states
- **δ** — the transition function, one rule per line in `from,symbol,to` format. Epsilon transitions are written as `ε` or `eps`.

The parser validates every field — unknown states, symbols outside the alphabet, missing start states — and reports the first error as a toast notification. It also auto-detects whether the definition is a DFA or an NFA.

**From Regular Expression** — Type any regular expression and an alphabet, then click **Build from Regex**. The system automatically runs the full three-step pipeline:

1. **Thompson's Construction** — converts the regex into an ε-NFA
2. **Subset Construction** — converts the ε-NFA into a DFA
3. **Hopcroft's Minimization** — minimizes the DFA to its canonical minimal form

All three results are populated instantly so every downstream module is ready to use the moment you click the button. The supported regex syntax is:

| Operator | Meaning |
|---|---|
| `a`, `b`, … | Literal alphabet symbol |
| `.` | Wildcard — matches any single alphabet symbol |
| `r*` | Kleene star — zero or more repetitions |
| `r+` | One or more repetitions |
| `r?` | Optional — zero or one occurrence |
| `r\|s` | Alternation — r or s |
| `rs` | Concatenation — r followed by s |
| `(r)` | Grouping / precedence |

**Predefined examples** — Ten example automata cover canonical textbook cases and can be loaded with a single click:

| Example | Description |
|---|---|
| NFA — ends with 'ab' | Accepts strings over {a,b} whose last two symbols are ab |
| NFA — ε-transitions | Demonstrates epsilon transitions explicitly |
| DFA — even # of a's | Strings with an even count of the symbol a |
| NFA — starts with a or b | Accepts any non-empty string |
| DFA — binary divisible by 3 | Binary number whose value is divisible by 3 |
| DFA — ends with 'b' | Strings whose final symbol is b |
| NFA — contains 'aa' | Strings containing the substring aa |
| DFA — no consecutive a's | Strings with no two adjacent a's |
| DFA — even length strings | Strings whose length is a multiple of 2 |
| NFA — a*b* | Any run of a's followed by any run of b's |

---

### 2. Convert

Runs **Subset Construction** (also called powerset construction) on any NFA.

- Each DFA state is a set of NFA states, displayed as a comma-joined label like `q0,q1`.
- ε-closures are computed for every NFA state and shown in a dedicated table.
- Every construction step is recorded in a scrollable step log that explains exactly what happened at each stage.
- If a transition leads to an empty target set, a dead/trap state `∅` is added automatically and self-loops on every symbol are filled in.
- The resulting DFA's full transition table is shown at the bottom.

The worst-case number of DFA states is `2^n` for an NFA with `n` states, though in practice most automata produce far fewer.

---

### 3. Minimize

Runs **Hopcroft's partition-refinement algorithm** on any available DFA (the converted DFA from the previous module, or the original automaton if it was already deterministic).

- Unreachable states are removed before minimization begins.
- The initial partition separates accepting and non-accepting states.
- The algorithm repeatedly splits groups whose member states are distinguishable — i.e. they transition to different partition groups on at least one symbol.
- Iteration stops when no partition can be further split.
- Final groups become the minimized states, named `M0`, `M1`, … Each group's representative state determines its outgoing transitions.
- The equivalence classes panel shows which original states were merged into each minimized state.
- The full minimization log lists every refinement step.
- The resulting minimized DFA's transition table is shown.

The algorithm runs in `O(|Q| log|Q| · |Σ|)`. The minimal DFA is unique up to state renaming.

---

### 4. Test

Simulates string acceptance on any of the three available automata: the original (NFA or DFA), the converted DFA, or the minimized DFA.

**Single-string test:**
- Enter any string. Use `ε` or leave blank for the empty string.
- The verdict is shown with a full reason: which state was reached, or why the string was rejected (dead state, symbol not in alphabet, etc.).
- The full computation path is displayed as a node trace.
- For DFAs the path shows individual states. For NFAs it shows the active state sets at each step.

**Step-by-step simulation:**
- After running a test, use the playback controls in the right panel to animate through the computation path one step at a time.
- Play, pause, step forward, reset, and adjust speed from slow to fast.
- The active state on the diagram is highlighted in real time as you step through.
- The input tracker below the diagram marks consumed characters, the current character, and remaining characters.

**Batch test:**
- Enter one string per line.
- Click Test All to get a table of accept/reject verdicts with path lengths for every string at once.

---

### 5. Diagram

A full-width interactive state-transition graph built with React Flow.

- States are laid out in a circle.
- Multiple transitions between the same pair of states are grouped into a single labelled edge.
- Self-loops are shown above or below the state node.
- Epsilon edges are dashed and coloured amber.
- During simulation, the active state is highlighted in mint and pulses. Active edges play a moving-particle animation.
- Visited states are subtly marked.
- A toggle at the top lets you switch the diagram between the original automaton, the converted DFA, and the minimized DFA.
- Pan, zoom, and fit-to-view controls are built in.

Color legend:

| Color | Meaning |
|---|---|
| Blue | Start state |
| Green | Accept state |
| Red | Dead/trap state (∅) |
| Mint / teal | Currently active state |
| Dashed amber | ε-transition |

---

### 6. Theory

A reference section covering the formal definitions and complexity of everything the tool implements:
- DFA and NFA formal definitions
- ε-closure definition and BFS algorithm
- Minimization — distinguishability, Hopcroft's algorithm, uniqueness of the minimal DFA
- Complexity table for all four operations

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| UI framework | **React 18** | Component model, hooks for simulation state and playback |
| Build tool | **Vite 5** | Sub-second HMR, ES module bundling |
| Graph rendering | **@xyflow/react 12** | Interactive, animated state-transition diagrams |
| Smooth scrolling | **Lenis** | Buttery smooth workspace scroll on long automata |
| Fonts | **Inter** (body) · **Space Grotesk** (headings) · **JetBrains Mono** (code/states) | Academic-grade typography |
| Styling | **Vanilla CSS** with custom properties | Full design-token control, no framework overhead |
| Language | **JavaScript (ESM) + JSX** | No TypeScript overhead for a focused academic tool |
| Automata algorithms | **Pure JS, no dependencies** | `automata.js` has zero imports — fully testable in isolation |

All automata logic — Thompson's construction, subset construction, Hopcroft's minimization, DFA simulation, NFA simulation — is implemented from scratch in plain JavaScript in a single file (`src/utils/automata.js`). There is no backend, no API, and no database. Everything runs in the browser.

---

## Algorithms Implemented

| Algorithm | Input | Output | Complexity |
|---|---|---|---|
| Thompson's Construction | Regular expression | ε-NFA | O(\|r\|) — linear in regex length |
| Subset Construction | NFA (with ε) | Equivalent DFA | O(2^\|Q\| · \|Σ\|) worst case |
| Hopcroft's Minimization | DFA | Minimal DFA | O(\|Q\| log\|Q\| · \|Σ\|) |
| DFA Simulation | DFA + string | Accept/Reject + path | O(\|w\|) |
| NFA Simulation | NFA + string | Accept/Reject + active sets | O(\|Q\| · \|w\|) |
| ε-closure | State set + transition table | Reachable states via ε | O(\|Q\| + \|δ\|) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
# → http://localhost:5173

# Build for production
npm run build

# Preview the production build
npm run preview
```

No environment variables, no API keys, no configuration needed.

---

## Design

The UI follows a theme called **"Digital Alchemist"** — a warm off-white ("Ice Latte") base palette with a deep teal mint accent. The three-panel layout keeps the navigation, workspace, and live diagram simultaneously visible so you never lose context as you move through the pipeline.

The design prioritises readability of automata theory content — monospace labels, high-contrast state nodes, and generous whitespace — without sacrificing a modern, polished aesthetic.
