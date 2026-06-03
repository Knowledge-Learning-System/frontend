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
            <el-button type="primary" class="enter-btn">
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowRight, Reading, User } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/course'

const router = useRouter()
const courseStore = useCourseStore()

const loading = ref(false)

const allCourses = computed(() => courseStore.allCourses)

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

const handleSelectCourse = async (courseId: number) => {
  try {
    const enrolled = courseStore.myCourses.some((c) => c.id === courseId)
    if (!enrolled) {
      await courseStore.enrollCourse(courseId)
    }
    await courseStore.switchCourse(courseId)
    ElMessage.success('已进入课程')
  } catch {
    ElMessage.error('选课失败')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([courseStore.fetchAllCourses(), courseStore.fetchMyCourses()])
  } finally {
    loading.value = false
  }
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