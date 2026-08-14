<template>
  <div
    class="ai-float-btn"
    :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    @mousedown.stop="onDragStart"
    @click.stop="onBtnClick"
  >
    <span class="ai-btn-icon">🤖</span>
    <span class="ai-btn-text">AI伴学</span>
  </div>

  <Transition name="panel">
    <div v-if="visible" class="ai-panel-overlay" @click.self="closePanel">
      <div class="ai-panel" @click.stop>
        <div class="ai-panel-header">
          <h3>AI伴学</h3>
          <button class="ai-panel-close" @click="closePanel">✕</button>
        </div>
        <div class="ai-panel-body" ref="bodyRef">
          <div v-if="loading" class="ai-loading">加载中…</div>
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :class="['ai-msg', msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant']"
          >
            <div class="ai-msg-content" v-if="msg.role === 'user'">{{ msg.content }}</div>
            <div class="ai-msg-content markdown-body" v-else>
              <div v-html="renderMarkdown(msg.content)"></div>
              <div v-if="msg.functions && msg.functions.length" class="ai-fn-list">
                <button
                  v-for="(fn, j) in msg.functions"
                  :key="j"
                  class="ai-fn-card"
                  @click="goFunction(fn)"
                >
                  <span class="ai-fn-name">{{ fn.name }}</span>
                  <span class="ai-fn-desc">{{ fn.description }}</span>
                </button>
              </div>
            </div>
          </div>
          <div v-if="sending" class="ai-typing">思考中…</div>
        </div>
        <div class="ai-panel-footer">
          <textarea
            v-model="input"
            class="ai-input"
            placeholder="输入你的问题…"
            rows="2"
            @keydown.enter.exact.prevent="send"
          ></textarea>
          <button class="ai-send-btn" :disabled="!input.trim() || sending" @click="send">
            发送
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import { useUserStore } from '@/stores/user'
import { sendMessage, getHistory } from '@/api/ai'
import type { AiChatResponse, FunctionEntry } from '@/api/ai'

// ---- state ----
const userStore = useUserStore()
const router = useRouter()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  functions?: FunctionEntry[]
}

const visible = ref(false)
const messages = ref<ChatMessage[]>([])
const input = ref('')
const sending = ref(false)
const loading = ref(false)
const bodyRef = ref<HTMLElement | null>(null)

// --- drag state ---
const pos = ref({ x: window.innerWidth - 92, y: window.innerHeight - 200 })
let dragging = false
let draggingMoved = false
let dragStart = { x: 0, y: 0, elemX: 0, elemY: 0 }

// ---- computed ----
const courseId = computed(() => userStore.currentCourseId)

// ---- markdown ----
marked.setOptions({ breaks: true, gfm: true })
function renderMarkdown(text: string): string {
  return marked.parse(text) as string
}

// ---- lifecycle ----
function onDragStart(e: MouseEvent) {
  if ((e.target as HTMLElement).tagName === 'BUTTON') return
  dragging = true
  draggingMoved = false
  dragStart = {
    x: e.clientX,
    y: e.clientY,
    elemX: pos.value.x,
    elemY: pos.value.y,
  }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  if (!dragging) return
  const dx = Math.abs(e.clientX - dragStart.x)
  const dy = Math.abs(e.clientY - dragStart.y)
  if (dx > 3 || dy > 3) {
    draggingMoved = true
  }
  pos.value.x = Math.min(window.innerWidth - 62, Math.max(0, dragStart.elemX + e.clientX - dragStart.x))
  pos.value.y = Math.min(window.innerHeight - 62, Math.max(0, dragStart.elemY + e.clientY - dragStart.y))
}

