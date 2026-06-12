import { Handle, Position } from '@xyflow/react'
import { handleStyle } from '../../nodes/shared'

export interface ArchStepNodeData {
  label: string
  subtitle: string
  step?: number
}

export function ArchStepNode({ data }: { data: ArchStepNodeData }) {
  return (
    <div style={{
      minWidth: 118,
      maxWidth: 140,
      padding: '7px 8px',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-secondary)',
      borderTop: '2px solid var(--accent-processing)',
    }}>
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      {data.step !== undefined && (
        <span className="font-mono" style={{
          fontSize: 8,
          fontWeight: 600,
          color: 'var(--accent-processing)',
          display: 'block',
          marginBottom: 3,
        }}>
          Stage {data.step}
        </span>
      )}
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>
        {data.label}
      </div>
      <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', marginTop: 3, lineHeight: 1.35 }}>
        {data.subtitle}
      </div>
      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
