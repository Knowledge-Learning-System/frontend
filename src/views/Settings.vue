<template>
  <div class="settings-page">
    <!-- 页头 -->
    <section class="hero-section">
      <div class="hero-content">
        <p class="hero-label">设置</p>
        <h1 class="hero-title">系统偏好</h1>
        <p class="hero-subtitle">自定义学习体验与应用外观</p>
      </div>
    </section>

    <!-- 学习偏好 -->
    <section class="settings-section">
      <h2 class="section-title">学习偏好</h2>
      <el-card class="settings-card" shadow="never">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">每日学习目标</span>
            <span class="setting-desc">设置每天需要掌握的知识点数量</span>
          </div>
          <div class="setting-control">
            <el-input-number
              v-model="dailyGoal"
              :min="1"
              :max="20"
              :step="1"
              size="default"
            />
          </div>
        </div>
        <el-divider margin="0" />
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">复习间隔</span>
            <span class="setting-desc">基于艾宾浩斯遗忘曲线的复习提醒间隔</span>
          </div>
          <div class="setting-control">
            <el-select v-model="reviewInterval" size="default" style="width: 180px">
              <el-option label="标准（1/2/4/7/15天）" value="standard" />
              <el-option label="密集（12h/1/2/4/7天）" value="intensive" />
              <el-option label="宽松（3/7/15/30天）" value="relaxed" />
            </el-select>
          </div>
        </div>
        <el-divider margin="0" />
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">自动播放视频</span>
            <span class="setting-desc">进入知识点页面时自动播放讲解视频</span>
          </div>
          <div class="setting-control">
            <el-switch v-model="autoPlayVideo" />
          </div>
        </div>
      </el-card>
    </section>

    <!-- 通知设置 -->
    <section class="settings-section">
      <h2 class="section-title">通知设置</h2>
      <el-card class="settings-card" shadow="never">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">复习提醒</span>
            <span class="setting-desc">当有知识点需要复习时推送提醒</span>
          </div>
          <div class="setting-control">
            <el-switch v-model="reviewReminder" />
          </div>
        </div>
        <el-divider margin="0" />
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">课程更新通知</span>
            <span class="setting-desc">已选课程内容更新时接收通知</span>
          </div>
          <div class="setting-control">
            <el-switch v-model="courseUpdateNotice" />
          </div>
        </div>
        <el-divider margin="0" />
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">学习报告</span>
            <span class="setting-desc">每周发送学习进度报告</span>
          </div>
          <div class="setting-control">
            <el-switch v-model="weeklyReport" />
          </div>
        </div>
      </el-card>
    </section>

    <!-- 显示设置 -->
    <section class="settings-section">
      <h2 class="section-title">显示设置</h2>
      <el-card class="settings-card" shadow="never">
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">主题模式</span>
            <span class="setting-desc">切换浅色 / 深色显示模式</span>
          </div>
          <div class="setting-control">
            <el-radio-group v-model="themeMode" size="default">
              <el-radio-button value="light">浅色</el-radio-button>
              <el-radio-button value="dark">深色</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <el-divider margin="0" />
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">字号大小</span>
            <span class="setting-desc">调整页面文字显示大小</span>
          </div>
          <div class="setting-control">
            <el-radio-group v-model="fontSize" size="default">
              <el-radio-button value="small">小</el-radio-button>
              <el-radio-button value="medium">中</el-radio-button>
              <el-radio-button value="large">大</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </el-card>
    </section>

    <!-- 保存按钮 -->
    <div class="save-area">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">
        保存设置
      </el-button>
      <el-button size="large" @click="handleReset">恢复默认</el-button>
    </div>

    <!-- 关于 -->
    <section class="about-section">
      <h2 class="section-title">关于</h2>
      <el-card class="settings-card" shadow="never">
        <div class="about-item">
          <span class="about-label">系统名称</span>
          <span class="about-value">融合学科知识图谱与大语言模型的高校个性化在线学习系统</span>
        </div>
        <el-divider margin="0" />
        <div class="about-item">
          <span class="about-label">版本号</span>
          <span class="about-value">v1.0.0</span>
        </div>
        <el-divider margin="0" />
        <div class="about-item">
          <span class="about-label">技术栈</span>
          <span class="about-value">Vue 3 + TypeScript + Element Plus + ECharts</span>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const STORAGE_KEY = 'app_settings'

