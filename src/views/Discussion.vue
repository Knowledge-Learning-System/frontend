<template>
  <div class="discussion-page">
    <div class="page-header">
      <h2>课程讨论区</h2>
      <span class="page-sub">同学和老师都可以在这里交流</span>
    </div>

    <!-- 发帖表单 -->
    <el-card class="post-card" shadow="never">
      <template #header>
        <span class="card-title">发起讨论</span>
      </template>
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input v-model="newTitle" placeholder="请输入标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="newContent"
            type="textarea"
            :rows="4"
            placeholder="请输入讨论内容"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
        <el-button type="primary" :loading="posting" :disabled="!canPost" @click="handlePost">
          发布讨论
        </el-button>
      </el-form>
    </el-card>

    <!-- 讨论列表 -->
    <div v-if="loading" class="list-tip">加载中…</div>
    <div v-else-if="discussions.length === 0" class="list-tip">暂无讨论，快来发起第一个讨论吧。</div>

    <el-card v-for="d in discussions" :key="d.id" class="discussion-item" shadow="never">
      <div class="discussion-header">
        <span class="author">{{ d.nickname || d.username }}</span>
        <el-tag :type="d.role === 'teacher' ? 'danger' : 'primary'" size="small">
          {{ d.role === 'teacher' ? '教师' : '学生' }}
        </el-tag>
        <span class="time">{{ formatTime(d.createTime) }}</span>
      </div>
      <h3 class="discussion-title">{{ d.title }}</h3>
      <p class="discussion-content">{{ d.content }}</p>
      <div class="discussion-actions">
        <el-button text type="primary" @click="toggleReplies(d)">
          {{ expandedId === d.id ? '收起回复' : `查看回复(${d.replyCount})` }}
        </el-button>
        <el-button v-if="canDelete(d)" text type="danger" @click="handleDeleteDiscussion(d)">
          删除
        </el-button>
      </div>

      <!-- 回复区 -->
      <div v-if="expandedId === d.id" class="reply-area">
        <div v-if="d.replies && d.replies.length > 0" class="reply-list">
          <div v-for="r in d.replies" :key="r.id" class="reply-item">
            <div class="reply-header">
              <span class="author">{{ r.nickname || r.username }}</span>
              <el-tag :type="r.role === 'teacher' ? 'danger' : 'primary'" size="small">
                {{ r.role === 'teacher' ? '教师' : '学生' }}
              </el-tag>
              <span v-if="r.replyToUsername" class="reply-to">回复 @{{ r.replyToUsername }}</span>
              <span class="time">{{ formatTime(r.createTime) }}</span>
            </div>
            <p class="reply-content">{{ r.content }}</p>
            <div class="reply-actions">
              <el-button text size="small" type="primary" @click="setReplyTarget(r)">回复</el-button>
              <el-button
                v-if="canDeleteReply(r)"
                text
                size="small"
                type="danger"
                @click="handleDeleteReply(d, r)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
        <div v-else class="reply-empty">暂无回复</div>

        <div class="reply-editor">
          <div v-if="replyTarget" class="reply-target">
            回复 @{{ replyTarget.nickname || replyTarget.username }}
            <el-button text size="small" @click="clearReplyTarget">取消</el-button>
          </div>
          <el-input v-model="replyText" type="textarea" :rows="2" placeholder="写下你的回复…" />
          <el-button type="primary" size="small" :loading="replying" @click="handleReply(d)">
            回复
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination">
      <el-pagination
        background
        layout="prev, pager, next, total"
        :total="total"
        :page-size="size"
        :current-page="page"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  listDiscussions,
  createDiscussion,
  deleteDiscussion,
  replyDiscussion,
  deleteReply,
  getDiscussion,
  type Discussion,
  type DiscussionReply,
} from '@/api/discussion'

const userStore = useUserStore()
const route = useRoute()

const discussions = ref<Discussion[]>([])
const loading = ref(false)
const posting = ref(false)
const replying = ref(false)

const newTitle = ref('')
const newContent = ref('')

const page = ref(1)
const size = ref(10)
const total = ref(0)

const expandedId = ref<number | null>(null)
const replyText = ref('')
const replyTarget = ref<DiscussionReply | null>(null)

