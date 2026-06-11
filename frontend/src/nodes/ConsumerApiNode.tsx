import { Handle, Position } from '@xyflow/react'
import { StatusRing } from '../components/StatusRing'
import { CommentBubble } from '../components/SyntaxRow'
import { usePipelineStore } from '../store/pipeline.store'
import type { NodeStatus } from '../types/pipeline'

export function ConsumerApiNode({ data }: { data: { status: NodeStatus; isMockup?: boolean } }) {
  const { status, isMockup } = data
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)
  const result = stageOutputs['consumer-api'] as { query: string; answer: string } | undefined
  const showResult = status === 'complete' && !!result

  const border = status === 'complete' ? '#22c55e44' : status === 'processing' ? '#3b82f655' : '#2a3343'

  return (
    <div style={{
      background: 'var(--color-node-bg)',
      border: `1px solid ${border}`,
      borderRadius: 12,
      width: 360,
      overflow: 'hidden',
      boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
      transition: 'border-color 0.3s',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#475569', border: 'none', width: 7, height: 7 }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: '#1c2333',
        borderBottom: showResult ? '1px solid #ffffff0f' : 'none',
      }}>
        <StatusRing status={status} size={9} />
        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Consumer API</span>
            {isMockup && (
              <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#1c1917', padding: '1px 5px', borderRadius: 3 }}>MOCKUP</span>
            )}
          </div>
          {!showResult && (
            <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>RAG · search · agents · dashboards</span>
          )}
        </div>
        {status === 'processing'
          ? <span className="spin" style={{ width: 11, height: 11, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%' }} />
          : <CommentBubble active={false} />}
      </div>

      {/* RAG query + grounded answer (inline, in-flow) */}
      {showResult && (
        <div className="fade-in" style={{ padding: '12px 14px' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
            RAG Query
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: '#60a5fa', marginBottom: 8 }}>
            "{result!.query}"
          </div>
          <div style={{
            fontSize: 11, color: '#e2e8f0', lineHeight: 1.6,
            background: '#0f1117', borderRadius: 6, padding: '8px 10px',
            borderLeft: '2px solid #22c55e',
          }}>
            {result!.answer}
          </div>
          <div style={{ fontSize: 9, color: '#22c55e', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>●</span> grounded in ledger — verified record
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: '#475569', border: 'none', width: 7, height: 7 }} />
    </div>
  )
}
