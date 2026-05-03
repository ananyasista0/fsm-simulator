# FSM Simulator

FSM Simulator, branded in the UI as **AutomataLab**, is a browser-based finite automata playground. It lets users define deterministic and nondeterministic finite automata, validate the definition, inspect transition tables, convert NFAs to DFAs, minimize DFAs, test strings, batch-test many strings, and visualize state transitions interactively.

The project is a pure client-side React application. There is no backend, database, authentication layer, or external API required for the simulator logic.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [How the App Works](#how-the-app-works)
- [Automaton Input Format](#automaton-input-format)
- [Core Data Model](#core-data-model)
- [Major Algorithm Logic](#major-algorithm-logic)
- [UI Architecture](#ui-architecture)
- [Visualization System](#visualization-system)
- [Styling and Design System](#styling-and-design-system)
- [Prebuilt Examples](#prebuilt-examples)
- [Important Source Files](#important-source-files)
- [Build Output](#build-output)
- [Implementation Notes and Limitations](#implementation-notes-and-limitations)
- [Extending the Project](#extending-the-project)

## Features

- Build finite automata from form inputs.
- Define states, alphabet, start state, accept states, and transitions.
- Validate input and show the first validation error through toast messages.
- Detect whether the definition is a DFA or NFA.
- Support epsilon transitions through `eps` or the literal epsilon symbol in the UI.
- Show the automaton as a transition table.
- Show status chips for automaton type, number of states, alphabet size, accept-state count, and epsilon moves.
- Load prebuilt example automata.
- Convert NFA to DFA using subset construction.
- Show epsilon-closure results for every NFA state during conversion.
- Show a step-by-step conversion log.
- Add a dead/trap state when subset construction reaches an empty transition target.
- Minimize a DFA using partition refinement.
- Remove unreachable states before minimization.
- Display final equivalence classes and quotient-state names.
- Test a single string against the original automaton, converted DFA, or minimized DFA.
- Batch-test multiple strings.
- Show accept/reject verdicts with reasons.
- Display the computation path for a string.
- Animate simulation steps with play, pause, next, reset, and speed controls.
- Track consumed input characters in the right panel.
- Visualize states and transitions with React Flow.
- Highlight active states, visited states, accept states, start states, dead states, epsilon edges, and active edges.
- Provide a Theory section explaining DFA, NFA, epsilon closure, minimization, and algorithm complexity.

## Tech Stack

### Runtime and Framework

The project uses semver ranges in `package.json`; the currently installed versions are resolved through `package-lock.json`.

| Package | Declared range | Currently resolved | Purpose |
| --- | --- | --- | --- |
| `react` | `^18.2.0` | `18.3.1` | Main UI framework. |
| `react-dom` | `^18.2.0` | `18.3.1` | Browser rendering for React. |
| `vite` | `^5.1.4` | `5.4.21` | Development server and production bundler. |
| `@vitejs/plugin-react` | `^4.2.1` | `4.7.0` | Vite integration for React and JSX. |

### Visualization and UI Libraries

- **@xyflow/react**: declared as `^12.10.2`, currently resolved to `12.10.2`; used for interactive graph rendering.
- **Lenis**: declared as `^1.3.23`, currently resolved to `1.3.23`; used for smooth workspace scrolling.
- **Material Symbols Outlined**: Icon font loaded from Google Fonts in `index.html`.
- **Google Fonts**:
  - Inter for body text and labels.
  - Space Grotesk for display headings.
  - JetBrains Mono for code, state names, and automata notation.

### Other Dependencies

- **d3** is declared as `^7.9.0` and currently resolves to `7.9.0`, but the current source code does not directly import it. The current graph layout is implemented with simple trigonometric circular placement and React Flow.

### Language and Build Style

- JavaScript with JSX.
- ES modules through `"type": "module"` in `package.json`.
- Plain CSS with custom properties, no CSS framework.
- Client-side only architecture.

### Package Metadata

- Package name: `fsm-simulator`.
- Version: `1.0.0`.
- Private package: `true`.
- Lockfile: `package-lock.json` with lockfile version `3`.

## Getting Started

### Prerequisites

Install Node.js and npm. A current LTS version of Node.js is recommended.

### Install Dependencies

```bash
npm install
```

The repository currently includes `node_modules`, but a clean setup should still use `npm install` to recreate dependencies from `package-lock.json`.

### Run the Development Server

```bash
npm run dev
```

Vite will print a local URL, usually similar to:

```text
http://localhost:5173/
```

Open that URL in a browser.

### Create a Production Build

```bash
npm run build
```

The production build is written to `dist/`.

### Preview the Production Build

```bash
npm run preview
```

This serves the already-built `dist/` output locally.

## Available Scripts

The scripts are defined in `package.json`.

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Starts the Vite development server. |
| `build` | `vite build` | Builds optimized production assets into `dist/`. |
| `preview` | `vite preview` | Serves the production build locally. |

There are currently no lint, format, or automated test scripts.

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- package-lock.json
|-- vite.config.js
|-- README.md
|-- src
|   |-- main.jsx
|   |-- App.jsx
|   |-- index.css
|   |-- components
|   |   |-- AutomatonCanvas.jsx
|   |   |-- InputTracker.jsx
|   |   |-- LenisSetup.jsx
|   |   |-- Popup.jsx
|   |   |-- Sidebar.jsx
|   |   |-- SimulationControls.jsx
|   |   |-- shared.jsx
|   |   `-- flow
|   |       |-- AutomatonFlow.jsx
|   |       |-- FsmEdge.jsx
|   |       `-- FsmNode.jsx
|   `-- utils
|       |-- automata.js
|       |-- examples.js
|       `-- popupData.js
|-- dist
|   |-- index.html
|   `-- assets
|-- .dist
`-- node_modules
```

Important notes:

- `src/` contains the actual authored application source.
- `dist/` is generated build output.
- `.dist/` appears to be generated or auxiliary output.
- `node_modules/` is dependency installation output.
- The files to edit for application behavior are normally inside `src/`.

## How the App Works

The app is centered around `src/App.jsx`.

### App Boot

1. `src/main.jsx` imports React, React DOM, the root `App`, and `src/index.css`.
2. React mounts `<App />` into the `#root` element from `index.html`.
3. `App.jsx` initializes a default automaton in React state.
4. On first render, a `useEffect` calls `parseAuto(raw)`.
5. If the default automaton is valid, the parsed automaton is stored in `auto`.

### Main App State

`App.jsx` owns the main application state:

| State | Purpose |
| --- | --- |
| `tab` | Active workspace module: build, convert, minimize, test, diagram, or theory. |
| `popup` | Key for help/theory popup content. Currently present but not actively opened by the current UI. |
| `toasts` | Temporary notification messages. |
| `raw` | Raw form input for states, alphabet, start, accept states, and transitions. |
| `auto` | Parsed original automaton. |
| `dfaRes` | Result of NFA-to-DFA conversion. |
| `minRes` | Result of DFA minimization. |
| `nfaIdx` | Active step index in the conversion log. |
| `minIdx` | Active step index in the minimization log. |
| `testStr` | Single string being tested. |
| `testTarget` | Target automaton for testing: original, converted DFA, or minimized DFA. |
| `testResult` | Result object from DFA or NFA simulation. |
| `animIdx` | Current simulation animation step. |
| `batchInput` | Multi-line batch test input. |
| `batchResults` | Results of batch testing. |
| `isPlaying` | Whether simulation playback is running. |
| `simSpeed` | Delay between automatic simulation steps. |
| `diagTarget` | Target automaton shown in the right-side diagram. |

### Workspace Modules

The sidebar switches between six modules:

1. **Build**
   - Enter automaton definition.
   - Load prebuilt examples.
   - Validate and parse automaton.
   - Inspect transition table and status.

2. **Convert**
   - Runs subset construction.
   - Computes epsilon closures.
   - Shows conversion steps.
   - Shows resulting DFA table.

3. **Minimize**
   - Runs minimization on the converted DFA if available.
   - If no converted DFA exists, runs on the original automaton only if it is already deterministic.
   - Shows partition-refinement steps.
   - Shows final equivalence classes and minimized transition table.

4. **Test**
   - Runs a single string or batch of strings.
   - Supports original, converted DFA, and minimized DFA targets.
   - Displays verdict, reason, path, and per-string batch results.

5. **Diagram**
   - Shows a larger diagram for original, converted DFA, or minimized DFA.

6. **Theory**
   - Shows automata theory reference material and complexity summaries.

### Right Panel

The right panel is always visible on larger screens and contains:

- Live automaton diagram.
- Target selector when converted or minimized automata exist.
- Input tracker for the active simulation.
- Play, pause, next, reset, and speed controls.
- Legend for start, accept, dead, active, and epsilon transitions.

On screens below `900px`, the right panel is hidden by CSS.

## Automaton Input Format

The Build tab accepts four comma-separated fields and one transition textarea.

### States

```text
q0,q1,q2
```

States are split by comma, trimmed, and empty entries are ignored.

### Alphabet

```text
a,b
```

Alphabet symbols are also comma-separated. Each input character in string simulation must exist in the alphabet.

### Start State

```text
q0
```

The start state must be one of the states.

### Accept States

```text
q2
```

Accept states are comma-separated and every accept state must exist in the state set.

### Transitions

Each transition is one line:

```text
from,symbol,to
```

Example:

```text
q0,a,q0
q0,b,q0
q0,a,q1
q1,b,q2
```

Epsilon transitions can be entered as:

```text
q0,eps,q1
```

or with the literal epsilon symbol in the UI.

Transition parser details:

- Lines with fewer than three comma-separated fields are rejected.
- The first three fields are interpreted as `from`, `symbol`, and `to`.
- Source and target states must exist in the state list.
- Non-epsilon symbols must exist in the alphabet.
- Duplicate transitions are ignored instead of being added twice.

### DFA vs NFA Detection

After parsing, the app marks the automaton as an NFA if:

- Any state has an epsilon transition.
- Any `(state, symbol)` pair has more than one target state.

If neither condition is true, the app marks it as a DFA.

Important detail: the parser does not require every DFA transition to be present. A missing DFA transition is treated like a dead transition during simulation.

## Core Data Model

All major algorithms use the automaton object returned by `parseAuto`.

Conceptually, it looks like this:

```js
{
  states: ['q0', 'q1', 'q2'],
  alpha: ['a', 'b'],
  start: 'q0',
  accept: ['q2'],
  T: {
    q0: {
      a: ['q0', 'q1'],
      b: ['q0'],
      epsilon: []
    },
    q1: {
      a: [],
      b: ['q2'],
      epsilon: []
    },
    q2: {
      a: [],
      b: [],
      epsilon: []
    }
  },
  isNFA: true
}
```

In the actual source, the epsilon transition key is the literal epsilon character, not the word `epsilon`. User input of `eps` is normalized to that key.

Transition values are arrays even for DFAs. For deterministic transitions the array usually has zero or one target. For NFA transitions it may contain multiple targets.

## Major Algorithm Logic

All major automata algorithms are implemented in `src/utils/automata.js`. This file is pure JavaScript and has no React dependency, which makes the theory logic separate from the UI.

### `parseAuto(raw)`

Purpose: convert raw form values into a normalized automaton object.

Main steps:

1. Split and trim `states`, `alpha`, and `accept`.
2. Trim the `start` state.
3. Validate required fields.
4. Validate that the start state exists in `states`.
5. Validate that every accept state exists in `states`.
6. Initialize a transition table `T` for every state and alphabet symbol.
7. Add an epsilon-transition array for every state.
8. Parse every transition line as `from,symbol,to`.
9. Normalize `eps` to the internal epsilon key.
10. Validate source state, target state, and symbol.
11. Add each transition only once.
12. Detect NFA behavior.
13. Return either `{ error }` or the parsed automaton.

The parser returns only the first validation error to the UI.

### `epsCl(T, stateSet)`

Purpose: compute epsilon closure.

The epsilon closure of a state set is every state reachable by following only epsilon transitions, including the original states.

Implementation details:

- Uses a `Set` named `visited`.
- Uses a queue initialized with the input states.
- Repeatedly pops a state and follows its epsilon transitions.
- Adds unseen states to both `visited` and the queue.
- Returns a sorted array of reachable states.

This function is used by:

- NFA simulation.
- NFA-to-DFA subset construction.
- Epsilon-closure table in the Convert tab.

### `mvFn(T, stateSet, sym)`

Purpose: compute all direct symbol moves.

For every state in `stateSet`, it collects all targets reachable on `sym`. The result is returned as a sorted array.

This is the classic `move(S, a)` helper used in subset construction and NFA simulation.

### `subsetConstruct(auto)`

Purpose: convert an NFA to an equivalent DFA.

The implementation uses subset construction, also called powerset construction.

Main logic:

1. Compute `epsilon-closure({start})`.
2. Use that closure as the DFA start state.
3. Represent each DFA state as a comma-joined list of NFA states, for example `q0,q1`.
4. Maintain:
   - `sMap`: maps DFA state names to the NFA-state sets they represent.
   - `dfaStates`: list of discovered DFA state names.
   - `wl`: worklist of DFA states still needing expansion.
   - `dT`: raw deterministic transition table.
   - `steps`: UI log entries.
5. For each DFA state and each alphabet symbol:
   - Compute `move(currentSet, symbol)`.
   - Compute epsilon closure of that move result.
   - Use the closure as the next DFA state.
   - If the closure is new, add it to the worklist.
6. If a transition leads to an empty closure, add a dead/trap state.
7. The dead state transitions to itself for every alphabet symbol.
8. Mark a DFA state as accepting if its NFA-state subset intersects the original NFA accept set.
9. Build and return the final DFA automaton.

Return shape:

```js
{
  auto: convertedDfa,
  steps: conversionStepLog,
  epsInfo: epsilonClosureByOriginalState
}
```

Complexity:

- Worst-case state growth is `O(2^n)` for `n` NFA states.
- For each discovered subset, the algorithm processes every alphabet symbol.

### `minimizeDFA(dfa)`

Purpose: minimize a DFA by merging indistinguishable states.

The UI labels this as Hopcroft's algorithm. The implementation is a Hopcroft-style partition-refinement algorithm, but it is written as a straightforward repeated-splitting refinement instead of the fully optimized Hopcroft worklist variant.

Main logic:

1. Remove unreachable states:
   - `isReach(dfa, target)` performs BFS from the DFA start state.
   - Only reachable states are kept.
2. Create the initial partition:
   - One group for accepting states.
   - One group for non-accepting states.
   - Empty groups are discarded.
3. Repeatedly refine partitions:
   - For each group, compare states by where they transition on each symbol.
   - If two states in the same group transition to different partition groups, they are distinguishable.
   - Split distinguishable states into separate subgroups.
4. Stop when an iteration produces no more splits.
5. Build the minimized DFA:
   - Each final group becomes a state named `M0`, `M1`, `M2`, and so on.
   - The minimized start state is the group containing the original start state.
   - A minimized state is accepting if any state in that group was accepting.
   - Transitions are created using the first state in each group as the representative.

Return shape:

```js
{
  auto: minimizedDfa,
  steps: minimizationStepLog,
  partition: finalPartition
}
```

### `simDFA(auto, str)`

Purpose: simulate a string on a DFA.

Main logic:

1. Start at `auto.start`.
2. For each symbol in the input string:
   - Reject immediately if the symbol is not in the alphabet.
   - Follow the single transition from the current state.
   - If no transition exists or the target is the dead state, reject.
   - Add the state to the path.
3. After the string is consumed:
   - Accept if the current state is in `auto.accept`.
   - Reject otherwise.

Return shape:

```js
{
  accepted: true,
  path: [{ state: 'q0', sym: null }, { state: 'q1', sym: 'a' }],
  reason: 'Ended in accept state "q1"'
}
```

### `simNFA(auto, str)`

Purpose: simulate a string on an NFA by tracking all active possibilities.

Main logic:

1. Start with the epsilon closure of the start state.
2. For each input symbol:
   - Reject immediately if the symbol is not in the alphabet.
   - For every active set, compute `move(set, symbol)`.
   - Compute epsilon closure after each move.
   - Store the next active sets.
3. Accept if any active state in any active set is an accept state.

The returned path uses `sets` instead of a single `state`, because an NFA may be in multiple states at once.

### `drawDiagram(canvas, auto, testResult, animIdx)`

`drawDiagram` is a canvas-based renderer inside `src/utils/automata.js`. It:

- Sets up a HiDPI-aware canvas.
- Places states in a circle.
- Draws a dot-grid background.
- Groups transitions by source and target.
- Draws directed edges, self-loops, labels, and arrowheads.
- Uses dashed lines for epsilon transitions.
- Highlights active states during simulation.

In the current UI, React Flow is used instead of this function. Treat `drawDiagram` as an available/legacy canvas implementation.

## UI Architecture

### `src/main.jsx`

The browser entry point.

Responsibilities:

- Import React and React DOM.
- Import `App`.
- Import global CSS.
- Render the app inside `#root`.

### `src/App.jsx`

The central coordinator.

Responsibilities:

- Own all top-level state.
- Render the left sidebar, central workspace, right visualization panel, popup, and toast list.
- Define local UI atoms such as `Card`, `Btn`, `Field`, `TransTable`, `StepLog`, and `ToastList`.
- Wire user actions to automata algorithms:
  - `handleBuild`
  - `loadExample`
  - `handleConvert`
  - `handleMinimize`
  - `handleTest`
  - `handleBatch`
  - simulation playback handlers
- Choose which automaton should be displayed in the diagram.

### `src/components/Sidebar.jsx`

Renders the left navigation panel.

Modules:

- Build
- Convert
- Minimize
- Test
- Diagram
- Theory

It also shows:

- AutomataLab branding.
- Active/idle status.
- `DONE` badges for conversion and minimization.
- Current automaton type and state count in the footer.

The Documentation and Support footer buttons are currently placeholders.

### `src/components/SimulationControls.jsx`

Renders playback controls for simulation.

Responsibilities:

- Play/pause the computation path.
- Advance one step.
- Reset to the first step.
- Adjust speed with a slider.
- Use an interval while playback is active.
- Automatically pause when no further steps are available.

Speed behavior:

- The `speed` prop is a delay in milliseconds.
- The slider reverses the displayed value with `1350 - speed`, so moving toward "Fast" lowers the actual interval.

### `src/components/InputTracker.jsx`

Shows the input string and highlights consumed characters.

Responsibilities:

- Render the empty string as epsilon.
- Split non-empty input into character tiles.
- Mark visited and current characters.
- Show the active state or NFA active-state set.
- Show accept/reject/active step status.

### `src/components/Popup.jsx`

Generic popup renderer for theory/help content.

Responsibilities:

- Read content from `POPUP_DATA`.
- Render content sections by type:
  - paragraph
  - divider
  - heading
  - code
  - note
  - key-value list
  - step list
  - two-column comparison
  - color key
- Lock body scrolling while open.
- Close on Escape.
- Close when clicking the overlay.

Current note: `Popup` is mounted by `App.jsx`, and `popup` state exists, but the current visible UI does not call `setPopup(...)`. The popup system is available but not actively exposed by the current module UI.

### `src/components/LenisSetup.jsx`

Sets up smooth scrolling for the `.workspace` container.

Responsibilities:

- Query the `.workspace` element.
- Create a Lenis instance using the workspace as wrapper.
- Run Lenis through `requestAnimationFrame`.
- Destroy Lenis on component unmount.

### `src/components/shared.jsx`

Contains reusable UI helpers:

- `HelpBtn`
- `Card`
- `Empty`
- `Badge`
- `TransTable`
- `StepLog`
- `InfoChips`
- `AlgoBlock`
- `Btn`
- `Field`
- `Input`
- `Textarea`
- `Select`
- `TheoryBlock`
- Highlight components
- `ToastList`

Current note: `App.jsx` defines and uses its own local versions of many of these components. `shared.jsx` is not imported by the current source and appears to be an older or alternative shared-component module.

## Visualization System

The active visualization system lives in `src/components/flow/`.

### `AutomatonFlow.jsx`

Uses `@xyflow/react` to render the graph.

Main responsibilities:

- Convert automaton states into React Flow nodes.
- Convert automaton transitions into React Flow edges.
- Place states in a circular layout.
- Group multiple symbols on the same source-target pair into a single edge label.
- Derive active state, active NFA state set, visited states, and active edge pairs from `testResult` and `animIdx`.
- Pass visual flags into custom node and edge components.
- Enable React Flow controls and background.
- Hide React Flow attribution through `proOptions`.

Layout details:

- Orbit radius: `180`.
- Logical center: `(300, 250)`.
- Each node is offset by `25` pixels to center a roughly `50px` node.

### `FsmNode.jsx`

Custom React Flow node component.

Visual behavior:

- Circular state node.
- Hidden handles on top, bottom, left, and right for edge routing.
- Start state has an incoming arrow.
- Accept state has an inner accept ring.
- Dead state uses error coloring.
- Active state uses mint coloring and pulse effect.
- Visited state uses muted highlight styling.

### `FsmEdge.jsx`

Custom React Flow edge component.

Visual behavior:

- Uses `getBezierPath` from React Flow.
- Uses `BaseEdge` for the edge path.
- Uses `EdgeLabelRenderer` for transition labels.
- Dashed stroke for epsilon edges.
- Mint stroke for active edge.
- Animated particle along the active edge using SVG `animateMotion`.
- Arrow marker color changes based on active/epsilon/default state.

### `AutomatonCanvas.jsx`

This is a separate canvas-based visualizer.

It includes:

- HiDPI canvas scaling.
- RAF animation loop.
- Circular layout.
- Edge map construction.
- Self-loop rendering.
- Curved bidirectional edge rendering.
- Active-edge particles.
- Active-state pulse rings.
- Visited-state glow.

Current note: the current UI imports and uses `AutomatonFlow`, not `AutomatonCanvas`. This file is useful if the project later moves back to a custom canvas renderer.

## Styling and Design System

All global styling is in `src/index.css`.

### Theme

The stylesheet describes the theme as "Digital Alchemist" with an "Ice Latte & Mint" palette.

Main design tokens:

- Warm off-white backgrounds.
- Mint brand colors.
- Semantic success, error, warning, and info colors.
- Text colors that avoid pure black.
- Ghost borders and subtle shadows.
- Display, sans, and mono font variables.
- Radius variables from small to full-pill.
- Transition timing variables.
- Layout variables for sidebar and right panel widths.

### Layout

The app uses a three-column shell:

| Region | CSS class | Default width |
| --- | --- | --- |
| Left sidebar | `.sidebar` | `260px` |
| Center workspace | `.workspace` | Flexible |
| Right panel | `.right-panel` | `380px` |

Responsive behavior:

- Below `1100px`, sidebar becomes `220px` and right panel becomes `320px`.
- Below `900px`, the right panel is hidden and sidebar becomes `200px`.

### Major CSS Areas

- Reset and app shell.
- Material Symbols helper.
- Sidebar layout and navigation.
- Workspace header and content.
- Right panel and canvas area.
- Cards and glass-style panels.
- Buttons.
- Simulation controls.
- Input tracker.
- Legend.
- Form fields.
- Data tables.
- Badges.
- Toasts.
- Step logs.
- Algorithm blocks.
- Theory blocks.
- Popup overlay.
- Verdict banners.
- Computation path trace.
- Status chips.
- Scrollbars.
- Animations.
- Utility classes.
- React Flow custom node styles.

## Prebuilt Examples

Examples live in `src/utils/examples.js`.

| Key | Label | Language idea |
| --- | --- | --- |
| `nfa_ab` | `NFA - ends with 'ab'` | NFA that accepts strings ending in `ab`. |
| `nfa_eps` | `NFA - epsilon-transitions` | NFA using epsilon transitions from the start state. |
| `dfa_even` | `DFA - even # of a's` | DFA accepting strings with an even number of `a` symbols. |
| `nfa_a_or_b` | `NFA - starts with a or b` | NFA with branches for strings starting with `a` or `b`. |
| `dfa_div3` | `DFA - binary divisible by 3` | DFA accepting binary numbers divisible by 3. |

Each example has the same shape as the Build form:

```js
{
  label: 'Example label',
  states: 'q0,q1',
  alpha: 'a,b',
  start: 'q0',
  accept: 'q1',
  trans: 'q0,a,q1'
}
```

## Important Source Files

| File | Purpose |
| --- | --- |
| `index.html` | HTML shell, root element, metadata, Google Font links, Material Symbols link. |
| `vite.config.js` | Vite config with React plugin. |
| `package.json` | Project metadata, scripts, dependencies, devDependencies. |
| `src/main.jsx` | React entry point. |
| `src/App.jsx` | Main app state, module routing, handlers, central layout. |
| `src/index.css` | Global theme, layout, component styling, animations, responsive rules. |
| `src/utils/automata.js` | Pure automata algorithms and legacy canvas diagram helper. |
| `src/utils/examples.js` | Prebuilt automata examples. |
| `src/utils/popupData.js` | Structured help/theory popup content. |
| `src/components/Sidebar.jsx` | Left navigation and status panel. |
| `src/components/SimulationControls.jsx` | Playback controls for simulation steps. |
| `src/components/InputTracker.jsx` | Character-by-character input progress UI. |
| `src/components/Popup.jsx` | Modal renderer for structured popup content. |
| `src/components/LenisSetup.jsx` | Smooth scrolling setup. |
| `src/components/shared.jsx` | Shared/legacy UI helper components. |
| `src/components/AutomatonCanvas.jsx` | Canvas visualizer that is currently not wired into the UI. |
| `src/components/flow/AutomatonFlow.jsx` | Active React Flow graph visualizer. |
| `src/components/flow/FsmNode.jsx` | Custom state node rendering. |
| `src/components/flow/FsmEdge.jsx` | Custom transition edge rendering. |

## Build Output

`npm run build` creates `dist/`.

Current build output structure:

```text
dist
|-- index.html
`-- assets
    |-- index-*.js
    `-- index-*.css
```

The generated asset filenames include hashes. Do not manually edit generated files in `dist/`; edit `src/` and rebuild instead.

## Implementation Notes and Limitations

- The project is fully client-side.
- There is no persistence; reloading the page resets app state.
- There is no backend API.
- There is no automated test suite.
- There is no lint script.
- `d3` is installed but not used directly by current source.
- The Convert tab runs subset construction on any built automaton. This is mainly useful for NFAs, but it can also run on a DFA-shaped automaton and produce an equivalent DFA with subset-style state names.
- `src/components/shared.jsx` is currently unused by `App.jsx`.
- `src/components/AutomatonCanvas.jsx` and `drawDiagram` in `src/utils/automata.js` are currently not used by the rendered UI.
- `Popup.jsx` and `popupData.js` are available, but the current UI does not expose popup-opening buttons.
- Sidebar Documentation and Support buttons are placeholders.
- DFA definitions are not required to be total. Missing transitions are handled as dead transitions during simulation.
- The minimization code is partition-refinement based and labeled as Hopcroft-style, but it is not the fully optimized Hopcroft worklist implementation.
- `dist/`, `.dist/`, and `node_modules/` are generated or installed artifacts, not primary source code.

## Extending the Project

### Add a New Example

Edit `src/utils/examples.js` and add a new entry:

```js
export const EXAMPLES = {
  my_example: {
    label: 'DFA - my language',
    states: 'q0,q1',
    alpha: '0,1',
    start: 'q0',
    accept: 'q1',
    trans: 'q0,0,q1\nq0,1,q0\nq1,0,q1\nq1,1,q0',
  },
}
```

The Build tab automatically renders all entries from `EXAMPLES`.

### Add a New Algorithm

Recommended location:

```text
src/utils/automata.js
```

Suggested pattern:

1. Keep the algorithm pure and independent from React.
2. Accept an automaton object.
3. Return a new object instead of mutating app state directly.
4. Include a `steps` array if the algorithm should be shown in the UI.
5. Wire the algorithm into `App.jsx` with a handler and state variable.
6. Add a workspace tab or panel for the result.

### Add More Popup Documentation

1. Add a key to `POPUP_DATA` in `src/utils/popupData.js`.
2. Use supported section types such as `p`, `heading`, `steps`, `code`, `note`, `keyval`, `twoCol`, or `colorKey`.
3. Add a button in the UI that calls `setPopup('yourKey')`.

### Replace React Flow with Canvas

The repo already contains a canvas visualizer in `src/components/AutomatonCanvas.jsx` and a drawing helper in `src/utils/automata.js`.

To switch:

1. Import `AutomatonCanvas` in `App.jsx`.
2. Replace `AutomatonFlow` usages with `AutomatonCanvas`.
3. Verify active-state and active-edge animation behavior.
4. Remove `@xyflow/react` only after all React Flow imports are gone.

## Deployment

This app can be deployed as a static site.

General deployment flow:

```bash
npm install
npm run build
```

Then deploy the contents of `dist/` to any static host, such as Vercel, Netlify, GitHub Pages, Cloudflare Pages, or an ordinary static web server.

Because the simulator has no backend, the deployed site only needs to serve static HTML, CSS, and JavaScript.
