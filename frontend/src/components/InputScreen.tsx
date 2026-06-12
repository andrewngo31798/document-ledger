import { useState } from 'react'
import { IconMicrophone, IconFileText, IconTicket, IconCursorText, type Icon } from '@tabler/icons-react'
import { usePipelineStore } from '../store/pipeline.store'
// import { useDemoNarration } from '../hooks/useDemoNarration'
// import { DemoNarrationPanel } from './DemoNarrationPanel'
import { transcriptMock } from '../data/transcript-mock'
import { confluenceMock } from '../data/confluence-mock'

type CardKey = 'transcript' | 'confluence' | 'jira' | 'manual'

interface CardDef {
  key: CardKey
  icon: Icon
  title: string
  subtitle: string
  active: boolean
}

const CARDS: CardDef[] = [
  { key: 'transcript', icon: IconMicrophone, title: 'Meeting transcript', subtitle: 'Upload .txt or .vtt', active: true },
  { key: 'confluence', icon: IconFileText, title: 'Confluence page', subtitle: 'Page updated event', active: true },
  { key: 'jira', icon: IconTicket, title: 'Jira ticket', subtitle: 'On close or label', active: false },
  { key: 'manual', icon: IconCursorText, title: 'Manual entry', subtitle: 'Paste or type', active: false },
]

export function InputScreen() {
  const [selected, setSelected] = useState<CardKey>('transcript')
  const startRun = usePipelineStore((s) => s.startRun)
  // const beat = useDemoNarration()

  function start() {
    if (selected === 'confluence') {
      startRun({ inputType: 'confluence', inputLabel: confluenceMock.title, content: confluenceMock.content })
    } else {
      startRun({ inputType: 'transcript', inputLabel: 'meeting-transcript.txt', content: transcriptMock })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-9 px-8"
      style={{ background: 'var(--color-background-canvas)' }}>
      {/* Header */}
      <div className="text-center">
        <h1 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
          Document Ledger
        </h1>
        <p className="prose" style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginTop: 8 }}>
          Choose where a decision begins. Watch it move from raw signal to verified knowledge.
        </p>
      </div>

      {/* 4-card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, width: '100%', maxWidth: 880 }}>
        {CARDS.map((c) => {
          const isSelected = c.active && selected === c.key
          const Icon = c.icon
          return (
            <div
              key={c.key}
              onClick={() => c.active && setSelected(c.key)}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', gap: 8,
                padding: '18px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-background-primary)',
                border: isSelected
                  ? '1.5px solid var(--accent-intake)'
                  : '0.5px solid var(--color-border-secondary)',
                cursor: c.active ? 'pointer' : 'default',
                opacity: c.active ? 1 : 0.4,
                transition: 'border-color 0.2s, transform 0.15s',
              }}
            >
              {!c.active && (
                <span className="font-mono" style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 9, fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  background: 'var(--color-background-secondary)',
                  padding: '2px 7px', borderRadius: 999,
                }}>soon</span>
              )}
              <Icon size={20} stroke={1.6} color={isSelected ? 'var(--accent-intake)' : 'var(--color-text-secondary)'} />
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{c.title}</span>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{c.subtitle}</span>
            </div>
          )
        })}
      </div>

      {/* <DemoNarrationPanel beat={beat} variant="input" /> */}

      {/* Start */}
      <button
        onClick={start}
        style={{
          background: 'var(--accent-processing)',
          color: '#faf9f5',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '10px 28px',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
        Start →
      </button>
    </div>
  )
}
