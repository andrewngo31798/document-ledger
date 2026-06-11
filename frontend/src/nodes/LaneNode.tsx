export interface LaneNodeData {
  title: string
  headerBg: string
  headerText: string
  width: number
  height: number
}

export function LaneNode({ data }: { data: LaneNodeData }) {
  const { title, headerBg, headerText, width, height } = data
  return (
    <div style={{
      width, height,
      borderRadius: 'var(--radius-lg)',
      /* transparent body so cross-lane edges render visibly through the lane */
      background: 'transparent',
      border: '0.5px solid var(--color-border-secondary)',
      overflow: 'hidden',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: headerBg,
        color: headerText,
        fontSize: 10,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        padding: '5px 12px',
      }}>
        {title}
      </div>
    </div>
  )
}
