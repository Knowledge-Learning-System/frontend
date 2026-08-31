<template>
  <div class="course-hall-page">
    <!-- 课程大厅 Hero -->
    <section class="hero-section">
      <div class="hero-content">
        <p class="hero-label">融合学科知识图谱与大语言模型的高校个性化在线学习系统</p>
        <h1 class="hero-title">课程大厅</h1>
      </div>
    </section>

    <!-- 工具栏：搜索 -->
    <section class="toolbar-section">
      <div class="section-title-bar all-courses-bar">
        <h2 class="section-title">
          <el-icon><Collection /></el-icon>
          全部课程
        </h2>
        <span class="course-count">共 {{ filteredCourses.length }} 门课程</span>
      </div>
      <el-input
        v-model="searchKeyword"
        placeholder="搜索课程名称或描述"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </section>

    <!-- 课程卡片网格 -->
    <section class="courses-section">
      <div class="course-grid" v-loading="loading">
        <el-empty
          v-if="!loading && filteredCourses.length === 0"
          description="暂无课程"
        />
        <div
          v-for="course in filteredCourses"
          :key="course.id"
          class="course-card"
          @click="openDetail(course)"
        >
          <!-- 封面 -->
          <div class="card-cover">
            <div class="cover-placeholder">
              <el-icon :size="48"><Reading /></el-icon>
            </div>
            <span class="cover-badge">{{ getCourseCode(course.name) }}</span>
          </div>

          <!-- 内容 -->
          <div class="card-body">
            <h3 class="card-name">{{ course.name }}</h3>
            <p class="card-desc">{{ course.description || '系统学习核心概念与实践方法' }}</p>
            <div class="card-meta">
              <span class="meta-item">
                <el-icon :size="14"><User /></el-icon>
                {{ course.instructor || '未知教师' }}
              </span>
              <span class="meta-item">
                <el-icon :size="14"><Collection /></el-icon>
                点击查看章节
              </span>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="card-footer">
            <el-button type="primary" class="enter-btn" @click.stop="openDetail(course)">
              查看课程
              <el-icon class="enter-arrow"><ArrowRight /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- 课程详情弹窗（只读：章节树） -->
    <el-dialog
      v-model="showDetail"
      :title="selectedCourse ? selectedCourse.name : ''"
      width="720px"
      class="course-detail-dialog"
      destroy-on-close
    >
      <div v-if="selectedCourse" class="detail-body" v-loading="detailLoading">
        <div class="detail-head">
          <div class="detail-code">{{ getCourseCode(selectedCourse.name) }}</div>
          <div class="detail-meta">
            <span>授课教师：{{ selectedCourse.instructor || '未知' }}</span>
          </div>
        </div>
        <p class="detail-desc">{{ selectedCourse.description || '暂无课程简介' }}</p>

        <div class="detail-chapters">
          <h4 class="detail-chapters-title">
            <el-icon><Share /></el-icon>
            章节结构
          </h4>
          <el-empty
            v-if="!detailLoading && chapterTree.length === 0"
            description="暂无章节数据"
          />
          <el-tree
            v-else
            :data="chapterTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            default-expand-all
            class="chapter-tree"
            @node-click="handleTreeNodeClick"
          >
            <template #default="{ data }">
              <span class="tree-node" :class="{ 'kp-node': data.kp }">
                <el-icon v-if="data.kp" :size="13"><PriceTag /></el-icon>
                <el-icon v-else :size="13"><FolderOpened /></el-icon>
                <span>{{ data.name }}</span>
                <el-icon v-if="data.kp" :size="12" class="kp-enter"><ArrowRight /></el-icon>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 知识点详情弹窗（含上传学习资源） -->
    <el-dialog
      v-model="kpDialogVisible"
      :title="selectedKp ? `知识点：${selectedKp.name}` : ''"
      width="760px"
      class="kp-detail-dialog"
      destroy-on-close
    >
      <div v-if="selectedKp" class="kp-body">
        <div class="kp-info">
          <div class="kp-info-title">
            <el-icon><PriceTag /></el-icon>
            {{ selectedKp.name }}
          </div>
          <p class="kp-info-desc">{{ selectedKp.description || '暂无知识点描述' }}</p>
        </div>

        <div class="kp-upload">
          <h4 class="kp-upload-title">
            <el-icon><Upload /></el-icon>
            上传学习资源
          </h4>
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
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Collection,
  FolderOpened,
  PriceTag,
  Reading,
  Search,
  Share,
  Upload,
  User,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { getCourses } from '@/api/course'
import { getChapterStructure } from '@/api/knowledgeGraph'
import { uploadResource, addQuestion, getMyTeachingCourses } from '@/api/teacher'
import type { Course } from '@/types/course'
import type { SubTopicVO, KnowledgePointTreeNode } from '@/types/knowledgeGraph'

const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const allCourses = ref<Course[]>([])
const myCourses = ref<Course[]>([])

// 当前教师负责的课程 id 集合，用于控制上传资源权限
const myCourseIds = computed(() => new Set(myCourses.value.map((c) => c.id)))

const showDetail = ref(false)
const selectedCourse = ref<Course | null>(null)
const detailLoading = ref(false)
const chapterTree = ref<Array<{ id: string; name: string; kp?: boolean; children: any[] }>>([])

// 知识点详情 + 上传学习资源
const kpDialogVisible = ref(false)
const selectedKp = ref<{ id: string; name: string; description?: string } | null>(null)
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

