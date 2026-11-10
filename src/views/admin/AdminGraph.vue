<template>
  <div class="admin-graph">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">知识图谱维护</span>
          <div class="header-actions">
            <el-select
              v-model="courseId"
              placeholder="选择课程"
              class="course-select"
              filterable
              @change="loadData"
            >
              <el-option
                v-for="c in courses"
                :key="c.id"
                :label="c.name ? `${c.name}（${c.source || '未绑定'}）` : `课程 ${c.id}`"
                :value="c.id"
              />
            </el-select>
            <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
          </div>
        </div>
      </template>

      <el-alert
        v-if="loaded && !data.source"
        type="warning"
        :closable="false"
        show-icon
        title="当前课程未绑定知识图谱（course.source 为空），无法读取图谱结构"
        class="graph-alert"
      />

      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-label">知识点</div>
          <div class="stat-value">{{ data.kpCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">子主题</div>
          <div class="stat-value">{{ data.subTopicCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">知识区</div>
          <div class="stat-value">{{ data.areaCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">先修关系</div>
          <div class="stat-value">{{ data.prerequisiteCount }}</div>
        </div>
      </div>

      <div class="level-section">
        <div class="section-title">知识点层级分布</div>
        <div v-if="levelRows.length" class="level-list">
          <div v-for="item in levelRows" :key="item.level" class="level-item">
            <span class="level-name">第 {{ item.level }} 层</span>
            <el-progress
              :percentage="item.percent"
              :stroke-width="10"
              :show-text="false"
              class="level-progress"
            />
            <span class="level-count">{{ item.count }}</span>
          </div>
        </div>
        <el-empty v-else description="暂无层级数据" :image-size="60" />
      </div>

      <el-tabs v-model="activeTab" class="graph-tabs">
        <el-tab-pane :label="`知识区（${areaRows.length}）`" name="areas">
          <el-table v-loading="loading" :data="areaRows" border stripe size="small">
            <el-table-column prop="id" label="知识区 ID" min-width="200" />
            <el-table-column prop="name" label="知识区名称" min-width="200" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="`子主题（${subTopicRows.length}）`" name="subTopics">
          <el-table v-loading="loading" :data="subTopicPage" border stripe size="small">
            <el-table-column prop="id" label="子主题 ID" min-width="220" />
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column prop="order" label="序号" width="90" align="center" />
            <el-table-column prop="areaId" label="所属知识区" min-width="200" />
          </el-table>
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="subTopicPageNo"
              :page-size="10"
              :total="subTopicRows.length"
              layout="total, prev, pager, next"
              background
            />
          </div>
        </el-tab-pane>

        <el-tab-pane :label="`知识点（${kpRows.length}）`" name="knowledgePoints">
          <el-table v-loading="loading" :data="kpPage" border stripe size="small">
            <el-table-column prop="id" label="知识点 ID" min-width="220" />
            <el-table-column prop="name" label="名称" min-width="200" />
            <el-table-column prop="level" label="层级" width="90" align="center" />
            <el-table-column prop="order" label="序号" width="90" align="center" />
          </el-table>
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="kpPageNo"
              :page-size="10"
              :total="kpRows.length"
              layout="total, prev, pager, next"
              background
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAdminGraph, type AdminGraphData, type AdminGraphCourse } from '@/api/admin'

const loading = ref(false)
const loaded = ref(false)
const courseId = ref<number | undefined>(undefined)
const activeTab = ref('areas')
const subTopicPageNo = ref(1)
const kpPageNo = ref(1)
const courses = ref<AdminGraphCourse[]>([])
const data = ref<AdminGraphData>({
  courses: [],
  courseId: null,
  courseName: null,
  source: null,
  kpCount: 0,
  subTopicCount: 0,
  areaCount: 0,
  prerequisiteCount: 0,
  levelStat: {},
  areas: [],
  subTopics: [],
  knowledgePoints: [],
})

function pick(row: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null) return value
  }
  return ''
}

const areaRows = computed(() =>
  (data.value.areas || []).map((row) => ({
    id: pick(row, ['ka.id', 'id']),
    name: pick(row, ['ka.name', 'name']),
  }))
)

const subTopicRows = computed(() =>
  (data.value.subTopics || []).map((row) => ({
    id: pick(row, ['st.id', 'id']),
    name: pick(row, ['st.name', 'name']),
    order: pick(row, ['st.order', 'order']),
    areaId: pick(row, ['ka.id', 'areaId']),
  }))
)

const kpRows = computed(() =>
  (data.value.knowledgePoints || []).map((row) => ({
    id: pick(row, ['id', 'kp.id']),
    name: pick(row, ['name', 'kp.name']),
    level: pick(row, ['level', 'kp.level']),
    order: pick(row, ['order', 'kp.order']),
  }))
)

const subTopicPage = computed(() =>
  subTopicRows.value.slice((subTopicPageNo.value - 1) * 10, subTopicPageNo.value * 10)
)

const kpPage = computed(() => kpRows.value.slice((kpPageNo.value - 1) * 10, kpPageNo.value * 10))

const levelRows = computed(() => {
  const stat = data.value.levelStat || {}
  const total = Object.values(stat).reduce((sum, v) => sum + Number(v), 0)
  return Object.entries(stat)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([level, count]) => ({
      level,
      count: Number(count),
      percent: total ? Math.round((Number(count) * 100) / total) : 0,
    }))
})

async function loadData() {
  loading.value = true
  try {
    const res = await getAdminGraph(courseId.value)
    data.value = res
    courses.value = res.courses || []
    subTopicPageNo.value = 1
    kpPageNo.value = 1
    loaded.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '加载知识图谱数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-graph {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.course-select {
  width: 320px;
}

.graph-alert {
  margin-bottom: 16px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
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

.level-section {
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.level-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-name {
  width: 80px;
  font-size: 13px;
  color: #606266;
}

.level-progress {
  flex: 1;
}

.level-count {
  width: 50px;
  text-align: right;
  font-size: 13px;
  color: #606266;
}

.graph-tabs {
  margin-top: 8px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
