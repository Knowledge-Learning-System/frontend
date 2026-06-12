<template>
  <div class="course-detail">
    <div class="main-layout" v-loading="pageLoading">
      <!-- 左侧：章节列表 -->
      <aside class="chapter-sidebar">
        <h3 class="sidebar-title">章节目录</h3>
        <div v-if="loadError" class="error-hint">
          <p>加载失败，请检查网络或重新登录</p>
          <el-button type="primary" size="small" @click="fetchChapters">重试</el-button>
        </div>
        <div v-else-if="!subTopics.length" class="empty-hint">暂无章节</div>
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
                <AssessmentPage />
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
        <template v-else>
          <div class="kp-header">
            <h2>{{ selectedKp.name }}</h2>
            <p v-if="selectedKp.description" class="kp-desc">{{ selectedKp.description }}</p>
          </div>

          <el-tabs v-model="activeTab" class="resource-tabs">
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
            <el-tab-pane label="视频" name="videos">
              <el-empty v-if="!selectedKp.videos.length" description="暂无视频" />
              <div v-else class="resource-grid">
                <el-card v-for="v in selectedKp.videos" :key="v.id" class="resource-card video-card">
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
            <el-tab-pane label="课件" name="courseware">
              <el-empty v-if="!selectedKp.coursewares.length" description="暂无课件" />
              <div v-else class="resource-grid">
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

            <!-- 测试 -->
            <el-tab-pane label="测试" name="quiz">
              <!-- 答题阶段 -->
              <div v-if="!quizSubmitted && questions.length > 0" class="quiz-container">
                <div class="quiz-nav">
                  <span class="quiz-nav-title">{{ selectedKp?.name || '测试' }}</span>
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
              <div v-if="quizSubmitted && quizScore" class="quiz-result-container">
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
                        <span class="score-ring-number">{{ (quizScore.correctCount ?? 0) * 20 }}</span>
                        <span class="score-ring-total">/ {{ (quizScore.totalQuestions ?? 0) * 20 }}</span>
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

              <el-empty v-if="!quizSubmitted && !questions.length" description="暂无测试题" />
            </el-tab-pane>

            <!-- 推荐 -->
            <el-tab-pane label="推荐" name="recommend">
              <div class="embedded-page">
                <RecommendationsPage />
              </div>
            </el-tab-pane>

            <!-- 诊断 -->
            <el-tab-pane label="诊断" name="diagnosis">
              <div class="embedded-page">
                <RadarChartPage />
              </div>
            </el-tab-pane>

            <!-- 问答 -->
            <el-tab-pane label="问答" name="qa">
              <div class="embedded-qa">
                <el-empty description="问答功能开发中" />
              </div>
            </el-tab-pane>

            <!-- 作业 -->
            <el-tab-pane label="作业" name="homework">
              <div class="embedded-homework">
                <el-empty description="作业功能开发中" />
              </div>
            </el-tab-pane>
          </el-tabs>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { VideoPlay, Document, Reading, CircleCheckFilled, CircleCloseFilled, SuccessFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getKnowledgeGraph, getChapterStructure } from '@/api/knowledgeGraph'
import { getQuestions, submitAnswers, type QuestionItem, type SubmitAnswerResult } from '@/api/question'
import type { SubTopicVO, KnowledgePointTreeNode, KnowledgeNode, KnowledgeLink, GraphData } from '@/types/knowledgeGraph'
import type { VideoResource, CoursewareResource } from '@/api/resource'
import { useCourseStore } from '@/stores/course'
import { useUserStore } from '@/stores/user'
import KpTreeNode from '@/components/KpTreeNode.vue'
import KnowledgeGraphChart from '@/components/knowledge-graph/KnowledgeGraphChart.vue'
import RecommendationsPage from './Recommendations.vue'
import AssessmentPage from './Assessment.vue'
import RadarChartPage from './RadarChart.vue'

const route = useRoute()
const courseId = Number(route.params.courseId)
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

// 测试相关
const questions = ref<QuestionItem[]>([])
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

// 知识图谱
const graphRef = ref<InstanceType<typeof KnowledgeGraphChart> | null>(null)
const graphData = ref<GraphData>({ nodes: [], links: [] })
const graphLoading = ref(false)

