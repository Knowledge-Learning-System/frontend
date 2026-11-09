<template>
  <div class="recommendation-page">
    <!-- 顶部 -->
    <div class="rec-header">
      <div class="header-left">
        <el-button v-if="!embedded" text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">{{ activeKpId ? '知识点前置推荐' : '智能推荐' }}</h1>
        <p v-if="activeKpId" class="page-subtitle">当前知识点：{{ activeKpName || activeKpId }}</p>
      </div>
      <el-button type="primary" @click="handleRefresh" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新推荐
      </el-button>
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
          <el-empty :description="emptyText" />
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
const props = defineProps<{ embedded?: boolean; kpId?: string; kpName?: string; courseId?: number }>()
const emit = defineEmits<{ (e: 'locate', payload: { id: string; name: string }): void }>()

import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const route = useRoute()
const courseStore = useCourseStore()
const userStore = useUserStore()

const loading = ref(false)
const error = ref('')

const recommendations = ref<RecommendationItem[]>([])

/** 当前推荐上下文的知识点：优先取父组件传入，独立页回退到路由参数 */
const activeKpId = computed(() => {
  if (props.kpId) return props.kpId
  const q = route.query.kpId
  return typeof q === 'string' ? q : ''
})
const activeKpName = computed(() => {
  if (props.kpName) return props.kpName
  const q = route.query.kpName
  return typeof q === 'string' ? q : ''
})

const emptyText = computed(() => {
  if (!activeKpId.value) return '当前课程暂无可推荐的学习节点，请先完成部分学习或检查知识图谱数据'
  return `「${activeKpName.value || activeKpId.value}」在知识图谱先修链中没有前置知识点`
})

const loadData = async () => {
  const courseId = props.courseId ?? courseStore.getCurrentCourse()?.id
  const userId = userStore.userInfo?.id
  if (!userId || !courseId) {
    error.value = '无法获取用户或课程信息，请确认已登录并选择了课程'
    return
  }
  // 未指定知识点时走整课推荐（课程级候选域），指定时走该知识点的前置推荐
  loading.value = true
  error.value = ''
  try {
    const data = await getRecommendations(userId, courseId, activeKpId.value || undefined)
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

// 知识点变化后自动刷新：指定知识点看该点的前置推荐，未指定则看整课推荐
watch(activeKpId, () => {
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
  const courseId = props.courseId ?? course?.id ?? 1

  // 内嵌在课程详情页「推荐」tab 时，页面已挂载，push 同一路由仅变 query 不会重跑目标页 onMounted，
  // 必须通过事件让父组件直接完成定位
  if (props.embedded) {
    emit('locate', { id: item.id, name: item.name })
    return
  }

  router.push({
    path: `/course/${courseId}`,
    query: { tab: 'graph', knowledgePointId: item.id, highlight: item.id, nodeName: item.name }
  }).catch(() => {})
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

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #909399;
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
