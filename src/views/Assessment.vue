<template>
  <div class="assessment-page">
    <!-- 顶部进度条 -->
    <div class="assessment-header">
      <div class="header-left">
        <el-button v-if="!embedded" plain @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="assessment-title">{{ nodeName }}</span>
      </div>
      <div class="header-right">
        <el-button plain size="small" @click="showHistory = true" v-if="assessmentRecords.length">历史记录</el-button>
        <span class="question-counter">第 {{ currentQuestionIndex + 1 }} / {{ questions.length }} 题</span>
        <el-progress 
          :percentage="progressPercent" 
          :stroke-width="6" 
          :show-text="false"
          class="progress-bar"
        />
      </div>
    </div>

    <!-- 答题区域 -->
    <div class="assessment-content" v-if="!showResult && currentQuestion">
      <div class="question-card">
        <div class="question-type-badge">
          <el-tag
            :type="questionTagType(currentQuestion.type)"
            size="small"
          >
            {{ questionTypeLabel(currentQuestion.type) }}
          </el-tag>
        </div>

        <h2 class="question-text">{{ currentQuestion.text }}</h2>

        <!-- 选择题选项 -->
        <div class="options-list" v-if="isChoiceType(currentQuestion.type)">
          <div
            v-for="option in currentQuestion.options"
            :key="option.key"
            class="option-item"
            :class="{
              'option-selected': selectedAnswers.includes(option.key),
              'option-correct': showAnalysis && option.key === currentQuestion.correctAnswer,
              'option-wrong': showAnalysis && selectedAnswers.includes(option.key) && option.key !== currentQuestion.correctAnswer
            }"
            @click="handleOptionSelect(option.key)"
          >
            <div class="option-key">
              {{ option.key }}
            </div>
            <div class="option-text">{{ option.text }}</div>
            <el-icon v-if="showAnalysis && option.key === currentQuestion.correctAnswer" class="check-icon" :size="20" color="#67c23a">
              <CircleCheckFilled />
            </el-icon>
            <el-icon v-if="showAnalysis && selectedAnswers.includes(option.key) && option.key !== currentQuestion.correctAnswer" class="cross-icon" :size="20" color="#f56c6c">
              <CircleCloseFilled />
            </el-icon>
          </div>
        </div>

        <!-- 填空题输入 -->
        <div v-else-if="currentQuestion.type === 'fill'" class="text-answer-area">
          <div class="text-answer-label">请输入答案：</div>
          <el-input
            v-model="textAnswer"
            placeholder="请填写空缺处的内容"
            size="large"
            clearable
          />
        </div>

        <!-- 问答 / 编程题多行输入 -->
        <div v-else-if="currentQuestion.type === 'qa'" class="text-answer-area">
          <div class="text-answer-label">请输入你的回答（支持多行代码）：</div>
          <el-input
            v-model="textAnswer"
            type="textarea"
            :rows="8"
            resize="vertical"
            placeholder="请在此输入答案或代码…"
            class="code-textarea"
          />
        </div>

        <div class="question-actions">
          <el-button
            v-if="currentQuestionIndex > 0"
            @click="handlePrevious"
          >
            上一题
          </el-button>
          <el-button
            v-if="currentQuestionIndex < questions.length - 1"
            type="primary"
            @click="handleNext"
            :disabled="!canAnswer"
          >
            下一题
          </el-button>
          <el-button
            v-if="currentQuestionIndex === questions.length - 1"
            type="success"
            @click="handleSubmit"
            :disabled="!canAnswer"
            :loading="submitting"
          >
            提交答案
          </el-button>
        </div>
      </div>
    </div>

    <!-- 无题目空态 -->
    <div class="assessment-empty" v-else-if="!showResult && questions.length === 0">
      <el-empty description="该知识点下暂无测评题目" />
    </div>

    <!-- 结果页面 -->
    <div class="assessment-result" v-else>
      <div class="result-card">
        <div class="result-header">
          <el-icon class="result-icon" :size="64" color="#67c23a">
            <SuccessFilled />
          </el-icon>
          <h2 class="result-title">答题完成！</h2>
        </div>
        
        <div class="result-score">
          <div class="score-circle">
            <svg viewBox="0 0 100 100" class="score-svg">
              <circle 
                class="score-circle-bg" 
                cx="50" 
                cy="50" 
                r="45"
              />
              <circle 
                class="score-circle-progress" 
                cx="50" 
                cy="50" 
                r="45"
                :style="{ strokeDasharray: circumference, strokeDashoffset: strokeDashoffset }"
              />
            </svg>
            <div class="score-text">
              <span class="score-number">{{ score }}</span>
              <span class="score-total">/ {{ totalScore }}</span>
            </div>
          </div>
          <div class="score-info">
            <div class="info-item">
              <span class="info-label">正确率</span>
              <span class="info-value accuracy">{{ accuracyRate }}%</span>
            </div>
            <div class="info-item">
              <span class="info-label">答题数</span>
              <span class="info-value">{{ correctCount }}/{{ objectiveTotal }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">用时</span>
              <span class="info-value">{{ timeSpent }}</span>
            </div>
          </div>
        </div>

        <div class="result-actions">
          <el-button @click="handleRetry">重新答题</el-button>
          <el-button type="primary" @click="handleViewAnalysis">查看解析</el-button>
        </div>
      </div>

      <!-- 错题解析 -->
      <div v-if="showAnalysis" class="analysis-section">
        <h3 class="analysis-title">错题解析</h3>
        <div v-for="(question, idx) in wrongQuestions" :key="idx" class="analysis-card">
          <div class="analysis-question-header">
            <span class="analysis-question-type">
              {{ questionTypeLabel(question.type) }}
            </span>
            <span class="analysis-question-text">第 {{ idx + 1 }} 题</span>
          </div>
          <p class="analysis-question-text-full">{{ question.text }}</p>
          <div class="analysis-result">
            <div class="result-row">
              <span class="result-label">你的答案：</span>
              <span class="result-value wrong">{{ formatAnswer(question, question.userAnswer!) }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">正确答案：</span>
              <span class="result-value correct">{{ formatAnswer(question, question.correctAnswer) }}</span>
            </div>
          </div>
          <div class="analysis-explanation">
            <div class="explanation-label">
              <el-icon><Document /></el-icon>
              解析：
            </div>
            <p class="explanation-content">{{ question.explanation }}</p>
          </div>
        </div>
      </div>

      <!-- 主观题（问答/编程）：无法自动判分，展示参考答案 -->
      <div v-if="subjectiveQuestions.length" class="analysis-section subjective-section">
        <h3 class="analysis-title">主观题（待教师评分）</h3>
        <div
          v-for="(question, idx) in subjectiveQuestions"
          :key="'s' + idx"
          class="analysis-card"
        >
          <div class="analysis-question-header">
            <span class="analysis-question-type">{{ questionTypeLabel(question.type) }}</span>
            <span class="analysis-question-text">第 {{ idx + 1 }} 题</span>
          </div>
          <p class="analysis-question-text-full">{{ question.text }}</p>
          <div class="analysis-result">
            <div class="result-row">
              <span class="result-label">你的答案：</span>
              <span class="result-value">{{ formatAnswer(question, question.userAnswer || '未作答') }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">参考答案：</span>
              <span class="result-value correct">{{ formatAnswer(question, question.correctAnswer) }}</span>
            </div>
          </div>
          <div class="analysis-explanation">
            <div class="explanation-label">
              <el-icon><Document /></el-icon>
              解析：
            </div>
            <p class="explanation-content">{{ question.explanation }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 历史记录弹窗 -->
  <el-dialog v-model="showHistory" :title="viewingRecord ? '答题详情' : '测评历史记录'" width="700px" destroy-on-close @closed="viewingRecord = null">
    <!-- 记录列表 -->
    <div v-if="!viewingRecord">
      <div v-if="assessmentRecords.length === 0" class="history-empty">暂无记录</div>
      <div v-else class="history-list">
        <div
          v-for="record in assessmentRecords"
          :key="record.id"
          class="history-item"
          @click="viewingRecord = record"
        >
          <div class="history-item-header">
            <span class="history-date">{{ record.date }}</span>
            <el-tag :type="record.accuracyRate >= 80 ? 'success' : record.accuracyRate >= 60 ? 'warning' : 'danger'" size="small">
              {{ record.accuracyRate }}%
            </el-tag>
          </div>
          <div class="history-item-body">
            <span>正确 {{ record.correctCount }}/{{ record.totalQuestions }}</span>
            <span>得分 {{ record.score }}/{{ record.totalScore }}</span>
            <span>用时 {{ record.timeSpent }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情视图 -->
    <div v-else>
      <div class="detail-header">
        <el-button plain size="small" @click="viewingRecord = null">
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        <span class="detail-date">{{ viewingRecord.date }}</span>
      </div>
      <div class="detail-summary">
        <span>正确率 {{ viewingRecord.accuracyRate }}%</span>
        <span>得分 {{ viewingRecord.score }}/{{ viewingRecord.totalScore }}</span>
        <span>用时 {{ viewingRecord.timeSpent }}</span>
      </div>
      <div class="detail-questions" v-if="viewingRecord.questions?.length">
        <div
          v-for="(q, idx) in viewingRecord.questions"
          :key="idx"
          class="detail-question-item"
          :class="{
            'detail-correct': recordQuestionStatus(q) === 'correct',
            'detail-wrong': recordQuestionStatus(q) === 'wrong',
          }"
        >
          <div class="detail-q-header">
            <span class="detail-q-num">{{ idx + 1 }}.</span>
            <el-tag :type="questionTagType(q.type)" size="small">
              {{ questionTypeLabel(q.type) }}
            </el-tag>
            <el-tag :type="recordQuestionStatus(q) === 'correct' ? 'success' : recordQuestionStatus(q) === 'pending' ? 'info' : 'danger'" size="small">
              {{ recordQuestionStatus(q) === 'correct' ? '正确' : recordQuestionStatus(q) === 'pending' ? '待评分' : '错误' }}
            </el-tag>
          </div>
          <p class="detail-q-text">{{ q.text }}</p>
          <div class="detail-result-row">
            <span class="detail-label">你的答案：</span>
            <span :class="recordQuestionStatus(q) === 'correct' ? 'text-correct' : 'text-wrong'">
              {{ formatSnapshotAnswer(q, q.userAnswer!) }}
            </span>
          </div>
          <div class="detail-result-row" v-if="recordQuestionStatus(q) !== 'correct'">
            <span class="detail-label">{{ q.type === 'qa' ? '参考答案：' : '正确答案：' }}</span>
            <span class="text-correct">{{ formatSnapshotAnswer(q, q.correctAnswer) }}</span>
          </div>
        </div>
      </div>
      <div v-else class="history-empty">该记录暂无题目快照（可能是旧版本数据）</div>
    </div>

    <template #footer>
      <template v-if="!viewingRecord">
        <el-button @click="showHistory = false">关闭</el-button>
        <el-button type="danger" plain @click="clearHistory" v-if="assessmentRecords.length">清空记录</el-button>
      </template>
      <template v-else>
        <el-button @click="viewingRecord = null">返回列表</el-button>
        <el-button @click="showHistory = false">关闭</el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, CircleCheckFilled, CircleCloseFilled, Document, SuccessFilled,
} from '@element-plus/icons-vue'
import { getQuestions, submitAnswers } from '@/api/question'
import { recordStudyTime } from '@/api/study'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'

type QuestionType = 'single' | 'multiple' | 'fill' | 'qa'

interface Question {
  id: string
  type: QuestionType
  text: string
  options: { key: string; text: string }[]
  correctAnswer: string | string[]
  explanation: string
  userAnswer?: string | string[]
  knowledgePointId?: string
}

interface AssessmentRecord {
  id: string
  title: string
  date: string
  totalQuestions: number
  correctCount: number
  score: number
  totalScore: number
  accuracyRate: number
  timeSpent: string
  questions: QuestionSnapshot[]
}

interface QuestionSnapshot {
  id: string
  type: QuestionType
  text: string
  options: { key: string; text: string }[]
  correctAnswer: string | string[]
  userAnswer?: string | string[]
  explanation: string
  knowledgePointId?: string
}

// --- 题型工具 ---
const TYPE_LABELS: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  fill: '填空题',
  qa: '问答题/编程题',
}

const questionTypeLabel = (t: string) => TYPE_LABELS[t] ?? t

const questionTagType = (t: string) => {
  if (t === 'single') return 'primary'
  if (t === 'multiple') return 'warning'
  if (t === 'fill') return 'success'
  return 'info'
}

const isChoiceType = (t: string) => t === 'single' || t === 'multiple'

/** 文本答案归一化：忽略大小写、首尾空格与连续空白 */
const normalizeText = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** 填空题判分：按 | 拆分逐空比较 */
function isFillCorrect(q: Question | QuestionSnapshot): boolean {
  if (!q.userAnswer) return false
  const user = Array.isArray(q.userAnswer) ? q.userAnswer.join('|') : q.userAnswer
  const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer.join('|') : q.correctAnswer
  const u = user.split('|').map(normalizeText)
  const c = correct.split('|').map(normalizeText)
  return u.length === c.length && u.every((v, i) => v === c[i])
}

// localStorage key 前缀
const HISTORY_KEY_PREFIX = 'assessment_history_'

const props = defineProps<{
  questions?: Question[]
  title?: string
  embedded?: boolean
}>()

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const userId = computed(() => userStore.userInfo?.id ?? 0)
const courseId = computed(() => userStore.currentCourseId ?? 0)

// 当前题目是否来自后端真实题库（决定提交走后端 API 判分入库）
const fromBackend = ref(false)

const nodeName = ref(props.title || (route.query.nodeName as string) || '知识点测评')
const nodeId = ref(route.query.nodeId as string || '')

// 测评题目默认空，仅由外部传入或后端题库加载；不再内置写死的 mock 题
const questions = ref<Question[]>([])

// --- 数据提取工具函数 ---
/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i] as T
    a[i] = a[j] as T
    a[j] = tmp
  }
  return a
}

