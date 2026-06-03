<template>
  <div class="app-layout">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-inner">
        <!-- 左侧 Logo 和系统名称 -->
        <div class="header-left">
          <router-link to="/dashboard" class="logo-wrap">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" class="logo-svg">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
                <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
                <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
            <span class="logo-text">智能在线学习系统</span>
          </router-link>
        </div>

        <!-- 中间课程切换 -->
        <div class="header-center">
          <el-dropdown trigger="click" @command="handleSwitchCourse">
            <span class="course-switcher-btn">
              <el-icon class="switcher-icon"><Reading /></el-icon>
              <span class="switcher-text">{{ currentCourseName }}</span>
              <el-icon class="switcher-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <div class="dropdown-title">切换课程</div>
                <el-dropdown-item
                  v-for="course in myCourses"
                  :key="course.id"
                  :command="course.id"
                  :class="{ active: course.id === currentCourseId }"
                >
                  <div class="course-dropdown-item">
                    <div class="course-dropdown-avatar">
                      <el-icon><Reading /></el-icon>
                    </div>
                    <div class="course-dropdown-info">
                      <span class="cd-name">{{ course.name }}</span>
                      <div class="cd-progress-bar">
                        <div class="cd-progress-fill" :style="{ width: (course.progress ?? 0) + '%' }" />
                      </div>
                      <span class="cd-meta">进度 {{ course.progress ?? 0 }}%</span>
                    </div>
                    <span v-if="course.id === currentCourseId" class="cd-dot" />
                  </div>
                </el-dropdown-item>
                <el-dropdown-item divided>
                  <router-link to="/dashboard" class="dropdown-add-course">
                    <el-icon><Plus /></el-icon>
                    添加课程
                  </router-link>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 中间导航标签 -->
        <nav class="header-nav">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-pill"
            :class="{ active: isNavActive(item.path) }"
          >
            {{ item.name }}
          </router-link>
        </nav>

        <!-- 右侧用户操作区 -->
        <div class="header-right">
          <!-- 通知 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notify-badge">
            <el-button class="icon-btn" circle>
              <el-icon :size="20"><Bell /></el-icon>
            </el-button>
          </el-badge>

          <!-- 用户头像下拉 -->
          <el-dropdown trigger="click">
            <span class="user-trigger">
              <el-avatar :size="32" class="user-avatar">
                {{ userInitial }}
              </el-avatar>
              <span class="user-name">{{ userStore.userInfo?.username || '用户' }}</span>
              <el-icon class="user-arrow"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item>
                  <el-icon><Setting /></el-icon>
                  设置
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-content">
      <router-view />
    </main>

    <!-- 底部版权 -->
    <footer class="app-footer">
      <span>&copy; 2026 融合学科知识图谱与大语言模型的高校个性化在线学习系统</span>
      <span class="footer-sep">|</span>
      <span>版权所有 · 技术支持</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowDown, Bell, Plus, Reading, Setting, SwitchButton, User,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

const unreadCount = ref(2)

const navItems = [
  { name: '首页', path: '/dashboard' },
  { name: '知识图谱', path: '/knowledge-graph' },
  { name: '问答', path: '/qa' },
  { name: '作业', path: '/assignments' },
  { name: '诊断', path: '/diagnosis' },
  { name: '推荐', path: '/recommendations' },
  { name: '测评', path: '/assessment' },
  { name: '搜索', path: '/search' },
]

const isNavActive = (path: string) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const myCourses = computed(() => courseStore.myCourses)
const currentCourseId = computed(() => userStore.currentCourseId)

const currentCourseName = computed(() => {
  const course = courseStore.getCurrentCourse()
  return course?.name ?? '选择课程'
})

const userInitial = computed(() => {
  const name = userStore.userInfo?.username
  return name ? name.charAt(0).toUpperCase() : 'U'
})

const handleSwitchCourse = async (courseId: number) => {
  if (courseId === currentCourseId.value) return
  try {
    await courseStore.switchCourse(courseId)
  } catch {
    // ignore
  }
}

const handleLogout = () => {
  userStore.clearAuth()
  router.push('/login')
}

onMounted(async () => {
  if (userStore.isLoggedIn && !userStore.userInfo) {
    await userStore.fetchUserInfo()
  }
  await courseStore.fetchMyCourses()
})
</script>

<style scoped>
/* ========== Layout ========== */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* ========== Header ========== */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  height: 56px;
  padding: 0 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* ========== Logo ========== */
.header-left {
  flex-shrink: 0;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff, #1677cc);
  border-radius: 8px;
  color: #fff;
  box-shadow: 0 2px 8px rgba(24,144,255,0.3);
}

.logo-svg {
  width: 18px;
  height: 18px;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  white-space: nowrap;
}

/* ========== Course Switcher ========== */
.header-center {
  flex-shrink: 0;
}

.course-switcher-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  transition: all 0.2s;
}

.course-switcher-btn:hover {
  background: #f0f0f0;
  border-color: #bfbfbf;
}

.switcher-icon {
  color: #1890ff;
  font-size: 16px;
}

.switcher-text {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.switcher-arrow {
  font-size: 12px;
  color: #999;
}

.dropdown-title {
  padding: 8px 16px 6px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.course-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 260px;
}

.course-dropdown-avatar {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e6f0ff;
  border-radius: 8px;
  color: #1890ff;
  flex-shrink: 0;
}

.course-dropdown-info {
  flex: 1;
  min-width: 0;
}

.cd-name {
  display: block;
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.cd-progress-bar {
  height: 3px;
  background: #f0f0f0;
  border-radius: 2px;
  margin: 4px 0;
}

.cd-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #1677cc);
  border-radius: 2px;
}

.cd-meta {
  display: block;
  font-size: 11px;
  color: #999;
}

.cd-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1890ff;
  flex-shrink: 0;
}

.dropdown-add-course {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  text-decoration: none;
  font-size: 13px;
}

/* ========== Navigation Pills ========== */
.header-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
  justify-content: center;
  padding: 0 8px;
}

.nav-pill {
  padding: 5px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #595959;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-pill:hover {
  color: #1890ff;
  background: #e6f0ff;
}

.nav-pill.active {
  color: #1890ff;
  background: #e6f0ff;
  font-weight: 600;
}

/* ========== Right Side ========== */
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.icon-btn {
  border: none !important;
  background: transparent !important;
  color: #8c8c8c !important;
  width: 36px;
  height: 36px;
}

.icon-btn:hover {
  background: #f5f5f5 !important;
  color: #595959 !important;
}

.notify-badge :deep(.el-badge__content) {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
  border: 2px solid #fff;
}

.user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 3px 10px 3px 3px;
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-trigger:hover {
  background: #f5f5f5;
}

.user-avatar {
  background: #1890ff !important;
  color: #fff !important;
  font-weight: 600 !important;
  font-size: 14px !important;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.user-arrow {
  font-size: 12px;
  color: #999;
}

/* ========== Content ========== */
.app-content {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 24px 24px;
}

/* ========== Footer ========== */
.app-footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;
}

.footer-sep {
  color: #d9d9d9;
}
</style>