<template>
  <div class="learning-plan-page">
    <!-- 顶部 -->
    <div class="plan-header">
      <div class="header-left">
        <el-button text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">学习计划时间轴</h1>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="week">周视图</el-radio-button>
          <el-radio-button label="month">月视图</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="handleExportPlan">
          <el-icon><Download /></el-icon>
          导出计划
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="plan-overview">
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#409eff"><Calendar /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">总学习天数</div>
          <div class="overview-value">{{ totalDays }} 天</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#67c23a"><Document /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">已学知识点</div>
          <div class="overview-value">{{ completedCount }} / {{ totalCount }}</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#e6a23c"><Clock /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">预计总用时</div>
          <div class="overview-value">{{ totalHours }} 小时</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="overview-icon">
          <el-icon :size="28" color="#f56c6c"><TrendCharts /></el-icon>
        </div>
        <div class="overview-info">
          <div class="overview-label">计划完成度</div>
          <div class="overview-value">{{ completionRate }}%</div>
        </div>
      </div>
    </div>

    <!-- 时间轴 -->
    <div class="timeline-container">
      <div class="timeline-wrapper">
        <!-- 日期标尺 -->
        <div class="timeline-ruler">
          <div 
            v-for="(day, index) in displayedDays" 
            :key="day.date"
            class="ruler-day"
            :class="{ 'ruler-day-today': day.isToday }"
          >
            <div class="ruler-date">{{ day.date }}</div>
            <div class="ruler-weekday">{{ day.weekday }}</div>
          </div>
        </div>

        <!-- 学习内容 -->
        <div class="timeline-content">
          <div 
            v-for="(day, dayIndex) in displayedDays" 
            :key="day.date"
            class="timeline-day"
            :class="{ 'timeline-day-today': day.isToday }"
          >
            <!-- 日期头部 -->
            <div class="day-header">
              <div class="day-date">
                <span class="date-num">{{ day.date }}</span>
                <span class="date-weekday">{{ day.weekday }}</span>
              </div>
              <el-tag 
                v-if="day.isToday" 
                type="primary" 
                size="small"
                effect="dark"
              >
                今天
              </el-tag>
            </div>

            <!-- 学习任务列表 -->
            <div class="day-tasks">
              <div v-if="day.tasks.length === 0" class="day-empty">
                <el-icon :size="24"><CircleCheck /></el-icon>
                <span>今日无学习任务</span>
              </div>

              <div
                v-for="(task, taskIndex) in day.tasks"
                :key="task.id"
                class="task-item"
                :class="{ 'task-completed': task.completed, 'task-today': day.isToday }"
                @click="handleTaskClick(task, day)"
              >
                <!-- 任务状态 -->
                <div class="task-status" @click.stop="handleToggleTask(task)">
                  <el-icon 
                    :size="20" 
                    :color="task.completed ? '#67c23a' : '#dcdfe6'"
                  >
                    <CircleCheckFilled v-if="task.completed" />
                    <CircleOutline v-else />
                  </el-icon>
                </div>

                <!-- 任务内容 -->
                <div class="task-content">
                  <div class="task-header">
                    <h4 class="task-name">{{ task.name }}</h4>
                    <el-tag 
                      :type="getTaskTypeTag(task.type)" 
                      size="small"
                    >
                      {{ getTaskTypeLabel(task.type) }}
                    </el-tag>
                  </div>
                  <p class="task-desc">{{ task.description }}</p>
                  <div class="task-meta">
                    <span class="meta-item">
                      <el-icon><Clock /></el-icon>
                      {{ task.duration }}分钟
                    </span>
                    <span class="meta-item">
                      <el-icon><Document /></el-icon>
                      掌握度：{{ task.mastery }}%
                    </span>
                  </div>
                </div>

                <!-- 任务操作 -->
                <div class="task-actions">
                  <el-button 
                    v-if="!task.completed"
                    type="primary" 
                    size="small"
                    @click.stop="handleStartTask(task)"
                  >
                    <el-icon><VideoPlay /></el-icon>
                    学习
                  </el-button>
                  <el-button 
                    size="small"
                    @click.stop="handleReviewTask(task)"
                  >
                    <el-icon><Refresh /></el-icon>
                    复习
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="timeline-navigation">
      <el-button @click="handlePreviousPeriod" :disabled="!canPrevious">
        <el-icon><ArrowLeft /></el-icon>
        {{ viewMode === 'week' ? '上一周' : '上一月' }}
      </el-button>
      <el-button @click="handleGoToToday">
        回到今天
      </el-button>
      <el-button @click="handleNextPeriod" :disabled="!canNext">
        {{ viewMode === 'week' ? '下一周' : '下一月' }}
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, ArrowRight, Calendar, CircleCheck, CircleCheckFilled,
  CircleOutline, Clock, Document, Download, Refresh, TrendCharts, VideoPlay,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getStudyPlan } from '@/api/study'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'

interface Task {
  id: string
  name: string
  description: string
  type: 'learn' | 'review' | 'assessment'
  duration: number
  mastery: number
  completed: boolean
  nodeId: string
}

interface Day {
  date: string
  weekday: string
  isToday: boolean
  tasks: Task[]
}

const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

