<template>
  <div class="radar-page" :class="{ embedded: embedded }">
    <!-- 顶部导航 -->
    <div class="radar-header">
      <div class="header-left">
        <el-button v-if="!embedded" text @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="radar-title">知识点掌握度分析</h1>
      </div>
      <el-select 
        v-model="selectedDimension" 
        placeholder="选择分析维度"
        class="dimension-select"
        @change="handleDimensionChange"
      >
        <el-option label="整体掌握度" value="overall" />
        <el-option label="按知识领域" value="by_domain" />
        <el-option label="按时间趋势" value="by_time" />
      </el-select>
    </div>

    <!-- 雷达图主区域 -->
    <div class="radar-content">
      <div class="radar-card">
        <div class="card-header">
          <h2 class="card-title">掌握度雷达图</h2>
          <div class="card-actions">
            <el-button size="small" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
        
        <div ref="chartContainer" class="chart-container">
          <div v-if="error" class="empty-state">
            <el-empty :description="error">
              <el-button type="primary" @click="loadData">重试</el-button>
            </el-empty>
          </div>
          <div v-else-if="knowledgePoints.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无诊断数据，请先完成答题以生成掌握度分析">
              <el-button type="primary" @click="handleBack">返回学习</el-button>
            </el-empty>
          </div>
        </div>
        
        <div class="radar-summary">
          <div class="summary-item">
            <div class="summary-label">平均掌握度</div>
            <div class="summary-value average">{{ averageMastery }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">最强知识点</div>
            <div class="summary-value best">{{ strongestPoint?.name || '-' }}</div>
            <div class="summary-percent">{{ strongestPoint?.mastery || 0 }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">最弱知识点</div>
            <div class="summary-value weakest">{{ weakestPoint?.name || '-' }}</div>
            <div class="summary-percent">{{ weakestPoint?.mastery || 0 }}%</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">知识点总数</div>
            <div class="summary-value total">{{ knowledgePoints.length }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧详情列表 -->
      <div class="detail-list">
        <div class="list-header">
          <h3>各知识点掌握度详情</h3>
          <el-input
            v-model="searchText"
            placeholder="搜索知识点..."
            :prefix-icon="Search"
            clearable
            class="search-input"
          />
        </div>
        
        <div class="list-content">
          <div
            v-for="point in filteredPoints"
            :key="point.id"
            class="point-item"
            :class="getPointClass(point.mastery)"
            @click="handlePointClick(point)"
          >
            <div class="point-info">
              <div class="point-name">{{ point.name }}</div>
            </div>
            <div class="point-mastery">
              <div class="mastery-bar">
                <div 
                  class="mastery-fill" 
                  :class="getMasteryBarClass(point.mastery)"
                  :style="{ width: point.mastery + '%' }"
                />
              </div>
              <span class="mastery-value" :class="getMasteryValueClass(point.mastery)">
                {{ point.mastery }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Refresh, Search } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { getRadar } from '@/api/study'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

interface KnowledgePoint {
  id: string
  name: string
  mastery: number
}

defineProps<{
  embedded?: boolean
}>()

const router = useRouter()
const courseStore = useCourseStore()
const userStore = useUserStore()

const selectedDimension = ref('overall')
const searchText = ref('')
const chartInstance = ref<echarts.ECharts | null>(null)
const chartContainer = ref<HTMLElement | null>(null)
const loading = ref(false)
const error = ref('')

const knowledgePoints = ref<KnowledgePoint[]>([])

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
    const data = await getRadar(userId, course.id)
    knowledgePoints.value = data
    if (data.length > 0) {
      initChart()
    }
  } catch (e: any) {
    error.value = e?.message || '加载掌握度数据失败，请确认后端服务是否正常运行'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const averageMastery = computed(() => {
  if (knowledgePoints.value.length === 0) return 0
  const total = knowledgePoints.value.reduce((sum, p) => sum + p.mastery, 0)
  return Math.round(total / knowledgePoints.value.length)
})

const strongestPoint = computed(() => {
  return [...knowledgePoints.value].sort((a, b) => b.mastery - a.mastery)[0]
})

const weakestPoint = computed(() => {
  return [...knowledgePoints.value].sort((a, b) => a.mastery - b.mastery)[0]
})

const filteredPoints = computed(() => {
  if (!searchText.value) return knowledgePoints.value
  return knowledgePoints.value.filter(p => 
    p.name.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const getPointClass = (mastery: number) => {
  if (mastery >= 80) return 'point-excellent'
  if (mastery >= 60) return 'point-good'
  if (mastery >= 40) return 'point-average'
  return 'point-poor'
}

const getMasteryBarClass = (mastery: number) => {
  if (mastery >= 80) return 'bar-excellent'
  if (mastery >= 60) return 'bar-good'
  if (mastery >= 40) return 'bar-average'
  return 'bar-poor'
}

const getMasteryValueClass = (mastery: number) => {
  if (mastery >= 80) return 'value-excellent'
  if (mastery >= 60) return 'value-good'
  if (mastery >= 40) return 'value-average'
  return 'value-poor'
}

const initChart = () => {
  if (!chartContainer.value) return
  
  if (!chartInstance.value) {
    chartInstance.value = echarts.init(chartContainer.value)
  }
  
  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}<br/>掌握度：${params.value}%`
      }
    },
    radar: {
      indicator: knowledgePoints.value.map(p => ({
        name: p.name,
        max: 100
      })),
      center: ['50%', '50%'],
      radius: '78%',
      axisName: {
        color: '#606266',
        fontSize: 12,
        formatter: '{value}'
      },
      splitLine: {
        lineStyle: {
          color: ['#e4e7ed', '#e4e7ed', '#e4e7ed', '#e4e7ed', '#e4e7ed']
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(245, 247, 250, 0.8)', 'rgba(240, 245, 255, 0.8)', 
                  'rgba(245, 247, 250, 0.8)', 'rgba(240, 245, 255, 0.8)',
                  'rgba(245, 247, 250, 0.8)']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#dcdfe6'
        }
      }
    },
    series: [{
      name: '知识点掌握度',
      type: 'radar',
      data: [
        {
          value: knowledgePoints.value.map(p => p.mastery),
          name: '掌握度',
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.8)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.2)' }
            ])
          },
          lineStyle: {
            color: '#409eff',
            width: 2
          },
          itemStyle: {
            color: '#409eff',
            borderColor: '#fff',
            borderWidth: 2
          },
          emphasis: {
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(64, 158, 255, 0.9)' },
                { offset: 1, color: 'rgba(64, 158, 255, 0.3)' }
              ])
            }
          }
        }
      ]
    }]
  }
  
  chartInstance.value.setOption(option)
}

const handleDimensionChange = () => {
  // 按维度重新请求数据，目前后端统一返回整体掌握度
  loadData()
}

const handleRefresh = () => {
  loadData()
}

const handleBack = () => {
  router.back()
}

const handlePointClick = (point: KnowledgePoint) => {
  const course = courseStore.getCurrentCourse()
  router.push({
    path: `/course/${course?.id || 1}`,
    query: { tab: 'graph', highlight: point.id }
  })
}

watch(() => filteredPoints.value, () => {
  initChart()
}, { deep: true })

onMounted(() => {
  loadData()
  
  window.addEventListener('resize', () => {
    chartInstance.value?.resize()
  })
})
</script>

<style scoped lang="css">
.radar-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.radar-header {
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

.radar-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.dimension-select {
  width: 180px;
}

.radar-content {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
}

.radar-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.chart-container {
  width: 100%;
  height: 600px;
  margin-bottom: 24px;
}

.radar-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.summary-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.summary-value.average {
  color: #409eff;
}

.summary-value.best {
  color: #67c23a;
}

.summary-value.weakest {
  color: #f56c6c;
}

.summary-value.total {
  color: #e6a23c;
}

.summary-percent {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

/* 详情列表 */
.detail-list {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-input {
  width: 200px;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
}

.point-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.point-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.point-excellent {
  border-left: 3px solid #67c23a;
}

.point-good {
  border-left: 3px solid #409eff;
}

.point-average {
  border-left: 3px solid #e6a23c;
}

.point-poor {
  border-left: 3px solid #f56c6c;
}

.point-info {
  margin-bottom: 12px;
}

.point-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.point-meta {
  display: flex;
  gap: 8px;
}

.point-domain {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.point-mastery {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mastery-bar {
  flex: 1;
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.mastery-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.bar-excellent {
  background: #67c23a;
}

.bar-good {
  background: #409eff;
}

.bar-average {
  background: #e6a23c;
}

.bar-poor {
  background: #f56c6c;
}

.mastery-value {
  font-size: 14px;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}

.value-excellent {
  color: #67c23a;
}

.value-good {
  color: #409eff;
}

.value-average {
  color: #e6a23c;
}

.value-poor {
  color: #f56c6c;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  width: 100%;
}

/* 嵌套在 CourseDetail Tab 中的样式覆盖 */
.radar-page.embedded {
  min-height: 0;
  padding: 0;
  background: transparent;
}

.radar-page.embedded .radar-header {
  margin-bottom: 16px;
}

.radar-page.embedded .radar-title {
  font-size: 20px;
}

.radar-page.embedded .radar-content {
  gap: 16px;
}

.radar-page.embedded .radar-card {
  padding: 16px;
  box-shadow: none;
  border: 1px solid #e4e7ed;
}

.radar-page.embedded .chart-container {
  height: 550px;
}

.radar-page.embedded .detail-list {
  padding: 16px;
  box-shadow: none;
  border: 1px solid #e4e7ed;
}
</style>
