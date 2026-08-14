<template>
  <div class="course-detail">
    <div class="course-topbar">
      <h1 class="course-title">{{ courseName }}</h1>
      <el-button
        v-if="!isCourseEnrolled"
        type="primary"
        size="small"
        :loading="enrolling"
        @click="handleEnrollCourse"
      >
        加入课表
      </el-button>
      <el-button
        v-else
        type="danger"
        size="small"
        :loading="unenrolling"
        @click="handleUnenrollCourse"
      >
        移除课表
      </el-button>
    </div>
    <div class="main-layout" v-loading="pageLoading">
      <!-- 左侧：章节列表 -->
      <aside class="chapter-sidebar">
        <h3 class="sidebar-title">章节目录</h3>
        <div v-if="loadError" class="error-hint">
          <p>加载失败，请检查网络或重新登录</p>
          <el-button type="primary" size="small" @click="fetchChapters">重试</el-button>
        </div>
        <div v-else-if="!subTopics.length" class="empty-hint">暂无章节</div>
        <div v-else class="chapter-list">
          <div
            v-for="st in subTopics"
            :key="st.id"
            class="chapter-group"
          >
            <div
              class="chapter-header"
              :class="{ expanded: expandedChapters.has(st.id) }"
              @click="toggleChapter(st.id)"
            >
              <span class="arrow-icon">{{ expandedChapters.has(st.id) ? '▼' : '▶' }}</span>
              <span class="chapter-name">{{ st.name }}</span>
              <span class="chapter-count">({{ countAllKps(st.knowledgePoints) }})</span>
            </div>
            <div v-show="expandedChapters.has(st.id)" class="kp-tree">
              <template v-for="kp in st.knowledgePoints" :key="kp.id">
                <KpTreeNode
                  :node="kp"
                  :selected-id="selectedKpId"
                  @select="selectKp"
                />
              </template>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧：资源面板 -->
      <main class="resource-panel">
        <template v-if="!selectedKp && !selectedSubTopic">
          <div class="panel-placeholder">
            <el-icon :size="48" color="#c0c4cc"><Reading /></el-icon>
            <p>请从左侧选择一个章节或知识点</p>
          </div>
        </template>
        <template v-else-if="!selectedKp && selectedSubTopic">
          <div class="kp-header">
            <h2>{{ selectedSubTopic.name }}</h2>
            <p v-if="selectedSubTopic.description" class="kp-desc">{{ selectedSubTopic.description }}</p>
          </div>

          <el-tabs v-model="chapterActiveTab" class="resource-tabs">
            <el-tab-pane label="测评" name="assessment">
              <div class="embedded-page">
                <template v-if="chapterAssessmentQuestions.length">
                  <AssessmentPage
                    :questions="chapterAssessmentQuestions"
                    :title="selectedSubTopic.name"
                    embedded
                  />
                </template>
                <el-empty v-else description="该章节下暂无测评题目" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
        <template v-else>
          <div class="kp-header">
            <h2>{{ selectedKp?.name }}</h2>
            <p v-if="selectedKp?.description" class="kp-desc">{{ selectedKp?.description }}</p>
          </div>

          <el-tabs v-model="activeTab" class="resource-tabs" lazy @tab-click="handleTabClick">
            <!-- 知识图谱 -->
            <el-tab-pane label="知识图谱" name="graph">
              <div class="graph-tab-container" v-loading="graphLoading">
                <KnowledgeGraphChart
                  v-if="graphData.nodes.length > 0"
                  ref="graphRef"
                  :data="graphData"
                  @node-click="handleGraphNodeClick"
                />
                <el-empty v-else-if="!graphLoading" description="暂无知识图谱数据" />
              </div>
            </el-tab-pane>

            <!-- 视频 -->
            <el-tab-pane v-if="selectedKp?.videos?.length" label="视频" name="videos">
              <div class="resource-grid">
                <el-card v-for="v in selectedKp?.videos" :key="v.id" class="resource-card video-card">
                  <div class="video-preview" @click="playVideo(v)">
                    <el-icon :size="36"><VideoPlay /></el-icon>
                  </div>
                  <div class="card-body">
                    <span class="title">{{ v.title }}</span>
                    <span class="meta" v-if="v.duration">{{ formatDuration(v.duration) }}</span>
                  </div>
                </el-card>
              </div>
            </el-tab-pane>

            <!-- 课件 -->
            <el-tab-pane v-if="selectedKp?.coursewares?.length" label="课件" name="courseware">
              <div class="resource-grid">
                <el-card v-for="c in selectedKp.coursewares" :key="c.id" class="resource-card">
                  <div class="courseware-icon" @click="openCourseware(c)">
                    <el-icon :size="36"><Document /></el-icon>
                  </div>
                  <div class="card-body">
                    <span class="title">{{ c.title }}</span>
                    <el-tag size="small" type="info">{{ c.fileType }}</el-tag>
                  </div>
                </el-card>
              </div>
            </el-tab-pane>

            <!-- 笔记 -->
            <el-tab-pane label="笔记" name="notes">
              <div v-loading="notesLoading">
                <el-empty v-if="!kpNotes.length" description="暂无笔记" />
                <div v-else class="kp-notes-list">
                  <div
                    v-for="note in kpNotes"
                    :key="note.id"
                    class="kp-note-card"
                  >
                    <div class="kp-note-card-header">
                      <el-tag
                        size="small"
                        type="info"
                        class="note-timestamp-tag"
                        @click="seekToNoteVideo(note)"
                      >
                        视频 {{ formatTime(note.timestamp) }}
                      </el-tag>
                      <div class="kp-note-card-actions">
                        <el-button text size="small" @click="editKpNote(note)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button text size="small" type="danger" @click="handleDeleteKpNote(note.id)">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>
                    <div class="kp-note-card-content">{{ note.content }}</div>
                    <div class="kp-note-card-footer">
                      <span class="kp-note-meta">{{ note.createTime?.slice(0, 10) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 测试 -->
            <el-tab-pane v-if="selectedKp?.questions?.length" label="测试" name="quiz">
              <!-- 批次列表 -->
              <div v-if="showQuizList" class="quiz-batch-list">
                <div class="quiz-batch-list-header">
                  <h3>{{ selectedKp?.name || '测试' }}</h3>
                  <span class="quiz-batch-list-total">共 {{ allQuizQuestions.length }} 题，分 {{ totalQuizBatches }} 批</span>
                </div>
                <div class="quiz-batch-cards">
                  <div
                    v-for="(batch, idx) in quizBatches"
                    :key="idx"
                    class="quiz-batch-card"
                  >
                    <div class="batch-main">
                      <div class="batch-header">
                        <span class="batch-label">测试{{ batchNumberText(idx + 1) }}</span>
                        <span class="batch-count">{{ batch.length }} 题</span>
                      </div>
                      <div class="batch-status-row">
                        <template v-if="latestBatchScore(idx)">
                          <span class="batch-status done">第{{ quizBatchScores[idx].length }}次</span>
                          <span class="batch-score">{{ latestBatchScore(idx)!.correctCount }}/{{ latestBatchScore(idx)!.totalQuestions }} · {{ Math.round((latestBatchScore(idx)!.correctCount / latestBatchScore(idx)!.totalQuestions) * 100) }}%</span>
                        </template>
                        <span v-else class="batch-status pending">未完成</span>
                      </div>
                    </div>
                    <div class="batch-actions">
                      <el-button
                        v-if="quizBatchScores[idx].length > 0"
                        size="small"
                        @click="showBatchHistory(idx)"
                      >查看历史</el-button>
                      <el-button
                        type="primary"
                        size="small"
                        @click="startQuizBatch(idx)"
                      >
                        {{ latestBatchScore(idx) ? '重新测试' : '开始测试' }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 答题阶段 -->
              <div v-else-if="!quizSubmitted && questions.length > 0" class="quiz-container">
                <div class="quiz-nav">
                  <span class="quiz-back-link" @click="goToQuizList">
                    <el-icon><ArrowLeft /></el-icon> 返回列表
                  </span>
                  <span class="quiz-nav-title">{{ selectedKp?.name || '测试' }} · {{ quizBatchLabel }}</span>
                  <div class="quiz-nav-right">
                    <span class="quiz-counter">第 {{ currentQIndex + 1 }} / {{ questions.length }} 题</span>
                    <el-progress :percentage="quizProgress" :stroke-width="6" :show-text="false" class="quiz-progress-bar" />
                  </div>
                </div>

                <div class="quiz-question-card">
                  <div class="quiz-question-type">
                    <el-tag :type="(currentQ?.type === 'single' || currentQ?.type === 'judge') ? 'primary' : 'warning'" size="small">
                      {{ (currentQ?.type === 'single' || currentQ?.type === 'judge') ? '单选题' : '多选题' }}
                    </el-tag>
                  </div>
                  <h2 class="quiz-question-text">{{ currentQ?.content }}</h2>

                  <div class="quiz-option-list">
                    <div
                      v-for="opt in parseOptions(currentQ?.options || '')"
                      :key="opt.key"
                      class="quiz-option-item"
                      :class="{ 'option-selected': selectedAnswer === opt.key }"
                      @click="selectQuizOption(opt.key)"
                    >
                      <div class="quiz-option-key">{{ opt.key }}</div>
                      <div class="quiz-option-text">{{ opt.text }}</div>
                    </div>
                  </div>

                  <div class="quiz-nav-buttons">
                    <el-button v-if="currentQIndex > 0" @click="handleQuizPrev">上一题</el-button>
                    <el-button
                      v-if="currentQIndex < questions.length - 1"
                      type="primary"
                      @click="handleQuizNext"
                      :disabled="!selectedAnswer"
                    >下一题</el-button>
                    <el-button
                      v-if="currentQIndex === questions.length - 1"
                      type="success"
                      @click="submitQuiz"
                      :disabled="!selectedAnswer"
                      :loading="submitLoading"
                    >提交答案</el-button>
                  </div>
                </div>
              </div>

              <!-- 结果阶段 -->
              <div v-else-if="quizSubmitted && quizScore" class="quiz-result-container">
                <div class="quiz-result-card">
                  <div class="quiz-result-header">
                    <el-icon class="quiz-result-icon" :size="64" color="#67c23a">
                      <SuccessFilled />
                    </el-icon>
                    <h2 class="quiz-result-title">答题完成！</h2>
                  </div>

                  <div class="quiz-result-score">
                    <div class="score-ring">
                      <svg viewBox="0 0 100 100" class="score-ring-svg">
                        <circle class="score-ring-bg" cx="50" cy="50" r="45" />
                        <circle
                          class="score-ring-progress"
                          cx="50" cy="50" r="45"
                          :style="{ strokeDasharray: quizCircumference, strokeDashoffset: quizStrokeDashoffset }"
                        />
                      </svg>
                      <div class="score-ring-text">
                        <span class="score-ring-number">{{ (quizScore.correctCount ?? 0) * 3 }}</span>
                        <span class="score-ring-total">/ {{ (quizScore.totalQuestions ?? 0) * 3 }}</span>
                      </div>
                    </div>
                    <div class="score-summary">
                      <div class="score-summary-item">
                        <span class="score-summary-label">正确率</span>
                        <span class="score-summary-value accuracy">{{ quizAccuracy }}%</span>
                      </div>
                      <div class="score-summary-item">
                        <span class="score-summary-label">答题数</span>
                        <span class="score-summary-value">{{ quizScore.correctCount ?? 0 }}/{{ quizScore.totalQuestions ?? 0 }}</span>
                      </div>
                      <div class="score-summary-item">
                        <span class="score-summary-label">用时</span>
                        <span class="score-summary-value">{{ quizTimeSpent }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="quiz-result-actions">
                    <el-button @click="goToQuizList">返回列表</el-button>
                    <el-button @click="restartQuiz">重新答题</el-button>
                    <el-button type="primary" @click="showQuizAnalysis = true" v-if="!showQuizAnalysis">查看解析</el-button>
                  </div>
                </div>

                <!-- 解析区 -->
                <div v-if="showQuizAnalysis" class="quiz-analysis-section">
                  <h3 class="quiz-analysis-title">答题解析</h3>
                  <div v-for="item in quizReviewItems" :key="item.questionId" class="quiz-analysis-card">
                    <div class="quiz-analysis-question-header">
                      <span class="quiz-analysis-question-text">{{ item.content }}</span>
                    </div>
                    <div class="quiz-analysis-options">
                      <div v-for="opt in parseOptions(item.options)" :key="opt.key" class="quiz-analysis-opt">
                        <div
                          class="quiz-option-key"
                          :class="{
                            'opt-correct': opt.key === item.correctAnswer,
                            'opt-wrong': opt.key === item.userAnswer && !item.isCorrect
                          }"
                        >{{ opt.key }}</div>
                        <span
                          class="quiz-analysis-opt-text"
                          :class="{
                            'text-correct': opt.key === item.correctAnswer,
                            'text-wrong': opt.key === item.userAnswer && !item.isCorrect
                          }"
                        >{{ opt.text }}</span>
                        <el-icon v-if="opt.key === item.correctAnswer" class="opt-icon-correct" :size="18"><CircleCheckFilled /></el-icon>
                        <el-icon v-if="opt.key === item.userAnswer && !item.isCorrect" class="opt-icon-wrong" :size="18"><CircleCloseFilled /></el-icon>
                      </div>
                    </div>
                    <div class="quiz-analysis-explanation">
                      <el-icon><Document /></el-icon>
                      <span>解析：</span>
                      <span>{{ item.analysis || '暂无' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <el-empty v-if="!showQuizList && !quizSubmitted && !questions.length" description="暂无测试题" />

              <!-- 历史记录弹窗 -->
              <el-dialog
                :model-value="historyDialogBatchIdx !== null"
                title="测试历史记录"
                width="480px"
                @update:model-value="(val: boolean) => { if (!val) historyDialogBatchIdx = null }"
              >
                <template v-if="historyDialogBatchIdx !== null">
                  <h4 class="history-title">测试{{ batchNumberText(historyDialogBatchIdx + 1) }}</h4>
                  <div
                    v-for="(record, ri) in [...quizBatchScores[historyDialogBatchIdx]].reverse()"
                    :key="ri"
                    class="history-item"
                  >
                    <span class="history-index">第{{ quizBatchScores[historyDialogBatchIdx].length - ri }}次</span>
                    <span class="history-score">{{ record.correctCount }}/{{ record.totalQuestions }} 正确</span>
                    <span class="history-pct">{{ Math.round((record.correctCount / record.totalQuestions) * 100) }}%</span>
                    <span class="history-score-val">{{ record.correctCount * 3 }} 分</span>
                  </div>
                  <el-empty v-if="quizBatchScores[historyDialogBatchIdx].length === 0" description="暂无记录" :image-size="40" />
                </template>
              </el-dialog>
            </el-tab-pane>

            <!-- 推荐 -->
            <el-tab-pane label="推荐" name="recommend">
              <div class="embedded-page">
                <RecommendationsPage embedded />
              </div>
            </el-tab-pane>

            <!-- 诊断 -->
            <el-tab-pane label="诊断" name="diagnosis">
              <div class="embedded-page">
                <RadarChartPage embedded />
              </div>
            </el-tab-pane>

            <!-- 作业 -->
            <el-tab-pane label="作业" name="homework">
              <div class="embedded-homework">
                <el-empty description="作业功能开发中" />
              </div>
            </el-tab-pane>
          </el-tabs>

          <!-- 视频播放器对话框 -->
          <el-dialog
            v-model="videoDialogVisible"
            width="90%"
            top="5vh"
            :close-on-click-modal="false"
            @close="handleVideoDialogClose"
          >
            <template #header>
              <div class="video-dialog-header">
                <span>{{ currentVideo?.title || '视频播放' }}</span>
                <div class="video-dialog-header-actions">
                  <el-button
                    :type="showNotePanel && activePanel === 'note' ? 'primary' : 'default'"
                    size="small"
                    @click="openVideoPanel('note')"
                  >
                    <el-icon><Notebook /></el-icon>
                    <span>笔记</span>
                  </el-button>
                  <el-button
                    :type="showNotePanel && activePanel === 'discussion' ? 'primary' : 'default'"
                    size="small"
                    @click="openVideoPanel('discussion')"
                  >
                    <el-icon><ChatDotRound /></el-icon>
                    <span>讨论</span>
                  </el-button>
                </div>
              </div>
            </template>
            <div class="video-dialog-content">
              <VideoPlayer
                v-if="videoDialogVisible && currentVideo"
                ref="videoPlayerRef"
                :video-id="currentVideo.id"
                :video-src="getVideoSrc(currentVideo)"
                :knowledge-point-id="selectedKpId"
                :course-id="courseId"
                :show-note-panel="showNotePanel"
                :active-panel="activePanel"
                @toggle-note-panel="toggleNotePanel"
                @update:active-panel="activePanel = $event"
              />
            </div>
          </el-dialog>

          <!-- 编辑笔记弹窗 -->
          <el-dialog v-model="noteEditDialogVisible" title="编辑笔记" width="480px">
            <el-input v-model="noteEditContent" type="textarea" :rows="5" />
            <template #footer>
              <el-button @click="noteEditDialogVisible = false">取消</el-button>
              <el-button type="primary" @click="saveKpNote" :loading="noteSaveLoading">保存</el-button>
            </template>
          </el-dialog>


        </template>
      </main>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { VideoPlay, Document, Reading, CircleCheckFilled, CircleCloseFilled, SuccessFilled, Edit, Delete, Notebook, ChatDotRound, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getKnowledgeGraph, getChapterStructure } from '@/api/knowledgeGraph'
import { getQuestions, submitAnswers, type QuestionItem, type SubmitAnswerResult } from '@/api/question'
import type { SubTopicVO, KnowledgePointTreeNode, KnowledgeNode, KnowledgeLink, GraphData, AnswerDetail } from '@/types/knowledgeGraph'
import type { VideoResource, CoursewareResource } from '@/api/resource'
import { trackCoursewareAccess } from '@/api/resource'
import { getNotes, deleteNote, updateNote, getKnowledgePointNotes, type Note } from '@/api/note'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'
import KpTreeNode from '@/components/KpTreeNode.vue'
import KnowledgeGraphChart from '@/components/knowledge-graph/KnowledgeGraphChart.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import RecommendationsPage from './Recommendations.vue'
import AssessmentPage from './Assessment.vue'
import RadarChartPage from './RadarChart.vue'

const route = useRoute()
const courseId = computed(() => Number(route.params.courseId))
const courseStore = useCourseStore()

const subTopics = ref<SubTopicVO[]>([])
const pageLoading = ref(false)
const loadError = ref(false)
const expandedChapters = ref<Set<string>>(new Set())
const selectedKp = ref<KnowledgePointTreeNode | null>(null)
const selectedKpId = ref<string>('')
const selectedSubTopic = ref<SubTopicVO | null>(null)
const activeTab = ref('videos')
const chapterActiveTab = ref('assessment')

const chapterAssessmentQuestions = ref<AssessmentQuestion[]>([])

// AssessmentPage 需要的题目格式
interface AssessmentQuestion {
  id: string
  type: 'single' | 'multiple'
  text: string
  options: { key: string; text: string }[]
  correctAnswer: string | string[]
  explanation: string
  userAnswer?: string | string[]
}

// 测试相关
const questions = ref<QuestionItem[]>([])
const allQuizQuestions = ref<QuestionItem[]>([])
const quizBatches = ref<QuestionItem[][]>([])
const currentQuizBatch = ref(0)
const totalQuizBatches = ref(0)
const userAnswers = ref<Record<number, string>>({})
const quizScore = ref<SubmitAnswerResult | null>(null)
const quizSubmitted = ref(false)
const submitLoading = ref(false)
const quizDebug = ref('')
const currentQIndex = ref(0)
const selectedAnswer = ref('')
const quizStartTime = ref(0)
const quizTimeSpent = ref('')
const showQuizAnalysis = ref(false)
const showQuizList = ref(true)
const quizBatchScores = ref<(SubmitAnswerResult[])[]>([])
const historyDialogBatchIdx = ref<number | null>(null)

// 知识点测试记录持久化
const KP_QUIZ_KEY_PREFIX = 'kp_quiz_scores_'

function getKpQuizKey(): string {
  return KP_QUIZ_KEY_PREFIX + (selectedKpId.value || '')
}

function saveKpQuizScores(): void {
  if (!selectedKpId.value) return
  localStorage.setItem(getKpQuizKey(), JSON.stringify(quizBatchScores.value))
}

function loadKpQuizScores(): (SubmitAnswerResult[])[] {
  try {
    const raw = localStorage.getItem(getKpQuizKey())
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function batchNumberText(n: number): string {
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  if (n <= 10) return digits[n]
  return String(n)
}

function latestBatchScore(batchIdx: number): SubmitAnswerResult | null {
  const arr = quizBatchScores.value[batchIdx]
  return arr && arr.length > 0 ? arr[arr.length - 1] : null
}

function showBatchHistory(batchIdx: number) {
  historyDialogBatchIdx.value = batchIdx
}

const quizBatchLabel = computed(() => {
  if (totalQuizBatches.value <= 1) return ''
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  const n = currentQuizBatch.value + 1
  if (n <= 10) return `测试${digits[n]}`
  if (n < 20) return `测试十${digits[n - 10]}`
  return `测试${n}`
})

// 笔记
const kpNotes = ref<Note[]>([])
const notesLoading = ref(false)
const noteEditDialogVisible = ref(false)
const noteEditContent = ref('')
const noteEditId = ref<number>(0)
const noteSaveLoading = ref(false)

// 知识图谱
const graphRef = ref<InstanceType<typeof KnowledgeGraphChart> | null>(null)
const graphData = ref<GraphData>({ nodes: [], links: [] })
const graphLoading = ref(false)

// 视频播放器
const videoDialogVisible = ref(false)
const currentVideo = ref<VideoResource | null>(null)
const pendingSeekTime = ref<number | null>(null)
const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null)
const showNotePanel = ref(false)
const activePanel = ref<'note' | 'discussion'>('note')

const courseName = computed(() => {
  const c = courseStore.getCurrentCourse()
  return c?.name || '课程详情'
})

const enrolling = ref(false)
const isCourseEnrolled = computed(() =>
  courseStore.myCourses.some((c) => c.id === courseId.value)
)

async function handleEnrollCourse() {
  enrolling.value = true
  try {
    await courseStore.enrollCourse(courseId.value)
    ElMessage.success('已加入课程表')
  } catch {
    ElMessage.error('加入失败，请重试')
  } finally {
    enrolling.value = false
  }
}

const unenrolling = ref(false)

async function handleUnenrollCourse() {
  unenrolling.value = true
  try {
    await courseStore.unenrollCourse(courseId.value)
    ElMessage.success('已移出课程表')
  } catch {
    ElMessage.error('移除失败，请重试')
  } finally {
    unenrolling.value = false
  }
}

const userId = computed(() => {
  const userStore = useUserStore()
  return userStore.userInfo?.id ?? 0
})

const currentQ = computed(() => questions.value[currentQIndex.value] || null)

const quizProgress = computed(() =>
  ((currentQIndex.value + 1) / (questions.value.length || 1)) * 100
)

const quizAccuracy = computed(() =>
  quizScore.value
    ? Math.round((quizScore.value.correctCount / quizScore.value.totalQuestions) * 100)
    : 0
)

const quizCircumference = computed(() => 2 * Math.PI * 45)

const quizStrokeDashoffset = computed(() => {
  if (!quizScore.value) return quizCircumference.value
  const pct = quizScore.value.correctCount / quizScore.value.totalQuestions
  return quizCircumference.value * (1 - pct)
})

const quizReviewItems = computed(() => {
  if (!quizScore.value) return []
  return quizScore.value.items.map(item => {
    const q = questions.value.find(q => q.id === item.questionId)
    return {
      ...item,
      content: q?.content || `题目 ${item.questionId}`,
      options: q?.options || '',
      userAnswer: userAnswers.value[item.questionId] || '',
    }
  })
})

function selectQuizOption(key: string) {
  selectedAnswer.value = key
}

function handleQuizPrev() {
  if (currentQIndex.value > 0) {
    const currentQ = questions.value[currentQIndex.value]
    const prevQ = questions.value[currentQIndex.value - 1]
    if (currentQ) {
      userAnswers.value[currentQ.id] = selectedAnswer.value
    }
    currentQIndex.value--
    selectedAnswer.value = prevQ ? (userAnswers.value[prevQ.id] || '') : ''
  }
}

function handleQuizNext() {
  if (currentQIndex.value < questions.value.length - 1) {
    const currentQ = questions.value[currentQIndex.value]
    const nextQ = questions.value[currentQIndex.value + 1]
    if (currentQ) {
      userAnswers.value[currentQ.id] = selectedAnswer.value
    }
    currentQIndex.value++
    selectedAnswer.value = nextQ ? (userAnswers.value[nextQ.id] || '') : ''
  }
}

function countAllKps(kps: KnowledgePointTreeNode[]): number {
  let count = kps.length
  for (const kp of kps) {
    count += countAllKps(kp.children)
  }
  return count
}

// 从 AnswerDetail 转换为 AssessmentQuestion
function convertToAssessmentQuestion(q: AnswerDetail, idx: number): AssessmentQuestion {
  let type: 'single' | 'multiple' = 'single'
  if (q.type === 'multiple') type = 'multiple'

  let options: { key: string; text: string }[] = []
  const raw = q.options
  if (raw) {
    try {
      const rawOptions: string[] = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (Array.isArray(rawOptions)) {
        console.log('[ChapterAssessment] rawOptions:', JSON.stringify(rawOptions))
        options = rawOptions.map((opt: string) => {
          const match = opt.match(/^([A-Z])[.、．)）\s]+(.+)/)
          if (match) {
            const text = match[2]!.trim()
            // 过滤占位符文本（如"(选项)"）
            if (!text || text === '(选项)') return { key: match[1]!, text: '' }
            return { key: match[1]!, text }
          }
          return { key: '', text: opt }
        })
        // 去掉文本为空的选项
        options = options.filter(o => o.text)
        console.log('[ChapterAssessment] filtered options:', JSON.stringify(options))
      }
    } catch { /* ignore */ }
  }

  return {
    id: `ch-${idx}-${q.id}`,
    type,
    text: q.content || '',
    options,
    correctAnswer: q.answer || '',
    explanation: q.analysis || '',
  }
}

// 递归收集知识点下所有题目
function collectQuestionsFromKp(kp: KnowledgePointTreeNode): AnswerDetail[] {
  let all: AnswerDetail[] = [...(kp.questions || [])]
  for (const child of kp.children) {
    all = all.concat(collectQuestionsFromKp(child))
  }
  return all
}

// 收集章节下所有知识点的题目，随机打乱后取前30道
function collectChapterQuestions(st: SubTopicVO): AssessmentQuestion[] {
  const allRaw: AnswerDetail[] = []
  for (const kp of st.knowledgePoints) {
    allRaw.push(...collectQuestionsFromKp(kp))
  }
  if (allRaw.length === 0) return []

  // Fisher-Yates 洗牌
  const shuffled = [...allRaw]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const MAX_QUESTIONS = 30
  const selected = shuffled.slice(0, MAX_QUESTIONS)
  return selected
    .map((q, idx) => convertToAssessmentQuestion(q, idx))
    .filter(q => q.options.length > 0 || q.correctAnswer)
}

function toggleChapter(id: string) {
  if (expandedChapters.value.has(id)) {
    expandedChapters.value.delete(id)
    selectedSubTopic.value = null
    chapterAssessmentQuestions.value = []
  } else {
    expandedChapters.value.add(id)
    const st = subTopics.value.find(s => s.id === id) || null
    selectedSubTopic.value = st
    selectedKp.value = null
    selectedKpId.value = ''
    if (st) {
      chapterAssessmentQuestions.value = collectChapterQuestions(st)
    }
  }
}

function selectKp(kp: KnowledgePointTreeNode) {
  selectedKp.value = kp
  selectedKpId.value = kp.id
  activeTab.value = 'graph'
  if (kp.videos.length) activeTab.value = 'videos'
  else if (kp.coursewares.length) activeTab.value = 'courseware'
  else if (kp.questions.length) activeTab.value = 'quiz'
  fetchQuestionsForKp()
  fetchNotesForKp()
}

function parseOptions(raw: string) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((text, i) => {
        const clean = String(text).replace(/^[A-Z][.、．)）\s]+/, '').trim()
        return { key: String.fromCharCode(65 + i), text: clean }
      })
    }
  } catch { /* fall through */ }
  return raw.split(/[;,]/).filter(Boolean).map((text, i) => ({
    key: String.fromCharCode(65 + i),
    text: text.replace(/^[A-Z][.、．)）\s]+/, '').trim(),
  }))
}