/** 格式转换：后端 QuestionItem / 知识图谱数据结构 → Question */
function convertQuestion(q: any): Question {
  let type: QuestionType = 'single'
  if (q.type === 'multiple') type = 'multiple'
  else if (q.type === 'fill') type = 'fill'
  else if (q.type === 'qa') type = 'qa'

  let options: { key: string; text: string }[] = []
  const raw = typeof q.options === 'string' ? q.options : (q.options ? JSON.stringify(q.options) : '')
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      options = parsed.map((text: string, i: number) => {
        const clean = String(text).replace(/^[A-Z][.、，)）]\s*/, '').trim()
        return { key: String.fromCharCode(65 + i), text: clean }
      })
    }
  } catch { /* options 解析失败时保持空数组 */ }
  if (options.length === 0 && raw) {
    options = raw.split(/[;,]/).filter(Boolean).map((text: string, i: number) => ({
      key: String.fromCharCode(65 + i),
      text: text.replace(/^[A-Z][.、，)）]\s*/, '').trim(),
    }))
  }

  return {
    id: String(q.id),
    type,
    text: q.content || '',
    options,
    correctAnswer: q.answer || '',
    explanation: q.analysis || '',
    knowledgePointId: q.knowledgePointId || '',
  }
}


const currentQuestionIndex = ref(0)
const selectedAnswers = ref<string[]>([])
// 填空 / 问答（编程）题的文本答案
const textAnswer = ref('')
const showResult = ref(false)
const showAnalysis = ref(false)
const showHistory = ref(false)
const viewingRecord = ref<AssessmentRecord | null>(null)
const assessmentRecords = ref<AssessmentRecord[]>([])
const submitting = ref(false)
const startTime = ref(Date.now())
const timeSpent = ref('0 秒')

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

