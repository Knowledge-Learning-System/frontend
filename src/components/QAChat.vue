<template>
  <div class="qa-chat">
    <!-- 消息列表 -->
    <div class="qa-messages" ref="messagesContainer" @scroll="onScroll">
      <!-- 清空按钮 -->
      <div v-if="messages.length > 0" class="qa-toolbar">
        <el-button text size="small" type="danger" @click="clearHistory">
          <el-icon><Delete /></el-icon>
          <span>清空对话</span>
        </el-button>
      </div>

      <!-- 欢迎消息 -->
      <div v-if="messages.length === 0" class="qa-welcome">
        <div class="qa-welcome-icon">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            <path d="M8 14c1.5 2 4 2 4 2s2.5 0 4-2" stroke-linecap="round"/>
          </svg>
        </div>
        <h3>课程智能问答</h3>
        <p>基于知识图谱的智能助手，可以回答课程知识点相关的问题</p>
        <div class="qa-suggestions">
          <span
            v-for="q in suggestions"
            :key="q"
            class="qa-suggestion-item"
            @click="sendSuggestion(q)"
          >{{ q }}</span>
        </div>
      </div>

      <!-- 消息气泡 -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="qa-message"
        :class="'qa-message--' + msg.role"
      >
        <div class="qa-message-avatar">
          <template v-if="msg.role === 'user'">
            <el-icon :size="20"><UserFilled /></el-icon>
          </template>
          <template v-else>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              <path d="M8 14c1.5 2 4 2 4 2s2.5 0 4-2" stroke-linecap="round"/>
            </svg>
          </template>
        </div>
        <div class="qa-message-body">
          <div class="qa-message-content" v-html="renderMarkdown(msg.content)"></div>

          <!-- 引用来源标签 -->
          <div v-if="msg.role === 'assistant' && msg.sources && msg.sources.length > 0" class="qa-sources">
            <span class="qa-sources-label">引用来源：</span>
            <span
              v-for="src in msg.sources"
              :key="src.id"
              class="qa-source-tag"
              :title="'点击查看 ' + src.name + ' 章节'"
            >
              {{ src.name }}<em> · {{ src.chapter }}</em>
            </span>
          </div>

          <div class="qa-message-time">{{ formatTime(msg.timestamp) }}</div>
        </div>
      </div>

      <!-- 加载指示器（分步） -->
      <div v-if="loading" class="qa-message qa-message--assistant">
        <div class="qa-message-avatar">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/>
            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            <path d="M8 14c1.5 2 4 2 4 2s2.5 0 4-2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="qa-message-body">
          <div class="qa-loading-steps">
            <div class="qa-loading-step">
              <span class="qa-loading-dot" :class="{ done: loadingStep !== 'retrieving' }">
                <template v-if="loadingStep !== 'retrieving'">&#10003;</template>
              </span>
              <span class="qa-loading-text" :class="{ done: loadingStep !== 'retrieving' }">检索知识点</span>
            </div>
            <div class="qa-loading-step" v-if="loadingStep === 'generating'">
              <span class="qa-loading-dot"></span>
              <span class="qa-loading-text">正在生成回答</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 回到底部按钮 -->
      <transition name="el-fade-in">
        <div v-if="showScrollBtn" class="qa-scroll-bottom" @click="scrollToBottom">
          <el-icon><ArrowDown /></el-icon>
        </div>
      </transition>
    </div>

    <!-- 输入区域 -->
    <div class="qa-input-area">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="1"
        :autosize="{ minRows: 1, maxRows: 4 }"
        placeholder="输入您的问题，按 Enter 发送，Shift+Enter 换行"
        :disabled="loading"
        @keydown.enter.exact.prevent="handleSend"
        resize="none"
      />
      <el-button
        type="primary"
        :disabled="!inputText.trim() || loading"
        :loading="loading"
        @click="handleSend"
        class="qa-send-btn"
      >
        <template #default>
          <span v-if="!loading">发送</span>
        </template>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { UserFilled, ArrowDown, Delete } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { askQuestion, type QASource, type ChatMessage as ApiChatMessage } from '@/api/qa'

const props = defineProps<{
  courseId?: number
}>()

const STORAGE_KEY = props.courseId ? `qa_history_${props.courseId}` : 'qa_history'

// ── 本地消息类型（扩展 sources） ──
interface UIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  sources?: QASource[]
}

const messages = ref<UIMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const loadingStep = ref<'retrieving' | 'generating'>('retrieving')
const messagesContainer = ref<HTMLElement | null>(null)
const showScrollBtn = ref(false)