const courseName = computed(() => {
  const c = courseStore.getCurrentCourse()
  return c?.name || '课程详情'
})

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
    userAnswers.value[questions.value[currentQIndex.value].id] = selectedAnswer.value
    currentQIndex.value--
    selectedAnswer.value = userAnswers.value[questions.value[currentQIndex.value].id] || ''
  }
}

function handleQuizNext() {
  if (currentQIndex.value < questions.value.length - 1) {
    userAnswers.value[questions.value[currentQIndex.value].id] = selectedAnswer.value
    currentQIndex.value++
    selectedAnswer.value = userAnswers.value[questions.value[currentQIndex.value].id] || ''
  }
}

function countAllKps(kps: KnowledgePointTreeNode[]): number {
  let count = kps.length
  for (const kp of kps) {
    count += countAllKps(kp.children)
  }
  return count
}

function toggleChapter(id: string) {
  if (expandedChapters.value.has(id)) {
    expandedChapters.value.delete(id)
    selectedSubTopic.value = null
  } else {
    expandedChapters.value.add(id)
    const st = subTopics.value.find(s => s.id === id) || null
    selectedSubTopic.value = st
    selectedKp.value = null
    selectedKpId.value = ''
  }
}

function selectKp(kp: KnowledgePointTreeNode) {
  selectedKp.value = kp
  selectedKpId.value = kp.id
  activeTab.value = 'videos'
  if (!kp.videos.length && kp.coursewares.length) activeTab.value = 'courseware'
  if (!kp.videos.length && !kp.coursewares.length && kp.questions.length) activeTab.value = 'quiz'
  fetchQuestionsForKp()
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

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function playVideo(v: VideoResource) {
  window.open(`/api/resources/videos/stream?path=${encodeURIComponent(v.filePath)}`, '_blank')
}

function openCourseware(c: CoursewareResource) {
  window.open(`/api/resources/courseware/download?path=${encodeURIComponent(c.filePath)}`, '_blank')
}

async function fetchChapters() {
  pageLoading.value = true
  loadError.value = false
  try {
    subTopics.value = await getChapterStructure(courseId)
    if (subTopics.value.length) {
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
    const res = await getKnowledgeGraph(courseId)
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
        activeTab.value = 'videos'
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

  // 优先使用 mock 数据中已有的 questions
  if (selectedKp.value.questions && selectedKp.value.questions.length > 0) {
    questions.value = selectedKp.value.questions as QuestionItem[]
    return
  }

  // fallback: API 调用
  try {
    questions.value = await getQuestions(courseId, userId.value, selectedKpId.value)
  } catch (err: any) {
    questions.value = []
    const msg = err?.message || err?.response?.data?.msg || '加载试题失败'
    ElMessage.error(msg)
  }
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
    submitLoading.value = false
    return
  }

  // 否则走 API 提交
  const payload = { userId: userId.value, courseId, answers: questions.value.map((q) => ({
    questionId: q.id,
    knowledgePointId: q.knowledgePointId,
    answer: userAnswers.value[q.id],
  })) }

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
  fetchQuestionsForKp()
}

onMounted(async () => {
  if (!courseStore.getCurrentCourse()) {
    await courseStore.fetchMyCourses()
  }
  await fetchChapters()
  await fetchGraph()

  // 处理路由参数：Tab 切换 + 知识图谱节点定位
  const tabParam = route.query.tab as string
  if (tabParam) {
    activeTab.value = tabParam
  }

  const highlightNodeId = route.query.highlight as string
  if (highlightNodeId) {
    await nextTick()
    const highlightNodeName = (route.query.nodeName as string) || ''
    graphRef.value?.highlightNode?.(highlightNodeName || highlightNodeId)
    graphRef.value?.centerOnNodeById?.(highlightNodeId)
    graphRef.value?.flashNode?.(highlightNodeId)
  }
})
</script>


<style scoped>
.course-detail { height: calc(100vh - 60px); display: flex; flex-direction: column; overflow: hidden; }

.main-layout { flex: 1; display: flex; overflow: hidden; }

.chapter-sidebar {
  width: 280px; min-width: 280px; border-right: 1px solid #ebeef5;
  overflow-y: auto; padding: 12px 0; background: #fafafa;
}
.sidebar-title { font-size: 15px; font-weight: 600; padding: 0 16px 12px; margin: 0; color: #303133; }
.empty-hint { padding: 24px 16px; color: #999; font-size: 13px; text-align: center; }
.error-hint { padding: 24px 16px; text-align: center; }
.error-hint p { color: #f56c6c; font-size: 13px; margin: 0 0 12px; }

.chapter-group { border-bottom: 1px solid #f0f0f0; }
.chapter-header {
  display: flex; align-items: center; gap: 6px; padding: 10px 16px;
  cursor: pointer; user-select: none; transition: background .15s;
  border-radius: 4px; margin: 2px 8px 2px 0;
}
.chapter-header:hover { background: #ecf5ff; }
.arrow-icon {
  font-size: 10px; color: #909399; flex-shrink: 0; width: 16px;
  text-align: center; line-height: 1;
}
.chapter-name { font-size: 14px; font-weight: 500; color: #303133; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chapter-count { font-size: 12px; color: #c0c4cc; flex-shrink: 0; }

.kp-tree { padding-left: 8px; padding-bottom: 4px; }

.resource-panel { flex: 1; overflow-y: auto; padding: 20px 32px; }
.panel-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: #c0c4cc; gap: 12px; }
.panel-placeholder p { font-size: 14px; margin: 0; }

.kp-header { margin-bottom: 16px; }
.kp-header h2 { margin: 0 0 8px; font-size: 20px; color: #303133; }
.kp-desc { margin: 0; font-size: 13px; color: #909399; line-height: 1.6; }

.resource-tabs { margin-top: 0; }
.graph-tab-container { height: 560px; border-radius: 8px; overflow: hidden; border: 1px solid #e4e7ed; }
.resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.resource-card { cursor: pointer; text-align: center; }
.video-preview, .courseware-icon { padding: 24px 0; color: #409eff; }
.card-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.title { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { font-size: 12px; color: #999; }

/* 测试 - 答题阶段 */
.quiz-container { max-width: 800px; margin: 0 auto; }

.quiz-nav {
  display: flex; justify-content: space-between; align-items: center;
  background: white; padding: 12px 20px; border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,.06); margin-bottom: 20px;
}
.quiz-nav-title { font-size: 16px; font-weight: 600; color: #303133; }
.quiz-nav-right { display: flex; align-items: center; gap: 12px; }
.quiz-counter { font-size: 13px; color: #606266; white-space: nowrap; }
.quiz-progress-bar { width: 160px; }

.quiz-question-card {
  background: white; border-radius: 12px; padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
}
.quiz-question-type { margin-bottom: 16px; }
.quiz-question-text {
  font-size: 20px; font-weight: 600; color: #303133;
  margin-bottom: 24px; line-height: 1.6;
}

.quiz-option-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }

.quiz-option-item {
  display: flex; align-items: center; padding: 14px 18px;
  border: 2px solid #e4e7ed; border-radius: 8px;
  cursor: pointer; transition: all .2s;
}
.quiz-option-item:hover { border-color: #409eff; background: #f5f7fa; }
.quiz-option-item.option-selected { border-color: #409eff; background: #ecf5ff; }

.quiz-option-key {
  width: 32px; height: 32px; border-radius: 50%;
  background: #f5f7fa; color: #606266;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; margin-right: 16px; flex-shrink: 0;
}
.option-selected .quiz-option-key { background: #409eff; color: white; }

.quiz-option-text { flex: 1; color: #303133; font-size: 15px; }

.quiz-nav-buttons { display: flex; justify-content: center; gap: 16px; }

/* 测试 - 结果阶段 */
.quiz-result-container { max-width: 800px; margin: 0 auto; }

.quiz-result-card {
  background: white; border-radius: 12px; padding: 40px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1); margin-bottom: 24px;
}
.quiz-result-header { text-align: center; margin-bottom: 32px; }
.quiz-result-title { font-size: 28px; font-weight: 600; color: #303133; margin-top: 16px; }

.quiz-result-score { display: flex; justify-content: center; align-items: center; gap: 48px; margin-bottom: 32px; }

.score-ring { position: relative; width: 160px; height: 160px; }
.score-ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
.score-ring-bg { fill: none; stroke: #ebeef5; stroke-width: 10; }
.score-ring-progress {
  fill: none; stroke: #67c23a; stroke-width: 10;
  stroke-linecap: round; transition: stroke-dashoffset 0.5s ease;
}
.score-ring-text {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); text-align: center;
}
.score-ring-number { font-size: 48px; font-weight: 700; color: #67c23a; }
.score-ring-total { font-size: 20px; color: #909399; }

.score-summary { display: flex; flex-direction: column; gap: 16px; }
.score-summary-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; background: #f5f7fa; border-radius: 8px; min-width: 140px;
}
.score-summary-label { font-size: 14px; color: #606266; }
.score-summary-value { font-size: 18px; font-weight: 600; color: #303133; }
.score-summary-value.accuracy { color: #67c23a; }

.quiz-result-actions { display: flex; justify-content: center; gap: 16px; }

/* 测试 - 解析区 */
.quiz-analysis-section {
  background: white; border-radius: 12px; padding: 32px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
}
.quiz-analysis-title { font-size: 20px; font-weight: 600; color: #303133; margin-bottom: 24px; }

.quiz-analysis-card {
  border: 1px solid #e4e7ed; border-radius: 8px; padding: 20px;
  margin-bottom: 16px; background: #fafafa;
}
.quiz-analysis-question-header { margin-bottom: 12px; }
.quiz-analysis-question-text { font-size: 15px; font-weight: 500; color: #303133; line-height: 1.6; }

.quiz-analysis-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.quiz-analysis-opt {
  display: flex; align-items: center; gap: 12px; padding: 8px 12px;
  border-radius: 6px;
}

.quiz-analysis-opt .quiz-option-key {
  width: 28px; height: 28px; font-size: 13px;
}
.quiz-analysis-opt .quiz-option-key.opt-correct { background: #67c23a; color: white; }
.quiz-analysis-opt .quiz-option-key.opt-wrong { background: #f56c6c; color: white; }

.quiz-analysis-opt-text { font-size: 14px; color: #303133; flex: 1; }
.quiz-analysis-opt-text.text-correct { color: #67c23a; font-weight: 600; }
.quiz-analysis-opt-text.text-wrong { color: #f56c6c; font-weight: 600; }

.opt-icon-correct { color: #67c23a; flex-shrink: 0; }
.opt-icon-wrong { color: #f56c6c; flex-shrink: 0; }

.quiz-analysis-explanation {
  display: flex; align-items: flex-start; gap: 6px;
  background: white; border-radius: 6px; padding: 14px;
  font-size: 14px; color: #606266; line-height: 1.8;
}
.quiz-analysis-explanation .el-icon { color: #409eff; margin-top: 3px; flex-shrink: 0; }

/* ========== 嵌入页面 ========== */
.embedded-page {
  height: 560px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
}

/* 隐藏嵌入页面的顶层返回按钮和页面标题 */
.embedded-page :deep(.recommendation-page .rec-header),
.embedded-page :deep(.assessment-page .assessment-header),
.embedded-page :deep(.radar-page .radar-header),
.embedded-page :deep(.weak-points-page .weak-header),
.embedded-page :deep(.assessment-page .result-actions .el-button--success) {
  display: none;
}

/* 隐藏嵌入页面的全屏高度 */
.embedded-page :deep(.recommendation-page),
.embedded-page :deep(.assessment-page),
.embedded-page :deep(.radar-page),
.embedded-page :deep(.weak-points-page) {
  min-height: auto;
  height: auto;
}

/* 嵌入页面内调整 padding */
.embedded-page :deep(.recommendation-page) { padding: 0; }
.embedded-page :deep(.assessment-page) { padding: 0; }
.embedded-page :deep(.radar-page) { padding: 0; }
.embedded-page :deep(.weak-points-page) { padding: 0; }

.embedded-qa, .embedded-homework {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
