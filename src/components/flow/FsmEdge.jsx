import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react'
import { memo } from 'react'

export default memo(function FsmEdge(props) {
  const { 
    id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, 
    data, markerEnd, style 
  } = props
  
  // To avoid overlapping back-and-forth edges, React flow natively routes handles. 
  // We can just use the provided positions.
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition
  })

  // If self-loop, let's inject a custom arc path or rely on React flow 
  // (React flow recently handles self loops if Source and Target are different handles)
  // Our D3 layout and React flow bindings will handle self-loop offsets if we map different handles.

  const isActive = data?.isActive
  const isEps = data?.isEps
  const syms = data?.syms || []
  
  const baseCol = isEps ? '#ea580c' : '#8a8f9c'
  const col = isActive ? 'var(--mint)' : baseCol

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: col,
          strokeWidth: isActive ? 2.5 : 1.6,
          strokeDasharray: isEps ? '5,5' : 'none',
        }}
        className={isActive ? 'animated-edge' : ''}
      />
      
      {/* Animated particle flow */}
      {isActive && (
        <circle r="4" fill="var(--mint)" filter="drop-shadow(0 0 4px var(--mint-bright))">
          <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {/* Edge label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontFamily: "var(--mono)",
            fontSize: "10px",
            fontWeight: 600,
            color: '#5c6270',
            background: 'var(--surface-low)',
            padding: '2px 6px',
            borderRadius: '4px',
            pointerEvents: 'all',
            border: `1px solid ${isActive ? 'var(--mint-35)' : 'var(--ghost)'}`,
            zIndex: isActive ? 1000 : 1
          }}
          className="nodrag nopan"
        >
          {syms.join(',')}
        </div>
      </EdgeLabelRenderer>
    </>
  )
})
