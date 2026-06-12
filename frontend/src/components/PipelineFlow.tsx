import { useCallback, useMemo, useEffect, useRef } from 'react'
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
  IconAntenna, IconTopologyStar, IconBrain, IconTags, IconTrendingUp, IconDatabase, IconApi, type Icon,
} from '@tabler/icons-react'

import { usePipelineStore, stagesForPath } from '../store/pipeline.store'
import { usePipelineRunner } from '../hooks/usePipelineRunner'
// import { useDemoNarration } from '../hooks/useDemoNarration'
// import { DemoNarrationPanel } from './DemoNarrationPanel'
import { StandardNode, type Lane } from '../nodes/StandardNode'
import { AnalysisEngineNode } from '../nodes/AnalysisEngineNode'
import { ReviewPortalNode } from '../nodes/ReviewPortalNode'
import { LaneNode } from '../nodes/LaneNode'
import { LabeledEdge } from './EdgeLabel'
import { DetailPanel } from './DetailPanel'
import { STAGE_LABEL } from '../data/module-labels'
import { ANALYSIS_WIDTH, NODE_HEIGHT, NODE_WIDTH } from '../nodes/shared'
import type { PipelineStage } from '../types/pipeline'

const nodeTypes = {
  standard: StandardNode,
  analysisEngine: AnalysisEngineNode,
  reviewPortal: ReviewPortalNode,
  lane: LaneNode,
}
const edgeTypes = { labeled: LabeledEdge }

const ALL_STAGES: PipelineStage[] = [
  'signal-intake', 'event-bus', 'knowledge-processing', 'classification',
  'forecast-engine', 'analysis-engine', 'review-portal', 'decision-ledger', 'consumer-api',
]

// ── Layout grid: lanes, gaps, and node columns ──────────────────────────────
const LANE_HEADER = 26
const LANE_PAD = 18
const LANE_GAP = 36        // dead-zone between lanes — edges/labels live here, not on headers
const NODE_GAP = 132       // horizontal gap between node columns (room for edge labels)
const REVIEW_GAP = 180     // gap after Analysis (Review Portal expands to ~340px when active)

const col = (start: number, index: number) => start + index * (NODE_WIDTH + NODE_GAP)

const INTAKE_LANE_Y = 0
const INTAKE_LANE_H = LANE_HEADER + LANE_PAD + NODE_HEIGHT + LANE_PAD
const INTAKE_NODE_Y = INTAKE_LANE_Y + LANE_HEADER + LANE_PAD

const PROCESSING_LANE_Y = INTAKE_LANE_Y + INTAKE_LANE_H + LANE_GAP
const PROCESSING_UPPER_Y = PROCESSING_LANE_Y + LANE_HEADER + LANE_PAD
const PROCESSING_LOWER_Y = PROCESSING_UPPER_Y + NODE_HEIGHT + 52
const PROCESSING_LANE_H = PROCESSING_LOWER_Y + NODE_HEIGHT + LANE_PAD - PROCESSING_LANE_Y

const OUTPUT_LANE_Y = PROCESSING_LANE_Y + PROCESSING_LANE_H + LANE_GAP
const OUTPUT_NODE_Y = OUTPUT_LANE_Y + LANE_HEADER + LANE_PAD
const OUTPUT_LANE_H = LANE_HEADER + LANE_PAD + NODE_HEIGHT + LANE_PAD

/** Centre of the gap between two adjacent lanes — safe for labels and routing */
const gapMidY = (laneBottom: number, nextLaneTop: number) => (laneBottom + nextLaneTop) / 2
const INTAKE_PROC_GAP_Y = gapMidY(INTAKE_LANE_Y + INTAKE_LANE_H, PROCESSING_LANE_Y)

const midEdgeX = (leftX: number, leftW: number, rightX: number) => (leftX + leftW + rightX) / 2
/** Place label inside the gap; bias < 0.5 shifts left (away from the right-hand node) */
const gapLabelX = (leftX: number, leftW: number, rightX: number, bias = 0.45) =>
  leftX + leftW + (rightX - leftX - leftW) * bias
const railLabelY = (nodeY: number) => nodeY + NODE_HEIGHT / 2 - 12
const UPPER_RAIL_Y = () => railLabelY(PROCESSING_UPPER_Y)

const KP_X = col(380, 0)
const PROCESSING = {
  upperY: PROCESSING_UPPER_Y,
  lowerY: PROCESSING_LOWER_Y,
  kpX: KP_X,
  classificationX: col(KP_X, 1),
  analysisX: col(KP_X, 2),
  reviewX: col(KP_X, 2) + ANALYSIS_WIDTH + REVIEW_GAP,
} as const

const CONSUMER_X = PROCESSING.reviewX + NODE_WIDTH + NODE_GAP

