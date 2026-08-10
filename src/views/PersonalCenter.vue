<template>
  <div class="personal-center-page">
    <!-- 页头 -->
    <section class="hero-section">
      <div class="hero-content">
        <p class="hero-label">个人中心</p>
        <h1 class="hero-title">账号设置与学习数据</h1>
        <p class="hero-subtitle">查看学习统计，管理个人信息</p>
      </div>
    </section>

    <!-- 个人信息卡片 -->
    <section class="profile-section">
      <el-card class="profile-card" shadow="never">
        <div class="profile-main">
          <div class="profile-avatar-wrap">
            <el-avatar :size="72" class="profile-avatar">
              {{ userInitial }}
            </el-avatar>
          </div>
          <div class="profile-info">
            <h2 class="profile-name">{{ displayName }}</h2>
            <div class="profile-meta">
              <el-tag size="small" effect="plain" type="primary">
                {{ roleLabel }}
              </el-tag>
              <span class="profile-id">ID: {{ userStore.userInfo?.id || '-' }}</span>
            </div>
            <div class="profile-tags" v-if="userStore.userInfo?.grade || userStore.userInfo?.major">
              <span v-if="userStore.userInfo?.grade" class="profile-tag-item">
                <el-icon :size="14"><School /></el-icon>
                {{ userStore.userInfo.grade }}
              </span>
              <span v-if="userStore.userInfo?.major" class="profile-tag-item">
                <el-icon :size="14"><Collection /></el-icon>
                {{ userStore.userInfo.major }}
              </span>
            </div>
            <p class="profile-desc">
              {{ userStore.userInfo?.role === 'teacher' ? '教师账号，可管理课程与教学内容' : '学生账号，可参与课程学习、知识点练习与评测' }}
            </p>
          </div>
        </div>
        <div class="profile-actions">
          <el-button class="edit-btn" type="primary" @click="openEditProfile">
            <el-icon><Edit /></el-icon>
            编辑资料
          </el-button>
          <el-button class="edit-btn" @click="dialogVisible = true">
            <el-icon><Lock /></el-icon>
            修改密码
          </el-button>
        </div>
      </el-card>
    </section>

    <!-- 学习统计 -->
    <section class="stats-section">
      <h2 class="section-title">学习统计</h2>
      <div class="stats-grid">
        <div class="stat-card clickable" @click="router.push('/my-courses')">
          <div class="stat-icon" style="background: linear-gradient(135deg, #e6f7ff, #bae7ff); color: #1890ff;">
            <el-icon :size="28"><Reading /></el-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ myCourses.length }}</span>
            <span class="stat-label">已选课程</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f6ffed, #b7eb8f); color: #52c41a;">
            <el-icon :size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ avgMastery }}%</span>
            <span class="stat-label">平均掌握度</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #fff7e6, #ffe7ba); color: #fa8c16;">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ totalStudyHours }}h</span>
            <span class="stat-label">累计学习时长</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f0f5ff, #d6e4ff); color: #597ef7;">
            <el-icon :size="28"><Calendar /></el-icon>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ activeDays }}</span>
            <span class="stat-label">活跃天数</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 课程进度 -->
    <section class="courses-section">
      <h2 class="section-title">课程学习进度</h2>
      <div class="courses-list" v-if="myCourses.length > 0">
        <div
          v-for="course in myCourses"
          :key="course.id"
          class="course-item"
          @click="goToCourse(course.id)"
        >
          <div class="course-item-avatar">
            <el-icon :size="24"><Reading /></el-icon>
          </div>
          <div class="course-item-info">
            <div class="course-item-header">
              <span class="course-name">{{ course.name }}</span>
              <span class="course-mastery">
                <el-tag
                  :type="masteryTagType(course.progress ?? 0)"
                  size="small"
                  effect="plain"
                >
                  {{ masteryLevel(course.progress ?? 0) }}
                </el-tag>
              </span>
            </div>
            <p class="course-instructor">{{ course.instructor }}</p>
            <div class="course-progress">
              <el-progress
                :percentage="course.progress ?? 0"
                :stroke-width="8"
                :color="progressColor(course.progress ?? 0)"
                :show-text="false"
              />
              <span class="course-progress-text">{{ course.progress ?? 0 }}%</span>
            </div>
          </div>
          <el-icon class="course-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
      <div class="courses-empty" v-else>
        <el-icon :size="48" color="#c0c4cc"><Reading /></el-icon>
        <p>暂未加入任何课程</p>
        <el-button type="primary" @click="router.push('/dashboard')">去课程大厅选课</el-button>
      </div>
    </section>

    <!-- 账号信息 -->
    <section class="account-section">
      <h2 class="section-title">账号信息</h2>
      <el-card class="account-card" shadow="never">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">姓名</span>
            <span class="info-value">{{ userStore.userInfo?.name || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">昵称</span>
            <span class="info-value">{{ userStore.userInfo?.nickname || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ userStore.userInfo?.username || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">学号</span>
            <span class="info-value">{{ userStore.userInfo?.studentId || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">年级</span>
            <span class="info-value">{{ userStore.userInfo?.grade || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">年龄</span>
            <span class="info-value">{{ userStore.userInfo?.age ? userStore.userInfo.age + '岁' : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">专业</span>
            <span class="info-value">{{ userStore.userInfo?.major || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ userStore.userInfo?.email || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">角色</span>
            <span class="info-value">{{ roleLabel }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">2026-06</span>
          </div>
        </div>
      </el-card>
    </section>

    <!-- 编辑资料弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑资料" width="520px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="80px" size="default">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="profileForm.name" placeholder="真实姓名" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="profileForm.nickname" placeholder="显示昵称" maxlength="16" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username" placeholder="登录用户名" maxlength="20" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="年级" prop="grade">
              <el-select v-model="profileForm.grade" placeholder="选择年级" style="width: 100%">
                <el-option label="大一" value="大一" />
                <el-option label="大二" value="大二" />
                <el-option label="大三" value="大三" />
                <el-option label="大四" value="大四" />
                <el-option label="研一" value="研一" />
                <el-option label="研二" value="研二" />
                <el-option label="研三" value="研三" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number v-model="profileForm.age" :min="16" :max="60" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="专业" prop="major">
          <el-input v-model="profileForm.major" placeholder="所学专业" maxlength="30" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" placeholder="联系邮箱" />
        </el-form-item>
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="profileForm.studentId" placeholder="学号" maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="profileSaving" @click="handleSaveProfile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="dialogVisible" title="修改密码" width="440px" :close-on-click-modal="false" destroy-on-close>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px" size="default">
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleChangePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight, Calendar, Clock, Collection, Edit, Lock, Reading, School, TrendCharts,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useCourseStore } from '@/stores/course'
import { getRadar, getWeakPoints, getActiveDays, type RadarItem, type WeakPointItem } from '@/api/study'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const courseStore = useCourseStore()

/* ========== 编辑资料 ========== */
const editDialogVisible = ref(false)
const profileSaving = ref(false)
const profileFormRef = ref<FormInstance>()

const profileForm = reactive({
  name: '',
  nickname: '',
  username: '',
  grade: '',
  age: 20,
  major: '',
  email: '',
  studentId: '',
})

const profileRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为 2-20 个字符', trigger: 'blur' },
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
}

const openEditProfile = () => {
  const u = userStore.userInfo
  profileForm.name = u?.name || ''
  profileForm.nickname = u?.nickname || ''
  profileForm.username = u?.username || ''
  profileForm.grade = u?.grade || ''
  profileForm.age = u?.age || 20
  profileForm.major = u?.major || ''
  profileForm.email = u?.email || ''
  profileForm.studentId = u?.studentId || ''
  editDialogVisible.value = true
}

const handleSaveProfile = async () => {
  const form = profileFormRef.value
  if (!form) return

  try {
    await form.validate()
    profileSaving.value = true

    // TODO: 对接后端更新用户信息接口
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (userStore.userInfo) {
      userStore.userInfo = {
        ...userStore.userInfo,
        name: profileForm.name,
        nickname: profileForm.nickname,
        username: profileForm.username,
        grade: profileForm.grade,
        age: profileForm.age,
        major: profileForm.major,
        email: profileForm.email,
        studentId: profileForm.studentId,
      }
      userStore.persistProfile()
    }

    ElMessage.success('资料保存成功')
    editDialogVisible.value = false
  } catch {
    // 表单校验不通过
  } finally {
    profileSaving.value = false
  }
}

/* ========== 修改密码 ========== */
const dialogVisible = ref(false)
const loading = ref(false)
const passwordFormRef = ref<FormInstance>()

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const validateConfirm = (_rule: unknown, value: string, callback: (err?: Error) => void) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleChangePassword = async () => {
  const form = passwordFormRef.value
  if (!form) return

  try {
    await form.validate()
    loading.value = true

    await new Promise((resolve) => setTimeout(resolve, 800))

    ElMessage.success('密码修改成功，请重新登录')
    dialogVisible.value = false
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    userStore.clearAuth()
    router.push('/login')
  } catch {
    if (loading.value) {
      ElMessage.error('密码修改失败，请检查当前密码是否正确')
    }
  } finally {
    loading.value = false
  }
}

/* ========== 学习诊断数据 ========== */
const radarItems = ref<RadarItem[]>([])
const weakPoints = ref<WeakPointItem[]>([])

/* ========== Computed ========== */
const myCourses = computed(() => courseStore.myCourses)

const displayName = computed(() => {
  const u = userStore.userInfo
  return u?.nickname || u?.name || u?.username || '用户'
})

const userInitial = computed(() => {
  const name = displayName.value
  return name.charAt(0).toUpperCase()
})

const roleLabel = computed(() => {
  const role = userStore.userInfo?.role
  if (role === 'teacher') return '教师'
  if (role === 'student') return '学生'
  return role || '普通用户'
})

const avgMastery = computed(() => {
  if (radarItems.value.length > 0) {
    const total = radarItems.value.reduce((sum, item) => sum + item.mastery, 0)
    return Math.round(total / radarItems.value.length)
  }
  if (myCourses.value.length === 0) return 0
  const total = myCourses.value.reduce((sum, c) => sum + (c.progress ?? 0), 0)
  return Math.round(total / myCourses.value.length)
})

const totalStudyHours = computed(() => {
  if (weakPoints.value.length > 0) {
    const totalAttempts = weakPoints.value.reduce((sum, w) => sum + w.totalAttempts, 0)
    return Math.round(totalAttempts * 0.25)
  }
  return myCourses.value.reduce((sum, c) => sum + Math.round((c.progress ?? 0) * 0.8), 0)
})

const activeDays = ref(0)

const masteryTagType = (progress: number): 'success' | 'warning' | 'danger' | '' => {
  if (progress >= 80) return 'success'
  if (progress >= 50) return 'warning'
  if (progress > 0) return 'danger'
  return ''
}

const masteryLevel = (progress: number): string => {
  if (progress >= 80) return '熟练'
  if (progress >= 50) return '入门'
  if (progress > 0) return '初学'
  return '未开始'
}

const progressColor = (progress: number): string => {
  if (progress >= 80) return '#52c41a'
  if (progress >= 50) return '#1890ff'
  return '#fa8c16'
}

const goToCourse = (courseId: number) => {
  router.push(`/course/${courseId}`)
}

onMounted(async () => {
  await Promise.allSettled([
    courseStore.myCourses.length === 0
      ? courseStore.fetchMyCourses()
      : Promise.resolve(),
  ])

  const userId = userStore.userInfo?.id
  const courseId = userStore.currentCourseId
  if (userId && courseId) {
    const [radarRes, weakRes, activeRes] = await Promise.allSettled([
      getRadar(userId, courseId),
      getWeakPoints(userId, courseId),
      getActiveDays(userId),
    ])
    if (radarRes.status === 'fulfilled') radarItems.value = radarRes.value
    if (weakRes.status === 'fulfilled') weakPoints.value = weakRes.value
    if (activeRes.status === 'fulfilled') activeDays.value = activeRes.value.activeDays
  }
})
</script>

<style scoped>
/* ========== Layout ========== */
.personal-center-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 0 40px;
}

/* ========== Hero ========== */
.hero-section {
  text-align: center;
  padding: 16px 0 8px;
}

.hero-label {
  font-size: 13px;
  color: #1890ff;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 4px;
}

.hero-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px;
}

.hero-subtitle {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0;
}

/* ========== Profile ========== */
.profile-section {
  margin-top: 20px;
}

.profile-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
}

.profile-card :deep(.el-card__body) {
  padding: 24px 28px;
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-avatar-wrap {
  flex-shrink: 0;
}

.profile-avatar {
  background: linear-gradient(135deg, #1890ff, #1677cc) !important;
  color: #fff !important;
  font-weight: 700 !important;
  font-size: 28px !important;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.25);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.profile-id {
  font-size: 13px;
  color: #999;
}

.profile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.profile-tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #595959;
}

.profile-tag-item .el-icon {
  color: #1890ff;
}

.profile-desc {
  font-size: 13px;
  color: #8c8c8c;
  line-height: 1.5;
  margin: 0;
}

.profile-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.edit-btn {
  border-radius: 8px;
  font-size: 13px;
}

/* ========== Sections ========== */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
  padding-left: 12px;
  border-left: 3px solid #1890ff;
  line-height: 1.2;
}

.stats-section,
.courses-section,
.account-section {
  margin-top: 32px;
}

/* ========== Stats ========== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-card.clickable {
  cursor: pointer;
  transition: all 0.2s;
}
.stat-card.clickable:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.15);
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 13px;
  color: #8c8c8c;
}

/* ========== Courses ========== */
.courses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.course-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 12px rgba(24, 144, 255, 0.08);
}

.course-item-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #e6f0ff;
  color: #1890ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.course-item-info {
  flex: 1;
  min-width: 0;
}

.course-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.course-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-mastery {
  flex-shrink: 0;
}

.course-instructor {
  font-size: 12px;
  color: #999;
  margin: 0 0 10px;
}

.course-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.course-progress :deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

.course-progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #595959;
  flex-shrink: 0;
  width: 36px;
}

.course-arrow {
  color: #c0c4cc;
  flex-shrink: 0;
  font-size: 16px;
}

/* ========== Empty ========== */
.courses-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  color: #999;
  font-size: 14px;
}

.courses-empty p {
  margin: 0;
}

/* ========== Account ========== */
.account-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
}

.account-card :deep(.el-card__body) {
  padding: 20px 28px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

/* ========== Dialog ========== */
.readonly-value {
  display: block;
  padding: 0 12px;
  font-size: 14px;
  color: #909399;
  line-height: 32px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #e8e8e8;
  padding: 20px 24px 16px;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e8e8e8;
  padding: 12px 24px;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .profile-main {
    flex-direction: column;
    text-align: center;
  }

  .profile-tags {
    justify-content: center;
  }

  .profile-actions {
    width: 100%;
    flex-direction: row;
  }

  .edit-btn {
    flex: 1;
  }
}
</style>
