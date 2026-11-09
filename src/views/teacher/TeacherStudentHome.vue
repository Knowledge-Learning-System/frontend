<template>
  <div class="teacher-page">
    <div class="page-header">
      <div class="header-left">
        <el-button link type="primary" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回预警列表
        </el-button>
        <h2 class="page-title">学生主页</h2>
      </div>
      <el-select
        v-model="courseId"
        placeholder="请选择课程"
        style="width: 260px"
        @change="loadDiagnosis"
      >
        <el-option v-for="c in myCourses" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>

    <template v-if="student">
      <!-- 学生信息区 -->
      <div class="info-card">
        <div class="section-title">学生信息</div>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="学号">{{ student.username }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ student.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ student.role }}</el-descriptions-item>
        </el-descriptions>
        <el-button class="edit-btn" type="primary" plain @click="openEditDialog">修改学生信息</el-button>
      </div>

      <!-- 诊断报告区 -->
      <div class="diagnosis-card">
        <div class="section-title">诊断报告</div>
        <template v-if="diagnosis">
          <div class="report-header">
            <div class="score-box">
              <el-progress
                type="dashboard"
                :percentage="diagnosis.overallScore"
                :width="120"
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
              <div class="sub-title">薄弱知识点（掌握度 &lt; 60）</div>
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

              <div class="sub-title suggestion-title">学习建议</div>
              <ul class="suggestion-list">
                <li v-for="(s, i) in diagnosis.suggestions" :key="i">{{ s }}</li>
              </ul>
            </div>
          </div>
        </template>
        <el-empty v-else-if="!loading && courseId" description="暂无诊断报告" />
        <div v-loading="loading" class="diagnosis-loading" />
      </div>
    </template>

    <el-empty v-else-if="!loading" description="未找到该学生" />
  </div>

  <!-- 修改学生信息弹窗 -->
  <el-dialog v-model="editDialogVisible" title="修改学生信息" width="420px">
    <el-form label-width="90px" @submit.prevent>
      <el-form-item label="学号">
        <el-input :model-value="student?.username" disabled />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="editNickname" placeholder="请输入学生姓名" maxlength="20" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="editing" @click="handleSaveEdit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { getMyTeachingCourses, getStudents, updateStudent } from '@/api/teacher'
import { getStudentDiagnosis } from '@/api/teacherStats'
import type { TeacherStudent } from '@/api/teacher'
import type { StudentDiagnosis } from '@/api/teacherStats'
import type { Course } from '@/types/course'

const route = useRoute()
const router = useRouter()

const studentId = computed(() => Number(route.params.id))
const myCourses = ref<Course[]>([])
const courseId = ref<number | undefined>(undefined)
const student = ref<TeacherStudent | null>(null)
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

const goBack = () => {
  router.push('/teacher/warnings')
}

const loadCourses = async () => {
  try {
    myCourses.value = await getMyTeachingCourses()
    if (myCourses.value.length > 0) {
      const fromQuery = route.query.courseId ? Number(route.query.courseId) : undefined
      courseId.value =
        fromQuery && myCourses.value.some((c) => c.id === fromQuery)
          ? fromQuery
          : myCourses.value[0]!.id
      await loadDiagnosis()
    }
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

const loadStudent = async () => {
  try {
    const list = await getStudents()
    student.value = list.find((s) => s.id === studentId.value) ?? null
  } catch {
    ElMessage.error('加载学生信息失败')
  }
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

// ---- 修改学生信息 ----
const editDialogVisible = ref(false)
const editNickname = ref('')
const editing = ref(false)

const openEditDialog = () => {
  if (!student.value) return
  editNickname.value = student.value.nickname ?? ''
  editDialogVisible.value = true
}

const handleSaveEdit = async () => {
  const nickname = editNickname.value.trim()
  if (!nickname) {
    ElMessage.warning('请输入学生姓名')
    return
  }
  if (!student.value) return
  editing.value = true
  try {
    await updateStudent(student.value.id, nickname)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    await loadStudent()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    editing.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadStudent(), loadCourses()])
})

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

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.info-card {
  margin-bottom: 16px;
}

.edit-btn {
  margin-top: 12px;
}

.diagnosis-card {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-bottom: 14px;
}

.score-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-label {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
}

.report-info {
  flex: 1;
}

.info-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.report-body {
  display: flex;
  gap: 16px;
}

.chart-box {
  width: 380px;
  flex-shrink: 0;
}

.radar {
  height: 340px;
}

.detail-box {
  flex: 1;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.suggestion-title {
  margin-top: 18px;
}

.suggestion-list {
  margin: 0;
  padding-left: 18px;
  color: #606266;
  line-height: 1.8;
}

.diagnosis-loading {
  min-height: 200px;
}
</style>
