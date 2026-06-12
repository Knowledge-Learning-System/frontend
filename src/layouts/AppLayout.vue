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

        <!-- 中间搜索区 -->
        <div class="header-nav-area">
          <div class="search-box">
            <el-input
              v-model="globalSearchKeyword"
              placeholder="搜索课程、知识点..."
              clearable
              :prefix-icon="Search"
              class="global-search-input"
              @keyup.enter="handleGlobalSearch"
              @clear="handleGlobalSearchClear"
            />
          </div>
        </div>

        <!-- 右侧用户操作区 -->
        <div class="header-right">
          <!-- 复习提醒 -->
          <el-popover placement="bottom-end" :width="380" trigger="click" :show-arrow="false" popper-class="review-reminder-popover">
            <template #reference>
              <el-badge :value="reviewCount" :hidden="reviewCount === 0" :max="99" class="notify-badge">
                <el-button class="icon-btn" circle>
                  <el-icon :size="20"><Bell /></el-icon>
                </el-button>
              </el-badge>
            </template>

            <div class="review-reminder">
              <div class="reminder-header">
                <div class="reminder-title">
                  <el-icon :size="18" color="#f56c6c"><Clock /></el-icon>
                  <span>复习提醒</span>
                </div>
                <el-button text size="small" @click="handleMarkAllRead" v-if="reviewItems.length > 0">全部已读</el-button>
              </div>

              <div class="reminder-list" v-if="reviewItems.length > 0">
                <div
                  v-for="item in reviewItems"
                  :key="item.id"
                  class="reminder-item"
                  :class="{ 'reminder-item-urgent': item.urgent }"
                  @click="handleReviewItemClick(item)"
                >
                  <div class="reminder-item-icon">
                    <el-icon :size="20" :color="item.urgent ? '#f56c6c' : '#909399'">
                      <WarningFilled v-if="item.urgent" />
                      <Clock v-else />
                    </el-icon>
                  </div>
                  <div class="reminder-item-content">
                    <div class="reminder-item-header">
                      <h4 class="reminder-item-name">{{ item.name }}</h4>
                      <el-tag size="small" :type="item.urgent ? 'danger' : 'warning'" effect="dark">
                        {{ item.urgent ? '需复习' : '可复习' }}
                      </el-tag>
                    </div>
                    <p class="reminder-item-desc">{{ item.description }}</p>
                    <div class="reminder-item-meta">
                      <span class="meta-item">
                        <el-icon :size="14"><CircleCheckFilled /></el-icon>
                        掌握度 {{ item.mastery }}%
                      </span>
                      <span class="meta-item">
                        <el-icon :size="14"><Clock /></el-icon>
                        {{ item.daysUntilDue === 0 ? '今天' : item.daysUntilDue + '天后' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="reminder-empty" v-else>
                <el-icon :size="40" color="#c0c4cc"><CircleCheckFilled /></el-icon>
                <p>暂无待复习知识点</p>
              </div>

              <div class="reminder-footer" v-if="reviewItems.length > 0">
                <el-button type="primary" size="small" text @click="handleViewAllReview">
                  查看全部复习计划
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </el-popover>

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
  ArrowDown, ArrowRight, Bell, CircleCheckFilled, Clock, Document, Plus, Reading,
  Search, Setting, SwitchButton, User, WarningFilled,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

const unreadCount = ref(2)
const reviewCount = ref(3)
const globalSearchKeyword = ref('')

interface ReviewItem {
  id: string
  name: string
  description: string
  mastery: number
  daysUntilDue: number
  urgent: boolean
  nodeId: string
}

const reviewItems = ref<ReviewItem[]>([
  {
    id: 'r1',
    name: '软件测试基础',
    description: '根据艾宾浩斯遗忘曲线，该知识点需要复习',
    mastery: 45,
    daysUntilDue: 1,
    urgent: true,
    nodeId: 'kp5',
  },
  {
    id: 'r2',
    name: '需求分析方法',
    description: '已学习 3 天，建议及时复习巩固',
    mastery: 58,
    daysUntilDue: 2,
    urgent: false,
    nodeId: 'kp2',
  },
  {
    id: 'r3',
    name: '系统设计基础',
    description: '掌握度较低，需要加强复习',
    mastery: 35,
    daysUntilDue: 0,
    urgent: true,
    nodeId: 'kp3',
  },
])

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

const handleMarkAllRead = () => {
  reviewCount.value = 0
  reviewItems.value = []
  ElMessage.success('已全部标记为已读')
}

const handleReviewItemClick = (item: ReviewItem) => {
  const course = courseStore.getCurrentCourse()
  router.push({
    path: `/course/${course?.id || 1}`,
    query: { tab: 'graph', highlight: item.nodeId, nodeName: item.name }
  })
}

const handleViewAllReview = () => {
  router.push('/weak-points')
}

const handleGlobalSearch = () => {
  const keyword = globalSearchKeyword.value.trim()
  if (!keyword) return
  if (route.path === '/dashboard') {
    // On dashboard, dispatch custom event for course search
    window.dispatchEvent(new CustomEvent('global-search', { detail: keyword }))
  } else {
    router.push({ path: '/dashboard', query: { search: keyword } })
  }
}

const handleGlobalSearchClear = () => {
  globalSearchKeyword.value = ''
  if (route.path === '/dashboard') {
    window.dispatchEvent(new CustomEvent('global-search', { detail: '' }))
  }
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

/* ========== Navigation + Search ========== */
.header-nav-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
  padding: 0 8px;
}

.search-box {
  width: 240px;
}

.global-search-input {
  --el-input-bg-color: #f5f5f5;
  --el-input-border-color: transparent;
  --el-input-hover-border-color: #d9d9d9;
  --el-input-focus-border-color: #1890ff;
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
  flex-shrink: 0;
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

/* ========== Review Reminder Popover ========== */
.review-reminder {
  max-height: 500px;
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 12px;
}

.reminder-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.reminder-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 350px;
  overflow-y: auto;
}

.reminder-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.reminder-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.reminder-item-urgent {
  border-left: 3px solid #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
}

.reminder-item-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reminder-item-urgent .reminder-item-icon {
  background: linear-gradient(135deg, #fef0f0 0%, #fee 100%);
}

.reminder-item-content {
  flex: 1;
  min-width: 0;
}

.reminder-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.reminder-item-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.reminder-item-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reminder-item-meta {
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

.reminder-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #606266;
}

.reminder-empty p {
  margin: 12px 0 0 0;
  font-size: 14px;
}

.reminder-footer {
  display: flex;
  justify-content: center;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
  margin-top: 12px;
}
</style>