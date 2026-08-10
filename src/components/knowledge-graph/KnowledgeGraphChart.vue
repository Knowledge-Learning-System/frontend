<template>
  <div ref="containerRef" class="kg-chart">
    <svg
      ref="svgRef"
      class="kg-svg"
      :width="svgSize.width"
      :height="svgSize.height"
      @wheel.prevent="handleWheel"
      @mousedown="handleSvgMouseDown"
    >
      <defs>
        <filter id="glow-active">
          <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#1890ff" flood-opacity="0.8" />
        </filter>
        <filter id="glow-hover">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#fff" flood-opacity="0.8" />
        </filter>
        <marker
          id="arrowhead"
          viewBox="0 0 10 8"
          refX="10"
          refY="4"
          markerWidth="8"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0 L10,4 L0,8 Z" fill="#bae6fd" />
        </marker>
      </defs>

      <g :transform="zoomTransform">
        <!-- Links -->
        <g class="links">
          <line
            v-for="link in layoutLinks"
            :key="`${link.source}-${link.target}`"
            :x1="link.x1"
            :y1="link.y1"
            :x2="link.x2"
            :y2="link.y2"
            :stroke="getLinkStroke(link)"
            :stroke-width="getLinkStrokeWidth(link)"
            :stroke-opacity="getLinkOpacity(link)"
            :stroke-dasharray="getLinkDash(link)"
            :marker-end="link.type === 'PARENT_KP' ? 'url(#arrowhead)' : undefined"
          />
        </g>

        <!-- Nodes -->
        <g
          v-for="node in layoutNodes"
          :key="node.id"
          class="node-group"
          :class="{
            'node-flash': flashingNodeIds.has(node.id),
            'path-node': isPathNode(node.id),
            'non-path-node': isNonPathNode(node.id),
            'search-dim': isSearchDimNode(node.id),
          }"
          :style="{ cursor: 'pointer' }"
          :transform="`translate(${node.x}, ${node.y})`"
          @click.stop="handleNodeClick(node, $event)"
          @dblclick.stop="handleNodeDblClick(node.id, $event)"
          @mouseover="handleNodeMouseOver(node, $event)"
          @mouseout="handleNodeMouseOut"
        >
          <circle
            class="node-circle"
            :r="getNodeRadius(node)"
            :fill="getNodeFill(node)"
            fill-opacity="0.25"
            :stroke="getNodeStroke(node)"
            :stroke-width="getNodeStrokeWidth(node)"
            :stroke-opacity="getNodeStrokeOpacity(node)"
            :filter="getNodeFilter(node)"
          />
          <text
            class="node-label"
            :dy="node.group === 0 ? 50 : 42"
            text-anchor="middle"
            :fill="getLabelFill(node)"
            font-size="14px"
            :font-weight="node.group === 0 ? 600 : 400"
          >{{ truncateName(node.name) }}</text>
          <!-- Expand/Collapse indicator -->
          <g v-if="hasChildrenMap.get(node.id)?.length" class="expand-indicator" @click.stop="handleIndicatorClick(node.id)">
            <!-- 增大透明点击区域 -->
            <circle
              :cy="-(getNodeRadius(node) + 12)"
              r="14"
              fill="transparent"
              stroke="none"
            />
            <circle
              :cy="-(getNodeRadius(node) + 12)"
              r="9"
              fill="#fff"
              stroke="#8c8c8c"
              stroke-width="1.5"
            />
            <text
              :y="-(getNodeRadius(node) + 12) + 4"
              text-anchor="middle"
              font-size="12"
              fill="#595959"
              font-weight="bold"
              pointer-events="none"
            >{{ expandedNodes.has(node.id) ? '−' : '+' }}</text>
          </g>
        </g>
      </g>
    </svg>

    <!-- Tooltip -->
    <div
      v-if="tooltip.visible"
      class="node-tooltip"
      :style="{ left: tooltip.left + 'px', top: tooltip.top + 'px' }"
    >
      <div class="tooltip-name">{{ tooltip.name }}</div>
      <div v-if="tooltip.desc" class="tooltip-desc">{{ tooltip.desc }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { KnowledgeNode, KnowledgeLink } from '@/types/knowledgeGraph'

// ── Props & Emits ──
const props = defineProps<{
  data: { nodes: KnowledgeNode[]; links: KnowledgeLink[] }
}>()

const emit = defineEmits<{
  (e: 'node-click', nodeId: string): void
  (e: 'node-dblclick', nodeId: string): void
}>()

// ── Template Refs ──
const svgRef = ref<SVGSVGElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

// ── Constants ──
const groupColors: Record<number, string> = {
  0: '#f97316',
  1: '#52c41a',
  2: '#722ed1',
  3: '#faad14',
  4: '#13c2c2',
  5: '#eb2f96',
  6: '#2f54eb',
  7: '#a0d911',
}
const DEFAULT_COLOR = '#a0d911'
const getColor = (group: number): string => groupColors[group] ?? DEFAULT_COLOR

// ── Per-level layout config (group 0-3) ──
const LEVEL_CONFIG: Record<number, { ringRadius: number; expandOffset: number }> = {
  0: { ringRadius: 200, expandOffset: 840 },  // 一级：根节点
  1: { ringRadius: 140, expandOffset: 160 },  // 二级：子节点
  2: { ringRadius: 100, expandOffset: 160 },  // 三级：孙节点
  3: { ringRadius: 90, expandOffset: 140 },  // 四级：曾孙节点
}
const FALLBACK_CONFIG = { ringRadius: 80, expandOffset: 120 }

function getLevelRingRadius(group: number): number {
  return LEVEL_CONFIG[group]?.ringRadius ?? FALLBACK_CONFIG.ringRadius
}
function getLevelExpandOffset(group: number): number {
  return LEVEL_CONFIG[group]?.expandOffset ?? FALLBACK_CONFIG.expandOffset
}
const MIN_ZOOM = 0.2
const MAX_ZOOM = 3

// ── SVG Size ──
const svgSize = reactive({ width: 800, height: 600 })

// ── Zoom State ──
const zoom = reactive({ x: 0, y: 0, scale: 1 })
const zoomTransform = computed(() => `translate(${zoom.x}, ${zoom.y}) scale(${zoom.scale})`)

// ── Drag state ──
let isDragging = false
let dragStart = { x: 0, y: 0 }
let dragZoomStart = { x: 0, y: 0 }

// ── Core State ──
const expandedNodes = ref(new Set<string>())
const nodePositions = ref<Record<string, { x: number; y: number }>>({})
const activeNodeId = ref<string | null>(null)
const hoverNodeId = ref<string | null>(null)
let activeTimeout: ReturnType<typeof setTimeout> | null = null

// ── Tooltip ──
const tooltip = ref({
  visible: false,
  name: '',
  desc: '',
  left: 0,
  top: 0,
})

// ── Highlight / Path / Flash State ──
const searchKeyword = ref('')
const learningPathNodeIds = ref<Set<string>>(new Set())
const learningPathEdgeSet = ref<Set<string>>(new Set())
const flashingNodeIds = ref<Set<string>>(new Set())

// ── Computed: parsed links, maps ──
interface TypedLink {
  source: string
  target: string
  type: string
}

const parsedLinks = computed<TypedLink[]>(() =>
  props.data.links.map(l => ({ source: l.source, target: l.target, type: l.type || '' }))
)

const isParentLink = (type: string): boolean => type === 'PARENT_KP' || type === 'BELONGS_TO'

const childrenMap = computed(() => {
  const map = new Map<string, string[]>()
  for (const l of parsedLinks.value) {
    if (isParentLink(l.type)) {
      if (!map.has(l.source)) map.set(l.source, [])
      map.get(l.source)!.push(l.target)
    }
  }
  return map
})

const hasChildrenMap = computed(() => {
  const set = new Map<string, string[]>()
  for (const l of parsedLinks.value) {
    if (isParentLink(l.type)) {
      if (!set.has(l.source)) set.set(l.source, [])
      set.get(l.source)!.push(l.target)
    }
  }
  return set
})

const nodeMap = computed(() => {
  const map = new Map<string, KnowledgeNode>()
  for (const n of props.data.nodes) map.set(n.id, n)
  return map
})

// ── Computed: visibility ──
const visibleNodeIds = computed(() => {
  const allLinks = parsedLinks.value
  const expanded = expandedNodes.value
  const set = new Set<string>()

  // Root: group=0 nodes
  const roots = props.data.nodes.filter(n => n.group === 0).map(n => n.id)

  // Fallback: if no group=0, use nodes not targeted by PARENT_KP
  const rootIds =
    roots.length > 0
      ? roots
      : (() => {
          const targeted = new Set(allLinks.filter(l => l.type === 'PARENT_KP').map(l => l.target))
          return props.data.nodes.filter(n => !targeted.has(n.id)).map(n => n.id)
        })()

  const cm = childrenMap.value
  const queue = [...rootIds]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (set.has(current)) continue
    set.add(current)
    if (expanded.has(current)) {
      const children = cm.get(current) || []
      for (const c of children) {
        if (!set.has(c)) queue.push(c)
      }
    }
  }

  return set
})

