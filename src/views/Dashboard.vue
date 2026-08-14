<template>
  <div class="dashboard-page">
    <!-- 课程大厅 Hero -->
    <section class="hero-section">
      <div class="hero-content">
        <p class="hero-label">融合学科知识图谱与大语言模型的高校个性化在线学习系统</p>
        <h1 class="hero-title">课程大厅</h1>
        <p class="hero-subtitle">选择你想学习的课程</p>
      </div>
    </section>

    <!-- 功能快捷入口 -->
    <section class="quick-access-section">
      <h2 class="section-title">学习功能</h2>
      <div class="quick-access-grid">
        <div class="access-card" @click="router.push('/radar-chart')">
          <div class="access-icon" style="background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%); color: #1890ff;">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <h3 class="access-title">掌握度分析</h3>
          <p class="access-desc">通过雷达图可视化展示各知识点掌握程度</p>
        </div>
        
        <div class="access-card" @click="router.push('/weak-points')">
          <div class="access-icon" style="background: linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%); color: #fa8c16;">
            <el-icon :size="32"><WarningFilled /></el-icon>
          </div>
          <h3 class="access-title">薄弱点突破</h3>
          <p class="access-desc">针对性复习掌握度低的知识点</p>
        </div>
        
        <div class="access-card" @click="router.push('/recommendations')">
          <div class="access-icon" style="background: linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%); color: #52c41a;">
            <el-icon :size="32"><StarFilled /></el-icon>
          </div>
          <h3 class="access-title">智能推荐</h3>
          <p class="access-desc">AI 推荐下一个最适合学习的知识点</p>
        </div>
        
        <div class="access-card" @click="openPlanDialog">
          <div class="access-icon" style="background: linear-gradient(135deg, #f0f5ff 0%, #d6e4ff 100%); color: #597ef7;">
            <el-icon :size="32"><Calendar /></el-icon>
          </div>
          <h3 class="access-title">学习计划</h3>
          <p class="access-desc">按天规划学习路径，循序渐进</p>
        </div>
      </div>
    </section>

    <!-- 课程卡片网格 -->
    <section class="courses-section">
      <div class="course-grid" v-loading="loading">
        <div
          v-for="(course, index) in allCourses"
          :key="course.id"
          class="course-card"
          @click="handleSelectCourse(course.id)"
        >
          <!-- 封面 -->
          <div class="card-cover">
            <div class="cover-placeholder">
              <el-icon :size="48"><Reading /></el-icon>
            </div>
            <span class="cover-badge">{{ getCourseCode(course.name) }}</span>
          </div>

          <!-- 内容 -->
          <div class="card-body">
            <h3 class="card-name">{{ course.name }}</h3>
            <p class="card-desc">{{ course.description || '系统学习核心概念与实践方法' }}</p>

            <div class="card-meta">
              <span class="meta-item">
                <el-icon :size="14"><User /></el-icon>
                {{ getStudentCount(index) }}人
              </span>
              <span class="meta-item">
                {{ getTimeAgo(index) }}
              </span>
            </div>

            <!-- 进度条 -->
            <div class="card-progress">
              <div class="progress-header">
                <span>学习进度</span>
                <span class="progress-value">{{ getProgress(course.id) }}%</span>
              </div>
              <el-progress
                :percentage="getProgress(course.id)"
                :stroke-width="4"
                :show-text="false"
                color="#1890ff"
              />
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="card-footer">
            <el-button type="primary" class="enter-btn" @click.stop="handleSelectCourse(course.id)">
              进入课程
              <el-icon class="enter-arrow"><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 学习计划弹窗 -->
    <el-dialog
      v-model="showPlanDialog"
      title="学习计划"
      width="780px"
      class="plan-dialog"
    >
      <div class="plan-dialog-body">
        <!-- ====== 创建表单视图 ====== -->
        <div v-if="showCreateForm" class="plan-create-section">
          <div class="plan-create-header">
            <span class="plan-create-title">创建学习计划</span>
            <el-button text size="small" @click="showCreateForm = false">
              <el-icon><ArrowLeft /></el-icon>
              返回时间轴
            </el-button>
          </div>
          <el-form
            ref="createFormRef"
            :model="createForm"
            :rules="createFormRules"
            label-width="80px"
            size="small"
            class="plan-create-form"
          >
            <el-form-item label="课程" prop="courseId">
              <el-select v-model="createForm.courseId" placeholder="请选择课程" style="width: 100%">
                <el-option
                  v-for="c in courseStore.allCourses"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="日期" prop="date">
              <el-date-picker
                v-model="createForm.date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="类型" prop="type">
              <el-radio-group v-model="createForm.type">
                <el-radio label="learn">新学</el-radio>
                <el-radio label="review">复习</el-radio>
                <el-radio label="assessment">测评</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="任务名称" prop="name">
              <el-input
                v-model="createForm.name"
                placeholder="请输入任务名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="任务描述" prop="description">
              <el-input
                v-model="createForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入任务描述"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="预计用时" prop="duration">
              <el-input-number v-model="createForm.duration" :min="5" :max="180" :step="5" />
              <span class="plan-duration-unit">分钟</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitCreatePlan" :loading="createSubmitting">
                创建
              </el-button>
              <el-button @click="showCreateForm = false">取消</el-button>
            </el-form-item>
          </el-form>
        </div>

        <!-- ====== 时间轴视图（默认） ====== -->
        <template v-else>
          <!-- 工具栏 -->
          <div class="plan-toolbar">
            <el-button type="primary" size="small" @click="openCreateForm">
              <el-icon><Plus /></el-icon>
              创建计划
            </el-button>
          </div>

          <!-- 四格概览统计 -->
          <div class="plan-overview">
            <div class="overview-card">
              <div class="overview-icon" style="background: #ecf5ff;">
                <el-icon :size="20" color="#409eff"><Calendar /></el-icon>
              </div>
              <div class="overview-info">
                <div class="overview-label">总学习天数</div>
                <div class="overview-value">{{ planTotalDays }} 天</div>
              </div>
            </div>
            <div class="overview-card">
              <div class="overview-icon" style="background: #f0f9eb;">
                <el-icon :size="20" color="#67c23a"><Document /></el-icon>
              </div>
              <div class="overview-info">
                <div class="overview-label">已学知识点</div>
                <div class="overview-value">{{ planCompletedCount }} / {{ planTotalCount }}</div>
              </div>
            </div>
            <div class="overview-card">
              <div class="overview-icon" style="background: #fdf6ec;">
                <el-icon :size="20" color="#e6a23c"><Clock /></el-icon>
              </div>
              <div class="overview-info">
                <div class="overview-label">预计用时</div>
                <div class="overview-value">{{ planTotalHours }}h</div>
              </div>
            </div>
            <div class="overview-card">
              <div class="overview-icon" style="background: #fef0f0;">
                <el-icon :size="20" color="#f56c6c"><TrendCharts /></el-icon>
              </div>
              <div class="overview-info">
                <div class="overview-label">完成度</div>
                <div class="overview-value">{{ planCompletionRate }}%</div>
              </div>
            </div>
          </div>

          <!-- 时间轴 -->
          <div class="plan-timeline-wrapper">
            <div class="plan-timeline" v-loading="planLoading">
              <div v-if="planTasks.length === 0 && !planLoading" class="plan-empty">
                <el-icon :size="28"><Calendar /></el-icon>
                <p>暂无学习计划数据</p>
              </div>
              <template v-else>
                <div class="plan-timeline-scroll">
                  <div
                    v-for="day in planDisplayedDays"
                    :key="day.date"
                    class="plan-day-column"
                    :class="{ 'plan-day-today': day.isToday }"
                  >
                    <div class="plan-day-header">
                      <span class="plan-day-date">{{ day.date }}</span>
                      <span class="plan-day-weekday">{{ day.weekday }}</span>
                    </div>
                    <div class="plan-day-tasks">
                      <div v-if="day.tasks.length === 0" class="plan-day-empty">休息</div>
                      <div
                        v-for="task in day.tasks"
                        :key="task.id"
                        class="plan-task-item"
                        :class="{ 'plan-task-completed': task.completed }"
                        @click="handlePlanTaskClick(task)"
                      >
                        <div class="plan-task-dot" @click.stop="handlePlanTaskToggle(task)">
                          <el-icon :size="16" :color="task.completed ? '#67c23a' : '#dcdfe6'">
                            <CircleCheckFilled v-if="task.completed" />
                            <CircleCheck v-else />
                          </el-icon>
                        </div>
                        <div class="plan-task-info">
                          <span class="plan-task-name">{{ task.name }}</span>
                          <el-tag
                            :type="getPlanTaskTypeTag(task.type)"
                            size="small"
                            class="plan-task-type-tag"
                          >
                            {{ getPlanTaskTypeLabel(task.type) }}
                          </el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <el-button @click="showPlanDialog = false">关闭</el-button>
        <el-button type="primary" @click="router.push('/learning-plan'); showPlanDialog = false">
          查看完整计划
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, ArrowRight, Calendar, CircleCheck, CircleCheckFilled, Clock, Document, Plus, Reading, Refresh, StarFilled, TrendCharts, User, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'
import { getStudyPlan } from '@/api/study'
const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

