import { Handle, Position } from '@xyflow/react'
import { IconUserCheck } from '@tabler/icons-react'
import { handleStyle } from '../../nodes/shared'

export function ArchReviewNode() {
  return (
    <div style={{
      minWidth: 178,
      padding: '10px 12px',
      background: 'var(--color-background-primary)',
      borderRadius: 'var(--radius-md)',
      border: '0.5px dashed var(--accent-output)',
      borderLeft: '2.5px solid var(--accent-output)',
      boxShadow: '0 1px 3px rgba(20,20,19,0.06)',
    }}>
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconUserCheck size={14} stroke={1.7} color="var(--accent-output)" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Review Portal</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Human validation boundary</div>
        </div>
      </div>
      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
