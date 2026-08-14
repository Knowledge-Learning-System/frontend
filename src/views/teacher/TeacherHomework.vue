<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">作业管理</h2>
      <div class="header-actions">
        <el-select
          v-model="selectedCourseId"
          placeholder="请选择课程"
          style="width: 240px"
          @change="loadHomeworkList"
        >
          <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button type="primary" :disabled="!selectedCourseId" @click="openCreate">创建作业</el-button>
      </div>
    </div>

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

    <!-- 创建作业 -->
    <el-dialog v-model="createDialogVisible" title="创建作业" width="560px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="作业标题" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入作业标题" />
        </el-form-item>
        <el-form-item label="作业描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="请输入作业描述" />
        </el-form-item>
        <el-form-item label="知识点 ID" prop="knowledgePointId">
          <el-input v-model="createForm.knowledgePointId" placeholder="可选，关联知识点" />
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
import { getCourses } from '@/api/course'
import type { Course } from '@/types/course'
import {
  createHomework,
  publishHomework,
  getHomeworkList,
  getSubmissions,
  gradeSubmission,
} from '@/api/homework'
import type { HomeworkVO, HomeworkSubmissionVO, CreateHomeworkRequest } from '@/api/homework'

const courses = ref<Course[]>([])
const selectedCourseId = ref<number | undefined>(undefined)
const homeworkList = ref<HomeworkVO[]>([])
const loading = ref(false)

const loadCourses = async () => {
  try {
    courses.value = await getCourses()
    const first = courses.value[0]
    if (first && !selectedCourseId.value) {
      selectedCourseId.value = first.id
      await loadHomeworkList()
    }
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

const loadHomeworkList = async () => {
  const courseId = selectedCourseId.value
  if (courseId == null) return
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

const formatTime = (value?: string) => {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

// 创建作业
const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const creating = ref(false)
const createForm = reactive({
  title: '',
  description: '',
  knowledgePointId: '',
  deadline: '',
})

const createRules: FormRules = {
  title: [{ required: true, message: '请输入作业标题', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }],
}

const openCreate = () => {
  createForm.title = ''
  createForm.description = ''
  createForm.knowledgePointId = ''
  createForm.deadline = ''
  createDialogVisible.value = true
}

const handleCreate = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  const courseId = selectedCourseId.value
  if (courseId == null) return
  creating.value = true
  try {
    const payload: CreateHomeworkRequest = {
      courseId,
      knowledgePointId: Number(createForm.knowledgePointId || 0),
      title: createForm.title,
      description: createForm.description,
      deadline: createForm.deadline,
    }
    await createHomework(payload)
    ElMessage.success('作业已创建')
    createDialogVisible.value = false
    await loadHomeworkList()
  } catch {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

const handlePublish = async (row: HomeworkVO) => {
  try {
    await publishHomework(row.id)
    ElMessage.success('已发布')
    await loadHomeworkList()
  } catch {
    ElMessage.error('发布失败')
  }
}

// 提交列表
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

// 评分
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