const progressPercent = computed(() => {
  return ((currentQuestionIndex.value + 1) / questions.value.length) * 100
})

/** 客观题总数（问答/编程题为主观题，不参与自动判分） */
const objectiveTotal = computed(() => questions.value.filter(q => q.type !== 'qa').length)

/** 当前题是否已作答 */
const canAnswer = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  if (isChoiceType(q.type)) return selectedAnswers.value.length > 0
  return textAnswer.value.trim().length > 0
})

const score = ref(0)
const totalScore = computed(() => objectiveTotal.value * 3)
const correctCount = ref(0)
const accuracyRate = computed(() => {
  if (objectiveTotal.value === 0) return 0
  return Math.round((correctCount.value / objectiveTotal.value) * 100)
})

const wrongQuestions = computed(() => {
  return questions.value.filter(q => {
    if (q.type === 'qa') return false
    if (q.type === 'fill') return !isFillCorrect(q)
    if (q.type === 'single') {
      return q.userAnswer !== q.correctAnswer
    } else {
      const userAns = Array.isArray(q.userAnswer) ? q.userAnswer : [q.userAnswer]
      const correctAns = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
      return JSON.stringify(userAns.sort()) !== JSON.stringify(correctAns.sort())
    }
  })
})

/** 主观题（问答/编程）：展示作答与参考答案，不自动判分 */
const subjectiveQuestions = computed(() => questions.value.filter(q => q.type === 'qa'))

