import type { Node } from '@xyflow/react'
import {
  IconAntenna, IconTopologyStar, IconBrain, IconTags, IconTrendingUp, IconDatabase, IconApi,
  IconCircuitDiode, IconBrandJira, IconFileText, IconBrandSlack, IconMicrophone,
  IconRobot, IconSearch, IconSparkles,
} from '@tabler/icons-react'
import { LaneNode } from '../../nodes/LaneNode'
import { buildArchEdge } from '../buildEdge'
import { archExt } from '../diagramHelpers'

const LANE_W = 2040
const Y_SHIFT = 110

const LANES = [
  { id: 'lane-input', title: 'Input layer', bg: 'var(--lane-intake-bg)', text: 'var(--accent-intake)', y: 0, h: 100 },
  { id: 'lane-intake', title: 'Intake layer', bg: 'var(--lane-intake-bg)', text: 'var(--accent-intake)', y: 110, h: 120 },
  { id: 'lane-processing', title: 'Processing layer', bg: 'var(--lane-processing-bg)', text: 'var(--accent-processing)', y: 240, h: 330 },
  { id: 'lane-output', title: 'Output layer', bg: 'var(--lane-output-bg)', text: 'var(--accent-output)', y: 580, h: 120 },
  { id: 'lane-consumers', title: 'Downstream consumers', bg: 'var(--lane-output-bg)', text: 'var(--accent-output)', y: 710, h: 110 },
  { id: 'lane-path-label', title: 'Dual-path fork after Knowledge Processing', bg: 'var(--color-background-secondary)', text: 'var(--color-text-secondary)', y: 830, h: 36 },
]

function lane(id: string, data: Parameters<typeof LaneNode>[0]['data'], y: number): Node {
  return { id, type: 'lane', position: { x: 0, y }, data, draggable: false, selectable: false, zIndex: 0 }
}

function svc(
  id: string,
  label: string,
  subtitle: string,
  icon: typeof IconAntenna,
  accent: string,
  x: number,
  y: number,
  module?: string,
): Node {
  return {
    id,
    type: 'service',
    position: { x, y },
    data: { label, subtitle, icon, accent, module },
    draggable: false,
    zIndex: 1,
  }
}

