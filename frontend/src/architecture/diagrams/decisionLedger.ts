import {
  IconUserCheck, IconDatabase, IconVersions, IconLink, IconSearch,
  IconApi, IconTrendingUp, IconHistory,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archEvent, archLane, archStore, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-output)'
const W = 1050

export function buildDecisionLedgerDiagram() {
  const nodes = [
    archLane('lane-in', 'Input', 0, 90, W, 'output'),
    archLane('lane-ledger', 'Decision Ledger — Module 07', 100, 240, W, 'output'),
    archLane('lane-store', 'Persistence & index', 360, 110, W, 'intake'),
    archLane('lane-readers', 'Downstream readers', 490, 110, W, 'output'),

    archEvent('approved', 'decision.approved', 60, 38),
    archSvc('review', 'Review Portal', 'Human validation gate', IconUserCheck, ACCENT, 240, 38, '06'),

    archSvc('writer', 'Ledger Writer', 'Append approved records', IconDatabase, ACCENT, 40, 130, '07'),
    archSvc('version', 'Version Manager', 'Revisions & supersession', IconVersions, ACCENT, 220, 130, '07'),
    archSvc('audit', 'Audit Trail Store', 'Immutable write log', IconHistory, ACCENT, 400, 130, '07'),
    archSvc('evidence', 'Evidence Linker', 'Source artifact URLs', IconLink, ACCENT, 580, 130, '07'),
    archSvc('indexer', 'Search Indexer', 'Embeddings for retrieval', IconSearch, ACCENT, 760, 130, '07'),
    archSvc('query', 'Query Service', 'Internal read API', IconSearch, ACCENT, 400, 260, '07'),

    archStore('postgres', 'PostgreSQL', 'Ledger records', 120, 390),
    archStore('vector', 'Vector DB', 'Searchable embeddings', 320, 390),
    archSvc('consumer', 'Consumer API', 'Authoritative answers', IconApi, ACCENT, 520, 520, '08'),
    archSvc('forecast', 'Forecast Engine', 'Precedent read-only', IconTrendingUp, 'var(--accent-output)', 720, 520, '09'),
  ]

  const edges = [
    buildArchEdge({ id: 'd1', source: 'review', target: 'approved', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'd2', source: 'approved', target: 'writer', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'd3', source: 'writer', target: 'version', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'd4', source: 'version', target: 'audit', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'd5', source: 'audit', target: 'evidence', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'd6', source: 'evidence', target: 'indexer', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'd7', source: 'indexer', target: 'query', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'd8', source: 'writer', target: 'postgres', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'd9', source: 'indexer', target: 'vector', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'd10', source: 'query', target: 'consumer', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'd11', source: 'query', target: 'forecast', sourceHandle: 'b', targetHandle: 't', label: 'precedent read', dashed: true, accent: 'muted' }),
  ]

  return { nodes, edges }
}
