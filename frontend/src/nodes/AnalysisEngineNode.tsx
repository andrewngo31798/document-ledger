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
  { key: 'ledger-diff', title: 'Ledger Diff', desc: 'Diff vs approved ledger' },
  { key: 'impact', title: 'Impact Engine', desc: 'Blast radius + systems' },
  { key: 'forecast', title: 'Forecast', desc: 'Outcome prediction', dep: '← after Impact' },
  { key: 'recommendation', title: 'Recommendation', desc: 'Governance next-steps', dep: '← after Forecast' },
]

function SubNode({ def, status }: { def: SubDef; status: NodeStatus }) {
  const processing = status === 'processing'
  const complete = status === 'complete'
  return (
    <div style={{
      border: `0.5px solid ${processing ? 'var(--accent-processing-border-strong)' : 'var(--color-border-tertiary)'}`,
      borderRadius: 'var(--radius-md)',
      background: processing ? 'var(--color-background-secondary)' : 'var(--color-background-primary)',
      padding: '7px 9px',
      opacity: complete ? 0.65 : 1,
      transition: 'opacity 0.3s, background 0.3s, border-color 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {processing && <Spinner />}
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)' }}>{def.title}</span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 2 }}>{def.desc}</div>
      {def.dep && (
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{def.dep}</div>
      )}
    </div>
  )
}

export function AnalysisEngineNode() {
  const subEngineStatus = usePipelineStore((s) => s.subEngineStatus)

  return (
    <div style={{
      border: '0.5px solid var(--accent-processing-border)',
      borderLeft: '2.5px solid var(--accent-processing)',
      borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
      background: 'var(--color-background-secondary)',
      minWidth: 244,
      boxShadow: '0 1px 3px rgba(20,20,19,0.06)',
    }}>
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
        <IconCircuitDiode size={15} stroke={1.7} color="var(--accent-processing)" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>Analysis Engine</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>Orchestrates four sub-engines</div>
        </div>
      </div>

      {/* Sub-DAG 2x2 grid */}
      <div style={{
        borderTop: '0.5px solid var(--color-border-tertiary)',
        padding: 10,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}>
        {SUBS.map((def) => (
          <SubNode key={def.key} def={def} status={subEngineStatus[def.key]} />
        ))}
      </div>

      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}
