import type { ReactNode } from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'
import type { NodeStatus } from '../types/pipeline'

export type Lane = 'intake' | 'processing' | 'output'

/** Fixed height for standard nodes so they fill the lane consistently. */
export const NODE_HEIGHT = 84

/** Shared ReactFlow handle styling for all pipeline nodes. */
export const handleStyle = { background: 'var(--color-border-secondary)', border: 'none', width: 6, height: 6 } as const

export const laneAccent: Record<Lane, string> = {
  intake: 'var(--accent-intake)',
  processing: 'var(--accent-processing)',
  output: 'var(--accent-output)',
}

export function Spinner() {
  return (
    <span className="spin" style={{
      width: 8, height: 8, borderRadius: '50%',
      border: '1.5px solid var(--color-border-secondary)',
      borderTopColor: 'var(--accent-processing)',
      display: 'inline-block',
    }} />
  )
}

/** Small status pill shared by node badges. `soft` is an optional background tint. */
export function Pill({ color, soft, children }: { color: string; soft?: string; children: ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 9.5, fontWeight: 500, padding: '2px 7px', borderRadius: 999,
      color, background: soft,
    }}>
      {children}
    </span>
  )
}

export function StateBadge({ status }: { status: NodeStatus }) {
  switch (status) {
    case 'processing':
      return <Pill color="var(--accent-processing)" soft="var(--color-background-secondary)"><Spinner /> Processing</Pill>
    case 'complete':
      return <Pill color="var(--accent-output)" soft="var(--accent-output-soft)"><IconCheck size={11} stroke={2.5} /> Done</Pill>
    case 'rejected':
      return <Pill color="var(--accent-rejected)" soft="var(--accent-rejected-soft)"><IconX size={11} stroke={2.5} /> Rejected</Pill>
    case 'skipped':
      return <Pill color="var(--color-text-tertiary)" soft="var(--color-background-secondary)">Skipped</Pill>
    default:
      return null
  }
}