const circumference = computed(() => 2 * Math.PI * 45)
const strokeDashoffset = computed(() => {
  const percentage = score.value / totalScore.value
  return circumference.value * (1 - percentage)
})

const handleOptionSelect = (key: string) => {
  if (showAnalysis.value) return
  
  const question = currentQuestion.value
  if (question?.type === 'single') {
    selectedAnswers.value = [key]
  } else {
    const index = selectedAnswers.value.indexOf(key)
    if (index > -1) {
      selectedAnswers.value = selectedAnswers.value.filter(k => k !== key)
    } else {
      selectedAnswers.value.push(key)
    }
  }
}

/** 恢复某题已填写的答案到当前作答状态 */
const restoreAnswer = (question?: Question) => {
  if (!question) return
  if (isChoiceType(question.type)) {
    const userAnswer = question.userAnswer
    selectedAnswers.value = userAnswer
      ? (Array.isArray(userAnswer) ? userAnswer : [userAnswer])
      : []
    textAnswer.value = ''
  } else {
    textAnswer.value = question.userAnswer && !Array.isArray(question.userAnswer)
      ? question.userAnswer
      : ''
    selectedAnswers.value = []
  }
}

/** 保存当前题的作答 */
const saveCurrentAnswer = () => {
  const question = currentQuestion.value
  if (!question) return
  if (isChoiceType(question.type)) {
    question.userAnswer = question.type === 'single'
      ? selectedAnswers.value[0]
      : selectedAnswers.value
  } else {
    question.userAnswer = textAnswer.value
  }
}

