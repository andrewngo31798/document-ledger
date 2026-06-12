import { usePipelineStore, type SubEngineStatus } from '../store/pipeline.store'
import type { ChangePreview, ConsumerApiOutput, InsightPackage } from '../types/pipeline'
import { STAGE_CANONICAL, STAGE_LABEL } from '../data/module-labels'

const INSIGHT_SECTION_ORDER: (keyof InsightPackage)[] = [
  'decision_summary',
  'ledger_diff',
  'impact_map',
  'recommendations',
  'provenance',
  'quality',
  'insight_package_id',
  'classified_decision_id',
  'tenant_id',
  'analysis_profile',
  'knowledge_id',
  'decision_candidate_id',
]

const CHANGE_PREVIEW_SECTION_ORDER: (keyof ChangePreview)[] = [
  'change_summary',
  'seen_before_headline',
  'detected_shifts',
  'precedent_matches',
  'forward_signals',
  'provenance',
  'quality',
  'change_preview_id',
  'knowledge_id',
  'source_type',
]

const SUB_ENGINE_PANEL: Record<
  keyof SubEngineStatus,
  { title: string; subtitle: string; section?: keyof InsightPackage }
> = {
  'ledger-diff': { title: 'Ledger Diff', subtitle: 'Diff vs Decision Ledger', section: 'ledger_diff' },
  impact: { title: 'Impact', subtitle: 'Blast radius + affected systems', section: 'impact_map' },
  recommendation: { title: 'Recommendation', subtitle: 'Governance next-steps', section: 'recommendations' },
  aggregator: { title: 'Insight package', subtitle: 'Merged · schema-validated output' },
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

function ConsumerApiFields({ output }: { output: ConsumerApiOutput }) {
  return (
    <>
      <Field label="prompt" value={output.prompt} />
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          answer
        </div>
        <div className="prose" style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {output.answer}
        </div>
      </div>
    </>
  )
}

function InsightPackageFields({ insight }: { insight: InsightPackage }) {
  const entries = INSIGHT_SECTION_ORDER.filter((key) => insight[key] !== undefined).map((key) => [
    key,
    insight[key],
  ] as const)

  return (
    <>
      {entries.map(([key, val]) => (
        <Field key={key} label={key.replace(/_/g, ' ')} value={val} />
      ))}
    </>
  )
}

function ChangePreviewFields({ preview }: { preview: ChangePreview }) {
  const entries = CHANGE_PREVIEW_SECTION_ORDER.filter((key) => preview[key] !== undefined).map((key) => [
    key,
    preview[key],
  ] as const)

  return (
    <>
      {entries.map(([key, val]) => (
        <Field key={key} label={key.replace(/_/g, ' ')} value={val} />
      ))}
    </>
  )
}

function SubEngineInsightFields({
  insight,
  subEngine,
}: {
  insight: InsightPackage
  subEngine: keyof SubEngineStatus
}) {
  const panel = SUB_ENGINE_PANEL[subEngine]
  if (!panel.section) {
    return <InsightPackageFields insight={insight} />
  }

  const value = insight[panel.section]
  if (value === undefined) {
    return (
      <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
        Waiting for {panel.title} output…
      </p>
    )
  }

  return <Field label={panel.section.replace(/_/g, ' ')} value={value} />
}

export function DetailPanel({ onClose }: { onClose: () => void }) {
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)
  const detailPanelFocus = usePipelineStore((s) => s.detailPanelFocus)
  const subEngineStatus = usePipelineStore((s) => s.subEngineStatus)

  if (!detailPanelFocus || detailPanelFocus.stage === 'input') return null

  const { stage, subEngine } = detailPanelFocus
  const output = stageOutputs[stage as keyof typeof stageOutputs]
  if (!output) return null

  const canonical = STAGE_CANONICAL[stage]
  const isInsight = stage === 'analysis-engine'
  const isForecast = stage === 'forecast-engine'
  const isConsumerApi = stage === 'consumer-api'

  const subPanel = subEngine && isInsight ? SUB_ENGINE_PANEL[subEngine] : null

  const subRunning = subEngine && isInsight
    ? subEngineStatus[subEngine] === 'processing'
    : false

  const headerTitle = subPanel ? subPanel.title : STAGE_LABEL[stage]
  const headerSubtitle = subPanel
    ? `${STAGE_LABEL[stage]} · ${subPanel.subtitle}`
    : canonical

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
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>
            {headerTitle}
          </span>
          {headerSubtitle && (
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{headerSubtitle}</div>
          )}
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#6b7280',
          cursor: 'pointer', fontSize: 16, lineHeight: 1,
        }}>×</button>
      </div>

      {subRunning && subEngine && subPanel && (
        <div style={{
          fontSize: 11,
          color: 'var(--accent-processing)',
          marginBottom: 12,
          padding: '8px 10px',
          borderRadius: 6,
          background: 'rgba(106, 155, 204, 0.1)',
          border: '0.5px solid var(--accent-processing-border)',
        }}>
          Running {subPanel.title}…
        </div>
      )}

      {isInsight ? (
        subEngine ? (
          <SubEngineInsightFields insight={output as InsightPackage} subEngine={subEngine as keyof SubEngineStatus} />
        ) : (
          <InsightPackageFields insight={output as InsightPackage} />
        )
      ) : isForecast ? (
        <ChangePreviewFields preview={output as ChangePreview} />
      ) : isConsumerApi ? (
        <ConsumerApiFields output={output as ConsumerApiOutput} />
      ) : (
        typeof output === 'object' && output !== null &&
        Object.entries(output as Record<string, unknown>).map(([key, val]) => (
          <Field key={key} label={key.replace(/_/g, ' ')} value={val} />
        ))
      )}
    </div>
  )
}