const visibleNodes = computed(() =>
  props.data.nodes.filter(n => visibleNodeIds.value.has(n.id))
)

const visibleLinks = computed(() =>
  parsedLinks.value.filter(
    l => visibleNodeIds.value.has(l.source) && visibleNodeIds.value.has(l.target)
  )
)

// ── Computed: layout nodes with positions ──
const layoutNodes = computed(() =>
  visibleNodes.value.map(n => ({
    ...n,
    x: nodePositions.value[n.id]?.x ?? 0,
    y: nodePositions.value[n.id]?.y ?? 0,
  }))
)

const layoutLinks = computed(() =>
  visibleLinks.value.map(l => ({
    ...l,
    x1: nodePositions.value[l.source]?.x ?? 0,
    y1: nodePositions.value[l.source]?.y ?? 0,
    x2: nodePositions.value[l.target]?.x ?? 0,
    y2: nodePositions.value[l.target]?.y ?? 0,
  }))
)

// ── Computed: search highlights ──
const isSearchDimNode = (nodeId: string): boolean => {
  if (!searchKeyword.value) return false
  // Only dim if no learning path is active and keyword doesn't match
  if (learningPathNodeIds.value.size > 0) return false
  const node = nodeMap.value.get(nodeId)
  if (!node) return false
  const lower = searchKeyword.value.toLowerCase()
  return !node.name.toLowerCase().includes(lower)
}

