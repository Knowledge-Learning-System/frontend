<template>
  <div class="assessment-page">
    <!-- 顶部进度条 -->
    <div class="assessment-header">
      <div class="header-left">
        <el-button plain @click="handleBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="assessment-title">{{ nodeName }}</span>
      </div>
      <div class="header-right">
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
            :type="currentQuestion.type === 'single' ? 'primary' : 'warning'" 
            size="small"
          >
            {{ currentQuestion.type === 'single' ? '单选题' : '多选题' }}
          </el-tag>
        </div>
        
        <h2 class="question-text">{{ currentQuestion.text }}</h2>
        
        <div class="options-list">
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
            :disabled="selectedAnswers.length === 0"
          >
            下一题
          </el-button>
          <el-button 
            v-if="currentQuestionIndex === questions.length - 1"
            type="success" 
            @click="handleSubmit"
            :disabled="selectedAnswers.length === 0"
            :loading="submitting"
          >
            提交答案
          </el-button>
        </div>
      </div>
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
              <span class="info-value">{{ correctCount }}/{{ questions.length }}</span>
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
          <el-button type="success" @click="handleBackToGraph">返回图谱</el-button>
        </div>
      </div>

      <!-- 错题解析 -->
      <div v-if="showAnalysis" class="analysis-section">
        <h3 class="analysis-title">错题解析</h3>
        <div 
          v-for="(question, idx) in wrongQuestions" 
          :key="idx"
          class="analysis-card"
        >
          <div class="analysis-question-header">
            <span class="analysis-question-type">
              {{ question.type === 'single' ? '单选题' : '多选题' }}
            </span>
            <span class="analysis-question-text">第 {{ idx + 1 }} 题</span>
          </div>
          <p class="analysis-question-text-full">{{ question.text }}</p>
          <div class="analysis-result">
            <div class="result-row">
              <span class="result-label">你的答案：</span>
              <span class="result-value wrong">{{ Array.isArray(question.userAnswer) ? question.userAnswer.join(', ') : question.userAnswer }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">正确答案：</span>
              <span class="result-value correct">{{ Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer }}</span>
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, CircleCheckFilled, CircleCloseFilled, Document, SuccessFilled,
} from '@element-plus/icons-vue'
import { MOCK_CHAPTERS } from '@/api/knowledgeGraph'
import { useCourseStore } from '@/stores/course'

interface Question {
  id: string
  type: 'single' | 'multiple'
  text: string
  options: { key: string; text: string }[]
  correctAnswer: string | string[]
  explanation: string
  userAnswer?: string | string[]
}

const route = useRoute()
const router = useRouter()

const nodeName = ref(route.query.nodeName as string || '知识点测评')
const nodeId = ref(route.query.nodeId as string || '')

// 默认硬编码 mock 题（fallback：当 nodeId 未匹配到数据时使用）
const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    type: 'single',
    text: '软件工程的核心目标是？',
    options: [
      { key: 'A', text: '编写高质量的代码' },
      { key: 'B', text: '在预算和时间内交付满足需求的软件' },
      { key: 'C', text: '使用最新的编程技术' },
      { key: 'D', text: '减少开发人员数量' },
    ],
    correctAnswer: 'B',
    explanation: '软件工程的核心目标是在给定的预算和时间约束下，交付满足用户需求的、高质量的软件产品。选项 B 最全面地描述了这一目标。',
  },
  {
    id: 'q2',
    type: 'single',
    text: '以下哪个不是软件测试的基本原则？',
    options: [
      { key: 'A', text: '测试显示缺陷的存在' },
      { key: 'B', text: '穷尽测试是不可能的' },
      { key: 'C', text: '测试可以证明软件没有缺陷' },
      { key: 'D', text: '缺陷具有群集性' },
    ],
    correctAnswer: 'C',
    explanation: '测试只能证明缺陷的存在，而不能证明软件没有缺陷。这是软件测试的基本原则之一。',
  },
  {
    id: 'q3',
    type: 'multiple',
    text: '敏捷开发方法的特点包括？（多选）',
    options: [
      { key: 'A', text: '迭代式开发' },
      { key: 'B', text: '客户需求优先' },
      { key: 'C', text: '严格的文档要求' },
      { key: 'D', text: '快速响应变化' },
    ],
    correctAnswer: ['A', 'B', 'D'],
    explanation: '敏捷开发强调迭代式开发、客户需求优先、快速响应变化，而不强调严格的文档要求。敏捷宣言明确指出"工作的软件高于详尽的文档"。',
  },
  {
    id: 'q4',
    type: 'single',
    text: 'JUnit 主要用于哪种编程语言的单元测试？',
    options: [
      { key: 'A', text: 'Python' },
      { key: 'B', text: 'Java' },
      { key: 'C', text: 'JavaScript' },
      { key: 'D', text: 'C++' },
    ],
    correctAnswer: 'B',
    explanation: 'JUnit 是 Java 语言的单元测试框架，广泛用于 Java 项目的单元测试实践。',
  },
  {
    id: 'q5',
    type: 'multiple',
    text: '以下哪些属于软件质量特性？（多选）',
    options: [
      { key: 'A', text: '功能性' },
      { key: 'B', text: '可靠性' },
      { key: 'C', text: '可维护性' },
      { key: 'D', text: '代码行数' },
    ],
    correctAnswer: ['A', 'B', 'C'],
    explanation: '软件质量特性包括功能性、可靠性、可维护性、效率、可移植性等。代码行数是规模度量，不是质量特性。',
  },
]

const questions = ref<Question[]>([...DEFAULT_QUESTIONS])

