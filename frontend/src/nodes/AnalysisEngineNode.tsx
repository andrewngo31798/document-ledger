import { Handle, Position } from '@xyflow/react'
import { IconCircuitDiode } from '@tabler/icons-react'
import { usePipelineStore, type SubEngineStatus } from '../store/pipeline.store'
import type { NodeStatus } from '../types/pipeline'
import { Spinner, handleStyle } from './shared'

interface SubDef {
  key: keyof SubEngineStatus
  title: string
  desc: string
  dep?: string
}

const SUBS: SubDef[] = [
  { key: 'ledger-diff', title: 'Ledger Diff', desc: 'Diff vs Decision Ledger' },
  { key: 'impact', title: 'Impact', desc: 'Blast radius + systems' },
  { key: 'recommendation', title: 'Recommendation', desc: 'Governance next-steps', dep: '← after Ledger Diff + Impact' },
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
        border: focused
          ? '1px solid var(--accent-processing)'
          : `0.5px solid ${processing ? 'var(--accent-processing-border-strong)' : 'var(--color-border-tertiary)'}`,
        borderRadius: 'var(--radius-md)',
        background: focused || processing ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
        padding: '7px 9px',
        opacity: complete && !focused ? 0.65 : 1,
        transition: 'opacity 0.3s, background 0.3s, border-color 0.3s',
        boxShadow: focused ? '0 0 0 2px var(--accent-processing-border)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {processing && <Spinner />}
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)' }}>{def.title}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{def.desc}</div>
      {def.dep && (
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{def.dep}</div>
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
      borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
      background: 'var(--color-background-secondary)',
      minWidth: 244,
      opacity: skipped ? 0.35 : 1,
      boxShadow: '0 1px 3px rgba(20,20,19,0.06)',
    }}>
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
        <IconCircuitDiode size={15} stroke={1.7} color="var(--accent-processing)" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Analysis</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Ledger diff · impact · recommend</div>
        </div>
      </div>

      <div style={{
        borderTop: '0.5px solid var(--color-border-tertiary)',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
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
