<template>
  <div class="admin-resources">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">资源管理</span>
          <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
        </div>
      </template>

      <div class="filter-bar">
        <el-select v-model="query.type" placeholder="全部类型" clearable class="filter-item">
          <el-option label="视频" value="video" />
          <el-option label="课件" value="courseware" />
        </el-select>
        <el-select v-model="query.courseId" placeholder="全部课程" clearable filterable class="filter-item course-select">
          <el-option v-for="c in courses" :key="c.id" :label="c.name || `课程 ${c.id}`" :value="c.id" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="资源标题关键词"
          clearable
          class="filter-item"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <span class="stat-text">
          共 {{ total }} 条（视频 {{ typeStat.video ?? 0 }} · 课件 {{ typeStat.courseware ?? 0 }}）
        </span>
      </div>

      <el-table v-loading="loading" :data="records" border stripe>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.type === 'video' ? 'success' : 'warning'" effect="plain">
              {{ row.typeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="资源标题" min-width="260" show-overflow-tooltip />
        <el-table-column label="所属课程" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.courseName || `课程 ${row.courseId ?? '-'}` }}</template>
        </el-table-column>
        <el-table-column label="知识点 ID" min-width="160">
          <template #default="{ row }">{{ row.knowledgePointId || '-' }}</template>
        </el-table-column>
        <el-table-column label="格式 / 时长" width="140" align="center">
          <template #default="{ row }">
            <span v-if="row.type === 'video'">{{ formatDuration(row.duration) }}</span>
            <span v-else>{{ row.fileType || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="入库时间" width="160">
          <template #default="{ row }">{{ row.createTime || '-' }}</template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && records.length === 0" description="暂无资源数据" />

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadData"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAdminResources, type AdminResourceRow } from '@/api/admin'

const loading = ref(false)
const total = ref(0)
const records = ref<AdminResourceRow[]>([])
const typeStat = ref<Record<string, number>>({})
const courses = ref<Array<{ id: number; name: string }>>([])

const query = reactive<{
  type: string | undefined
  courseId: number | undefined
  keyword: string
  page: number
  size: number
}>({
  type: undefined,
  courseId: undefined,
  keyword: '',
  page: 1,
  size: 10,
})

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s}秒`
}

async function loadData() {
  loading.value = true
  try {
    const res = await getAdminResources({
      type: query.type,
      courseId: query.courseId,
      keyword: query.keyword || undefined,
      page: query.page,
      size: query.size,
    })
    records.value = res.records || []
    total.value = res.total || 0
    typeStat.value = res.typeStat || {}
    courses.value = res.courses || []
  } catch (e: any) {
    ElMessage.error(e?.message || '加载资源列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.page = 1
  loadData()
}

function handleReset() {
  query.type = undefined
  query.courseId = undefined
  query.keyword = ''
  query.page = 1
  loadData()
}

function handleSizeChange() {
  query.page = 1
  loadData()
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

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-item {
  width: 180px;
}

.course-select {
  width: 240px;
}

.stat-text {
  font-size: 13px;
  color: #909399;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
