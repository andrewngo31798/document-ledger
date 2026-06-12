import {
  IconClick, IconClock, IconWebhook, IconCloud, IconShieldCheck, IconKey,
  IconChecklist, IconRefresh, IconSend, IconTopologyStar,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archEvent, archExt, archLane, archStore, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-intake)'
const W = 980

export function buildSignalIntakeDiagram() {
  const nodes = [
    archLane('lane-in', 'Input triggers', 0, 110, W, 'intake'),
    archLane('lane-engine', 'Signal Intake Engine — Module 01', 120, 200, W, 'intake'),
    archLane('lane-out', 'Egress', 340, 110, W, 'output'),

    archExt('manual', 'Manual UI', 'One-off sync', IconClick, 40, 40),
    archExt('scheduler', 'Scheduler', 'Batch scans', IconClock, 220, 40),
    archExt('webhooks', 'External webhooks', 'Jira · Confluence · Slack', IconWebhook, 400, 40),

    archSvc('api-gateway', 'API Gateway', 'Ingress & routing', IconCloud, ACCENT, 40, 150),
    archSvc('trigger-ctrl', 'Trigger Controller', 'Receive & normalize', IconSend, ACCENT, 200, 150, '01'),
    archSvc('auth', 'Auth & Tenant Resolver', 'Scope by tenant', IconShieldCheck, ACCENT, 380, 150, '01'),
    archSvc('validator', 'Trigger Validator', 'Schema & source checks', IconChecklist, ACCENT, 560, 150, '01'),
    archSvc('idempotency', 'Idempotency Handler', 'Dedupe via Redis', IconKey, ACCENT, 200, 240, '01'),
    archSvc('job-creator', 'Job Creator', 'Create processing job', IconChecklist, ACCENT, 380, 240, '01'),
    archSvc('publisher', 'Event Publisher', 'Emit source.triggered', IconSend, ACCENT, 560, 240, '01'),
    archSvc('retry-dlq', 'Retry / DLQ Handler', 'Failed publish recovery', IconRefresh, ACCENT, 740, 240, '01'),

    archStore('postgres', 'PostgreSQL', 'Trigger audit logs', 120, 370),
    archStore('redis', 'Redis', 'Idempotency keys', 320, 370),
    archEvent('triggered', 'source.triggered', 520, 370),
    archSvc('queue', 'Queue / Event Bus', 'Async handoff', IconTopologyStar, ACCENT, 720, 360, '02'),
  ]

  const edges = [
    buildArchEdge({ id: 's1', source: 'manual', target: 'api-gateway', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 's2', source: 'scheduler', target: 'api-gateway', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 's3', source: 'webhooks', target: 'api-gateway', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 's4', source: 'api-gateway', target: 'trigger-ctrl', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 's5', source: 'trigger-ctrl', target: 'auth', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 's6', source: 'auth', target: 'validator', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 's7', source: 'validator', target: 'idempotency', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 's8', source: 'idempotency', target: 'job-creator', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 's9', source: 'job-creator', target: 'publisher', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 's10', source: 'publisher', target: 'retry-dlq', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
    buildArchEdge({ id: 's11', source: 'publisher', target: 'postgres', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 's12', source: 'idempotency', target: 'redis', sourceHandle: 'b', targetHandle: 't', dashed: true, accent: 'muted' }),
    buildArchEdge({ id: 's13', source: 'publisher', target: 'triggered', sourceHandle: 'b', targetHandle: 't', label: 'source.triggered', accent: 'intake' }),
    buildArchEdge({ id: 's14', source: 'triggered', target: 'queue', sourceHandle: 'r', targetHandle: 'l', accent: 'intake' }),
  ]

  return { nodes, edges }
}