export function buildDualPathDiagram() {
  const laneNodes: Node[] = LANES.map((l) =>
    lane(l.id, { title: l.title, headerBg: l.bg, headerText: l.text, width: LANE_W, height: l.h }, l.y),
  )

  const nodes: Node[] = [
    ...laneNodes,

    archExt('jira', 'Jira', 'Tickets & epics', IconBrandJira, 40, 25),
    archExt('confluence', 'Confluence', 'Pages & specs', IconFileText, 200, 25),
    archExt('collab', 'Slack / Teams', 'Discussions', IconBrandSlack, 360, 25),
    archExt('meetings', 'Meetings', 'Transcripts', IconMicrophone, 520, 25),

    svc('signal-intake', 'Signal Intake', 'Receive & validate trigger', IconAntenna, 'var(--accent-intake)', 40, 30 + Y_SHIFT, '01'),
    svc('event-bus', 'Queue / Event Bus', 'Async event routing', IconTopologyStar, 'var(--accent-intake)', 380, 30 + Y_SHIFT, '02'),
    svc('knowledge-processing', 'Knowledge Processing', 'Fetch, extract & route', IconBrain, 'var(--accent-processing)', 380, 243 + Y_SHIFT, '03'),
    { id: 'routing-fork', type: 'event', position: { x: 620, y: 200 + Y_SHIFT }, data: { label: 'source.ingested', subtitle: 'routing.primary_path' }, draggable: false, zIndex: 2 },
    svc('classification', 'Classification', 'Domain, confidence & profile', IconTags, 'var(--accent-processing)', 720, 243 + Y_SHIFT, '04'),
    svc('forecast-engine', 'Forecast Engine', 'Change · precedent · forward', IconTrendingUp, 'var(--accent-output)', 720, 360 + Y_SHIFT, '09'),
    svc('analysis-engine', 'Analysis Engine', 'Ledger diff · impact · recommend', IconCircuitDiode, 'var(--accent-processing)', 1040, 243 + Y_SHIFT, '05'),
    { id: 'review-portal', type: 'review', position: { x: 1420, y: 185 + Y_SHIFT }, data: {}, draggable: false, zIndex: 2 },
    svc('decision-ledger', 'Decision Ledger', 'Approved records & audit trail', IconDatabase, 'var(--accent-output)', 1420, 500 + Y_SHIFT, '07'),
    svc('consumer-api', 'Consumer API', 'Verified answers · change previews', IconApi, 'var(--accent-output)', 1720, 500 + Y_SHIFT, '08'),

    archExt('agents', 'AI agents', 'Autonomous assistants', IconRobot, 1420, 735),
    archExt('enterprise', 'Enterprise search', 'Company-wide lookup', IconSearch, 1580, 735),
    archExt('rag-apps', 'RAG applications', 'Grounded generation', IconSparkles, 1740, 735),
    archExt('copilots', 'Copilots', 'In-app decision context', IconApi, 1900, 735),
  ]

  const edges = [
    buildArchEdge({ id: 'e0a', source: 'jira', target: 'signal-intake', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'e0b', source: 'confluence', target: 'signal-intake', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'e0c', source: 'collab', target: 'signal-intake', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'e0d', source: 'meetings', target: 'signal-intake', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'e1', source: 'signal-intake', target: 'event-bus', sourceHandle: 'r', targetHandle: 'l', label: 'source.triggered', accent: 'intake' }),
    buildArchEdge({ id: 'e2', source: 'event-bus', target: 'knowledge-processing', sourceHandle: 'b', targetHandle: 't', label: 'source.triggered', accent: 'intake' }),
    buildArchEdge({ id: 'e3', source: 'knowledge-processing', target: 'routing-fork', sourceHandle: 'r', targetHandle: 'l', label: 'source.ingested', accent: 'processing' }),
    buildArchEdge({ id: 'e4', source: 'routing-fork', target: 'classification', sourceHandle: 'r', targetHandle: 'l', label: 'decision path', accent: 'processing' }),
    buildArchEdge({ id: 'e5', source: 'routing-fork', target: 'forecast-engine', sourceHandle: 'b', targetHandle: 't', label: 'discussion path', accent: 'output' }),
    buildArchEdge({ id: 'e6', source: 'classification', target: 'analysis-engine', sourceHandle: 'r', targetHandle: 'l', label: 'decision.classified', accent: 'processing' }),
    buildArchEdge({ id: 'e7', source: 'analysis-engine', target: 'review-portal', sourceHandle: 'r', targetHandle: 'l', label: 'insight.ready', accent: 'processing' }),
    buildArchEdge({ id: 'e8', source: 'review-portal', target: 'decision-ledger', sourceHandle: 'b', targetHandle: 't', label: 'decision.approved', accent: 'output' }),
    buildArchEdge({ id: 'e9', source: 'decision-ledger', target: 'consumer-api', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'e10', source: 'forecast-engine', target: 'consumer-api', sourceHandle: 'b', targetHandle: 't', label: 'change.preview.ready', accent: 'output' }),
    buildArchEdge({ id: 'e11', source: 'decision-ledger', target: 'forecast-engine', sourceHandle: 'l', targetHandle: 'r', label: 'precedent read', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 'e12', source: 'consumer-api', target: 'agents', sourceHandle: 'b', targetHandle: 't', label: 'trusted context', accent: 'output' }),
    buildArchEdge({ id: 'e13', source: 'consumer-api', target: 'enterprise', sourceHandle: 'b', targetHandle: 't', label: 'verified decisions', accent: 'output' }),
    buildArchEdge({ id: 'e14', source: 'consumer-api', target: 'rag-apps', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'e15', source: 'consumer-api', target: 'copilots', sourceHandle: 'b', targetHandle: 't', label: 'change previews', accent: 'output' }),
  ]

  return { nodes, edges }
}