const handlePrevious = () => {
  if (currentQuestionIndex.value > 0) {
    saveCurrentAnswer()
    currentQuestionIndex.value--
    restoreAnswer(questions.value[currentQuestionIndex.value])
  }
}

const handleNext = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    saveCurrentAnswer()
    currentQuestionIndex.value++
    restoreAnswer(questions.value[currentQuestionIndex.value])
  }
}

const handleSubmit = async () => {
  submitting.value = true

  // 保存当前答案
  saveCurrentAnswer()

  timeSpent.value = formatTimeSpent(Date.now() - startTime.value)

  // 后端真实题 → 交由后端判分并写入行为记录
  if (fromBackend.value) {
    try {
      const result = await submitAnswers({
        userId: userId.value,
        courseId: courseId.value,
        answers: questions.value.map((q) => ({
          questionId: Number(q.id),
          knowledgePointId: q.knowledgePointId || '',
          answer: Array.isArray(q.userAnswer)
            ? (q.userAnswer as string[]).join(',')
            : ((q.userAnswer as string) || ''),
        })),
      })
      const answerMap = new Map<number, { correct: string; analysis: string }>()
      ;(result.items || []).forEach(item => {
        answerMap.set(item.questionId, { correct: item.correctAnswer, analysis: item.analysis })
      })
      // 回填正确答案与解析，供错题解析/历史快照展示
      questions.value.forEach(q => {
        const back = answerMap.get(Number(q.id))
        if (back) {
          q.correctAnswer = back.correct
          q.explanation = back.analysis
        }
      })
      correctCount.value = result.correctCount ?? 0
      score.value = correctCount.value * 3
      // 功能1：答题提交成功后广播掌握度刷新事件，掌握度页/雷达图自动拉取最新数据，无需手动刷新
      window.dispatchEvent(new CustomEvent('mastery-refresh'))
      // 功能3：上报本次答题学习时长（累计秒），落库 user_behavior action=study_time
      const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startTime.value) / 1000))
      recordStudyTime(elapsedSeconds, nodeId.value || undefined).catch(() => {
        // 时长上报失败不影响答题流程
      })
    } catch (err: any) {
      ElMessage.error(err?.message || err?.response?.data?.msg || '答案提交失败，请重试')
      submitting.value = false
      return
    }
  } else {
    // 本地 mock 判分（外部传入题目 / 默认题保留原逻辑）
    let correct = 0
    questions.value.forEach(q => {
      if (q.type === 'qa') return // 主观题不参与自动判分
      if (q.type === 'fill') {
        if (isFillCorrect(q)) correct++
        return
      }
      if (q.type === 'single') {
        if (q.userAnswer === q.correctAnswer) correct++
      } else {
        const userAns = Array.isArray(q.userAnswer) ? q.userAnswer : [q.userAnswer]
        const correctAns = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
        if (JSON.stringify(userAns.sort()) === JSON.stringify(correctAns.sort())) correct++
      }
    })
    correctCount.value = correct
    score.value = correct * 3
  }

  showResult.value = true
  submitting.value = false
  saveRecord()
}

