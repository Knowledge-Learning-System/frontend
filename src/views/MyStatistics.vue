<template>
  <div class="stats-page">
    <div class="page-header">
      <h2 class="page-title">学习统计</h2>
      <p class="page-desc">汇总你的历次答题记录，多维度呈现学习效果</p>
    </div>

    <el-alert
      v-if="isDemo"
      title="暂无答题记录，当前展示为示例数据"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />

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
        <div class="stat-value">{{ overview.attempts }}</div>
        <div class="stat-label">答题次数</div>
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

// ---- 数据结构 ----
interface AssessmentRecord {
  id: string
  title: string
  date: string
  totalQuestions: number
  correctCount: number
  score: number
  totalScore: number
  accuracyRate: number
  timeSpent: string
}

interface KpAgg {
  total: number
  correct: number
}

const ringRef = ref<HTMLElement>()
const lineRef = ref<HTMLElement>()
const barRef = ref<HTMLElement>()

let ringChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null

const isDemo = ref(false)

// ---- 从 localStorage 聚合测评历史（assessment_history_*） ----
function loadAllRecords(): AssessmentRecord[] {
  const records: AssessmentRecord[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('assessment_history_')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        parsed.forEach((r) => {
          if (r && typeof r.date === 'string') records.push(r as AssessmentRecord)
        })
      }
    }
  } catch {
    // ignore
  }
  return records
}

function parseDate(dateStr: string): Date {
  // date 形如 "2026/9/1 12:03:45"（toLocaleString('zh-CN')）
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? new Date() : d
}

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---- Mock 兜底数据（无答题记录时演示用） ----
function buildDemoData() {
  isDemo.value = true
  const kps = ['数据库基础', 'SQL 查询', '事务与并发', '索引优化', '关系模型']
  const records: AssessmentRecord[] = []
  for (let d = 13; d >= 0; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    if (d % 3 === 1) continue // 隔几天一次，模拟真实节奏
    const total = 5 + Math.floor(Math.random() * 6)
    const correct = Math.max(1, Math.round(total * (0.55 + Math.random() * 0.4)))
    records.push({
      id: `demo-${d}`,
      title: kps[Math.floor(Math.random() * kps.length)] ?? '综合测评',
      date: date.toLocaleString('zh-CN'),
      totalQuestions: total,
      correctCount: correct,
      score: correct * 3,
      totalScore: total * 3,
      accuracyRate: Math.round((correct / total) * 100),
      timeSpent: '3分20秒',
    })
  }
  return records
}

const records = ref<AssessmentRecord[]>([])

// ---- 聚合统计 ----
const overview = computed(() => {
  const total = records.value.reduce((s, r) => s + (r.totalQuestions || 0), 0)
  const correct = records.value.reduce((s, r) => s + (r.correctCount || 0), 0)
  return {
    totalQuestions: total,
    accuracy: total ? Math.round((correct / total) * 100) : 0,
    kpCount: new Set(records.value.map((r) => r.title)).size,
    attempts: records.value.length,
  }
})

const kpAgg = computed(() => {
  const map = new Map<string, KpAgg>()
  records.value.forEach((r) => {
    const key = r.title || '未知知识点'
    const agg = map.get(key) ?? { total: 0, correct: 0 }
    agg.total += r.totalQuestions || 0
    agg.correct += r.correctCount || 0
    map.set(key, agg)
  })
  return [...map.entries()].map(([name, agg]) => ({
    name,
    total: agg.total,
    correct: agg.correct,
    rate: agg.total ? Math.round((agg.correct / agg.total) * 100) : 0,
  }))
})

/** 近 14 天（含今日）每日汇总 */
const dailyStats = computed(() => {
  const days: { key: string; label: string; total: number; correct: number }[] = []
  const map = new Map<string, { total: number; correct: number }>()
  for (let d = 13; d >= 0; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const key = dayKey(date)
    map.set(key, { total: 0, correct: 0 })
    days.push({ key, label: `${date.getMonth() + 1}/${date.getDate()}`, total: 0, correct: 0 })
  }
  records.value.forEach((r) => {
    const key = dayKey(parseDate(r.date))
    const bucket = map.get(key)
    if (bucket) {
      bucket.total += r.totalQuestions || 0
      bucket.correct += r.correctCount || 0
    }
  })
  days.forEach((d) => {
    const bucket = map.get(d.key)
    if (bucket) {
      d.total = bucket.total
      d.correct = bucket.correct
    }
  })
  return days
})

// ---- 图表渲染 ----
function renderRing() {
  if (!ringRef.value) return
  ringChart = echarts.init(ringRef.value)

  // 掌握度分布：正确率 >=80 已掌握，60-79 良好，<60 待加强
  let mastered = 0
  let good = 0
  let weak = 0
  kpAgg.value.forEach((kp) => {
    if (kp.rate >= 80) mastered++
    else if (kp.rate >= 60) good++
    else weak++
  })

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
        data: [
          { value: mastered, name: '已掌握（≥80%）', itemStyle: { color: '#67c23a' } },
          { value: good, name: '良好（60%-79%）', itemStyle: { color: '#e6a23c' } },
          { value: weak, name: '待加强（<60%）', itemStyle: { color: '#f56c6c' } },
        ],
      },
    ],
  }
  ringChart.setOption(option)
}

function renderLine() {
  if (!lineRef.value) return
  lineChart = echarts.init(lineRef.value)

  const days = dailyStats.value
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

  const kps = [...kpAgg.value].sort((a, b) => b.total - a.total).slice(0, 8)
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
  const loaded = loadAllRecords()
  records.value = loaded.length ? loaded : buildDemoData()
  requestAnimationFrame(() => {
    renderRing()
    renderLine()
    renderBar()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
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
