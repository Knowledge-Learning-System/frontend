<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">学生诊断报告</h2>
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
          @change="loadDiagnosis"
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

    <template v-if="diagnosis">
      <div class="report-header">
        <div class="score-box">
          <el-progress
            type="dashboard"
            :percentage="diagnosis.overallScore"
            :width="140"
            :stroke-width="10"
            :color="scoreColor"
          />
          <div class="score-label">综合掌握度评分</div>
        </div>
        <div class="report-info">
          <div class="info-title">学生：{{ diagnosis.studentName }}</div>
          <el-alert
            type="info"
            :closable="false"
            title="基于知识点掌握度（DINA 认知诊断）生成，薄弱点为掌握度低于 60 的知识点。"
          />
        </div>
      </div>

      <div class="report-body">
        <div class="chart-box">
          <div ref="radarRef" class="radar" />
        </div>
        <div class="detail-box">
          <div class="section-title">薄弱知识点（掌握度 &lt; 60）</div>
          <el-table :data="diagnosis.weakPoints" border stripe size="small">
            <el-table-column prop="name" label="知识点" min-width="150" />
            <el-table-column prop="mastery" label="掌握度" width="100">
              <template #default="{ row }">
                <el-tag :type="row.mastery < 60 ? 'danger' : 'success'" size="small">
                  {{ row.mastery }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalAttempts" label="答题次数" width="90" />
            <el-table-column prop="errorCount" label="错误次数" width="90" />
          </el-table>

          <div class="section-title suggestion-title">学习建议</div>
          <ul class="suggestion-list">
            <li v-for="(s, i) in diagnosis.suggestions" :key="i">{{ s }}</li>
          </ul>
        </div>
      </div>
    </template>

    <el-empty v-if="!loading && courseId && studentId && !diagnosis" description="暂无诊断报告" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { getMyTeachingCourses } from '@/api/teacher'
import { getCourseStudents, getStudentDiagnosis } from '@/api/teacherStats'
import type { StudentDiagnosis, TeacherCourseStudent } from '@/api/teacherStats'
import type { Course } from '@/types/course'

const myCourses = ref<Course[]>([])
const courseId = ref<number | undefined>(undefined)
const courseStudents = ref<TeacherCourseStudent[]>([])
const studentId = ref<number | undefined>(undefined)
const diagnosis = ref<StudentDiagnosis | null>(null)
const loading = ref(false)
const radarRef = ref<HTMLDivElement>()
let radarChart: echarts.ECharts | null = null

const scoreColor = computed(() => {
  if (!diagnosis.value) return '#409eff'
  const s = diagnosis.value.overallScore
  if (s >= 80) return '#67c23a'
  if (s >= 60) return '#409eff'
  return '#f56c6c'
})

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
      await loadDiagnosis()
    } else {
      studentId.value = undefined
      diagnosis.value = null
    }
  } catch {
    ElMessage.error('加载学生列表失败')
  }
}

const handleCourseChange = async () => {
  diagnosis.value = null
  studentId.value = undefined
  await loadStudents()
}

const loadDiagnosis = async () => {
  if (courseId.value == null || studentId.value == null) return
  loading.value = true
  try {
    diagnosis.value = await getStudentDiagnosis(courseId.value, studentId.value)
    renderRadar()
  } catch {
    ElMessage.error('加载诊断报告失败')
  } finally {
    loading.value = false
  }
}

const renderRadar = async () => {
  if (!diagnosis.value || !radarRef.value) return
  await nextTick()
  if (!radarChart) radarChart = echarts.init(radarRef.value)
  const d = diagnosis.value
  const option: EChartsOption = {
    title: { text: '知识点掌握度雷达图', left: 'center', textStyle: { fontSize: 15 } },
    tooltip: {},
    radar: {
      indicator: d.radar.map((r) => ({ name: r.name, max: 100 })),
      radius: '65%',
      splitArea: { areaStyle: { color: ['rgba(64,158,255,0.02)', 'rgba(64,158,255,0.05)'] } },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: d.radar.map((r) => r.mastery),
            name: d.studentName,
            areaStyle: { opacity: 0.2 },
          },
        ],
      },
    ],
  }
  radarChart.setOption(option)
}

watch(() => diagnosis.value, renderRadar)

onMounted(loadCourses)
onBeforeUnmount(() => {
  radarChart?.dispose()
  radarChart = null
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

.report-header {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 16px;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.report-info {
  flex: 1;
}

.info-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.report-body {
  display: flex;
  gap: 16px;
}

.chart-box {
  width: 420px;
  flex-shrink: 0;
}

.radar {
  height: 360px;
}

.detail-box {
  flex: 1;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.suggestion-title {
  margin-top: 20px;
}

.suggestion-list {
  margin: 0;
  padding-left: 18px;
  color: #606266;
  line-height: 1.8;
}
</style>
