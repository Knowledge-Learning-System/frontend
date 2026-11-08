<template>
  <div class="kp-detail-page" v-loading="loading">
    <!-- 顶部返回栏 -->
    <div class="page-nav">
      <el-button class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回课程大厅</span>
      </el-button>
      <div class="nav-path">
        <span class="course-name">{{ courseName || '课程' }}</span>
        <el-icon class="path-sep"><ArrowRight /></el-icon>
        <span class="kp-name">{{ selectedKp?.name || '知识点' }}</span>
      </div>
    </div>

    <!-- 知识点信息 -->
    <section v-if="selectedKp" class="kp-info-card">
      <div class="kp-info-head">
        <h2 class="kp-title">
          <el-icon><PriceTag /></el-icon>
          {{ selectedKp.name }}
        </h2>
        <el-button
          v-if="canUpload"
          type="primary"
          plain
          class="upload-btn"
          @click="openUploadDialog"
        >
          <el-icon><Upload /></el-icon>
          上传学习资源
        </el-button>
      </div>
      <p v-if="selectedKp.description" class="kp-desc">{{ selectedKp.description }}</p>
      <p v-else class="kp-desc muted">暂无知识点描述</p>
    </section>

    <el-empty v-if="!loading && !selectedKp" description="未找到该知识点" />

    <template v-if="selectedKp">
      <!-- 课程视频 -->
      <section class="block-card video-block">
        <h3 class="block-title">
          <el-icon><VideoCamera /></el-icon>
          课程视频
          <span class="block-count">{{ selectedKp.videos?.length || 0 }} 个</span>
        </h3>
        <el-empty
          v-if="!selectedKp.videos || selectedKp.videos.length === 0"
          description="该知识点暂无视频"
        />
        <div v-else class="video-grid">
          <el-card
            v-for="v in selectedKp.videos"
            :key="v.id"
            class="resource-card video-card"
            shadow="hover"
            @click="playVideo(v)"
          >
            <div class="video-preview">
              <el-icon :size="34"><VideoPlay /></el-icon>
            </div>
            <div class="video-info">
              <p class="video-title" :title="v.title">{{ v.title }}</p>
              <span class="video-play-hint">点击播放</span>
            </div>
          </el-card>
        </div>
      </section>

      <!-- 课程图谱 -->
      <section class="block-card graph-block">
        <h3 class="block-title">
          <el-icon><Share /></el-icon>
          课程图谱
          <span class="block-count">点击节点查看对应知识点</span>
        </h3>
        <div v-loading="graphLoading" class="graph-container">
          <el-empty
            v-if="!graphLoading && graphData.nodes.length === 0"
            description="暂无图谱数据"
          />
          <KnowledgeGraphChart
            v-else-if="graphData.nodes.length > 0"
            :data="graphData"
            @node-click="handleGraphNodeClick"
          />
        </div>
      </section>
    </template>

    <!-- 视频播放器对话框 -->
    <el-dialog
      v-model="videoDialogVisible"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
      @close="handleVideoDialogClose"
    >
      <template #header>
        <div class="video-dialog-header">
          <span>{{ currentVideo?.title || '视频播放' }}</span>
        </div>
      </template>
      <div class="video-dialog-content">
        <VideoPlayer
          v-if="videoDialogVisible && currentVideo"
          :video-id="currentVideo.id"
          :video-src="getVideoSrc(currentVideo)"
          :knowledge-point-id="selectedKpId"
          :course-id="Number(courseId)"
        />
      </div>
    </el-dialog>

    <!-- 上传学习资源弹窗 -->
    <el-dialog
      v-model="kpDialogVisible"
      :title="selectedKp ? `上传学习资源：${selectedKp.name}` : ''"
      width="760px"
      class="kp-detail-dialog"
      destroy-on-close
    >
      <div v-if="selectedKp" class="kp-body">
        <div class="kp-upload">
          <el-form label-width="90px">
            <el-form-item label="资源类型">
              <el-radio-group v-model="uploadForm.resourceType">
                <el-radio label="video">视频</el-radio>
                <el-radio label="courseware">PPT</el-radio>
                <el-radio label="question">试题</el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 视频 / PPT 文件上传 -->
            <template v-if="uploadForm.resourceType !== 'question'">
              <el-form-item label="资源标题">
                <el-input v-model="uploadForm.title" placeholder="可选，默认使用文件名" />
              </el-form-item>
              <el-form-item label="文件">
                <el-upload
                  :auto-upload="false"
                  :limit="1"
                  :file-list="uploadFileList"
                  :on-change="handleFileChange"
                  :on-remove="() => { uploadForm.file = null }"
                  :accept="uploadForm.resourceType === 'video' ? 'video/*' : '.ppt,.pptx,.pdf,.doc,.docx'"
                >
                  <el-button>选择文件</el-button>
                </el-upload>
              </el-form-item>
            </template>

            <!-- 试题表单 -->
            <template v-else>
              <el-form-item label="题型">
                <el-select v-model="uploadForm.questionType" style="width: 100%" @change="handleQuestionTypeChange">
                  <el-option label="单选题" value="single" />
                  <el-option label="多选题" value="multiple" />
                </el-select>
              </el-form-item>
              <el-form-item label="题目内容">
                <el-input v-model="uploadForm.questionContent" type="textarea" :rows="2" placeholder="请输入题目内容" />
              </el-form-item>
              <el-form-item label="选项数量">
                <el-select v-model="optionCount" placeholder="选择选项个数" style="width: 140px">
                  <el-option v-for="n in 8" :key="n" :label="`${n} 个`" :value="n" />
                </el-select>
              </el-form-item>
              <el-form-item label="选项内容">
                <div class="option-list">
                  <div v-for="(opt, idx) in optionItems" :key="idx" class="option-row">
                    <span class="option-letter">{{ optionLetter(idx) }}</span>
                    <el-input v-model="optionItems[idx]" :placeholder="`请输入选项 ${optionLetter(idx)} 内容`" />
                  </div>
                </div>
              </el-form-item>
              <el-form-item label="正确答案">
                <el-select v-if="uploadForm.questionType === 'single'" v-model="questionAnswerSingle" placeholder="请选择正确答案" style="width: 140px">
                  <el-option v-for="(opt, idx) in currentOptions" :key="idx" :label="optionLetter(idx)" :value="optionLetter(idx)" />
                </el-select>
                <el-checkbox-group v-else v-model="questionAnswerMulti">
                  <el-checkbox v-for="(opt, idx) in currentOptions" :key="idx" :label="optionLetter(idx)" />
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="答案解析">
                <el-input v-model="uploadForm.questionAnalysis" type="textarea" :rows="2" placeholder="可选" />
              </el-form-item>
            </template>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="kpDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleKpUpload">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  PriceTag,
  Share,
  Upload,
  VideoCamera,
  VideoPlay,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { getCourses } from '@/api/course'
