<template>
  <div class="admin-teacher-courses">
    <!-- 教师-课程分配总览 -->
    <el-card shadow="never" class="overview-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">教师-课程分配总览</span>
          <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="teachers"
        border
        stripe
        class="teacher-table"
      >
        <el-table-column type="index" label="序号" width="70" align="center" />
        <el-table-column prop="teacherId" label="教师ID" width="90" align="center" />
        <el-table-column prop="teacherUsername" label="账号" min-width="120" />
        <el-table-column prop="teacherName" label="教师姓名" min-width="120" />
        <el-table-column label="负责课程" min-width="320">
          <template #default="{ row }">
            <div v-if="row.courses && row.courses.length" class="course-tags">
              <el-tag
                v-for="course in row.courses"
                :key="course.id"
                type="info"
                effect="plain"
                class="course-tag"
              >
                {{ course.name }}（{{ course.courseCode }}）
              </el-tag>
            </div>
            <el-tag v-else type="warning" effect="plain">未分配课程</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && teachers.length === 0" description="暂无教师数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getTeacherCourses, type TeacherCourseVO } from '@/api/admin'

const loading = ref(false)
const teachers = ref<TeacherCourseVO[]>([])

const loadData = async () => {
  loading.value = true
  try {
    teachers.value = await getTeacherCourses()
  } catch {
    ElMessage.error('加载教师课程分配数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-teacher-courses {
  padding: 4px;
}

.overview-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.teacher-table {
  width: 100%;
}

.course-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.course-tag {
  margin-right: 0;
}
</style>
