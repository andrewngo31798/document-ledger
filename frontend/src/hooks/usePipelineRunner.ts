import { useCallback } from 'react'
import { usePipelineStore, STAGE_AFTER } from '../store/pipeline.store'
import { pipelineService } from '../services/pipeline.service'
import type { PipelineStage } from '../types/pipeline'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function usePipelineRunner() {
  const store = usePipelineStore()

  const advanceStage = useCallback(async () => {
    const { activeStage, runConfig, stageOutputs } = usePipelineStore.getState()
    if (!activeStage || !runConfig) return

    const set = usePipelineStore.getState

    store.setNodeStatus(activeStage, 'processing')

    try {
      switch (activeStage) {
        case 'signal-intake': {
          const out = await pipelineService.runSignalIntake(runConfig)
          store.setStageOutput('signal-intake', out)
          store.setNodeStatus('signal-intake', 'complete')
          store.setActiveStage('event-bus')
          break
        }
        case 'event-bus': {
          const si = stageOutputs['signal-intake'] as { job_id: string } | undefined
          const out = await pipelineService.runEventBus(si?.job_id ?? '')
          store.setStageOutput('event-bus', out)
          store.setNodeStatus('event-bus', 'complete')
          store.setActiveStage('knowledge-processing')
          break
        }
        case 'knowledge-processing': {
          const si = stageOutputs['signal-intake'] as { payload_ref: string } | undefined
          const out = await pipelineService.runKnowledgeProcessing(si?.payload_ref ?? '')
          store.setStageOutput('knowledge-processing', out)
          store.setNodeStatus('knowledge-processing', 'complete')
          store.setActiveStage('classification')
          break
        }
        case 'classification': {
          const kp = stageOutputs['knowledge-processing'] as { knowledge_id: string } | undefined
          const out = await pipelineService.runClassification(kp?.knowledge_id ?? '')
          store.setStageOutput('classification', out)
          store.setNodeStatus('classification', 'complete')
          store.setActiveStage('analysis-engine')
          break
        }
        case 'analysis-engine': {
          store.setAnalysisExpanded(true)
          const cls = stageOutputs['classification'] as { classified_decision_id: string } | undefined

          // Phase 1: Ledger Diff + Impact in parallel
          store.setSubEngineStatus('ledger-diff', 'processing')
          store.setSubEngineStatus('impact', 'processing')
          await Promise.all([
            delay(1200).then(() => store.setSubEngineStatus('ledger-diff', 'complete')),
            delay(1500).then(() => store.setSubEngineStatus('impact', 'complete')),
          ])

          // Phase 2: Forecast
          store.setSubEngineStatus('forecast', 'processing')
          await delay(1100)
          store.setSubEngineStatus('forecast', 'complete')

          // Phase 3: Recommendation
          store.setSubEngineStatus('recommendation', 'processing')
          await delay(900)
          store.setSubEngineStatus('recommendation', 'complete')

          // Aggregator
          store.setSubEngineStatus('aggregator', 'processing')
          const out = await pipelineService.runAnalysisEngine(cls?.classified_decision_id ?? '')
          store.setSubEngineStatus('aggregator', 'complete')

          store.setStageOutput('analysis-engine', out)
          store.setNodeStatus('analysis-engine', 'complete')

          // Brief pause before zooming back out
          await delay(1200)
          store.setAnalysisExpanded(false)
          store.setActiveStage('review-portal')
          break
        }
        case 'review-portal': {
          // Review portal is interactive — user clicks Approve/Reject, handled separately
          break
        }
        case 'decision-ledger': {
          const review = stageOutputs['review-portal'] as { approved: boolean } | undefined
          if (!review?.approved) {
            store.setNodeStatus('decision-ledger', 'error')
            return
          }
          const out = await pipelineService.runDecisionLedger(stageOutputs['analysis-engine'])
          store.setStageOutput('decision-ledger', out)
          store.setNodeStatus('decision-ledger', 'complete')
          store.setActiveStage('consumer-api')
          break
        }
        case 'consumer-api': {
          const ledger = stageOutputs['decision-ledger'] as { ledger_id: string } | undefined
          const out = await pipelineService.runConsumerApi(ledger?.ledger_id ?? '')
          store.setStageOutput('consumer-api', out)
          store.setNodeStatus('consumer-api', 'complete')
          store.setActiveStage(null)
          break
        }
      }
    } catch (err) {
      console.error('Pipeline stage failed', activeStage, err)
      store.setNodeStatus(activeStage, 'error')
    }
  }, [store])

  const handleApprove = useCallback(async (rationale: string) => {
    const { stageOutputs } = usePipelineStore.getState()
    store.setNodeStatus('review-portal', 'processing')
    const insight = stageOutputs['analysis-engine'] as Parameters<typeof pipelineService.runReviewPortal>[0]
    const out = await pipelineService.runReviewPortal(insight, true, rationale)
    store.setStageOutput('review-portal', out)
    store.setReviewDecision('approved', rationale)
    store.setNodeStatus('review-portal', 'complete')
    store.setActiveStage('decision-ledger')
  }, [store])

  const handleReject = useCallback(async (rationale: string) => {
    const { stageOutputs } = usePipelineStore.getState()
    store.setNodeStatus('review-portal', 'processing')
    const insight = stageOutputs['analysis-engine'] as Parameters<typeof pipelineService.runReviewPortal>[0]
    const out = await pipelineService.runReviewPortal(insight, false, rationale)
    store.setStageOutput('review-portal', out)
    store.setReviewDecision('rejected', rationale)
    store.setNodeStatus('review-portal', 'rejected')
    store.setNodeStatus('decision-ledger', 'rejected')
    store.setNodeStatus('consumer-api', 'rejected')
    store.setActiveStage(null)
  }, [store])

  return { advanceStage, handleApprove, handleReject }
}
