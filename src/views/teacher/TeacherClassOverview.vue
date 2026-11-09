<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">班级学情统计</h2>
      <el-select
        v-model="courseId"
        placeholder="请选择课程"
        style="width: 280px"
        @change="loadOverview"
      >
        <el-option v-for="c in myCourses" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>

    <template v-if="overview">
      <div class="stat-cards">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">选课人数</div>
          <div class="stat-value">{{ overview.studentCount }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">平均学习进度</div>
          <div class="stat-value">{{ overview.avgProgress }}%</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">掌握度优秀（≥80）</div>
          <div class="stat-value stat-excellent">{{ overview.excellentCount }} 人</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">掌握度良好（60-80）</div>
          <div class="stat-value stat-good">{{ overview.goodCount }} 人</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">掌握度待加强（&lt;60）</div>
          <div class="stat-value stat-weak">{{ overview.weakCount }} 人</div>
        </el-card>
      </div>

      <div class="overview-body">
        <div class="chart-box">
          <div ref="chartRef" class="chart" />
        </div>
        <el-table :data="overview.students" v-loading="loading" border stripe class="student-table">
          <el-table-column prop="username" label="学号" min-width="130" />
          <el-table-column prop="nickname" label="姓名" min-width="100" />
          <el-table-column prop="progress" label="学习进度" width="160">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" :stroke-width="10" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <el-empty v-if="!loading && courseId && !overview" description="暂无班级学情数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { getMyTeachingCourses } from '@/api/teacher'
import { getClassOverview } from '@/api/teacherStats'
import type { ClassOverview } from '@/api/teacherStats'
import type { Course } from '@/types/course'

const myCourses = ref<Course[]>([])
const courseId = ref<number | undefined>(undefined)
const overview = ref<ClassOverview | null>(null)
const loading = ref(false)
const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

const renderChart = async () => {
  if (!overview.value) return
  await nextTick()
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  const option: EChartsOption = {
    title: { text: '掌握度分布', left: 'center', textStyle: { fontSize: 15 } },
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        name: '掌握度分布',
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '48%'],
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: overview.value.excellentCount, name: '优秀（≥80）', itemStyle: { color: '#67c23a' } },
          { value: overview.value.goodCount, name: '良好（60-80）', itemStyle: { color: '#409eff' } },
          { value: overview.value.weakCount, name: '待加强（<60）', itemStyle: { color: '#f56c6c' } },
        ],
      },
    ],
  }
  chart.setOption(option)
}

const loadOverview = async () => {
  if (courseId.value == null) return
  loading.value = true
  try {
    overview.value = await getClassOverview(courseId.value)
    renderChart()
  } catch {
    ElMessage.error('加载班级学情失败')
  } finally {
    loading.value = false
  }
}

const loadCourses = async () => {
  try {
    myCourses.value = await getMyTeachingCourses()
    if (myCourses.value.length > 0) {
      courseId.value = myCourses.value[0]!.id
      await loadOverview()
    }
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

watch(() => overview.value, renderChart)

onMounted(loadCourses)
onBeforeUnmount(() => {
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.teacher-page {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  min-width: 150px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-excellent {
  color: #67c23a;
}

.stat-good {
  color: #409eff;
}

.stat-weak {
  color: #f56c6c;
}

.overview-body {
  display: flex;
  gap: 16px;
}

.chart-box {
  width: 360px;
  flex-shrink: 0;
}

.chart {
  height: 320px;
}

.student-table {
  flex: 1;
}
</style>
