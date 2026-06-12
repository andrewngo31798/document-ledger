import { Handle, Position } from '@xyflow/react'
import { IconDatabase } from '@tabler/icons-react'
import { handleStyle } from '../../nodes/shared'

export interface ArchStoreNodeData {
  label: string
  subtitle: string
}

export function ArchStoreNode({ data }: { data: ArchStoreNodeData }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 130,
      padding: '9px 12px',
      background: 'var(--color-background-primary)',
      borderRadius: 'var(--radius-md)',
      border: '0.5px solid var(--color-border-secondary)',
      borderBottom: '3px solid var(--accent-intake)',
    }}>
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <IconDatabase size={14} stroke={1.6} color="var(--accent-intake)" />
      <div>
        <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)' }}>{data.label}</div>
        <div style={{ fontSize: 9, color: 'var(--color-text-secondary)' }}>{data.subtitle}</div>
      </div>
      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