// --- 数据提取工具函数 ---
/** 递归查找匹配 nodeId 的 SubTopicVO */
function findSubTopic(nodes: any[], targetId: string): any | null {
  for (const node of nodes) {
    if (node.id === targetId) return node
    if (node.knowledgePoints) {
      const found = findSubTopic(node.knowledgePoints, targetId)
      if (found) return found
    }
    if (node.children) {
      const found = findSubTopic(node.children, targetId)
      if (found) return found
    }
  }
  return null
}

/** 递归收集节点及其所有子孙节点中的 questions */
function collectQuestions(node: any): any[] {
  let all: any[] = []
  if (node.questions && node.questions.length > 0) {
    all = all.concat(node.questions)
  }
  if (node.knowledgePoints) {
    for (const kp of node.knowledgePoints) {
      all = all.concat(collectQuestions(kp))
    }
  }
  if (node.children) {
    for (const child of node.children) {
      all = all.concat(collectQuestions(child))
    }
  }
  return all
}

/** Fisher-Yates 洗牌 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 格式转换：knowledgeGraph.ts 数据结构 → Question */
function convertQuestion(q: any): Question {
  let type: 'single' | 'multiple' = 'single'
  if (q.type === 'multiple') type = 'multiple'

  let options: { key: string; text: string }[] = []
  try {
    const rawOptions: string[] = typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    options = rawOptions.map((opt: string) => {
      const match = opt.match(/^([A-Z])\.\s*(.+)/)
      if (match) {
        return { key: match[1], text: match[2] }
      }
      return { key: '', text: opt }
    })
  } catch { /* options 解析失败时保持空数组 */ }

  return {
    id: String(q.id),
    type,
    text: q.content || '',
    options,
    correctAnswer: q.answer || '',
    explanation: q.analysis || '',
  }
}


const currentQuestionIndex = ref(0)
const selectedAnswers = ref<string[]>([])
const showResult = ref(false)
const showAnalysis = ref(false)
const submitting = ref(false)
const startTime = ref(Date.now())
const timeSpent = ref('0 秒')

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])

const progressPercent = computed(() => {
  return ((currentQuestionIndex.value + 1) / questions.value.length) * 100
})

const score = ref(0)
const totalScore = computed(() => questions.value.length * 5)
const correctCount = ref(0)
const accuracyRate = computed(() => {
  return Math.round((correctCount.value / questions.value.length) * 100)
})

const wrongQuestions = computed(() => {
  return questions.value.filter(q => {
    if (q.type === 'single') {
      return q.userAnswer !== q.correctAnswer
    } else {
      const userAns = Array.isArray(q.userAnswer) ? q.userAnswer : [q.userAnswer]
      const correctAns = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
      return JSON.stringify(userAns.sort()) !== JSON.stringify(correctAns.sort())
    }
  })
})

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

const handlePrevious = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    const question = questions.value[currentQuestionIndex.value]
    if (question) {
      const userAnswer = question.userAnswer
      selectedAnswers.value = userAnswer 
        ? (Array.isArray(userAnswer) ? userAnswer : [userAnswer])
        : []
    }
  }
}

const handleNext = () => {
  if (currentQuestionIndex.value < questions.value.length - 1 && currentQuestion.value) {
    const currentQ = questions.value[currentQuestionIndex.value]
    if (currentQ) {
      currentQ.userAnswer = currentQuestion.value.type === 'single' 
        ? selectedAnswers.value[0] 
        : selectedAnswers.value
    }
    currentQuestionIndex.value++
    const question = questions.value[currentQuestionIndex.value]
    if (question) {
      const userAnswer = question.userAnswer
      selectedAnswers.value = userAnswer 
        ? (Array.isArray(userAnswer) ? userAnswer : [userAnswer])
        : []
    }
  }
}

const handleSubmit = async () => {
  submitting.value = true
  
  // 保存当前答案
  const currentQ = questions.value[currentQuestionIndex.value]
  if (currentQ && currentQuestion.value) {
    currentQ.userAnswer = currentQuestion.value.type === 'single' 
      ? selectedAnswers.value[0] 
      : selectedAnswers.value
  }
  
  // 计算得分
  let correct = 0
  questions.value.forEach(q => {
    if (q.type === 'single') {
      if (q.userAnswer === q.correctAnswer) correct++
    } else {
      const userAns = Array.isArray(q.userAnswer) ? q.userAnswer : [q.userAnswer]
      const correctAns = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer]
      if (JSON.stringify(userAns.sort()) === JSON.stringify(correctAns.sort())) correct++
    }
  })
  
  correctCount.value = correct
  score.value = correct * 5
  timeSpent.value = formatTimeSpent(Date.now() - startTime.value)
  
  setTimeout(() => {
    showResult.value = true
    submitting.value = false
  }, 500)
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
  showResult.value = false
  showAnalysis.value = false
  startTime.value = Date.now()
}

const handleViewAnalysis = () => {
  showAnalysis.value = true
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

onMounted(() => {
  if (!nodeId.value) {
    ElMessage.warning('未指定知识点，将使用默认题目')
    return
  }

  const target = findSubTopic(MOCK_CHAPTERS as any[], nodeId.value)
  if (!target) {
    ElMessage.warning('未匹配到对应知识点，将使用默认题目')
    return
  }

  const allRaw = collectQuestions(target)
  if (allRaw.length === 0) {
    ElMessage.warning('该知识点下暂无可测评题目，使用默认题目')
    return
  }

  const shuffled = shuffle(allRaw)
  const selected = shuffled.slice(0, 10)
  questions.value = selected.map(convertQuestion)
})
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
</style>
