import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { StatusRing } from '../components/StatusRing'
import { usePipelineStore } from '../store/pipeline.store'
import { usePipelineRunner } from '../hooks/usePipelineRunner'
import type { NodeStatus, InsightPackage } from '../types/pipeline'

export function ReviewPortalNode({ data }: { data: { status: NodeStatus; isMockup?: boolean } }) {
  const { status, isMockup } = data
  const [rationale, setRationale] = useState('')
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)
  const reviewDecision = usePipelineStore((s) => s.reviewDecision)
  const insight = stageOutputs['analysis-engine'] as InsightPackage | undefined
  const { handleApprove, handleReject } = usePipelineRunner()

  const isActive = status === 'idle' && reviewDecision === 'pending' && !!insight
  const isComplete = status === 'complete' || status === 'rejected'

  if (!isActive && !isComplete) {
    return (
      <div style={{
        background: 'var(--color-node-bg)',
        border: '1px solid #1e293b',
        borderRadius: 10,
        padding: '10px 14px',
        minWidth: 220,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Handle type="target" position={Position.Top} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />
        <StatusRing status={status} size={10} />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Review Portal</span>
            {isMockup && <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#1c1917', padding: '1px 5px', borderRadius: 3 }}>MOCKUP</span>}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Human approval required</div>
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--color-sub-bg)',
      border: `1px solid ${status === 'complete' ? '#22c55e55' : status === 'rejected' ? '#ef444455' : '#3b82f655'}`,
      borderRadius: 12,
      padding: '14px',
      minWidth: 320,
      maxWidth: 380,
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <StatusRing status={status === 'idle' ? 'processing' : status} size={10} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Review Portal</span>
        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>Trust boundary</span>
      </div>

      {insight && (
        <div style={{ marginBottom: 12, fontSize: 12, color: '#e2e8f0', lineHeight: 1.5 }}>
          {insight.decision_summary}
        </div>
      )}

      {insight && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <Chip label={`Domain: ${insight.domain}`} color="#60a5fa" />
          <Chip label={`Blast radius: ${Math.round(insight.impact_map.blast_radius_score * 100)}%`} color="#f59e0b" />
          <Chip label={`Forecast: ${insight.forecast_report.confidence_band} confidence`} color="#a78bfa" />
        </div>
      )}

      {isActive && (
        <>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Add reviewer rationale (optional)…"
            rows={2}
            style={{
              width: '100%', background: '#0f1117', border: '1px solid #1e293b',
              borderRadius: 6, padding: '8px 10px', fontSize: 11,
              color: '#e2e8f0', fontFamily: 'Inter, system-ui', resize: 'none', outline: 'none',
              marginBottom: 10,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleApprove(rationale || 'Approved via demo portal')}
              style={{
                flex: 1, background: '#22c55e', color: '#fff', border: 'none',
                borderRadius: 7, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              Approve ✓
            </button>
            <button
              onClick={() => handleReject(rationale || 'Rejected via demo portal')}
              style={{
                flex: 1, background: 'transparent', color: '#ef4444',
                border: '1px solid #ef444466',
                borderRadius: 7, padding: '8px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              Reject ✗
            </button>
          </div>
        </>
      )}

      {isComplete && (
        <div className="fade-in" style={{ fontSize: 12, marginTop: 4 }}>
          {reviewDecision === 'approved'
            ? <span style={{ color: '#22c55e' }}>✓ Approved — writing to ledger</span>
            : <span style={{ color: '#ef4444' }}>✗ Rejected — pipeline halted</span>
          }
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />
    </div>
  )
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="font-mono" style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 4,
      background: `${color}18`, color,
    }}>{label}</span>
  )
}
