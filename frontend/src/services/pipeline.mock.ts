import type {
  RunConfig,
  SignalIntakeOutput,
  KnowledgeProcessingOutput,
  ClassificationOutput,
  InsightPackage,
  LedgerEntry,
  ChangePreview,
} from '../types/pipeline'
import { insightPackageMock } from '../data/insight-package-mock'
import { changePreviewMock } from '../data/change-preview-mock'
import { ledgerEntryMock } from '../data/ledger-entry-mock'
import { consumerApiMock, consumerApiDiscussionMock } from '../data/consumer-api-mock'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function runSignalIntake(config: RunConfig): Promise<SignalIntakeOutput> {
  await delay(900)
  return {
    job_id: `job_${Date.now()}`,
    source_type: config.inputType === 'confluence' ? 'confluence_page' : 'meeting_transcript',
    triggered_by: config.inputType === 'confluence' ? 'system:confluence_webhook' : 'user:manual_upload',
    payload_ref: config.inputLabel,
    timestamp: new Date().toISOString(),
  }
}

export async function runEventBus(_jobId: string): Promise<{ event_type: string; routing: string }> {
  await delay(500)
  return {
    event_type: 'source.triggered',
    routing: 'knowledge-processing-queue',
  }
}

export async function runKnowledgeProcessing(
  _payloadRef: string,
  config?: RunConfig,
): Promise<KnowledgeProcessingOutput> {
  await delay(1200)
  const isDiscussion = config?.inputType === 'confluence'
  return {
    knowledge_id: `kn_${Date.now()}`,
    knowledge_kind: isDiscussion ? 'discussion' : 'decision_candidate',
    decision_candidate_count: isDiscussion ? 0 : 1,
    discussion_signal: isDiscussion,
    entities_extracted: isDiscussion
      ? ['PostgreSQL', 'DynamoDB', 'Decision Ledger', 'ADR-007']
      : ['PostgreSQL', 'DynamoDB', 'Decision Ledger', 'Sarah Okonkwo', 'Marcus Chen'],
    decision_signal: isDiscussion ? undefined : 'explicit_decision',
    routing: { primary_path: isDiscussion ? 'discussion' : 'decision' },
  }
}

export async function runClassification(_knowledgeId: string): Promise<ClassificationOutput> {
  await delay(800)
  return {
    classified_decision_id: insightPackageMock.classified_decision_id,
    knowledge_id: insightPackageMock.knowledge_id!,
    decision_candidate_id: insightPackageMock.decision_candidate_id!,
    classification: {
      domain: 'technical',
      categories: ['data_storage', 'architecture'],
      confidence: 0.91,
      method: 'hybrid',
    },
    routing: {
      analysis_profile: 'full_analysis',
      sub_engines: ['ledger_diff', 'impact', 'recommendation'],
    },
  }
}

export async function runForecastEngine(_knowledgeId: string): Promise<ChangePreview> {
  await delay(800)
  return changePreviewMock
}

export async function runAnalysisEngine(_classifiedId: string): Promise<InsightPackage> {
  await delay(4000)
  return insightPackageMock
}

export async function runReviewPortal(
  _insight: InsightPackage,
  approved: boolean,
  rationale: string,
): Promise<{ approved: boolean; rationale: string; reviewer: string }> {
  await delay(300)
  return { approved, rationale, reviewer: 'Demo Reviewer' }
}

export async function runDecisionLedger(_approvedDecision: unknown): Promise<LedgerEntry> {
  await delay(700)
  return ledgerEntryMock
}

export async function runConsumerApi(_ledgerId: string, changePreviewId?: string) {
  await delay(800)
  return changePreviewId ? consumerApiDiscussionMock : consumerApiMock
}
