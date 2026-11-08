<template>
  <div ref="containerRef" class="kg-chart">
    <div ref="chartRef" class="kg-canvas"></div>

    <!-- 关系图例 -->
    <div v-if="legendItems.length" class="kg-legend">
      <div v-for="item in legendItems" :key="item.label" class="kg-legend-item">
        <i class="kg-legend-line" :class="item.lineClass"></i>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <!-- 操作提示 -->
    <div class="kg-hint">滚轮缩放 · 拖拽平移 · 单击展开 · 双击进入课程</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import type { KnowledgeLink, KnowledgeNode } from '@/types/knowledgeGraph'

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
const containerRef = ref<HTMLDivElement | null>(null)
const chartRef = ref<HTMLDivElement | null>(null)

let chartInstance: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let flashTimer: ReturnType<typeof setInterval> | null = null
let centerTimer: ReturnType<typeof setTimeout> | null = null
let fitTimer: ReturnType<typeof setTimeout> | null = null

// ── 配色 ──
const GROUP_COLORS: Record<number, string> = {
  0: '#ff7a45',
  1: '#36cfc9',
  2: '#597ef7',
  3: '#b37feb',
  4: '#ffc53d',
  5: '#ff85c0',
  6: '#73d13d',
  7: '#40a9ff',
}
const DEFAULT_COLOR = '#8fa3bf'

const getColor = (group: number): string => GROUP_COLORS[group] ?? DEFAULT_COLOR

type LinkMeta = { label: string; color: string; dashed: boolean }

const LINK_META: Record<string, LinkMeta> = {
  PARENT_KP: { label: '层级关系', color: '#4dabf7', dashed: false },
  PREREQUISITE: { label: '前置依赖', color: '#94a3b8', dashed: true },
  BELONGS_TO: { label: '归属关系', color: '#a78bfa', dashed: true },
  HAS_SUBTOPIC: { label: '归属关系', color: '#a78bfa', dashed: true },
  PART_OF: { label: '归属关系', color: '#a78bfa', dashed: true },
}
const DEFAULT_LINK_META: LinkMeta = { label: '关联关系', color: '#cbd5e1', dashed: false }

const getLinkMeta = (type: string): LinkMeta => LINK_META[type] ?? DEFAULT_LINK_META

// 层级父子关系：PARENT_KP / BELONGS_TO（知识点归属树）+ HAS_SUBTOPIC（知识域→子主题）+ PART_OF（子主题→知识点）
const isParentLink = (type: string): boolean =>
  type === 'PARENT_KP' || type === 'BELONGS_TO' || type === 'HAS_SUBTOPIC' || type === 'PART_OF'

const MIN_ZOOM = 0.3
const MAX_ZOOM = 3

// ECharts 内部结构的最小类型声明（用于读取力布局坐标 / 当前缩放）
interface GraphSeriesInternal {
  preservedPoints?: Record<string, number[]>
  getData?: () => {
    getItemLayout?: (index: number) => number[] | number[][] | undefined
  }
}
interface GraphModelInternal {
  getSeriesByIndex?: (index: number) => GraphSeriesInternal | undefined
}
interface ChartInternal {
  getModel?: () => GraphModelInternal | undefined
}
interface TooltipParams {
  dataType?: string
  data?: {
    relType?: string
    sourceName?: string
    targetName?: string
    name?: string
    desc?: string
    group?: number
    kpId?: string
  }
}
interface SeriesSnapshot {
  zoom?: number
}
interface GraphEventParams {
  dataType?: string
  data?: unknown
}
interface GraphNodeEventData {
  kpId?: string
}

// ── 颜色工具 ──
function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mixWithWhite(hex: string, ratio: number): string {
  const normalized = hex.replace('#', '')
  const mix = (channel: number) => Math.round(channel + (255 - channel) * ratio)
  const r = mix(parseInt(normalized.slice(0, 2), 16))
  const g = mix(parseInt(normalized.slice(2, 4), 16))
  const b = mix(parseInt(normalized.slice(4, 6), 16))
  return `rgb(${r}, ${g}, ${b})`
}

function makeRadialColor(hex: string, strong: boolean): Record<string, unknown> {
  return {
    type: 'radial',
    x: 0.35,
    y: 0.3,
    r: 0.85,
    colorStops: [
      { offset: 0, color: mixWithWhite(hex, strong ? 0.6 : 0.5) },
      { offset: 0.65, color: hex },
      { offset: 1, color: withAlpha(hex, 0.85) },
    ],
  }
}

