<template>
  <div class="register-page">
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1" />
      <div class="bg-circle bg-circle-2" />
    </div>

    <div class="register-container">
      <div class="register-header">
        <div class="register-logo">
          <svg viewBox="0 0 24 24" fill="none" class="logo-svg">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
            <path d="M2 17l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
            <path d="M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </div>
        <h1 class="register-system-name">高校个性化在线学习系统</h1>
      </div>

      <el-card class="register-card" shadow="never">
        <h2 class="register-title">注册账号</h2>

        <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleRegister">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="学号" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
            />
          </el-form-item>
          <el-form-item prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              show-password
            />
          </el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" size="large" class="submit-btn">
            注册
          </el-button>
        </el-form>
        <p class="footer-link">
          已有账号？
          <router-link to="/login">去登录</router-link>
        </p>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { register as registerApi } from '@/api/auth'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const validateConfirm = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

const handleRegister = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await registerApi({ username: form.username, password: form.password })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch {
    ElMessage.error('注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 30%, #ecfdf5 70%, #fefce8 100%);
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
}

.bg-circle-1 {
  width: 400px;
  height: 400px;
  background: #3b82f6;
  top: -100px;
  right: -80px;
}

.bg-circle-2 {
  width: 350px;
  height: 350px;
  background: #10b981;
  bottom: -100px;
  left: -60px;
}

.register-container {
  position: relative;
  z-index: 1;
  width: 420px;
}

.register-header {
  text-align: center;
  margin-bottom: 28px;
}

.register-logo {
  width: 56px;
  height: 56px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 14px;
  color: #fff;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

.logo-svg {
  width: 32px;
  height: 32px;
}

.register-system-name {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.register-card {
  border-radius: 12px;
  border: 1px solid #e8ecf1;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: 8px;
}

.register-card :deep(.el-card__body) {
  padding: 28px 32px;
}

.register-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 28px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
}

.footer-link {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #64748b;
}

.footer-link a {
  color: #3b82f6;
  text-decoration: none;
}
</style>