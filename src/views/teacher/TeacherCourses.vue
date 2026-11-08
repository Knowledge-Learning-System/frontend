<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">课程管理</h2>
      <div class="header-actions">
        <el-button type="primary" plain @click="openUploadDialog()">上传学习资料</el-button>
        <el-button type="primary" @click="openCreate">添加课程</el-button>
      </div>
    </div>

    <el-table :data="courses" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="课程名称" min-width="160" />
      <el-table-column prop="description" label="课程描述" min-width="220" show-overflow-tooltip />
      <el-table-column prop="source" label="来源" width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="240" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="openUploadDialog(row)">上传资料</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加/编辑课程 -->
    <el-dialog v-model="courseDialogVisible" :title="editingCourse ? '编辑课程' : '添加课程'" width="520px">
      <el-form ref="courseFormRef" :model="courseForm" :rules="courseRules" label-width="90px">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="courseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input v-model="courseForm.description" type="textarea" :rows="3" placeholder="请输入课程描述" />
        </el-form-item>
        <el-form-item label="封面地址" prop="cover">
          <el-input v-model="courseForm.cover" placeholder="可选，封面图片 URL" />
        </el-form-item>
        <el-form-item label="课程来源" prop="source">
          <el-input v-model="courseForm.source" placeholder="可选，关联知识图谱的数据源标识" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSaveCourse">保存</el-button>
      </template>
    </el-dialog>

    <!-- 上传学习资料 -->
    <el-dialog v-model="uploadDialogVisible" title="上传教学资源" width="780px">
      <el-form label-width="90px">
        <el-form-item label="所属课程">
          <el-select v-model="uploadForm.courseId" placeholder="请选择课程" style="width: 100%" @change="handleCourseChange">
            <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择章节">
          <div class="chapter-picker">
            <el-tree
              v-if="uploadForm.courseId"
              ref="chapterTreeRef"
              :data="chapterTreeData"
              :props="{ label: 'label', children: 'children' }"
              node-key="id"
              highlight-current
              default-expand-all
              :expand-on-click-node="false"
              class="chapter-tree"
              @node-click="handleNodeClick"
            />
            <el-empty v-else description="请先选择课程" :image-size="60" />
            <div v-if="selectedNode" class="chapter-selected">
              已选择：<el-tag size="small" type="primary">{{ selectedNode.label }}</el-tag>
            </div>
          </div>
        </el-form-item>
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
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { addCourse, updateCourse, deleteCourse } from '@/api/course'
import type { CoursePayload } from '@/api/course'
import { getMyTeachingCourses, uploadResource, addQuestion } from '@/api/teacher'
import { getChapterStructure } from '@/api/knowledgeGraph'
import type { SubTopicVO } from '@/types/knowledgeGraph'
import type { Course } from '@/types/course'

type CourseRow = Course & { source?: string; courseCode?: string }

const courses = ref<CourseRow[]>([])
const loading = ref(false)

const loadCourses = async () => {
  loading.value = true
  try {
    courses.value = (await getMyTeachingCourses()) as CourseRow[]
  } catch {
    ElMessage.error('加载课程列表失败')
  } finally {
    loading.value = false
  }
}

// 添加 / 编辑课程
const courseDialogVisible = ref(false)
const courseFormRef = ref<FormInstance>()
const editingCourse = ref<CourseRow | null>(null)
const saving = ref(false)

const courseForm = reactive<CoursePayload>({
  name: '',
  description: '',
  cover: '',
  source: '',
})

const courseRules: FormRules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
}

const openCreate = () => {
  editingCourse.value = null
  courseForm.name = ''
  courseForm.description = ''
  courseForm.cover = ''
  courseForm.source = ''
  courseDialogVisible.value = true
}

const openEdit = (row: CourseRow) => {
  editingCourse.value = row
  courseForm.name = row.name
  courseForm.description = row.description || ''
  courseForm.cover = row.cover || ''
  courseForm.source = row.source || ''
  courseDialogVisible.value = true
}