// ── 面包屑式 HTML 转义（tooltip 内使用） ──
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── 核心状态 ──
const expandedNodes = ref(new Set<string>())
const searchKeyword = ref('')
const learningPathNodeIds = ref(new Set<string>())
const learningPathEdgeSet = ref(new Set<string>())

// ── Computed：解析后的链接与映射 ──
const parsedLinks = computed(() =>
  props.data.links.map(l => ({ source: l.source, target: l.target, type: l.type || '' }))
)

const nodeMap = computed(() => {
  const map = new Map<string, KnowledgeNode>()
  for (const n of props.data.nodes) map.set(n.id, n)
  return map
})

const childrenMap = computed(() => {
  const map = new Map<string, string[]>()
  for (const l of parsedLinks.value) {
    if (!isParentLink(l.type)) continue
    if (!map.has(l.source)) map.set(l.source, [])
    map.get(l.source)!.push(l.target)
  }
  return map
})

const parentMap = computed(() => {
  const map = new Map<string, string>()
  for (const l of parsedLinks.value) {
    if (!isParentLink(l.type)) continue
    if (!map.has(l.target)) map.set(l.target, l.source)
  }
  return map
})

// ── Computed：可见节点 / 链接 ──
const visibleNodeIds = computed(() => {
  const allLinks = parsedLinks.value
  const expanded = expandedNodes.value
  const set = new Set<string>()

  // 根节点：group=0；若没有 group=0，则回退为「没有被 PARENT_KP 指向」的节点
  const roots = props.data.nodes.filter(n => n.group === 0).map(n => n.id)
  const rootIds =
    roots.length > 0
      ? roots
      : (() => {
          const targeted = new Set(
            allLinks.filter(l => l.type === 'PARENT_KP').map(l => l.target)
          )
          return props.data.nodes.filter(n => !targeted.has(n.id)).map(n => n.id)
        })()

  const cm = childrenMap.value
  const queue = [...rootIds]

  while (queue.length > 0) {
    const current = queue.shift()!
    if (set.has(current)) continue
    set.add(current)
    if (expanded.has(current)) {
      for (const child of cm.get(current) || []) {
        if (!set.has(child)) queue.push(child)
      }
    }
  }

  return set
})

const visibleNodes = computed(() => props.data.nodes.filter(n => visibleNodeIds.value.has(n.id)))

const visibleLinks = computed(() =>
  parsedLinks.value.filter(
    l => visibleNodeIds.value.has(l.source) && visibleNodeIds.value.has(l.target)
  )
)

const legendItems = computed(() => {
  const types = new Set(parsedLinks.value.map(l => l.type))
  const items: Array<{ label: string; lineClass: string }> = []
  if (types.has('PARENT_KP')) {
    items.push({ label: '层级关系', lineClass: 'line-solid' })
  }
  if (types.has('PREREQUISITE')) {
    items.push({ label: '前置依赖', lineClass: 'line-dashed' })
  }
  if (types.has('BELONGS_TO') || types.has('HAS_SUBTOPIC') || types.has('PART_OF')) {
    items.push({ label: '归属关系', lineClass: 'line-dotted' })
  }
  return items
})

// ── 状态判断 ──
const isPathNode = (nodeId: string): boolean => learningPathNodeIds.value.has(nodeId)
const isNonPathNode = (nodeId: string): boolean =>
  learningPathNodeIds.value.size > 0 && !learningPathNodeIds.value.has(nodeId)
const isSearchDimNode = (nodeId: string): boolean => {
  if (!searchKeyword.value) return false
  if (learningPathNodeIds.value.size > 0) return false
  const node = nodeMap.value.get(nodeId)
  if (!node) return false
  return !node.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
}
const isDimmed = (nodeId: string): boolean => isNonPathNode(nodeId) || isSearchDimNode(nodeId)

const edgeKey = (source: string, target: string): string => `${source}->${target}`
const isPathEdge = (link: { source: string; target: string }): boolean =>
  learningPathEdgeSet.value.has(edgeKey(link.source, link.target))