// Forecast → Consumer: runway along bottom of processing lane (not on lane divider)
const FORECAST_RUNWAY_Y = PROCESSING_LOWER_Y + NODE_HEIGHT + 14
// Review → Ledger: label sits below expanded Review Portal, above Decision Ledger
const REVIEW_EXPANDED_H = 290
const DECISION_APPROVED_LABEL_Y =
  PROCESSING_UPPER_Y + REVIEW_EXPANDED_H + (OUTPUT_NODE_Y - PROCESSING_UPPER_Y - REVIEW_EXPANDED_H) / 2

// Edge label anchors — derived from layout geometry
const EDGE_LABELS = {
  intakeTriggeredH: { x: midEdgeX(40, NODE_WIDTH, 380), y: railLabelY(INTAKE_NODE_Y) },
  intakeTriggeredV: { x: 380 + NODE_WIDTH / 2 + 18, y: INTAKE_PROC_GAP_Y },
  ingestedH: { x: midEdgeX(PROCESSING.kpX, NODE_WIDTH, PROCESSING.classificationX), y: railLabelY(PROCESSING_UPPER_Y) },
  ingestedV: {
    x: PROCESSING.kpX + NODE_WIDTH / 2 + 18,
    y: PROCESSING_UPPER_Y + NODE_HEIGHT + (PROCESSING_LOWER_Y - PROCESSING_UPPER_Y - NODE_HEIGHT) / 2,
  },
  changePreview: { x: PROCESSING.kpX + NODE_WIDTH + 52, y: FORECAST_RUNWAY_Y - 10 },
  classified: { x: gapLabelX(PROCESSING.classificationX, NODE_WIDTH, PROCESSING.analysisX, 0.38), y: UPPER_RAIL_Y() },
  insightReady: { x: gapLabelX(PROCESSING.analysisX, ANALYSIS_WIDTH, PROCESSING.reviewX, 0.42), y: UPPER_RAIL_Y() },
  decisionApproved: { x: PROCESSING.reviewX + NODE_WIDTH + 18, y: DECISION_APPROVED_LABEL_Y },
} as const

interface StdDef { id: PipelineStage; label: string; subtitle: string; lane: Lane; icon: Icon; x: number; y: number }
const STD_NODES: StdDef[] = [
  { id: 'signal-intake', label: 'Signal Intake', subtitle: 'Receive & validate trigger', lane: 'intake', icon: IconAntenna, x: 40, y: INTAKE_NODE_Y },
  { id: 'event-bus', label: 'Queue', subtitle: 'Async event routing', lane: 'intake', icon: IconTopologyStar, x: KP_X, y: INTAKE_NODE_Y },
  { id: 'knowledge-processing', label: 'Knowledge Processing', subtitle: 'Fetch, extract & detect', lane: 'processing', icon: IconBrain, x: PROCESSING.kpX, y: PROCESSING.upperY },
  { id: 'classification', label: 'Classification', subtitle: 'Domain, confidence & routing', lane: 'processing', icon: IconTags, x: PROCESSING.classificationX, y: PROCESSING.upperY },
  { id: 'forecast-engine', label: 'Forecast', subtitle: 'Change capture · seen before?', lane: 'processing', icon: IconTrendingUp, x: PROCESSING.kpX, y: PROCESSING.lowerY },
  { id: 'decision-ledger', label: 'Decision Ledger', subtitle: 'Approved records & audit trail', lane: 'output', icon: IconDatabase, x: PROCESSING.reviewX, y: OUTPUT_NODE_Y },
  { id: 'consumer-api', label: 'Consumer API', subtitle: 'Verified answers · RAG', lane: 'output', icon: IconApi, x: CONSUMER_X, y: OUTPUT_NODE_Y },
]
const ANALYSIS_POS = { x: PROCESSING.analysisX, y: PROCESSING.upperY }
const REVIEW_POS = { x: PROCESSING.reviewX, y: PROCESSING.upperY }

const LANE_W = PROCESSING.reviewX + NODE_WIDTH + NODE_GAP + NODE_WIDTH + 80
const LANES = [
  { id: 'lane-intake', title: 'Intake layer', bg: 'var(--lane-intake-bg)', text: 'var(--accent-intake)', y: INTAKE_LANE_Y, h: INTAKE_LANE_H },
  { id: 'lane-processing', title: 'Processing layer', bg: 'var(--lane-processing-bg)', text: 'var(--accent-processing)', y: PROCESSING_LANE_Y, h: PROCESSING_LANE_H },
  { id: 'lane-output', title: 'Output layer', bg: 'var(--lane-output-bg)', text: 'var(--accent-output)', y: OUTPUT_LANE_Y, h: OUTPUT_LANE_H },
]