const loading = ref(false)
const searchKeyword = ref('')

const allCourses = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return courseStore.allCourses
  return courseStore.allCourses.filter(
    (c) =>
      c.name.toLowerCase().includes(keyword) ||
      (c.description && c.description.toLowerCase().includes(keyword))
  )
})

const courseStudentCounts = [156, 203, 142, 128]
const timeAgoLabels = ['2天前', '1天前', '5天前', '1周前']

// ============ 学习计划（弹窗） ============
interface PlanTask {
  id: string
  name: string
  description: string
  type: 'learn' | 'review' | 'assessment'
  duration: number
  mastery: number
  completed: boolean
  nodeId: string
}

interface PlanDay {
  date: string
  weekday: string
  isToday: boolean
  tasks: PlanTask[]
}

const userStore = useUserStore()
provide('currentCourseId', userStore.currentCourseId)
const showPlanDialog = ref(false)
const planLoading = ref(false)
const planTasks = ref<PlanTask[]>([])
const planCourseId = ref<number | null>(null)

// ============ 创建计划表单 ============
const showCreateForm = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref()

interface CreatePlanForm {
  courseId: number | null
  date: Date | null
  type: 'learn' | 'review' | 'assessment'
  name: string
  description: string
  duration: number
}

const createForm = ref<CreatePlanForm>({
  courseId: null,
  date: null,
  type: 'learn',
  name: '',
  description: '',
  duration: 30,
})

const createFormRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  type: [{ required: true, message: '请选择任务类型', trigger: 'change' }],
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { max: 50, message: '任务名称不超过50字', trigger: 'blur' },
  ],
}

const openCreateForm = () => {
  createForm.value = {
    courseId: planCourseId.value || courseStore.allCourses[0]?.id || null,
    date: new Date(),
    type: 'learn',
    name: '',
    description: '',
    duration: 30,
  }
  showCreateForm.value = true
}

const submitCreatePlan = async () => {
  try {
    await createFormRef.value?.validate()
  } catch {
    return
  }

  createSubmitting.value = true
  try {
    const newTask: PlanTask = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: createForm.value.name,
      description: createForm.value.description,
      type: createForm.value.type,
      duration: createForm.value.duration,
      mastery: 0,
      completed: false,
      nodeId: `plan-${Date.now().toString(36)}`,
    }
    planTasks.value.push(newTask)
    showCreateForm.value = false
    ElMessage.success('学习计划已添加')
  } finally {
    createSubmitting.value = false
  }
}

const loadPlanData = async () => {
  const userId = userStore.userInfo?.id
  const firstCourse = courseStore.allCourses[0]
  if (!userId || !firstCourse) return

  planCourseId.value = firstCourse.id
  planLoading.value = true
  try {
    const planMap = await getStudyPlan(userId, firstCourse.id)
    const tasks: PlanTask[] = []
    for (const [_group, items] of Object.entries(planMap)) {
      for (const item of items) {
        tasks.push({
          id: item.id,
          name: item.name,
          description: item.description || '',
          type: 'learn' as const,
          duration: 30,
          mastery: 0,
          completed: false,
          nodeId: item.id,
        })
      }
    }
    planTasks.value = tasks
  } catch (_e) {
    // Dashboard 中静默失败，不打断用户体验
  } finally {
    planLoading.value = false
  }
}

