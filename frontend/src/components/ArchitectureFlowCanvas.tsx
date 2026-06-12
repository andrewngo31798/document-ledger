import { useEffect, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { LabeledEdge } from './EdgeLabel'
import { LaneNode } from '../nodes/LaneNode'
import { ArchServiceNode } from '../architecture/nodes/ArchServiceNode'
import { ArchExternalNode } from '../architecture/nodes/ArchExternalNode'
import { ArchStoreNode } from '../architecture/nodes/ArchStoreNode'
import { ArchReviewNode } from '../architecture/nodes/ArchReviewNode'
import { ArchEventNode } from '../architecture/nodes/ArchEventNode'
import { ArchStepNode } from '../architecture/nodes/ArchStepNode'

const nodeTypes = {
  lane: LaneNode,
  service: ArchServiceNode,
  external: ArchExternalNode,
  store: ArchStoreNode,
  review: ArchReviewNode,
  event: ArchEventNode,
  step: ArchStepNode,
}
const edgeTypes = { labeled: LabeledEdge }

function ArchitectureFlowInner({ nodes, edges, fitPadding }: { nodes: Node[]; edges: Edge[]; fitPadding: number }) {
  const { fitView } = useReactFlow()

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: fitPadding, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [nodes, edges, fitView, fitPadding])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: fitPadding }}
      minZoom={0.15}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="var(--color-border-tertiary)" gap={22} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  )
}

export function ArchitectureFlowCanvas({
  diagramId,
  nodes,
  edges,
  fitPadding = 0.16,
}: {
  diagramId: string
  nodes: Node[]
  edges: Edge[]
  fitPadding?: number
}) {
  const memoNodes = useMemo(() => nodes, [diagramId, nodes])
  const memoEdges = useMemo(() => edges, [diagramId, edges])

  return (
    <ReactFlowProvider key={diagramId}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <ArchitectureFlowInner nodes={memoNodes} edges={memoEdges} fitPadding={fitPadding} />
      </div>
    </ReactFlowProvider>
  )
}