// ── 展开 / 收起 ──
function toggleNode(nodeId: string) {
  const cm = childrenMap.value
  const children = cm.get(nodeId) || []
  if (children.length === 0) return

  const next = new Set(expandedNodes.value)

  if (next.has(nodeId)) {
    // 收起：同时移出全部后代
    const collect = (id: string) => {
      for (const child of cm.get(id) || []) {
        next.delete(child)
        collect(child)
      }
    }
    next.delete(nodeId)
    collect(nodeId)
  } else {
    next.add(nodeId)
  }

  expandedNodes.value = next
}

// ── ECharts 配置构建 ──
function buildSeriesData() {
  const nodes = visibleNodes.value
  const links = visibleLinks.value

  const nodeItems = nodes.map(n => {
    const base = getColor(n.group)
    const isRoot = n.group === 0
    const path = isPathNode(n.id)
    const dimmed = isDimmed(n.id)
    const children = childrenMap.value.get(n.id) || []
    const expandable = children.length > 0 && !expandedNodes.value.has(n.id)

    return {
      id: n.id,
      kpId: n.id,
      name: n.name,
      desc: n.description ?? '',
      group: n.group,
      symbolSize: isRoot ? 54 : 38,
      itemStyle: {
        color: makeRadialColor(base, isRoot),
        borderColor: path ? '#1677ff' : withAlpha(base, isRoot ? 0.95 : 0.85),
        borderWidth: path ? 3 : isRoot ? 2 : 1.5,
        opacity: dimmed ? 0.28 : 1,
        shadowBlur: isRoot ? 22 : 12,
        shadowColor: withAlpha(base, isRoot ? 0.45 : 0.28),
        shadowOffsetY: 4,
      },
      label: {
        formatter: expandable ? `${n.name}  +` : n.name,
        color: dimmed ? '#b8c0cc' : '#1f2937',
        opacity: dimmed ? 0.5 : 1,
        fontSize: isRoot ? 13 : 12,
        fontWeight: isRoot ? 600 : 500,
        borderColor: path ? withAlpha('#1677ff', 0.5) : withAlpha(base, dimmed ? 0.12 : 0.3),
      },
    }
  })

  const linkItems = links.map(l => {
    const meta = getLinkMeta(l.type)
    const path = isPathEdge(l)
    const dimmed =
      isNonPathNode(l.source) ||
      isNonPathNode(l.target) ||
      isSearchDimNode(l.source) ||
      isSearchDimNode(l.target)

    const sourceName = nodeMap.value.get(l.source)?.name ?? l.source
    const targetName = nodeMap.value.get(l.target)?.name ?? l.target

    return {
      source: l.source,
      target: l.target,
      relType: l.type,
      sourceName,
      targetName,
      symbol: l.type === 'PARENT_KP' ? ['none', 'arrow'] : 'none',
      symbolSize: 7,
      lineStyle: {
        color: path ? '#1677ff' : meta.color,
        width: path ? 3 : l.type === 'PARENT_KP' ? 1.8 : 1.4,
        opacity: path ? 0.9 : dimmed ? 0.1 : 0.55,
        curveness: 0.16,
        type: meta.dashed ? 'dashed' : 'solid',
      },
    }
  })

  return { nodeItems, linkItems }
}

function buildTooltipFormatter() {
  return (params: TooltipParams): string => {
    const data = params?.data ?? {}

    if (params?.dataType === 'edge') {
      const meta = getLinkMeta(data.relType ?? '')
      return (
        `<div style="max-width:260px">` +
        `<div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#334155">` +
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${meta.color}"></span>` +
        `${escapeHtml(meta.label)}</div>` +
        `<div style="margin-top:6px;font-size:12px;color:#64748b;line-height:1.6">` +
        `${escapeHtml(data.sourceName ?? '')} → ${escapeHtml(data.targetName ?? '')}</div>` +
        `</div>`
      )
    }

    const color = getColor(Number(data.group ?? 0))
    const desc = data.desc
      ? `<div style="margin-top:6px;font-size:12px;color:#64748b;line-height:1.6">${escapeHtml(data.desc)}</div>`
      : ''
    return (
      `<div style="max-width:260px">` +
      `<div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:#0f172a">` +
      `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color}"></span>` +
      `${escapeHtml(data.name ?? '')}</div>${desc}` +
      `<div style="margin-top:8px;font-size:11px;color:#94a3b8">双击进入课程 · 单击展开下级</div>` +
      `</div>`
    )
  }
}

