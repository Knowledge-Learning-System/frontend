<template>
  <div class="video-player-container">
    <div class="video-wrapper">
      <video ref="videoRef" class="video-js vjs-default-skin vjs-big-play-centered" playsinline>
        <source :src="videoSrc" :type="videoType" />
        <p class="vjs-no-js">
          您的浏览器不支持 HTML5 视频播放，请升级浏览器。
        </p>
      </video>
    </div>

    <!-- 笔记面板 -->
    <div v-if="showNotePanel" class="note-panel">
      <div class="note-panel-header">
        <h3>笔记</h3>
        <el-button text @click="toggleNotePanel">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="note-panel-content">
        <div class="add-note-section">
          <el-input
            v-model="newNoteContent"
            type="textarea"
            :rows="3"
            placeholder="在此输入笔记内容..."
            @keydown.ctrl.enter="handleAddNote"
          />
          <div class="note-actions">
            <span class="current-time">{{ formatTime(currentTime) }}</span>
            <el-button type="primary" size="small" @click="handleAddNote" :disabled="!newNoteContent.trim()">
              添加笔记
            </el-button>
          </div>
        </div>

        <div class="notes-list">
          <el-empty v-if="!notes.length" description="暂无笔记" />
          <div
            v-for="note in sortedNotes"
            :key="note.id"
            class="note-item"
          >
            <div class="note-header">
              <el-tag size="small" type="info" class="note-time" @click="seekToTime(note.timestamp)">
                {{ formatTime(note.timestamp) }}
              </el-tag>
              <div class="note-actions-btns">
                <el-button text size="small" @click="editNote(note)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button text size="small" @click="handleDeleteNote(note.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="note-content">{{ note.content }}</div>
            <div class="note-date">{{ formatDate(note.createTime) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 笔记编辑对话框 -->
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
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import videojs from 'video.js'
import type Player from 'video.js/dist/types/player'
import 'video.js/dist/video-js.css'
import { Close, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getVideoNotes,
  createNote,
  updateNote,
  deleteNote,
  type Note
} from '@/api/note'
import {
  getVideoProgress,
  updateVideoProgress,
  type VideoProgress
} from '@/api/videoProgress'
import { useUserStore } from '@/stores/user'

interface Props {
  videoId: number
  videoSrc: string
  videoType?: string
  knowledgePointId: string
  courseId?: number
  showNotePanel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  videoType: 'video/mp4',
  courseId: 0,
  showNotePanel: false
})

const emit = defineEmits<{
  (e: 'toggleNotePanel'): void
  (e: 'timeupdate', time: number): void
  (e: 'ended'): void
}>()

const userStore = useUserStore()
const videoRef = ref<HTMLVideoElement>()
let player: Player | null = null

const currentTime = ref(0)
const duration = ref(0)
const playbackRate = ref(1)
const notes = ref<Note[]>([])
const newNoteContent = ref('')
const editDialogVisible = ref(false)
const editForm = ref({ id: 0, timestamp: 0, content: '' })

const sortedNotes = computed(() => {
  return [...notes.value].sort((a, b) => a.timestamp - b.timestamp)
})

const isLoggedIn = computed(() => userStore.isLoggedIn)

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

// 初始化播放器
async function initPlayer() {
  if (!videoRef.value) return

  player = videojs(videoRef.value, {
    controls: true,
    autoplay: false,
    preload: 'auto',
    fluid: true,
    playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
    controlBar: {
      children: [
        'playToggle',
        'volumePanel',
        'currentTimeDisplay',
        'timeDivider',
        'durationDisplay',
        'progressControl',
        'playbackRateMenuButton',
        'fullscreenToggle'
      ]
    }
  })

  // 监听事件
  player.on('timeupdate', () => {
    currentTime.value = player?.currentTime() || 0
    emit('timeupdate', currentTime.value)
  })

  player.on('durationchange', () => {
    duration.value = player?.duration() || 0
  })

  player.on('ratechange', () => {
    playbackRate.value = player?.playbackRate() || 1
  })

  player.on('ended', () => {
    emit('ended')
    // 标记为已完成
    if (isLoggedIn.value) {
      saveProgress(duration.value, true)
    }
  })

  // 定期保存进度
  player.on('timeupdate', () => {
    if (isLoggedIn.value && currentTime.value > 0 && currentTime.value % 10 < 1) {
      // 每10秒保存一次进度
      saveProgress(currentTime.value)
    }
  })

  // 恢复播放进度
  if (isLoggedIn.value) {
    await restoreProgress()
  }
}

// 保存播放进度
async function saveProgress(time: number, completed = false) {
  if (!isLoggedIn.value) return

  try {
    await updateVideoProgress({
      videoId: props.videoId,
      currentTime: time,
      duration: duration.value,
      playbackRate: playbackRate.value,
      completed,
      knowledgePointId: props.knowledgePointId,
      courseId: props.courseId,
    })
  } catch (error) {
    console.error('保存进度失败:', error)
  }
}

// 恢复播放进度
async function restoreProgress() {
  if (!isLoggedIn.value) return

  try {
    const progress = await getVideoProgress(props.videoId)
    if (progress && progress.currentTime > 0 && !progress.completed) {
      // 如果进度超过 95%，从头开始播放
      if (progress.currentTime / progress.duration > 0.95) {
        player?.currentTime(0)
      } else {
        player?.currentTime(progress.currentTime)
        if (progress.playbackRate) {
          player?.playbackRate(progress.playbackRate)
        }
      }
    }
  } catch (error) {
    console.error('恢复进度失败:', error)
  }
}

// 加载笔记
async function loadNotes() {
  try {
    notes.value = await getVideoNotes(props.videoId)
  } catch (error) {
    console.error('加载笔记失败:', error)
  }
}

// 添加笔记
async function handleAddNote() {
  if (!newNoteContent.value.trim()) return

  try {
    const note = await createNote({
      videoId: props.videoId,
      knowledgePointId: props.knowledgePointId,
      timestamp: currentTime.value,
      content: newNoteContent.value.trim()
    })
    notes.value.push(note)
    newNoteContent.value = ''
    ElMessage.success('笔记添加成功')
  } catch (error) {
    ElMessage.error('添加笔记失败')
  }
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

// 跳转到指定时间
function seekToTime(seconds: number) {
  if (player) {
    player.currentTime(seconds)
    player.play()
  }
}

// 切换笔记面板
function toggleNotePanel() {
  emit('toggleNotePanel')
}

// 暴露方法给父组件
defineExpose({
  seekToTime,
  play: () => player?.play(),
  pause: () => player?.pause(),
  getCurrentTime: () => currentTime.value
})

onMounted(() => {
  initPlayer()
  if (props.showNotePanel && isLoggedIn.value) {
    loadNotes()
  }
})

onBeforeUnmount(() => {
  // 保存最终进度
  if (isLoggedIn.value && currentTime.value > 0) {
    saveProgress(currentTime.value)
  }
  if (player) {
    player.dispose()
  }
})

// 监听 showNotePanel 变化
watch(() => props.showNotePanel, (newVal) => {
  if (newVal && isLoggedIn.value) {
    loadNotes()
  }
})
</script>

<style scoped>
.video-player-container {
  display: flex;
  width: 100%;
  height: 100%;
  background: #000;
}

.video-wrapper {
  flex: 1;
  position: relative;
}

.video-wrapper :deep(.video-js) {
  width: 100%;
  height: 100%;
}

.note-panel {
  width: 350px;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e4e7ed;
}

.note-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.note-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.note-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.add-note-section {
  margin-bottom: 20px;
}

.note-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.current-time {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.note-time {
  cursor: pointer;
}

.note-time:hover {
  background: #409eff;
  color: #fff;
}

.note-actions-btns {
  display: flex;
  gap: 4px;
}

.note-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 8px;
}

.note-date {
  font-size: 12px;
  color: #909399;
}
</style>