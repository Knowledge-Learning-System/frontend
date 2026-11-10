<template>
  <div class="admin-dashboard">
    <!-- 核心指标 -->
    <el-row :gutter="16" class="stat-row">
      <el-col v-for="item in cards" :key="item.label" :span="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-label">{{ item.label }}</div>
          <div class="stat-value">{{ item.value }}</div>
          <div class="stat-extra">{{ item.extra }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card v-loading="loading" shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">用户角色分布</span>
              <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
            </div>
          </template>
          <div ref="roleChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card v-loading="loading" shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">教学资源与互动统计</span>
            </div>
          </template>
          <div ref="resChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getAdminOverview, type AdminOverview } from '@/api/admin'

const loading = ref(false)
const overview = ref<AdminOverview | null>(null)

const roleChartRef = ref<HTMLDivElement | null>(null)
const resChartRef = ref<HTMLDivElement | null>(null)

let roleChart: echarts.ECharts | null = null
let resChart: echarts.ECharts | null = null

const cards = computed(() => {
  const data = overview.value
  return [
    {
      label: '用户总数',
      value: data?.userTotal ?? 0,
      extra: `管理员 ${data?.adminCount ?? 0} · 教师 ${data?.teacherCount ?? 0} · 学生 ${data?.studentCount ?? 0}`,
    },
    {
      label: '课程总数',
      value: data?.courseTotal ?? 0,
      extra: `选课记录 ${data?.enrollTotal ?? 0} 条`,
    },
    {
      label: '学习资源',
      value: (data?.videoTotal ?? 0) + (data?.coursewareTotal ?? 0),
      extra: `视频 ${data?.videoTotal ?? 0} · 课件 ${data?.coursewareTotal ?? 0}`,
    },
    {
      label: '教学互动',
      value: (data?.questionTotal ?? 0) + (data?.homeworkTotal ?? 0) + (data?.discussionTotal ?? 0),
      extra: `题目 ${data?.questionTotal ?? 0} · 作业 ${data?.homeworkTotal ?? 0} · 讨论 ${data?.discussionTotal ?? 0}`,
    },
  ]
})

const renderCharts = () => {
  const data = overview.value
  if (!data) return

  if (roleChartRef.value) {
    if (!roleChart) roleChart = echarts.init(roleChartRef.value)
    roleChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          name: '用户角色',
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['50%', '45%'],
          label: { formatter: '{b}: {c}' },
          data: [
            { name: '学生', value: data.studentCount ?? 0 },
            { name: '教师', value: data.teacherCount ?? 0 },
            { name: '管理员', value: data.adminCount ?? 0 },
          ],
        },
      ],
    })
  }

  if (resChartRef.value) {
    if (!resChart) resChart = echarts.init(resChartRef.value)
    resChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 24, top: 24, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['视频资源', '课件资源', '题目', '作业', '讨论'],
        axisLabel: { color: '#606266' },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          barWidth: '46%',
          itemStyle: { color: '#409eff', borderRadius: [4, 4, 0, 0] },
          data: [
            data.videoTotal ?? 0,
            data.coursewareTotal ?? 0,
            data.questionTotal ?? 0,
            data.homeworkTotal ?? 0,
            data.discussionTotal ?? 0,
          ],
        },
      ],
    })
  }
}

const loadData = async () => {
  loading.value = true
  try {
    overview.value = await getAdminOverview()
    renderCharts()
  } catch {
    ElMessage.error('加载系统概览数据失败')
  } finally {
    loading.value = false
  }
}

const handleResize = () => {
  roleChart?.resize()
  resChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  roleChart?.dispose()
  resChart?.dispose()
  roleChart = null
  resChart = null
})
</script>

<style scoped>
.admin-dashboard {
  padding: 4px;
}

.stat-row {
  margin-bottom: 16px;
}

.stat-card {
  border-radius: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-value {
  margin-top: 8px;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-extra {
  margin-top: 6px;
  font-size: 12px;
  color: #a8abb2;
}

.chart-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-box {
  width: 100%;
  height: 320px;
}
</style>
