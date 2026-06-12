import { useMemo } from 'react'
import { usePipelineStore } from '../store/pipeline.store'
import { resolveDemoBeat, type DemoBeat } from '../data/demo-script'

export function useDemoNarration(): DemoBeat | null {
  const view = usePipelineStore((s) => s.view)
  const activeStage = usePipelineStore((s) => s.activeStage)
  const nodeStatus = usePipelineStore((s) => s.nodeStatus)
  const subEngineStatus = usePipelineStore((s) => s.subEngineStatus)
  const reviewDecision = usePipelineStore((s) => s.reviewDecision)

  return useMemo(
    () =>
      resolveDemoBeat({
        view,
        activeStage,
        nodeStatus,
        subEngineStatus,
        reviewDecision,
      }),
    [view, activeStage, nodeStatus, subEngineStatus, reviewDecision],
  )
}
