<template>
  <div class="notes-management">
    <div class="page-header">
      <h2>我的笔记</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索笔记内容..."
          prefix-icon="Search"
          clearable
          style="width: 300px"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="filter-section">
      <el-radio-group v-model="viewMode" @change="handleViewModeChange">
        <el-radio-button value="video">按视频</el-radio-button>
        <el-radio-button value="knowledge">按知识点</el-radio-button>
      </el-radio-group>

      <el-select
        v-if="viewMode === 'video'"
        v-model="selectedVideoId"
        placeholder="选择视频"
        clearable
        style="width: 300px"
        @change="handleFilterChange"
      >
        <el-option
          v-for="video in videos"
          :key="video.id"
          :label="video.title"
          :value="video.id"
        />
      </el-select>

      <el-select
        v-if="viewMode === 'knowledge'"
        v-model="selectedKnowledgePointId"
        placeholder="选择知识点"
        clearable
        style="width: 300px"
        @change="handleFilterChange"
      >
        <el-option
          v-for="kp in knowledgePoints"
          :key="kp.id"
          :label="kp.name"
          :value="kp.id"
        />
      </el-select>
    </div>

    <div class="notes-content" v-loading="loading">
      <el-empty v-if="!filteredNotes.length" description="暂无笔记" />

      <div v-else class="notes-list">
        <div
          v-for="group in groupedNotes"
          :key="group.key"
          class="note-group"
        >
          <div class="group-header">
            <h3>{{ group.title }}</h3>
            <el-tag size="small">{{ group.notes.length }} 条笔记</el-tag>
          </div>

          <div class="group-notes">
            <div
              v-for="note in group.notes"
              :key="note.id"
              class="note-card"
            >
              <div class="note-card-header">
                <el-tag type="info" size="small">
                  {{ formatTime(note.timestamp) }}
                </el-tag>
                <div class="note-card-actions">
                  <el-button text size="small" @click="editNote(note)">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-button>
                  <el-button text size="small" type="danger" @click="handleDeleteNote(note.id)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>

              <div class="note-card-content">
                {{ note.content }}
              </div>

              <div class="note-card-footer">
                <span class="note-meta">
                  {{ formatDate(note.createTime) }}
                </span>
                <el-button
                  type="primary"
                  size="small"
                  @click="goToVideo(note)"
                >
                  前往视频
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑笔记对话框 -->
    <el-dialog v-model="editDialogVisible" title="编辑笔记" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="时间点">
          <el-tag>{{ formatTime(editForm.timestamp) }}</el-tag>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="editForm.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getNotes,
  updateNote,
  deleteNote,
  type Note
} from '@/api/note'
import { getVideos, type VideoResource } from '@/api/resource'

interface VideoInfo extends VideoResource {
  knowledgePointName?: string
}

interface KnowledgePoint {
  id: string
  name: string
}

interface NoteGroup {
  key: string
  title: string
  notes: Note[]
}

const router = useRouter()
const loading = ref(false)
const notes = ref<Note[]>([])
const videos = ref<VideoInfo[]>([])
const knowledgePoints = ref<KnowledgePoint[]>([])
const searchKeyword = ref('')
const viewMode = ref<'video' | 'knowledge'>('video')
const selectedVideoId = ref<number>()
const selectedKnowledgePointId = ref<string>()
const editDialogVisible = ref(false)
const editForm = ref({ id: 0, timestamp: 0, content: '' })

const filteredNotes = computed(() => {
  let result = notes.value

  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(note =>
      note.content.toLowerCase().includes(keyword)
    )
  }

  // 按视频筛选
  if (viewMode.value === 'video' && selectedVideoId.value) {
    result = result.filter(note => note.videoId === selectedVideoId.value)
  }

  // 按知识点筛选
  if (viewMode.value === 'knowledge' && selectedKnowledgePointId.value) {
    result = result.filter(note => note.knowledgePointId === selectedKnowledgePointId.value)
  }

  return result
})