import { getChapterStructure, getKnowledgeGraph } from '@/api/knowledgeGraph'
import { uploadResource, addQuestion, getMyTeachingCourses } from '@/api/teacher'
import KnowledgeGraphChart from '@/components/knowledge-graph/KnowledgeGraphChart.vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import type { Course } from '@/types/course'
import type { SubTopicVO, KnowledgePointTreeNode, KnowledgeNode, KnowledgeLink, GraphData } from '@/types/knowledgeGraph'

const route = useRoute()
const router = useRouter()
const courseId = computed(() => String(route.params.courseId || ''))
const kpId = computed(() => String(route.params.kpId || ''))

const loading = ref(false)
const graphLoading = ref(false)
const courseName = ref('')
const allCourses = ref<Course[]>([])
const myCourses = ref<Course[]>([])
const subTopics = ref<SubTopicVO[]>([])
const selectedKp = ref<KnowledgePointTreeNode | null>(null)
const selectedKpId = ref('')

const canUpload = computed(() => myCourses.value.some((c) => String(c.id) === courseId.value))

// ===== 图谱 =====
const graphData = ref<GraphData>({ nodes: [], links: [] })

// ===== 视频 =====
const videoDialogVisible = ref(false)
const currentVideo = ref<{ id: number; title: string; filePath: string } | null>(null)

