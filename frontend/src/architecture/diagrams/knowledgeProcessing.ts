import {
  IconTopologyStar, IconDownload, IconAlignLeft, IconLayoutGrid, IconTag,
  IconSearch, IconRoute, IconDatabase, IconTags, IconTrendingUp,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archEvent, archLane, archStore, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-processing)'
const W = 1200

export function buildKnowledgeProcessingDiagram() {
  const nodes = [
    archLane('lane-in', 'Input', 0, 90, W, 'intake'),
    archLane('lane-kpe', 'Knowledge Processing Engine — Module 03', 100, 280, W, 'processing'),
    archLane('lane-store', 'Storage', 400, 100, W, 'output'),
    archLane('lane-out', 'Output — dual-path fork', 520, 110, W, 'output'),

    archEvent('queue-in', 'source.triggered', 60, 38),
    archSvc('consumer', 'Job Consumer', 'Pull ingest jobs', IconTopologyStar, ACCENT, 40, 130, '03'),
    archSvc('orchestrator', 'Pipeline Orchestrator', 'Stage coordination', IconRoute, ACCENT, 200, 130, '03'),
    archSvc('fetcher', 'Source Fetcher', 'Adapter registry · fetch', IconDownload, ACCENT, 360, 130, '03'),
    archSvc('normalizer', 'Text Normalizer', 'Clean & unify text', IconAlignLeft, ACCENT, 520, 130, '03'),
    archSvc('chunker', 'Content Chunker', 'Segment for extraction', IconLayoutGrid, ACCENT, 680, 130, '03'),
    archSvc('entities', 'Entity Extractor', 'Owners · systems · dates', IconTag, ACCENT, 840, 130, '03'),
    archSvc('detector', 'Decision Candidate Detector', 'Explicit & implied choices', IconSearch, ACCENT, 200, 230, '03'),
    archSvc('discussion', 'Discussion Signal Detector', 'Thread shift signals', IconSearch, ACCENT, 400, 230, '03'),
    archSvc('router', 'Routing Resolver', 'Set primary_path', IconRoute, ACCENT, 600, 230, '03'),
    archSvc('enricher', 'Metadata Enricher', 'Provenance & context', IconTag, ACCENT, 800, 230, '03'),
    archSvc('writer', 'Knowledge Store Writer', 'Persist records', IconDatabase, ACCENT, 200, 320, '03'),
    archSvc('publisher', 'Event Publisher', 'Emit source.ingested', IconTopologyStar, ACCENT, 400, 320, '03'),

    archStore('postgres', 'PostgreSQL', 'knowledge_records', 120, 430),
    archStore('object', 'Object Storage', 'Raw source blobs', 320, 430),
    archEvent('queue-out', 'source.ingested', 520, 430, 'routing.primary_path'),
    archSvc('classification', 'Classification Engine', 'Decision path', IconTags, 'var(--accent-processing)', 720, 420, '04'),
    archSvc('forecast', 'Forecast Engine', 'Discussion path', IconTrendingUp, 'var(--accent-output)', 920, 420, '09'),
  ]

  const edges = [
    buildArchEdge({ id: 'k1', source: 'queue-in', target: 'consumer', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'k2', source: 'consumer', target: 'orchestrator', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k3', source: 'orchestrator', target: 'fetcher', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k4', source: 'fetcher', target: 'normalizer', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k5', source: 'normalizer', target: 'chunker', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k6', source: 'chunker', target: 'entities', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k7', source: 'entities', target: 'detector', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'k8', source: 'entities', target: 'discussion', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'k9', source: 'detector', target: 'router', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k10', source: 'discussion', target: 'router', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k11', source: 'router', target: 'enricher', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k12', source: 'enricher', target: 'writer', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'k13', source: 'writer', target: 'postgres', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'k14', source: 'writer', target: 'object', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'k15', source: 'writer', target: 'publisher', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k16', source: 'publisher', target: 'queue-out', sourceHandle: 'b', targetHandle: 't', label: 'source.ingested', accent: 'processing' }),
    buildArchEdge({ id: 'k17', source: 'queue-out', target: 'classification', sourceHandle: 'r', targetHandle: 'l', label: 'decision', accent: 'processing' }),
    buildArchEdge({ id: 'k18', source: 'queue-out', target: 'forecast', sourceHandle: 'r', targetHandle: 'l', label: 'discussion', accent: 'output' }),
  ]

  return { nodes, edges }
}