function formatDuration(seconds: number | string | null): string {
  if (!seconds) return ''
  const numSeconds = typeof seconds === 'string' ? parseInt(seconds) : seconds
  if (isNaN(numSeconds)) return ''
  const m = Math.floor(numSeconds / 60)
  const s = numSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function playVideo(v: VideoResource, seekSeconds?: number) {
  currentVideo.value = v
  pendingSeekTime.value = seekSeconds ?? null
  videoDialogVisible.value = true
  showNotePanel.value = false
  activePanel.value = 'note'
}

// 从笔记时间戳跳转到对应视频时间
function seekToNoteVideo(note: Note) {
  const video = selectedKp.value?.videos?.find(v => v.id === note.videoId)
  if (!video) {
    ElMessage.warning('找不到关联的视频')
    return
  }
  playVideo(video, note.timestamp)
}

// 视频打开后跳转到指定时间
watch([videoDialogVisible, videoPlayerRef], async ([open, playerRef]) => {
  if (open && playerRef && pendingSeekTime.value !== null) {
    await nextTick()
    playerRef.seekToTime(pendingSeekTime.value)
    pendingSeekTime.value = null
  }
})

function getVideoSrc(v: VideoResource): string {
  return `/api/resources/videos/stream?path=${encodeURIComponent(v.filePath)}`
}

function handleVideoDialogClose() {
  currentVideo.value = null
  pendingSeekTime.value = null
  showNotePanel.value = false
  activePanel.value = 'note'
  fetchNotesForKp()
}

function toggleNotePanel() {
  showNotePanel.value = !showNotePanel.value
}

function openVideoPanel(panel: 'note' | 'discussion') {
  if (showNotePanel.value && activePanel.value === panel) {
    showNotePanel.value = false
  } else {
    showNotePanel.value = true
    activePanel.value = panel
  }
}

function openCourseware(c: CoursewareResource) {
  trackCoursewareAccess({ knowledgePointId: selectedKpId.value, courseId: courseId.value }).catch(() => {})
  window.open(`/api/resources/courseware/download?path=${encodeURIComponent(c.filePath)}`, '_blank')
}

async function fetchChapters() {
  pageLoading.value = true
  loadError.value = false
  try {
    subTopics.value = await getChapterStructure(courseId.value)
    if (subTopics.value.length && subTopics.value[0]) {
      expandedChapters.value.add(subTopics.value[0].id)
    }
  } catch {
    loadError.value = true
    subTopics.value = []
  } finally {
    pageLoading.value = false
  }
}

async function fetchGraph() {
  graphLoading.value = true
  try {
    const res = await getKnowledgeGraph(courseId.value)
    const nodes: KnowledgeNode[] = res.nodes.map((n: any) => ({
      id: n.id,
      name: n.name,
      courseId: n.courseId,
      group: n.group,
      level: n.level,
    }))
    const links: KnowledgeLink[] = res.links.map((l: any) => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      type: l.type || '',
    }))
    graphData.value = { nodes, links }
  } catch {
    graphData.value = { nodes: [], links: [] }
  } finally {
    graphLoading.value = false
  }
}

