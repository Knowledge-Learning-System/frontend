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
    </el-table>

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
        </el-form-item>
        <el-form-item label="关联课程 ID">
          <el-input v-model="importCourseId" placeholder="可选，批量加入指定课程" />
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
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { getStudents, importStudents } from '@/api/teacher'
import type { TeacherStudent, ImportStudentResult } from '@/api/teacher'

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
const importCourseId = ref('')
const importResult = ref<ImportStudentResult | null>(null)

const openImportDialog = () => {
  importFile.value = null
  importFileList.value = []
  importCourseId.value = ''
  importResult.value = null
  importDialogVisible.value = true
}

const handleImportFileChange = (file: UploadFile) => {
  importFile.value = (file.raw as File) ?? null
}

const handleImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择 Excel 文件')
    return
  }
  importing.value = true
  try {
    const courseId = importCourseId.value ? Number(importCourseId.value) : undefined
    importResult.value = await importStudents(importFile.value, courseId)
    ElMessage.success('导入完成')
    await loadStudents()
  } catch {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
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
