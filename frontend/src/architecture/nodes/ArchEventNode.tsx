import { Handle, Position } from '@xyflow/react'
import { handleStyle } from '../../nodes/shared'

export interface ArchEventNodeData {
  label: string
  subtitle?: string
}

export function ArchEventNode({ data }: { data: ArchEventNodeData }) {
  return (
    <div className="font-mono" style={{
      padding: '6px 10px',
      borderRadius: 999,
      background: 'var(--color-background-secondary)',
      border: '0.5px solid var(--color-border-secondary)',
      fontSize: 9,
      color: 'var(--color-text-secondary)',
      textAlign: 'center',
      maxWidth: 160,
      lineHeight: 1.4,
    }}>
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <div>{data.label}</div>
      {data.subtitle && (
        <div style={{ fontSize: 8, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{data.subtitle}</div>
      )}
      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
