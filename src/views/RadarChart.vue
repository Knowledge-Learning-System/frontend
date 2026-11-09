<template>
  <div class="radar-page" :class="{ embedded: embedded }">
    <!-- 顶部导航 -->
    <div class="radar-header">
      <div class="header-left">
        <el-button v-if="!embedded" text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="radar-title">知识点掌握度分析</h1>
      </div>
      <el-select
        v-model="selectedDimension"
        placeholder="选择分析维度"
        class="dimension-select"
        @change="handleDimensionChange"
      >
        <el-option label="整体掌握度" value="overall" />
        <el-option label="按知识领域" value="by_domain" />
        <el-option label="按时间趋势" value="by_time" />
      </el-select>
      <!-- 知识点聚焦仅在整体掌握度维度下有意义，其他维度按领域/时间聚合展示 -->
      <template v-if="selectedDimension === 'overall'">
        <el-tag v-if="lockedKp" class="kp-locked-tag" type="info" effect="plain">
          当前知识点：{{ lockedKpName || activeKpId }}
        </el-tag>
        <el-select
          v-else
          v-model="activeKpId"
          placeholder="选择知识点查看掌握度"
          filterable
          clearable
          class="kp-select"
        >
          <el-option v-for="kp in knowledgePoints" :key="kp.id" :label="kp.name" :value="kp.id" />
        </el-select>
      </template>
    </div>

    <!-- 雷达图主区域 -->
    <div class="radar-content">
      <div class="radar-card">
        <div class="card-header">
          <h2 class="card-title">{{ chartTitle }}</h2>
          <div class="card-actions">
            <el-button size="small" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
        
        <div ref="chartContainer" class="chart-container">
          <div v-if="error" class="empty-state">
            <el-empty :description="error">
              <el-button type="primary" @click="loadData">重试</el-button>
            </el-empty>
          </div>
          <div v-else-if="knowledgePoints.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无诊断数据，请先完成答题以生成掌握度分析">
              <el-button type="primary" @click="handleBack">返回学习</el-button>
            </el-empty>
          </div>
          <div
            v-else-if="selectedDimension === 'by_time' && trendPoints.length === 0 && !loading"
            class="empty-state"
          >
            <el-empty description="暂无答题记录，完成测评后即可查看掌握度变化趋势" />
          </div>
          <div
            v-else-if="selectedDimension === 'overall' && activeKpId && !singlePoint && !loading"
            class="empty-state"
          >
            <el-empty description="该知识点暂无掌握度数据，请先完成该知识点的学习与测验">
              <el-button type="primary" @click="goStudyPoint">去学习该知识点</el-button>
            </el-empty>
          </div>
          <div
            v-else-if="selectedDimension === 'overall' && !activeKpId && !loading"
            class="empty-state"
          >
            <el-empty description="请从上方选择课程内的知识点，查看该知识点的掌握度详情" />
          </div>
        </div>
        
        <div class="radar-summary">
          <template v-if="singlePoint">
            <div class="summary-item">
              <div class="summary-label">该知识点掌握度</div>
              <div class="summary-value average">{{ singlePoint.mastery }}%</div>
              <div class="summary-percent">{{ masteryLabel(singlePoint.mastery) }}</div>
            </div>
          </template>
          <template v-else>
            <div class="summary-item">
              <div class="summary-label">平均掌握度</div>
              <div class="summary-value average">{{ averageMastery }}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">最强{{ pointUnitLabel }}</div>
              <div class="summary-value best">{{ strongestPoint?.name || '-' }}</div>
              <div class="summary-percent">{{ strongestPoint?.mastery || 0 }}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">最弱{{ pointUnitLabel }}</div>
              <div class="summary-value weakest">{{ weakestPoint?.name || '-' }}</div>
              <div class="summary-percent">{{ weakestPoint?.mastery || 0 }}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">{{ pointUnitLabel }}总数</div>
              <div class="summary-value total">{{ knowledgePoints.length }}</div>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧详情列表 -->
      <div class="detail-list">
        <div class="list-header">
          <h3>{{ listTitle }}</h3>
          <el-input
            v-if="!singlePoint"
            v-model="searchText"
            :placeholder="searchPlaceholder"
            :prefix-icon="Search"
            clearable
            class="search-input"
          />
        </div>
        
        <div class="list-content">
          <div
            v-for="point in filteredPoints"
            :key="point.id"
            class="point-item"
            :class="getPointClass(point.mastery)"
            @click="handlePointClick(point)"
          >
            <div class="point-info">
              <div class="point-name">{{ point.name }}</div>
            </div>
            <div class="point-mastery">
              <div class="mastery-bar">
                <div 
                  class="mastery-fill" 
                  :class="getMasteryBarClass(point.mastery)"
                  :style="{ width: point.mastery + '%' }"
                />
              </div>
              <span class="mastery-value" :class="getMasteryValueClass(point.mastery)">
                {{ point.mastery }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 大模型分析建议（页面最底部） -->
    <div class="ai-analysis-card">
      <div class="ai-card-header">
        <div class="ai-card-title">
          <span class="ai-dot"></span>
          大模型分析建议
          <span class="ai-badge">AI 生成</span>
        </div>
        <el-button size="small" :loading="aiLoading" @click="loadAiAnalysis(true)">
          <el-icon><Refresh /></el-icon>
          重新分析
        </el-button>
      </div>

      <div v-if="aiLoading" class="ai-loading">
        <div class="ai-loading-spinner"></div>
        <div class="ai-loading-tip">正在结合你的掌握度、趋势与薄弱点数据生成诊断建议，约需 5-15 秒…</div>
      </div>

      <div v-else-if="aiError" class="ai-empty">
        <el-empty :description="aiError">
          <el-button type="primary" @click="loadAiAnalysis(true)">重新分析</el-button>
        </el-empty>
      </div>

      <template v-else-if="aiAnalysis">
        <div class="ai-overview">{{ aiAnalysis.overview }}</div>

        <div class="ai-grid">
          <div v-if="aiAnalysis.strengths.length" class="ai-block ai-block-best">
            <div class="ai-block-title">掌握较好的部分</div>
            <ul>
              <li v-for="(item, i) in aiAnalysis.strengths" :key="'ai-s-' + i">{{ item }}</li>
            </ul>
          </div>
          <div v-if="aiAnalysis.weaknesses.length" class="ai-block ai-block-weak">
            <div class="ai-block-title">需要重点关注</div>
            <ul>
              <li v-for="(item, i) in aiAnalysis.weaknesses" :key="'ai-w-' + i">{{ item }}</li>
            </ul>
          </div>
          <div v-if="aiAnalysis.trend" class="ai-block ai-block-trend">
            <div class="ai-block-title">趋势点评</div>
            <div class="ai-trend-text">{{ aiAnalysis.trend }}</div>
          </div>
        </div>

        <div v-if="aiAnalysis.suggestions.length" class="ai-block ai-block-actions">
          <div class="ai-block-title">下一步学习建议</div>
          <ol>
            <li v-for="(item, i) in aiAnalysis.suggestions" :key="'ai-a-' + i">{{ item }}</li>
          </ol>
        </div>

        <div v-if="aiAnalysis.generatedAt" class="ai-meta">
          生成时间 {{ aiAnalysis.generatedAt }}
          <span v-if="aiAnalysis.cached"> · 已复用近期结果</span>
          · 内容由大模型基于当前诊断数据生成，仅供参考
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Refresh, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { getRadar, getMasteryTrend, getAiAnalysis } from '@/api/study'
import type { RadarDimension, TrendPoint, AiAnalysis } from '@/api/study'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

interface KnowledgePoint {
  id: string
  name: string
  mastery: number
}

const props = defineProps<{
  embedded?: boolean
  /** 当前浏览课程 id；传入后优先按此取数，否则回退到全局当前课程 */
  courseId?: number
  /** 从知识点进入诊断时的知识点 id；传入后仅展示该知识点的掌握度 */
  knowledgePointId?: string
}>()

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

/** 当前分析维度：整体掌握度 / 按知识领域 / 按时间趋势 */
const selectedDimension = ref<RadarDimension>('overall')
// 当前聚焦的知识点 id：优先取进入诊断时的上下文（prop / 独立页 query.kpId），页面内也可切换
const activeKpId = ref<string>(props.knowledgePointId || (route.query.kpId as string) || '')
const searchText = ref('')
const chartInstance = ref<echarts.ECharts | null>(null)
const chartContainer = ref<HTMLElement | null>(null)

let pendingInit = false
let resizeObserver: ResizeObserver | null = null
const loading = ref(false)
const error = ref('')

const knowledgePoints = ref<KnowledgePoint[]>([])
// 时间趋势维度的数据序列（按自然日）
const trendPoints = ref<TrendPoint[]>([])
// 时间趋势默认回看天数
const TREND_DAYS = 30

// 雷达图最多绘制的知识点数量，超出则按掌握度取前 N，避免轴名重叠
const MAX_RADAR_POINTS = 12

// 雷达图绘制用：仅包含已作答（掌握度>0）的知识点，数量超限时保留掌握度最高的若干并确保最弱点在内
const radarPoints = computed(() => {
  const active = knowledgePoints.value.filter(p => p.mastery > 0)
  if (active.length <= MAX_RADAR_POINTS) return active
  const sorted = [...active].sort((a, b) => b.mastery - a.mastery)
  const top = sorted.slice(0, MAX_RADAR_POINTS)
  const weakest = active.reduce((min, p) => (p.mastery < min.mastery ? p : min))
  if (!top.some(p => p.id === weakest.id)) {
    top[top.length - 1] = weakest
  }
  return top
})

const loadData = async () => {
  const courseId = props.courseId ?? courseStore.getCurrentCourse()?.id
  const userId = userStore.userInfo?.id
  if (!userId || !courseId) {
    error.value = '无法获取用户或课程信息，请确认已登录并选择了课程'
    return
  }

  loading.value = true
  error.value = ''
  try {
    if (selectedDimension.value === 'by_time') {
      // 时间趋势：图表用趋势序列，列表与摘要仍按知识点掌握度口径展示
      const [radar, trend] = await Promise.all([
        getRadar(userId, courseId, 'overall'),
        getMasteryTrend(userId, courseId, TREND_DAYS),
      ])
      knowledgePoints.value = radar
      trendPoints.value = trend
    } else {
      const data = await getRadar(
        userId,
        courseId,
        selectedDimension.value === 'by_domain' ? 'by_domain' : 'overall',
      )
      knowledgePoints.value = data
      trendPoints.value = []
    }
    if (knowledgePoints.value.length > 0) {
      initChart()
    }
  } catch (e: any) {
    error.value = e?.message || '加载掌握度数据失败，请确认后端服务是否正常运行'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

// 单知识点模式：当前聚焦的知识点（未作答时可能不在已返回数据中）
const singlePoint = computed(() => {
  if (!activeKpId.value) return null
  return knowledgePoints.value.find(p => p.id === activeKpId.value) || null
})

// 从某个知识点进入时锁定该知识点，页面内不再提供选择功能；课程级入口才展示可切换的下拉
const lockedKp = computed(() => !!(props.knowledgePointId || route.query.kpId))
const lockedKpName = computed(() => {
  const hit = knowledgePoints.value.find(p => p.id === activeKpId.value)
  return hit ? hit.name : ''
})

// 图表标题：随分析维度变化
const chartTitle = computed(() => {
  if (selectedDimension.value === 'by_domain') return '各知识领域掌握度'
  if (selectedDimension.value === 'by_time') return `掌握度时间趋势（近 ${TREND_DAYS} 天）`
  return singlePoint.value ? '知识点掌握度' : '掌握度雷达图'
})

// 详情列表标题
const listTitle = computed(() => {
  if (selectedDimension.value === 'by_domain') return '各知识领域掌握度详情'
  return singlePoint.value ? '知识点掌握度详情' : '各知识点掌握度详情'
})

// 摘要区计量单位：按领域维度聚合时以“领域”为单位
const pointUnitLabel = computed(() => (selectedDimension.value === 'by_domain' ? '领域' : '知识点'))

// 列表搜索框提示语
const searchPlaceholder = computed(() =>
  selectedDimension.value === 'by_domain' ? '搜索知识领域...' : '搜索知识点...',
)

const masteryLabel = (mastery: number) => {
  if (mastery >= 80) return '优秀'
  if (mastery >= 60) return '良好'
  if (mastery >= 40) return '中等'
  if (mastery > 0) return '薄弱'
  return '未作答'
}

const averageMastery = computed(() => {
  if (knowledgePoints.value.length === 0) return 0
  const total = knowledgePoints.value.reduce((sum, p) => sum + p.mastery, 0)
  return Math.round(total / knowledgePoints.value.length)
})

const strongestPoint = computed(() => {
  return [...knowledgePoints.value].sort((a, b) => b.mastery - a.mastery)[0]
})

const weakestPoint = computed(() => {
  return [...knowledgePoints.value].sort((a, b) => a.mastery - b.mastery)[0]
})

const filteredPoints = computed(() => {
  if (singlePoint.value) return [singlePoint.value]
  if (!searchText.value) return knowledgePoints.value
  return knowledgePoints.value.filter(p => 
    p.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const getPointClass = (mastery: number) => {
  if (mastery >= 80) return 'point-excellent'
  if (mastery >= 60) return 'point-good'
  if (mastery >= 40) return 'point-average'
  return 'point-poor'
}

const getMasteryBarClass = (mastery: number) => {
  if (mastery >= 80) return 'bar-excellent'
  if (mastery >= 60) return 'bar-good'
  if (mastery >= 40) return 'bar-average'
  return 'bar-poor'
}

const getMasteryValueClass = (mastery: number) => {
  if (mastery >= 80) return 'value-excellent'
  if (mastery >= 60) return 'value-good'
  if (mastery >= 40) return 'value-average'
  return 'value-poor'
}

// 掌握度档位配色（与列表色阶保持一致）
const masteryColor = (mastery: number) => {
  if (mastery >= 80) return '#67c23a'
  if (mastery >= 60) return '#409eff'
  if (mastery >= 40) return '#e6a23c'
  return '#f56c6c'
}

/** 按知识领域：各领域掌握度柱状图，60% 处标出达标线 */
const buildDomainOption = (): EChartsOption => {
  const points = knowledgePoints.value
  // 领域名称普遍较长，横向空间不足时标签会互相重叠：按名称长度决定旋转角度并做截断（完整名称见 tooltip）
  const maxNameLen = points.reduce((m, p) => Math.max(m, (p.name || '').length), 0)
  const labelRotate = maxNameLen > 5 || points.length > 5 ? 30 : 0
  const clipLabel = (name: string) => {
    const s = name || ''
    const limit = labelRotate ? 10 : 14
    return s.length > limit ? `${s.slice(0, limit)}…` : s
  }
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const idx = Array.isArray(params) && params.length ? params[0].dataIndex : 0
        const item = points[idx]
        if (!item) return ''
        return `${item.name}<br/>掌握度：${item.mastery}%<br/>水平：${masteryLabel(item.mastery)}`
      },
    },
    grid: { left: 64, right: 32, top: 48, bottom: labelRotate ? 104 : 68 },
    xAxis: {
      type: 'category',
      data: points.map(p => p.name),
      axisTick: { alignWithLabel: true },
      axisLabel: {
        color: '#606266',
        interval: 0,
        rotate: labelRotate,
        margin: 10,
        overflow: 'truncate',
        width: 92,
        formatter: (value: string) => clipLabel(value),
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '掌握度(%)',
      nameTextStyle: { color: '#909399' },
      axisLabel: { color: '#909399', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 46,
        data: points.map(p => ({
          value: p.mastery,
          itemStyle: { color: masteryColor(p.mastery), borderRadius: [6, 6, 0, 0] },
        })),
        label: {
          show: true,
          position: 'top',
          color: '#606266',
          fontSize: 12,
          formatter: '{c}%',
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#f56c6c' },
          label: { formatter: '达标线 60%', color: '#f56c6c', fontSize: 11, position: 'insideEndTop' },
          data: [{ yAxis: 60 }],
        },
      },
    ],
  } as EChartsOption
}

/** 按时间趋势：累计掌握度（主线）与当日正确率（辅线）双折线 */
const buildTrendOption = (): EChartsOption => {
  const points = trendPoints.value
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const idx = Array.isArray(params) && params.length ? params[0].dataIndex : 0
        const item = points[idx]
        if (!item) return ''
        const acc = item.totalAttempts > 0 ? `${item.accuracy}%` : '—'
        return `${item.date}<br/>累计掌握度：${item.mastery}%<br/>当日答题：${item.totalAttempts} 道<br/>当日正确率：${acc}`
      },
    },
    legend: { data: ['累计掌握度', '当日正确率'], top: 0, textStyle: { color: '#606266' } },
    grid: { left: 64, right: 36, top: 56, bottom: 56 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: points.map(p => p.date.slice(5)),
      axisLabel: { color: '#606266' },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '百分比(%)',
      nameTextStyle: { color: '#909399' },
      axisLabel: { color: '#909399', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f0f2f5' } },
    },
    series: [
      {
        name: '累计掌握度',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: points.map(p => p.mastery),
        itemStyle: { color: '#409eff' },
        lineStyle: { width: 3, color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.12)' },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#f56c6c' },
          label: { formatter: '达标线 60%', color: '#f56c6c', fontSize: 11, position: 'insideEndTop' },
          data: [{ yAxis: 60 }],
        },
      },
      {
        name: '当日正确率',
        type: 'line',
        smooth: true,
        symbolSize: 5,
        connectNulls: true,
        data: points.map(p => (p.totalAttempts > 0 ? p.accuracy : null)) as any,
        itemStyle: { color: '#e6a23c' },
        lineStyle: { width: 2, type: 'dotted', color: '#e6a23c' },
      },
    ],
  } as EChartsOption
}

