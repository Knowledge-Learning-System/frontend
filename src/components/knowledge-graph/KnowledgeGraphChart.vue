<template>
  <div ref="containerRef" class="kg-chart">
    <svg ref="svgRef" class="kg-svg" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { KnowledgeNode, KnowledgeLink } from '@/types/knowledgeGraph'
import * as d3 from 'd3'

interface Props {
  data: {
    nodes: KnowledgeNode[]
    links: KnowledgeLink[]
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'node-click', node: KnowledgeNode): void
}>()

const containerRef = ref<HTMLElement>()
const svgRef = ref<SVGSVGElement>()

let simulation: d3.Simulation<SimNode, undefined> | null = null
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null
let currentScale = 1

const groupColors: Record<number, string> = {
  0: '#1890ff',
  1: '#52c41a',
  2: '#faad14',
  3: '#722ed1',
  4: '#ff4d4f',
}

const DEFAULT_COLOR = '#ff4d4f'

const getColor = (group: number): string => {
  return groupColors[group] ?? DEFAULT_COLOR
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  group: number
  description?: string
  _color: string
}

const render = () => {
  if (!svgRef.value || !containerRef.value) return

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  svg.attr('width', width).attr('height', height)

  const g = svg.append('g')

  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.3, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
      currentScale = event.transform.k
    })

  svg.call(zoom as any)
  svg.call((zoom as any).transform, d3.zoomIdentity.translate(width / 2, height / 2))

  const nodes: SimNode[] = props.data.nodes.map((n) => ({
    ...n,
    _color: getColor(n.group),
  }))

  const links = props.data.links.map((l) => {
    const sourceId = typeof l.source === 'object' ? (l.source as KnowledgeNode).id : l.source
    const targetId = typeof l.target === 'object' ? (l.target as KnowledgeNode).id : l.target
    return { source: sourceId, target: targetId }
  })

  const linkEls = g.append('g').attr('class', 'links')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', '#d9d9d9')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.6)

  const nodeEls = g.append('g').attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('cursor', 'pointer')
    .on('click', (_event, d) => {
      emit('node-click', {
        id: d.id,
        name: d.name,
        group: d.group,
        description: d.description,
      })
    })

  nodeEls
    .append('circle')
    .attr('r', (d) => (d.group === 0 ? 30 : d.group === 1 ? 24 : 18))
    .attr('fill', (d) => d._color!)
    .attr('fill-opacity', 0.12)
    .attr('stroke', (d) => d._color!)
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.75)

  nodeEls
    .append('text')
    .attr('dy', (d) => (d.group === 0 ? 46 : d.group === 1 ? 38 : 30))
    .attr('text-anchor', 'middle')
    .attr('fill', '#262626')
    .attr('font-size', (d) => (d.group === 0 ? 13 : 11))
    .attr('font-weight', (d) => (d.group === 0 ? 600 : 400))
    .text((d) => d.name.length > 6 ? d.name.slice(0, 6) + '...' : d.name)

  simulation = d3
    .forceSimulation<SimNode>(nodes)
    .force(
      'link',
      d3.forceLink<SimNode, typeof links[0]>(links).id((d) => d.id).distance(130),
    )
    .force('charge', d3.forceManyBody().strength(-500))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide().radius(55))
    .on('tick', () => {
      linkEls
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      nodeEls.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })
}

const highlightNode = (keyword: string) => {
  const svg = d3.select(svgRef.value!)
  const lower = keyword.toLowerCase()

  // Reset all nodes first (except path nodes)
  svg.selectAll('.nodes g').each(function () {
    const el = d3.select(this)
    const isPathNode = el.classed('path-node')
    const isNonPathNode = el.classed('non-path-node')
    if (isPathNode || isNonPathNode) return // respect learning path state
    el.select('circle')
      .transition().duration(400)
      .attr('fill-opacity', 0.12)
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.75)
  })

  if (!lower) return

  let matchedNodeId: string | null = null
  svg.selectAll('.nodes g').each(function (d: any) {
    const el = d3.select(this)
    const text = el.select('text').text().toLowerCase()
    if (text.includes(lower)) {
      if (!matchedNodeId) matchedNodeId = d.id
      el.select('circle')
        .transition().duration(400)
        .attr('fill-opacity', 0.3)
        .attr('stroke-width', 3)
    }
  })

  if (matchedNodeId) {
    centerOnNodeById(matchedNodeId)
  } else {
    svg.selectAll('.nodes g').each(function () {
      const el = d3.select(this)
      const isPathNode = el.classed('path-node')
      const isNonPathNode = el.classed('non-path-node')
      if (isPathNode || isNonPathNode) return
      el.select('circle')
        .transition().duration(400)
        .attr('fill-opacity', 0.06)
        .attr('stroke-opacity', 0.2)
    })
  }
}

