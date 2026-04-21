import { Handle, Position } from '@xyflow/react'

export default function FsmNode({ data }) {
  const { label, isStart, isAccept, isDead, isActive, wasVisited } = data
  
  const baseCol = isDead ? 'var(--error)' : isAccept ? 'var(--success)' : isStart ? 'var(--info)' : '#8a8f9c'
  const col = isActive ? 'var(--mint)' : baseCol

  return (
    <div className={`fsm-node${isActive ? ' active' : ''}${wasVisited ? ' visited' : ''}${isStart ? ' start' : ''}${isAccept ? ' accept' : ''}`}>
      {/* Target handle anywhere on the top half conceptually. In circular nodes, React Flow auto routes to the closest border if we set handles. Let's just put standard top/bottom. */}
      <Handle type="target" position={Position.Top} id="top-t" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Top} id="top-s" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Bottom} id="bottom-t" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} id="bottom-s" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left-t" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} id="left-s" style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Right} id="right-t" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right-s" style={{ opacity: 0 }} />
      
      {/* Background glow for active/visited */}
      {(isActive || wasVisited) && (
        <div className="node-glow" style={{ background: col }} />
      )}

      {/* Pulse ring for active */}
      {isActive && (
        <div className="node-pulse" style={{ borderColor: col }} />
      )}

      {/* Main node surface */}
      <div className="node-surface" style={{ borderColor: col, borderWidth: isActive ? 2.5 : 1.5 }}>
        {label}
        {isAccept && (
          <div className="accept-ring" style={{ borderColor: col }} />
        )}
      </div>

      {isStart && (
        <div className="start-arrow" style={{
           borderBottom: `2px solid ${col}`,
           width: 32, height: 2, 
           position: 'absolute', top: '50%', left: -36, transform: 'translateY(-50%)'
        }}>
           <div style={{
              width: 0, height: 0, 
              borderTop: '5px solid transparent', 
              borderBottom: '5px solid transparent', 
              borderLeft: `10px solid ${col}`,
              position: 'absolute', right: -6, top: -4
           }} />
        </div>
      )}
    </div>
  )
}