const initChart = () => {
  const el = chartContainer.value
  if (!el) return

  // 容器处于未激活 Tab（display:none）时宽高为 0，挂起渲染，待容器可见后重试
  if (el.offsetWidth === 0 || el.offsetHeight === 0) {
    pendingInit = true
    return
  }

  if (!chartInstance.value) {
    chartInstance.value = echarts.init(el)
  }

  // 维度二：按时间趋势 —— 折线图
  if (selectedDimension.value === 'by_time') {
    if (trendPoints.value.length === 0) {
      chartInstance.value.clear()
      return
    }
    chartInstance.value.setOption(buildTrendOption(), true)
    return
  }

  // 维度三：按知识领域 —— 各领域掌握度柱状图
  if (selectedDimension.value === 'by_domain') {
    if (knowledgePoints.value.length === 0) {
      chartInstance.value.clear()
      return
    }
    chartInstance.value.setOption(buildDomainOption(), true)
    return
  }

  // 维度一（整体掌握度）：未聚焦到知识点（含知识点无掌握度数据）时不绘制，由模板空态引导
  if (!activeKpId.value || !singlePoint.value) {
    chartInstance.value.clear()
    return
  }

  // 单知识点模式：不再绘制全量雷达，改用仪表盘展示该知识点掌握度
  const sp = singlePoint.value
  if (!sp) {
    chartInstance.value.clear()
    return
  }
  chartInstance.value.setOption({
    tooltip: {
      formatter: () => `${sp.name}<br/>掌握度：${sp.mastery}%`
    },
    series: [{
      name: sp.name,
      type: 'gauge',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      progress: { show: true, width: 22, itemStyle: { color: '#409eff' } },
      axisLine: { lineStyle: { width: 22, color: [[1, '#e4e7ed']] } },
      axisTick: { show: false },
      splitLine: { length: 10, lineStyle: { color: '#dcdfe6' } },
      axisLabel: { color: '#909399', fontSize: 11, distance: 18 },
      pointer: { show: false },
      anchor: { show: false },
      title: { show: true, offsetCenter: [0, '36%'], color: '#606266', fontSize: 14 },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '0%'],
        fontSize: 34,
        fontWeight: 700,
        color: '#303133',
        formatter: '{value}%'
      },
      data: [{ value: sp.mastery, name: sp.name }]
    }]
  })
  // 单知识点模式使用上方仪表盘展示，原全量雷达绘制逻辑已移除
}

