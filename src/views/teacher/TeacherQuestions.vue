<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">题目管理</h2>
      <div class="header-actions">
        <el-select
          v-model="selectedCourseId"
          placeholder="请选择课程"
          style="width: 240px"
          @change="loadQuestions"
        >
          <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
        <el-button type="primary" :disabled="!selectedCourseId" @click="openCreate">新增题目</el-button>
      </div>
    </div>

    <el-table :data="questions" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="题型" width="90">
        <template #default="{ row }">{{ row.type === 'multiple' ? '多选' : '单选' }}</template>
      </el-table-column>
      <el-table-column prop="content" label="题目内容" min-width="240" show-overflow-tooltip />
      <el-table-column prop="options" label="选项" min-width="200" show-overflow-tooltip />
      <el-table-column prop="knowledgePointId" label="知识点 ID" width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 编辑题目 -->
    <el-dialog v-model="dialogVisible" :title="editingQuestion ? '编辑题目' : '新增题目'" width="640px">
      <el-form ref="formRef" :model="questionForm" :rules="questionRules" label-width="90px">
        <el-form-item label="题型" prop="type">
          <el-select v-model="questionForm.type" style="width: 100%">
            <el-option label="单选题" value="single" />
            <el-option label="多选题" value="multiple" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目内容" prop="content">
          <el-input v-model="questionForm.content" type="textarea" :rows="3" placeholder="请输入题目内容" />
        </el-form-item>
        <el-form-item label="选项" prop="options">
          <el-input
            v-model="questionForm.options"
            type="textarea"
            :rows="3"
            placeholder='JSON 数组字符串，如 ["A.xxx","B.xxx","C.xxx","D.xxx"]'
          />
        </el-form-item>
        <el-form-item label="正确答案" prop="answer">
          <el-input v-model="questionForm.answer" placeholder="如 A，多选题如 ABC" />
        </el-form-item>
        <el-form-item label="答案解析" prop="analysis">
          <el-input v-model="questionForm.analysis" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="知识点 ID" prop="knowledgePointId">
          <el-input v-model="questionForm.knowledgePointId" placeholder="可选，关联知识点" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getCourses } from '@/api/course'
import type { Course } from '@/types/course'
import { useUserStore } from '@/stores/user'
import { listQuestions, addQuestion, updateQuestion, deleteQuestion } from '@/api/teacher'
import type { TeacherQuestion, QuestionPayload } from '@/api/teacher'

const userStore = useUserStore()

const courses = ref<Course[]>([])
const selectedCourseId = ref<number | undefined>(undefined)
const questions = ref<TeacherQuestion[]>([])
const loading = ref(false)

const loadCourses = async () => {
  try {
    courses.value = await getCourses()
    const first = courses.value[0]
    if (first && !selectedCourseId.value) {
      selectedCourseId.value = first.id
      await loadQuestions()
    }
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

const loadQuestions = async () => {
  const courseId = selectedCourseId.value
  if (courseId == null) return
  const userId = userStore.userInfo?.id
  if (userId == null) return
  loading.value = true
  try {
    questions.value = await listQuestions(courseId, userId)
  } catch {
    ElMessage.error('加载题目列表失败')
  } finally {
    loading.value = false
  }
}

// 新增 / 编辑
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const editingQuestion = ref<TeacherQuestion | null>(null)
const saving = ref(false)

const questionForm = reactive<QuestionPayload>({
  courseId: 0,
  knowledgePointId: '',
  type: 'single',
  content: '',
  options: '',
  answer: '',
  analysis: '',
})

const questionRules: FormRules = {
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  options: [{ required: true, message: '请输入选项', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }],
}

const resetForm = () => {
  questionForm.courseId = selectedCourseId.value ?? 0
  questionForm.knowledgePointId = ''
  questionForm.type = 'single'
  questionForm.content = ''
  questionForm.options = ''
  questionForm.answer = ''
  questionForm.analysis = ''
}

const openCreate = () => {
  editingQuestion.value = null
  resetForm()
  dialogVisible.value = true
}

const openEdit = (row: TeacherQuestion) => {
  editingQuestion.value = row
  questionForm.courseId = selectedCourseId.value ?? row.courseId ?? 0
  questionForm.knowledgePointId = row.knowledgePointId ?? ''
  questionForm.type = row.type ?? 'single'
  questionForm.content = row.content ?? ''
  questionForm.options = row.options ?? ''
  questionForm.answer = row.answer ?? ''
  questionForm.analysis = row.analysis ?? ''
  dialogVisible.value = true
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: QuestionPayload = { ...questionForm }
    if (editingQuestion.value) {
      await updateQuestion(editingQuestion.value.id, payload)
      ElMessage.success('题目已更新')
    } else {
      await addQuestion(payload)
      ElMessage.success('题目已新增')
    }
    dialogVisible.value = false
    await loadQuestions()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (row: TeacherQuestion) => {
  try {
    await ElMessageBox.confirm(`确定删除题目 #${row.id} 吗？`, '删除确认', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteQuestion(row.id)
    ElMessage.success('题目已删除')
    await loadQuestions()
  } catch {
    ElMessage.error('删除失败')
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
