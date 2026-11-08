<template>
  <div class="weak-points-page">
    <!-- 顶部统计 -->
    <div class="weak-header">
      <div class="header-left">
        <el-button text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">薄弱知识点</h1>
      </div>
      <div class="header-actions">
        <el-select 
          v-model="threshold" 
          placeholder="掌握度阈值"
          class="threshold-select"
          @change="handleThresholdChange"
        >
          <el-option label="显示掌握度 < 60%" :value="60" />
          <el-option label="显示掌握度 < 50%" :value="50" />
          <el-option label="显示掌握度 < 40%" :value="40" />
        </el-select>
        <el-button type="primary" @click="handleStartReview">
          <el-icon><RefreshRight /></el-icon>
          开始复习
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon weak">
          <el-icon :size="24"><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">薄弱知识点数量</div>
          <div class="stat-value">{{ weakPoints.length }} 个</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon average">
          <el-icon :size="24"><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">平均掌握度</div>
          <div class="stat-value">{{ averageMastery }}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon lowest">
          <el-icon :size="24"><DataLine /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">最低掌握度</div>
          <div class="stat-value">{{ lowestMastery }}%</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon total">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">待学习总数</div>
          <div class="stat-value">{{ allPoints.length }} 个</div>
        </div>
      </div>
    </div>

    <!-- 薄弱点列表 -->
    <div class="weak-list">
      <div class="list-header">
        <h2>薄弱知识点列表</h2>
        <div class="list-filters">
          <el-input
            v-model="searchText"
            placeholder="搜索知识点..."
            :prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select 
            v-model="sortBy" 
            placeholder="排序方式"
            class="sort-select"
            @change="handleSortChange"
          >
            <el-option label="掌握度从低到高" value="mastery_asc" />
            <el-option label="掌握度从高到低" value="mastery_desc" />
          </el-select>
        </div>
      </div>

      <div class="list-content" v-loading="loading">
        <div v-if="filteredPoints.length === 0" class="empty-state">
          <el-empty description="暂无薄弱知识点，继续加油！">
            <el-button type="primary" @click="handleBack">返回图谱</el-button>
          </el-empty>
        </div>

        <div 
          v-for="(point, index) in filteredPoints"
          :key="point.id"
          class="point-card"
          @click="handlePointClick(point)"
        >
          <div class="point-index">{{ index + 1 }}</div>
          
          <div class="point-main">
            <div class="point-header">
              <h3 class="point-name">{{ point.name }}</h3>
              <el-tag 
                :type="getMasteryTag(point.mastery)" 
                size="small"
                effect="dark"
              >
                {{ point.mastery }}%
              </el-tag>
            </div>
            
            <div class="point-meta">
              <span class="meta-item">
                <el-icon><TrendCharts /></el-icon>
                尝试次数：{{ point.totalAttempts }}
              </span>
              <span class="meta-item">
                <el-icon><WarningFilled /></el-icon>
                错误次数：{{ point.errorCount }}
              </span>
            </div>
            
            <div class="point-mastery-bar">
              <div class="mastery-track">
                <div 
                  class="mastery-progress"
                  :class="getMasteryBarClass(point.mastery)"
                  :style="{ width: point.mastery + '%' }"
                />
              </div>
              <span class="mastery-label">掌握度</span>
            </div>
          </div>
          
          <div class="point-actions">
            <el-button 
              type="primary" 
              size="small"
              @click.stop="handleStartLearning(point)"
            >
              <el-icon><VideoPlay /></el-icon>
              学习
            </el-button>
            <el-button 
              size="small"
              @click.stop="handleLocateInGraph(point)"
            >
              <el-icon><Aim /></el-icon>
              定位
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Aim, Clock, DataLine, Document, Folder, RefreshRight,
  Search, TrendCharts, VideoPlay, WarningFilled,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getWeakPoints } from '@/api/study'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'

interface WeakPoint {
  id: string
  name: string
  mastery: number
  totalAttempts: number
  errorCount: number
}

const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

const threshold = ref(60)
const searchText = ref('')
const sortBy = ref('mastery_asc')
const loading = ref(false)