const openPlanDialog = () => {
  showPlanDialog.value = true
}

const planTotalDays = computed(() => {
  if (planTasks.value.length === 0) return 0
  const groups = new Set(planTasks.value.map((_t, i) => Math.floor(i / 6) + 1))
  return groups.size
})

const planTotalCount = computed(() => planTasks.value.length)

const planCompletedCount = computed(() => planTasks.value.filter(t => t.completed).length)

const planTotalHours = computed(() => {
  const totalMin = planTasks.value.reduce((sum, t) => sum + t.duration, 0)
  return Math.round(totalMin / 60)
})

const planCompletionRate = computed(() => {
  if (planTotalCount.value === 0) return 0
  return Math.round((planCompletedCount.value / planTotalCount.value) * 100)
})

const planDisplayedDays = computed(() => {
  const days: PlanDay[] = []
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)

    const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
    const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' })
    const isToday = date.toDateString() === today.toDateString()

    const dayIndex = Math.floor(Math.random() * Math.min(4, planTasks.value.length || 1))
    const tasks = planTasks.value.length > 0
      ? planTasks.value.slice(0, Math.min(dayIndex + 1, planTasks.value.length))
      : []

    days.push({ date: dateStr, weekday, isToday, tasks })
  }

  return days
})

const getPlanTaskTypeTag = (type: string) => {
  const map: Record<string, string> = {
    learn: '',
    review: 'warning',
    assessment: 'danger',
  }
  return map[type] || ''
}

const getPlanTaskTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    learn: '新学',
    review: '复习',
    assessment: '测评',
  }
  return map[type] || type
}

const handlePlanTaskToggle = (task: PlanTask) => {
  task.completed = !task.completed
}

const handlePlanTaskClick = (task: PlanTask) => {
  const courseId = planCourseId.value || courseStore.allCourses[0]?.id || 1
  showPlanDialog.value = false
  router.push({
    path: `/course/${courseId}`,
    query: { tab: 'graph', highlight: task.nodeId, nodeName: task.name },
  })
}

const getCourseCode = (name: string): string => {
  const map: Record<string, string> = {
    '软件工程': 'CS3001',
    '数据结构与算法': 'CS2001',
    '数据库原理': 'CS2003',
    '计算机网络': 'CS3002',
    'Python科学计算': 'CS4001',
    '开源大数据技术': 'CS4002',
    '机器学习与AI': 'CS4003',
  }
  return map[name] || 'CS1001'
}

const getStudentCount = (index: number): number => {
  return courseStudentCounts[index % courseStudentCounts.length] || 100
}

const getTimeAgo = (index: number): string => {
  return timeAgoLabels[index % timeAgoLabels.length] || '最近'
}

const getProgress = (courseId: number) => {
  const myCourse = courseStore.myCourses.find((c) => c.id === courseId)
  return myCourse?.progress ?? 0
}

const handleSelectCourse = async (courseId: number) => {
  console.log('handleSelectCourse called with courseId:', courseId)
  try {
    // 切换到该课程（不自动加入课表，用户需在课程详情页手动点击加入）
    await courseStore.switchCourse(courseId)
    router.push('/course/' + courseId)
  } catch (error) {
    console.error('handleSelectCourse error:', error)
    router.push('/course/' + courseId)
  }
}

const handleGlobalSearch = (e: Event) => {
  searchKeyword.value = (e as CustomEvent).detail || ''
}

onMounted(async () => {
  loading.value = true
  try {
    // Check for search query in URL
    const q = route.query.search
    if (q && typeof q === 'string') {
      searchKeyword.value = q
    }
    await Promise.all([courseStore.fetchAllCourses(), courseStore.fetchMyCourses()])
    await loadPlanData()
  } finally {
    loading.value = false
  }
  window.addEventListener('global-search', handleGlobalSearch)
})

onUnmounted(() => {
  window.removeEventListener('global-search', handleGlobalSearch)
})
</script>

<style scoped>
/* ========== Hero ========== */
.hero-section {
  background: #fff;
  padding: 32px 24px;
  margin: -24px -24px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.hero-label {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 8px;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: #262626;
  margin: 0 0 8px;
}

.hero-subtitle {
  font-size: 15px;
  color: #595959;
  margin: 0;
}

/* ========== Quick Access ========== */
.quick-access-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 20px 0;
}