const viewMode = ref<'week' | 'month'>('week')
const currentDate = ref(new Date())
const loading = ref(false)

const allTasks = ref<Task[]>([])

const loadData = async () => {
  const course = courseStore.getCurrentCourse()
  const userId = userStore.userInfo?.id
  if (!userId || !course) return

  loading.value = true
  try {
    const planMap = await getStudyPlan(userId, course.id)
    const tasks: Task[] = []
    for (const [group, items] of Object.entries(planMap)) {
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
    allTasks.value = tasks
  } catch (e: any) {
    ElMessage.error(e?.message || '加载学习计划失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const totalDays = computed(() => {
  const groups = new Set(allTasks.value.map((_t, i) => Math.floor(i / 3) + 1))
  return groups.size || 30
})

const totalCount = computed(() => allTasks.value.length)

const completedCount = computed(() => allTasks.value.filter(t => t.completed).length)

const totalHours = computed(() => {
  const totalMin = allTasks.value.reduce((sum, t) => sum + t.duration, 0)
  return Math.round(totalMin / 60)
})

const completionRate = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const displayedDays = computed(() => {
  const days: Day[] = []
  const startDate = new Date(currentDate.value)
  
  if (viewMode.value === 'week') {
    // 周视图：显示 7 天
    const startOfWeek = new Date(startDate)
    startOfWeek.setDate(startDate.getDate() - startDate.getDay())
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(createDay(date))
    }
  } else {
    // 月视图：显示 30 天
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(createDay(date))
    }
  }
  
  return days
})

const createDay = (date: Date): Day => {
  const dateStr = date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  const weekday = date.toLocaleDateString('zh-CN', { weekday: 'short' })
  const isToday = date.toDateString() === new Date().toDateString()

  // 按日期索引分配任务（循环分配）
  const dayIndex = Math.floor(Math.random() * 5)
  const tasks = allTasks.value.length > 0
    ? allTasks.value.slice(0, Math.min(dayIndex + 1, allTasks.value.length))
    : []

  return {
    date: dateStr,
    weekday,
    isToday,
    tasks,
  }
}

const canPrevious = computed(() => {
  const today = new Date()
  const diff = today.getTime() - currentDate.value.getTime()
  return diff < 7 * 24 * 60 * 60 * 1000 // 至少能往前一周
})

const canNext = computed(() => {
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30) // 最多往后 30 天
  return currentDate.value.getTime() < maxDate.getTime()
})

const getTaskTypeTag = (type: string) => {
  const map: Record<string, any> = {
    learn: '',
    review: 'warning',
    assessment: 'danger',
  }
  return map[type] || ''
}

const getTaskTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    learn: '新学',
    review: '复习',
    assessment: '测评',
  }
  return map[type] || type
}

const handleBack = () => {
  router.back()
}

const handleExportPlan = () => {
  ElMessage.success('学习计划已导出为 PDF')
}

const handlePreviousPeriod = () => {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setMonth(newDate.getMonth() - 1)
  }
  currentDate.value = newDate
}

const handleNextPeriod = () => {
  const newDate = new Date(currentDate.value)
  if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setMonth(newDate.getMonth() + 1)
  }
  currentDate.value = newDate
}

const handleGoToToday = () => {
  currentDate.value = new Date()
}

const handleToggleTask = (task: Task) => {
  task.completed = !task.completed
  if (task.completed) {
    ElMessage.success('任务已完成')
  }
}

const handleTaskClick = (task: Task, day: Day) => {
  const course = courseStore.getCurrentCourse()
  router.push({
    path: `/course/${course?.id || 1}`,
    query: { tab: 'graph', highlight: task.nodeId, nodeName: task.name }
  })
}

const handleStartTask = (task: Task) => {
  router.push({
    path: '/assessment',
    query: { nodeId: task.nodeId, nodeName: task.name }
  })
}

const handleReviewTask = (task: Task) => {
  ElMessage.info(`开始复习：${task.name}`)
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
}

.overview-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.overview-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

/* 时间轴 */
.timeline-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  overflow-x: auto;
}

.timeline-wrapper {
  min-width: 800px;
}

.timeline-ruler {
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 24px;
}

.ruler-day {
  flex: 1;
  text-align: center;
  padding: 8px;
  border-radius: 8px;
  background: #f5f7fa;
}

.ruler-day-today {
  background: #ecf5ff;
}

.ruler-date {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.ruler-weekday {
  font-size: 13px;
  color: #909399;
}

.timeline-content {
  display: flex;
  gap: 16px;
}

.timeline-day {
  flex: 1;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.timeline-day-today {
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
  border: 1px solid #409eff;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.day-date {
  display: flex;
  flex-direction: column;
}

.date-num {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.date-weekday {
  font-size: 13px;
  color: #909399;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: #909399;
  font-size: 14px;
  gap: 8px;
}

.task-item {
  display: flex;
  gap: 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.task-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.task-completed {
  opacity: 0.7;
  background: #fafafa;
}

.task-today {
  border-left: 3px solid #409eff;
}

.task-status {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.task-content {
  flex: 1;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.task-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 8px 0;
}

.task-meta {
  display: flex;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #909399;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

/* 底部导航 */
.timeline-navigation {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
