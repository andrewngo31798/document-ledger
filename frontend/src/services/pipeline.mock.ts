import type {
  RunConfig,
  SignalIntakeOutput,
  KnowledgeProcessingOutput,
  ClassificationOutput,
  InsightPackage,
  LedgerEntry,
} from '../types/pipeline'
import { insightPackageMock } from '../data/insight-package-mock'
import { ledgerEntryMock } from '../data/ledger-entry-mock'

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

export async function runKnowledgeProcessing(_payloadRef: string): Promise<KnowledgeProcessingOutput> {
  await delay(1200)
  return {
    knowledge_id: `kn_${Date.now()}`,
    decision_candidate_count: 1,
    entities_extracted: ['PostgreSQL', 'DynamoDB', 'Decision Ledger', 'Sarah Okonkwo', 'Marcus Chen'],
    decision_signal: 'explicit_decision',
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
      sub_engines: ['ledger_diff', 'impact', 'forecast', 'recommendation'],
    },
  }
}

export async function runAnalysisEngine(_classifiedId: string): Promise<InsightPackage> {
  // Timing handled per sub-engine in the store; return full package after all phases
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

export async function runConsumerApi(_ledgerId: string): Promise<{
  query: string
  answer: string
  source_ledger_id: string
}> {
  await delay(800)
  return {
    query: 'Has our team officially verified the database decision — who approved it and what evidence backs it?',
    answer:
      'Yes — this is an approved Decision Ledger record (version 1). Approved by Sarah Okonkwo on 2024-11-15. Evidence: confluence://ADR-007, jira://KL-142 (spike), meeting://2024-11-14-arch-review. Decision: PostgreSQL over DynamoDB as the primary data store for the Decision Ledger module. This answer is drawn from a verified, immutable ledger entry — not search results or an AI-generated summary.',
    source_ledger_id: ledgerEntryMock.id,
  }
}
