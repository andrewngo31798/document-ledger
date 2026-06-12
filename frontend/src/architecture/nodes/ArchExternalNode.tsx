import { Handle, Position } from '@xyflow/react'
import { type Icon } from '@tabler/icons-react'
import { handleStyle } from '../../nodes/shared'

export interface ArchExternalNodeData {
  label: string
  subtitle: string
  icon: Icon
}

export function ArchExternalNode({ data }: { data: ArchExternalNodeData }) {
  const { label, subtitle, icon: Icon } = data

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 140,
      padding: '10px 12px',
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--radius-md)',
      border: '0.5px dashed var(--color-border-secondary)',
      opacity: 0.92,
    }}>
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} stroke={1.6} color="var(--color-text-secondary)" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{subtitle}</div>
        </div>
      </div>
      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
