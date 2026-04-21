// ── SimulationControls.jsx ───────────────────────────────────
// Play / Pause / Next / Reset controls for step simulation

import { useEffect, useRef } from 'react'

export default function SimulationControls({
  isPlaying, onPlay, onPause, onNext, onReset,
  speed, onSpeedChange, canStep, canReset
}) {
  const intervalRef = useRef(null)

  useEffect(() => {
    if (isPlaying && canStep) {
      intervalRef.current = setInterval(() => {
        onNext()
      }, speed)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, speed, canStep, onNext])

  useEffect(() => {
    if (!canStep && isPlaying) onPause()
  }, [canStep, isPlaying, onPause])

  return (
    <div className="sim-controls">
      <div className="sim-controls-title">Simulation Controls</div>

      {/* Main buttons */}
      <div className="sim-btn-row">
        <button
          className={`sim-btn${isPlaying ? ' playing' : ''}`}
          title={isPlaying ? 'Pause' : 'Play'}
          onClick={isPlaying ? onPause : onPlay}
          disabled={!canStep && !isPlaying}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="sim-btn"
          title="Next Step"
          onClick={onNext}
          disabled={!canStep}
        >
          ⏭
        </button>

        <button
          className="sim-btn"
          title="Reset"
          onClick={onReset}
          disabled={!canReset}
        >
          🔁
        </button>
      </div>

      {/* Speed slider */}
      <div className="sim-speed">
        <span>Speed</span>
        <input
          type="range"
          min={150}
          max={1200}
          step={50}
          value={1350 - speed}
          onChange={e => onSpeedChange(1350 - parseInt(e.target.value))}
        />
        <span>{speed < 400 ? 'Fast' : speed < 800 ? 'Med' : 'Slow'}</span>
      </div>
    </div>
  )
}