const handleDimensionChange = () => {
  // 按所选维度重新聚合：整体 -> 逐知识点、领域 -> 按章节聚合、时间 -> 按自然日序列
  if (selectedDimension.value !== 'overall' && !lockedKp.value) {
    // 领域/趋势维度不按单个知识点聚焦，清空残留的聚焦状态
    activeKpId.value = ''
  }
  loadData()
}

// ---- 大模型分析建议（页面最底部卡片） ----
const aiAnalysis = ref<AiAnalysis | null>(null)
const aiLoading = ref(false)
const aiError = ref('')
// 请求序号：重复点击或切换课程时丢弃过期响应
let aiRequestSeq = 0

const loadAiAnalysis = async (force = false) => {
  const courseId = props.courseId ?? courseStore.getCurrentCourse()?.id
  const userId = userStore.userInfo?.id
  if (!userId || !courseId) {
    aiError.value = '无法获取用户或课程信息，请确认已登录并选择了课程'
    return
  }
  if (aiLoading.value && !force) return
  const seq = ++aiRequestSeq
  aiLoading.value = true
  aiError.value = ''
  try {
    const data = await getAiAnalysis(userId, courseId, TREND_DAYS)
    if (seq !== aiRequestSeq) return
    aiAnalysis.value = data
  } catch (e: any) {
    if (seq !== aiRequestSeq) return
    aiAnalysis.value = null
    aiError.value = e?.message || '大模型分析暂时不可用，请稍后重试'
  } finally {
    if (seq === aiRequestSeq) aiLoading.value = false
  }
}

