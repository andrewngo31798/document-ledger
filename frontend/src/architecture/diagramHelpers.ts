import type { Node } from '@xyflow/react'
import type { Icon } from '@tabler/icons-react'

type LaneStyle = 'intake' | 'processing' | 'output'

const LANE_STYLE: Record<LaneStyle, { bg: string; text: string }> = {
  intake: { bg: 'var(--lane-intake-bg)', text: 'var(--accent-intake)' },
  processing: { bg: 'var(--lane-processing-bg)', text: 'var(--accent-processing)' },
  output: { bg: 'var(--lane-output-bg)', text: 'var(--accent-output)' },
}

export function archLane(
  id: string,
  title: string,
  y: number,
  h: number,
  width: number,
  style: LaneStyle = 'processing',
): Node {
  const lane = LANE_STYLE[style]
  return {
    id,
    type: 'lane',
    position: { x: 0, y },
    data: { title, headerBg: lane.bg, headerText: lane.text, width, height: h },
    draggable: false,
    selectable: false,
    zIndex: 0,
  }
}

export function archSvc(
  id: string,
  label: string,
  subtitle: string,
  icon: Icon,
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

export function archStore(id: string, label: string, subtitle: string, x: number, y: number): Node {
  return {
    id,
    type: 'store',
    position: { x, y },
    data: { label, subtitle },
    draggable: false,
    zIndex: 1,
  }
}

export function archEvent(id: string, label: string, x: number, y: number, subtitle?: string): Node {
  return {
    id,
    type: 'event',
    position: { x, y },
    data: { label, subtitle },
    draggable: false,
    zIndex: 2,
  }
}

export function archExt(
  id: string,
  label: string,
  subtitle: string,
  icon: Icon,
  x: number,
  y: number,
): Node {
  return {
    id,
    type: 'external',
    position: { x, y },
    data: { label, subtitle, icon },
    draggable: false,
    zIndex: 1,
  }
}