function buildOption(): EChartsOption {
  const { nodeItems, linkItems } = buildSeriesData()

  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 600,
    animationDurationUpdate: 520,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicOut',
    tooltip: {
      trigger: 'item',
      confine: true,
      enterable: false,
      backgroundColor: 'rgba(255,255,255,0.98)',
      borderColor: 'rgba(148,163,184,0.35)',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#1f2937', fontSize: 12 },
      extraCssText: 'border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,0.14);',
      formatter: buildTooltipFormatter(),
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        cursor: 'pointer',
        scaleLimit: { min: MIN_ZOOM, max: MAX_ZOOM },
        force: {
          repulsion: 420,
          edgeLength: [95, 140],
          gravity: 0.14,
          friction: 0.6,
          layoutAnimation: true,
        },
        label: {
          show: true,
          position: 'bottom',
          distance: 8,
          color: '#1f2937',
          fontSize: 12,
          fontWeight: 500,
          width: 108,
          overflow: 'truncate',
          padding: [4, 8],
          borderRadius: 6,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderColor: 'rgba(148,163,184,0.3)',
          borderWidth: 1,
          shadowBlur: 6,
          shadowColor: 'rgba(15,23,42,0.08)',
          shadowOffsetY: 2,
        },
        labelLayout: { hideOverlap: true },
        lineStyle: {
          color: DEFAULT_LINK_META.color,
          width: 1.4,
          opacity: 0.55,
          curveness: 0.16,
        },
        emphasis: {
          focus: 'adjacency',
          scale: 1.15,
          itemStyle: { borderWidth: 3, shadowBlur: 26 },
          label: { fontWeight: 700, color: '#0f172a' },
          lineStyle: { width: 3, opacity: 0.9 },
        },
        blur: {
          itemStyle: { opacity: 0.2 },
          label: { opacity: 0.2 },
          lineStyle: { opacity: 0.08 },
        },
        data: nodeItems,
        links: linkItems,
      },
    ],
  }

  return option as unknown as EChartsOption
}

// ── 渲染 ──
function ensureChart(): echarts.ECharts | null {
  if (chartInstance) return chartInstance
  const el = chartRef.value
  if (!el || el.clientWidth === 0 || el.clientHeight === 0) return null

  chartInstance = echarts.init(el)
  chartInstance.on('click', handleChartClick)
  chartInstance.on('dblclick', handleChartDblClick)
  return chartInstance
}

function renderChart(notMerge = false) {
  const chart = ensureChart()
  if (!chart) return
  if (props.data.nodes.length === 0) {
    chart.clear()
    return
  }
  chart.setOption(buildOption(), { notMerge })
  scheduleFit()
}

// 力导向布局结束后，把整张图缩放到可视区域内，避免节点溢出画布
function scheduleFit(delay = 1600) {
  if (fitTimer) clearTimeout(fitTimer)
  fitTimer = setTimeout(() => {
    fitTimer = null
    fitToContent()
  }, delay)
}

function fitToContent() {
  const chart = chartInstance
  if (!chart) return

  const model = (chart as unknown as ChartInternal).getModel?.()
  const series = model?.getSeriesByIndex?.(0)
  const preserved = series?.preservedPoints
  if (!preserved) return

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const id of visibleNodeIds.value) {
    const [px, py] = preserved[id] ?? []
    if (typeof px !== 'number' || typeof py !== 'number' || isNaN(px) || isNaN(py)) continue
    if (px < minX) minX = px
    if (px > maxX) maxX = px
    if (py < minY) minY = py
    if (py > maxY) maxY = py
  }
  if (!isFinite(minX) || !isFinite(minY)) return

  const width = chart.getWidth()
  const height = chart.getHeight()
  if (width === 0 || height === 0) return

  // 预留节点半径与下方标签的空间
  const padX = 72
  const padTop = 44
  const padBottom = 78
  const contentW = Math.max(maxX - minX, 1) + padX * 2
  const contentH = Math.max(maxY - minY, 1) + padTop + padBottom
  const zoom = Math.min(width / contentW, height / contentH, 1.15)
  const safeZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))

  chart.setOption({
    series: [
      {
        center: [(minX + maxX) / 2, (minY + maxY) / 2 - (padBottom - padTop) / 2],
        zoom: safeZoom,
      },
    ],
  } as EChartsOption)
}