// ── Computed: learning path ──
const isPathNode = (nodeId: string): boolean => learningPathNodeIds.value.has(nodeId)
const isNonPathNode = (nodeId: string): boolean => {
  return learningPathNodeIds.value.size > 0 && !learningPathNodeIds.value.has(nodeId)
}

// ── Link styling ──
const getLinkStroke = (link: TypedLink): string => {
  const key = `${link.source}->${link.target}`
  if (learningPathEdgeSet.value.has(key)) return '#1890ff'
  if (link.type === 'PARENT_KP') return '#bae6fd'
  if (link.type === 'PREREQUISITE') return '#8c8c8c'
  return '#bfbfbf'
}

const getLinkStrokeWidth = (link: TypedLink): number => {
  const key = `${link.source}->${link.target}`
  if (learningPathEdgeSet.value.has(key)) return 3
  return link.type === 'PARENT_KP' ? 2 : 1.2
}

const getLinkOpacity = (link: TypedLink): number => {
  if (learningPathNodeIds.value.size > 0) {
    const key = `${link.source}->${link.target}`
    return learningPathEdgeSet.value.has(key) ? 0.85 : 0.25
  }
  return link.type === 'PARENT_KP' ? 0.6 : 0.5
}

const getLinkDash = (link: TypedLink): string | undefined => {
  if (link.type === 'PREREQUISITE') return '6,3'
  if (link.type === 'BELONGS_TO') return '4,6'
  return undefined
}

// ── Node styling ──
const getNodeRadius = (node: KnowledgeNode): number => {
  let r = node.group === 0 ? 35 : 28
  if (activeNodeId.value === node.id) r *= 1.5
  else if (hoverNodeId.value === node.id) r *= 1.2
  return r
}

const getNodeFill = (node: KnowledgeNode): string => getColor(node.group)
const getNodeStroke = (node: KnowledgeNode): string => {
  if (isPathNode(node.id)) return '#1890ff'
  return getColor(node.group)
}
const getNodeStrokeWidth = (node: KnowledgeNode): number => {
  if (isPathNode(node.id)) return 3
  return 2
}
const getNodeStrokeOpacity = (node: KnowledgeNode): number => {
  if (isNonPathNode(node.id)) return 0.2
  return 0.85
}
const getNodeFilter = (node: KnowledgeNode): string => {
  if (activeNodeId.value === node.id) return 'url(#glow-active)'
  if (hoverNodeId.value === node.id) return 'url(#glow-hover)'
  return 'none'
}
const getLabelFill = (node: KnowledgeNode): string => {
  if (isPathNode(node.id)) return '#1890ff'
  if (isNonPathNode(node.id)) return '#bfbfbf'
  if (isSearchDimNode(node.id)) return '#bfbfbf'
  return '#262626'
}
const truncateName = (name: string): string => (name.length > 8 ? name.slice(0, 8) + '...' : name)