const allPoints = ref<WeakPoint[]>([])

const loadData = async () => {
  const course = courseStore.getCurrentCourse()
  const userId = userStore.userInfo?.id
  if (!userId || !course) return

  loading.value = true
  try {
    const data = await getWeakPoints(userId, course.id)
    allPoints.value = data
  } catch (e: any) {
    ElMessage.error(e?.message || '加载薄弱点数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const weakPoints = computed(() => {
  return allPoints.value.filter(p => p.mastery < threshold.value)
})

const averageMastery = computed(() => {
  if (weakPoints.value.length === 0) return 0
  const total = weakPoints.value.reduce((sum, p) => sum + p.mastery, 0)
  return Math.round(total / weakPoints.value.length)
})

const lowestMastery = computed(() => {
  if (weakPoints.value.length === 0) return 0
  return Math.min(...weakPoints.value.map(p => p.mastery))
})

const filteredPoints = computed(() => {
  let result = [...weakPoints.value]
  
  // 搜索过滤
  if (searchText.value) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }
  
  // 排序
  if (sortBy.value === 'mastery_asc') {
    result.sort((a, b) => a.mastery - b.mastery)
  } else if (sortBy.value === 'mastery_desc') {
    result.sort((a, b) => b.mastery - a.mastery)
  }
  
  return result
})

const getMasteryTag = (mastery: number) => {
  if (mastery < 40) return 'danger'
  if (mastery < 50) return 'warning'
  return ''
}

const getMasteryBarClass = (mastery: number) => {
  if (mastery < 40) return 'bar-danger'
  if (mastery < 50) return 'bar-warning'
  return 'bar-normal'
}

const handleThresholdChange = () => {
  ElMessage.success(`已筛选掌握度低于 ${threshold.value}% 的知识点`)
}

const handleSortChange = () => {
  // 排序已在 computed 中处理
}

const handleBack = () => {
  router.back()
}

const handleStartReview = () => {
  if (weakPoints.value.length === 0) {
    ElMessage.info('暂无薄弱知识点')
    return
  }
  // 跳转到答题页面，从最薄弱的知识点开始
  const weakest = weakPoints.value[0]
  router.push({
    path: '/assessment',
    query: { nodeId: weakest.id, nodeName: weakest.name }
  })
}

const handlePointClick = (point: WeakPoint) => {
  // 卡片点击默认定位到图谱
  handleLocateInGraph(point)
}

const handleStartLearning = (point: WeakPoint) => {
  router.push({
    path: '/assessment',
    query: { nodeId: point.id, nodeName: point.name }
  })
}

const handleLocateInGraph = (point: WeakPoint) => {
  const course = courseStore.getCurrentCourse()
  router.push({
    path: `/course/${course?.id || 1}`,
    query: { tab: 'graph', highlight: point.id, nodeName: point.name }
  })
}
</script>

<style scoped lang="css">
.weak-points-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.weak-header {
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

.threshold-select {
  width: 180px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.weak {
  background: linear-gradient(135deg, #fef0f0 0%, #fee 100%);
  color: #f56c6c;
}

.stat-icon.average {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  color: #409eff;
}

.stat-icon.lowest {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  color: #e6a23c;
}

.stat-icon.total {
  background: linear-gradient(135deg, #f4f4f5 0%, #e9e9eb 100%);
  color: #909399;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

/* 列表区域 */
.weak-list {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.list-filters {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 240px;
}

.sort-select {
  width: 160px;
}

.list-content {
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.point-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.point-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.point-index {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.point-main {
  flex: 1;
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.point-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.point-desc {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 12px 0;
}

.point-meta {
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

.point-mastery-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mastery-track {
  flex: 1;
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.mastery-progress {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.mastery-progress.bar-danger {
  background: linear-gradient(90deg, #f56c6c, #f89898);
}

.mastery-progress.bar-warning {
  background: linear-gradient(90deg, #e6a23c, #f3d19e);
}

.mastery-progress.bar-normal {
  background: linear-gradient(90deg, #409eff, #a0cfff);
}

.mastery-label {
  font-size: 13px;
  color: #909399;
  min-width: 45px;
}

.point-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}
</style>