let msgIdCounter = 0

const suggestions = [
  '什么是事务的ACID特性？',
  '数据库设计有哪些范式？',
  '大数据有什么特征？',
  'SQL查询优化有哪些方法？',
]

/** 生成消息 ID */
function genId(): string {
  return `msg_${Date.now()}_${++msgIdCounter}`
}

/** 从 localStorage 加载历史消息 */
function loadHistory(): UIMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (m: any) =>
          m && typeof m.id === 'string' &&
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          typeof m.timestamp === 'number'
      )
    }
    return []
  } catch {
    return []
  }
}

/** 保存消息到 localStorage */
function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
  } catch {
    // localStorage 写入失败（如配额满），静默忽略
  }
}

/** 清空对话历史 */
async function clearHistory() {
  try {
    await ElMessageBox.confirm('确定要清空当前对话记录吗？', '清空对话', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    messages.value = []
    localStorage.removeItem(STORAGE_KEY)
    msgIdCounter = 0
  } catch {
    // 用户取消
  }
}

// 消息变化时自动保存
watch(messages, () => saveHistory(), { deep: true })

// 组件挂载时恢复历史
onMounted(() => {
  const history = loadHistory()
  if (history.length > 0) {
    messages.value = history
    const maxCounter = history.reduce((max, m) => {
      const match = m.id?.match(/_(\d+)$/)
      return match ? Math.max(max, parseInt(match[1], 10)) : max
    }, 0)
    msgIdCounter = maxCounter
    nextTick(() => scrollToBottom())
  }
})

/** 发送问题 */
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  // 添加用户消息
  messages.value.push({
    id: genId(),
    role: 'user',
    content: text,
    timestamp: Date.now(),
  })
  inputText.value = ''

  loading.value = true
  loadingStep.value = 'retrieving'
  await nextTick()
  scrollToBottom()

  try {
    // 检索/生成分步反馈：约 1.2s 后认为检索阶段结束进入生成阶段
    const stepTimer = setTimeout(() => {
      loadingStep.value = 'generating'
    }, 1200)

    // 构建对话历史（最近 10 条，不含当前正在等待回答的用户消息）
    const history: ApiChatMessage[] = messages.value
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(0, -1)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }))

    // 调用 GraphRAG 问答 API
    const res = await askQuestion(text, history, props.courseId)
    clearTimeout(stepTimer)

    messages.value.push({
      id: genId(),
      role: 'assistant',
      content: res.answer,
      timestamp: Date.now(),
      sources: res.sources,
    })
  } catch {
    clearTimeout(stepTimer)
    messages.value.push({
      id: genId(),
      role: 'assistant',
      content: '抱歉，系统暂时无法处理您的请求，请稍后重试。',
      timestamp: Date.now(),
    })
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

/** 点击建议问题 */
function sendSuggestion(question: string) {
  inputText.value = question
  handleSend()
}

/** 滚动到底部 */
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

/** 监听滚动，控制回到底部按钮 */
function onScroll() {
  if (!messagesContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  showScrollBtn.value = scrollHeight - scrollTop - clientHeight > 100
}

/** 格式化时间 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 简易 Markdown 渲染 */
function renderMarkdown(text: string): string {
  let html = escapeHtml(text)

  // 代码块 ```...```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre><code class="language-${lang || ''}">${code.trim()}</code></pre>`
  })

  // 行内代码 `...`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // 标题
  html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>')

  // 粗体 **...**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 引用块 > ...
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // 分割线 ---
  html = html.replace(/^---$/gm, '<hr>')

  // 无序列表
  html = html.replace(/^[*-] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')

  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
    if (match.includes('<ul>')) return match
    return `<ol>${match}</ol>`
  })
  html = html.replace(/<ul><ol>/g, '<ol>').replace(/<\/ol><\/ul>/g, '</ol>')

  // 段落
  html = html.replace(/\n\n+/g, '</p><p>')
  html = '<p>' + html + '</p>'
  html = html.replace(/<p><(h[234]|pre|ul|ol|hr|li|blockquote)/g, '<$1')
  html = html.replace(/<\/(h[234]|pre|ul|ol|hr|li|blockquote)><\/p>/g, '</$1>')
  html = html.replace(/<p>\s*<\/p>/g, '')
  html = html.replace(/<li><p>(.*?)<\/p><\/li>/g, '<li>$1</li>')

  return html
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
</script>

<style scoped>
.qa-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

/* ── 消息列表 ── */
.qa-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  position: relative;
  scroll-behavior: smooth;
}