// Lane backgrounds never change — build them once instead of on every status update.
const LANE_NODES: Node[] = LANES.map((l) => ({
  id: l.id, type: 'lane',
  position: { x: 0, y: l.y },
  data: { title: l.title, headerBg: l.bg, headerText: l.text, width: LANE_W, height: l.h },
  draggable: false, selectable: false, zIndex: 0,
}))

interface EdgeDef {
  source: PipelineStage
  target: PipelineStage
  sh: string
  th: string
  label?: string
  centerY?: number
  centerX?: number
  routeY?: number
  labelAt?: { x: number; y: number }
  labelOffsetY?: number
  labelOffsetX?: number
  zIndex?: number
}
const EDGE_DEFS: EdgeDef[] = [
  { source: 'signal-intake', target: 'event-bus', sh: 'r', th: 'l', label: 'source.triggered', labelAt: EDGE_LABELS.intakeTriggeredH, zIndex: 2 },
  { source: 'event-bus', target: 'knowledge-processing', sh: 'b', th: 't', label: 'source.triggered', labelAt: EDGE_LABELS.intakeTriggeredV, zIndex: 2 },
  { source: 'knowledge-processing', target: 'classification', sh: 'r', th: 'l', label: 'source.ingested', labelAt: EDGE_LABELS.ingestedH, zIndex: 2 },
  { source: 'knowledge-processing', target: 'forecast-engine', sh: 'b', th: 't', label: 'source.ingested', labelAt: EDGE_LABELS.ingestedV, zIndex: 2 },
  {
    source: 'forecast-engine', target: 'consumer-api', sh: 'r', th: 't',
    label: 'change.preview.ready', routeY: FORECAST_RUNWAY_Y,
    labelAt: EDGE_LABELS.changePreview, zIndex: 10,
  },
  {
    source: 'classification', target: 'analysis-engine', sh: 'r', th: 'l',
    label: 'decision.classified', labelAt: EDGE_LABELS.classified,
    centerY: PROCESSING_UPPER_Y + NODE_HEIGHT / 2, zIndex: 2,
  },
  { source: 'analysis-engine', target: 'review-portal', sh: 'r', th: 'l', label: 'insight.ready', labelAt: EDGE_LABELS.insightReady, zIndex: 2 },
  { source: 'review-portal', target: 'decision-ledger', sh: 'b', th: 't', label: 'decision.approved', labelAt: EDGE_LABELS.decisionApproved, zIndex: 2 },
  { source: 'decision-ledger', target: 'consumer-api', sh: 'r', th: 'l', zIndex: 2 },
]