// ===== 上传 =====
const kpDialogVisible = ref(false)
const uploading = ref(false)
const uploadFileList = ref<UploadFile[]>([])
const uploadForm = reactive({
  title: '',
  resourceType: 'video' as 'video' | 'courseware' | 'question',
  file: null as File | null,
  questionType: 'single',
  questionContent: '',
  questionAnalysis: '',
})
const questionAnswerSingle = ref('')
const questionAnswerMulti = ref<string[]>([])
const optionCount = ref(4)
const optionItems = ref<string[]>(['', '', '', ''])
const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const optionLetter = (idx: number) => optionLetters[idx] || String.fromCharCode(65 + idx)
const currentOptions = computed(() => optionLetters.slice(0, optionCount.value))

watch(optionCount, (n) => {
  const arr = [...optionItems.value]
  if (arr.length < n) {
    for (let i = arr.length; i < n; i++) arr.push('')
    optionItems.value = arr
  } else if (arr.length > n) {
    optionItems.value = arr.slice(0, n)
  }
})

// ===== 数据加载 =====
const findKpById = (kp: KnowledgePointTreeNode, id: string): KnowledgePointTreeNode | null => {
  if (kp.id === id) return kp
  for (const child of kp.children) {
    const found = findKpById(child, id)
    if (found) return found
  }
  return null
}

const findKpInTree = (id: string): KnowledgePointTreeNode | null => {
  for (const st of subTopics.value) {
    for (const kp of st.knowledgePoints) {
      const found = findKpById(kp, id)
      if (found) return found
    }
  }
  return null
}

const applyKp = (kp: KnowledgePointTreeNode) => {
  selectedKp.value = kp
  selectedKpId.value = kp.id
  videoDialogVisible.value = false
}

