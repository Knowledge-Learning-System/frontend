<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">预警学生识别</h2>
      <el-select
        v-model="courseId"
        placeholder="请选择课程"
        style="width: 280px"
        @change="loadWarnings"
      >
        <el-option v-for="c in myCourses" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>

    <el-alert
      type="warning"
      :closable="false"
      title="预警规则：学习进度低于 30% 或薄弱知识点不少于 3 个的学生将被标记。"
      class="rule-tip"
    />

    <el-table :data="warnings" v-loading="loading" border stripe>
      <el-table-column prop="studentId" label="ID" width="80" />
      <el-table-column prop="username" label="学号" min-width="130" />
      <el-table-column prop="nickname" label="姓名" min-width="110" />
      <el-table-column prop="progress" label="学习进度" width="140">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" :stroke-width="10" :status="row.progress < 30 ? 'exception' : ''" />
        </template>
      </el-table-column>
      <el-table-column prop="weakPointCount" label="薄弱点数" width="100" />
      <el-table-column label="预警原因" min-width="220">
        <template #default="{ row }">
          <el-tag
            v-for="reason in row.reasons"
            :key="reason"
            type="danger"
            size="small"
            class="reason-tag"
          >
            {{ reason }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="goStudentHome(row.studentId)">
            进入主页
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && courseId && warnings.length === 0" description="当前课程暂无预警学生" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMyTeachingCourses } from '@/api/teacher'
import { getWarningStudents } from '@/api/teacherStats'
import type { WarningStudent } from '@/api/teacherStats'
import type { Course } from '@/types/course'

const router = useRouter()

const myCourses = ref<Course[]>([])
const courseId = ref<number | undefined>(undefined)
const warnings = ref<WarningStudent[]>([])
const loading = ref(false)

const loadCourses = async () => {
  try {
    myCourses.value = await getMyTeachingCourses()
    if (myCourses.value.length > 0) {
      courseId.value = myCourses.value[0]!.id
      await loadWarnings()
    }
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

const loadWarnings = async () => {
  if (courseId.value == null) return
  loading.value = true
  try {
    warnings.value = await getWarningStudents(courseId.value)
  } catch {
    ElMessage.error('加载预警学生失败')
  } finally {
    loading.value = false
  }
}

const goStudentHome = (studentId: number) => {
  router.push({ path: `/teacher/student/${studentId}`, query: { courseId: String(courseId.value ?? '') } })
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

.rule-tip {
  margin-bottom: 16px;
}

.reason-tag {
  margin-right: 6px;
  margin-bottom: 4px;
}
</style>
