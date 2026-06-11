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

export async function runEventBus(_jobId: string): Promise<{ message: string; routing: string }> {
  await delay(500)
  return {
    message: 'source.triggered',
    routing: 'knowledge-processing-queue',
  }
}

export async function runKnowledgeProcessing(_payloadRef: string): Promise<KnowledgeProcessingOutput> {
  await delay(1200)
  return {
    knowledge_id: `kn_${Date.now()}`,
    decision_candidates: 1,
    entities_extracted: ['PostgreSQL', 'DynamoDB', 'Decision Ledger', 'Sarah Okonkwo', 'Marcus Chen'],
    decision_signal: 'explicit_decision',
  }
}

export async function runClassification(_knowledgeId: string): Promise<ClassificationOutput> {
  await delay(800)
  return {
    classified_decision_id: insightPackageMock.classified_decision_id,
    domain: 'technical',
    categories: ['data_storage', 'architecture'],
    confidence: 0.91,
    analysis_profile: 'full_analysis',
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
    query: 'Why did we choose Postgres over DynamoDB?',
    answer:
      'PostgreSQL was chosen over DynamoDB for the Decision Ledger because the audit trail queries require relational joins across decisions, evidence links, and reviewer history. DynamoDB would require re-implementing relational logic in application code. Postgres JSONB support also eliminates the need for a separate document store. Load testing confirmed p99 latency under 50ms at 10× projected volume. The team already operates Postgres for the auth service, reducing operational overhead. Decision approved by Sarah Okonkwo on 2024-11-15.',
    source_ledger_id: ledgerEntryMock.ledger_id,
  }
}
