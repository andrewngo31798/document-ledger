import { useMemo, useState } from 'react'
import { IconEye } from '@tabler/icons-react'
import { ArchitectureFlowCanvas } from './ArchitectureFlowCanvas'
import { ARCHITECTURE_DIAGRAMS, ARCHITECTURE_GROUPS, moduleAccent, type ArchitectureDiagram } from '../data/architecture-diagrams'

function DiagramContextPanel({ diagram }: { diagram: ArchitectureDiagram }) {
  const accent = moduleAccent(diagram.group)

  return (
    <div
      key={diagram.id}
      className="fade-in"
      style={{
        borderTop: '0.5px solid var(--color-border-secondary)',
        borderBottom: '0.5px solid var(--color-border-secondary)',
        background: 'var(--color-background-primary)',
        padding: '14px 22px',
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
              {diagram.title}
            </span>
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
              {diagram.group}
            </span>
          </div>
          <p
            className="prose"
            style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--color-text-primary)' }}
          >
            {diagram.subtitle}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ArchitectureScreen() {
  const [activeId, setActiveId] = useState(ARCHITECTURE_DIAGRAMS[0].id)
  const active = ARCHITECTURE_DIAGRAMS.find((d) => d.id === activeId) ?? ARCHITECTURE_DIAGRAMS[0]
  const activeIndex = ARCHITECTURE_DIAGRAMS.findIndex((d) => d.id === activeId) + 1
  const accent = moduleAccent(active.group)

  const { nodes, edges } = useMemo(() => active.build(), [active])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 22px 12px', borderBottom: '0.5px solid var(--color-border-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Document Ledger
            </h1>
            <p className="prose" style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Interactive architecture views — same visual language as the pipeline demo.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: accent,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Viewing {active.title.toLowerCase()}
          </span>
          <span className="font-mono" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            {activeIndex} of {ARCHITECTURE_DIAGRAMS.length}
          </span>
        </div>
      </div>

      <DiagramContextPanel diagram={active} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>
        <nav
          style={{
            width: 240,
            flexShrink: 0,
            overflowY: 'auto',
            padding: '12px 10px',
            borderRight: '0.5px solid var(--color-border-secondary)',
            background: 'var(--color-background-primary)',
          }}
        >
          {ARCHITECTURE_GROUPS.map((group) => (
            <div key={group} style={{ marginBottom: 14 }}>
              <div
                className="font-mono"
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-text-tertiary)',
                  padding: '4px 8px 8px',
                }}
              >
                {group}
              </div>
              {ARCHITECTURE_DIAGRAMS.filter((d) => d.group === group).map((diagram) => {
                const selected = diagram.id === activeId
                return (
                  <button
                    key={diagram.id}
                    type="button"
                    onClick={() => setActiveId(diagram.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 12px',
                      marginBottom: 6,
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--color-background-primary)',
                      border: selected
                        ? '1.5px solid var(--accent-intake)'
                        : '0.5px solid var(--color-border-secondary)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <span style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 500,
                      color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}>
                      {diagram.title}
                    </span>
                    <span style={{
                      display: 'block',
                      fontSize: 11,
                      color: 'var(--color-text-tertiary)',
                      marginTop: 3,
                      lineHeight: 1.35,
                    }}>
                      {diagram.subtitle}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          <ArchitectureFlowCanvas
            key={active.id}
            diagramId={active.id}
            nodes={nodes}
            edges={edges}
            fitPadding={
              active.id === 'dual-path' ? 0.08
              : active.id === 'module-05' ? 0.06
              : active.id.startsWith('module-0') ? 0.14
              : 0.18
            }
          />
        </div>
      </div>
    </div>
  )
}
