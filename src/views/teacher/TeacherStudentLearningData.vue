<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">学生学习数据</h2>
      <div class="header-selects">
        <el-select
          v-model="courseId"
          placeholder="请选择课程"
          style="width: 220px"
          @change="handleCourseChange"
        >
          <el-option v-for="c in myCourses" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-select
          v-model="studentId"
          placeholder="请选择学生"
          style="width: 200px"
          @change="loadData"
        >
          <el-option
            v-for="s in courseStudents"
            :key="s.studentId"
            :label="`${s.nickname || s.username}（${s.username}）`"
            :value="s.studentId"
          />
        </el-select>
      </div>
    </div>

    <template v-if="data">
      <div class="stat-cards">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">答题总数</div>
          <div class="stat-value">{{ data.totalAnswers }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">答题正确率</div>
          <div class="stat-value">{{ data.accuracy }}%</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">学习行为次数（活跃度近似）</div>
          <div class="stat-value">{{ data.behaviorCount }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">知识点掌握数</div>
          <div class="stat-value">{{ data.masteredKpCount }} / {{ data.totalKpCount }}</div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">平均掌握度</div>
          <div class="stat-value">{{ data.avgMastery }}</div>
        </el-card>
      </div>

      <div class="charts">
        <div class="chart-box">
          <div ref="dailyChartRef" class="chart" />
        </div>
        <div class="chart-box">
          <div ref="masteryChartRef" class="chart" />
        </div>
      </div>

      <el-table :data="data.dailyTrend" border stripe class="detail-table">
        <el-table-column prop="date" label="日期" min-width="120" />
        <el-table-column prop="answerCount" label="答题数" width="100" />
        <el-table-column prop="accuracy" label="正确率" width="100">
          <template #default="{ row }">{{ row.accuracy }}%</template>
        </el-table-column>
        <el-table-column prop="behaviorCount" label="学习行为数" width="120" />
      </el-table>
    </template>

    <el-empty v-if="!loading && courseId && studentId && !data" description="暂无学习数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { getMyTeachingCourses } from '@/api/teacher'
import { getCourseStudents, getStudentLearningData } from '@/api/teacherStats'
import type { StudentLearningData, TeacherCourseStudent } from '@/api/teacherStats'
import type { Course } from '@/types/course'

const myCourses = ref<Course[]>([])
const courseId = ref<number | undefined>(undefined)
const courseStudents = ref<TeacherCourseStudent[]>([])
const studentId = ref<number | undefined>(undefined)
const data = ref<StudentLearningData | null>(null)
const loading = ref(false)
const dailyChartRef = ref<HTMLDivElement>()
const masteryChartRef = ref<HTMLDivElement>()
let dailyChart: echarts.ECharts | null = null
let masteryChart: echarts.ECharts | null = null

const loadCourses = async () => {
  try {
    myCourses.value = await getMyTeachingCourses()
    if (myCourses.value.length > 0) {
      courseId.value = myCourses.value[0]!.id
      await loadStudents()
    }
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

const loadStudents = async () => {
  if (courseId.value == null) return
  try {
    courseStudents.value = await getCourseStudents(courseId.value)
    if (courseStudents.value.length > 0) {
      studentId.value = courseStudents.value[0]!.studentId
      await loadData()
    } else {
      studentId.value = undefined
      data.value = null
    }
  } catch {
    ElMessage.error('加载学生列表失败')
  }
}

const handleCourseChange = async () => {
  data.value = null
  studentId.value = undefined
  await loadStudents()
}

const loadData = async () => {
  if (courseId.value == null || studentId.value == null) return
  loading.value = true
  try {
    data.value = await getStudentLearningData(courseId.value, studentId.value)
    renderCharts()
  } catch {
    ElMessage.error('加载学习数据失败')
  } finally {
    loading.value = false
  }
}

const renderCharts = async () => {
  if (!data.value) return
  await nextTick()
  const d = data.value
  if (dailyChartRef.value) {
    if (!dailyChart) dailyChart = echarts.init(dailyChartRef.value)
    const dates = d.dailyTrend.map((t) => t.date)
    const option: EChartsOption = {
      title: { text: '每日答题与活跃度', left: 'center', textStyle: { fontSize: 15 } },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: { type: 'category', data: dates },
      yAxis: { type: 'value' },
      series: [
        { name: '答题数', type: 'bar', data: d.dailyTrend.map((t) => t.answerCount), itemStyle: { color: '#409eff' } },
        { name: '学习行为数', type: 'line', data: d.dailyTrend.map((t) => t.behaviorCount), itemStyle: { color: '#e6a23c' } },
      ],
    }
    dailyChart.setOption(option)
  }
  if (masteryChartRef.value) {
    if (!masteryChart) masteryChart = echarts.init(masteryChartRef.value)
    const option: EChartsOption = {
      title: { text: '掌握度趋势（累计答题正确率）', left: 'center', textStyle: { fontSize: 15 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: d.masteryTrend.map((t) => t.date) },
      yAxis: { type: 'value', min: 0, max: 100 },
      series: [
        {
          name: '掌握度',
          type: 'line',
          smooth: true,
          data: d.masteryTrend.map((t) => t.avgMastery),
          areaStyle: { opacity: 0.15 },
          itemStyle: { color: '#67c23a' },
        },
      ],
    }
    masteryChart.setOption(option)
  }
}

watch(() => data.value, renderCharts)

onMounted(loadCourses)
onBeforeUnmount(() => {
  dailyChart?.dispose()
  masteryChart?.dispose()
  dailyChart = null
  masteryChart = null
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
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-selects {
  display: flex;
  gap: 12px;
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
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.charts {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-box {
  flex: 1;
}

.chart {
  height: 300px;
}

.detail-table {
  width: 100%;
}
</style>