let renderScheduled = false
function scheduleRender(notMerge = false) {
  if (renderScheduled) {
    if (notMerge) pendingNotMerge = true
    return
  }
  renderScheduled = true
  nextTick(() => {
    renderScheduled = false
    const shouldNotMerge = pendingNotMerge
    pendingNotMerge = false
    renderChart(shouldNotMerge)
  })
}
let pendingNotMerge = false

// ── ECharts 交互 ──
function handleChartClick(params: GraphEventParams) {
  if (params?.dataType !== 'node') return
  const nodeId = (params?.data as GraphNodeEventData | undefined)?.kpId
  if (!nodeId) return

  // 单击只负责「展开下一级」，与原有交互保持一致
  const hasChildren = (childrenMap.value.get(nodeId)?.length ?? 0) > 0
  if (!hasChildren) return
  if (!expandedNodes.value.has(nodeId)) toggleNode(nodeId)
}

function handleChartDblClick(params: GraphEventParams) {
  if (params?.dataType !== 'node') return
  const nodeId = (params?.data as GraphNodeEventData | undefined)?.kpId
  if (!nodeId) return
  emit('node-click', nodeId)
  emit('node-dblclick', nodeId)
}

// ── 当前缩放（ECharts 会把 roam 结果同步回 series.zoom） ──
function getCurrentZoom(): number {
  if (!chartInstance) return 1
  const option = chartInstance.getOption() as unknown as { series?: SeriesSnapshot[] }
  const series = Array.isArray(option?.series) ? option.series[0] : null
  return typeof series?.zoom === 'number' ? series.zoom : 1
}

function applyZoom(zoom: number, center?: number[] | string[]) {
  if (!chartInstance) return
  const payload: Record<string, unknown> = { zoom }
  if (center) payload.center = center
  chartInstance.setOption({ series: [payload] } as EChartsOption, { notMerge: false })
}

// ── 图谱节点坐标（force 布局会把坐标保存在 preservedPoints） ──
function getNodePoint(nodeId: string): number[] | null {
  if (!chartInstance) return null
  const model = (chartInstance as unknown as ChartInternal).getModel?.()
  const series = model?.getSeriesByIndex?.(0)

  const [px, py] = series?.preservedPoints?.[nodeId] ?? []
  if (typeof px === 'number' && typeof py === 'number' && !isNaN(px) && !isNaN(py)) {
    return [px, py]
  }

  const idx = visibleNodes.value.findIndex(n => n.id === nodeId)
  if (idx < 0) return null
  const layout = series?.getData?.()?.getItemLayout?.(idx)
  if (Array.isArray(layout) && typeof layout[0] === 'number' && typeof layout[1] === 'number') {
    return layout as number[]
  }
  return null
}

// ── 对外方法（保持原有契约） ──
function highlightNode(keyword: string) {
  searchKeyword.value = keyword
  scheduleRender()
}

function zoomIn() {
  applyZoom(Math.min(MAX_ZOOM, getCurrentZoom() * 1.25))
}

function zoomOut() {
  applyZoom(Math.max(MIN_ZOOM, getCurrentZoom() * 0.8))
}

function zoomReset() {
  applyZoom(1, ['50%', '50%'])
}

function centerOnNodeById(nodeId: string) {
  // 自动展开祖先链，保证目标节点可见
  const ancestors: string[] = []
  let cursor: string | undefined = nodeId
  const pm = parentMap.value
  while (cursor && pm.has(cursor) && ancestors.length < 40) {
    cursor = pm.get(cursor)
    if (cursor) ancestors.push(cursor)
  }

  let changed = false
  const next = new Set(expandedNodes.value)
  for (const id of ancestors) {
    if (!next.has(id)) {
      next.add(id)
      changed = true
    }
  }
  if (changed) expandedNodes.value = next

  if (centerTimer) clearTimeout(centerTimer)
  if (fitTimer) {
    clearTimeout(fitTimer)
    fitTimer = null
  }

  // 新节点需要等待力布局算出坐标，这里做几次重试
  const tryCenter = (attempt: number) => {
    const point = getNodePoint(nodeId)
    if (point) {
      applyZoom(Math.max(getCurrentZoom(), 1), point)
      return
    }
    if (attempt < 5) {
      centerTimer = setTimeout(() => tryCenter(attempt + 1), 350)
    }
  }
  centerTimer = setTimeout(() => tryCenter(0), 350)
}

