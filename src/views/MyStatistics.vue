<template>
  <div class="stats-page">
    <div class="page-header">
      <h2 class="page-title">学习统计</h2>
      <p class="page-desc">汇总你的历次答题记录，多维度呈现学习效果</p>
    </div>

    <el-alert
      v-if="isEmpty"
      title="暂无学习数据，完成答题后展示真实统计"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

    <!-- 课程学习进度 -->
    <div class="progress-card">
      <div class="progress-info">
        <span class="progress-label">课程学习进度</span>
        <span class="progress-value">{{ overview.courseProgress }}%</span>
      </div>
      <el-progress :percentage="overview.courseProgress" :stroke-width="10" />
    </div>

    <!-- 概览卡片 -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-value">{{ overview.totalQuestions }}</div>
        <div class="stat-label">累计答题数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ overview.accuracy }}%</div>
        <div class="stat-label">总正确率</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ overview.kpCount }}</div>
        <div class="stat-label">覆盖知识点</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ formatDuration(overview.totalStudySeconds) }}</div>
        <div class="stat-label">学习时长</div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="chart-grid">
      <!-- 环形图：知识点掌握度分布 -->
      <div class="chart-card">
        <h3 class="chart-title">知识点掌握度分布</h3>
        <div ref="ringRef" class="chart chart-ring" />
      </div>

      <!-- 折线图：近 14 天正确率与答题量趋势 -->
      <div class="chart-card">
        <h3 class="chart-title">近 14 天答题趋势</h3>
        <div ref="lineRef" class="chart" />
      </div>
    </div>

    <!-- 柱状图：各知识点答题情况 -->
    <div class="chart-card">
      <h3 class="chart-title">各知识点答题情况</h3>
      <div ref="barRef" class="chart" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { ElMessage } from 'element-plus'
import { getStudentOverview } from '@/api/study'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'

const courseStore = useCourseStore()
const userStore = useUserStore()

// ---- 数据结构（与后端 StudentOverviewVO 对齐） ----
interface MasteryDistributionItem {
  name: string
  value: number
}

interface DailyTrendItem {
  label: string
  total: number
  correct: number
}

interface KpStatItem {
  kpId: string
  kpName: string
  total: number
  correct: number
  rate: number
}

interface OverviewData {
  totalQuestions: number
  accuracy: number
  kpCount: number
  totalStudySeconds: number
  courseProgress: number
  masteryDistribution: MasteryDistributionItem[]
  dailyTrend: DailyTrendItem[]
  kpStats: KpStatItem[]
}

const ringRef = ref<HTMLElement>()
const lineRef = ref<HTMLElement>()
const barRef = ref<HTMLElement>()

let ringChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

const isEmpty = ref(false)

const overview = ref<OverviewData>({
  totalQuestions: 0,
  accuracy: 0,
  kpCount: 0,
  totalStudySeconds: 0,
  courseProgress: 0,
  masteryDistribution: [],
  dailyTrend: [],
  kpStats: [],
})

/** 秒数 → 人类可读时长 */
function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}小时${m}分`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

/** 从后端统计接口加载真实学习数据（功能3：去除 localStorage 聚合与 Mock 兜底） */
const loadOverview = async () => {
  const course = courseStore.getCurrentCourse()
  const userId = userStore.userInfo?.id
  if (!userId || !course) {
    isEmpty.value = true
    return
  }
  try {
    const data = await getStudentOverview(userId, course.id)
    overview.value = data || overview.value
    isEmpty.value = !(data && (data.totalQuestions > 0 || data.totalStudySeconds > 0))
    requestAnimationFrame(() => {
      renderRing()
      renderLine()
      renderBar()
    })
  } catch (e: any) {
    ElMessage.error(e?.message || '加载学习统计失败')
    isEmpty.value = true
  }
}


// ---- 图表渲染 ----
function renderRing() {
  if (!ringRef.value) return
  ringChart = echarts.init(ringRef.value)

  // 掌握度分布：后端按已掌握/良好/待加强三档返回
  const distribution = overview.value.masteryDistribution || []

  const option: EChartsOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 个知识点（{d}%）' },
    legend: { bottom: 0, icon: 'circle' },
    series: [
      {
        type: 'pie',
        radius: ['52%', '74%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: `{a|${overview.value.accuracy}%}\n{b|总正确率}`,
          rich: {
            a: { fontSize: 26, fontWeight: 700, color: '#409eff' },
            b: { fontSize: 12, color: '#909399', padding: [6, 0, 0, 0] },
          },
        },
        data: distribution.map((d) => ({
          value: d.value,
          name: d.name,
          itemStyle: {
            color: d.name.includes('已掌握') ? '#67c23a' : d.name.includes('良好') ? '#e6a23c' : '#f56c6c',
          },
        })),
      },
    ],
  }
  ringChart.setOption(option)
}

function renderLine() {
  if (!lineRef.value) return
  lineChart = echarts.init(lineRef.value)

  const days = overview.value.dailyTrend || []
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['正确率', '答题数'], bottom: 0 },
    grid: { left: 48, right: 48, top: 32, bottom: 48 },
    xAxis: { type: 'category', data: days.map((d) => d.label), boundaryGap: false },
    yAxis: [
      { type: 'value', name: '正确率', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      { type: 'value', name: '答题数', minInterval: 1 },
    ],
    series: [
      {
        name: '正确率',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: days.map((d) => (d.total ? Math.round((d.correct / d.total) * 100) : null)),
        connectNulls: false,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64,158,255,0.25)' },
            { offset: 1, color: 'rgba(64,158,255,0.02)' },
          ]),
        },
      },
      {
        name: '答题数',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: 10,
        itemStyle: { color: 'rgba(103,194,58,0.55)' },
        data: days.map((d) => d.total),
      },
    ],
  }
  lineChart.setOption(option)
}

function renderBar() {
  if (!barRef.value) return
  barChart = echarts.init(barRef.value)

  const kps = [...(overview.value.kpStats || [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((k) => ({ name: k.kpName, total: k.total, correct: k.correct }))
  const option: EChartsOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['答题数', '正确数'], bottom: 0 },
    grid: { left: 48, right: 32, top: 32, bottom: 48 },
    xAxis: {
      type: 'category',
      data: kps.map((k) => k.name),
      axisLabel: { interval: 0, rotate: kps.length > 5 ? 20 : 0 },
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '答题数',
        type: 'bar',
        barMaxWidth: 28,
        itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
        data: kps.map((k) => k.total),
      },
      {
        name: '正确数',
        type: 'bar',
        barMaxWidth: 28,
        itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] },
        data: kps.map((k) => k.correct),
      },
    ],
  }
  barChart.setOption(option)
}

const handleResize = () => {
  ringChart?.resize()
  lineChart?.resize()
  barChart?.resize()
}

onMounted(() => {
  loadOverview()
  // 功能1：答题提交后自动刷新统计
  window.addEventListener('mastery-refresh', loadOverview)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('mastery-refresh', loadOverview)
  window.removeEventListener('resize', handleResize)
  ringChart?.dispose()
  lineChart?.dispose()
  barChart?.dispose()
})
</script>

<style scoped>
.stats-page {
  padding: 8px 0 24px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.page-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #909399;
}

.progress-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 13px;
  color: #606266;
}

.progress-value {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 30px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
}

.chart-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.chart {
  width: 100%;
  height: 320px;
}

.chart-ring {
  height: 300px;
}

@media (max-width: 900px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .chart-grid {
    grid-template-columns: 1fr;
  }
}
</style>
