<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">学生管理</h2>
      <el-button type="primary" @click="openImportDialog">Excel 批量导入</el-button>
    </div>

    <el-table :data="students" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="学号" min-width="140" />
      <el-table-column prop="nickname" label="姓名" min-width="120" />
      <el-table-column prop="role" label="角色" width="100" />
      <el-table-column prop="currentCourseId" label="当前课程 ID" width="120" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑学生信息" width="420px">
      <el-form label-width="90px" @submit.prevent>
        <el-form-item label="学号">
          <el-input :model-value="editingStudent?.username" disabled />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="editNickname" placeholder="请输入学生姓名" maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editing" @click="handleSaveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入弹窗 -->
    <el-dialog v-model="importDialogVisible" title="Excel 批量导入学生" width="560px">
      <el-form label-width="90px">
        <el-form-item label="Excel 文件">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            :file-list="importFileList"
            :on-change="handleImportFileChange"
            :on-remove="() => { importFile = null }"
          >
            <el-button>选择文件</el-button>
          </el-upload>
          <el-button class="download-template-btn" link type="primary" @click="handleDownloadTemplate">
            下载导入模板
          </el-button>
        </el-form-item>
        <el-form-item label="关联课程">
          <el-select
            v-model="importCourseId"
            placeholder="必选，导入后加入该课程"
            style="width: 100%"
          >
            <el-option v-for="c in myCourses" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="importResult"
        :type="importResult.failCount > 0 ? 'warning' : 'success'"
        :closable="false"
        class="import-result"
      >
        <p>共 {{ importResult.totalCount }} 条，成功 {{ importResult.successCount }} 条，失败 {{ importResult.failCount }} 条</p>
        <p v-if="importResult.failCount > 0" class="fail-details">
          {{ importResult.failDetails.join('；') }}
        </p>
      </el-alert>

      <template #footer>
        <el-button @click="importDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="importing" @click="handleImport">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { getStudents, importStudents, getMyTeachingCourses, downloadStudentImportTemplate, updateStudent, deleteStudent } from '@/api/teacher'
import type { TeacherStudent, ImportStudentResult } from '@/api/teacher'
import type { Course } from '@/types/course'

const students = ref<TeacherStudent[]>([])
const loading = ref(false)

const loadStudents = async () => {
  loading.value = true
  try {
    students.value = await getStudents()
  } catch {
    ElMessage.error('加载学生列表失败')
  } finally {
    loading.value = false
  }
}

const importDialogVisible = ref(false)
const importing = ref(false)
const importFileList = ref<UploadFile[]>([])
const importFile = ref<File | null>(null)
const importCourseId = ref<number | undefined>(undefined)
const myCourses = ref<Course[]>([])
const importResult = ref<ImportStudentResult | null>(null)

const loadMyCourses = async () => {
  try {
    myCourses.value = await getMyTeachingCourses()
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

const openImportDialog = () => {
  importFile.value = null
  importFileList.value = []
  importCourseId.value = undefined
  importResult.value = null
  loadMyCourses()
  importDialogVisible.value = true
}

const handleImportFileChange = (file: UploadFile) => {
  importFile.value = (file.raw as File) ?? null
}

const handleDownloadTemplate = async () => {
  try {
    await downloadStudentImportTemplate()
    ElMessage.success('模板下载成功')
  } catch {
    ElMessage.error('模板下载失败')
  }
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择 Excel 文件')
    return
  }
  if (!importCourseId.value) {
    ElMessage.warning('请选择要关联的课程')
    return
  }
  importing.value = true
  try {
    importResult.value = await importStudents(importFile.value, importCourseId.value)
    ElMessage.success('导入完成')
    await loadStudents()
  } catch {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

// ---- 编辑学生 ----
const editDialogVisible = ref(false)
const editingStudent = ref<TeacherStudent | null>(null)
const editNickname = ref('')
const editing = ref(false)

const openEditDialog = (row: TeacherStudent) => {
  editingStudent.value = row
  editNickname.value = row.nickname ?? ''
  editDialogVisible.value = true
}

const handleSaveEdit = async () => {
  const nickname = editNickname.value.trim()
  if (!nickname) {
    ElMessage.warning('请输入学生姓名')
    return
  }
  if (!editingStudent.value) return
  editing.value = true
  try {
    await updateStudent(editingStudent.value.id, nickname)
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    await loadStudents()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    editing.value = false
  }
}

// ---- 删除学生 ----
const handleDelete = async (row: TeacherStudent) => {
  try {
    await ElMessageBox.confirm(
      `确定删除学生「${row.nickname || row.username}」（学号 ${row.username}）吗？删除后其选课关联将一并清理，不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await deleteStudent(row.id)
    ElMessage.success('删除成功')
    await loadStudents()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(loadStudents)
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

.import-result {
  margin-top: 8px;
}

.import-result p {
  margin: 0 0 4px;
}

.fail-details {
  font-size: 12px;
  color: #f56c6c;
}
</style>