function flashNode(nodeId: string) {
  if (!chartInstance) return
  const dataIndex = visibleNodes.value.findIndex(n => n.id === nodeId)
  if (dataIndex < 0) return

  if (flashTimer) clearInterval(flashTimer)
  let count = 0
  flashTimer = setInterval(() => {
    if (!chartInstance) return
    chartInstance.dispatchAction({
      type: count % 2 === 0 ? 'highlight' : 'downplay',
      seriesIndex: 0,
      dataIndex,
    })
    count += 1
    if (count >= 6 && flashTimer) {
      clearInterval(flashTimer)
      flashTimer = null
      chartInstance?.dispatchAction({ type: 'downplay', seriesIndex: 0, dataIndex })
    }
  }, 320)
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
  scheduleRender()
}

const clearLearningPath = () => {
  learningPathNodeIds.value = new Set()
  learningPathEdgeSet.value = new Set()
  scheduleRender()
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

// ── 数据变化：重置展开状态并整体重建 ──
function applyInitialExpand() {
  if (!props.autoExpandAll) return
  const next = new Set(expandedNodes.value)
  for (const l of parsedLinks.value) {
    if (isParentLink(l.type)) next.add(l.source)
  }
  expandedNodes.value = next
}

watch(
  () => props.data,
  () => {
    expandedNodes.value = new Set()
    searchKeyword.value = ''
    learningPathNodeIds.value = new Set()
    learningPathEdgeSet.value = new Set()
    applyInitialExpand()
    scheduleRender(true)
  },
  { deep: true }
)

// 可见集合或高亮状态变化 → 增量更新（保留缩放/位置）
watch(
  [visibleNodeIds, searchKeyword, learningPathNodeIds, learningPathEdgeSet],
  () => scheduleRender(),
  { deep: true }
)

// ── 生命周期 ──
onMounted(() => {
  nextTick(() => {
    applyInitialExpand()
    renderChart(true)

    if (containerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        const container = containerRef.value
        // 标签页隐藏时尺寸为 0，跳过以免 ECharts 报警告
        if (!container || container.clientWidth === 0 || container.clientHeight === 0) return
        if (resizeTimer) clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
          if (!chartInstance) {
            renderChart(true)
            return
          }
          chartInstance.resize()
          scheduleFit(400)
        }, 100)
      })
      resizeObserver.observe(containerRef.value)
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (resizeTimer) {
    clearTimeout(resizeTimer)
    resizeTimer = null
  }
  if (flashTimer) {
    clearInterval(flashTimer)
    flashTimer = null
  }
  if (centerTimer) {
    clearTimeout(centerTimer)
    centerTimer = null
  }
  if (fitTimer) {
    clearTimeout(fitTimer)
    fitTimer = null
  }
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.kg-chart {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  border-radius: 10px;
  background-color: #f8fafc;
  background-image:
    radial-gradient(circle at 50% 45%, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0) 62%),
    radial-gradient(rgba(148, 163, 184, 0.22) 1px, transparent 1px);
  background-size: 100% 100%, 18px 18px;
  overflow: hidden;
}

/* 绝对定位填满容器：父级只有 min-height、没有显式 height 时，height:100% 会解析为 0，
   导致 ECharts 初始化失败（画布空白），用 inset:0 直接相对 .kg-chart 的实际渲染盒定位 */
.kg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.kg-legend {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.25);
  backdrop-filter: blur(6px);
  font-size: 12px;
  color: #475569;
  pointer-events: none;
}

.kg-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1;
}

.kg-legend-line {
  display: inline-block;
  width: 18px;
  height: 0;
  border-top-width: 2px;
}

.line-solid {
  border-top-style: solid;
  border-top-color: #4dabf7;
}

.line-dashed {
  border-top-style: dashed;
  border-top-color: #94a3b8;
}

.line-dotted {
  border-top-style: dotted;
  border-top-color: #a78bfa;
}

.kg-hint {
  position: absolute;
  right: 14px;
  bottom: 14px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.2);
  font-size: 11px;
  color: #94a3b8;
  pointer-events: none;
  user-select: none;
}
</style>