const groupedNotes = computed(() => {
  const groups: NoteGroup[] = []

  if (viewMode.value === 'video') {
    // 按视频分组
    const videoMap = new Map<number, Note[]>()
    filteredNotes.value.forEach(note => {
      if (!videoMap.has(note.videoId)) {
        videoMap.set(note.videoId, [])
      }
      videoMap.get(note.videoId)!.push(note)
    })

    videoMap.forEach((notesList, videoId) => {
      const video = videos.value.find(v => v.id === videoId)
      groups.push({
        key: `video-${videoId}`,
        title: video?.title || `视频 ${videoId}`,
        notes: notesList.sort((a, b) => a.timestamp - b.timestamp)
      })
    })
  } else {
    // 按知识点分组
    const kpMap = new Map<string, Note[]>()
    filteredNotes.value.forEach(note => {
      if (!kpMap.has(note.knowledgePointId)) {
        kpMap.set(note.knowledgePointId, [])
      }
      kpMap.get(note.knowledgePointId)!.push(note)
    })

    kpMap.forEach((notesList, kpId) => {
      const kp = knowledgePoints.value.find(k => k.id === kpId)
      groups.push({
        key: `kp-${kpId}`,
        title: kp?.name || `知识点 ${kpId}`,
        notes: notesList.sort((a, b) => a.timestamp - b.timestamp)
      })
    })
  }

  return groups
})

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
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载笔记
async function loadNotes() {
  loading.value = true
  try {
    notes.value = await getNotes({})
  } catch (error) {
    ElMessage.error('加载笔记失败')
  } finally {
    loading.value = false
  }
}

// 加载视频列表
async function loadVideos() {
  try {
    const data = await getVideos()
    videos.value = data
  } catch (error) {
    console.error('加载视频列表失败:', error)
  }
}

// 提取知识点列表
function extractKnowledgePoints() {
  const kpMap = new Map<string, KnowledgePoint>()
  notes.value.forEach(note => {
    if (!kpMap.has(note.knowledgePointId)) {
      kpMap.set(note.knowledgePointId, {
        id: note.knowledgePointId,
        name: `知识点 ${note.knowledgePointId}` // 实际应该从知识点接口获取名称
      })
    }
  })
  knowledgePoints.value = Array.from(kpMap.values())
}

// 搜索
function handleSearch() {
  // 搜索逻辑已通过 computed 实现
}

// 切换视图模式
function handleViewModeChange() {
  selectedVideoId.value = undefined
  selectedKnowledgePointId.value = undefined
}

// 筛选变化
function handleFilterChange() {
  // 筛选逻辑已通过 computed 实现
}

// 编辑笔记
function editNote(note: Note) {
  editForm.value = {
    id: note.id,
    timestamp: note.timestamp,
    content: note.content
  }
  editDialogVisible.value = true
}

// 更新笔记
async function handleUpdateNote() {
  try {
    const note = await updateNote(editForm.value)
    const index = notes.value.findIndex(n => n.id === note.id)
    if (index !== -1) {
      notes.value[index] = note
    }
    editDialogVisible.value = false
    ElMessage.success('笔记更新成功')
  } catch (error) {
    ElMessage.error('更新笔记失败')
  }
}

// 删除笔记
async function handleDeleteNote(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这条笔记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteNote(id)
    notes.value = notes.value.filter(n => n.id !== id)
    ElMessage.success('笔记删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除笔记失败')
    }
  }
}

// 前往视频
function goToVideo(note: Note) {
  // 跳转到课程详情页，并定位到对应视频和时间点
  const video = videos.value.find(v => v.id === note.videoId)
  if (video) {
    router.push({
      path: `/course/${video.courseId}`,
      query: {
        videoId: note.videoId,
        timestamp: note.timestamp,
        knowledgePointId: note.knowledgePointId
      }
    })
  }
}

onMounted(async () => {
  await Promise.all([
    loadNotes(),
    loadVideos()
  ])
  extractKnowledgePoints()
})
</script>

<style scoped>
.notes-management {
  padding: 24px;
  background: #fff;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.notes-content {
  min-height: 400px;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.note-group {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.group-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.group-notes {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: box-shadow 0.3s;
}

.note-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.note-card-actions {
  display: flex;
  gap: 8px;
}

.note-card-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 12px;
}

.note-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-meta {
  font-size: 12px;
  color: #909399;
}
</style>