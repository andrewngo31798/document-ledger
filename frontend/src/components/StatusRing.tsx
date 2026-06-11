import type { NodeStatus } from '../types/pipeline'

const colorMap: Record<NodeStatus, string> = {
  idle: '#374151',
  processing: '#3b82f6',
  complete: '#22c55e',
  error: '#ef4444',
  rejected: '#6b7280',
}

export function StatusRing({ status, size = 10 }: { status: NodeStatus; size?: number }) {
  const color = colorMap[status]
  return (
    <span
      className={status === 'processing' ? 'pulse-ring' : ''}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  )
}