const handleRefresh = () => {
  loadData()
}

const handleResize = () => {
  const el = chartContainer.value
  if (!el) return
  if (el.offsetWidth === 0 || el.offsetHeight === 0) {
    pendingInit = true
    return
  }
  if (pendingInit) {
    // 容器恢复可见（如切换到诊断 Tab），补齐此前挂起的渲染
    pendingInit = false
    initChart()
  } else {
    chartInstance.value?.resize()
  }
}

const handleBack = () => {
  router.back()
}

const goStudyPoint = () => {
  const courseId = props.courseId ?? courseStore.getCurrentCourse()?.id
  router.push({
    path: `/course/${courseId || 1}`,
    query: { tab: 'graph', highlight: activeKpId.value }
  })
}

const handlePointClick = (point: KnowledgePoint) => {
  // 领域维度下列表条目是课程章节而非知识点，无对应图谱节点，不做跳转
  if (selectedDimension.value === 'by_domain') return
  const courseId = props.courseId ?? courseStore.getCurrentCourse()?.id
  router.push({
    path: `/course/${courseId || 1}`,
    query: { tab: 'graph', highlight: point.id }
  })
}

watch(() => props.knowledgePointId, (val) => {
  // 仅当父级明确传入知识点时才跟随切换，避免父级清空选中覆盖页面内手动选择
  if (val) activeKpId.value = val
})

