<template>
  <div class="learning-plan-page">
    <!-- 顶部 -->
    <div class="plan-header">
      <div class="header-left">
        <el-button text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">学习计划</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" plain @click="openPlanDialog">
          <el-icon><Setting /></el-icon>
          计划设置
        </el-button>
        <el-button type="success" plain @click="openQuizDialog">
          <el-icon><EditPen /></el-icon>
          今日测试
        </el-button>
      </div>
    </div>

    <!-- 总进度概览 -->
    <div class="plan-overview">
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#409eff"><TrendCharts /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">计划总进度</div>
          <div class="overview-value">{{ plan.completionRate }}%</div>
          <el-progress :percentage="plan.completionRate" :stroke-width="8" :show-text="false" />
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#67c23a"><Document /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">学习步骤</div>
          <div class="overview-value">{{ plan.completedSteps }} / {{ plan.totalSteps }}</div>
          <div class="overview-sub">已完成 / 总步骤</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#e6a23c"><Calendar /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">预计学习天数</div>
          <div class="overview-value">{{ plan.estimatedDays }} 天</div>
          <div class="overview-sub">按每天 {{ perDaySteps }} 个知识点估算</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#f56c6c"><Reading /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">当前课程</div>
          <div class="overview-value course-name">{{ plan.courseName || '未选择课程' }}</div>
        </div>
      </div>
    </div>

    <!-- 学习步骤列表（按知识图谱依赖拓扑序） -->
    <div class="steps-panel" v-loading="loading">
      <el-empty v-if="!loading && plan.steps.length === 0" description="该课程暂无知识图谱学习步骤" />
      <el-timeline v-else>
        <el-timeline-item
          v-for="step in plan.steps"
          :key="step.kpId"
          :type="step.completed ? 'success' : 'primary'"
          :hollow="!step.completed"
          size="large"
        >
          <div class="step-card" :class="{ 'step-completed': step.completed }">
            <div class="step-main">
              <div class="step-head">
                <span class="step-order">{{ step.order }}</span>
                <h4 class="step-name">{{ step.name }}</h4>
                <el-tag v-if="step.completed" type="success" size="small" effect="dark">已完成</el-tag>
                <el-tag v-else type="primary" size="small" effect="plain">待学习</el-tag>
              </div>
              <p class="step-desc">{{ step.description }}</p>
              <div class="step-meta">
                <span class="meta-item">
                  <el-icon><Connection /></el-icon>
                  前置：{{ step.prerequisiteNames.length > 0 ? step.prerequisiteNames.join('、') : '无（基础知识点）' }}
                </span>
                <span class="meta-item">
                  <el-icon><Document /></el-icon>
                  掌握度：{{ step.mastery }}%
                </span>
              </div>
            </div>
            <div class="step-actions">
              <el-button size="small" type="primary" @click="handleLearn(step)">
                <el-icon><VideoPlay /></el-icon>
                去学习
              </el-button>
              <el-button
                v-if="!step.completed"
                size="small"
                type="success"
                plain
                :loading="marking === step.kpId"
                @click="handleComplete(step)"
              >
                <el-icon><CircleCheck /></el-icon>
                标记完成
              </el-button>
              <el-button
                v-else
                size="small"
                plain
                :loading="marking === step.kpId"
                @click="handleUncomplete(step)"
              >
                取消完成
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 计划设置弹窗 -->
    <el-dialog v-model="planDialogVisible" title="学习计划设置" width="520px" :close-on-click-modal="false">
      <el-form :model="planForm" label-width="110px">
        <el-form-item label="学习课程">
          <el-select v-model="planForm.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option v-for="c in courseOptions" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="planForm.startDate" type="date" value-format="YYYY-MM-DD" placeholder="选择开始日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="planForm.endDate" type="date" value-format="YYYY-MM-DD" placeholder="选择结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每日学习时间">
          <el-input-number v-model="planForm.dailyHours" :min="0.5" :max="12" :step="0.5" />
          <span class="form-unit">小时</span>
        </el-form-item>
        <el-form-item label="每日学习目标">
          <el-input-number v-model="planForm.dailyTarget" :min="1" :max="50" :step="1" />
          <span class="form-unit">个知识点</span>
        </el-form-item>
        <el-form-item label="提醒时间">
          <el-time-select v-model="planForm.remindTime" start="00:00" step="00:05" end="23:55" placeholder="选择提醒时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-if="currentPlanId" type="danger" @click="handleDeletePlan">删除计划</el-button>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="planSaving" @click="handleSavePlan">保存</el-button>
      </template>
    </el-dialog>

    <!-- 今日测试弹窗 -->
    <el-dialog v-model="quizDialogVisible" title="今日测试" width="620px" :close-on-click-modal="false">
      <div v-loading="quizLoading" class="quiz-body">
        <template v-if="!quizLoading && quizQuestions.length > 0">
          <div v-for="(q, idx) in quizQuestions" :key="q.id" class="quiz-question">
            <div class="quiz-question-title">{{ idx + 1 }}. {{ q.content }}</div>
            <el-radio-group v-model="quizAnswers[q.id]">
              <el-radio v-for="opt in parseQuizOptions(q.options)" :key="opt" :label="opt" class="quiz-option">
                {{ opt }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="quiz-footer">
            <el-button type="primary" :loading="quizSubmitting" @click="handleSubmitQuiz">提交测试</el-button>
          </div>
        </template>
        <el-empty v-else-if="!quizLoading" description="今天还没有学习记录，先去看视频吧" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Calendar, CircleCheck, Clock, Connection, Document,
  EditPen, Reading, Setting, TrendCharts, VideoPlay,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  createPlan, updatePlan, deletePlan, getMyPlans, getFullStudyPlan, completePlanStep,
  getDailyQuiz, getNotifications, markNotificationsRead,
  type CreatePlanRequest, type FullStudyPlan, type StudyPlanStep,
} from '@/api/study'
import { submitAnswers, type QuestionItem, type SubmitAnswerResult } from '@/api/question'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