// ── Layout computation ──
function computeLayout() {
  const positions: Record<string, { x: number; y: number }> = { ...nodePositions.value }
  const centerX = svgSize.width / 2
  const centerY = svgSize.height / 2
  const allLinks = parsedLinks.value
  const cm = childrenMap.value
  const expanded = expandedNodes.value
  const visible = visibleNodeIds.value

  // 1. Root nodes (group=0): evenly on circle
  const roots = props.data.nodes.filter(n => n.group === 0)
  const rootIds =
    roots.length > 0
      ? roots
      : (() => {
          const targeted = new Set(allLinks.filter(l => l.type === 'PARENT_KP').map(l => l.target))
          return props.data.nodes.filter(n => !targeted.has(n.id))
        })()

  rootIds.forEach((node, i) => {
    const angle = (i / rootIds.length) * 2 * Math.PI - Math.PI / 2
    const ringR = getLevelRingRadius(node.group)
    const offsetR = getLevelExpandOffset(node.group)
    const radius = expanded.has(node.id) ? ringR + offsetR : ringR
    positions[node.id] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  })

  // 2. BFS from expanded roots: position children layer by layer
  const queue = rootIds.filter(n => expanded.has(n.id)).map(n => n.id)
  const processed = new Set<string>()

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    if (processed.has(nodeId)) continue
    processed.add(nodeId)

    const parentPos = positions[nodeId]
    if (!parentPos) continue

    const children = (cm.get(nodeId) || []).filter(id => visible.has(id))
    children.forEach((childId, i) => {
      const childNode = nodeMap.value.get(childId)
      const angle = (i / children.length) * 2 * Math.PI - Math.PI / 2
      const ringR = childNode ? getLevelRingRadius(childNode.group) : FALLBACK_CONFIG.ringRadius
      const offsetR = childNode ? getLevelExpandOffset(childNode.group) : FALLBACK_CONFIG.expandOffset
      const radius = expanded.has(childId) ? ringR + offsetR : ringR
      positions[childId] = {
        x: parentPos.x + Math.cos(angle) * radius,
        y: parentPos.y + Math.sin(angle) * radius,
      }
      if (expanded.has(childId) && !processed.has(childId)) {
        queue.push(childId)
      }
    })
  }

  // 3. Fallback for any remaining visible nodes without position
  for (const node of props.data.nodes) {
    if (visible.has(node.id) && !positions[node.id]) {
      positions[node.id] = {
        x: centerX + (Math.random() - 0.5) * 60,
        y: centerY + (Math.random() - 0.5) * 60,
      }
    }
  }

  nodePositions.value = positions
}

// ── Expand / Collapse ──
function toggleNode(nodeId: string) {
  const cm = childrenMap.value
  const children = cm.get(nodeId) || []

  if (children.length === 0) return

  if (expandedNodes.value.has(nodeId)) {
    // Collapse: remove node and all descendants
    const descendants = new Set<string>()
    const collect = (id: string) => {
      const kids = cm.get(id) || []
      for (const k of kids) {
        descendants.add(k)
        collect(k)
      }
    }
    collect(nodeId)

    const newSet = new Set(expandedNodes.value)
    newSet.delete(nodeId)
    for (const d of descendants) newSet.delete(d)

    // Also remove positions for collapsed nodes (optional, to recalculate on re-expand)
    const newPositions = { ...nodePositions.value }
    for (const d of descendants) delete newPositions[d]
    nodePositions.value = newPositions

    expandedNodes.value = newSet
  } else {
    // Expand
    expandedNodes.value = new Set([...expandedNodes.value, nodeId])
  }

  // Compute layout for new positions
  nextTick(() => computeLayout())
}

