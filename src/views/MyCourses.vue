<template>
  <div class="my-courses-page">
    <section class="hero-section">
      <div class="hero-content">
        <p class="hero-label">我的课程</p>
        <h1 class="hero-title">已选课程</h1>
        <p class="hero-subtitle">共 {{ courseStore.myCourses.length }} 门课程</p>
      </div>
    </section>

    <section class="courses-section">
      <el-empty v-if="courseStore.myCourses.length === 0" description="还没有选择课程，去课程大厅看看吧">
        <el-button type="primary" @click="router.push('/dashboard')">前往课程大厅</el-button>
      </el-empty>

      <div v-else class="course-grid">
        <div
          v-for="course in courseStore.myCourses"
          :key="course.id"
          class="course-card"
          @click="router.push('/course/' + course.id)"
        >
          <div class="card-cover">
            <div class="cover-placeholder">
              <el-icon :size="48"><Reading /></el-icon>
            </div>
            <span class="cover-badge">{{ getCourseCode(course.name) }}</span>
          </div>
          <div class="card-body">
            <h3 class="card-name">{{ course.name }}</h3>
            <p class="card-desc">{{ course.description || '系统学习核心概念与实践方法' }}</p>
            <div class="card-progress" v-if="course.progress !== undefined">
              <span class="progress-label">学习进度</span>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: course.progress + '%' }"></div>
              </div>
              <span class="progress-value">{{ course.progress }}%</span>
            </div>
          </div>
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
import { useRouter } from 'vue-router'
import { Reading, ArrowRight } from '@element-plus/icons-vue'
import { useCourseStore } from '@/stores/course'

const router = useRouter()
const courseStore = useCourseStore()

function getCourseCode(name: string): string {
  const map: Record<string, string> = {
    '数据结构': 'DS',
    '算法设计与分析': 'ALG',
    '机器学习': 'ML',
    '深度学习': 'DL',
    '计算机网络': 'CN',
    '操作系统': 'OS',
    '数据库原理': 'DB',
    '知识图谱': 'KG',
    '大语言模型': 'LLM',
    'Python': 'PY',
    'Java': 'JV',
    '线性代数': 'LA',
  }
  return map[name] || name.substring(0, 2).toUpperCase()
}
</script>

<style scoped>
.my-courses-page {
  padding: 0;
}

.hero-section {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  padding: 32px 40px;
  border-bottom: 1px solid #d6e4ff;
}

.hero-content { max-width: 1200px; margin: 0 auto; }
.hero-label { font-size: 13px; color: #597ef7; margin: 0 0 4px; }
.hero-title { font-size: 24px; font-weight: 700; color: #1a1a2e; margin: 0 0 4px; }
.hero-subtitle { font-size: 14px; color: #666; margin: 0; }

.courses-section { padding: 24px 40px; max-width: 1200px; margin: 0 auto; }

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.course-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.course-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.card-cover {
  height: 140px;
  background: linear-gradient(135deg, #1890ff, #1677cc);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cover-placeholder { color: rgba(255,255,255,0.5); }
.cover-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-body { padding: 16px; }
.card-name { margin: 0 0 6px; font-size: 16px; font-weight: 600; color: #222; }
.card-desc { margin: 0 0 12px; font-size: 13px; color: #888; line-height: 1.5; }

.card-progress { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.progress-label { color: #999; }
.progress-bar { flex: 1; height: 4px; background: #f0f0f0; border-radius: 2px; }
.progress-fill { height: 100%; background: #52c41a; border-radius: 2px; }
.progress-value { color: #52c41a; font-weight: 500; }

.card-footer { padding: 0 16px 16px; }
.enter-btn { width: 100%; }
.enter-arrow { margin-left: 4px; }
</style>