const loading = ref(false)
const marking = ref('')
const perDaySteps = 3

const plan = ref<FullStudyPlan>({
  courseId: 0,
  courseName: '',
  totalSteps: 0,
  completedSteps: 0,
  completionRate: 0,
  estimatedDays: 0,
  steps: [],
})

const loadData = async () => {
  const course = courseStore.getCurrentCourse()
  if (!course) return
  loading.value = true
  try {
    plan.value = await getFullStudyPlan(course.id)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载学习计划失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  loadNotifications()
})

const handleBack = () => {
  router.back()
}

const handleLearn = (step: StudyPlanStep) => {
  const course = courseStore.getCurrentCourse()
  router.push({
    path: `/course/${course?.id || 1}`,
    query: { tab: 'graph', highlight: step.kpId, nodeName: step.name }
  })
}

const handleComplete = async (step: StudyPlanStep) => {
  const course = courseStore.getCurrentCourse()
  if (!course) return
  marking.value = step.kpId
  try {
    await completePlanStep(course.id, step.kpId, true)
    ElMessage.success(`已标记「${step.name}」完成`)
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '标记完成失败')
  } finally {
    marking.value = ''
  }
}

const handleUncomplete = async (step: StudyPlanStep) => {
  const course = courseStore.getCurrentCourse()
  if (!course) return
  marking.value = step.kpId
  try {
    await completePlanStep(course.id, step.kpId, false)
    ElMessage.success(`已取消「${step.name}」的完成标记`)
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '取消完成失败')
  } finally {
    marking.value = ''
  }
}

// ===== 学习计划设置 =====
const planDialogVisible = ref(false)
const planSaving = ref(false)
const currentPlanId = ref<number | null>(null)
const planForm = ref<CreatePlanRequest>({
  courseId: 0,
  startDate: '',
  endDate: '',
  dailyHours: 1,
  dailyTarget: 3,
  remindTime: '20:00',
})

const courseOptions = computed(() => courseStore.allCourses)

const openPlanDialog = async () => {
  if (courseOptions.value.length === 0) {
    try {
      await courseStore.fetchAllCourses()
    } catch {
      // 忽略加载失败
    }
  }
  planDialogVisible.value = true
  currentPlanId.value = null
  planForm.value = {
    courseId: courseOptions.value[0]?.id ?? 0,
    startDate: '',
    endDate: '',
    dailyHours: 1,
    dailyTarget: 3,
    remindTime: '20:00',
  }
  try {
    const plans = await getMyPlans()
    if (plans && plans.length > 0) {
      const p = plans[0]
      if (p) {
        currentPlanId.value = p.id
        planForm.value = {
          courseId: p.courseId,
          startDate: p.startDate,
          endDate: p.endDate,
          dailyHours: p.dailyHours,
          dailyTarget: p.dailyTarget,
          remindTime: p.remindTime,
        }
      }
    }
  } catch {
    // 无计划时忽略
  }
}

