export type AppTab = 'demo' | 'architecture'

const TABS: { id: AppTab; label: string }[] = [
  { id: 'demo', label: 'Demo' },
  { id: 'architecture', label: 'Architecture' },
]

export function AppTabs({ active, onChange }: { active: AppTab; onChange: (tab: AppTab) => void }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 22px',
      borderBottom: '0.5px solid var(--color-border-secondary)',
      background: 'var(--color-background-primary)',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.2px' }}>
        Document Ledger
      </span>

      <div style={{
        display: 'flex',
        gap: 4,
        padding: 3,
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-background-secondary)',
      }}>
        {TABS.map((tab) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: selected ? 500 : 400,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: selected ? 'var(--color-background-primary)' : 'transparent',
                color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                boxShadow: selected ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <span style={{ width: 120 }} />
    </header>
  )
}
