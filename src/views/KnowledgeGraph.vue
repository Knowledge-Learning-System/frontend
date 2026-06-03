<template>
  <div class="kg-page">
    <!-- 顶部导航栏 -->
    <div class="kg-nav">
      <div class="kg-nav-left">
        <el-icon :size="20"><Share /></el-icon>
        <span class="kg-nav-title">知识图谱浏览</span>
      </div>
      <div class="kg-nav-center">
        <el-button
          type="primary"
          size="small"
          :loading="loadingPath"
          @click="handleStartLearning"
        >
          <el-icon :size="14" style="margin-right: 4px"><VideoPlay /></el-icon>
          开始学习
        </el-button>
        <el-button
          v-if="showingPath"
          size="small"
          @click="handleClearPath"
        >
          清除路径
        </el-button>
        <el-button
          size="small"
          type="warning"
          :loading="loadingRecommendation"
          @click="handleGetRecommendation"
        >
          智能推荐
        </el-button>
      </div>
      <div class="kg-nav-right">
        <!-- QA 智能问答 -->
        <div class="kg-qa-input">
          <el-input
            v-model="qaQuery"
            placeholder="智能问答：输入问题搜索知识点..."
            :prefix-icon="Search"
            class="kg-search-input"
            clearable
            @keyup.enter="handleQASearch"
          >
            <template #append>
              <el-button :icon="Search" :loading="loadingQA" @click="handleQASearch" />
            </template>
          </el-input>
        </div>
        <el-input
          v-model="searchQuery"
          placeholder="搜索知识点..."
          :prefix-icon="Search"
          class="kg-search-input"
          clearable
          @input="handleSearch"
          @clear="handleClearSearch"
          @keyup.enter="handleSearchEnter"
        />
      </div>
    </div>

    <!-- 学习路径面板 -->
    <div v-if="showingPath" class="kg-path-panel">
      <div class="path-panel-header">
        <span class="path-panel-title">学习路径</span>
        <span class="path-panel-subtitle">按拓扑排序，从先修到后续</span>
      </div>
      <div class="path-list">
        <div
          v-for="(item, idx) in learningPath"
          :key="item.id"
          class="path-step"
          :class="{ 'path-step-active': activePathIndex === idx, 'path-step-mastered': masteredNodeIds.includes(item.id) }"
          @click="handlePathStepClick(item, idx)"
        >
          <div class="path-step-index">{{ idx + 1 }}</div>
          <div class="path-step-name">{{ item.name }}</div>
          <el-icon v-if="masteredNodeIds.includes(item.id)" class="path-step-check" :size="14"><Check /></el-icon>
        </div>
      </div>
    </div>

    <!-- 推荐面板 -->
    <div v-if="showRecommendation" class="kg-recommendation-panel">
      <div class="path-panel-header">
        <span class="path-panel-title">智能推荐</span>
        <span class="path-panel-subtitle">基于你的学习进度，推荐下个知识点</span>
      </div>
      <div v-if="recommendations.length === 0" class="rec-empty">暂无推荐，所有知识点已掌握或无可学习项</div>
      <div class="rec-list">
        <div
          v-for="(item, idx) in recommendations"
          :key="item.id"
          class="rec-item"
          :class="{ 'rec-item-active': activeRecIndex === idx }"
          @click="handleRecItemClick(item, idx)"
        >
          <div class="rec-item-index">{{ idx + 1 }}</div>
          <div class="rec-item-info">
            <div class="rec-item-name">{{ item.name }}</div>
            <div class="rec-item-desc">{{ item.description.length > 40 ? item.description.slice(0, 40) + '...' : item.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- QA 结果面板 -->
    <div v-if="qaResults.length > 0" class="kg-qa-panel">
      <div class="path-panel-header">
        <span class="path-panel-title">问答结果</span>
        <el-button size="small" text @click="qaResults = []">关闭</el-button>
      </div>
      <div class="qa-list">
        <div
          v-for="(item, idx) in qaResults"
          :key="item.id"
          class="qa-item"
          @click="handleQAResultClick(item)"
        >
          <div class="qa-item-header">
            <span class="qa-item-name">{{ item.name }}</span>
            <el-tag size="small" effect="plain">{{ Math.round(item.relevanceScore * 100) }}% 相关</el-tag>
          </div>
          <div class="qa-item-desc">{{ item.description.length > 60 ? item.description.slice(0, 60) + '...' : item.description }}</div>
        </div>
      </div>
    </div>

    <!-- 图谱画布区 -->
    <div class="kg-canvas-area" ref="canvasArea">
      <KnowledgeGraphChart
        ref="chartRef"
        :data="graphData"
        @node-click="handleNodeClick"
      />

      <!-- 图例 -->
      <div class="kg-legend">
        <div class="legend-item" v-for="item in legendItems" :key="item.label">
          <span class="legend-dot" :style="{ background: item.color }" />
          <span class="legend-label">{{ item.label }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: #10b981" />
          <span class="legend-label">已掌握</span>
        </div>
      </div>

      <!-- 缩放控件 -->
      <div class="kg-zoom-controls">
        <el-button class="zoom-btn" circle size="small" @click="handleZoomIn">
          <el-icon><Plus /></el-icon>
        </el-button>
        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
        <el-button class="zoom-btn" circle size="small" @click="handleZoomOut">
          <el-icon><Minus /></el-icon>
        </el-button>
        <el-button class="zoom-btn" circle size="small" @click="handleZoomReset">
          <el-icon><RefreshLeft /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 知识点详情侧边栏 -->
    <Transition name="sidebar-slide">
      <KnowledgePointSidebar
        v-if="selectedNode"
        :node="selectedNode"
        :resources="nodeResources"
        @close="handleSidebarClose"
        @start-assessment="handleStartAssessment"
        @mastered="handleMastered"
      />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Check, Minus, Plus, RefreshLeft, Search, Share, VideoPlay,
} from '@element-plus/icons-vue'
import KnowledgeGraphChart from '@/components/knowledge-graph/KnowledgeGraphChart.vue'
import KnowledgePointSidebar from '@/components/knowledge-graph/KnowledgePointSidebar.vue'
import type { KnowledgeNode, KnowledgeLink, GraphData, LearningPathItem, RecommendationItem, QASearchResult } from '@/types/knowledgeGraph'
import { getKnowledgeGraph, getLearningPath, getRecommendation, searchQA } from '@/api/knowledgeGraph'
import { useCourseStore } from '@/stores/course'

const router = useRouter()
const courseStore = useCourseStore()

const chartRef = ref<InstanceType<typeof KnowledgeGraphChart> | null>(null)
const canvasArea = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const selectedNode = ref<KnowledgeNode | null>(null)
const zoomLevel = ref(1)
const loadingPath = ref(false)
const showingPath = ref(false)
const learningPath = ref<LearningPathItem[]>([])
const activePathIndex = ref(-1)

// Recommendation
const showRecommendation = ref(false)
const loadingRecommendation = ref(false)
const recommendations = ref<RecommendationItem[]>([])
const activeRecIndex = ref(-1)
const masteredNodeIds = ref<string[]>([])

// QA
const qaQuery = ref('')
const loadingQA = ref(false)
const qaResults = ref<QASearchResult[]>([])

const legendItems = [
  { label: '知识领域', color: '#1890ff' },
  { label: '子主题', color: '#52c41a' },
  { label: '知识点', color: '#faad14' },
  { label: '术语', color: '#722ed1' },
]

const graphData = ref<GraphData>({ nodes: [], links: [] })

const nodeResources = computed(() => {
  if (!selectedNode.value) return []
  const allResources: Record<string, { title: string; type: string; duration?: string }[]> = {
    'kp-1-1': [
      { title: '软件工程导论', type: 'video', duration: '45分钟' },
      { title: '测试方法论概述', type: 'document' },
    ],
    'kp-2-2': [
      { title: 'JUnit5入门教程', type: 'video', duration: '30分钟' },
      { title: 'JUnit完整文档', type: 'document' },
    ],
  }
  return allResources[selectedNode.value.id] ?? []
})

const loadGraph = async () => {
  const course = courseStore.getCurrentCourse()
  if (!course) {
    ElMessage.warning('请先选择课程')
    return
  }
  try {
    const res = await getKnowledgeGraph(course.id)
    const nodes: KnowledgeNode[] = res.nodes.map((n: any) => ({
      id: n.id,
      name: n.name,
      courseId: n.courseId,
      group: n.group,
    }))
    const links: KnowledgeLink[] = res.links.map((l: any) => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
    }))
    graphData.value = { nodes, links }
  } catch (e: any) {
    ElMessage.error('加载知识图谱失败：' + (e.message ?? e))
  }
}

