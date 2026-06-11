import { Handle, Position } from '@xyflow/react'
import type { RunConfig } from '../types/pipeline'

export function InputNode({ data }: { data: { config: RunConfig } }) {
  const { config } = data
  const isConfluence = config.inputType === 'confluence'

  return (
    <div style={{
      background: 'var(--color-node-bg)',
      border: `1px solid ${isConfluence ? '#f59e0b44' : '#3b82f644'}`,
      borderRadius: 10,
      padding: '10px 14px',
      minWidth: 220,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11 }}>{isConfluence ? '📄' : '🎙️'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
              {isConfluence ? 'Confluence ADR' : 'Transcript'}
            </span>
            {isConfluence && (
              <span className="font-mono" style={{
                fontSize: 9, fontWeight: 700,
                background: '#f59e0b', color: '#1c1917',
                padding: '1px 5px', borderRadius: 3,
              }}>MOCKUP</span>
            )}
          </div>
          <div style={{
            fontSize: 11, color: '#94a3b8', marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {config.inputLabel}
          </div>
        </div>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />
    </div>
  )
}
