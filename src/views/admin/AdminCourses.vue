<template>
  <div class="admin-courses">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">课程总览</span>
          <div class="header-right">
            <span class="stat-text">共 {{ courses.length }} 门课程 · 选课 {{ totalStudents }} 人次</span>
            <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="courses" border stripe class="course-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="课程名称" min-width="200" />
        <el-table-column label="课程编号" width="110" align="center">
          <template #default="{ row }">{{ row.courseCode || '-' }}</template>
        </el-table-column>
        <el-table-column label="授课教师" width="130">
          <template #default="{ row }">
            <span v-if="row.teacherName">{{ row.teacherName }}</span>
            <el-tag v-else type="warning" effect="plain">未分配</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentCount" label="选课人数" width="100" align="center" />
        <el-table-column label="图谱标识" width="130">
          <template #default="{ row }">{{ row.source || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain">
              {{ row.status === 1 ? '已上线' : '未上线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="150">
          <template #default="{ row }">{{ row.createTime || '-' }}</template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && courses.length === 0" description="暂无课程数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAdminCourses, type AdminCourseRow } from '@/api/admin'

const loading = ref(false)
const courses = ref<AdminCourseRow[]>([])

const totalStudents = computed(() =>
  courses.value.reduce((sum, item) => sum + (item.studentCount ?? 0), 0),
)

const loadData = async () => {
  loading.value = true
  try {
    courses.value = await getAdminCourses()
  } catch {
    ElMessage.error('加载课程总览数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-courses {
  padding: 4px;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-text {
  font-size: 13px;
  color: #909399;
}

.course-table {
  width: 100%;
}
</style>