const handleStartLearning = async () => {
  const course = courseStore.getCurrentCourse()
  if (!course) {
    ElMessage.warning('请先选择课程')
    return
  }
  loadingPath.value = true
  try {
    const path = await getLearningPath(course.id)
    if (!path || path.length === 0) {
      ElMessage.info('该课程暂无学习路径数据')
      return
    }
    learningPath.value = path
    showingPath.value = true
    activePathIndex.value = 0

    const orderedIds = path.map((p) => p.id)
    await new Promise((r) => setTimeout(r, 100))
    chartRef.value?.showLearningPath(orderedIds)

    const firstId = orderedIds[0]
    if (firstId) {
      chartRef.value?.centerOnNodeById(firstId)
      chartRef.value?.flashNode(firstId)
    }
  } catch (e: any) {
    ElMessage.error('获取学习路径失败：' + (e.message ?? e))
  } finally {
    loadingPath.value = false
  }
}

const handleClearPath = () => {
  showingPath.value = false
  learningPath.value = []
  activePathIndex.value = -1
  chartRef.value?.clearLearningPath()
}

const handlePathStepClick = (item: LearningPathItem, idx: number) => {
  activePathIndex.value = idx
  chartRef.value?.centerOnNodeById(item.id)
  chartRef.value?.flashNode(item.id)
}