const handleSavePlan = async () => {
  if (!planForm.value.courseId) {
    ElMessage.warning('请选择学习课程')
    return
  }
  if (!planForm.value.startDate || !planForm.value.endDate) {
    ElMessage.warning('请选择开始和结束日期')
    return
  }
  planSaving.value = true
  try {
    if (currentPlanId.value) {
      await updatePlan(currentPlanId.value, planForm.value)
      ElMessage.success('计划已更新')
    } else {
      await createPlan(planForm.value)
      ElMessage.success('计划已创建')
    }
    planDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '保存计划失败')
  } finally {
    planSaving.value = false
  }
}

const handleDeletePlan = async () => {
  if (!currentPlanId.value) return
  try {
    await deletePlan(currentPlanId.value)
    ElMessage.success('计划已删除')
    planDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '删除计划失败')
  }
}

// ===== 今日测试 =====
const quizDialogVisible = ref(false)
const quizLoading = ref(false)
const quizSubmitting = ref(false)
const quizQuestions = ref<QuestionItem[]>([])
const quizAnswers = ref<Record<number, string>>({})
const quizResult = ref<SubmitAnswerResult | null>(null)

const openQuizDialog = async () => {
  const course = courseStore.getCurrentCourse()
  if (!course) {
    ElMessage.warning('请先选择课程')
    return
  }
  quizDialogVisible.value = true
  quizLoading.value = true
  quizQuestions.value = []
  quizAnswers.value = {}
  quizResult.value = null
  try {
    quizQuestions.value = await getDailyQuiz(course.id)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载今日测试失败')
  } finally {
    quizLoading.value = false
  }
}

const parseQuizOptions = (options: string): string[] => {
  if (!options) return []
  try {
    const arr = JSON.parse(options)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

const handleSubmitQuiz = async () => {
  const course = courseStore.getCurrentCourse()
  const userId = userStore.userInfo?.id
  if (!course || !userId) return
  const answers = quizQuestions.value
    .filter((q) => quizAnswers.value[q.id])
    .map((q) => ({
      questionId: q.id,
      knowledgePointId: q.knowledgePointId,
      answer: quizAnswers.value[q.id] ?? '',
    }))
  if (answers.length === 0) {
    ElMessage.warning('请先作答')
    return
  }
  quizSubmitting.value = true
  try {
    quizResult.value = await submitAnswers({ userId, courseId: course.id, answers })
    ElMessage.success(`测试完成，答对 ${quizResult.value.correctCount} / ${quizResult.value.totalQuestions} 题`)
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '提交失败')
  } finally {
    quizSubmitting.value = false
  }
}

const loadNotifications = async () => {
  try {
    const list = await getNotifications()
    const unread = (list || []).filter((n) => n.isRead === 0)
    if (unread.length > 0) {
      ElMessage.info(`你有 ${unread.length} 条学习提醒`)
      markNotificationsRead().catch(() => {})
    }
  } catch {
    // 忽略
  }
}
</script>

<style scoped lang="css">
.learning-plan-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.plan-header {
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

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 概览卡片 */
.plan-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.overview-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.overview-info {
  flex: 1;
  min-width: 0;
}

.overview-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.overview-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.overview-value.course-name {
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.overview-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 步骤列表 */
.steps-panel {
  background: white;
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  min-height: 300px;
}

.step-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 14px 16px;
  transition: all 0.3s;
}

.step-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.step-card.step-completed {
  background: #f0f9eb;
  border-color: #b3e19d;
}

.step-main {
  flex: 1;
  min-width: 0;
}

.step-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.step-order {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.step-completed .step-order {
  background: #67c23a;
}

.step-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.step-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.step-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.step-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
}

.form-unit {
  margin-left: 8px;
  color: #909399;
  font-size: 13px;
}

.quiz-body {
  min-height: 200px;
  max-height: 60vh;
  overflow-y: auto;
}

.quiz-question {
  margin-bottom: 20px;
}

.quiz-question-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.quiz-option {
  display: block;
  margin: 4px 0;
}

.quiz-footer {
  margin-top: 16px;
  text-align: right;
}
</style>