.quick-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.access-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.3s;
}

.access-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #1890ff;
}

.access-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.access-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 8px 0;
}

.access-desc {
  font-size: 13px;
  color: #595959;
  line-height: 1.6;
  margin: 0;
}

/* ========== Course Grid ========== */
.courses-section {
  padding-bottom: 40px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ========== Course Card ========== */
.course-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #91caff;
}

/* Cover */
.card-cover {
  position: relative;
  height: 160px;
  background: linear-gradient(135deg, #e6f0ff, #f0f5ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  color: #1890ff;
  opacity: 0.4;
}

.cover-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 2px 8px;
  background: #1890ff;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}

/* Body */
.card-body {
  padding: 16px 16px 12px;
  flex: 1;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 6px;
  transition: color 0.2s;
}

.course-card:hover .card-name {
  color: #1890ff;
}

.card-desc {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #bfbfbf;
}

/* Progress */
.card-progress {
  margin-top: auto;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
  color: #bfbfbf;
}

.progress-value {
  color: #1890ff;
  font-weight: 600;
}

/* Footer */
.card-footer {
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
  background: #fafafa;
}

.enter-btn {
  width: 100%;
  height: 36px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.enter-arrow {
  transition: transform 0.2s;
}

.enter-btn:hover .enter-arrow {
  transform: translateX(3px);
}

/* ========== 学习计划弹窗 ========== */
.plan-dialog-body {
  padding: 0;
}

/* 工具栏 */
.plan-dialog-body .plan-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

/* 创建表单 */
.plan-dialog-body .plan-create-section {
  padding: 0 4px;
}

.plan-dialog-body .plan-create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.plan-dialog-body .plan-create-title {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.plan-dialog-body .plan-create-form {
  max-width: 520px;
}

.plan-dialog-body .plan-duration-unit {
  margin-left: 8px;
  font-size: 13px;
  color: #8c8c8c;
}

.plan-dialog-body .plan-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.plan-dialog-body .overview-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #f0f0f0;
}

.plan-dialog-body .overview-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.plan-dialog-body .overview-info {
  flex: 1;
  min-width: 0;
}

.plan-dialog-body .overview-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 2px;
}

.plan-dialog-body .overview-value {
  font-size: 18px;
  font-weight: 700;
  color: #262626;
  line-height: 1.2;
}

/* 时间轴 */
.plan-dialog-body .plan-timeline-wrapper {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px 20px;
  border: 1px solid #f0f0f0;
}

.plan-dialog-body .plan-timeline {
  min-height: 100px;
}

.plan-dialog-body .plan-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #bfbfbf;
  gap: 10px;
}

.plan-dialog-body .plan-empty p {
  font-size: 14px;
  margin: 0;
  color: #8c8c8c;
}

.plan-dialog-body .plan-timeline-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.plan-dialog-body .plan-timeline-scroll::-webkit-scrollbar {
  height: 4px;
}

.plan-dialog-body .plan-timeline-scroll::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 2px;
}

.plan-dialog-body .plan-day-column {
  flex: 0 0 130px;
  min-width: 130px;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.plan-dialog-body .plan-day-today {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border-color: #91caff;
}

.plan-dialog-body .plan-day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.plan-dialog-body .plan-day-date {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.plan-dialog-body .plan-day-weekday {
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 2px;
}

.plan-dialog-body .plan-day-tasks {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-dialog-body .plan-day-empty {
  text-align: center;
  font-size: 12px;
  color: #bfbfbf;
  padding: 12px 0;
}

.plan-dialog-body .plan-task-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  background: #fafafa;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.plan-dialog-body .plan-task-item:hover {
  border-color: #409eff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.12);
}

.plan-dialog-body .plan-task-completed {
  opacity: 0.6;
}

.plan-dialog-body .plan-task-dot {
  display: flex;
  align-items: center;
  padding-top: 1px;
  cursor: pointer;
  flex-shrink: 0;
}

.plan-dialog-body .plan-task-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-dialog-body .plan-task-name {
  font-size: 12px;
  font-weight: 500;
  color: #262626;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-dialog-body .plan-task-type-tag {
  align-self: flex-start;
  font-size: 11px;
}
</style>
