import type { Node } from '@xyflow/react'
import {
  IconBrandJira, IconFileText, IconBrandSlack, IconMicrophone,
  IconUsers, IconUserCheck, IconRobot, IconSearch, IconBrain,
} from '@tabler/icons-react'
import { buildArchEdge } from '../buildEdge'

function ext(id: string, label: string, subtitle: string, icon: typeof IconBrandJira, x: number, y: number): Node {
  return { id, type: 'external', position: { x, y }, data: { label, subtitle, icon }, draggable: false, zIndex: 1 }
}

export function buildSystemContextDiagram() {
  const nodes: Node[] = [
    ext('jira', 'Jira', 'Tickets & epics', IconBrandJira, 40, 40),
    ext('confluence', 'Confluence', 'Pages & specs', IconFileText, 220, 40),
    ext('collab', 'Slack / Teams', 'Discussions', IconBrandSlack, 400, 40),
    ext('meetings', 'Meetings', 'Transcripts', IconMicrophone, 580, 40),

    {
      id: 'document-ledger',
      type: 'service',
      position: { x: 280, y: 220 },
      data: {
        label: 'Document Ledger',
        subtitle: 'Overview · analysis or forecast',
        icon: IconBrain,
        accent: 'var(--accent-processing)',
      },
      draggable: false,
      zIndex: 2,
    },

    ext('users', 'Internal users', 'Trigger sync & monitor', IconUsers, 40, 400),
    ext('reviewers', 'Reviewers', 'Approve insight packages', IconUserCheck, 220, 400),

    ext('agents', 'AI agents', 'Autonomous assistants', IconRobot, 480, 400),
    ext('search', 'Enterprise search', 'Company-wide knowledge', IconSearch, 660, 400),
  ]

  const edges = [
    buildArchEdge({ id: 'c1', source: 'jira', target: 'document-ledger', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'c2', source: 'confluence', target: 'document-ledger', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'c3', source: 'collab', target: 'document-ledger', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'c4', source: 'meetings', target: 'document-ledger', sourceHandle: 'b', targetHandle: 't', accent: 'intake' }),
    buildArchEdge({ id: 'c5', source: 'users', target: 'document-ledger', sourceHandle: 't', targetHandle: 'b', accent: 'muted' }),
    buildArchEdge({ id: 'c6', source: 'reviewers', target: 'document-ledger', sourceHandle: 't', targetHandle: 'b', accent: 'muted' }),
    buildArchEdge({ id: 'c7', source: 'document-ledger', target: 'agents', sourceHandle: 'b', targetHandle: 't', label: 'trusted context', accent: 'output' }),
    buildArchEdge({ id: 'c8', source: 'document-ledger', target: 'search', sourceHandle: 'b', targetHandle: 't', label: 'verified decisions', accent: 'output' }),
  ]

  return { nodes, edges }
}
