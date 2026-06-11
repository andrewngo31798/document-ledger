import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  useNodesState,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { usePipelineStore } from '../store/pipeline.store'
import { usePipelineRunner } from '../hooks/usePipelineRunner'
import { PipelineNode } from '../nodes/PipelineNode'
import { InputNode } from '../nodes/InputNode'
import { AnalysisEngineNode } from '../nodes/AnalysisEngineNode'
import { ReviewPortalNode } from '../nodes/ReviewPortalNode'
import { ConsumerApiNode } from '../nodes/ConsumerApiNode'
import { LabeledEdge } from './EdgeLabel'
import { DetailPanel } from './DetailPanel'
import type { NodeRow } from './SyntaxRow'
import type { PipelineStage } from '../types/pipeline'

const nodeTypes = {
  inputNode: InputNode,
  pipelineNode: PipelineNode,
  analysisEngine: AnalysisEngineNode,
  reviewPortal: ReviewPortalNode,
  consumerApi: ConsumerApiNode,
}

const edgeTypes = {
  labeled: LabeledEdge,
}

const X = 0
const GAP = 56 // vertical space between stacked nodes
const FALLBACK_H = 90 // height assumed for a node before it has been measured

// Pipeline order used for vertical stacking.
const NODE_ORDER: PipelineStage[] = [
  'input', 'signal-intake', 'event-bus', 'knowledge-processing',
  'classification', 'analysis-engine', 'review-portal', 'decision-ledger', 'consumer-api',
]

function edgeStatus(sourceStage: PipelineStage, nodeStatus: Record<PipelineStage, string>): 'idle' | 'active' | 'complete' {
  const s = nodeStatus[sourceStage]
  if (s === 'complete') return 'complete'
  if (s === 'processing') return 'active'
  return 'idle'
}

function badgeFor(out: unknown): string | undefined {
  if (!out || typeof out !== 'object') return undefined
  const o = out as Record<string, unknown>
  const val = o['insight_package_id']
  return val ? String(val) : 'done'
}

// Map a stage's structured output into schema-style display rows.
function buildRows(stage: PipelineStage, out: unknown): NodeRow[] | undefined {
  if (!out || typeof out !== 'object') return undefined
  const o = out as Record<string, unknown>
  const str = (k: string) => (o[k] != null ? String(o[k]) : '')

  switch (stage) {
    case 'signal-intake':
      return [
        { field: 'job_id', value: str('job_id'), accent: 'string' },
        { field: 'source_type', value: str('source_type'), accent: 'type' },
        { field: 'triggered_by', value: str('triggered_by'), accent: 'attr' },
      ]
    case 'event-bus':
      return [
        { field: 'event', value: str('message'), accent: 'attr' },
        { field: 'routing', value: str('routing'), accent: 'string' },
      ]
    case 'knowledge-processing':
      return [
        { field: 'knowledge_id', value: str('knowledge_id'), accent: 'string' },
        { field: 'candidates', value: str('decision_candidates'), accent: 'num' },
        { field: 'signal', value: str('decision_signal'), accent: 'attr' },
      ]
    case 'classification':
      return [
        { field: 'domain', value: str('domain'), accent: 'type' },
        { field: 'confidence', value: str('confidence'), accent: 'num' },
        { field: 'profile', value: str('analysis_profile'), accent: 'attr' },
      ]
    case 'decision-ledger':
      return [
        { field: 'ledger_id', value: str('ledger_id'), accent: 'string' },
        { field: 'version', value: str('version'), accent: 'num' },
        { field: 'approved_by', value: str('approved_by'), accent: 'attr' },
      ]
    case 'consumer-api':
      return [
        { field: 'source', value: str('source_ledger_id'), accent: 'string' },
        { field: 'response', value: 'grounded ✓', accent: 'attr' },
      ]
    default:
      return undefined
  }
}