const formatTimeSpent = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes > 0) {
    return `${minutes}分${remainingSeconds}秒`
  }
  return `${seconds}秒`
}

const handleRetry = () => {
  questions.value.forEach(q => {
    q.userAnswer = undefined
  })
  currentQuestionIndex.value = 0
  selectedAnswers.value = []
  textAnswer.value = ''
  showResult.value = false
  showAnalysis.value = false
  startTime.value = Date.now()
}

const handleViewAnalysis = () => {
  showAnalysis.value = true
}

/** 将答案字母转为 "A. 选项内容" 格式；填空/问答直接展示文本 */
function formatAnswer(question: Question, answer: string | string[]): string {
  if (!answer) return ''
  if (!isChoiceType(question.type)) {
    return Array.isArray(answer) ? answer.join('、') : answer
  }
  const keys = Array.isArray(answer) ? answer : [answer]
  return keys.map(key => {
    const opt = question.options.find(o => o.key === key)
    return opt ? `${key}. ${opt.text}` : key
  }).join('，')
}

/** 将答案字母转为 "A. 选项内容" 格式（快照版）；填空/问答直接展示文本 */
function formatSnapshotAnswer(q: QuestionSnapshot, answer: string | string[]): string {
  if (!answer) return '未作答'
  if (!isChoiceType(q.type)) {
    return Array.isArray(answer) ? answer.join('、') : answer
  }
  const keys = Array.isArray(answer) ? answer : [answer]
  return keys.map(key => {
    const opt = q.options.find(o => o.key === key)
    return opt ? `${key}. ${opt.text}` : key
  }).join('，')
}

/** 记录中某题的判分状态：correct / wrong / pending（主观题待评分） */
function recordQuestionStatus(q: QuestionSnapshot): 'correct' | 'wrong' | 'pending' {
  if (q.type === 'qa') return 'pending'
  if (!q.userAnswer) return 'wrong'
  if (q.type === 'fill') return isFillCorrect(q) ? 'correct' : 'wrong'
  if (q.type === 'single') return q.userAnswer === q.correctAnswer ? 'correct' : 'wrong'
  const userAns = Array.isArray(q.userAnswer) ? q.userAnswer : [q.userAnswer]
  const correctAns = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
  return JSON.stringify(userAns.sort()) === JSON.stringify(correctAns.sort()) ? 'correct' : 'wrong'
}