const handleSearch = () => {
  if (chartRef.value) {
    chartRef.value.highlightNode(searchQuery.value)
  }
}

const handleSearchEnter = () => {
}

const handleClearSearch = () => {
  if (chartRef.value) {
    chartRef.value.highlightNode('')
  }
}

const handleNodeClick = (node: KnowledgeNode) => {
  selectedNode.value = node
}

const handleSidebarClose = () => {
  selectedNode.value = null
}

const handleStartAssessment = () => {
  if (selectedNode.value) {
    router.push({
      path: '/assessment',
      query: { nodeId: selectedNode.value.id, nodeName: selectedNode.value.name },
    })
  }
}

// Recommendation
const handleGetRecommendation = async () => {
  const course = courseStore.getCurrentCourse()
  if (!course) {
    ElMessage.warning('请先选择课程')
    return
  }
  loadingRecommendation.value = true
  try {
    const rec = await getRecommendation(course.id)
    recommendations.value = rec
    showRecommendation.value = true
    activeRecIndex.value = -1
    if (rec.length === 0) {
      ElMessage.info('所有知识点已掌握，暂无推荐')
    }
  } catch (e: any) {
    ElMessage.error('获取推荐失败：' + (e.message ?? e))
  } finally {
    loadingRecommendation.value = false
  }
}

const handleRecItemClick = (item: RecommendationItem, idx: number) => {
  activeRecIndex.value = idx
  chartRef.value?.centerOnNodeById(item.id)
  chartRef.value?.flashNode(item.id)
}

const handleMastered = (nodeId: string) => {
  if (!masteredNodeIds.value.includes(nodeId)) {
    masteredNodeIds.value.push(nodeId)
  }
  // Refresh recommendations
  handleGetRecommendation()
}

