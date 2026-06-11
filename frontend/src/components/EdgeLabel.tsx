import { EdgeLabelRenderer, BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/react'

export interface LabeledEdgeData {
  eventName?: string
  description?: string
  status?: 'idle' | 'active' | 'complete'
}

export function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY, data,
}: EdgeProps & { data?: LabeledEdgeData }) {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY })
  const status = data?.status ?? 'idle'

  const strokeColor =
    status === 'complete' ? '#22c55e' :
    status === 'active' ? '#3b82f6' :
    '#374151'

  const strokeDasharray = status === 'active' ? '6' : status === 'idle' ? '4 3' : 'none'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: strokeColor,
          strokeWidth: 1.5,
          strokeDasharray: strokeDasharray !== 'none' ? strokeDasharray : undefined,
          animation: status === 'active' ? 'dash 0.6s linear infinite' : undefined,
        }}
      />
      {(data?.eventName || data?.description) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              textAlign: 'center',
              opacity: status === 'idle' ? 0.4 : 1,
              transition: 'opacity 0.3s',
            }}
          >
            {data.eventName && (
              <div className="font-mono" style={{
                fontSize: 9, color: '#60a5fa',
                background: '#0f1117cc',
                padding: '1px 5px', borderRadius: 3,
                marginBottom: 2,
                display: 'inline-block',
              }}>
                {data.eventName}
              </div>
            )}
            {data.description && (
              <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {data.description}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