const handleSaveCourse = async () => {
  const valid = await courseFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = { ...courseForm }
    if (editingCourse.value) {
      await updateCourse(editingCourse.value.id, payload)
      ElMessage.success('课程已更新')
    } else {
      await addCourse(payload)
      ElMessage.success('课程已添加')
    }
    courseDialogVisible.value = false
    await loadCourses()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: CourseRow) => {
  try {
    await ElMessageBox.confirm(`确定删除课程「${row.name}」吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteCourse(row.id)
    ElMessage.success('课程已删除')
    await loadCourses()
  } catch {
    ElMessage.error('删除失败')
  }
}

// 上传学习资料
const uploadDialogVisible = ref(false)
const uploading = ref(false)
const uploadFileList = ref<UploadFile[]>([])
const uploadForm = reactive({
  courseId: undefined as number | undefined,
  title: '',
  resourceType: 'video' as 'video' | 'courseware' | 'question',
  file: null as File | null,
  questionType: 'single',
  questionContent: '',
  questionAnalysis: '',
})

// 正确答案：单选（下拉）或多选（勾选），选项来自当前选项字母
const questionAnswerSingle = ref('')
const questionAnswerMulti = ref<string[]>([])
const currentOptions = computed(() => optionLetters.slice(0, optionCount.value))
const handleQuestionTypeChange = () => {
  questionAnswerSingle.value = ''
  questionAnswerMulti.value = []
}

// 选项数量 + 动态选项内容（先选数量，再逐项填写）
const optionCount = ref(4)
const optionItems = ref<string[]>(['', '', '', ''])
const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const optionLetter = (idx: number) => optionLetters[idx] || String.fromCharCode(65 + idx)

watch(optionCount, (n) => {
  const arr = [...optionItems.value]
  if (arr.length < n) {
    for (let i = arr.length; i < n; i++) arr.push('')
    optionItems.value = arr
  } else if (arr.length > n) {
    optionItems.value = arr.slice(0, n)
  }
})

// 章节树（选课程 → 选章节/知识点节点）
interface ChapterTreeNode {
  id: string
  label: string
  isChapter: boolean
  children?: ChapterTreeNode[]
}

const chapterTreeRef = ref()
const chapterTreeData = ref<ChapterTreeNode[]>([])
const selectedNode = ref<ChapterTreeNode | null>(null)

const buildChapterTree = (subTopics: SubTopicVO[]): ChapterTreeNode[] => {
  const buildKp = (kp: SubTopicVO['knowledgePoints'][number]): ChapterTreeNode => ({
    id: kp.id,
    label: kp.name,
    isChapter: false,
    children: kp.children?.length ? kp.children.map(buildKp) : undefined,
  })
  return subTopics.map((st) => ({
    id: st.id,
    label: st.name,
    isChapter: true,
    children: st.knowledgePoints?.length ? st.knowledgePoints.map(buildKp) : undefined,
  }))
}

const handleCourseChange = async () => {
  selectedNode.value = null
  chapterTreeData.value = []
  if (!uploadForm.courseId) return
  try {
    const data = await getChapterStructure(uploadForm.courseId)
    chapterTreeData.value = buildChapterTree(data)
  } catch {
    ElMessage.error('加载章节结构失败')
  }
}

const handleNodeClick = (node: ChapterTreeNode) => {
  selectedNode.value = node
}

const openUploadDialog = (row?: CourseRow) => {
  uploadForm.courseId = row?.id ?? undefined
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
  selectedNode.value = null
  chapterTreeData.value = []
  uploadDialogVisible.value = true
  if (uploadForm.courseId) {
    handleCourseChange()
  }
}

const handleFileChange = (file: UploadFile) => {
  uploadForm.file = (file.raw as File) ?? null
}

const handleUpload = async () => {
  if (!uploadForm.courseId) {
    ElMessage.warning('请选择所属课程')
    return
  }
  if (!selectedNode.value) {
    ElMessage.warning('请选择要添加资源的章节或知识点')
    return
  }
  const nodeId = selectedNode.value.id
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
        courseId: uploadForm.courseId,
        knowledgePointId: nodeId,
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
        uploadForm.courseId,
        nodeId,
        uploadForm.title || undefined,
        uploadForm.resourceType,
      )
      ElMessage.success('上传成功')
    }
    uploadDialogVisible.value = false
  } catch {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

onMounted(loadCourses)
</script>

<style scoped>
.teacher-page {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.chapter-picker {
  width: 100%;
}

.chapter-tree {
  width: 100%;
  max-height: 380px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.chapter-selected {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
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
