<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">作业管理</h2>
    </div>

    <!-- 我的课程列表 -->
    <el-table :data="courses" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="name" label="课程名称" min-width="160" />
      <el-table-column prop="description" label="课程描述" min-width="220" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openCreate(row)">添加作业</el-button>
          <el-button link type="primary" @click="openHomeworkList(row)">查看作业</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加作业 -->
    <el-dialog v-model="createDialogVisible" title="添加作业" width="720px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="所属课程" prop="courseId">
          <el-select v-model="createForm.courseId" placeholder="请选择课程" style="width: 100%" @change="handleCourseChange">
            <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择知识点">
          <div class="chapter-picker">
            <el-tree
              v-if="createForm.courseId"
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
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入作业标题" />
        </el-form-item>
        <el-form-item label="作业描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请输入作业描述" />
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="createForm.deadline"
            type="datetime"
            placeholder="请选择截止时间"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 作业列表（按课程） -->
    <el-dialog v-model="listDialogVisible" :title="`作业列表 - ${currentCourse?.name ?? ''}`" width="860px">
      <el-table :data="homeworkList" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="title" label="作业标题" min-width="160" />
        <el-table-column prop="description" label="作业描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="截止时间" width="170">
          <template #default="{ row }">{{ formatTime(row.deadline) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="submissionCount" label="提交数" width="90" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handlePublish(row)">发布</el-button>
            <el-button link type="primary" @click="openSubmissions(row)">查看提交</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 提交列表 -->
    <el-dialog v-model="submissionDialogVisible" :title="`提交列表 - ${currentHomework?.title ?? ''}`" width="760px">
      <el-table :data="submissions" v-loading="submissionLoading" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="学生" width="120" />
        <el-table-column prop="content" label="提交内容" min-width="180" show-overflow-tooltip />
        <el-table-column prop="score" label="分数" width="80" />
        <el-table-column prop="feedback" label="反馈" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openGrade(row)">评分</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 评分 -->
    <el-dialog v-model="gradeDialogVisible" title="评分" width="440px" append-to-body>
      <el-form label-width="70px">
        <el-form-item label="分数">
          <el-input-number v-model="gradeForm.score" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="反馈">
          <el-input v-model="gradeForm.feedback" type="textarea" :rows="3" placeholder="可选，填写评语" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="gradeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="grading" @click="handleGrade">提交评分</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Course } from '@/types/course'
import { getMyTeachingCourses } from '@/api/teacher'
import { getChapterStructure } from '@/api/knowledgeGraph'
import type { SubTopicVO } from '@/types/knowledgeGraph'
import {
  createHomework,
  publishHomework,
  getHomeworkList,
  getSubmissions,
  gradeSubmission,
} from '@/api/homework'
import type { HomeworkVO, HomeworkSubmissionVO, CreateHomeworkRequest } from '@/api/homework'

const courses = ref<Course[]>([])
const loading = ref(false)

const loadCourses = async () => {
  loading.value = true
  try {
    courses.value = await getMyTeachingCourses()
  } catch {
    ElMessage.error('加载课程列表失败')
  } finally {
    loading.value = false
  }
}

// ---- 章节知识点树 ----
interface ChapterTreeNode {
  id: string
  label: string
  isChapter: boolean
  children?: ChapterTreeNode[]
}

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
  if (!createForm.courseId) return
  try {
    const data = await getChapterStructure(createForm.courseId)
    chapterTreeData.value = buildChapterTree(data)
  } catch {
    ElMessage.error('加载章节结构失败')
  }
}

const handleNodeClick = (node: ChapterTreeNode) => {
  selectedNode.value = node
}

// ---- 创建作业 ----
const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const creating = ref(false)
const createForm = reactive({
  courseId: undefined as number | undefined,
  title: '',
  description: '',
  deadline: '',
})

const createRules: FormRules = {
  courseId: [{ required: true, message: '请选择课程', trigger: 'change' }],
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
}

const openCreate = (row: Course) => {
  createForm.courseId = row.id
  createForm.title = ''
  createForm.description = ''
  createForm.deadline = ''
  selectedNode.value = null
  chapterTreeData.value = []
  createDialogVisible.value = true
  handleCourseChange()
}

const handleCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!createForm.courseId) return
  if (!selectedNode.value) {
    ElMessage.warning('请选择要关联的章节或知识点')
    return
  }
  creating.value = true
  try {
    const payload: CreateHomeworkRequest = {
      courseId: createForm.courseId,
      knowledgePointId: Number(selectedNode.value.id),
      title: createForm.title,
      description: createForm.description,
      deadline: createForm.deadline,
    }
    await createHomework(payload)
    ElMessage.success('作业已创建')
    createDialogVisible.value = false
  } catch {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

// ---- 作业列表（按课程） ----
const listDialogVisible = ref(false)
const currentCourse = ref<Course | null>(null)
const homeworkList = ref<HomeworkVO[]>([])

const openHomeworkList = async (row: Course) => {
  currentCourse.value = row
  listDialogVisible.value = true
  await loadHomeworkList(row.id)
}

const loadHomeworkList = async (courseId: number) => {
  loading.value = true
  try {
    const data = await getHomeworkList(courseId)
    homeworkList.value = data ?? []
  } catch {
    ElMessage.error('加载作业列表失败')
  } finally {
    loading.value = false
  }
}

const handlePublish = async (row: HomeworkVO) => {
  try {
    await publishHomework(row.id)
    ElMessage.success('已发布')
    if (currentCourse.value) {
      await loadHomeworkList(currentCourse.value.id)
    }
  } catch {
    ElMessage.error('发布失败')
  }
}

const formatTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

// ---- 提交列表 ----
const submissionDialogVisible = ref(false)
const submissionLoading = ref(false)
const submissions = ref<HomeworkSubmissionVO[]>([])
const currentHomework = ref<HomeworkVO | null>(null)

const openSubmissions = async (row: HomeworkVO) => {
  currentHomework.value = row
  submissionDialogVisible.value = true
  submissionLoading.value = true
  try {
    const data = await getSubmissions(row.id)
    submissions.value = data ?? []
  } catch {
    ElMessage.error('加载提交列表失败')
  } finally {
    submissionLoading.value = false
  }
}

// ---- 评分 ----
const gradeDialogVisible = ref(false)
const grading = ref(false)
const gradeTarget = ref<HomeworkSubmissionVO | null>(null)
const gradeForm = reactive({ score: 0, feedback: '' })

const openGrade = (row: HomeworkSubmissionVO) => {
  gradeTarget.value = row
  gradeForm.score = row.score ?? 0
  gradeForm.feedback = row.feedback ?? ''
  gradeDialogVisible.value = true
}

const handleGrade = async () => {
  if (!gradeTarget.value) return
  grading.value = true
  try {
    await gradeSubmission(gradeTarget.value.id, gradeForm.score, gradeForm.feedback)
    ElMessage.success('评分已提交')
    gradeDialogVisible.value = false
    if (currentHomework.value) {
      await openSubmissions(currentHomework.value)
    }
  } catch {
    ElMessage.error('评分失败')
  } finally {
    grading.value = false
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

.chapter-picker {
  width: 100%;
}

.chapter-tree {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
  width: 100%;
}

.chapter-selected {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}
</style>
