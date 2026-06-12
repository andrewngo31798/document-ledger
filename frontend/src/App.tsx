import { lazy, Suspense, useState } from 'react'
import { usePipelineStore } from './store/pipeline.store'
import { InputScreen } from './components/InputScreen'
import { PipelineFlow } from './components/PipelineFlow'
import { AppTabs, type AppTab } from './components/AppTabs'

const ArchitectureScreen = lazy(() =>
  import('./components/ArchitectureScreen').then((m) => ({ default: m.ArchitectureScreen })),
)

function DemoView() {
  const view = usePipelineStore((s) => s.view)
  return view === 'input' ? <InputScreen /> : <PipelineFlow />
}

export default function App() {
  const [tab, setTab] = useState<AppTab>('demo')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppTabs active={tab} onChange={setTab} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {tab === 'demo' ? (
          <DemoView />
        ) : (
          <Suspense fallback={
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-background-canvas)',
              color: 'var(--color-text-secondary)',
              fontSize: 12,
            }}>
              Loading diagrams…
            </div>
          }>
            <ArchitectureScreen />
          </Suspense>
        )}
      </main>
    </div>
  )
}
