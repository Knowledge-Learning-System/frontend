<template>
  <div class="search-page">
    <div class="search-header">
      <h2>搜索</h2>
      <div class="search-input-wrapper">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索视频、文档、链接..."
          size="large"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button type="primary" @click="handleSearch" :loading="searching">
              搜索
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <div v-if="hasSearched" class="search-content" v-loading="searching">
      <!-- 搜索统计 -->
      <div class="search-stats">
        <span>
          找到
          <strong>{{ totalCount }}</strong>
          个结果
        </span>
      </div>

      <!-- 搜索结果标签页 -->
      <el-tabs v-model="activeTab" class="result-tabs" @tab-change="handleTabChange">
        <el-tab-pane name="all">
          <template #label>
            <span>
              全部
              <el-badge :value="totalCount" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane name="video">
          <template #label>
            <span>
              视频
              <el-badge :value="allVideos.length" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane name="document">
          <template #label>
            <span>
              文档
              <el-badge :value="allDocuments.length" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane name="link">
          <template #label>
            <span>
              链接
              <el-badge :value="allLinks.length" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>

      <!-- 搜索结果列表 -->
      <div class="result-list">
        <el-empty v-if="!currentResults.length" description="没有找到相关结果" />

        <div
          v-for="(item, index) in currentResults"
          :key="`${item.type}-${item.id}`"
          class="result-item"
          @click="handleResultClick(item)"
        >
          <div class="result-icon">
            <el-icon v-if="item.type === 'video'" :size="32" color="#409eff">
              <VideoPlay />
            </el-icon>
            <el-icon v-else-if="item.type === 'document'" :size="32" color="#67c23a">
              <Document />
            </el-icon>
            <el-icon v-else :size="32" color="#e6a23c">
              <Link />
            </el-icon>
          </div>

          <div class="result-content">
            <h3 class="result-title" v-html="highlightKeyword(item.title)"></h3>
            <p class="result-description" v-html="highlightKeyword(item.description)"></p>
            <div class="result-highlight" v-if="item.highlight" v-html="highlightKeyword(item.highlight)"></div>

            <div class="result-meta">
              <el-tag size="small" type="info">
                {{ item.type === 'video' ? '视频' : item.type === 'document' ? '文档' : '链接' }}
              </el-tag>
              <span v-if="item.knowledgePointName" class="meta-item">
                {{ item.knowledgePointName }}
              </span>
              <span v-if="item.courseName" class="meta-item">
                {{ item.courseName }}
              </span>
              <span v-if="item.timestamp" class="meta-item">
                {{ formatTime(item.timestamp) }}
              </span>
              <span v-if="item.createdAt" class="meta-item">
                {{ formatDate(item.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="currentResults.length" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="currentTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 搜索建议 -->
    <div v-else class="search-suggestions">
      <h3>热门搜索</h3>
      <div class="suggestion-tags">
        <el-tag
          v-for="tag in hotKeywords"
          :key="tag"
          class="suggestion-tag"
          @click="handleSuggestionClick(tag)"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, VideoPlay, Document, Link } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { search, type SearchResult } from '@/api/search'

const router = useRouter()
const searchKeyword = ref('')
const searching = ref(false)
const hasSearched = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)

// 所有搜索结果（按类型分开），前端自行分页
const allVideos = ref<SearchResult[]>([])
const allDocuments = ref<SearchResult[]>([])
const allLinks = ref<SearchResult[]>([])

const hotKeywords = ref([
  '数据结构',
  '算法',
  '机器学习',
  'Python',
  'Java',
  '前端开发'
])

const totalCount = computed(() => {
  return allVideos.value.length + allDocuments.value.length + allLinks.value.length
})

const currentResults = computed(() => {
  let results: SearchResult[] = []

  switch (activeTab.value) {
    case 'video':
      results = allVideos.value
      break
    case 'document':
      results = allDocuments.value
      break
    case 'link':
      results = allLinks.value
      break
    default:
      results = [...allVideos.value, ...allDocuments.value, ...allLinks.value]
  }

  // 前端分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return results.slice(start, end)
})

const currentTotal = computed(() => {
  switch (activeTab.value) {
    case 'video':
      return allVideos.value.length
    case 'document':
      return allDocuments.value.length
    case 'link':
      return allLinks.value.length
    default:
      return totalCount.value
  }
})

// 高亮关键词
function highlightKeyword(text: string): string {
  if (!searchKeyword.value || !text) return text

  const keyword = searchKeyword.value.trim()
  const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi')
  return text.replace(regex, '<mark class="highlight">$1</mark>')
}

// 转义正则特殊字符
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 格式化时间
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

// 执行搜索（拉取大量结果，前端按类型分页）
async function handleSearch() {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  searching.value = true
  hasSearched.value = true
  currentPage.value = 1

  try {
    const result = await search({
      keyword: searchKeyword.value.trim(),
      page: 1,
      pageSize: 1000,
    })
    allVideos.value = result.videos
    allDocuments.value = result.documents
    allLinks.value = result.links
  } catch (error) {
    ElMessage.error('搜索失败，请重试')
  } finally {
    searching.value = false
  }
}

// 标签页切换 → 重置页码
function handleTabChange() {
  currentPage.value = 1
}

// 分页大小变化 → 重置页码
function handleSizeChange() {
  currentPage.value = 1
}

// 页码变化 → 仅前端切片，不再请求后端
function handlePageChange() {
  // 已全量加载，无需额外操作
}

// 点击搜索建议
function handleSuggestionClick(keyword: string) {
  searchKeyword.value = keyword
  handleSearch()
}

// 点击搜索结果
function handleResultClick(item: SearchResult) {
  const query: Record<string, string> = {
    knowledgePointId: item.knowledgePointId || '',
    highlight: item.knowledgePointId || '',
  }
  if (item.type === 'video') {
    query.tab = 'videos'
    query.videoId = String(item.id)
  } else {
    query.tab = 'courseware'
  }
  router.push({
    path: `/course/${item.courseId}`,
    query,
  })
}

onMounted(() => {
  const keyword = (router.currentRoute.value.query.q || router.currentRoute.value.query.keyword) as string
  if (keyword) {
    searchKeyword.value = keyword
    handleSearch()
  }
})
</script>

<style scoped>
.search-page {
  padding: 24px;
  background: #fff;
  min-height: calc(100vh - 60px);
}

.search-header {
  margin-bottom: 24px;
}

.search-header h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.search-input-wrapper {
  max-width: 800px;
}

.search-content {
  min-height: 400px;
}

.search-stats {
  margin-bottom: 16px;
  color: #606266;
}

.search-stats strong {
  color: #409eff;
  font-size: 18px;
}

.result-tabs {
  margin-bottom: 24px;
}

.tab-badge {
  margin-left: 4px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.result-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.result-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.result-title :deep(.highlight) {
  background: #ffeaa7;
  padding: 0 2px;
  border-radius: 2px;
}

.result-description {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.result-description :deep(.highlight) {
  background: #ffeaa7;
  padding: 0 2px;
  border-radius: 2px;
}

.result-highlight {
  margin: 0 0 8px 0;
  padding: 8px 12px;
  font-size: 13px;
  color: #909399;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
}

.result-highlight :deep(.highlight) {
  background: #ffeaa7;
  padding: 0 2px;
  border-radius: 2px;
  color: #303133;
  font-weight: 600;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.search-suggestions {
  padding: 24px;
  background: #f5f7fa;
  border-radius: 8px;
}

.search-suggestions h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.suggestion-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.suggestion-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.suggestion-tag:hover {
  background: #409eff;
  color: #fff;
}
</style>