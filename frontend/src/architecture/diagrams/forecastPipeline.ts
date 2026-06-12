import type { Node } from '@xyflow/react'
import {
  IconTrendingUp, IconHistory, IconTelescope, IconPackage, IconDatabase, IconApi,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'

function lane(id: string, title: string, y: number, h: number, text: string): Node {
  return {
    id,
    type: 'lane',
    position: { x: 0, y },
    data: { title, headerBg: 'var(--lane-output-bg)', headerText: text, width: 1100, height: h },
    draggable: false,
    selectable: false,
    zIndex: 0,
  }
}

function svc(id: string, label: string, subtitle: string, icon: typeof IconTrendingUp, accent: string, x: number, y: number): Node {
  return { id, type: 'service', position: { x, y }, data: { label, subtitle, icon, accent, module: '09' }, draggable: false, zIndex: 1 }
}

function store(id: string, label: string, subtitle: string, x: number, y: number): Node {
  return { id, type: 'store', position: { x, y }, data: { label, subtitle }, draggable: false, zIndex: 1 }
}

export function buildForecastPipelineDiagram() {
  const nodes: Node[] = [
    lane('lane-upstream', 'Upstream — discussion path', 0, 100, 'var(--accent-intake)'),
    lane('lane-phase1', 'Phase 1 — parallel', 120, 130, 'var(--accent-output)'),
    lane('lane-phase2', 'Phase 2 — synthesis', 270, 110, 'var(--accent-output)'),
    lane('lane-egress', 'Egress', 400, 100, 'var(--accent-output)'),

    { id: 'ingest', type: 'event', position: { x: 60, y: 38 }, data: { label: 'source.ingested', subtitle: 'primary_path = discussion' }, draggable: false, zIndex: 2 },
    svc('orchestrator', 'Forecast Orchestrator', 'Job consumer · context loader', IconTrendingUp, 'var(--accent-output)', 280, 30),
    svc('change', 'Change Detector', 'What is shifting?', IconTrendingUp, 'var(--accent-output)', 60, 150),
    svc('precedent', 'Precedent Engine', 'Seen this before?', IconHistory, 'var(--accent-output)', 300, 150),
    svc('forward', 'Forward Projector', 'Grounded watch-fors', IconTelescope, 'var(--accent-output)', 180, 300),
    svc('aggregator', 'Preview Aggregator', 'Quality score · store write', IconPackage, 'var(--accent-output)', 180, 430),
    store('ledger-read', 'Decision Ledger', 'Read-only precedents', 520, 150),
    store('vector-read', 'Vector DB', 'Embedding retrieval', 520, 230),
    { id: 'preview-ready', type: 'event', position: { x: 200, y: 448 }, data: { label: 'change.preview.ready' }, draggable: false, zIndex: 2 },
    svc('consumer', 'Consumer API', 'Advisory Q&A', IconApi, 'var(--accent-output)', 480, 430),
  ]

  const edges = [
    buildArchEdge({ id: 'f1', source: 'ingest', target: 'orchestrator', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'f2', source: 'orchestrator', target: 'change', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'f3', source: 'orchestrator', target: 'precedent', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'f4', source: 'ledger-read', target: 'precedent', sourceHandle: 'l', targetHandle: 'r', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'f5', source: 'vector-read', target: 'precedent', sourceHandle: 'l', targetHandle: 'r', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'f6', source: 'change', target: 'forward', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'f7', source: 'precedent', target: 'forward', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'f8', source: 'forward', target: 'aggregator', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'f9', source: 'aggregator', target: 'preview-ready', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'f10', source: 'preview-ready', target: 'consumer', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
  ]

  return { nodes, edges }
}
