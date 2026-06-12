import { Handle, Position } from '@xyflow/react'
import { type Icon } from '@tabler/icons-react'
import type { NodeStatus, PipelineStage } from '../types/pipeline'
import { NODE_HEIGHT, handleStyle, laneAccent, StateBadge, type Lane } from './shared'

export type { Lane }

export interface StandardNodeData {
  stage: PipelineStage
  label: string
  subtitle: string
  status: NodeStatus
  lane: Lane
  icon: Icon
}

export function StandardNode({ data }: { data: StandardNodeData }) {
  const { label, subtitle, status, lane, icon: Icon } = data
  const accent = status === 'rejected' ? 'var(--accent-rejected)' : laneAccent[lane]
  const isProcessing = status === 'processing'
  const isSkipped = status === 'skipped'

  return (
    <div style={{
      position: 'relative',
      opacity: isSkipped ? 0.35 : 1,
      // Fixed height so the node fills the lane consistently whether idle or running
      // (the status badge no longer grows the box past the swimlane border).
      height: NODE_HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      gap: 7,
      background: isProcessing ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
      borderRadius: 'var(--radius-md)',
      border: '0.5px solid var(--color-border-secondary)',
      borderLeft: `${isProcessing ? 3 : 2.5}px solid ${accent}`,
      padding: '0 12px',
      minWidth: 178,
      transition: 'background 0.3s, border-color 0.3s',
      boxShadow: '0 1px 3px rgba(20,20,19,0.06)',
    }}>
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={14} stroke={1.7} color={accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>{label}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>{subtitle}</div>
        </div>
      </div>

      {/* Reserved badge row keeps the node height stable between idle and running */}
      <div style={{ height: 20, display: 'flex', alignItems: 'center' }}>
        {status !== 'idle' && (
          <span className="fade-in"><StateBadge status={status} /></span>
        )}
      </div>

      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
