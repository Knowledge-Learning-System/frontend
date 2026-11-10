<template>
  <div class="admin-system">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">系统管理</span>
          <el-button type="primary" :icon="Refresh" circle size="small" @click="loadData" />
        </div>
      </template>

      <div class="section-title">运行环境</div>
      <el-descriptions v-loading="loading" :column="3" border class="desc-block">
        <el-descriptions-item label="运行模式">{{ data.activeProfiles || 'default' }}</el-descriptions-item>
        <el-descriptions-item label="服务启动时间">{{ data.startTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务器当前时间">{{ data.serverTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Java 版本">{{ data.javaVersion || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ data.osName }} / {{ data.osArch }}</el-descriptions-item>
        <el-descriptions-item label="CPU 核心数">{{ data.cpuCores }}</el-descriptions-item>
        <el-descriptions-item label="JVM 堆上限">{{ data.heapMaxMb }} MB</el-descriptions-item>
        <el-descriptions-item label="JVM 已用堆">{{ data.heapUsedMb }} MB</el-descriptions-item>
        <el-descriptions-item label="已运行时长">{{ data.uptimeHours }} 小时</el-descriptions-item>
      </el-descriptions>

      <div class="section-title">数据库信息</div>
      <el-descriptions :column="3" border class="desc-block">
        <el-descriptions-item label="数据库产品">{{ data.database?.product || '-' }}</el-descriptions-item>
        <el-descriptions-item label="版本" :span="2">{{ data.database?.version || '-' }}</el-descriptions-item>
        <el-descriptions-item label="连接串" :span="3">
          {{ data.database?.url || data.database?.error || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="section-title">角色与权限（RBAC）</div>
      <el-table :data="roleRows" border stripe size="small" class="rbac-table">
        <el-table-column label="角色" width="130">
          <template #default="{ row }">
            <el-tag :type="row.tagType" effect="plain">{{ row.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="当前人数" width="110" align="center" />
        <el-table-column prop="scope" label="可访问端" min-width="160" />
        <el-table-column prop="permissions" label="核心权限" min-width="380" />
      </el-table>

      <div class="section-title">核心数据表</div>
      <el-table :data="tableRows" border stripe size="small">
        <el-table-column prop="name" label="表名" width="240" />
        <el-table-column prop="desc" label="说明" min-width="240" />
        <el-table-column prop="rows" label="记录数" width="140" align="right" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getAdminSystem, getAdminOverview, type AdminSystemData } from '@/api/admin'

const loading = ref(false)
const roleStat = ref<Record<string, number>>({})
const data = ref<AdminSystemData>({
  activeProfiles: '',
  javaVersion: '',
  osName: '',
  osArch: '',
  cpuCores: 0,
  heapMaxMb: 0,
  heapUsedMb: 0,
  uptimeHours: 0,
  startTime: '',
  serverTime: '',
  database: {},
  tableRows: {},
})

const TABLE_DESC: Record<string, string> = {
  user: '用户账号与角色',
  course: '课程主数据',
  user_course: '选课与课程进度',
  video_resource: '视频资源',
  courseware_resource: '课件资源',
  question: '题库',
  homework: '作业',
  discussion: '讨论区主题',
  knowledge_mastery: '知识点掌握度',
  user_answer_record: '答题记录',
  daily_study_record: '学习打卡记录',
}

const roleRows = computed(() => [
  {
    label: '管理员',
    tagType: 'danger',
    count: roleStat.value.admin ?? 0,
    scope: '管理员端（/admin）',
    permissions: '用户管理、角色调整、密码重置、课程总览、知识图谱维护、资源管理、学情分析、系统信息',
  },
  {
    label: '教师',
    tagType: 'warning',
    count: roleStat.value.teacher ?? 0,
    scope: '教师端（/teacher）',
    permissions: '课程与班级管理、作业发布批改、题库维护、学生学情查看、讨论区管理',
  },
  {
    label: '学生',
    tagType: 'primary',
    count: roleStat.value.student ?? 0,
    scope: '学生端（/）',
    permissions: '课程学习、视频与课件、智能问答、作业提交、学习计划、个人学情',
  },
])

const tableRows = computed(() =>
  Object.entries(data.value.tableRows || {}).map(([name, rows]) => ({
    name,
    desc: TABLE_DESC[name] || '-',
    rows,
  }))
)

async function loadData() {
  loading.value = true
  try {
    const [system, overview] = await Promise.all([getAdminSystem(), getAdminOverview()])
    data.value = system
    roleStat.value = overview.roleStat || {}
  } catch (e: any) {
    ElMessage.error(e?.message || '加载系统信息失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 8px 0 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.desc-block {
  margin-bottom: 24px;
}

.rbac-table {
  margin-bottom: 24px;
}
</style>