function onDragEnd() {
  dragging = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function onBtnClick() {
  if (draggingMoved) {
    draggingMoved = false
    return
  }
  openPanel()
}

// ---- panel ----
async function openPanel() {
  visible.value = true
  if (messages.value.length === 0) {
    loading.value = true
    try {
      const cid = courseId.value
      if (cid) {
        const res = await getHistory(cid)
        const list = (res as any).data ?? (res as any).list ?? res
        if (Array.isArray(list)) {
          messages.value = list.flatMap((item: any) => {
            const rows: { role: 'user' | 'assistant'; content: string }[] = []
            if (item.role === 'user') rows.push({ role: 'user', content: item.content })
            if (item.role === 'assistant') rows.push({ role: 'assistant', content: item.content })
            return rows
          })
        }
      }
    } catch {
      messages.value = []
    } finally {
      loading.value = false
    }
  }
  nextTick(() => scrollToBottom())
}

function closePanel() {
  visible.value = false
}

async function send() {
  const text = input.value.trim()
  if (!text || sending.value) return

  const cid = courseId.value
  if (!cid) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  sending.value = true
  nextTick(() => scrollToBottom())

  try {
    const res = await sendMessage({ courseId: cid, message: text })
    const data: AiChatResponse = (res as any).data ?? res
    messages.value.push({ role: 'assistant', content: data.reply || '', functions: data.functions || [] })
  } catch {
    messages.value.push({ role: 'assistant', content: '抱歉，出了点问题，请稍后重试。' })
  } finally {
    sending.value = false
    nextTick(() => scrollToBottom())
  }
}

function goFunction(fn: FunctionEntry) {
  if (!fn?.path) return
  let target = fn.path
  if (target.includes('{id}')) {
    const cid = courseId.value
    if (!cid) return
    target = target.replace('{id}', String(cid))
  }
  router.push(target)
  closePanel()
}

function scrollToBottom() {
  const el = bodyRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
}
</script>

<style scoped>
.ai-float-btn {
  position: fixed;
  z-index: 9998;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  user-select: none;
  transition: box-shadow 0.2s;
}
.ai-float-btn:hover {
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.6);
}
.ai-float-btn:active {
  cursor: grabbing;
}
.ai-btn-icon {
  font-size: 22px;
  line-height: 1;
}
.ai-btn-text {
  font-size: 9px;
  margin-top: 1px;
  letter-spacing: 1px;
}

.ai-panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.ai-panel {
  width: 420px;
  max-width: 92vw;
  height: 560px;
  max-height: 88vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.ai-panel-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}
.ai-panel-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ai-panel-close:hover {
  background: #e8e8e8;
}

.ai-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}
.ai-loading {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 20px;
}
.ai-msg {
  margin-bottom: 14px;
  display: flex;
}
.ai-msg-user {
  justify-content: flex-end;
}
.ai-msg-assistant {
  justify-content: flex-start;
}
.ai-msg-content {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}
.ai-msg-user .ai-msg-content {
  background: #667eea;
  color: #fff;
  border-bottom-right-radius: 4px;
}
.ai-msg-assistant .ai-msg-content {
  background: #f0f2f5;
  color: #333;
  border-bottom-left-radius: 4px;
}
.markdown-body :deep(p) {
  margin: 0 0 6px;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}
.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 18px;
  margin: 4px 0;
}
.markdown-body :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 2px 5px;
  border-radius: 4px;
  font-size: 13px;
}
.markdown-body :deep(pre) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 10px 14px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 6px 0;
  font-size: 13px;
}
.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}
.ai-typing {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  padding: 8px;
}

.ai-fn-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.ai-fn-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
  padding: 8px 12px;
  border: 1px solid #667eea;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}
.ai-fn-card:hover {
  background: #f0f4ff;
  border-color: #4f6ef7;
}
.ai-fn-name {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}
.ai-fn-desc {
  font-size: 12px;
  color: #888;
}

.ai-panel-footer {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
}
.ai-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
}
.ai-input:focus {
  border-color: #667eea;
}
.ai-send-btn {
  padding: 8px 18px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
}
.ai-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.25s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
</style>
