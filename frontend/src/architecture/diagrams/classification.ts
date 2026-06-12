import {
  IconTopologyStar, IconDatabase, IconChecklist, IconBrain, IconSparkles,
  IconTags, IconAdjustments, IconRoute, IconCircuitDiode,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archEvent, archLane, archStore, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-processing)'
const W = 1100

export function buildClassificationDiagram() {
  const nodes = [
    archLane('lane-in', 'Input', 0, 100, W, 'intake'),
    archLane('lane-ce', 'Classification Engine — Module 04', 110, 260, W, 'processing'),
    archLane('lane-out', 'Output', 390, 100, W, 'output'),

    archEvent('queue-in', 'source.ingested', 60, 40),
    archStore('knowledge', 'Knowledge Store', 'PostgreSQL', 240, 40),

    archSvc('consumer', 'Job Consumer', 'Pull classify jobs', IconTopologyStar, ACCENT, 40, 140, '04'),
    archSvc('loader', 'Knowledge Loader', 'Hydrate from store', IconDatabase, ACCENT, 200, 140, '04'),
    archSvc('orchestrator', 'Classification Orchestrator', 'Route classifiers', IconRoute, ACCENT, 360, 140, '04'),
    archSvc('rules', 'Rule Engine', 'High-precision taxonomy', IconChecklist, ACCENT, 520, 140, '04'),
    archSvc('classifier', 'Domain Classifier', 'ML / heuristic labels', IconBrain, ACCENT, 200, 240, '04'),
    archSvc('llm', 'LLM Classifier', 'Ambiguous cases only', IconSparkles, ACCENT, 400, 240, '04'),
    archSvc('tagger', 'Tag Assigner', 'Multi-label categories', IconTags, ACCENT, 600, 240, '04'),
    archSvc('scorer', 'Confidence Calibrator', 'Score & thresholds', IconAdjustments, ACCENT, 200, 330, '04'),
    archSvc('router', 'Analysis Router', 'Set analysis_profile', IconRoute, ACCENT, 400, 330, '04'),
    archSvc('writer', 'Classification Store Writer', 'Persist labels', IconDatabase, ACCENT, 600, 330, '04'),
    archSvc('publisher', 'Event Publisher', 'Emit decision.classified', IconTopologyStar, ACCENT, 800, 240, '04'),

    archStore('class-store', 'classified_decisions', 'PostgreSQL', 120, 420),
    archEvent('queue-out', 'decision.classified', 320, 420),
    archSvc('analysis', 'Analysis Engine', 'Decision path only', IconCircuitDiode, ACCENT, 520, 410, '05'),
  ]

  const edges = [
    buildArchEdge({ id: 'c1', source: 'queue-in', target: 'consumer', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'c2', source: 'knowledge', target: 'loader', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'c3', source: 'consumer', target: 'loader', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c4', source: 'loader', target: 'orchestrator', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c5', source: 'orchestrator', target: 'rules', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c6', source: 'rules', target: 'tagger', sourceHandle: 'b', targetHandle: 't', label: 'high confidence', accent: 'processing' }),
    buildArchEdge({ id: 'c7', source: 'rules', target: 'classifier', sourceHandle: 'b', targetHandle: 't', label: 'low confidence', accent: 'processing' }),
    buildArchEdge({ id: 'c8', source: 'classifier', target: 'llm', sourceHandle: 'b', targetHandle: 't', label: 'ambiguous', accent: 'processing' }),
    buildArchEdge({ id: 'c9', source: 'classifier', target: 'tagger', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c10', source: 'llm', target: 'tagger', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c11', source: 'tagger', target: 'scorer', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'c12', source: 'scorer', target: 'router', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c13', source: 'router', target: 'writer', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c14', source: 'writer', target: 'class-store', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'c15', source: 'writer', target: 'publisher', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'c16', source: 'publisher', target: 'queue-out', sourceHandle: 'b', targetHandle: 't', label: 'decision.classified', accent: 'processing' }),
    buildArchEdge({ id: 'c17', source: 'queue-out', target: 'analysis', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
  ]

  return { nodes, edges }
}
