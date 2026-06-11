import * as mock from './pipeline.mock'
import * as real from './pipeline.real'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const pipelineService = USE_MOCK ? mock : real