// QA
const handleQASearch = async () => {
  if (!qaQuery.value.trim()) return
  loadingQA.value = true
  try {
    const results = await searchQA(qaQuery.value.trim())
    qaResults.value = results
    if (results.length === 0) {
      ElMessage.info('未找到匹配的知识点')
    }
  } catch (e: any) {
    ElMessage.error('问答搜索失败：' + (e.message ?? e))
  } finally {
    loadingQA.value = false
  }
}

const handleQAResultClick = (item: QASearchResult) => {
  chartRef.value?.centerOnNodeById(item.id)
  chartRef.value?.flashNode(item.id)
}

const handleZoomIn = () => {
  chartRef.value?.zoomIn()
  zoomLevel.value = Math.min(zoomLevel.value * 1.3, 3)
}

const handleZoomOut = () => {
  chartRef.value?.zoomOut()
  zoomLevel.value = Math.max(zoomLevel.value * 0.7, 0.3)
}

const handleZoomReset = () => {
  chartRef.value?.zoomReset()
  zoomLevel.value = 1
}

onMounted(async () => {
  zoomLevel.value = 1
  await courseStore.fetchMyCourses()
  await loadGraph()
})
</script>

<style scoped>
.kg-page {
  position: relative;
  height: calc(100vh - 104px);
  display: flex;
  flex-direction: column;
  margin: -24px -24px 0;
  background: #f5f5f5;
}

/* Nav */
.kg-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 12px;
}

.kg-nav-left {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  flex-shrink: 0;
}

.kg-nav-title {
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.kg-nav-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kg-nav-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.kg-qa-input {
  width: 280px;
}

.kg-search-input {
  width: 220px;
}

/* Path Panel */
.kg-path-panel {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 20px;
  flex-shrink: 0;
}

.path-panel-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.path-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.path-panel-subtitle {
  font-size: 12px;
  color: #8c8c8c;
}

.path-list {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.path-step {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 6px;
  border-radius: 16px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.path-step:hover {
  background: #e6f7ff;
}

.path-step-active {
  background: #1890ff;
}

.path-step-active .path-step-name {
  color: #fff;
}

.path-step-mastered {
  background: #e8f5e9;
  border: 1px solid #a5d6a7;
}

.path-step-mastered .path-step-index {
  background: #10b981;
}

.path-step-index {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #1890ff;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.path-step-active .path-step-index {
  background: #fff;
  color: #1890ff;
}

.path-step-name {
  font-size: 12px;
  color: #595959;
  white-space: nowrap;
}

.path-step-check {
  color: #10b981;
}

/* Recommendation Panel */
.kg-recommendation-panel {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 20px;
  flex-shrink: 0;
}

.rec-empty {
  font-size: 13px;
  color: #8c8c8c;
  padding: 8px 0;
}

.rec-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.rec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  border: 1px solid transparent;
  min-width: 200px;
}

.rec-item:hover {
  background: #e6f7ff;
  border-color: #1890ff;
}

.rec-item-active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.rec-item-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #faad14;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rec-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rec-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}

.rec-item-desc {
  font-size: 11px;
  color: #8c8c8c;
}

/* QA Panel */
.kg-qa-panel {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 20px;
  flex-shrink: 0;
  max-height: 200px;
  overflow-y: auto;
}

.qa-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.qa-item {
  padding: 8px 14px;
  border-radius: 10px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  border: 1px solid transparent;
  min-width: 200px;
  max-width: 260px;
}

.qa-item:hover {
  background: #e6f7ff;
  border-color: #1890ff;
}

.qa-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.qa-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}

.qa-item-desc {
  font-size: 11px;
  color: #8c8c8c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Canvas */
.kg-canvas-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

/* Legend */
.kg-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #595959;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* Zoom Controls */
.kg-zoom-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  padding: 6px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none !important;
  background: transparent !important;
  color: #595959 !important;
}

.zoom-btn:hover {
  background: #f5f5f5 !important;
  color: #1890ff !important;
}

.zoom-level {
  font-size: 11px;
  color: #bfbfbf;
  padding: 2px 0;
}

/* Sidebar transition */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>