const currentUser = computed(() => userStore.userInfo)

const courseId = computed<number | null>(() => {
  const q = route.query.courseId
  if (typeof q === 'string' && q !== '') {
    const n = Number(q)
    if (!Number.isNaN(n)) return n
  }
  return userStore.currentCourseId
})

const canPost = computed(() => newTitle.value.trim() !== '' && newContent.value.trim() !== '')

function formatTime(t?: string) {
  if (!t) return ''
  return t.replace('T', ' ').slice(0, 16)
}

async function loadList() {
  loading.value = true
  try {
    const cid = courseId.value ?? undefined
    const res = await listDiscussions({ courseId: cid, page: page.value, size: size.value })
    discussions.value = res.records ?? []
    total.value = res.total ?? 0
  } catch {
    ElMessage.error('加载讨论失败')
    discussions.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function handlePost() {
  if (!canPost.value) return
  posting.value = true
  try {
    await createDiscussion({
      courseId: courseId.value ?? undefined,
      title: newTitle.value.trim(),
      content: newContent.value.trim(),
    })
    ElMessage.success('发布成功')
    newTitle.value = ''
    newContent.value = ''
    page.value = 1
    await loadList()
  } catch {
    ElMessage.error('发布失败')
  } finally {
    posting.value = false
  }
}

function toggleReplies(d: Discussion) {
  expandedId.value = expandedId.value === d.id ? null : d.id
  replyTarget.value = null
  replyText.value = ''
}

function setReplyTarget(r: DiscussionReply) {
  replyTarget.value = r
}

function clearReplyTarget() {
  replyTarget.value = null
}

async function handleReply(d: Discussion) {
  const text = replyText.value.trim()
  if (!text) return
  replying.value = true
  try {
    await replyDiscussion(d.id, {
      content: text,
      replyToId: replyTarget.value?.id,
    })
    ElMessage.success('回复成功')
    replyText.value = ''
    replyTarget.value = null
    await refreshDiscussion(d)
  } catch {
    ElMessage.error('回复失败')
  } finally {
    replying.value = false
  }
}

async function refreshDiscussion(d: Discussion) {
  try {
    const detail = await getDiscussion(d.id)
    const idx = discussions.value.findIndex((x) => x.id === d.id)
    if (idx !== -1) {
      discussions.value[idx] = detail
    }
  } catch {
    // 刷新失败不阻塞主流程
  }
}

function canDelete(d: Discussion) {
  return currentUser.value?.id === d.userId || currentUser.value?.role === 'teacher'
}

function canDeleteReply(r: DiscussionReply) {
  return currentUser.value?.id === r.userId || currentUser.value?.role === 'teacher'
}

async function handleDeleteDiscussion(d: Discussion) {
  try {
    await deleteDiscussion(d.id)
    ElMessage.success('已删除')
    await loadList()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handleDeleteReply(d: Discussion, r: DiscussionReply) {
  try {
    await deleteReply(r.id)
    ElMessage.success('已删除')
    await refreshDiscussion(d)
  } catch {
    ElMessage.error('删除失败')
  }
}

function handlePageChange(p: number) {
  page.value = p
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.discussion-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.page-sub {
  font-size: 13px;
  color: #999;
}

.card-title {
  font-weight: 600;
  color: #333;
}

.post-card {
  margin-bottom: 16px;
}

.discussion-item {
  margin-bottom: 12px;
}

.discussion-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author {
  font-weight: 600;
  color: #333;
}

.time {
  margin-left: auto;
  font-size: 12px;
  color: #aaa;
}

.discussion-title {
  margin: 10px 0 6px;
  font-size: 16px;
  color: #333;
}

.discussion-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
}

.discussion-actions {
  margin-top: 8px;
}

.list-tip {
  padding: 32px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.reply-area {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.reply-item {
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.reply-to {
  font-size: 12px;
  color: #667eea;
}

.reply-content {
  margin: 6px 0;
  font-size: 14px;
  color: #555;
  white-space: pre-wrap;
}

.reply-actions {
  margin-top: 2px;
}

.reply-empty {
  padding: 12px 0;
  color: #bbb;
  font-size: 13px;
}

.reply-editor {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reply-target {
  font-size: 13px;
  color: #667eea;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
