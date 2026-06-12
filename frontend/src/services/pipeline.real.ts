import type {
  RunConfig,
  SignalIntakeOutput,
  KnowledgeProcessingOutput,
  ClassificationOutput,
  InsightPackage,
  LedgerEntry,
  ConsumerApiOutput,
  ChangePreview,
} from '../types/pipeline'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`)
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`)
  return res.json()
}

export async function runSignalIntake(config: RunConfig): Promise<SignalIntakeOutput> {
  return post('/api/signals', { input_type: config.inputType, content: config.content, label: config.inputLabel })
}

export async function runEventBus(jobId: string): Promise<{ event_type: string; routing: string }> {
  return get(`/api/signals/${jobId}/status`)
}

export async function runKnowledgeProcessing(
  payloadRef: string,
  config?: RunConfig,
): Promise<KnowledgeProcessingOutput> {
  return post('/api/knowledge', { payload_ref: payloadRef, input_type: config?.inputType })
}

export async function runForecastEngine(knowledgeId: string): Promise<ChangePreview> {
  return post('/api/forecast', { knowledge_id: knowledgeId })
}

export async function runClassification(knowledgeId: string): Promise<ClassificationOutput> {
  return post('/api/classification', { knowledge_id: knowledgeId })
}

export async function runAnalysisEngine(classifiedId: string): Promise<InsightPackage> {
  return post('/api/analysis', { classified_decision_id: classifiedId })
}

export async function runReviewPortal(
  insight: InsightPackage,
  approved: boolean,
  rationale: string,
): Promise<{ approved: boolean; rationale: string; reviewer: string }> {
  return post('/api/review', { insight_package_id: insight.insight_package_id, approved, rationale })
}

export async function runDecisionLedger(approvedDecision: unknown): Promise<LedgerEntry> {
  return post('/api/ledger', approvedDecision)
}

export async function runConsumerApi(
  ledgerId: string,
  changePreviewId?: string,
): Promise<ConsumerApiOutput> {
  return post('/api/query', {
    ledger_id: ledgerId,
    change_preview_id: changePreviewId,
    prompt: changePreviewId
      ? 'Have we seen a shift toward PostgreSQL for ledger storage before?'
      : 'Has our team officially verified the database decision — who approved it and what evidence backs it?',
  })
}
