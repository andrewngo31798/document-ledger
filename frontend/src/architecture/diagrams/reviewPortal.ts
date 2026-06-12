import {
  IconCircuitDiode, IconEye, IconChecklist, IconEdit, IconUserCheck,
  IconBell, IconDatabase, IconRefresh,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'
import { archEvent, archLane, archSvc } from '../diagramHelpers'

const ACCENT = 'var(--accent-output)'
const W = 1000

export function buildReviewPortalDiagram() {
  const nodes = [
    archLane('lane-in', 'Input — decision path', 0, 100, W, 'processing'),
    archLane('lane-portal', 'Review & Approval Portal — Module 06', 110, 260, W, 'output'),
    archLane('lane-out', 'Outcomes', 390, 120, W, 'output'),

    archEvent('insight-ready', 'insight.ready', 60, 40),
    archSvc('analysis', 'Analysis Engine', 'Insight package source', IconCircuitDiode, 'var(--accent-processing)', 240, 40, '05'),

    archSvc('viewer', 'Insight Viewer', 'Ledger diff · impact · recs', IconEye, ACCENT, 40, 140, '06'),
    archSvc('workflow', 'Review Workflow', 'Assign · track · escalate', IconChecklist, ACCENT, 220, 140, '06'),
    archSvc('editor', 'Edit Controller', 'Correct & enrich findings', IconEdit, ACCENT, 400, 140, '06'),
    archSvc('approval', 'Approval Controller', 'Approve · reject · revise', IconUserCheck, ACCENT, 580, 140, '06'),
    archSvc('notify', 'Notification Service', 'Alert pending reviewers', IconBell, ACCENT, 760, 140, '06'),
    archSvc('audit', 'Audit Logger', 'Immutable review trail', IconChecklist, ACCENT, 400, 260, '06'),

    archEvent('approved', 'decision.approved', 80, 420),
    archEvent('rejected', 'decision.rejected', 280, 420),
    archSvc('revision', 'Re-analysis trigger', 'Back to Analysis Engine', IconRefresh, 'var(--accent-processing)', 480, 410, '05'),
    archSvc('ledger', 'Decision Ledger', 'Approved records only', IconDatabase, ACCENT, 680, 410, '07'),
  ]

  const edges = [
    buildArchEdge({ id: 'r1', source: 'analysis', target: 'insight-ready', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'r2', source: 'insight-ready', target: 'viewer', sourceHandle: 'b', targetHandle: 't', accent: 'processing' }),
    buildArchEdge({ id: 'r3', source: 'viewer', target: 'workflow', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'r4', source: 'workflow', target: 'editor', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'r5', source: 'editor', target: 'approval', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'r6', source: 'approval', target: 'notify', sourceHandle: 'r', targetHandle: 'l', accent: 'output' }),
    buildArchEdge({ id: 'r7', source: 'approval', target: 'audit', sourceHandle: 'b', targetHandle: 't', accent: 'output' }),
    buildArchEdge({ id: 'r8', source: 'approval', target: 'approved', sourceHandle: 'b', targetHandle: 't', label: 'approved', accent: 'output' }),
    buildArchEdge({ id: 'r9', source: 'approval', target: 'rejected', sourceHandle: 'b', targetHandle: 't', label: 'rejected', accent: 'muted' }),
    buildArchEdge({ id: 'r10', source: 'approval', target: 'revision', sourceHandle: 'b', targetHandle: 't', label: 'revision', dashed: true, accent: 'processing' }),
    buildArchEdge({ id: 'r11', source: 'approved', target: 'ledger', sourceHandle: 'r', targetHandle: 'l', label: 'decision.approved', accent: 'output' }),
  ]

  return { nodes, edges }
}
