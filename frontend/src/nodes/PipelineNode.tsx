import { Handle, Position } from '@xyflow/react'
import { StatusRing } from '../components/StatusRing'
import { SyntaxRow, CommentBubble, type NodeRow } from '../components/SyntaxRow'
import type { NodeStatus } from '../types/pipeline'

export interface PipelineNodeData {
  label: string
  subtitle?: string
  status: NodeStatus
  rows?: NodeRow[]
  isMockup?: boolean
}

const borderFor = (status: NodeStatus) =>
  status === 'complete' ? '#22c55e44' :
  status === 'processing' ? '#3b82f655' :
  status === 'error' || status === 'rejected' ? '#ef444444' :
  '#2a3343'

export function PipelineNode({ data }: { data: PipelineNodeData }) {
  const { label, subtitle, status, rows, isMockup } = data
  const showRows = status === 'complete' && rows && rows.length > 0

  return (
    <div style={{
      background: 'var(--color-node-bg)',
      border: `1px solid ${borderFor(status)}`,
      borderRadius: 12,
      minWidth: 300,
      overflow: 'hidden',
      transition: 'border-color 0.3s',
      boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#475569', border: 'none', width: 7, height: 7 }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: '#1c2333',
        borderBottom: showRows ? '1px solid #ffffff0f' : 'none',
      }}>
        <StatusRing status={status} size={9} />
        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{label}</span>
            {isMockup && (
              <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#1c1917', padding: '1px 5px', borderRadius: 3 }}>MOCKUP</span>
            )}
          </div>
          {subtitle && !showRows && (
            <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{subtitle}</span>
          )}
        </div>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          {status === 'processing'
            ? <span className="spin" style={{ width: 11, height: 11, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
            : <CommentBubble active={false} />}
        </span>
      </div>

      {/* Output rows (schema-style) */}
      {showRows && (
        <div className="fade-in">
          {rows!.map((r) => (
            <SyntaxRow key={r.field} row={r} />
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#475569', border: 'none', width: 7, height: 7 }} />
    </div>
  )
}
