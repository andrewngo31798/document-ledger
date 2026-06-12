import type { Node } from '@xyflow/react'
import {
  IconCircuitDiode, IconPackage,
  IconTopologyStar, IconDatabase, IconAdjustments, IconRoute, IconSend,
  IconHistory, IconUserCheck, IconSparkles, IconListCheck,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archEvent, archExt, archLane, archStore, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-processing)'
const W = 1520

function step(id: string, label: string, subtitle: string, x: number, y: number, n?: number): Node {
  return { id, type: 'step', position: { x, y }, data: { label, subtitle, step: n }, draggable: false, zIndex: 2 }
}

export function buildAnalysisDagDiagram() {
  const nodes: Node[] = [
    archLane('lane-ext', 'External dependencies', 0, 110, W, 'intake'),
    archLane('lane-ingress', 'Ingress layer', 120, 85, W, 'intake'),
    archLane('lane-orch', 'Orchestration layer', 215, 85, W, 'processing'),
    archLane('lane-lde', 'Ledger Diff Engine — Phase 1 (parallel)', 310, 130, 740, 'processing'),
    { ...archLane('lane-ie', 'Impact Engine — Phase 1 (parallel)', 310, 130, 720, 'processing'), position: { x: 780, y: 310 } },
    archLane('lane-re', 'Recommendation Engine — Phase 2 (sequential)', 450, 100, W, 'processing'),
    archLane('lane-egress', 'Egress layer', 560, 110, W, 'output'),
    archLane('lane-out', 'Output', 680, 90, W, 'output'),

    archEvent('queue-in', 'decision.classified', 40, 40),
    archStore('kpe', 'Knowledge Processing', 'records · chunks · entities', 200, 35),
    archStore('class-db', 'Classification', 'classified_decisions', 400, 35),
    archStore('ledger', 'Decision Ledger', 'read-only precedents', 600, 35),
    archStore('vector', 'Vector DB', 'pgvector embeddings', 800, 35),
    archStore('graph', 'Knowledge Graph', 'nodes · edges', 1000, 35),

    archSvc('consumer', 'Job Consumer', 'Idempotent on classified_decision_id', IconTopologyStar, ACCENT, 40, 145, '05'),
    archSvc('loader', 'Context Loader', 'Join KPE + classification + routing', IconDatabase, ACCENT, 240, 145, '05'),

    archSvc('orchestrator', 'Analysis Orchestrator', 'DAG executor · timeouts · retries', IconCircuitDiode, ACCENT, 40, 240, '05'),
    archSvc('router', 'Profile Router', 'Resolve sub_engines from analysis_profile', IconRoute, ACCENT, 320, 240, '05'),

    step('lde-1', 'Hybrid retrieval', 'Vector + BM25 + graph', 30, 350, 1),
    step('lde-2', 'Fusion + rerank', 'RRF → cross-encoder', 190, 350, 2),
    step('lde-3', 'Primary reference', 'Select baseline record', 350, 350, 3),
    step('lde-4', 'Structured field diff', '8 dimensions compared', 510, 350, 4),
    step('lde-5', 'Change classification', 'first_of_kind · supersede · …', 670, 350, 5),

    step('ie-1', 'Seed identification', 'Entities → graph nodes', 820, 350, 1),
    step('ie-2', 'Graph traversal', '2–3 hops depends_on / owned_by', 980, 350, 2),
    step('ie-3', 'Org mapping + risk', 'Technical · delivery · people', 1140, 350, 3),

    archSvc('re-rules', 'Rule Engine', 'Layer 1 · deterministic governance', IconListCheck, ACCENT, 200, 490, '05'),
    archSvc('re-llm', 'LLM Enrichment', 'Layer 2 · synthesis · grounding', IconSparkles, ACCENT, 420, 490, '05'),

    archSvc('aggregator', 'Insight Aggregator', 'Merge + JSON schema validate', IconPackage, ACCENT, 40, 600, '05'),
    archSvc('quality', 'Quality Scorer', 'Completeness · grounding · priority', IconAdjustments, ACCENT, 260, 600, '05'),
    archSvc('writer', 'Insight Store Writer', 'insight_packages JSONB', IconDatabase, ACCENT, 480, 600, '05'),
    archSvc('publisher', 'Event Publisher', 'insight.ready summary payload', IconSend, ACCENT, 700, 600, '05'),
    archSvc('audit', 'Audit Logger', 'Timings · queries · LLM calls', IconHistory, ACCENT, 920, 600, '05'),

    archStore('insight-store', 'insight_packages', 'PostgreSQL', 120, 710),
    archEvent('queue-out', 'insight.ready', 340, 710),
    archExt('review', 'Review Portal', 'Human validation gate', IconUserCheck, 560, 700),

    archEvent('out-diff', 'ledger_diff', 30, 430),
    archEvent('out-impact', 'impact_map', 820, 430),
    archEvent('out-rec', 'recommendations[]', 320, 545),
  ]

  const edges = [
    buildArchEdge({ id: 'e1', source: 'queue-in', target: 'consumer', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'e2', source: 'kpe', target: 'loader', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e3', source: 'class-db', target: 'loader', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e4', source: 'consumer', target: 'loader', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e5', source: 'loader', target: 'orchestrator', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e6', source: 'orchestrator', target: 'router', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e7', source: 'router', target: 'lde-1', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e8', source: 'router', target: 'ie-1', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e9', source: 'vector', target: 'lde-1', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e10', source: 'ledger', target: 'lde-1', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e11', source: 'graph', target: 'lde-1', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e12', source: 'graph', target: 'ie-2', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e13', source: 'kpe', target: 'ie-1', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e14', source: 'lde-1', target: 'lde-2', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e15', source: 'lde-2', target: 'lde-3', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e16', source: 'lde-3', target: 'lde-4', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e17', source: 'lde-4', target: 'lde-5', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e18', source: 'ie-1', target: 'ie-2', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e19', source: 'ie-2', target: 'ie-3', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e20', source: 'lde-5', target: 'out-diff', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e21', source: 'ie-3', target: 'out-impact', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e22', source: 'lde-5', target: 're-rules', sourceHandle: 'b', targetHandle: 't', label: 'requires', accent: 'processing' }),
    buildArchEdge({ id: 'e23', source: 'ie-3', target: 're-rules', sourceHandle: 'b', targetHandle: 't', label: 'optional', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e24', source: 're-rules', target: 're-llm', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'e25', source: 're-llm', target: 'out-rec', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e26', source: 'lde-5', target: 'aggregator', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e27', source: 'ie-3', target: 'aggregator', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e28', source: 're-llm', target: 'aggregator', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'e29', source: 'aggregator', target: 'quality', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'e30', source: 'quality', target: 'writer', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'e31', source: 'writer', target: 'publisher', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'e32', source: 'orchestrator', target: 'audit', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e33', source: 'writer', target: 'insight-store', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e34', source: 'publisher', target: 'queue-out', sourceHandle: 'b', targetHandle: 't', label: 'insight_package', accent: 'output' }),
    buildArchEdge({ id: 'e35', source: 'queue-out', target: 'review', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
  ]

  return { nodes, edges }
}
