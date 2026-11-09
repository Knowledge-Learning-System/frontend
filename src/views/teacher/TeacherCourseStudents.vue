<template>
  <div class="teacher-page">
    <div class="page-header">
      <h2 class="page-title">选课学生</h2>
      <el-select
        v-model="courseId"
        placeholder="请选择课程"
        style="width: 280px"
        @change="loadStudents"
      >
        <el-option v-for="c in myCourses" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>

    <el-alert
      v-if="courseId && courseName"
      :title="`当前课程：${courseName}`"
      type="info"
      :closable="false"
      class="course-tip"
    />

    <el-table :data="students" v-loading="loading" border stripe>
      <el-table-column prop="studentId" label="ID" width="80" />
      <el-table-column prop="username" label="学号" min-width="140" />
      <el-table-column prop="nickname" label="姓名" min-width="120" />
      <el-table-column prop="progress" label="学习进度" width="140">
        <template #default="{ row }">
          <el-progress :percentage="row.progress" :stroke-width="10" />
        </template>
      </el-table-column>
      <el-table-column prop="selectedAt" label="加入时间" min-width="160" />
    </el-table>

    <el-empty v-if="!loading && courseId && students.length === 0" description="该课程暂无选课学生" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyTeachingCourses } from '@/api/teacher'
import { getCourseStudents } from '@/api/teacherStats'
import type { TeacherCourseStudent } from '@/api/teacherStats'
import type { Course } from '@/types/course'

const myCourses = ref<Course[]>([])
const courseId = ref<number | undefined>(undefined)
const students = ref<TeacherCourseStudent[]>([])
const loading = ref(false)

const courseName = computed(() => myCourses.value.find((c) => c.id === courseId.value)?.name || '')

const loadCourses = async () => {
  try {
    myCourses.value = await getMyTeachingCourses()
    if (myCourses.value.length > 0) {
      courseId.value = myCourses.value[0]!.id
      await loadStudents()
    }
  } catch {
    ElMessage.error('加载课程列表失败')
  }
}

const loadStudents = async () => {
  if (courseId.value == null) return
  loading.value = true
  try {
    students.value = await getCourseStudents(courseId.value)
  } catch {
    ElMessage.error('加载选课学生失败')
  } finally {
    loading.value = false
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

.course-tip {
  margin-bottom: 16px;
}
</style>