// Inner component that can use useReactFlow (must be inside ReactFlowProvider)
function PipelineFlowInner() {
  const store = usePipelineStore()
  const { advanceStage } = usePipelineRunner()
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null)
  const { fitView } = useReactFlow()

  const { runConfig, nodeStatus, activeStage, analysisExpanded, reviewDecision } = store
  const isConfluence = runConfig?.inputType === 'confluence'
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Content-only node definitions (type + data), no positions. Positions are derived
  // separately from measured DOM heights so variable-height nodes never overlap.
  const nodeDefs = useMemo(() => {
    const ns = nodeStatus
    const rowsFor = (s: PipelineStage): NodeRow[] | undefined =>
      buildRows(s, store.stageOutputs[s as keyof typeof store.stageOutputs])

    return {
      'input': { type: 'inputNode', data: { config: runConfig } },
      'signal-intake': { type: 'pipelineNode', data: { label: 'Signal Intake', subtitle: 'Validates trigger · records attribution', status: ns['signal-intake'], rows: rowsFor('signal-intake'), isMockup: isConfluence } },
      'event-bus': { type: 'pipelineNode', data: { label: 'Event Bus', subtitle: 'Async routing · retry · isolation', status: ns['event-bus'], rows: rowsFor('event-bus'), isMockup: isConfluence } },
      'knowledge-processing': { type: 'pipelineNode', data: { label: 'Knowledge Processing', subtitle: 'Extracts entities · detects decisions', status: ns['knowledge-processing'], rows: rowsFor('knowledge-processing'), isMockup: isConfluence } },
      'classification': { type: 'pipelineNode', data: { label: 'Classification', subtitle: 'Domain · confidence · routing profile', status: ns['classification'], rows: rowsFor('classification'), isMockup: isConfluence } },
      'analysis-engine': { type: 'analysisEngine', data: { status: ns['analysis-engine'], outputBadge: badgeFor(store.stageOutputs['analysis-engine']), isMockup: isConfluence } },
      'review-portal': { type: 'reviewPortal', data: { status: ns['review-portal'], isMockup: isConfluence } },
      'decision-ledger': { type: 'pipelineNode', data: { label: 'Decision Ledger', subtitle: 'Versioned · evidence-linked · immutable', status: ns['decision-ledger'], rows: rowsFor('decision-ledger'), isMockup: isConfluence } },
      'consumer-api': { type: 'consumerApi', data: { status: ns['consumer-api'], isMockup: isConfluence } },
    } as Record<PipelineStage, { type: string; data: Record<string, unknown> }>
  }, [nodeStatus, runConfig, store.stageOutputs, isConfluence])

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])

  // Sync content into the rendered nodes, preserving each node's current position.
  useEffect(() => {
    setNodes((prev) =>
      NODE_ORDER.map((id, i) => {
        const def = nodeDefs[id]
        const existing = prev.find((n) => n.id === id)
        return {
          id,
          type: def.type,
          draggable: false,
          data: def.data,
          position: existing?.position ?? { x: X, y: i * (FALLBACK_H + GAP) },
        } as Node
      }),
    )
  }, [nodeDefs, setNodes])

  // After the DOM paints, measure each node's real height and re-stack with no overlap.
  // Re-runs whenever content OR an expansion state that changes height changes.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const container = wrapperRef.current
      if (!container) return
      let y = 0
      const yById: Record<string, number> = {}
      for (const id of NODE_ORDER) {
        yById[id] = y
        const el = container.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`)
        y += (el?.offsetHeight ?? FALLBACK_H) + GAP
      }
      setNodes((prev) => {
        let changed = false
        const next = prev.map((n) => {
          if (Math.abs(n.position.y - yById[n.id]) > 0.5) {
            changed = true
            return { ...n, position: { x: X, y: yById[n.id] } }
          }
          return n
        })
        return changed ? next : prev
      })
      fitView({ padding: 0.2, duration: 400 })
    })
    return () => cancelAnimationFrame(raf)
  }, [nodeDefs, analysisExpanded, reviewDecision, activeStage, setNodes, fitView])

  const isNextDisabled =
    !activeStage ||
    activeStage === 'review-portal' ||
    nodeStatus[activeStage] === 'processing' ||
    analysisExpanded

  const edges: Edge[] = useMemo(() => {
    const es = (from: PipelineStage) => edgeStatus(from, nodeStatus as Record<PipelineStage, string>)
    return [
      { id: 'e-input-si', source: 'input', target: 'signal-intake', type: 'labeled', data: { eventName: 'source.triggered', description: 'trigger payload', status: es('input') } },
      { id: 'e-si-eb', source: 'signal-intake', target: 'event-bus', type: 'labeled', data: { eventName: 'source.triggered', description: 'processing job', status: es('signal-intake') } },
      { id: 'e-eb-kp', source: 'event-bus', target: 'knowledge-processing', type: 'labeled', data: { description: 'job message routed', status: es('event-bus') } },
      { id: 'e-kp-cls', source: 'knowledge-processing', target: 'classification', type: 'labeled', data: { eventName: 'source.ingested', description: 'structured knowledge + candidates', status: es('knowledge-processing') } },
      { id: 'e-cls-ae', source: 'classification', target: 'analysis-engine', type: 'labeled', data: { eventName: 'decision.classified', description: 'domain · confidence · profile', status: es('classification') } },
      { id: 'e-ae-rp', source: 'analysis-engine', target: 'review-portal', type: 'labeled', data: { eventName: 'insight.ready', description: 'insight package', status: es('analysis-engine') } },
      { id: 'e-rp-dl', source: 'review-portal', target: 'decision-ledger', type: 'labeled', data: { eventName: 'decision.approved', description: 'approved decision + rationale', status: es('review-portal') } },
      { id: 'e-dl-ca', source: 'decision-ledger', target: 'consumer-api', type: 'labeled', data: { description: 'versioned ledger record', status: es('decision-ledger') } },
    ]
  }, [nodeStatus])

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const stage = node.id as PipelineStage
    if (store.stageOutputs[stage as keyof typeof store.stageOutputs]) {
      setSelectedStage(stage)
    }
  }, [store.stageOutputs])

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        height: 48, display: 'flex', alignItems: 'center', padding: '0 16px',
        background: '#0d1117', borderBottom: '1px solid #1e293b', gap: 12, flexShrink: 0,
      }}>
        <button
          onClick={store.resetRun}
          style={{
            background: 'none', border: '1px solid #1e293b', borderRadius: 6,
            color: '#94a3b8', fontSize: 12, padding: '4px 10px', cursor: 'pointer',
          }}>
          ← New Run
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>
            {isConfluence ? '📄' : '🎙️'}{' '}
            {runConfig?.inputLabel}
            {isConfluence && (
              <span className="font-mono" style={{ fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#1c1917', padding: '1px 5px', borderRadius: 3, marginLeft: 6 }}>MOCKUP</span>
            )}
          </span>
        </div>
        {activeStage && activeStage !== 'review-portal' && !analysisExpanded && (
          <button
            onClick={advanceStage}
            disabled={isNextDisabled}
            style={{
              background: isNextDisabled ? '#1e293b' : '#3b82f6',
              color: isNextDisabled ? '#6b7280' : '#fff',
              border: 'none', borderRadius: 6,
              fontSize: 13, fontWeight: 600, padding: '5px 14px', cursor: isNextDisabled ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}>
            Next →
          </button>
        )}
        {!activeStage && reviewDecision !== 'pending' && (
          <span style={{ fontSize: 12, color: reviewDecision === 'approved' ? '#22c55e' : '#ef4444' }}>
            {reviewDecision === 'approved' ? '✓ Done' : '✗ Rejected'}
          </span>
        )}
      </div>

      {/* Canvas */}
      <div ref={wrapperRef} style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={20} size={1} />
          <Controls />
        </ReactFlow>

        <DetailPanel selectedStage={selectedStage} onClose={() => setSelectedStage(null)} />
      </div>
    </div>
  )
}

// Public export — wraps inner component in ReactFlowProvider so useReactFlow works
import { ReactFlowProvider } from '@xyflow/react'

export function PipelineFlow() {
  return (
    <ReactFlowProvider>
      <PipelineFlowInner />
    </ReactFlowProvider>
  )
}
