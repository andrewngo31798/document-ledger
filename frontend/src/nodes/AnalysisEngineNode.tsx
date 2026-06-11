import { Handle, Position } from '@xyflow/react'
import { StatusRing } from '../components/StatusRing'
import { usePipelineStore } from '../store/pipeline.store'
import type { NodeStatus } from '../types/pipeline'
import type { InsightPackage } from '../types/pipeline'

const classificationColors: Record<string, string> = {
  first_of_kind: '#a78bfa',
  extends: '#60a5fa',
  amends: '#f59e0b',
  supersedes: '#f97316',
  conflicts: '#ef4444',
  reaffirms: '#22c55e',
  duplicate: '#6b7280',
  no_ledger_match: '#94a3b8',
}

function SubEngineCard({ title, status, children }: { title: string; status: NodeStatus; children?: React.ReactNode }) {
  return (
    <div style={{
      background: '#0f1117',
      border: `1px solid ${status === 'complete' ? '#22c55e44' : status === 'processing' ? '#3b82f644' : '#1e293b'}`,
      borderRadius: 8,
      padding: '8px 10px',
      minWidth: 160,
      transition: 'border-color 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <StatusRing status={status} size={8} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
      </div>
      {status === 'complete' && children && (
        <div className="fade-in">{children}</div>
      )}
    </div>
  )
}

function DataRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 3, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 10, color: '#6b7280', flexShrink: 0 }}>{label}</span>
      <span className="font-mono" style={{ fontSize: 10, color: color ?? '#e2e8f0', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

export function AnalysisEngineNode({ data }: { data: { status: NodeStatus; outputBadge?: string; isMockup?: boolean } }) {
  const { status, outputBadge, isMockup } = data
  const subEngineStatus = usePipelineStore((s) => s.subEngineStatus)
  const analysisExpanded = usePipelineStore((s) => s.analysisExpanded)
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)
  const insight = stageOutputs['analysis-engine'] as InsightPackage | undefined

  if (!analysisExpanded && status !== 'processing' && status !== 'complete') {
    // Collapsed idle state
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Analysis Engine</span>
            <span style={{ fontSize: 10, color: '#f59e0b' }}>★</span>
            {isMockup && (
              <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#1c1917', padding: '1px 5px', borderRadius: 3 }}>MOCKUP</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Diff · Impact · Forecast · Recommendation</div>
        </div>
        <Handle type="source" position={Position.Bottom} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />
      </div>
    )
  }

  // Expanded sub-DAG view
  return (
    <div style={{
      background: 'var(--color-sub-bg)',
      border: `1px solid ${status === 'complete' ? '#22c55e55' : '#3b82f655'}`,
      borderRadius: 12,
      padding: '14px',
      minWidth: 460,
      transition: 'border-color 0.3s',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <StatusRing status={status} size={10} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>Analysis Engine</span>
        <span style={{ fontSize: 10, color: '#f59e0b' }}>★</span>
        {status === 'processing' && (
          <span style={{ fontSize: 11, color: '#3b82f6', marginLeft: 'auto' }}>Running sub-engines…</span>
        )}
        {status === 'complete' && outputBadge && (
          <span className="fade-in font-mono" style={{
            fontSize: 10, color: '#22c55e', background: '#22c55e14',
            borderRadius: 4, padding: '2px 6px', marginLeft: 'auto',
          }}>{outputBadge}</span>
        )}
      </div>

      {/* Phase 1 — parallel */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <SubEngineCard title="Ledger Diff" status={subEngineStatus['ledger-diff']}>
          {insight && <>
            <div style={{ marginTop: 4 }}>
              <span className="font-mono" style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 3,
                background: `${classificationColors[insight.ledger_diff.change_classification]}22`,
                color: classificationColors[insight.ledger_diff.change_classification],
              }}>
                {insight.ledger_diff.change_classification}
              </span>
            </div>
            <DataRow label="conf" value={`${Math.round(insight.ledger_diff.confidence * 100)}%`} color="#22c55e" />
            {insight.ledger_diff.field_changes.slice(0, 2).map((fc) => (
              <DataRow key={fc.field} label={fc.field} value={`→ ${fc.to}`} color="#60a5fa" />
            ))}
          </>}
        </SubEngineCard>
        <SubEngineCard title="Impact Engine" status={subEngineStatus['impact']}>
          {insight && <>
            <DataRow label="radius" value={`${Math.round(insight.impact_map.blast_radius_score * 100)}%`} color="#f59e0b" />
            {insight.impact_map.affected_systems.slice(0, 3).map((s) => (
              <DataRow key={s.name} label="→" value={s.name} />
            ))}
          </>}
        </SubEngineCard>
      </div>

      {/* Connector line */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <div style={{ width: 1, height: 16, background: subEngineStatus['forecast'] !== 'idle' ? '#3b82f6' : '#1e293b' }} />
      </div>

      {/* Phase 2 — Forecast */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <SubEngineCard title="Forecast Engine" status={subEngineStatus['forecast']}>
          {insight && <>
            <DataRow label="band" value={insight.forecast_report.confidence_band} color="#a78bfa" />
            {insight.forecast_report.predicted_outcomes.slice(0, 2).map((o, i) => (
              <DataRow key={i} label={o.probability} value={o.description.substring(0, 38) + '…'} />
            ))}
          </>}
        </SubEngineCard>
      </div>

      {/* Connector */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <div style={{ width: 1, height: 16, background: subEngineStatus['recommendation'] !== 'idle' ? '#3b82f6' : '#1e293b' }} />
      </div>

      {/* Phase 3 — Recommendation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <SubEngineCard title="Recommendation Engine" status={subEngineStatus['recommendation']}>
          {insight && insight.recommendations.map((r, i) => (
            <div key={i} style={{ marginTop: 4, display: 'flex', gap: 5, alignItems: 'flex-start' }}>
              <span className="font-mono" style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                background: '#1e293b', color: '#60a5fa',
              }}>{r.action_type}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{r.description.substring(0, 45)}…</span>
            </div>
          ))}
        </SubEngineCard>
      </div>

      {/* Aggregator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <div style={{ width: 1, height: 16, background: subEngineStatus['aggregator'] !== 'idle' ? '#22c55e' : '#1e293b' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: '#0f1117',
          border: `1px solid ${subEngineStatus['aggregator'] === 'complete' ? '#22c55e44' : '#1e293b'}`,
          borderRadius: 8, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <StatusRing status={subEngineStatus['aggregator']} size={7} />
          <span style={{ fontSize: 10, color: '#94a3b8' }}>Insight Aggregator</span>
          {subEngineStatus['aggregator'] === 'complete' && (
            <span className="font-mono fade-in" style={{ fontSize: 9, color: '#22c55e', marginLeft: 4 }}>insight.ready ↗</span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: '#374151', border: 'none', width: 6, height: 6 }} />
    </div>
  )
}
