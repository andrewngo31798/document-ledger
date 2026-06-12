import { EdgeLabelRenderer, BaseEdge, getSmoothStepPath, type EdgeProps, Position } from '@xyflow/react'

export interface LabeledEdgeData {
  eventName?: string
  active?: boolean
  centerY?: number
  centerX?: number
  labelOffsetY?: number
  labelOffsetX?: number
  /** Pin label to explicit canvas coords (avoids ambiguous junction placement) */
  labelAt?: { x: number; y: number }
  /** Horizontal runway, then drop into target column */
  routeY?: number
}

function buildRunwayPath(
  sourceX: number, sourceY: number, targetX: number, targetY: number,
  sourcePosition: Position, targetPosition: Position, routeY: number,
): string {
  const pad = 14
  const sx = sourcePosition === Position.Right ? sourceX + pad : sourceX
  const tx = targetX
  const ty = targetPosition === Position.Top ? targetY : targetY
  return `M ${sourceX},${sourceY} L ${sx},${sourceY} L ${sx},${routeY} L ${tx},${routeY} L ${tx},${ty}`
}

export function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, markerEnd, style,
}: EdgeProps & { data?: LabeledEdgeData }) {
  const routeY = data?.routeY

  let edgePath: string
  let defaultLabelX: number
  let defaultLabelY: number

  if (routeY != null) {
    edgePath = buildRunwayPath(sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, routeY)
    defaultLabelX = (sourceX + targetX) / 2
    defaultLabelY = routeY
  } else {
    ;[edgePath, defaultLabelX, defaultLabelY] = getSmoothStepPath({
      sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 8,
      centerY: data?.centerY,
      centerX: data?.centerX,
    })
  }

  const labelX = data?.labelAt?.x ?? defaultLabelX + (data?.labelOffsetX ?? 0)
  const labelY = data?.labelAt?.y ?? defaultLabelY + (data?.labelOffsetY ?? 0)
  const active = data?.active ?? false
  const stroke = active ? 'var(--accent-processing)' : 'var(--color-border-secondary)'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, stroke, strokeWidth: 1.5, transition: 'stroke 0.3s' }}
      />

      {active && (
        <circle r={3.5} fill="var(--accent-processing)" style={{ pointerEvents: 'none' }}>
          <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}

      {data?.eventName && (
        <EdgeLabelRenderer>
          <div
            className="font-mono"
            style={{
              position: 'absolute',
              zIndex: 1000,
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              fontSize: 9.5,
              fontWeight: 500,
              color: active ? 'var(--accent-processing)' : 'var(--color-text-secondary)',
              background: 'var(--color-background-primary)',
              border: `0.5px solid ${active ? 'var(--accent-processing-border)' : 'var(--color-border-secondary)'}`,
              borderRadius: 4,
              padding: '2px 6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 4px rgba(20,20,19,0.12)',
            }}
          >
            {data.eventName}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
