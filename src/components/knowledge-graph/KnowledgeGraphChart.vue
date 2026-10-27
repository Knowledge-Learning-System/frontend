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
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceCenter,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'

// ── Props & Emits ──
const props = defineProps<{
  data: { nodes: KnowledgeNode[]; links: KnowledgeLink[] }
  // 初始是否展开全部层级（图谱管理页用于导入后直接展示完整图谱）
  autoExpandAll?: boolean
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

// ── Force-driven layout config ──
const FORCE = {
  linkDistance: 110, // 默认边长（PREREQUISITE 略长、PARENT_KP 略短）
  linkStrength: 0.4, // 弹簧强度
  chargeStrength: -340, // 排斥力
  collidePadding: 10, // 碰撞间隔
  centerStrength: 0.06, // 向心约束，防止整图漂移
}
const getBaseRadius = (group: number): number => (group === 0 ? 35 : 28)
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

// ── Force simulation state ──
interface ForceNode extends SimulationNodeDatum {
  id: string
  name: string
  group: number
  level?: number
  description?: string
  radius: number
}
interface ForceLink extends SimulationLinkDatum<ForceNode> {
  source: string | ForceNode
  target: string | ForceNode
  type: string
}
let simulation: Simulation<ForceNode, ForceLink> | null = null
let fitTimer: ReturnType<typeof setTimeout> | null = null

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

// 层级父子关系：PARENT_KP / BELONGS_TO（知识点归属树）+ HAS_SUBTOPIC（知识域→子主题）+ PART_OF（子主题→知识点）
const isParentLink = (type: string): boolean =>
  type === 'PARENT_KP' || type === 'BELONGS_TO' || type === 'HAS_SUBTOPIC' || type === 'PART_OF'

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

// ── Force simulation ──
function stopSimulation() {
  if (simulation) {
    // 先移除监听再停止，避免旧实例触发 fitToContent
    simulation.on('tick', null)
    simulation.on('end', null)
    simulation.stop()
    simulation = null
  }
  if (fitTimer) {
    clearTimeout(fitTimer)
    fitTimer = null
  }
}

function linkDistance(l: ForceLink): number {
  const base = FORCE.linkDistance
  if (l.type === 'PREREQUISITE') return base * 1.4
  if (l.type === 'PARENT_KP') return base * 0.9
  return base
}

/**
 * 以当前可见节点/链接集合重建 d3-force 力模拟。
 * 可见集合变化（展开/收起/数据替换/容器 resize）时调用：
 * 增删 sim 节点、更新 links，并保留旧坐标热启动。
 */
function buildSimulation() {
  stopSimulation()

  const nodes = visibleNodes.value
  const links = visibleLinks.value
  if (nodes.length === 0) return

  const width = svgSize.width || 800
  const height = svgSize.height || 600
  const oldPos = nodePositions.value

  const simNodes: ForceNode[] = nodes.map(n => ({
    id: n.id,
    name: n.name,
    group: n.group,
    level: n.level,
    description: n.description,
    radius: getBaseRadius(n.group),
    // 已有节点保留原坐标作为热启动；新节点在视口中心附近随机散布
    x: oldPos[n.id] ? oldPos[n.id]!.x : width / 2 + (Math.random() - 0.5) * 80,
    y: oldPos[n.id] ? oldPos[n.id]!.y : height / 2 + (Math.random() - 0.5) * 80,
  }))

  const simLinks: ForceLink[] = links.map(l => ({
    source: l.source,
    target: l.target,
    type: l.type,
  }))

  const sim = forceSimulation<ForceNode, ForceLink>(simNodes)
    .force(
      'link',
      forceLink<ForceNode, ForceLink>(simLinks)
        .id(d => d.id)
        .distance(linkDistance)
        .strength(FORCE.linkStrength)
    )
    .force('charge', forceManyBody<ForceNode>().strength(FORCE.chargeStrength))
    .force(
      'collide',
      forceCollide<ForceNode>().radius(d => d.radius + FORCE.collidePadding)
    )
    .force('center', forceCenter<ForceNode>(width / 2, height / 2))
    .force('x', forceX<ForceNode>(width / 2).strength(FORCE.centerStrength))
    .force('y', forceY<ForceNode>(height / 2).strength(FORCE.centerStrength))

  simulation = sim

  // 每帧 tick 同步坐标到响应式 nodePositions，驱动 SVG 渲染
  sim.on('tick', () => {
    const pos: Record<string, { x: number; y: number }> = {}
    for (const node of simNodes) {
      pos[node.id] = { x: node.x ?? 0, y: node.y ?? 0 }
    }
    nodePositions.value = pos
  })

  // 收敛后自动适配视口（fitToContent）
  sim.on('end', () => {
    fitToContent()
  })

  sim.alpha(0.5).restart()

  // 兜底：即使 alpha 未完全收敛，也保证图稳定后 fit 一次
  fitTimer = setTimeout(() => {
    if (simulation === sim) fitToContent()
  }, 2500)
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

  // 可见集合变化由下方 watch([expandedNodes, visibleNodeIds]) 驱动重建力模拟
}

// ── Event Handlers ──
const handleNodeClick = (node: KnowledgeNode, event: MouseEvent) => {
  event.stopPropagation()

  // 新交互：单击节点仅负责“展开下一级”。
  // 有下一级（子级）且未展开 → 展开显示下一级；
  // 已展开 → 保持展开，不再收拢、不再定位高亮；
  // 没有下一级 → 不做任何动作，节点保持不变（进入课程交给双击）。
  const hasChildren = (hasChildrenMap.value.get(node.id)?.length ?? 0) > 0
  if (!hasChildren) return
  if (!expandedNodes.value.has(node.id)) {
    toggleNode(node.id)
  }
}

const handleIndicatorClick = (nodeId: string) => {
  toggleNode(nodeId)
}

const handleNodeDblClick = (nodeId: string, event: MouseEvent) => {
  event.stopPropagation()
  // 新交互：双击节点进入该节点对应的课程。
  // 复用父组件 CourseDetail.vue 现有 @node-click="handleGraphNodeClick" → selectKpFromGraph
  // 的“进入课程/展示该知识点资源”机制，不发明新路由。
  // 保留 node-dblclick 发射以维持原有对外契约（父组件当前未绑定，无副作用）。
  emit('node-click', nodeId)
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
  fitToContent()
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
function applyInitialExpand() {
  if (!props.autoExpandAll) return
  for (const l of parsedLinks.value) {
    if (isParentLink(l.type)) expandedNodes.value.add(l.source)
  }
}

watch(
  () => props.data,
  () => {
    expandedNodes.value = new Set()
    applyInitialExpand()
    nodePositions.value = {}
    learningPathNodeIds.value = new Set()
    learningPathEdgeSet.value = new Set()
    searchKeyword.value = ''
    nextTick(() => buildSimulation())
  },
  { deep: true }
)

// 仅当可见集合（展开/收起）变化时重建模拟，坐标变化由 simulation tick 驱动
watch(
  [expandedNodes, visibleNodeIds],
  () => {
    nextTick(() => buildSimulation())
  },
  { deep: true }
)

// ── Lifecycle ──
onMounted(() => {
  nextTick(() => {
    // 首次挂载也应用初始展开（autoExpandAll），否则初始只显示根节点
    expandedNodes.value = new Set()
    applyInitialExpand()
    if (updateSvgSize()) {
      buildSimulation()
    }

    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          if (updateSvgSize()) {
            // Re-run force simulation on resize（保留当前展开状态，热启动）
            nodePositions.value = {}
            buildSimulation()
          }
        }, 100)
      })
      resizeObserver.observe(containerRef.value)
    }
  })
})

onBeforeUnmount(() => {
  nodePositions.value = {}
  stopSimulation()
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
