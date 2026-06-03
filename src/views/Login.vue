<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="login-bg">
      <div class="bg-circle bg-circle-1" />
      <div class="bg-circle bg-circle-2" />
      <div class="bg-circle bg-circle-3" />
    </div>

    <!-- 登录卡片 -->
    <div class="login-card-wrap">
      <div class="login-card">
        <!-- Logo 和标题 -->
        <div class="login-header">
          <div class="login-logo">
            <svg viewBox="0 0 24 24" fill="none" class="logo-svg">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
              <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
              <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <h1 class="login-title">智能在线学习系统</h1>
          <p class="login-subtitle">融合学科知识图谱与大语言模型的高校个性化在线学习平台</p>
        </div>

        <!-- 登录表单 -->
        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="studentId">
            <el-input
              v-model="loginForm.studentId"
              placeholder="请输入学号"
              :prefix-icon="User"
              size="large"
              class="login-input"
              clearable
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              class="login-input"
              show-password
              @keydown.enter="handleLogin"
            />
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <a href="#" class="forgot-link">忘记密码?</a>
          </div>

          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form>

        <!-- 底部注册链接 -->
        <div class="login-footer">
          还没有账号？
          <router-link to="/register" class="register-link">立即注册</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  studentId: '',
  password: '',
  remember: false,
})

const rules: FormRules = {
  studentId: [
    { required: true, message: '请输入学号', trigger: 'blur' },
    { min: 4, max: 20, message: '学号长度为4-20位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await userStore.login({
      username: loginForm.studentId,
      password: loginForm.password,
    })
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch {
    ElMessage.error('学号或密码错误')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e6f0ff 0%, #f0f5ff 50%, #f5f5f5 100%);
  position: relative;
  overflow: hidden;
}

/* Background Decorations */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
}

.bg-circle-1 {
  width: 600px; height: 600px;
  background: #1890ff;
  top: -200px; right: -200px;
}

.bg-circle-2 {
  width: 400px; height: 400px;
  background: #52c41a;
  bottom: -100px; left: -100px;
}

.bg-circle-3 {
  width: 200px; height: 200px;
  background: #722ed1;
  top: 40%; left: 10%;
}

/* Card */
.login-card-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1890ff, #1677cc);
  border-radius: 14px;
  margin: 0 auto 16px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(24,144,255,0.3);
}

.logo-svg {
  width: 26px;
  height: 26px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #262626;
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0;
  line-height: 1.5;
}

/* Form */
.login-form {
  margin-bottom: 0;
}

.login-input :deep(.el-input__wrapper) {
  box-shadow: none;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 2px 12px;
  background: #fafafa;
  transition: all 0.2s;
}

.login-input :deep(.el-input__wrapper:hover) {
  border-color: #91caff;
  background: #fff;
}

.login-input :deep(.el-input__wrapper.is-focus) {
  border-color: #1890ff;
  background: #fff;
  box-shadow: 0 0 0 2px rgba(24,144,255,0.1);
}

.login-input :deep(.el-input__inner) {
  height: 44px;
  font-size: 14px;
}

.login-input :deep(.el-input__prefix) {
  color: #bfbfbf;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-size: 13px;
}

.forgot-link {
  color: #1890ff;
  text-decoration: none;
  font-size: 13px;
}

.forgot-link:hover {
  color: #1677cc;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  letter-spacing: 4px;
}

/* Footer */
.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #8c8c8c;
}

.register-link {
  color: #1890ff;
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
}

.register-link:hover {
  text-decoration: underline;
}
</style>
