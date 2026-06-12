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
        
        <div class="access-card" @click="router.push('/learning-plan')">
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowRight, Calendar, Reading, StarFilled, TrendCharts, User, WarningFilled } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/course'

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

const handleSelectCourse = (courseId: number) => {
  console.log('handleSelectCourse called with courseId:', courseId)
  try {
    router.push('/course/' + courseId)
  } catch (error) {
    console.error('router.push error:', error)
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
</style>