function handleGraphNodeClick(nodeId: string) {
  const node = graphData.value.nodes.find(n => n.id === nodeId)
  if (node) {
    selectedKpId.value = nodeId
    selectKpFromGraph(node)
  }
}

function selectKpFromGraph(node: KnowledgeNode) {
  // Find the matching KnowledgePointTreeNode in subTopics
  for (const st of subTopics.value) {
    for (const kp of st.knowledgePoints) {
      const found = findKpById(kp, node.id)
      if (found) {
        selectedKp.value = found
        selectedKpId.value = found.id
        expandedChapters.value.add(st.id)
        activeTab.value = 'graph'
        if (found.videos.length) activeTab.value = 'videos'
        else if (found.coursewares.length) activeTab.value = 'courseware'
        else if (found.questions.length) activeTab.value = 'quiz'
        fetchQuestionsForKp()
        return
      }
    }
  }
  // Fallback: not found in tree, just navigate visually
  selectedKp.value = null
  selectedKpId.value = node.id
}

function findKpById(kp: KnowledgePointTreeNode, id: string): KnowledgePointTreeNode | null {
  if (kp.id === id) return kp
  for (const child of kp.children) {
    const found = findKpById(child, id)
    if (found) return found
  }
  return null
}

async function fetchQuestionsForKp() {
  if (!selectedKp.value) return
  quizSubmitted.value = false
  quizScore.value = null
  quizDebug.value = ''
  userAnswers.value = {}
  currentQIndex.value = 0
  selectedAnswer.value = ''
  showQuizAnalysis.value = false
  quizStartTime.value = Date.now()
  currentQuizBatch.value = 0

  // 优先使用 mock 数据中已有的 questions
  let loaded: QuestionItem[] = []
  if (selectedKp.value?.questions && selectedKp.value.questions.length > 0) {
    loaded = selectedKp.value.questions as QuestionItem[]
  } else {
    // fallback: API 调用
    try {
      loaded = await getQuestions(courseId.value, userId.value, selectedKpId.value)
    } catch (err: any) {
      loaded = []
      const msg = err?.message || err?.response?.data?.msg || '加载试题失败'
      ElMessage.error(msg)
    }
  }

  // 筛掉没有选项的题（用 parseOptions 实际解析结果判断）
  loaded = loaded.filter(q => parseOptions(q.options || '').length > 0)
  allQuizQuestions.value = loaded
  quizBatches.value = splitQuizIntoBatches(loaded)
  totalQuizBatches.value = quizBatches.value.length
  quizBatchScores.value = new Array(quizBatches.value.length).fill(null).map(() => [])
  // 加载已持久化的历史记录
  const savedScores = loadKpQuizScores()
  if (savedScores.length === quizBatches.value.length) {
    quizBatchScores.value = savedScores
  }
  showQuizList.value = true
  questions.value = quizBatches.value[0] || []
}

