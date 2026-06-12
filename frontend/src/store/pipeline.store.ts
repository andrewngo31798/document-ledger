import { create } from 'zustand'
import type {
  NodeStatus,
  PipelineStage,
  RunConfig,
  PipelineStageResult,
  InsightPackage,
  PrimaryPath,
  InputType,
} from '../types/pipeline'

export type AppView = 'input' | 'pipeline'

export type SubEngineStatus = {
  'ledger-diff': NodeStatus
  impact: NodeStatus
  recommendation: NodeStatus
  aggregator: NodeStatus
}

export type DetailPanelFocus = {
  stage: PipelineStage
  subEngine?: keyof SubEngineStatus
}

interface PipelineStore {
  view: AppView
  runConfig: RunConfig | null
  primaryPath: PrimaryPath
  nodeStatus: Record<PipelineStage, NodeStatus>
  subEngineStatus: SubEngineStatus
  stageOutputs: PipelineStageResult
  activeStage: PipelineStage | null
  analysisExpanded: boolean
  detailPanelFocus: DetailPanelFocus | null
  reviewDecision: 'pending' | 'approved' | 'rejected'
  reviewRationale: string
  autoRunEnabled: boolean

  startRun: (config: RunConfig) => void
  resetRun: () => void
  setAutoRunEnabled: (enabled: boolean) => void
  setNodeStatus: (stage: PipelineStage, status: NodeStatus) => void
  setSubEngineStatus: (engine: keyof SubEngineStatus, status: NodeStatus) => void
  setStageOutput: (stage: keyof PipelineStageResult, output: PipelineStageResult[keyof PipelineStageResult]) => void
  setActiveStage: (stage: PipelineStage | null) => void
  setAnalysisExpanded: (expanded: boolean) => void
  setDetailPanelFocus: (focus: DetailPanelFocus | null) => void
  setReviewDecision: (decision: 'approved' | 'rejected', rationale: string) => void
}

const defaultNodeStatus: Record<PipelineStage, NodeStatus> = {
  input: 'complete',
  'signal-intake': 'idle',
  'event-bus': 'idle',
  'knowledge-processing': 'idle',
  classification: 'idle',
  'forecast-engine': 'idle',
  'analysis-engine': 'idle',
  'review-portal': 'idle',
  'decision-ledger': 'idle',
  'consumer-api': 'idle',
}

const defaultSubEngineStatus: SubEngineStatus = {
  'ledger-diff': 'idle',
  impact: 'idle',
  recommendation: 'idle',
  aggregator: 'idle',
}

export function primaryPathForInput(inputType: InputType): PrimaryPath {
  return inputType === 'confluence' ? 'discussion' : 'decision'
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  view: 'input',
  runConfig: null,
  primaryPath: 'decision',
  nodeStatus: { ...defaultNodeStatus },
  subEngineStatus: { ...defaultSubEngineStatus },
  stageOutputs: {},
  activeStage: null,
  analysisExpanded: false,
  detailPanelFocus: null,
  reviewDecision: 'pending',
  reviewRationale: '',
  autoRunEnabled: false,

  startRun: (config) =>
    set({
      view: 'pipeline',
      runConfig: config,
      primaryPath: primaryPathForInput(config.inputType),
      nodeStatus: { ...defaultNodeStatus },
      subEngineStatus: { ...defaultSubEngineStatus },
      stageOutputs: {},
      activeStage: 'signal-intake',
      analysisExpanded: false,
      detailPanelFocus: null,
      reviewDecision: 'pending',
      reviewRationale: '',
      autoRunEnabled: false,
    }),

  resetRun: () =>
    set({
      view: 'input',
      runConfig: null,
      primaryPath: 'decision',
      nodeStatus: { ...defaultNodeStatus },
      subEngineStatus: { ...defaultSubEngineStatus },
      stageOutputs: {},
      activeStage: null,
      analysisExpanded: false,
      detailPanelFocus: null,
      reviewDecision: 'pending',
      reviewRationale: '',
      autoRunEnabled: false,
    }),

  setAutoRunEnabled: (enabled) => set({ autoRunEnabled: enabled }),

  setNodeStatus: (stage, status) =>
    set((s) => ({ nodeStatus: { ...s.nodeStatus, [stage]: status } })),

  setSubEngineStatus: (engine, status) =>
    set((s) => ({ subEngineStatus: { ...s.subEngineStatus, [engine]: status } })),

  setStageOutput: (stage, output) =>
    set((s) => ({ stageOutputs: { ...s.stageOutputs, [stage]: output } })),

  setActiveStage: (stage) => set({ activeStage: stage }),

  setAnalysisExpanded: (expanded) => set({ analysisExpanded: expanded }),

  setDetailPanelFocus: (focus) => set({ detailPanelFocus: focus }),

  setReviewDecision: (decision, rationale) =>
    set({ reviewDecision: decision, reviewRationale: rationale }),
}))

export const DECISION_PIPELINE_STAGES: PipelineStage[] = [
  'signal-intake',
  'event-bus',
  'knowledge-processing',
  'classification',
  'analysis-engine',
  'review-portal',
  'decision-ledger',
  'consumer-api',
]

export const DISCUSSION_PIPELINE_STAGES: PipelineStage[] = [
  'signal-intake',
  'event-bus',
  'knowledge-processing',
  'forecast-engine',
  'consumer-api',
]

export function stagesForPath(path: PrimaryPath): PipelineStage[] {
  return path === 'discussion' ? DISCUSSION_PIPELINE_STAGES : DECISION_PIPELINE_STAGES
}

export const PIPELINE_STAGES = DECISION_PIPELINE_STAGES

export const INSIGHT_PACKAGE_KEY = 'analysis-engine' as const

export function getInsightPackage(outputs: PipelineStageResult): InsightPackage | undefined {
  return outputs['analysis-engine'] as InsightPackage | undefined
}
