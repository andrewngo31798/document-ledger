import {
  IconDatabase, IconTrendingUp, IconSearch, IconFileText, IconHistory,
  IconSparkles, IconRobot, IconApi,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archExt, archLane, archStore, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-output)'
const W = 1050

export function buildConsumerApiDiagram() {
  const nodes = [
    archLane('lane-sources', 'Data sources', 0, 120, W, 'intake'),
    archLane('lane-api', 'Consumer API — Module 08', 130, 260, W, 'output'),
    archLane('lane-consumers', 'Downstream consumers', 410, 120, W, 'output'),

    archSvc('ledger', 'Decision Ledger', 'Authoritative · approved only', IconDatabase, 'var(--accent-output)', 40, 40, '07'),
    archStore('previews', 'change_previews', 'Advisory · Forecast output', 280, 40),

    archSvc('search', 'Search Service', '/decisions/search', IconSearch, ACCENT, 40, 160, '08'),
    archSvc('retrieval', 'Retrieval Service', '/decisions/{id}', IconFileText, ACCENT, 220, 160, '08'),
    archSvc('change', 'Change Preview Service', '/changes/previews', IconTrendingUp, ACCENT, 400, 160, '08'),
    archSvc('precedent', 'Precedent Query Service', '/changes/seen-before', IconHistory, ACCENT, 580, 160, '08'),
    archSvc('rag', 'RAG Context Builder', '/decisions/rag-context', IconSparkles, ACCENT, 760, 160, '08'),
    archSvc('access', 'Access Control', 'Tenant-scoped auth', IconApi, ACCENT, 400, 280, '08'),

    archExt('agents', 'AI agents', 'Autonomous assistants', IconRobot, 40, 450),
    archExt('enterprise', 'Enterprise search', 'Company-wide lookup', IconSearch, 240, 450),
    archExt('rag-apps', 'RAG applications', 'Grounded generation', IconSparkles, 440, 450),
    archExt('copilots', 'Copilots', 'In-app decision context', IconApi, 640, 450),
  ]

  const edges = [
    buildArchEdge({ id: 'u1', source: 'ledger', target: 'search', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u2', source: 'ledger', target: 'retrieval', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u3', source: 'ledger', target: 'rag', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u4', source: 'previews', target: 'change', sourceHandle: 'b', targetHandle: 't', label: 'advisory', accent: 'processing' }),
    buildArchEdge({ id: 'u5', source: 'previews', target: 'precedent', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'u6', source: 'search', target: 'access', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u7', source: 'retrieval', target: 'access', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u8', source: 'change', target: 'access', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u9', source: 'precedent', target: 'access', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u10', source: 'rag', target: 'access', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u11', source: 'access', target: 'agents', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u12', source: 'access', target: 'enterprise', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u13', source: 'access', target: 'rag-apps', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'u14', source: 'access', target: 'copilots', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
  ]

  return { nodes, edges }
}