// ── Event Handlers ──
const handleNodeClick = (node: KnowledgeNode, event: MouseEvent) => {
  event.stopPropagation()

  const hasChildren = (hasChildrenMap.value.get(node.id)?.length ?? 0) > 0
  const isExpanded = expandedNodes.value.has(node.id)

  // 未展开且有子节点 → 仅展开，不触发定位
  if (hasChildren && !isExpanded) {
    toggleNode(node.id)
    return
  }

  // 已展开或无子节点 → 走定位逻辑
  if (activeTimeout) clearTimeout(activeTimeout)
  if (activeNodeId.value === node.id) {
    activeNodeId.value = null
  } else {
    activeNodeId.value = node.id
    activeTimeout = setTimeout(() => {
      activeNodeId.value = null
      activeTimeout = null
    }, 2000)
  }

  // 已展开节点再点击：收拢
  if (hasChildren && isExpanded) {
    toggleNode(node.id)
  }

  emit('node-click', node.id)
}

const handleIndicatorClick = (nodeId: string) => {
  toggleNode(nodeId)
}

const handleNodeDblClick = (nodeId: string, event: MouseEvent) => {
  event.stopPropagation()
  emit('node-dblclick', nodeId)
}

const handleNodeMouseOver = (node: KnowledgeNode, event: MouseEvent) => {
  hoverNodeId.value = node.id
  const containerRect = containerRef.value?.getBoundingClientRect()
  if (containerRect) {
    tooltip.value = {
      visible: true,
      name: node.name,
      desc: (node as any).description ?? '',
      left: event.clientX - containerRect.left + 12,
      top: event.clientY - containerRect.top - 12,
    }
  }
}

const handleNodeMouseOut = () => {
  hoverNodeId.value = null
  tooltip.value.visible = false
}

// ── Zoom: Wheel ──
const handleWheel = (event: WheelEvent) => {
  const containerRect = containerRef.value?.getBoundingClientRect()
  if (!containerRect) return

  const delta = event.deltaY > 0 ? 0.92 : 1.08
  const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.scale * delta))

  // Zoom toward cursor position
  const mouseX = event.clientX - containerRect.left
  const mouseY = event.clientY - containerRect.top
  const scaleChange = newScale / zoom.scale

  zoom.x = mouseX - (mouseX - zoom.x) * scaleChange
  zoom.y = mouseY - (mouseY - zoom.y) * scaleChange
  zoom.scale = newScale
}

// ── Zoom: Pan (drag on SVG background) ──
const handleSvgMouseDown = (event: MouseEvent) => {
  // Only drag on background (SVG element itself, not on nodes)
  if ((event.target as Element).closest('.node-group')) return

  isDragging = true
  dragStart = { x: event.clientX, y: event.clientY }
  dragZoomStart = { x: zoom.x, y: zoom.y }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    zoom.x = dragZoomStart.x + (e.clientX - dragStart.x)
    zoom.y = dragZoomStart.y + (e.clientY - dragStart.y)
  }

  const onMouseUp = () => {
    isDragging = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

// ── Initial zoom fit ──
function fitToContent() {
  const rect = containerRef.value?.getBoundingClientRect()
  if (!rect || rect.width === 0) return
  const w = rect.width
  const h = rect.height

  const positions = Object.values(nodePositions.value)
  if (positions.length === 0) return

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const p of positions) {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  }

  const contentW = maxX - minX + 200
  const contentH = maxY - minY + 200
  const scaleX = w / contentW
  const scaleY = h / contentH
  const fitScale = Math.min(scaleX, scaleY, 1.2)

  zoom.x = w / 2 - ((minX + maxX) / 2) * fitScale
  zoom.y = h / 2 - ((minY + maxY) / 2) * fitScale
  zoom.scale = fitScale
}

// ── Public Methods ──

const highlightNode = (keyword: string) => {
  searchKeyword.value = keyword
}

const zoomIn = () => {
  zoom.scale = Math.min(MAX_ZOOM, zoom.scale * 1.3)
}

const zoomOut = () => {
  zoom.scale = Math.max(MIN_ZOOM, zoom.scale * 0.7)
}

const zoomReset = () => {
  zoom.x = 0
  zoom.y = 0
  zoom.scale = 1
}