const handleBack = () => {
  router.back()
}

const handleBackToGraph = () => {
  const courseStore = useCourseStore()
  const course = courseStore.getCurrentCourse()
  if (course) {
    router.push({
      path: `/course/${course.id}`,
      query: { tab: 'graph', highlight: nodeId.value }
    })
  } else {
    router.back()
  }
}

// --- 测评记录持久化 ---
function getStorageKey(): string {
  return HISTORY_KEY_PREFIX + (nodeId.value || props.title || nodeName.value)
}

function loadRecords(): AssessmentRecord[] {
  try {
    const raw = localStorage.getItem(getStorageKey())
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecord(): void {
  const record: AssessmentRecord = {
    id: Date.now().toString(36),
    title: nodeName.value,
    date: new Date().toLocaleString('zh-CN'),
    totalQuestions: questions.value.length,
    correctCount: correctCount.value,
    score: score.value,
    totalScore: totalScore.value,
    accuracyRate: accuracyRate.value,
    timeSpent: timeSpent.value,
    questions: questions.value.map(q => ({
      id: q.id,
      type: q.type,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: q.userAnswer,
      explanation: q.explanation,
      knowledgePointId: q.knowledgePointId,
    })),
  }
  const records = loadRecords()
  records.unshift(record)
  // 最多保留 20 条
  if (records.length > 20) records.length = 20
  localStorage.setItem(getStorageKey(), JSON.stringify(records))
  assessmentRecords.value = records
}

function clearHistory(): void {
  localStorage.removeItem(getStorageKey())
  assessmentRecords.value = []
  showHistory.value = false
}

onMounted(() => {
  assessmentRecords.value = loadRecords()
  // 如果外部传入了题目，直接使用
  if (props.questions && props.questions.length > 0) {
    questions.value = props.questions
    fromBackend.value = false
    return
  }
  loadQuestionsForNode()
})

// 监听外部题目 prop 变化（切换章节时）
watch(() => props.questions, (newQuestions) => {
  if (newQuestions && newQuestions.length > 0) {
    questions.value = newQuestions
    fromBackend.value = false
    resetAssessmentState()
  }
})

// 监听路由 query 变化（切换知识点时重新加载题目与历史记录）
watch(
  () => route.query.nodeId,
  (newNodeId) => {
    if (!newNodeId || newNodeId === nodeId.value) return
    nodeId.value = newNodeId as string
    nodeName.value = (route.query.nodeName as string) || props.title || '知识点测评'
    assessmentRecords.value = loadRecords()
    resetAssessmentState()
    loadQuestionsForNode()
  },
)

function resetAssessmentState() {
  currentQuestionIndex.value = 0
  selectedAnswers.value = []
  textAnswer.value = ''
  showResult.value = false
  showAnalysis.value = false
  startTime.value = Date.now()
  score.value = 0
  correctCount.value = 0
}

async function loadQuestionsForNode() {
  if (!nodeId.value) {
    ElMessage.warning('未指定知识点')
    questions.value = []
    fromBackend.value = false
    return
  }
  if (!courseId.value || !userId.value) {
    ElMessage.warning('未获取到课程/用户信息，无法加载测评题目')
    questions.value = []
    fromBackend.value = false
    return
  }
  try {
    const list = await getQuestions(courseId.value, userId.value, nodeId.value)
    if (!list || list.length === 0) {
      ElMessage.warning('该知识点下暂无测评题目')
      questions.value = []
      fromBackend.value = false
      return
    }
    const selected = shuffle(list).slice(0, 10)
    questions.value = selected.map(convertQuestion)
    fromBackend.value = true
  } catch (err: any) {
    ElMessage.error(err?.message || err?.response?.data?.msg || '加载测评题目失败')
    questions.value = []
    fromBackend.value = false
  }
}
</script>

<style scoped lang="css">
.assessment-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.assessment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.assessment-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.question-counter {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.progress-bar {
  width: 200px;
}

.assessment-content {
  max-width: 800px;
  margin: 0 auto;
}

.question-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.question-type-badge {
  margin-bottom: 16px;
}

.question-text {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.option-item:hover {
  border-color: #409eff;
  background: #f5f7fa;
}

.option-selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.option-correct {
  border-color: #67c23a;
  background: #f0f9ff;
}

.option-wrong {
  border-color: #f56c6c;
  background: #fef0f0;
}

.option-key {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 16px;
  flex-shrink: 0;
}

.option-selected .option-key {
  background: #409eff;
  color: white;
}

.option-correct .option-key {
  background: #67c23a;
  color: white;
}

.option-wrong .option-key {
  background: #f56c6c;
  color: white;
}

.option-text {
  flex: 1;
  color: #303133;
  font-size: 15px;
}

.check-icon,
.cross-icon {
  margin-left: auto;
  flex-shrink: 0;
}

.question-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 填空 / 问答文本作答区 */
.text-answer-area {
  margin-bottom: 32px;
}

.text-answer-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.code-textarea :deep(textarea) {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.subjective-section {
  margin-top: 24px;
}

/* 结果页面样式 */
.assessment-result {
  max-width: 800px;
  margin: 0 auto;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.result-header {
  text-align: center;
  margin-bottom: 32px;
}

.result-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-top: 16px;
}

.result-score {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 48px;
  margin-bottom: 32px;
}

.score-circle {
  position: relative;
  width: 160px;
  height: 160px;
}

.score-svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.score-circle-bg {
  fill: none;
  stroke: #ebeef5;
  stroke-width: 10;
}

.score-circle-progress {
  fill: none;
  stroke: #67c23a;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-number {
  font-size: 48px;
  font-weight: 700;
  color: #67c23a;
}

.score-total {
  font-size: 20px;
  color: #909399;
}

.score-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  min-width: 160px;
}

.info-label {
  font-size: 14px;
  color: #606266;
}

.info-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.info-value.accuracy {
  color: #67c23a;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 错题解析 */
.analysis-section {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.analysis-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 24px;
}

.analysis-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  background: #fafafa;
}

.analysis-question-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.analysis-question-type {
  font-size: 12px;
  color: #fff;
  background: #909399;
  padding: 2px 8px;
  border-radius: 4px;
}

.analysis-question-text {
  font-size: 13px;
  color: #606266;
}

.analysis-question-text-full {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  line-height: 1.6;
}

.analysis-result {
  margin-bottom: 16px;
}

.result-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.result-label {
  font-size: 14px;
  color: #606266;
}

.result-value {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
}

.result-value.wrong {
  background: #fef0f0;
  color: #f56c6c;
}

.result-value.correct {
  background: #f0f9ff;
  color: #67c23a;
}

.analysis-explanation {
  background: white;
  border-radius: 6px;
  padding: 16px;
}

.explanation-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.explanation-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
  margin: 0;
}

/* 历史记录弹窗 */
.history-empty {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.history-item:hover {
  border-color: #409eff;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-date {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.history-item-body {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #606266;
}

/* 历史详情视图 */
.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.detail-date {
  font-size: 14px;
  color: #303133;
  font-weight: 600;
}

.detail-summary {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
}

.detail-questions {
  max-height: 400px;
  overflow-y: auto;
}

.detail-question-item {
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  border-left: 4px solid #67c23a;
}

.detail-question-item.detail-wrong {
  border-left-color: #f56c6c;
}

.detail-q-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-q-num {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.detail-q-text {
  font-size: 14px;
  color: #303133;
  margin-bottom: 12px;
  line-height: 1.6;
}

.detail-result-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
  font-size: 13px;
}

.detail-label {
  color: #909399;
  white-space: nowrap;
}

.text-correct {
  color: #67c23a;
  font-weight: 500;
}

.text-wrong {
  color: #f56c6c;
  font-weight: 500;
}
</style>
