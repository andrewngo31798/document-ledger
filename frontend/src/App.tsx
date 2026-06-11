import { usePipelineStore } from './store/pipeline.store'
import { InputScreen } from './components/InputScreen'
import { PipelineFlow } from './components/PipelineFlow'

export default function App() {
  const view = usePipelineStore((s) => s.view)
  return view === 'input' ? <InputScreen /> : <PipelineFlow />
}
