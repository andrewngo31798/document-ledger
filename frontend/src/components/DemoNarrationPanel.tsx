import { useEffect, useState } from 'react'
import { IconChevronDown, IconChevronUp, IconEye } from '@tabler/icons-react'
import type { DemoBeat } from '../data/demo-script'

interface DemoNarrationPanelProps {
  beat: DemoBeat | null
  /** Visual variant — input screen uses a centered card; pipeline uses a full-width bar */
  variant?: 'input' | 'pipeline'
}

const STAGE_ACCENT: Record<string, string> = {
  input: 'var(--accent-intake)',
  'signal-intake': 'var(--accent-intake)',
  'event-bus': 'var(--accent-intake)',
  'knowledge-processing': 'var(--accent-processing)',
  classification: 'var(--accent-processing)',
  'analysis-engine': 'var(--accent-processing)',
  'analysis-intro': 'var(--accent-processing)',
  'ledger-diff': 'var(--accent-processing)',
  impact: 'var(--accent-processing)',
  forecast: 'var(--accent-processing)',
  recommendation: 'var(--accent-processing)',
  aggregator: 'var(--accent-processing)',
  'review-portal': 'var(--accent-output)',
  'decision-ledger': 'var(--accent-output)',
  'consumer-api': 'var(--accent-output)',
}

export function DemoNarrationPanel({ beat, variant = 'pipeline' }: DemoNarrationPanelProps) {
  const [techniqueOpen, setTechniqueOpen] = useState(false)

  useEffect(() => {
    setTechniqueOpen(false)
  }, [beat?.id])

  if (!beat) return null

  const accent = STAGE_ACCENT[beat.id] ?? 'var(--accent-processing)'
  const isInput = variant === 'input'

  return (
    <div
      key={beat.id}
      className="fade-in"
      style={{
        margin: isInput ? '0 auto' : undefined,
        width: isInput ? '100%' : undefined,
        maxWidth: isInput ? 880 : undefined,
        borderTop: isInput ? undefined : '0.5px solid var(--color-border-secondary)',
        borderBottom: isInput ? undefined : '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
        padding: isInput ? '16px 18px' : '14px 22px',
        borderRadius: isInput ? 'var(--radius-lg)' : undefined,
        border: isInput ? '0.5px solid var(--color-border-secondary)' : undefined,
        boxShadow: isInput ? '0 1px 3px rgba(20,20,19,0.06)' : undefined,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 3,
            alignSelf: 'stretch',
            borderRadius: 2,
            background: accent,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: '0.02em' }}>
              {beat.title}
            </span>
            {beat.screenCue && (
              <span
                className="font-mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  color: 'var(--color-text-tertiary)',
                }}
              >
                <IconEye size={11} stroke={1.8} />
                {beat.screenCue}
              </span>
            )}
          </div>
          <p
            className="prose"
            style={{
              fontSize: isInput ? 14 : 13,
              lineHeight: 1.55,
              color: 'var(--color-text-primary)',
            }}
          >
            {beat.script}
          </p>
          {beat.technique && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() => setTechniqueOpen((o) => !o)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {techniqueOpen ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                How it works
              </button>
              {techniqueOpen && (
                <p
                  className="fade-in"
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: 'var(--color-text-secondary)',
                    marginTop: 6,
                    paddingLeft: 2,
                  }}
                >
                  {beat.technique}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