const fetchGraph = async () => {
  graphLoading.value = true
  try {
    const res = await getKnowledgeGraph(Number(courseId.value))
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

const handleGraphNodeClick = (nodeId: string) => {
  const found = findKpInTree(nodeId)
  if (found) {
    applyKp(found)
    return
  }
  ElMessage.warning('图谱节点未关联到课程知识点')
}

// ===== 视频 =====
function getVideoSrc(v: { filePath: string }): string {
  return `/api/resources/videos/stream?path=${encodeURIComponent(v.filePath)}`
}

function playVideo(v: { id: number; title: string; filePath: string }) {
  currentVideo.value = v
  videoDialogVisible.value = true
}

function handleVideoDialogClose() {
  currentVideo.value = null
}

// ===== 上传 =====
const openUploadDialog = () => {
  resetUploadForm()
  kpDialogVisible.value = true
}

const handleQuestionTypeChange = () => {
  questionAnswerSingle.value = ''
  questionAnswerMulti.value = []
}

const handleFileChange = (file: UploadFile) => {
  uploadForm.file = (file.raw as File) ?? null
}

const resetUploadForm = () => {
  uploadForm.title = ''
  uploadForm.resourceType = 'video'
  uploadForm.file = null
  uploadForm.questionType = 'single'
  uploadForm.questionContent = ''
  uploadForm.questionAnalysis = ''
  questionAnswerSingle.value = ''
  questionAnswerMulti.value = []
  optionCount.value = 4
  optionItems.value = ['', '', '', '']
  uploadFileList.value = []
}

const handleKpUpload = async () => {
  if (!selectedKp.value) return
  const courseIdNum = Number(courseId.value)
  const kpIdStr = selectedKp.value.id
  uploading.value = true
  try {
    if (uploadForm.resourceType === 'question') {
      const filledOptions = optionItems.value
        .slice(0, optionCount.value)
        .map((t, i) => `${optionLetter(i)}.${(t || '').trim()}`)
      if (!uploadForm.questionContent) {
        ElMessage.warning('请填写完整的试题信息')
        return
      }
      if (filledOptions.some((o) => o.endsWith('.'))) {
        ElMessage.warning('请填写所有选项内容')
        return
      }
      let answer: string
      if (uploadForm.questionType === 'single') {
        if (!questionAnswerSingle.value) {
          ElMessage.warning('请选择正确答案')
          return
        }
        answer = questionAnswerSingle.value
      } else {
        if (questionAnswerMulti.value.length === 0) {
          ElMessage.warning('请选择正确答案')
          return
        }
        answer = [...questionAnswerMulti.value].sort().join('')
      }
      await addQuestion({
        courseId: courseIdNum,
        knowledgePointId: kpIdStr,
        type: uploadForm.questionType,
        content: uploadForm.questionContent,
        options: JSON.stringify(filledOptions),
        answer,
        analysis: uploadForm.questionAnalysis || undefined,
      })
      ElMessage.success('试题添加成功')
    } else {
      if (!uploadForm.file) {
        ElMessage.warning('请选择文件')
        return
      }
      await uploadResource(
        uploadForm.file,
        courseIdNum,
        kpIdStr,
        uploadForm.title || undefined,
        uploadForm.resourceType,
      )
      ElMessage.success('上传成功')
    }
    kpDialogVisible.value = false
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const goBack = () => {
  router.push('/teacher/hall')
}

onMounted(async () => {
  loading.value = true
  try {
    const [all, mine, subTopicsRes] = await Promise.all([
      getCourses(),
      getMyTeachingCourses(),
      getChapterStructure(Number(courseId.value)),
    ])
    allCourses.value = all
    myCourses.value = mine
    subTopics.value = subTopicsRes
    const found = findKpInTree(kpId.value)
    if (found) {
      applyKp(found)
    }
    const course = all.find((c: Course) => String(c.id) === courseId.value)
    courseName.value = course?.name || ''
    await fetchGraph()
  } catch {
    ElMessage.error('知识点数据加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.kp-detail-page {
  min-height: 100%;
  padding-bottom: 40px;
}

/* ===== 顶部返回栏 ===== */
.page-nav {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  padding: 14px 24px;
  margin: -24px -24px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.back-btn {
  flex-shrink: 0;
}

.nav-path {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  min-width: 0;
}

.course-name {
  color: #8c8c8c;
  white-space: nowrap;
}

.path-sep {
  color: #d9d9d9;
}

.kp-name {
  color: #1890ff;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ===== 知识点信息 ===== */
.kp-info-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  padding: 20px 24px;
  margin-bottom: 20px;
}

.kp-info-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;
}

.kp-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1890ff;
  margin: 0;
}

.upload-btn {
  flex-shrink: 0;
}

.kp-desc {
  font-size: 14px;
  color: #595959;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.kp-desc.muted {
  color: #bfbfbf;
}

/* ===== 内容区块 ===== */
.block-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  padding: 20px 24px;
  margin-bottom: 20px;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px;
}

.block-count {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 400;
}

/* ===== 视频 ===== */
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.resource-card {
  cursor: pointer;
  transition: all 0.2s;
}

.resource-card:hover {
  border-color: #91caff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.video-preview {
  height: 110px;
  background: linear-gradient(135deg, #e6f0ff, #f5f8ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1890ff;
  border-radius: 6px 6px 0 0;
}

.video-info {
  padding: 10px 12px;
}

.video-title {
  font-size: 13px;
  color: #262626;
  margin: 0 0 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-play-hint {
  font-size: 12px;
  color: #1890ff;
}

/* ===== 图谱 ===== */
.graph-container {
  min-height: 360px;
}

.graph-container :deep(svg) {
  width: 100%;
  height: auto;
}

/* ===== 视频弹窗 ===== */
.video-dialog-header {
  font-size: 15px;
  font-weight: 600;
}

.video-dialog-content {
  min-height: 300px;
}

/* ===== 上传弹窗 ===== */
.kp-body {
  max-height: 70vh;
  overflow-y: auto;
}

.option-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.option-letter {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  line-height: 26px;
  text-align: center;
  border-radius: 50%;
  background: #ecf5ff;
  color: #409eff;
  font-weight: 600;
  font-size: 14px;
}
</style>
