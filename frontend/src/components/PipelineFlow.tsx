import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  IconAntenna, IconTopologyStar, IconBrain, IconTags, IconDatabase, IconApi, type Icon,
} from '@tabler/icons-react'

import { usePipelineStore } from '../store/pipeline.store'
import { usePipelineRunner } from '../hooks/usePipelineRunner'
import { StandardNode, type Lane } from '../nodes/StandardNode'
import { AnalysisEngineNode } from '../nodes/AnalysisEngineNode'
import { ReviewPortalNode } from '../nodes/ReviewPortalNode'
import { LaneNode } from '../nodes/LaneNode'
import { LabeledEdge } from './EdgeLabel'
import { DetailPanel } from './DetailPanel'
import type { PipelineStage } from '../types/pipeline'

const nodeTypes = {
  standard: StandardNode,
  analysisEngine: AnalysisEngineNode,
  reviewPortal: ReviewPortalNode,
  lane: LaneNode,
}
const edgeTypes = { labeled: LabeledEdge }

const STAGE_LABEL: Record<PipelineStage, string> = {
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

const RUN_STAGES: PipelineStage[] = [
  'signal-intake', 'event-bus', 'knowledge-processing', 'classification',
  'analysis-engine', 'review-portal', 'decision-ledger', 'consumer-api',
]

// Static node definitions (positions + lane + icon). Snake layout for clean cross-lane drops.
interface StdDef { id: PipelineStage; label: string; subtitle: string; lane: Lane; icon: Icon; x: number; y: number }
const STD_NODES: StdDef[] = [
  { id: 'signal-intake', label: 'Signal Intake', subtitle: 'Validates trigger', lane: 'intake', icon: IconAntenna, x: 40, y: 30 },
  { id: 'event-bus', label: 'Event Bus', subtitle: 'Async routing', lane: 'intake', icon: IconTopologyStar, x: 380, y: 30 },
  { id: 'knowledge-processing', label: 'Knowledge Processing', subtitle: 'Extract & detect', lane: 'processing', icon: IconBrain, x: 380, y: 243 },
  { id: 'classification', label: 'Classification', subtitle: 'Domain & confidence', lane: 'processing', icon: IconTags, x: 720, y: 243 },
  { id: 'decision-ledger', label: 'Decision Ledger', subtitle: 'Versioned record', lane: 'output', icon: IconDatabase, x: 1420, y: 500 },
  { id: 'consumer-api', label: 'Consumer API', subtitle: 'RAG & agents', lane: 'output', icon: IconApi, x: 1720, y: 500 },
]
const ANALYSIS_POS = { x: 1040, y: 185 }
const REVIEW_POS = { x: 1420, y: 185 }

const LANE_W = 1960
const LANES = [
  { id: 'lane-intake', title: 'Intake layer', bg: 'var(--lane-intake-bg)', text: 'var(--accent-intake)', y: 0, h: 120 },
  { id: 'lane-processing', title: 'Processing layer', bg: 'var(--lane-processing-bg)', text: 'var(--accent-processing)', y: 130, h: 330 },
  { id: 'lane-output', title: 'Output layer', bg: 'var(--lane-output-bg)', text: 'var(--accent-output)', y: 470, h: 120 },
]

// Lane backgrounds never change — build them once instead of on every status update.
const LANE_NODES: Node[] = LANES.map((l) => ({
  id: l.id, type: 'lane',
  position: { x: 0, y: l.y },
  data: { title: l.title, headerBg: l.bg, headerText: l.text, width: LANE_W, height: l.h },
  draggable: false, selectable: false, zIndex: 0,
}))

interface EdgeDef { source: PipelineStage; target: PipelineStage; sh: string; th: string; label?: string }
const EDGE_DEFS: EdgeDef[] = [
  { source: 'signal-intake', target: 'event-bus', sh: 'r', th: 'l', label: 'source.triggered' },
  { source: 'event-bus', target: 'knowledge-processing', sh: 'b', th: 't' },
  { source: 'knowledge-processing', target: 'classification', sh: 'r', th: 'l', label: 'source.ingested' },
  { source: 'classification', target: 'analysis-engine', sh: 'r', th: 'l', label: 'decision.classified' },
  { source: 'analysis-engine', target: 'review-portal', sh: 'r', th: 'l', label: 'insight.ready' },
  { source: 'review-portal', target: 'decision-ledger', sh: 'b', th: 't', label: 'decision.approved' },
  { source: 'decision-ledger', target: 'consumer-api', sh: 'r', th: 'l' },
]

function PipelineFlowInner() {
  const runConfig = usePipelineStore((s) => s.runConfig)
  const nodeStatus = usePipelineStore((s) => s.nodeStatus)
  const activeStage = usePipelineStore((s) => s.activeStage)
  const reviewDecision = usePipelineStore((s) => s.reviewDecision)
  const startRun = usePipelineStore((s) => s.startRun)
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)

  const { advanceStage } = usePipelineRunner()
  const { fitView } = useReactFlow()
  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  // Keep a stable ref to advanceStage so the auto-run effect doesn't reset on every render.
  const advanceRef = useRef(advanceStage)
  advanceRef.current = advanceStage

  const activeStatus = activeStage ? nodeStatus[activeStage] : null
  const completedCount = RUN_STAGES.filter((s) => nodeStatus[s] === 'complete').length
  const isComplete = nodeStatus['consumer-api'] === 'complete'
  const isHalted = reviewDecision === 'rejected'

  // Auto-run driver (view-layer only): walk stages while running, pausing at the human step.
  useEffect(() => {
    if (!isRunning) return
    if (!activeStage) return
    if (activeStage === 'review-portal') return // human pause — resumes after Approve
    if (activeStatus !== 'idle') return
    const t = setTimeout(() => advanceRef.current(), 650)
    return () => clearTimeout(t)
  }, [isRunning, activeStage, activeStatus])

  function runDemo() {
    setIsRunning(true)
  }
  function reset() {
    setIsRunning(false)
    if (runConfig) startRun(runConfig)
  }

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.18, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [fitView])

  const nodes: Node[] = useMemo(() => {
    const stdNodes: Node[] = STD_NODES.map((n) => ({
      id: n.id, type: 'standard',
      position: { x: n.x, y: n.y },
      data: { stage: n.id, label: n.label, subtitle: n.subtitle, status: nodeStatus[n.id], lane: n.lane, icon: n.icon },
      draggable: false, zIndex: 1,
    }))
    const analysis: Node = {
      id: 'analysis-engine', type: 'analysisEngine', position: ANALYSIS_POS,
      data: {}, draggable: false, zIndex: 1,
    }
    const review: Node = {
      id: 'review-portal', type: 'reviewPortal', position: REVIEW_POS,
      data: { status: nodeStatus['review-portal'] }, draggable: false, zIndex: 2,
    }
    return [...LANE_NODES, ...stdNodes, analysis, review]
  }, [nodeStatus])

  const edges: Edge[] = useMemo(() =>
    EDGE_DEFS.map((e) => {
      const active = nodeStatus[e.source] === 'complete'
      return {
        id: `${e.source}-${e.target}`,
        source: e.source, target: e.target,
        sourceHandle: e.sh, targetHandle: e.th,
        type: 'labeled',
        data: { eventName: e.label, active },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: active ? '#d97757' : '#b0aea5' },
      }
    }), [nodeStatus])

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const stage = node.id as PipelineStage
    if (stageOutputs[stage as keyof typeof stageOutputs]) setSelectedStage(stage)
  }, [stageOutputs])

  // Status bar content
  const dotColor = isComplete ? 'var(--accent-output)' : isRunning ? 'var(--accent-processing)' : 'var(--color-text-tertiary)'
  const statusText = isHalted
    ? 'Pipeline halted — decision rejected.'
    : isComplete
      ? 'Pipeline complete.'
      : isRunning && activeStage
        ? `Running — ${STAGE_LABEL[activeStage]}`
        : 'Ready to run.'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div style={{ padding: '16px 22px 12px', borderBottom: '0.5px solid var(--color-border-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>Knowledge Ledger</h1>
            <p className="prose" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Watch a decision move from raw signal to verified knowledge.
            </p>
          </div>
          {!isRunning && !isComplete && !isHalted && (
            <button onClick={runDemo} style={{
              background: 'var(--accent-processing)', color: '#faf9f5', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Run demo →</button>
          )}
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <span
            className={isRunning && !isComplete ? 'pulse-ring' : undefined}
            style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{statusText}</span>
          <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {completedCount} of 8
          </span>
          {(isRunning || completedCount > 0) && (
            <button onClick={reset} style={{
              background: 'transparent', color: 'var(--color-text-secondary)',
              border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)',
              padding: '4px 12px', fontSize: 12, cursor: 'pointer',
            }}>Reset</button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--color-border-tertiary)" gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        <DetailPanel selectedStage={selectedStage} onClose={() => setSelectedStage(null)} />
      </div>
    </div>
  )
}

export function PipelineFlow() {
  return (
    <ReactFlowProvider>
      <PipelineFlowInner />
    </ReactFlowProvider>
  )
}
