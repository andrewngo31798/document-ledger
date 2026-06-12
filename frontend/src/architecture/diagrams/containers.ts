import type { Node } from '@xyflow/react'
import {
  IconAntenna, IconTopologyStar, IconBrain, IconTags, IconCircuitDiode,
  IconTrendingUp, IconUserCheck, IconDatabase, IconApi, IconCloud,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'

function lane(id: string, title: string, y: number, h: number, text: string): Node {
  return {
    id,
    type: 'lane',
    position: { x: 0, y },
    data: { title, headerBg: 'var(--lane-processing-bg)', headerText: text, width: 1200, height: h },
    draggable: false,
    selectable: false,
    zIndex: 0,
  }
}

function svc(id: string, label: string, subtitle: string, icon: typeof IconAntenna, accent: string, x: number, y: number, module?: string): Node {
  return { id, type: 'service', position: { x, y }, data: { label, subtitle, icon, accent, module }, draggable: false, zIndex: 1 }
}

function store(id: string, label: string, subtitle: string, x: number, y: number): Node {
  return { id, type: 'store', position: { x, y }, data: { label, subtitle }, draggable: false, zIndex: 1 }
}

export function buildContainersDiagram() {
  const nodes: Node[] = [
    lane('lane-services', 'Deployable containers', 0, 280, 'var(--accent-processing)'),
    lane('lane-data', 'Data stores', 300, 120, 'var(--accent-intake)'),

    svc('api-gateway', 'API Gateway', 'Webhook & operator ingress', IconCloud, 'var(--accent-intake)', 40, 50),
    svc('signal-intake', 'Signal Intake', 'Validate triggers', IconAntenna, 'var(--accent-intake)', 200, 50, '01'),
    svc('queue', 'Queue / Event Bus', 'Async routing', IconTopologyStar, 'var(--accent-intake)', 380, 50, '02'),
    svc('kpe', 'Knowledge Processing', 'Extract & detect', IconBrain, 'var(--accent-processing)', 560, 50, '03'),
    svc('classification', 'Classification', 'Decision path only', IconTags, 'var(--accent-processing)', 740, 50, '04'),
    svc('analysis', 'Analysis Engine', 'Decision path only', IconCircuitDiode, 'var(--accent-processing)', 920, 50, '05'),
    svc('forecast', 'Forecast Engine', 'Discussion path only', IconTrendingUp, 'var(--accent-output)', 740, 170, '09'),
    { id: 'review', type: 'review', position: { x: 920, y: 170 }, data: {}, draggable: false, zIndex: 1 },
    svc('ledger', 'Decision Ledger', 'Append-only store', IconDatabase, 'var(--accent-output)', 1100, 50, '07'),
    svc('consumer', 'Consumer API', 'Search & RAG', IconApi, 'var(--accent-output)', 1100, 170, '08'),

    store('postgres', 'PostgreSQL', 'Jobs, knowledge, ledger', 120, 340),
    store('redis', 'Redis', 'Idempotency keys', 320, 340),
    store('vector', 'Vector DB', 'Embeddings index', 520, 340),
    store('object', 'Object storage', 'Raw content blobs', 720, 340),
  ]

  const edges = [
    buildArchEdge({ id: 'k1', source: 'api-gateway', target: 'signal-intake', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'k2', source: 'signal-intake', target: 'queue', sourceHandle: 'r', targetHandle: 'l', label: 'source.triggered', accent: 'intake' }),
    buildArchEdge({ id: 'k3', source: 'queue', target: 'kpe', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k4', source: 'kpe', target: 'classification', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k5', source: 'kpe', target: 'forecast', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'k6', source: 'classification', target: 'analysis', sourceHandle: 'r', targetHandle: 'l', accent: 'processing' }),
    buildArchEdge({ id: 'k7', source: 'analysis', target: 'review', sourceHandle: 'b', targetHandle: 't', label: 'insight.ready', accent: 'processing' }),
    buildArchEdge({ id: 'k8', source: 'review', target: 'ledger', sourceHandle: 'r', targetHandle: 'l', label: 'decision.approved', accent: 'output' }),
    buildArchEdge({ id: 'k9', source: 'ledger', target: 'consumer', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'k10', source: 'forecast', target: 'consumer', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'k11', source: 'kpe', target: 'postgres', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'k12', source: 'analysis', target: 'vector', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'k13', source: 'ledger', target: 'postgres', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
  ]

  return { nodes, edges }
}
