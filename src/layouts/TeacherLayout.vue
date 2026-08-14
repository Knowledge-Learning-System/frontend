<template>
  <div class="teacher-layout">
    <!-- 侧边栏 -->
    <aside class="teacher-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <router-link to="/teacher" class="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" class="logo-icon">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
          <span v-show="!sidebarCollapsed" class="logo-text">教师管理面板</span>
        </router-link>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="sidebarCollapsed"
        :collapse-transition="false"
        background-color="transparent"
        text-color="#a0aec0"
        active-text-color="#409eff"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/teacher/courses">
          <el-icon><Reading /></el-icon>
          <template #title>课程管理</template>
        </el-menu-item>
        <el-menu-item index="/teacher/students">
          <el-icon><User /></el-icon>
          <template #title>学生管理</template>
        </el-menu-item>
        <el-menu-item index="/teacher/homework">
          <el-icon><Document /></el-icon>
          <template #title>作业管理</template>
        </el-menu-item>
        <el-menu-item index="/teacher/questions">
          <el-icon><Edit /></el-icon>
          <template #title>题目管理</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-button
          text
          class="collapse-btn"
          @click="sidebarCollapsed = !sidebarCollapsed"
        >
          <el-icon>
            <Fold v-if="!sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
        </el-button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="teacher-main">
      <header class="teacher-topbar">
        <div class="topbar-left">
          <span class="topbar-title">{{ currentPageTitle }}</span>
        </div>
        <div class="topbar-right">
          <el-dropdown trigger="click">
            <span class="user-avatar-wrap">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="user-name">{{ userInfo?.username || '教师' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>
      <main class="teacher-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Reading,
  User,
  Document,
  Edit,
  Fold,
  Expand,
} from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

const sidebarCollapsed = ref(false)
const userInfo = computed(() => userStore.userInfo)

const activeMenu = computed(() => route.path)

const pageTitleMap: Record<string, string> = {
  '/teacher/courses': '课程管理',
  '/teacher/students': '学生管理',
  '/teacher/homework': '作业管理',
  '/teacher/questions': '题目管理',
}

const currentPageTitle = computed(() => pageTitleMap[route.path] || '教师端')

function handleLogout() {
  userStore.clearAuth()
  window.location.href = '/login'
}
</script>

<style scoped>
.teacher-layout {
  display: flex;
  height: 100vh;
  background: #f0f2f5;
}

/* 侧边栏 */
.teacher-sidebar {
  width: 240px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  transition: width 0.3s;
  flex-shrink: 0;
}

.teacher-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #409eff;
  flex-shrink: 0;
}

.logo-text {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  overflow: hidden;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  padding-top: 8px;
}

.sidebar-menu .el-menu-item {
  margin: 2px 8px;
  border-radius: 8px;
  height: 44px;
  line-height: 44px;
}

.sidebar-menu .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.06) !important;
}

.sidebar-menu .el-menu-item.is-active {
  background: rgba(64, 158, 255, 0.15) !important;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.collapse-btn {
  color: #a0aec0 !important;
  width: 100%;
  justify-content: center;
}

/* 主内容区 */
.teacher-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 顶部栏 */
.teacher-topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.topbar-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.topbar-right {
  display: flex;
  align-items: center;
}

.user-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-name {
  font-size: 14px;
  color: #606266;
}

/* 内容区 */
.teacher-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
