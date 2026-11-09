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
        <el-select v-model="filterType" placeholder="全部题型" clearable style="width: 140px">
          <el-option v-for="(label, value) in TYPE_LABELS" :key="value" :label="label" :value="value" />
        </el-select>
        <el-button type="primary" :disabled="!selectedCourseId" @click="openCreate">新增题目</el-button>
      </div>
    </div>

    <el-table :data="filteredQuestions" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="题型" width="110">
        <template #default="{ row }">
          <el-tag :type="typeTagType(row.type)" size="small">{{ TYPE_LABELS[row.type as QuestionType] ?? row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="content" label="题目内容" min-width="240" show-overflow-tooltip />
      <el-table-column label="选项 / 标准答案" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          {{ optionSummary(row) }}
        </template>
      </el-table-column>
      <el-table-column label="知识点" width="130" show-overflow-tooltip>
        <template #default="{ row }">{{ kpLabel(row.knowledgePointId) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增 / 编辑题目 -->
    <el-dialog v-model="dialogVisible" :title="editingQuestion ? '编辑题目' : '新增题目'" width="720px">
      <el-form ref="formRef" :model="questionForm" :rules="questionRules" label-width="90px">
        <el-form-item label="题型" prop="type">
          <el-radio-group v-model="questionForm.type">
            <el-radio-button v-for="(label, value) in TYPE_LABELS" :key="value" :value="value">
              {{ label }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="题目内容" prop="content">
          <el-input
            v-model="questionForm.content"
            type="textarea"
            :rows="3"
            :placeholder="questionForm.type === 'fill' ? '填空处请使用______表示空位' : '请输入题目内容'"
          />
        </el-form-item>

        <!-- 选择题：结构化选项编辑 -->
        <template v-if="isChoiceType(questionForm.type)">
          <el-form-item label="选项" required>
            <div class="options-editor">
              <div v-for="(opt, idx) in optionList" :key="idx" class="option-row">
                <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
                <el-input
                  v-model="optionList[idx]"
                  :placeholder="`选项 ${String.fromCharCode(65 + idx)} 内容`"
                  maxlength="200"
                />
                <el-button
                  link
                  type="danger"
                  :disabled="optionList.length <= 2"
                  @click="removeOption(idx)"
                >
                  删除
                </el-button>
              </div>
              <el-button
                plain
                size="small"
                :disabled="optionList.length >= 8"
                @click="addOption"
              >
                + 添加选项
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="正确答案" prop="answer">
            <el-radio-group v-if="questionForm.type === 'single'" v-model="questionForm.answer">
              <el-radio
                v-for="(opt, idx) in optionList"
                :key="idx"
                :value="String.fromCharCode(65 + idx)"
                :disabled="!opt.trim()"
              >
                {{ String.fromCharCode(65 + idx) }}
              </el-radio>
            </el-radio-group>
            <el-checkbox-group v-else v-model="multipleAnswer">
              <el-checkbox
                v-for="(opt, idx) in optionList"
                :key="idx"
                :value="String.fromCharCode(65 + idx)"
                :disabled="!opt.trim()"
              >
                {{ String.fromCharCode(65 + idx) }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </template>

        <!-- 填空题：标准答案 -->
        <el-form-item v-else-if="questionForm.type === 'fill'" label="标准答案" prop="answer">
          <el-input
            v-model="questionForm.answer"
            placeholder="多个空请用 | 分隔，如：DISTINCT|ORDER BY"
          />
          <div class="form-tip">判分时不区分大小写与首尾空格</div>
        </el-form-item>

        <!-- 问答/编程题：参考答案 -->
        <el-form-item v-else label="参考答案" prop="answer">
          <el-input
            v-model="questionForm.answer"
            type="textarea"
            :rows="4"
            placeholder="请输入参考答案或示例代码（主观题，由教师评分）"
            class="mono-input"
          />
        </el-form-item>

        <el-form-item label="答案解析" prop="analysis">
          <el-input v-model="questionForm.analysis" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="关联知识点" prop="knowledgePointId">
          <div class="kp-picker-wrap">
            <template v-if="questionForm.knowledgePointId">
              <el-tag size="small" type="primary" closable @close="clearKp">
                {{ kpLabel(questionForm.knowledgePointId) }}
              </el-tag>
              <el-button link type="primary" @click="kpDialogVisible = true">重新关联</el-button>
            </template>
            <el-button v-else link type="primary" @click="kpDialogVisible = true">+ 关联知识点</el-button>
          </div>
          <KnowledgeNodePickerDialog
            v-model:visible="kpDialogVisible"
            :course-id="selectedCourseId"
            :model-value="questionForm.knowledgePointId"
            @confirm="handleKpConfirm"
          />
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
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { Course } from '@/types/course'
import { useUserStore } from '@/stores/user'
import { getMyTeachingCourses, listQuestions, addQuestion, updateQuestion, deleteQuestion } from '@/api/teacher'
import type { TeacherQuestion, QuestionPayload } from '@/api/teacher'
import KnowledgeNodePickerDialog from '@/components/KnowledgeNodePickerDialog.vue'
import type { KpNodeOption } from '@/components/KnowledgeNodePickerDialog.vue'

type QuestionType = 'single' | 'multiple' | 'fill' | 'qa'

const TYPE_LABELS: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  fill: '填空题',
  qa: '问答题/编程题',
}

const userStore = useUserStore()

const courses = ref<Course[]>([])
const selectedCourseId = ref<number | undefined>(undefined)
const questions = ref<TeacherQuestion[]>([])
const loading = ref(false)
const filterType = ref<QuestionType | ''>('')

const filteredQuestions = computed(() =>
  filterType.value ? questions.value.filter((q) => q.type === filterType.value) : questions.value,
)

const loadCourses = async () => {
  try {
    courses.value = await getMyTeachingCourses()
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

// ---- 题型工具 ----
const isChoiceType = (type: string) => type === 'single' || type === 'multiple'

const typeTagType = (type: string) => {
  switch (type) {
    case 'single': return 'primary'
    case 'multiple': return 'warning'
    case 'fill': return 'success'
    case 'qa': return 'info'
    default: return 'info'
  }
}

const optionSummary = (row: TeacherQuestion) => {
  if (isChoiceType(row.type)) {
    try {
      const parsed = JSON.parse(row.options || '[]')
      if (Array.isArray(parsed) && parsed.length) {
        return `共 ${parsed.length} 个选项 · 答案 ${row.answer || '-'}`
      }
    } catch { /* ignore */ }
    return row.options || '-'
  }
  if (row.type === 'fill') return `答案：${row.answer || '-'}`
  return '主观题（教师评分）'
}

// 知识点 ID → 名称映射（从树选择时收集，用于列表展示）
const kpLabels = ref<Record<string, string>>({})

const kpDialogVisible = ref(false)

const handleKpConfirm = (node: KpNodeOption) => {
  questionForm.knowledgePointId = node.id
  if (node.id) kpLabels.value[node.id] = node.label
}

const clearKp = () => {
  questionForm.knowledgePointId = ''
}

const kpLabel = (id?: string) => {
  if (!id) return '-'
  return kpLabels.value[id] ?? id
}

// ---- 新增 / 编辑 ----
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

// 结构化选项（仅选择题使用）
const optionList = ref<string[]>(['', '', '', ''])
// 多选题答案（字母数组）
const multipleAnswer = ref<string[]>([])

// 多选题勾选后同步到 questionForm.answer，让表单校验通过
watch(multipleAnswer, (val) => {
  if (questionForm.type === 'multiple') {
    questionForm.answer = [...val].sort().join('')
  }
}, { immediate: true, deep: true })

// 题型切换时清理/恢复答案
watch(() => questionForm.type, (type) => {
  if (type === 'multiple') {
    // 如果已有 answer 字符串，拆成数组
    multipleAnswer.value = (questionForm.answer ?? '').split('').filter((c) => /[A-Z]/.test(c))
    questionForm.answer = [...multipleAnswer.value].sort().join('')
  } else if (type === 'single') {
    // 单选时只保留第一个字母
    const first = (questionForm.answer ?? '').split('').find((c) => /[A-Z]/.test(c))
    questionForm.answer = first ?? ''
    multipleAnswer.value = []
  } else {
    multipleAnswer.value = []
  }
})

const questionRules: FormRules = {
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  answer: [{ required: true, message: '请设置答案', trigger: 'blur' }],
}

const addOption = () => {
  if (optionList.value.length < 8) optionList.value.push('')
}

const removeOption = (idx: number) => {
  if (optionList.value.length <= 2) return
  optionList.value.splice(idx, 1)
}

const resetForm = () => {
  questionForm.courseId = selectedCourseId.value ?? 0
  questionForm.knowledgePointId = ''
  questionForm.type = 'single'
  questionForm.content = ''
  questionForm.options = ''
  questionForm.answer = ''
  questionForm.analysis = ''
  optionList.value = ['', '', '', '']
  multipleAnswer.value = []
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
  questionForm.type = (row.type as QuestionType) ?? 'single'
  questionForm.content = row.content ?? ''
  questionForm.answer = row.answer ?? ''
  questionForm.analysis = row.analysis ?? ''
  // 反解析选项
  optionList.value = ['', '', '', '']
  if (isChoiceType(questionForm.type)) {
    try {
      const parsed = JSON.parse(row.options || '[]')
      if (Array.isArray(parsed) && parsed.length) {
        optionList.value = parsed.map((t: unknown) => String(t))
      }
    } catch { /* ignore */ }
  }
  questionForm.options = row.options ?? ''
  multipleAnswer.value = isChoiceType(questionForm.type)
    ? (row.answer ?? '').split('').filter((c) => /[A-Z]/.test(c))
    : []
  dialogVisible.value = true
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 选择题校验选项内容
  if (isChoiceType(questionForm.type)) {
    const cleaned = optionList.value.map((o) => o.trim())
    if (cleaned.some((o) => !o)) {
      ElMessage.warning('选项内容不能为空，请填写或删除空选项')
      return
    }
    if (cleaned.length < 2) {
      ElMessage.warning('选择题至少需要 2 个选项')
      return
    }
    if (questionForm.type === 'single' && !questionForm.answer) {
      ElMessage.warning('请选择正确答案')
      return
    }
    if (questionForm.type === 'multiple' && multipleAnswer.value.length < 1) {
      ElMessage.warning('多选题请至少勾选一个正确答案')
      return
    }
  }
  if ((questionForm.type === 'fill' || questionForm.type === 'qa') && !questionForm.answer?.trim()) {
    ElMessage.warning('请填写标准/参考答案')
    return
  }

  saving.value = true
  try {
    const answer = questionForm.type === 'multiple'
      ? [...multipleAnswer.value].sort().join('')
      : questionForm.answer
    const options = isChoiceType(questionForm.type)
      ? JSON.stringify(optionList.value.map((o) => o.trim()))
      : ''
    const payload: QuestionPayload = {
      ...questionForm,
      courseId: selectedCourseId.value ?? questionForm.courseId,
      options,
      answer,
    }
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

.options-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.option-letter {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f5f7fa;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}

.kp-picker-wrap {
  width: 100%;
}

.mono-input :deep(textarea) {
  font-family: Consolas, Monaco, 'Courier New', monospace;
}
</style>
