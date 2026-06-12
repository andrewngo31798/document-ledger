import { useMemo } from 'react'
import { usePipelineStore } from '../store/pipeline.store'
import { resolveDemoBeat, type DemoBeat } from '../data/demo-script'

export function useDemoNarration(): DemoBeat | null {
  const view = usePipelineStore((s) => s.view)
  const primaryPath = usePipelineStore((s) => s.primaryPath)
  const activeStage = usePipelineStore((s) => s.activeStage)
  const nodeStatus = usePipelineStore((s) => s.nodeStatus)
  const subEngineStatus = usePipelineStore((s) => s.subEngineStatus)
  const reviewDecision = usePipelineStore((s) => s.reviewDecision)

  return useMemo(
    () =>
      resolveDemoBeat({
        view,
        primaryPath,
        activeStage,
        nodeStatus,
        subEngineStatus,
        reviewDecision,
      }),
    [view, primaryPath, activeStage, nodeStatus, subEngineStatus, reviewDecision],
  )
}
