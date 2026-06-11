import { usePipelineStore } from '../store/pipeline.store'
import type { PipelineStage } from '../types/pipeline'

const STAGE_LABELS: Record<PipelineStage, string> = {
  input: 'Input',
  'signal-intake': 'Signal Intake',
  'event-bus': 'Event Bus',
  'knowledge-processing': 'Knowledge Processing',
  classification: 'Classification',
  'analysis-engine': 'Analysis Engine',
  'review-portal': 'Review Portal',
  'decision-ledger': 'Decision Ledger',
  'consumer-api': 'Consumer API',
}

function Field({ label, value }: { label: string; value: unknown }) {
  const display = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
        {label}
      </div>
      <div className="font-mono" style={{ fontSize: 11, color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {display}
      </div>
    </div>
  )
}

export function DetailPanel({ selectedStage, onClose }: { selectedStage: PipelineStage | null; onClose: () => void }) {
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)
  if (!selectedStage || selectedStage === 'input') return null

  const output = stageOutputs[selectedStage as keyof typeof stageOutputs]
  if (!output) return null

  return (
    <div className="fade-in" style={{
      position: 'absolute', right: 0, top: 0, bottom: 0,
      width: 280,
      background: 'var(--color-panel)',
      borderLeft: '1px solid #1e293b',
      padding: '16px',
      overflowY: 'auto',
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>
          {STAGE_LABELS[selectedStage]}
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#6b7280',
          cursor: 'pointer', fontSize: 16, lineHeight: 1,
        }}>×</button>
      </div>

      {typeof output === 'object' && output !== null &&
        Object.entries(output as Record<string, unknown>).map(([key, val]) => (
          <Field key={key} label={key.replace(/_/g, ' ')} value={val} />
        ))
      }
    </div>
  )
}
