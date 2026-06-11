import { create } from 'zustand'
import type { NodeStatus, PipelineStage, RunConfig, PipelineStageResult, InsightPackage } from '../types/pipeline'

export type AppView = 'input' | 'pipeline'

export type SubEngineStatus = {
  'ledger-diff': NodeStatus
  impact: NodeStatus
  forecast: NodeStatus
  recommendation: NodeStatus
  aggregator: NodeStatus
}

interface PipelineStore {
  view: AppView
  runConfig: RunConfig | null
  nodeStatus: Record<PipelineStage, NodeStatus>
  subEngineStatus: SubEngineStatus
  stageOutputs: PipelineStageResult
  activeStage: PipelineStage | null
  analysisExpanded: boolean
  reviewDecision: 'pending' | 'approved' | 'rejected'
  reviewRationale: string

  startRun: (config: RunConfig) => void
  resetRun: () => void
  setNodeStatus: (stage: PipelineStage, status: NodeStatus) => void
  setSubEngineStatus: (engine: keyof SubEngineStatus, status: NodeStatus) => void
  setStageOutput: (stage: keyof PipelineStageResult, output: PipelineStageResult[keyof PipelineStageResult]) => void
  setActiveStage: (stage: PipelineStage | null) => void
  setAnalysisExpanded: (expanded: boolean) => void
  setReviewDecision: (decision: 'approved' | 'rejected', rationale: string) => void
}

const defaultNodeStatus: Record<PipelineStage, NodeStatus> = {
  input: 'complete',
  'signal-intake': 'idle',
  'event-bus': 'idle',
  'knowledge-processing': 'idle',
  classification: 'idle',
  'analysis-engine': 'idle',
  'review-portal': 'idle',
  'decision-ledger': 'idle',
  'consumer-api': 'idle',
}

const defaultSubEngineStatus: SubEngineStatus = {
  'ledger-diff': 'idle',
  impact: 'idle',
  forecast: 'idle',
  recommendation: 'idle',
  aggregator: 'idle',
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  view: 'input',
  runConfig: null,
  nodeStatus: { ...defaultNodeStatus },
  subEngineStatus: { ...defaultSubEngineStatus },
  stageOutputs: {},
  activeStage: null,
  analysisExpanded: false,
  reviewDecision: 'pending',
  reviewRationale: '',

  startRun: (config) =>
    set({
      view: 'pipeline',
      runConfig: config,
      nodeStatus: { ...defaultNodeStatus },
      subEngineStatus: { ...defaultSubEngineStatus },
      stageOutputs: {},
      activeStage: 'signal-intake',
      analysisExpanded: false,
      reviewDecision: 'pending',
      reviewRationale: '',
    }),

  resetRun: () =>
    set({
      view: 'input',
      runConfig: null,
      nodeStatus: { ...defaultNodeStatus },
      subEngineStatus: { ...defaultSubEngineStatus },
      stageOutputs: {},
      activeStage: null,
      analysisExpanded: false,
      reviewDecision: 'pending',
      reviewRationale: '',
    }),

  setNodeStatus: (stage, status) =>
    set((s) => ({ nodeStatus: { ...s.nodeStatus, [stage]: status } })),

  setSubEngineStatus: (engine, status) =>
    set((s) => ({ subEngineStatus: { ...s.subEngineStatus, [engine]: status } })),

  setStageOutput: (stage, output) =>
    set((s) => ({ stageOutputs: { ...s.stageOutputs, [stage]: output } })),

  setActiveStage: (stage) => set({ activeStage: stage }),

  setAnalysisExpanded: (expanded) => set({ analysisExpanded: expanded }),

  setReviewDecision: (decision, rationale) =>
    set({ reviewDecision: decision, reviewRationale: rationale }),
}))

// Ordered pipeline stages for "Next" advancement
export const PIPELINE_STAGES: PipelineStage[] = [
  'signal-intake',
  'event-bus',
  'knowledge-processing',
  'classification',
  'analysis-engine',
  'review-portal',
  'decision-ledger',
  'consumer-api',
]

export const STAGE_AFTER: Partial<Record<PipelineStage, PipelineStage>> = {
  'signal-intake': 'event-bus',
  'event-bus': 'knowledge-processing',
  'knowledge-processing': 'classification',
  classification: 'analysis-engine',
  'analysis-engine': 'review-portal',
  'review-portal': 'decision-ledger',
  'decision-ledger': 'consumer-api',
}

export const INSIGHT_PACKAGE_KEY = 'analysis-engine' as const

// Retrieve the current InsightPackage from store outputs
export function getInsightPackage(outputs: PipelineStageResult): InsightPackage | undefined {
  return outputs['analysis-engine'] as InsightPackage | undefined
}
