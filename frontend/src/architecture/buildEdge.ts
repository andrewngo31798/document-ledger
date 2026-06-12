import { MarkerType, type Edge } from '@xyflow/react'

interface EdgeDef {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  dashed?: boolean
  accent?: 'intake' | 'processing' | 'output' | 'muted'
}

const ACCENT_STROKE: Record<NonNullable<EdgeDef['accent']>, string> = {
  intake: 'var(--accent-intake)',
  processing: 'var(--accent-processing)',
  output: 'var(--accent-output)',
  muted: 'var(--color-border-secondary)',
}

export function buildArchEdge(def: EdgeDef): Edge {
  const stroke = ACCENT_STROKE[def.accent ?? 'muted']
  return {
    id: def.id,
    source: def.source,
    target: def.target,
    sourceHandle: def.sourceHandle,
    targetHandle: def.targetHandle,
    type: 'labeled',
    data: { eventName: def.label, active: def.accent !== undefined && def.accent !== 'muted' },
    style: def.dashed ? { strokeDasharray: '5 4' } : undefined,
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: stroke },
  }
}
