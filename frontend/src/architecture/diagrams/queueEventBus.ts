import {
  IconAntenna, IconBrain, IconTags, IconCircuitDiode, IconUserCheck,
  IconDatabase, IconTrendingUp, IconApi, IconTopologyStar, IconRefresh, IconChartBar,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archEvent, archLane, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-intake)'
const W = 1100

export function buildQueueEventBusDiagram() {
  const nodes = [
    archLane('lane-producers', 'Event producers', 0, 100, W, 'intake'),
    archLane('lane-bus', 'Queue / Event Bus — Module 02', 110, 200, W, 'intake'),
    archLane('lane-topics', 'Topics & routing', 320, 100, W, 'processing'),
    archLane('lane-consumers', 'Subscribed consumers', 430, 120, W, 'output'),

    archSvc('signal-intake', 'Signal Intake', 'Publishes triggers', IconAntenna, ACCENT, 40, 30, '01'),
    archSvc('kpe', 'Knowledge Processing', 'Publishes ingested', IconBrain, 'var(--accent-processing)', 200, 30, '03'),
    archSvc('classification', 'Classification', 'Publishes classified', IconTags, 'var(--accent-processing)', 360, 30, '04'),
    archSvc('analysis', 'Analysis Engine', 'Publishes insights', IconCircuitDiode, 'var(--accent-processing)', 520, 30, '05'),
    archSvc('review', 'Review Portal', 'Publishes approvals', IconUserCheck, 'var(--accent-output)', 680, 30, '06'),
    archSvc('forecast', 'Forecast Engine', 'Publishes previews', IconTrendingUp, 'var(--accent-output)', 840, 30, '09'),

    archSvc('router', 'Event Router', 'Topic subscription routing', IconTopologyStar, ACCENT, 80, 140, '02'),
    archSvc('serializer', 'Job Serializer', 'Normalized payload schema', IconTopologyStar, ACCENT, 300, 140, '02'),
    archSvc('registry', 'Consumer Registry', 'Active worker tracking', IconTopologyStar, ACCENT, 520, 140, '02'),
    archSvc('retry', 'Retry Handler', 'Exponential backoff', IconRefresh, ACCENT, 300, 230, '02'),
    archSvc('dlq', 'DLQ Handler', 'Poison message replay', IconRefresh, ACCENT, 520, 230, '02'),
    archSvc('metrics', 'Metrics Collector', 'Lag · throughput · errors', IconChartBar, ACCENT, 740, 185, '02'),

    archEvent('evt-triggered', 'source.triggered', 40, 350),
    archEvent('evt-ingested', 'source.ingested', 220, 350),
    archEvent('evt-classified', 'decision.classified', 400, 350),
    archEvent('evt-insight', 'insight.ready', 580, 350),
    archEvent('evt-approved', 'decision.approved', 760, 350),
    archEvent('evt-preview', 'change.preview.ready', 940, 350),

    archSvc('kpe-consumer', 'Knowledge Processing', 'Ingest jobs', IconBrain, 'var(--accent-processing)', 40, 460, '03'),
    archSvc('class-consumer', 'Classification / Forecast', 'Path fork', IconTags, 'var(--accent-processing)', 220, 460, '04'),
    archSvc('analysis-consumer', 'Analysis Engine', 'Classified decisions', IconCircuitDiode, 'var(--accent-processing)', 400, 460, '05'),
    archSvc('review-consumer', 'Review Portal', 'Insight packages', IconUserCheck, 'var(--accent-output)', 580, 460, '06'),
    archSvc('ledger-consumer', 'Decision Ledger', 'Approved writes', IconDatabase, 'var(--accent-output)', 760, 460, '07'),
    archSvc('api-consumer', 'Consumer API', 'Change previews', IconApi, 'var(--accent-output)', 940, 460, '08'),
  ]

  const edges = [
    buildArchEdge({ id: 'q1', source: 'signal-intake', target: 'router', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'q2', source: 'router', target: 'serializer', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'q3', source: 'serializer', target: 'registry', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'q4', source: 'registry', target: 'retry', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'q5', source: 'retry', target: 'dlq', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 'q6', source: 'router', target: 'evt-triggered', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'q7', source: 'evt-triggered', target: 'kpe-consumer', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'q8', source: 'kpe', target: 'evt-ingested', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'q9', source: 'evt-ingested', target: 'class-consumer', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'q10', source: 'classification', target: 'evt-classified', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'q11', source: 'evt-classified', target: 'analysis-consumer', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'q12', source: 'analysis', target: 'evt-insight', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'q13', source: 'evt-insight', target: 'review-consumer', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'q14', source: 'review', target: 'evt-approved', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'q15', source: 'evt-approved', target: 'ledger-consumer', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'q16', source: 'forecast', target: 'evt-preview', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'q17', source: 'evt-preview', target: 'api-consumer', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
  ]

  return { nodes, edges }
}
