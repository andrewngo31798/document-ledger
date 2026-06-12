import { Handle, Position } from '@xyflow/react'
import { IconCircuitDiode } from '@tabler/icons-react'
import { usePipelineStore, type SubEngineStatus } from '../store/pipeline.store'
import type { NodeStatus } from '../types/pipeline'
import { ANALYSIS_WIDTH, Spinner, handleStyle } from './shared'

interface SubDef {
  key: keyof SubEngineStatus
  title: string
  desc: string
  dep?: string
}

const SUBS: SubDef[] = [
  { key: 'ledger-diff', title: 'Ledger Diff', desc: 'Diff vs ledger' },
  { key: 'impact', title: 'Impact', desc: 'Blast radius' },
  { key: 'recommendation', title: 'Recommendation', desc: 'Next steps', dep: 'After Diff + Impact' },
]

function SubNode({
  def,
  status,
  focused,
  onSelect,
}: {
  def: SubDef
  status: NodeStatus
  focused: boolean
  onSelect: () => void
}) {
  const processing = status === 'processing'
  const complete = status === 'complete'
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        minWidth: 0,
        border: focused
          ? '1px solid var(--accent-processing)'
          : `0.5px solid ${processing ? 'var(--accent-processing-border-strong)' : 'var(--color-border-tertiary)'}`,
        borderRadius: 'var(--radius-md)',
        background: focused || processing ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
        padding: '6px 8px',
        opacity: complete && !focused ? 0.65 : 1,
        transition: 'opacity 0.3s, background 0.3s, border-color 0.3s',
        boxShadow: focused ? '0 0 0 2px var(--accent-processing-border)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {processing && <Spinner />}
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-primary)' }}>{def.title}</span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', marginTop: 3, lineHeight: 1.3 }}>{def.desc}</div>
      {def.dep && (
        <div style={{ fontSize: 8.5, color: 'var(--color-text-tertiary)', marginTop: 3, lineHeight: 1.2 }}>{def.dep}</div>
      )}
    </button>
  )
}

export function AnalysisEngineNode() {
  const subEngineStatus = usePipelineStore((s) => s.subEngineStatus)
  const nodeStatus = usePipelineStore((s) => s.nodeStatus)['analysis-engine']
  const detailPanelFocus = usePipelineStore((s) => s.detailPanelFocus)
  const setDetailPanelFocus = usePipelineStore((s) => s.setDetailPanelFocus)
  const focusedSub =
    detailPanelFocus?.stage === 'analysis-engine' ? detailPanelFocus.subEngine : undefined
  const skipped = nodeStatus === 'skipped'

  return (
    <div style={{
      border: '0.5px solid var(--accent-processing-border)',
      borderLeft: '2.5px solid var(--accent-processing)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-background-secondary)',
      width: ANALYSIS_WIDTH,
      maxWidth: ANALYSIS_WIDTH,
      minWidth: ANALYSIS_WIDTH,
      boxSizing: 'border-box',
      opacity: skipped ? 0.35 : 1,
      boxShadow: '0 1px 3px rgba(20,20,19,0.06)',
    }}>
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
        <IconCircuitDiode size={14} stroke={1.7} color="var(--accent-processing)" />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Analysis</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>Diff · impact · recommend</div>
        </div>
      </div>

      <div style={{
        borderTop: '0.5px solid var(--color-border-tertiary)',
        padding: '8px 10px 10px',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
      }}>
        {SUBS.map((def) => (
          <SubNode
            key={def.key}
            def={def}
            status={subEngineStatus[def.key]}
            focused={focusedSub === def.key}
            onSelect={() => setDetailPanelFocus({ stage: 'analysis-engine', subEngine: def.key })}
          />
        ))}
      </div>

      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}
