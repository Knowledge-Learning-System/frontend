<template>
  <div class="recommendation-page">
    <!-- 顶部 -->
    <div class="rec-header">
      <div class="header-left">
        <el-button v-if="!embedded" text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">智能推荐</h1>
      </div>
      <el-button type="primary" @click="handleRefresh" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新推荐
      </el-button>
    </div>

    <!-- 推荐说明 -->
    <div class="rec-intro">
      <el-alert
        title="基于你的学习进度和知识图谱，系统为你推荐以下学习节点"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="intro-content">
            <p>推荐算法考虑了以下因素：</p>
            <ul>
              <li>前置知识点的掌握情况</li>
              <li>知识点的重要性和难度</li>
              <li>你的学习历史和偏好</li>
              <li>知识点的先修依赖关系</li>
            </ul>
          </div>
        </template>
      </el-alert>
    </div>

    <!-- 推荐列表 -->
    <div class="rec-content">
      <div class="rec-list" v-loading="loading">
        <div v-if="error" class="empty-state">
          <el-empty :description="error">
            <el-button type="primary" @click="loadData">重试</el-button>
          </el-empty>
        </div>
        <div v-else-if="recommendations.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无推荐数据，请先完成答题以生成学习分析">
            <el-button type="primary" @click="handleBack">返回学习</el-button>
          </el-empty>
        </div>

        <div
          v-for="(item, index) in recommendations"
          :key="item.id"
          class="rec-card"
          :class="{ 'rec-card-first': index === 0 }"
          @click="handleItemClick(item)"
        >
          <!-- 推荐排名 -->
          <div class="rec-rank" v-if="index < 3">
            <el-icon v-if="index === 0" :size="24" color="#f56c6c"><StarFilled /></el-icon>
            <el-icon v-else-if="index === 1" :size="24" color="#e6a23c"><StarFilled /></el-icon>
            <el-icon v-else :size="24" color="#d99629"><StarFilled /></el-icon>
          </div>

          <div class="rec-main">
            <!-- 头部 -->
            <div class="rec-header-section">
              <div class="rec-badge" v-if="index === 0">
                <el-icon><Promotion /></el-icon>
                优先学习
              </div>
              <h3 class="rec-name">{{ item.name }}</h3>
            </div>

            <!-- 描述 -->
            <p class="rec-description">{{ item.description }}</p>

            <!-- 元信息 -->
            <div class="rec-meta">
              <span class="meta-item">
                <el-icon><Promotion /></el-icon>
                推荐理由：{{ item.reason }}
              </span>
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                前置知识：{{ item.prerequisites.length }} 个
              </span>
            </div>

            <!-- 前置知识点 -->
            <div v-if="item.prerequisites.length > 0" class="rec-prereqs">
              <span class="prereqs-label">前置知识：</span>
              <el-tag
                v-for="prereq in item.prerequisites"
                :key="prereq"
                size="small"
                type="info"
                class="prereq-tag"
              >
                {{ prereq }}
              </el-tag>
            </div>

            <!-- 掌握度进度 -->
            <div class="rec-progress">
              <div class="progress-label">
                <span>当前掌握度</span>
                <span>{{ item.masteryLevel }}%</span>
              </div>
              <el-progress
                :percentage="item.masteryLevel"
                :stroke-width="6"
                :show-text="false"
                :color="getProgressColor(item.masteryLevel)"
              />
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="rec-actions">
            <el-button type="primary" @click.stop="handleStartLearning(item)">
              <el-icon><VideoPlay /></el-icon>
              开始学习
            </el-button>
            <el-button @click.stop="handleLocateInGraph(item)">
              <el-icon><Aim /></el-icon>
              定位
            </el-button>
          </div>
        </div>
      </div>

      <!-- 右侧学习建议 -->
      <div class="learning-tips">
        <h3 class="tips-title">
          <el-icon><Sunny /></el-icon>
          学习建议
        </h3>
        <div class="tips-list">
          <div class="tip-item">
            <div class="tip-icon">
              <el-icon :size="20"><TrendCharts /></el-icon>
            </div>
            <div class="tip-content">
              <div class="tip-title">循序渐进</div>
              <div class="tip-desc">按照推荐顺序学习，确保前置知识掌握后再学习后续内容</div>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon">
              <el-icon :size="20"><RefreshRight /></el-icon>
            </div>
            <div class="tip-content">
              <div class="tip-title">及时复习</div>
              <div class="tip-desc">学习新知识后，定期复习已学内容，防止遗忘</div>
            </div>
          </div>
          <div class="tip-item">
            <div class="tip-icon">
              <el-icon :size="20"><Document /></el-icon>
            </div>
            <div class="tip-content">
              <div class="tip-title">实践练习</div>
              <div class="tip-desc">通过答题和实践项目巩固所学知识</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ embedded?: boolean }>()

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Aim, ArrowLeft, Document, Folder, Sunny, Promotion,
  Refresh, RefreshRight, StarFilled, TrendCharts, VideoPlay,
} from '@element-plus/icons-vue'
import { getRecommendations } from '@/api/study'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

interface RecommendationItem {
  id: string
  name: string
  description: string
  reason: string
  prerequisites: string[]
  masteryLevel: number
}

const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

const loading = ref(false)
const error = ref('')

const recommendations = ref<RecommendationItem[]>([])

const loadData = async () => {
  const course = courseStore.getCurrentCourse()
  const userId = userStore.userInfo?.id
  if (!userId || !course) {
    error.value = '无法获取用户或课程信息，请确认已登录并选择了课程'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const data = await getRecommendations(userId, course.id)
    recommendations.value = data
  } catch (e: any) {
    error.value = e?.message || '加载推荐失败，请确认后端服务是否正常运行'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const getProgressColor = (percentage: number) => {
  if (percentage < 30) return '#f56c6c'
  if (percentage < 60) return '#e6a23c'
  return '#67c23a'
}

const handleBack = () => {
  router.back()
}

const handleRefresh = async () => {
  await loadData()
}

const handleItemClick = (item: RecommendationItem) => {
  handleLocateInGraph(item)
}

const handleStartLearning = (item: RecommendationItem) => {
  router.push({
    path: '/assessment',
    query: { nodeId: item.id, nodeName: item.name }
  })
}

const handleLocateInGraph = (item: RecommendationItem) => {
  const course = courseStore.getCurrentCourse()
  router.push({
    path: `/course/${course?.id || 1}`,
    query: { tab: 'graph', highlight: item.id, nodeName: item.name }
  })
}
</script>

<style scoped lang="css">
.recommendation-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.rec-header {
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

.rec-intro {
  margin-bottom: 24px;
}

.intro-content p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
}

.intro-content ul {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  color: #606266;
}

.intro-content li {
  margin-bottom: 4px;
}

.rec-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}

.rec-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background: white;
  border-radius: 12px;
}

.rec-card {
  display: flex;
  gap: 16px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.rec-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.rec-card-first {
  border-color: #409eff;
  border-width: 2px;
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%);
}

.rec-rank {
  display: flex;
  align-items: center;
}

.rec-main {
  flex: 1;
}

.rec-header-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rec-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.rec-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
  flex: 1;
}

.rec-description {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.rec-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
}

.rec-prereqs {
  margin-bottom: 12px;
}

.prereqs-label {
  font-size: 13px;
  color: #606266;
  margin-right: 8px;
}

.prereq-tag {
  margin-right: 6px;
}

.rec-progress {
  margin-top: 12px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.rec-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

/* 学习建议 */
.learning-tips {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  gap: 12px;
}

.tip-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #409eff;
}

.tip-content {
  flex: 1;
}

.tip-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.tip-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}
</style>