const showLearningPath = (orderedIds: string[]) => {
  if (!svgRef.value) return

  const svg = d3.select(svgRef.value)
  const pathSet = new Set(orderedIds)

  // Build edge set: edges between consecutive nodes in ordered list
  const pathEdgeSet = new Set<string>()
  for (let i = 0; i < orderedIds.length - 1; i++) {
    const a = orderedIds[i]
    const b = orderedIds[i + 1]
    pathEdgeSet.add(`${a}->${b}`)
    pathEdgeSet.add(`${b}->${a}`)
  }

  // Highlight edges
  svg.selectAll('.links line').each(function (d: any) {
    const el = d3.select(this)
    const key1 = `${d.source.id || d.source}->${d.target.id || d.target}`
    const key2 = `${d.target.id || d.target}->${d.source.id || d.source}`
    if (pathEdgeSet.has(key1) || pathEdgeSet.has(key2)) {
      el.transition().duration(500)
        .attr('stroke', '#1890ff')
        .attr('stroke-width', 3)
        .attr('stroke-opacity', 0.85)
    } else {
      el.transition().duration(500)
        .attr('stroke', '#e8e8e8')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.25)
    }
  })

  // Highlight nodes
  svg.selectAll('.nodes g').each(function (d: any) {
    const el = d3.select(this)
    if (pathSet.has(d.id)) {
      el.classed('path-node', true)
      el.classed('non-path-node', false)
      el.select('circle')
        .transition().duration(500)
        .attr('fill-opacity', 0.25)
        .attr('stroke-width', 3)
        .attr('stroke-opacity', 0.95)
        .attr('stroke', '#1890ff')
      el.select('text')
        .transition().duration(500)
        .attr('fill', '#1890ff')
        .attr('font-weight', 600)
    } else {
      el.classed('path-node', false)
      el.classed('non-path-node', true)
      el.select('circle')
        .transition().duration(500)
        .attr('fill-opacity', 0.04)
        .attr('stroke-opacity', 0.15)
      el.select('text')
        .transition().duration(500)
        .attr('fill', '#bfbfbf')
    }
  })
}

const clearLearningPath = () => {
  if (!svgRef.value) return
  const svg = d3.select(svgRef.value)

  svg.selectAll('.links line')
    .transition().duration(300)
    .attr('stroke', '#d9d9d9')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.6)

  svg.selectAll('.nodes g').each(function (d: any) {
    const el = d3.select(this)
    el.classed('path-node', false)
    el.classed('non-path-node', false)
    el.select('circle')
      .transition().duration(300)
      .attr('fill', getColor(d.group))
      .attr('fill-opacity', 0.12)
      .attr('stroke', getColor(d.group))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.75)
    el.select('text')
      .transition().duration(300)
      .attr('fill', '#262626')
      .attr('font-weight', (d: any) => (d.group === 0 ? 600 : 400))
  })
}

const centerOnNodeById = (nodeId: string) => {
  if (!svgRef.value || !containerRef.value || !zoom) return

  const svg = d3.select(svgRef.value)
  let targetNode: any = null
  svg.selectAll('.nodes g').each(function (d: any) {
    if (d.id === nodeId) {
      targetNode = d
    }
  })

  if (!targetNode) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  svg.transition().duration(600).call(
    (zoom as any).transform,
    d3.zoomIdentity.translate(width / 2 - targetNode.x * currentScale, height / 2 - targetNode.y * currentScale).scale(currentScale),
  )
}

const flashNode = (nodeId: string) => {
  if (!svgRef.value) return

  centerOnNodeById(nodeId)

  const svg = d3.select(svgRef.value)
  svg.selectAll('.nodes g').each(function (d: any) {
    const el = d3.select(this)
    if (d.id === nodeId) {
      const isPathNode = el.classed('path-node')
      const restoreColor = isPathNode ? '#1890ff' : getColor(d.group)
      const restoreOpacity = isPathNode ? 0.25 : 0.12
      const restoreStrokeWidth = isPathNode ? 3 : 2

      el.select('circle')
        .transition().duration(200)
        .attr('fill-opacity', 0.4)
        .attr('stroke-width', 4)
        .attr('stroke', '#ff4d4f')
        .transition().duration(200)
        .attr('fill-opacity', restoreOpacity)
        .attr('stroke-width', restoreStrokeWidth)
        .attr('stroke', restoreColor)
        .transition().duration(200)
        .attr('fill-opacity', 0.4)
        .attr('stroke-width', 4)
        .attr('stroke', '#ff4d4f')
        .transition().duration(600)
        .attr('fill-opacity', restoreOpacity)
        .attr('stroke-width', restoreStrokeWidth)
        .attr('stroke', restoreColor)
      el.select('text')
        .transition().duration(200)
        .attr('fill', '#ff4d4f')
        .transition().duration(800)
        .attr('fill', isPathNode ? '#1890ff' : '#262626')
    }
  })
}

const zoomIn = () => {
  if (svgRef.value && zoom) {
    d3.select(svgRef.value).transition().duration(300).call((zoom as any).scaleBy, 1.3)
  }
}

const zoomOut = () => {
  if (svgRef.value && zoom) {
    d3.select(svgRef.value).transition().duration(300).call((zoom as any).scaleBy, 0.7)
  }
}

const zoomReset = () => {
  if (svgRef.value && containerRef.value) {
    const w = containerRef.value.clientWidth
    const h = containerRef.value.clientHeight
    d3.select(svgRef.value).transition().duration(500).call(
      (zoom as any).transform,
      d3.zoomIdentity.translate(w / 2, h / 2),
    )
  }
}

watch(() => props.data, () => render(), { deep: true })

onMounted(() => { render() })

onUnmounted(() => { if (simulation) simulation.stop() })

defineExpose({ highlightNode, zoomIn, zoomOut, zoomReset, showLearningPath, clearLearningPath, centerOnNodeById, flashNode })
</script>

<style scoped>
.kg-chart {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
}

.kg-svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
