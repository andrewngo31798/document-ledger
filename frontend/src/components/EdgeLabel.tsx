import { EdgeLabelRenderer, BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react'

export interface LabeledEdgeData {
  eventName?: string
  /** active once the source node has completed */
  active?: boolean
}

export function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd,
}: EdgeProps & { data?: LabeledEdgeData }) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 8,
  })
  const active = data?.active ?? false
  const stroke = active ? 'var(--accent-processing)' : 'var(--color-border-secondary)'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth: 1, transition: 'stroke 0.3s' }}
      />

      {/* Animated SVG Edge — a pulse travels source→target while active */}
      {active && (
        <circle r={3} fill="var(--accent-processing)">
          <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {data?.eventName && (
        <EdgeLabelRenderer>
          <div
            className="font-mono"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 11}px)`,
              pointerEvents: 'none',
              fontSize: 8.5,
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-background-canvas)',
              padding: '0 4px',
              whiteSpace: 'nowrap',
              opacity: active ? 1 : 0.75,
              transition: 'opacity 0.3s',
            }}
          >
            {data.eventName}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