/** 将题目按每批30道拆分，总题数<=30不分批 */
function splitQuizIntoBatches(all: QuestionItem[], batchSize = 30): QuestionItem[][] {
  if (all.length <= batchSize) return [all]
  // Fisher-Yates 洗牌打散
  const shuffled = [...all]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const batches: QuestionItem[][] = []
  for (let i = 0; i < shuffled.length; i += batchSize) {
    batches.push(shuffled.slice(i, i + batchSize))
  }
  return batches
}

/** 从批次列表进入指定批次 */
function startQuizBatch(idx: number) {
  currentQuizBatch.value = idx
  questions.value = quizBatches.value[idx]
  showQuizList.value = false
  quizSubmitted.value = false
  quizScore.value = null
  quizDebug.value = ''
  userAnswers.value = {}
  currentQIndex.value = 0
  selectedAnswer.value = ''
  showQuizAnalysis.value = false
  quizStartTime.value = Date.now()
}

/** 返回批次列表 */
function goToQuizList() {
  showQuizList.value = true
  quizSubmitted.value = false
  quizScore.value = null
  currentQIndex.value = 0
  selectedAnswer.value = ''
  showQuizAnalysis.value = false
}

async function submitQuiz() {
  if (!selectedKp.value || submitLoading.value) return

  // 保存最后一题答案
  if (currentQ.value) {
    userAnswers.value[currentQ.value.id] = selectedAnswer.value
  }

  submitLoading.value = true

  // 如果是 mock 数据（带 answer 字段），客户端判分
  const mockQuestion = questions.value[0] as any
  if (mockQuestion?.answer !== undefined) {
    const results: SubmitAnswerResult['items'] = []
    let correctCount = 0
    for (const q of questions.value) {
      const qq = q as any
      const isCorrect = userAnswers.value[q.id] === qq.answer
      if (isCorrect) correctCount++
      results.push({
        questionId: q.id,
        isCorrect,
        correctAnswer: qq.answer || '',
        analysis: qq.analysis || '',
      })
    }
    quizScore.value = { totalQuestions: questions.value.length, correctCount, items: results }
    quizSubmitted.value = true
    const elapsed = Date.now() - quizStartTime.value
    const sec = Math.floor(elapsed / 1000)
    quizTimeSpent.value = sec >= 60 ? `${Math.floor(sec / 60)}分${sec % 60}秒` : `${sec}秒`
    ElMessage.success(`提交成功！${correctCount}/${questions.value.length} 题正确`)
    quizBatchScores.value[currentQuizBatch.value].push(quizScore.value!)
    saveKpQuizScores()
    submitLoading.value = false
    return
  }

  // 否则走 API 提交
  const payload = {
    userId: userId.value,
    courseId: courseId.value,
    answers: questions.value.map((q) => ({
      questionId: q.id,
      knowledgePointId: q.knowledgePointId,
      answer: userAnswers.value[q.id] || '',
    }))
  }

  try {
    const result = await submitAnswers(payload)

    if (!result || result.totalQuestions == null) {
      const errMsg = '服务端返回数据异常，请稍后重试'
      console.error('[submitQuiz] 校验失败:', { result, hasResult: !!result, totalQuestions: result?.totalQuestions })
      ElMessage.error(errMsg)
      quizDebug.value = errMsg
      return
    }

    quizDebug.value = ''
    await nextTick()
    quizScore.value = result
    quizSubmitted.value = true
    const elapsed = Date.now() - quizStartTime.value
    const sec = Math.floor(elapsed / 1000)
    quizTimeSpent.value = sec >= 60 ? `${Math.floor(sec / 60)}分${sec % 60}秒` : `${sec}秒`
    await nextTick()
    ElMessage.success(`提交成功！${result.correctCount}/${result.totalQuestions} 题正确`)
    quizBatchScores.value[currentQuizBatch.value].push(result)
    saveKpQuizScores()
  } catch (err: any) {
    console.error('[submitQuiz] 异常:', err)
    const msg = err?.message || err?.response?.data?.msg || '提交失败，请检查网络后重试'
    ElMessage.error(msg)
    quizDebug.value = '异常: ' + (err?.message || err?.response?.data?.msg || '未知错误')
  } finally {
    submitLoading.value = false
  }
}

