import type { Edge, Node } from '@xyflow/react'

export interface ArchitectureDiagramDef {
  id: string
  title: string
  subtitle: string
  group: string
  build: () => { nodes: Node[]; edges: Edge[] }
}
