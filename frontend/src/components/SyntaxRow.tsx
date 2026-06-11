export interface NodeRow {
  field: string
  value: string
  /** optional accent for the value: 'type' | 'attr' | 'num' | 'string' */
  accent?: 'type' | 'attr' | 'num' | 'string'
}

const accentColor: Record<NonNullable<NodeRow['accent']>, string> = {
  type: '#5eead4', // teal — types
  attr: '#c084fc', // purple — attributes/keywords
  num: '#f0883e', // orange — numbers
  string: '#e2e8f0', // light — plain values
}

export function SyntaxRow({ row, selected, onClick }: { row: NodeRow; selected?: boolean; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="nodrag"
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr',
        gap: 12,
        padding: '6px 14px',
        background: selected ? 'rgba(109, 40, 217, 0.35)' : 'transparent',
        borderTop: '1px solid #ffffff08',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
    >
      <span className="font-mono" style={{ fontSize: 11, color: '#7ee787' }}>{row.field}</span>
      <span className="font-mono" style={{ fontSize: 11, color: accentColor[row.accent ?? 'string'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {row.value}
      </span>
    </div>
  )
}

export function CommentBubble({ active }: { active?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? '#c084fc' : '#475569'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}