function PipelineFlowInner() {
  const runConfig = usePipelineStore((s) => s.runConfig)
  const primaryPath = usePipelineStore((s) => s.primaryPath)
  const nodeStatus = usePipelineStore((s) => s.nodeStatus)
  const activeStage = usePipelineStore((s) => s.activeStage)
  const reviewDecision = usePipelineStore((s) => s.reviewDecision)
  const startRun = usePipelineStore((s) => s.startRun)
  const stageOutputs = usePipelineStore((s) => s.stageOutputs)

  const { advanceStage } = usePipelineRunner()
  const { fitView } = useReactFlow()
  // const beat = useDemoNarration()
  const setDetailPanelFocus = usePipelineStore((s) => s.setDetailPanelFocus)
  const analysisExpanded = usePipelineStore((s) => s.analysisExpanded)
  const autoRunEnabled = usePipelineStore((s) => s.autoRunEnabled)
  const setAutoRunEnabled = usePipelineStore((s) => s.setAutoRunEnabled)

  const runStages = stagesForPath(primaryPath)
  const totalStages = runStages.length

  // Keep a stable ref to advanceStage so the auto-run effect doesn't reset on every render.
  const advanceRef = useRef(advanceStage)
  advanceRef.current = advanceStage

  const activeStatus = activeStage ? nodeStatus[activeStage] : null
  const completedCount = runStages.filter((s) => nodeStatus[s] === 'complete').length
  const isComplete = nodeStatus['consumer-api'] === 'complete'
  const isHalted = reviewDecision === 'rejected'

  // Auto-run driver (view-layer only): walk stages while running, pausing at the human step.
  useEffect(() => {
    if (!autoRunEnabled) return
    if (!activeStage) return
    if (activeStage === 'review-portal') return // human pause — resumes via handleApprove
    if (activeStatus !== 'idle') return
    const t = setTimeout(() => advanceRef.current(), 500)
    return () => clearTimeout(t)
  }, [autoRunEnabled, activeStage, activeStatus])

  function runDemo() {
    setAutoRunEnabled(true)
  }
  function reset() {
    setAutoRunEnabled(false)
    if (runConfig) startRun(runConfig)
  }

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.18, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [fitView, primaryPath])

  useEffect(() => {
    if (!analysisExpanded) return
    const t = setTimeout(
      () => fitView({ nodes: [{ id: 'analysis-engine' }], padding: 0.35, duration: 500 }),
      80,
    )
    return () => clearTimeout(t)
  }, [analysisExpanded, fitView])

  const nodes: Node[] = useMemo(() => {
    const stdNodes: Node[] = STD_NODES.map((n) => ({
      id: n.id, type: 'standard',
      position: { x: n.x, y: n.y },
      data: { stage: n.id, label: n.label, subtitle: n.subtitle, status: nodeStatus[n.id], lane: n.lane, icon: n.icon },
      width: NODE_WIDTH, height: NODE_HEIGHT,
      draggable: false, zIndex: 1,
    }))
    const analysis: Node = {
      id: 'analysis-engine', type: 'analysisEngine', position: ANALYSIS_POS,
      data: {}, width: ANALYSIS_WIDTH, draggable: false, zIndex: 1,
    }
    const review: Node = {
      id: 'review-portal', type: 'reviewPortal', position: REVIEW_POS,
      data: { status: nodeStatus['review-portal'] }, draggable: false, zIndex: 2,
    }
    return [...LANE_NODES, ...stdNodes, analysis, review]
  }, [nodeStatus])

  const edges: Edge[] = useMemo(() =>
    EDGE_DEFS.map((e) => {
      const sourceSkipped = ALL_STAGES.includes(e.source) && nodeStatus[e.source] === 'skipped'
      const targetSkipped = ALL_STAGES.includes(e.target) && nodeStatus[e.target] === 'skipped'
      const sourceDone = nodeStatus[e.source] === 'complete'
      const targetRelevant =
        e.target === 'forecast-engine'
          ? primaryPath === 'discussion'
          : e.source === 'forecast-engine'
            ? primaryPath === 'discussion'
            : !ALL_STAGES.includes(e.target) || nodeStatus[e.target] !== 'skipped'
      const active = sourceDone && targetRelevant && !sourceSkipped && !targetSkipped
      return {
        id: `${e.source}-${e.target}`,
        source: e.source, target: e.target,
        sourceHandle: e.sh, targetHandle: e.th,
        type: 'labeled',
        data: {
          eventName: e.label, active,
          centerY: e.centerY, centerX: e.centerX, routeY: e.routeY,
          labelAt: e.labelAt, labelOffsetY: e.labelOffsetY, labelOffsetX: e.labelOffsetX,
        },
        zIndex: e.zIndex ?? 1,
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: active ? '#d97757' : '#b0aea5' },
      }
    }), [nodeStatus, primaryPath])

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    const stage = node.id as PipelineStage
    if (stageOutputs[stage as keyof typeof stageOutputs]) {
      setDetailPanelFocus({ stage })
    }
  }, [stageOutputs, setDetailPanelFocus])

  // Status bar content
  const dotColor = isComplete ? 'var(--accent-output)' : autoRunEnabled ? 'var(--accent-processing)' : 'var(--color-text-tertiary)'
  const statusText = isHalted
    ? 'Pipeline halted — decision rejected.'
    : isComplete
      ? 'Pipeline complete.'
      : autoRunEnabled && activeStage
        ? `Running — ${STAGE_LABEL[activeStage]}`
        : 'Ready to run.'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div style={{ padding: '16px 22px 12px', borderBottom: '0.5px solid var(--color-border-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>Document Ledger</h1>
            <p className="prose" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Watch a decision move from raw signal to verified knowledge.
            </p>
          </div>
          {!autoRunEnabled && !isComplete && !isHalted && (
            <button onClick={runDemo} style={{
              background: 'var(--accent-processing)', color: '#faf9f5', border: 'none',
              borderRadius: 'var(--radius-md)', padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}>Run demo →</button>
          )}
        </div>

        {/* Status bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <span
            className={autoRunEnabled && !isComplete ? 'pulse-ring' : undefined}
            style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{statusText}</span>
          <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {completedCount} of {totalStages}
          </span>
          {(autoRunEnabled || completedCount > 0) && (
            <button onClick={reset} style={{
              background: 'transparent', color: 'var(--color-text-secondary)',
              border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)',
              padding: '4px 12px', fontSize: 12, cursor: 'pointer',
            }}>Reset</button>
          )}
        </div>
      </div>

      {/* <DemoNarrationPanel beat={beat} variant="pipeline" /> */}

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          nodesDraggable={false}
          nodesConnectable={false}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.2}
          elevateEdgesOnSelect={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--color-border-tertiary)" gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        <DetailPanel onClose={() => setDetailPanelFocus(null)} />
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