.qa-messages::-webkit-scrollbar {
  width: 6px;
}
.qa-messages::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

/* ── 工具栏 ── */
.qa-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

/* ── 欢迎界面 ── */
.qa-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}
.qa-welcome-icon {
  color: #a0c4ff;
  margin-bottom: 16px;
}
.qa-welcome h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #303133;
}
.qa-welcome p {
  margin: 0 0 24px;
  color: #909399;
  font-size: 14px;
  line-height: 1.6;
}
.qa-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-width: 480px;
}
.qa-suggestion-item {
  display: inline-block;
  padding: 6px 14px;
  background: #f0f5ff;
  color: #409eff;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  border: 1px solid transparent;
}
.qa-suggestion-item:hover {
  background: #409eff;
  color: #fff;
}

/* ── 消息气泡 ── */
.qa-message {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  animation: qaFadeIn 0.3s ease;
}
@keyframes qaFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.qa-message--user {
  flex-direction: row-reverse;
}
.qa-message-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
}
.qa-message--user .qa-message-avatar {
  background: #409eff;
}
.qa-message--assistant .qa-message-avatar {
  background: #67c23a;
}
.qa-message-body {
  max-width: 75%;
  min-width: 0;
}
.qa-message-content {
  padding: 10px 14px;
  border-radius: 12px;
  line-height: 1.7;
  font-size: 14px;
  color: #303133;
  word-break: break-word;
}
.qa-message--user .qa-message-content {
  background: #409eff;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.qa-message--assistant .qa-message-content {
  background: #f5f7fa;
  border-bottom-left-radius: 4px;
}

/* ── 引用来源 ── */
.qa-sources {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.qa-sources-label {
  font-size: 12px;
  color: #909399;
}
.qa-source-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 10px;
  background: #ecf5ff;
  color: #409eff;
  border-radius: 12px;
  font-size: 12px;
  cursor: default;
  border: 1px solid #d9ecff;
  transition: background 0.2s;
}
.qa-source-tag:hover {
  background: #d9ecff;
}
.qa-source-tag em {
  font-style: normal;
  color: #909399;
  font-size: 11px;
}

/* ── 分步加载 ── */
.qa-loading-steps {
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.qa-loading-step {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qa-loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  flex-shrink: 0;
  animation: qaPulse 1.2s infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
  line-height: 1;
}
.qa-loading-dot.done {
  background: #67c23a;
  animation: none;
}
.qa-loading-text {
  font-size: 13px;
  color: #606266;
}
.qa-loading-text.done {
  color: #909399;
}
@keyframes qaPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.qa-message-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
  padding: 0 4px;
}
.qa-message--user .qa-message-time {
  text-align: right;
}

/* ── 消息内容 Markdown 样式 ── */
.qa-message-content :deep(h2) {
  font-size: 16px;
  margin: 8px 0 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ebeef5;
}
.qa-message-content :deep(h3) {
  font-size: 15px;
  margin: 8px 0 4px;
}
.qa-message-content :deep(h4) {
  font-size: 14px;
  margin: 6px 0 4px;
}
.qa-message-content :deep(p) {
  margin: 4px 0;
}
.qa-message-content :deep(strong) {
  font-weight: 600;
}
.qa-message-content :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}
.qa-message--user .qa-message-content :deep(code) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.qa-message-content :deep(pre) {
  background: #f0f2f5;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
}
.qa-message-content :deep(pre code) {
  background: none;
  padding: 0;
}
.qa-message-content :deep(ul),
.qa-message-content :deep(ol) {
  padding-left: 20px;
  margin: 4px 0;
}
.qa-message-content :deep(li) {
  margin: 2px 0;
}
.qa-message-content :deep(hr) {
  border: none;
  border-top: 1px solid #ebeef5;
  margin: 12px 0;
}
.qa-message-content :deep(blockquote) {
  border-left: 3px solid #dcdfe6;
  padding: 4px 12px;
  margin: 8px 0;
  color: #909399;
}
.qa-message-content :deep(a) {
  color: #409eff;
}

/* ── 回到底部 ── */
.qa-scroll-bottom {
  position: sticky;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #606266;
  transition: box-shadow 0.2s;
}
.qa-scroll-bottom:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
}

/* ── 输入区域 ── */
.qa-input-area {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
  background: #fafafa;
  align-items: flex-end;
}
.qa-input-area :deep(.el-textarea__inner) {
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
}
.qa-send-btn {
  flex-shrink: 0;
  height: 36px;
  border-radius: 8px;
}
</style>