watch(() => filteredPoints.value, () => {
  initChart()
}, { deep: true })

onMounted(() => {
  loadData()
  // 底部大模型分析建议与图表数据并行加载，互不阻塞
  loadAiAnalysis()

  window.addEventListener('resize', handleResize)
  // 功能1：答题提交成功后自动刷新雷达图（Assessment.vue 广播 mastery-refresh）
  window.addEventListener('mastery-refresh', handleRefresh)
  if (chartContainer.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(chartContainer.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('mastery-refresh', handleRefresh)
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', handleResize)
  chartInstance.value?.dispose()
  chartInstance.value = null
})
</script>

<style scoped lang="css">
.radar-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.radar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.radar-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.dimension-select {
  width: 180px;
}

.kp-select {
  width: 260px;
  margin-left: 12px;
}

.kp-locked-tag {
  margin-left: 12px;
}

.radar-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
}

.radar-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-container {
  width: 100%;
  height: 600px;
  margin-bottom: 24px;
}

.radar-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.summary-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.summary-value.average {
  color: #409eff;
}

.summary-value.best {
  color: #67c23a;
}

.summary-value.weakest {
  color: #f56c6c;
}

.summary-value.total {
  color: #e6a23c;
}

.summary-percent {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 详情列表 */
.detail-list {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-input {
  width: 200px;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
}

.point-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.point-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.point-excellent {
  border-left: 3px solid #67c23a;
}

.point-good {
  border-left: 3px solid #409eff;
}

.point-average {
  border-left: 3px solid #e6a23c;
}

.point-poor {
  border-left: 3px solid #f56c6c;
}

.point-info {
  margin-bottom: 12px;
}

.point-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.point-meta {
  display: flex;
  gap: 8px;
}

.point-domain {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.point-mastery {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mastery-bar {
  flex: 1;
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-excellent {
  background: #67c23a;
}

.bar-good {
  background: #409eff;
}

.bar-average {
  background: #e6a23c;
}

.bar-poor {
  background: #f56c6c;
}

.mastery-value {
  font-size: 14px;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}

.value-excellent {
  color: #67c23a;
}

.value-good {
  color: #409eff;
}

.value-average {
  color: #e6a23c;
}

.value-poor {
  color: #f56c6c;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
}

/* 嵌套在 CourseDetail Tab 中的样式覆盖 */
.radar-page.embedded {
  min-height: 0;
  padding: 0;
  background: transparent;
}

.radar-page.embedded .radar-header {
  margin-bottom: 16px;
}

.radar-page.embedded .radar-title {
  font-size: 20px;
}

.radar-page.embedded .radar-content {
  gap: 16px;
}

.radar-page.embedded .radar-card {
  padding: 16px;
  box-shadow: none;
  border: 1px solid #e4e7ed;
}

.radar-page.embedded .chart-container {
  height: 620px;
}

.radar-page.embedded .detail-list {
  padding: 16px;
  box-shadow: none;
  border: 1px solid #e4e7ed;
}
/* ===== 大模型分析建议卡片（页面最底部） ===== */
.ai-analysis-card {
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-top: 3px solid #409eff;
}

.ai-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.ai-card-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.ai-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  margin-right: 8px;
}

.ai-badge {
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 400;
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 10px;
}

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0;
}

.ai-loading-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #e4e7ed;
  border-top-color: #409eff;
  animation: ai-spin 0.9s linear infinite;
}

@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-loading-tip {
  margin-top: 14px;
  font-size: 13px;
  color: #909399;
}

.ai-empty {
  padding: 8px 0;
}

.ai-overview {
  font-size: 14px;
  line-height: 1.9;
  color: #303133;
  background: #f5f9ff;
  border-left: 3px solid #409eff;
  border-radius: 6px;
  padding: 14px 16px;
}

.ai-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.ai-block {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}

.ai-block-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.ai-block-best .ai-block-title {
  color: #67c23a;
}

.ai-block-weak .ai-block-title {
  color: #f56c6c;
}

.ai-block-trend .ai-block-title {
  color: #e6a23c;
}

.ai-block ul,
.ai-block ol {
  margin: 0;
  padding-left: 20px;
}

.ai-block li {
  font-size: 13px;
  line-height: 1.8;
  color: #606266;
}

.ai-trend-text {
  font-size: 13px;
  line-height: 1.8;
  color: #606266;
}

.ai-block-actions {
  margin-top: 16px;
  background: #f5f9ff;
  border-color: #d9ecff;
}

.ai-meta {
  margin-top: 16px;
  font-size: 12px;
  color: #a8abb2;
}
</style>
