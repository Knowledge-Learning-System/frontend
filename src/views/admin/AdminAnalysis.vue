<template>
  <div class="admin-analysis">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">学情分析</span>
          <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
        </div>
      </template>

      <div v-loading="loading" class="stat-cards">
        <div class="stat-card">
          <div class="stat-label">平均掌握度</div>
          <div class="stat-value">{{ data.masteryAvg }}<span class="unit">分</span></div>
          <div class="stat-sub">已学习 {{ data.learnedRecords }} 条 · 未学习 {{ data.untouchedRecords }} 条</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">答题正确率</div>
          <div class="stat-value">{{ data.accuracy }}<span class="unit">%</span></div>
          <div class="stat-sub">答题 {{ data.answerTotal }} 次 · 正确 {{ data.correctTotal }} 次</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">学习活跃学生</div>
          <div class="stat-value">{{ data.activeStudents }}<span class="unit">人</span></div>
          <div class="stat-sub">有效学习记录 {{ data.studyRecords }} 条</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">学习天数</div>
          <div class="stat-value">{{ data.studyDays }}<span class="unit">天</span></div>
          <div class="stat-sub">按学生 + 日期去重统计</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">掌握度分布</div>
        <div class="dist-list">
          <div v-for="item in masterDistRows" :key="item.key" class="dist-item">
            <span class="dist-name">{{ item.label }}</span>
            <el-progress
              :percentage="item.percent"
              :stroke-width="12"
              :color="item.color"
              :show-text="false"
              class="dist-progress"
            />
            <span class="dist-count">{{ item.count }} 条（{{ item.percent }}%）</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">课程维度对比</div>
        <el-table v-loading="loading" :data="data.courseAnalysis" border stripe size="small">
          <el-table-column prop="courseId" label="课程 ID" width="90" align="center" />
          <el-table-column label="课程名称" min-width="220" show-overflow-tooltip>
            <template #default="{ row }">{{ row.courseName || `课程 ${row.courseId}` }}</template>
          </el-table-column>
          <el-table-column prop="masteryRecords" label="掌握度记录" width="120" align="center" />
          <el-table-column label="平均掌握度" width="130" align="center">
            <template #default="{ row }">
              <el-tag :type="masteryTagType(row.masteryAvg)" effect="plain">{{ row.masteryAvg }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="answerTotal" label="答题次数" width="110" align="center" />
          <el-table-column label="正确率" width="110" align="center">
            <template #default="{ row }">{{ row.answerTotal ? `${row.correctRate}%` : '-' }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loading && data.courseAnalysis.length === 0" description="暂无课程学情数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAdminAnalysis, type AdminAnalysisData } from '@/api/admin'

const loading = ref(false)
const data = ref<AdminAnalysisData>({
  masteryRecords: 0,
  learnedRecords: 0,
  untouchedRecords: 0,
  masteryAvg: 0,
  masteryDist: {},
  answerTotal: 0,
  correctTotal: 0,
  accuracy: 0,
  studyRecords: 0,
  studyDays: 0,
  activeStudents: 0,
  courseAnalysis: [],
})

const LABELS = [
  { key: 'excellent', label: '优秀（≥85）', color: '#67c23a' },
  { key: 'good', label: '良好（70-84）', color: '#409eff' },
  { key: 'pass', label: '及格（60-69）', color: '#e6a23c' },
  { key: 'weak', label: '薄弱（<60）', color: '#f56c6c' },
] as const

const masterDistRows = computed(() => {
  const dist = data.value.masteryDist || {}
  const total = Object.values(dist).reduce((sum, v) => sum + Number(v), 0)
  return LABELS.map((item) => {
    const count = Number(dist[item.key] ?? 0)
    return {
      key: item.key,
      label: item.label,
      color: item.color,
      count,
      percent: total ? Math.round((count * 100) / total) : 0,
    }
  })
})

function masteryTagType(value: number) {
  if (value >= 85) return 'success'
  if (value >= 70) return 'primary'
  if (value >= 60) return 'warning'
  return 'danger'
}

async function loadData() {
  loading.value = true
  try {
    data.value = await getAdminAnalysis()
  } catch (e: any) {
    ElMessage.error(e?.message || '加载学情分析失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #f7f9fc;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  padding: 16px 20px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.unit {
  font-size: 13px;
  font-weight: 400;
  color: #909399;
  margin-left: 2px;
}

.stat-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #a8abb2;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.dist-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dist-name {
  width: 120px;
  font-size: 13px;
  color: #606266;
}

.dist-progress {
  flex: 1;
}

.dist-count {
  width: 140px;
  text-align: right;
  font-size: 13px;
  color: #606266;
}
</style>
