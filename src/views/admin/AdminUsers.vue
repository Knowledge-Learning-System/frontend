<template>
  <div class="admin-users">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户管理</span>
          <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-bar">
        <el-select v-model="query.role" placeholder="全部角色" clearable class="filter-item">
          <el-option label="学生" value="student" />
          <el-option label="教师" value="teacher" />
          <el-option label="管理员" value="admin" />
        </el-select>
        <el-input
          v-model="query.keyword"
          placeholder="账号 / 昵称"
          clearable
          class="filter-item"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <span class="stat-text">
          共 {{ total }} 人（学生 {{ roleStat.student ?? 0 }} · 教师 {{ roleStat.teacher ?? 0 }} · 管理员
          {{ roleStat.admin ?? 0 }}）
        </span>
      </div>

      <el-table v-loading="loading" :data="users" border stripe class="user-table">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="账号" min-width="130" />
        <el-table-column label="昵称" min-width="120">
          <template #default="{ row }">{{ row.nickname || '-' }}</template>
        </el-table-column>
        <el-table-column label="角色" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" effect="plain">{{ roleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="courseCount" label="选课数" width="90" align="center" />
        <el-table-column label="注册时间" width="150">
          <template #default="{ row }">{{ row.createTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openPasswordDialog(row)">重置密码</el-button>
            <el-button link type="warning" @click="openRoleDialog(row)">改角色</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && users.length === 0" description="暂无用户数据" />

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          background
          @current-change="loadData"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 重置密码 -->
    <el-dialog v-model="passwordDialogVisible" title="重置密码" width="420px">
      <el-form label-width="90px">
        <el-form-item label="账号">
          <span>{{ activeUser?.username }}</span>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="newPassword" placeholder="请输入不少于6位的新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleResetPassword">确定</el-button>
      </template>
    </el-dialog>

    <!-- 修改角色 -->
    <el-dialog v-model="roleDialogVisible" title="修改用户角色" width="420px">
      <el-form label-width="90px">
        <el-form-item label="账号">
          <span>{{ activeUser?.username }}</span>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newRole" placeholder="请选择角色" class="full-width">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdateRole">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  getAdminUsers,
  resetUserPassword,
  updateUserRole,
  type AdminUserRow,
} from '@/api/admin'

const loading = ref(false)
const submitting = ref(false)
const users = ref<AdminUserRow[]>([])
const total = ref(0)
const roleStat = ref<Record<string, number>>({})

const query = reactive({
  role: '',
  keyword: '',
  page: 1,
  size: 10,
})

const activeUser = ref<AdminUserRow | null>(null)

const passwordDialogVisible = ref(false)
const newPassword = ref('')

const roleDialogVisible = ref(false)
const newRole = ref('')

const roleLabel = (role: string) => {
  if (role === 'admin') return '管理员'
  if (role === 'teacher') return '教师'
  return '学生'
}

const roleTagType = (role: string) => {
  if (role === 'admin') return 'danger'
  if (role === 'teacher') return 'warning'
  return 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await getAdminUsers({
      role: query.role || undefined,
      keyword: query.keyword || undefined,
      page: query.page,
      size: query.size,
    })
    users.value = data.records ?? []
    total.value = data.total ?? 0
    roleStat.value = data.roleStat ?? {}
  } catch {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  query.page = 1
  loadData()
}

const handleReset = () => {
  query.role = ''
  query.keyword = ''
  query.page = 1
  loadData()
}

const handleSizeChange = () => {
  query.page = 1
  loadData()
}

const openPasswordDialog = (row: AdminUserRow) => {
  activeUser.value = row
  newPassword.value = ''
  passwordDialogVisible.value = true
}

const handleResetPassword = async () => {
  if (!activeUser.value) return
  if (newPassword.value.length < 6) {
    ElMessage.warning('密码长度不能少于 6 位')
    return
  }
  submitting.value = true
  try {
    await resetUserPassword(activeUser.value.id, newPassword.value)
    ElMessage.success('密码已重置')
    passwordDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '重置密码失败')
  } finally {
    submitting.value = false
  }
}

const openRoleDialog = (row: AdminUserRow) => {
  activeUser.value = row
  newRole.value = row.role
  roleDialogVisible.value = true
}

const handleUpdateRole = async () => {
  if (!activeUser.value || !newRole.value) return
  submitting.value = true
  try {
    await updateUserRole(activeUser.value.id, newRole.value)
    ElMessage.success('角色已更新')
    roleDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '修改角色失败')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-users {
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

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.filter-item {
  width: 180px;
}

.stat-text {
  margin-left: auto;
  font-size: 13px;
  color: #909399;
}

.user-table {
  width: 100%;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.full-width {
  width: 100%;
}
</style>