function restartQuiz() {
  quizSubmitted.value = false
  quizScore.value = null
  quizDebug.value = ''
  userAnswers.value = {}
  currentQIndex.value = 0
  selectedAnswer.value = ''
  showQuizAnalysis.value = false
  if (quizBatches.value[currentQuizBatch.value]) {
    questions.value = quizBatches.value[currentQuizBatch.value]
  } else {
    fetchQuestionsForKp()
  }
}

async function fetchNotesForKp() {
  if (!selectedKpId.value) return
  notesLoading.value = true
  try {
    kpNotes.value = await getKnowledgePointNotes(selectedKpId.value)
  } catch {
    kpNotes.value = []
  } finally {
    notesLoading.value = false
  }
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

function editKpNote(note: Note) {
  noteEditId.value = note.id
  noteEditContent.value = note.content
  noteEditDialogVisible.value = true
}

async function saveKpNote() {
  noteSaveLoading.value = true
  try {
    await updateNote({ id: noteEditId.value, content: noteEditContent.value })
    const idx = kpNotes.value.findIndex(n => n.id === noteEditId.value)
    if (idx !== -1) kpNotes.value[idx].content = noteEditContent.value
    noteEditDialogVisible.value = false
    ElMessage.success('笔记已更新')
  } catch {
    ElMessage.error('更新失败')
  } finally {
    noteSaveLoading.value = false
  }
}

async function handleDeleteKpNote(id: number) {
  try {
    await deleteNote(id)
    kpNotes.value = kpNotes.value.filter(n => n.id !== id)
    ElMessage.success('已删除')
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(async () => {
  if (!courseStore.getCurrentCourse()) {
    await courseStore.fetchMyCourses()
  }
  await fetchChapters()
  await fetchGraph()

  // 处理路由参数：Tab 切换
  const tabParam = route.query.tab as string
  if (tabParam) {
    activeTab.value = tabParam
  }

  // 处理知识点定位（来自搜索结果跳转）
  const kpId = route.query.knowledgePointId as string
  if (kpId && subTopics.value.length) {
    await nextTick()
    // 查找并选中知识点
    for (const st of subTopics.value) {
      let found: KnowledgePointTreeNode | null = null
      for (const kp of st.knowledgePoints) {
        found = findKpById(kp, kpId)
        if (found) break
      }
      if (found) {
        expandedChapters.value.add(st.id)
        selectedKp.value = found
        selectedKpId.value = found.id
        await nextTick()
        fetchQuestionsForKp()
        break
      }
    }

    // 处理知识图谱节点高亮定位（放在知识点选中之后，确保图谱组件已渲染）
    const highlightNodeId = route.query.highlight as string
    if (highlightNodeId) {
      await nextTick()
      const highlightNodeName = (route.query.nodeName as string) || ''
      graphRef.value?.highlightNode?.(highlightNodeName || selectedKp.value?.name || '')
      graphRef.value?.centerOnNodeById?.(highlightNodeId)
      graphRef.value?.flashNode?.(highlightNodeId)
    }

    // 处理视频自动播放
    const videoIdParam = route.query.videoId as string
    if (videoIdParam && selectedKp.value) {
      activeTab.value = 'videos'
      await nextTick()
      const vid = selectedKp.value.videos?.find(v => String(v.id) === videoIdParam)
      if (vid) {
        playVideo(vid)
      }
    }
  }
})
</script>


<style scoped>
.course-detail { height: calc(100vh - 60px); display: flex; flex-direction: column; overflow: hidden; }

.course-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.course-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.main-layout { flex: 1; display: flex; overflow: hidden; }

.chapter-sidebar {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chapter-list {
  flex: 1;
  overflow-y: auto;
}

.sidebar-title {
  padding: 16px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
}

.error-hint, .empty-hint {
  padding: 24px;
  text-align: center;
  color: #909399;
}

.chapter-group {
  border-bottom: 1px solid #f0f0f0;
}

.chapter-header {
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.chapter-header:hover {
  background: #f5f7fa;
}

.chapter-header.expanded {
  background: #f0f7ff;
}

.arrow-icon {
  font-size: 12px;
  color: #909399;
}

.chapter-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.chapter-count {
  font-size: 12px;
  color: #909399;
}

.kp-tree {
  padding: 8px 0 8px 24px;
  background: #fafafa;
}

.resource-panel {
  flex: 1;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.kp-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
}

.kp-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.kp-desc {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.resource-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.resource-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 24px;
  background: #f5f7fa;
}

.resource-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.graph-tab-container {
  flex: 1;
  position: relative;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.resource-card {
  cursor: pointer;
  transition: all 0.3s;
}

.resource-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.video-preview, .courseware-icon {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-body .title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body .meta {
  font-size: 12px;
  color: #909399;
}

.embedded-page {
  height: 100%;
}

.embedded-qa {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.embedded-homework {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 测试批次列表 */
.quiz-batch-list {
  padding: 20px 0;
}
.quiz-batch-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.quiz-batch-list-header h3 {
  margin: 0;
  font-size: 18px;
}
.quiz-batch-list-total {
  color: #909399;
  font-size: 14px;
}
.quiz-batch-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.quiz-batch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.2s;
  flex-wrap: wrap;
  gap: 12px;
}
.quiz-batch-card:hover {
  border-color: #409eff;
}
.batch-main {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.batch-header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 140px;
}
.batch-label {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.batch-count {
  font-size: 13px;
  color: #909399;
}
.batch-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.batch-status {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 4px;
}
.batch-status.done {
  color: #67c23a;
  background: #f0f9eb;
}
.batch-status.pending {
  color: #e6a23c;
  background: #fdf6ec;
}
.batch-score {
  font-size: 13px;
  color: #606266;
}
.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.batch-go-btn {
  flex-shrink: 0;
  margin-left: 16px;
}

/* 批次历史记录（弹窗内使用） */
.history-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
  font-size: 13px;
}
.history-item:last-child {
  border-bottom: none;
}
.history-index {
  color: #909399;
  min-width: 50px;
}
.history-score {
  color: #606266;
  min-width: 90px;
}
.history-pct {
  color: #409eff;
  font-weight: 600;
  min-width: 45px;
}
.history-score-val {
  color: #67c23a;
  font-weight: 600;
}

/* 返回链接 */
.quiz-back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #409eff;
  cursor: pointer;
  user-select: none;
}
.quiz-back-link:hover {
  color: #66b1ff;
}

/* 测试样式 */
.quiz-container {
  max-width: 800px;
  margin: 0 auto;
}

.quiz-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.quiz-nav-title {
  font-size: 18px;
  font-weight: 600;
}

.quiz-nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.quiz-counter {
  font-size: 14px;
  color: #606266;
}

.quiz-progress-bar {
  width: 200px;
}

.quiz-question-card {
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quiz-question-type {
  margin-bottom: 16px;
}

.quiz-question-text {
  font-size: 16px;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.quiz-option-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.quiz-option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quiz-option-item:hover {
  border-color: #409eff;
  background: #f0f7ff;
}

.quiz-option-item.option-selected {
  border-color: #409eff;
  background: #ecf5ff;
}

.quiz-option-key {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f7fa;
  font-weight: 600;
  font-size: 14px;
}

.quiz-option-item.option-selected .quiz-option-key {
  background: #409eff;
  color: #fff;
}

.quiz-option-text {
  flex: 1;
  font-size: 14px;
}

.quiz-nav-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 测试结果样式 */
.quiz-result-container {
  max-width: 800px;
  margin: 0 auto;
}

.quiz-result-card {
  background: #fff;
  padding: 32px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.quiz-result-header {
  margin-bottom: 24px;
}

.quiz-result-icon {
  margin-bottom: 16px;
}

.quiz-result-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.quiz-result-score {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  margin-bottom: 24px;
}

.score-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.score-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-ring-bg {
  fill: none;
  stroke: #f5f7fa;
  stroke-width: 8;
}

.score-ring-progress {
  fill: none;
  stroke: #67c23a;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s;
}

.score-ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.score-ring-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.score-ring-total {
  font-size: 12px;
  color: #909399;
}

.score-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-summary-item {
  display: flex;
  justify-content: space-between;
  gap: 24px;
}

.score-summary-label {
  font-size: 14px;
  color: #606266;
}

.score-summary-value {
  font-size: 16px;
  font-weight: 600;
}

.score-summary-value.accuracy {
  color: #67c23a;
}

.quiz-result-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 测试解析样式 */
.quiz-analysis-section {
  margin-top: 24px;
}

.quiz-analysis-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.quiz-analysis-card {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.quiz-analysis-question-header {
  margin-bottom: 16px;
}

.quiz-analysis-question-text {
  font-size: 14px;
  font-weight: 500;
}

.quiz-analysis-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.quiz-analysis-opt {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quiz-analysis-opt .quiz-option-key {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f7fa;
  font-weight: 600;
  font-size: 14px;
}

.quiz-analysis-opt .quiz-option-key.opt-correct {
  background: #67c23a;
  color: #fff;
}

.quiz-analysis-opt .quiz-option-key.opt-wrong {
  background: #f56c6c;
  color: #fff;
}

.quiz-analysis-opt-text {
  flex: 1;
  font-size: 14px;
}

.quiz-analysis-opt-text.text-correct {
  color: #67c23a;
  font-weight: 500;
}

.quiz-analysis-opt-text.text-wrong {
  color: #f56c6c;
}

.opt-icon-correct {
  color: #67c23a;
}

.opt-icon-wrong {
  color: #f56c6c;
}

.quiz-analysis-explanation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
}

/* 视频播放器对话框样式 */
.video-dialog-content {
  height: 70vh;
}

:deep(.el-dialog__body) {
  padding: 0;
}

.video-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.video-dialog-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 笔记相关 */
.kp-notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kp-note-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  transition: box-shadow 0.3s;
}

.kp-note-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.kp-note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.kp-note-card-actions {
  display: flex;
  gap: 4px;
}

.kp-note-card-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  margin-bottom: 8px;
}

.kp-note-card-footer {
  display: flex;
  justify-content: flex-end;
}

.kp-note-meta {
  font-size: 12px;
  color: #909399;
}

.note-timestamp-tag {
  cursor: pointer;
}

</style>
