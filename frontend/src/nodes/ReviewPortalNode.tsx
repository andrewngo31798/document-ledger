import { useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { IconUserCheck, IconUser, IconCheck, IconX } from '@tabler/icons-react'
import { usePipelineStore } from '../store/pipeline.store'
import { usePipelineRunner } from '../hooks/usePipelineRunner'
import type { NodeStatus, InsightPackage } from '../types/pipeline'
import { Spinner, Pill, handleStyle } from './shared'

export function ReviewPortalNode({ data }: { data: { status: NodeStatus } }) {
  const { status } = data
  const [rationale, setRationale] = useState('')
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)
  const reviewDecision = usePipelineStore((s) => s.reviewDecision)
  const insight = stageOutputs['analysis-engine'] as InsightPackage | undefined
  const { handleApprove, handleReject } = usePipelineRunner()

  const isActive = status === 'idle' && reviewDecision === 'pending' && !!insight
  const isComplete = status === 'complete' || status === 'rejected'

  const accent = status === 'rejected' ? 'var(--accent-rejected)' : 'var(--accent-output)'

  return (
    <div style={{
      position: 'relative',
      background: 'var(--color-background-primary)',
      border: '0.5px dashed var(--color-border-secondary)',
      borderLeft: `2.5px solid ${accent}`,
      borderRadius: 'var(--radius-md)',
      padding: '9px 12px',
      minWidth: isActive ? 300 : 184,
      maxWidth: 340,
      transition: 'border-color 0.3s',
      boxShadow: '0 1px 3px rgba(20,20,19,0.06)',
    }}>
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconUserCheck size={14} stroke={1.7} color={accent} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Review Portal</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Human review & approval</div>
        </div>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
        <Pill color="var(--accent-output)" soft="var(--accent-output-soft)"><IconUser size={11} stroke={2} /> human step</Pill>
        {status === 'processing' && (
          <Pill color="var(--accent-processing)"><Spinner /> Processing</Pill>
        )}
        {isComplete && reviewDecision === 'approved' && (
          <Pill color="var(--accent-output)"><IconCheck size={11} stroke={2.5} /> Approved</Pill>
        )}
        {isComplete && reviewDecision === 'rejected' && (
          <Pill color="var(--accent-rejected)"><IconX size={11} stroke={2.5} /> Rejected</Pill>
        )}
      </div>

      {/* Interactive decision UI */}
      {isActive && (
        <div className="fade-in" style={{ marginTop: 10 }}>
          {insight && (
            <div className="prose" style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
              {insight.decision_summary.text}
            </div>
          )}
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Add reviewer rationale (optional)…"
            rows={2}
            className="nodrag"
            style={{
              width: '100%', background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-secondary)',
              borderRadius: 'var(--radius-md)', padding: '7px 9px', fontSize: 11,
              color: 'var(--color-text-primary)', fontFamily: 'Poppins, system-ui',
              resize: 'none', outline: 'none', marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleApprove(rationale || 'Approved via demo portal')}
              style={{
                flex: 1, background: 'var(--accent-output)', color: '#faf9f5', border: 'none',
                borderRadius: 'var(--radius-md)', padding: '7px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              Approve ✓
            </button>
            <button
              onClick={() => handleReject(rationale || 'Rejected via demo portal')}
              style={{
                flex: 1, background: 'transparent', color: 'var(--accent-rejected)',
                border: '1px solid var(--accent-rejected)',
                borderRadius: 'var(--radius-md)', padding: '7px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>
              Reject ✗
            </button>
          </div>
        </div>
      )}

      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="b" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