const filteredCourses = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return allCourses.value
  return allCourses.value.filter(
    (c) =>
      c.name.toLowerCase().includes(keyword) ||
      (c.description && c.description.toLowerCase().includes(keyword)),
  )
})

const getCourseCode = (name: string): string => {
  const map: Record<string, string> = {
    '软件工程': 'CS3001',
    '数据结构与算法': 'CS2001',
    '数据库原理': 'CS2003',
    '计算机网络': 'CS3002',
    'Python科学计算': 'CS4001',
    '开源大数据技术': 'CS4002',
    '机器学习与AI': 'CS4003',
  }
  return map[name] || `CS${String(name.charCodeAt(0) % 10000)}`
}

const buildTree = (subTopics: SubTopicVO[]) => {
  const buildKp = (kp: KnowledgePointTreeNode): any => ({
    id: kp.id,
    name: kp.name,
    description: kp.description,
    kp: true,
    children: (kp.children || []).map(buildKp),
  })
  return subTopics.map((st) => ({
    id: st.id,
    name: st.name,
    children: (st.knowledgePoints || []).map(buildKp),
  }))
}

const openDetail = async (course: Course) => {
  selectedCourse.value = course
  showDetail.value = true
  detailLoading.value = true
  chapterTree.value = []
  try {
    const subTopics = await getChapterStructure(course.id)
    chapterTree.value = buildTree(subTopics)
  } catch (_e) {
    chapterTree.value = []
    ElMessage.warning('章节结构加载失败，请稍后重试')
  } finally {
    detailLoading.value = false
  }
}

// 点击章节树节点：仅知识点节点可进入该知识点课程页面（查看视频与图谱）
const handleTreeNodeClick = (data: { id: string; name: string; kp?: boolean; description?: string }) => {
  if (!data.kp || !selectedCourse.value) return
  router.push(`/teacher/knowledge/${selectedCourse.value.id}/${data.id}`)
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
  if (!selectedCourse.value || !selectedKp.value) return
  const courseId = selectedCourse.value.id
  const kpId = selectedKp.value.id
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
        courseId,
        knowledgePointId: kpId,
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
        courseId,
        kpId,
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

onMounted(async () => {
  loading.value = true
  try {
    const [all, mine] = await Promise.all([getCourses(), getMyTeachingCourses()])
    allCourses.value = all
    myCourses.value = mine
  } catch (_e) {
    ElMessage.error('课程列表加载失败')
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.course-hall-page {
  min-height: 100%;
}

/* ========== Hero ========== */
.hero-section {
  background: #fff;
  padding: 28px 24px;
  margin: -24px -24px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.hero-label {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 8px;
}

.hero-title {
  font-size: 26px;
  font-weight: 700;
  color: #262626;
  margin: 0 0 8px;
}

.hero-subtitle {
  font-size: 14px;
  color: #595959;
  margin: 0;
}

.section-title-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

/* ========== 工具栏 ========== */
.toolbar-section {
  max-width: 1200px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: relative;
}

.all-courses-bar {
  flex: 1;
  margin-bottom: 0;
}

.course-count {
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
}

.search-input {
  max-width: 360px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* ========== 课程卡片 ========== */
.courses-section {
  padding-bottom: 40px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 160px;
}

.course-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #91caff;
}

.card-cover {
  position: relative;
  height: 150px;
  background: linear-gradient(135deg, #e6f0ff, #f0f5ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-placeholder {
  color: #1890ff;
  opacity: 0.4;
}

.cover-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 2px 8px;
  background: #1890ff;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}

.card-body {
  padding: 16px 16px 12px;
  flex: 1;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 6px;
  transition: color 0.2s;
}

.course-card:hover .card-name {
  color: #1890ff;
}

.card-desc {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #bfbfbf;
}

.card-footer {
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
  background: #fafafa;
}

.enter-btn {
  width: 100%;
  height: 36px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.enter-arrow {
  transition: transform 0.2s;
}

.enter-btn:hover .enter-arrow {
  transform: translateX(3px);
}

/* ========== 详情弹窗 ========== */
.detail-body {
  min-height: 120px;
}

.detail-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.detail-code {
  padding: 2px 10px;
  background: #1890ff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
}

.detail-meta {
  font-size: 13px;
  color: #595959;
}

.detail-desc {
  font-size: 14px;
  color: #595959;
  line-height: 1.6;
  margin: 0 0 16px;
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.detail-chapters-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 12px;
}

.chapter-tree {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  padding: 12px;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.kp-node {
  cursor: pointer;
  color: #1890ff;
  transition: color 0.2s;
}

.kp-node:hover {
  color: #40a9ff;
}

.kp-enter {
  opacity: 0;
  transition: opacity 0.2s;
}

.kp-node:hover .kp-enter {
  opacity: 1;
}

/* ========== 知识点详情弹窗 ========== */
.kp-body {
  max-height: 70vh;
  overflow-y: auto;
}

.kp-info {
  padding: 14px 16px;
  background: #f6f9ff;
  border: 1px solid #e3edff;
  border-radius: 8px;
  margin-bottom: 16px;
}

.kp-info-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.kp-info-desc {
  font-size: 13px;
  color: #595959;
  line-height: 1.6;
  margin: 0;
}

.kp-upload-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  margin: 0 0 16px;
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