const centerOnNodeById = (nodeId: string) => {
  const pos = nodePositions.value[nodeId]
  if (!pos || !containerRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  zoom.x = w / 2 - pos.x * zoom.scale
  zoom.y = h / 2 - pos.y * zoom.scale
}

const flashNode = (nodeId: string) => {
  flashingNodeIds.value = new Set([...flashingNodeIds.value, nodeId])
  setTimeout(() => {
    const next = new Set(flashingNodeIds.value)
    next.delete(nodeId)
    flashingNodeIds.value = next
  }, 2000)
}

const showLearningPath = (orderedIds: string[]) => {
  const nodeSet = new Set(orderedIds)
  const edgeSet = new Set<string>()
  for (let i = 0; i < orderedIds.length - 1; i++) {
    edgeSet.add(`${orderedIds[i]}->${orderedIds[i + 1]}`)
    edgeSet.add(`${orderedIds[i + 1]}->${orderedIds[i]}`)
  }
  learningPathNodeIds.value = nodeSet
  learningPathEdgeSet.value = edgeSet
}

const clearLearningPath = () => {
  learningPathNodeIds.value = new Set()
  learningPathEdgeSet.value = new Set()
}

defineExpose({
  highlightNode,
  zoomIn,
  zoomOut,
  zoomReset,
  showLearningPath,
  clearLearningPath,
  centerOnNodeById,
  flashNode,
})

// ── Resize Observer ──
let resizeObserver: ResizeObserver | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null

function updateSvgSize() {
  if (!containerRef.value) return
  const w = containerRef.value.clientWidth
  const h = containerRef.value.clientHeight
  if (w > 0 && h > 0) {
    svgSize.width = w
    svgSize.height = h
    return true
  }
  return false
}

// ── Watchers ──
watch(
  () => props.data,
  () => {
    expandedNodes.value = new Set()
    nodePositions.value = {}
    learningPathNodeIds.value = new Set()
    learningPathEdgeSet.value = new Set()
    searchKeyword.value = ''
    nextTick(() => {
      computeLayout()
      nextTick(() => fitToContent())
    })
  },
  { deep: true }
)

watch(expandedNodes, () => {
  nextTick(() => computeLayout())
}, { deep: true })

// ── Lifecycle ──
onMounted(() => {
  nextTick(() => {
    if (updateSvgSize()) {
      computeLayout()
    }

    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          if (updateSvgSize()) {
            // Re-layout on resize
            nodePositions.value = {}
            expandedNodes.value = new Set()
            computeLayout()
          }
        }, 100)
      })
      resizeObserver.observe(containerRef.value)
    }

    nextTick(() => fitToContent())
  })
})

onBeforeUnmount(() => {
  nodePositions.value = {}
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (resizeTimer) {
    clearTimeout(resizeTimer)
    resizeTimer = null
  }
  if (activeTimeout) {
    clearTimeout(activeTimeout)
    activeTimeout = null
  }
})
</script>

<style scoped>
.kg-chart {
  width: 100%;
  height: 100%;
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
}

.kg-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.node-tooltip {
  position: absolute;
  z-index: 100;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  white-space: nowrap;
}

.tooltip-name {
  font-weight: 600;
}

.tooltip-desc {
  margin-top: 2px;
  opacity: 0.8;
  font-size: 11px;
}

/* ── Node animations ── */
.node-group {
  animation: node-enter 0.35s ease-out;
  transition: transform 0.4s ease;
}

@keyframes node-enter {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.node-circle {
  transition: r 0.2s ease, fill 0.2s ease, stroke 0.2s ease, stroke-width 0.3s ease, stroke-opacity 0.3s ease;
}

.node-label {
  transition: fill 0.3s ease, font-weight 0.3s ease;
  user-select: none;
  pointer-events: none;
}

/* ── Flash animation ── */
.node-flash .node-circle {
  animation: flash-pulse 0.7s ease-in-out 3;
}

@keyframes flash-pulse {
  0%,
  100% {
    fill-opacity: 0.25;
    stroke-width: 2;
    stroke: inherit;
  }
  50% {
    fill-opacity: 0.5;
    stroke-width: 4;
    stroke: #ff4d4f;
  }
}

.node-flash .node-label {
  animation: flash-label 0.7s ease-in-out 3;
}

@keyframes flash-label {
  0%,
  100% {
    fill: #262626;
  }
  50% {
    fill: #ff4d4f;
  }
}

/* ── Links transition ── */
.links line {
  transition: stroke 0.4s ease, stroke-width 0.4s ease, stroke-opacity 0.4s ease;
}

/* ── Expand indicator ── */
.expand-indicator {
  pointer-events: none;
}
</style>
（内容由AI生成，仅供参考）