interface SettingsData {
  dailyGoal: number
  reviewInterval: string
  autoPlayVideo: boolean
  reviewReminder: boolean
  courseUpdateNotice: boolean
  weeklyReport: boolean
  themeMode: string
  fontSize: string
}

const defaults: SettingsData = {
  dailyGoal: 5,
  reviewInterval: 'standard',
  autoPlayVideo: true,
  reviewReminder: true,
  courseUpdateNotice: true,
  weeklyReport: false,
  themeMode: 'light',
  fontSize: 'medium',
}

const loadSettings = (): SettingsData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaults, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...defaults }
}

const saveSettings = (data: SettingsData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const dailyGoal = ref(defaults.dailyGoal)
const reviewInterval = ref(defaults.reviewInterval)
const autoPlayVideo = ref(defaults.autoPlayVideo)
const reviewReminder = ref(defaults.reviewReminder)
const courseUpdateNotice = ref(defaults.courseUpdateNotice)
const weeklyReport = ref(defaults.weeklyReport)
const themeMode = ref(defaults.themeMode)
const fontSize = ref(defaults.fontSize)
const saving = ref(false)

const collect = (): SettingsData => ({
  dailyGoal: dailyGoal.value,
  reviewInterval: reviewInterval.value,
  autoPlayVideo: autoPlayVideo.value,
  reviewReminder: reviewReminder.value,
  courseUpdateNotice: courseUpdateNotice.value,
  weeklyReport: weeklyReport.value,
  themeMode: themeMode.value,
  fontSize: fontSize.value,
})

const restore = (data: SettingsData) => {
  dailyGoal.value = data.dailyGoal
  reviewInterval.value = data.reviewInterval
  autoPlayVideo.value = data.autoPlayVideo
  reviewReminder.value = data.reviewReminder
  courseUpdateNotice.value = data.courseUpdateNotice
  weeklyReport.value = data.weeklyReport
  themeMode.value = data.themeMode
  fontSize.value = data.fontSize
}

const handleSave = async () => {
  saving.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 600))
    saveSettings(collect())
    ElMessage.success('设置已保存')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  restore(defaults)
  saveSettings(defaults)
  ElMessage.success('已恢复默认设置')
}

onMounted(() => {
  restore(loadSettings())
})
</script>

<style scoped>
.settings-page {
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

/* ========== Sections ========== */
.settings-section {
  margin-top: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px;
  padding-left: 12px;
  border-left: 3px solid #1890ff;
  line-height: 1.2;
}

.settings-card {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
}

.settings-card :deep(.el-card__body) {
  padding: 0;
}

/* ========== Setting Items ========== */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  gap: 24px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.setting-label {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.setting-desc {
  font-size: 13px;
  color: #8c8c8c;
}

.setting-control {
  flex-shrink: 0;
}

/* ========== Divider ========== */
.settings-card :deep(.el-divider--horizontal) {
  margin: 0 28px !important;
  width: auto !important;
}

/* ========== Save Area ========== */
.save-area {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}

/* ========== About ========== */
.about-section {
  margin-top: 32px;
}

.about-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  gap: 24px;
}

.about-label {
  font-size: 14px;
  font-weight: 500;
  color: #595959;
  flex-shrink: 0;
}

.about-value {
  font-size: 14px;
  color: #8c8c8c;
  text-align: right;
}

/* ========== Responsive ========== */
@media (max-width: 768px) {
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .about-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .about-value {
    text-align: left;
  }
}
</style>
