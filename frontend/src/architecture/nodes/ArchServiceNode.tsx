import { Handle, Position } from '@xyflow/react'
import { type Icon } from '@tabler/icons-react'
import { handleStyle } from '../../nodes/shared'

export interface ArchServiceNodeData {
  label: string
  subtitle: string
  icon: Icon
  accent: string
  module?: string
}

export function ArchServiceNode({ data }: { data: ArchServiceNodeData }) {
  const { label, subtitle, icon: Icon, accent, module } = data

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 6,
      minWidth: 168,
      padding: '10px 12px',
      background: 'var(--color-background-primary)',
      borderRadius: 'var(--radius-md)',
      border: '0.5px solid var(--color-border-secondary)',
      borderLeft: `2.5px solid ${accent}`,
      boxShadow: '0 1px 3px rgba(20,20,19,0.06)',
    }}>
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      {module && (
        <span className="font-mono" style={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontSize: 8,
          fontWeight: 500,
          color: 'var(--color-text-tertiary)',
          background: 'var(--color-background-secondary)',
          padding: '1px 5px',
          borderRadius: 999,
        }}>
          {module}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} stroke={1.7} color={accent} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{label}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>{subtitle}</div>
        </div>
      </div>
      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
