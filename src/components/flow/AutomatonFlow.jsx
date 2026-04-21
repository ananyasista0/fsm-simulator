import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MarkerType
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import FsmNode from './FsmNode'
import FsmEdge from './FsmEdge'

// Expose our custom types
const nodeTypes = { fsmNode: FsmNode }
const edgeTypes = { fsmEdge: FsmEdge }

/**
 * Calculates a circular layout for states.
 * Uses a basic trigonometric circle allocation.
 */
function layoutNodes(states) {
  const R = 180 // Orbit radius
  const cx = 300, cy = 250 // Center of graph logic
  const n = states.length
  const layout = {}
  states.forEach((s, i) => {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2
    layout[s] = {
      x: cx + R * Math.cos(angle) - 25, // -25 to center the ~50px node
      y: cy + R * Math.sin(angle) - 25
    }
  })
  return layout
}

export default function AutomatonFlow({ auto, testResult, animIdx }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Parse active stuff
  const { activeState, activeSet, visitedStates, activeEdgePairs } = useMemo(() => {
    let activeSt = null
    const aSet = new Set()
    const visited = new Set()
    const activePairs = new Set()

    if (testResult?.path && animIdx >= 0) {
      const step = testResult.path[animIdx]
      if (step?.state) activeSt = step.state
      if (step?.sets) {
        const matches = step.sets.match(/[^{}|,]+/g)
        if (matches) matches.forEach(m => aSet.add(m))
      }
      
      // Track visited
      testResult.path.slice(0, animIdx).forEach(st => {
        if (st.state) visited.add(st.state)
      })

      // Track active edge
      if (animIdx > 0) {
        const prev = testResult.path[animIdx - 1]
        const curr = testResult.path[animIdx]
        if (prev?.state && curr?.state) {
          activePairs.add(`${prev.state}->${curr.state}`)
        }
      }
    }
    return { activeState: activeSt, activeSet: aSet, visitedStates: visited, activeEdgePairs: activePairs }
  }, [testResult, animIdx])

  // Map Automaton definitions to React Flow nodes/edges
  useEffect(() => {
    if (!auto) {
      setNodes([])
      setEdges([])
      return
    }

    const pos = layoutNodes(auto.states)

    // Build Nodes
    const newNodes = auto.states.map(s => {
      const isStart = s === auto.start
      const isAccept = auto.accept.includes(s)
      const isDead = s === '∅'
      const isActive = activeState === s || activeSet.has(s)
      const wasVisited = visitedStates.has(s) && !isActive

      let sourcePos = 'bottom'
      let targetPos = 'top'

      return {
        id: s,
        type: 'fsmNode',
        position: pos[s],
        data: { label: s, isStart, isAccept, isDead, isActive, wasVisited },
        sourcePosition: sourcePos,
        targetPosition: targetPos
      }
    })

    // Build Edges
    const eMap = {}
    for (const from of auto.states) {
      for (const sym of [...auto.alpha, 'ε']) {
        for (const to of (auto.T[from]?.[sym] || [])) {
          const k = `${from}->${to}`
          if (!eMap[k]) eMap[k] = []
          eMap[k].push(sym)
        }
      }
    }

    const newEdges = []
    let eIdx = 0
    for (const [k, syms] of Object.entries(eMap)) {
      const [f, t] = k.split('->')
      const isEps = syms.includes('ε')
      const isActive = activeEdgePairs.has(k)

      newEdges.push({
        id: `e-${eIdx++}`,
        source: f,
        target: t,
        type: 'fsmEdge',
        data: { syms, isEps, isActive },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: isActive ? 'var(--mint)' : (isEps ? '#ea580c' : '#8a8f9c'),
        },
        animated: false // We use our custom edge animation, not react flow native dots
      })
    }

    setNodes(newNodes)
    setEdges(newEdges)
  }, [auto, activeState, activeSet, visitedStates, activeEdgePairs, setNodes, setEdges])

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#ccc" gap={16} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
