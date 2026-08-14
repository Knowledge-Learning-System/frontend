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
    <el-dialog v-model="uploadDialogVisible" title="上传学习资料" width="520px">
      <el-form label-width="90px">
        <el-form-item label="所属课程">
          <el-select v-model="uploadForm.courseId" placeholder="请选择课程" style="width: 100%">
            <el-option v-for="c in courses" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="资料标题">
          <el-input v-model="uploadForm.title" placeholder="可选，默认使用文件名" />
        </el-form-item>
        <el-form-item label="知识点 ID">
          <el-input v-model="uploadForm.knowledgePointId" placeholder="可选" />
        </el-form-item>
        <el-form-item label="文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :file-list="uploadFileList"
            :on-change="handleFileChange"
            :on-remove="() => { uploadForm.file = null }"
          >
            <el-button>选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { getCourses, addCourse, updateCourse, deleteCourse } from '@/api/course'
import type { CoursePayload } from '@/api/course'
import { uploadResource } from '@/api/teacher'
import type { Course } from '@/types/course'

type CourseRow = Course & { source?: string; courseCode?: string }

const courses = ref<CourseRow[]>([])
const loading = ref(false)

const loadCourses = async () => {
  loading.value = true
  try {
    courses.value = (await getCourses()) as CourseRow[]
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
  knowledgePointId: '',
  file: null as File | null,
})

const openUploadDialog = (row?: CourseRow) => {
  uploadForm.courseId = row?.id ?? undefined
  uploadForm.title = ''
  uploadForm.knowledgePointId = ''
  uploadForm.file = null
  uploadFileList.value = []
  uploadDialogVisible.value = true
}

const handleFileChange = (file: UploadFile) => {
  uploadForm.file = (file.raw as File) ?? null
}

const handleUpload = async () => {
  if (!uploadForm.file) {
    ElMessage.warning('请选择文件')
    return
  }
  if (!uploadForm.courseId) {
    ElMessage.warning('请选择所属课程')
    return
  }
  uploading.value = true
  try {
    await uploadResource(
      uploadForm.file,
      uploadForm.courseId,
      uploadForm.knowledgePointId || undefined,
      uploadForm.title || undefined,
    )
    ElMessage.success('上传成功')
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
</style>
