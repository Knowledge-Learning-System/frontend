<template>
  <div class="admin-strategy">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">推荐策略配置</span>
          <div class="header-actions">
            <el-button size="small" @click="loadData">重置</el-button>
            <el-button type="primary" size="small" :loading="saving" @click="save">保存配置</el-button>
          </div>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="策略用于学生端知识点推荐计算：各维度得分按权重加权后排序，关闭某项即视为该维度不参与计算。有效权重合计建议保持在 100。"
        class="tip"
      />

      <div class="summary">
        <div class="summary-item">
          <span class="summary-label">有效权重合计</span>
          <span class="summary-value" :class="{ warn: !balanced }">{{ totalWeight }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">启用维度</span>
          <span class="summary-value">{{ enabledCount }} / {{ items.length }}</span>
        </div>
        <el-tag :type="balanced ? 'success' : 'warning'" effect="plain" size="small">
          {{ balanced ? '权重配比正常' : '权重合计不等于 100' }}
        </el-tag>
      </div>

      <div v-loading="loading" class="strategy-list">
        <div v-for="item in items" :key="item.key" class="strategy-item" :class="{ off: !item.enabled }">
          <div class="item-main">
            <div class="item-head">
              <span class="item-name">{{ item.name }}</span>
              <el-tag size="small" type="info" effect="plain">{{ item.key }}</el-tag>
              <span class="item-weight-tag">{{ item.weight }}%</span>
            </div>
            <div class="item-remark">{{ item.remark || '-' }}</div>
            <div class="item-control">
              <el-slider
                v-model="item.weight"
                :min="0"
                :max="100"
                :step="5"
                :disabled="!item.enabled"
                class="slider"
              />
              <el-input-number
                v-model="item.weight"
                :min="0"
                :max="100"
                size="small"
                :disabled="!item.enabled"
                controls-position="right"
              />
            </div>
          </div>
          <div class="item-switch">
            <el-switch v-model="item.enabled" />
            <span class="switch-text">{{ item.enabled ? '启用' : '停用' }}</span>
          </div>
        </div>
      </div>

      <div class="footer-tip">最近更新：{{ lastUpdate }}</div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdminStrategy, updateAdminStrategy, type AdminStrategyItem } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const items = ref<AdminStrategyItem[]>([])
const lastUpdate = ref('-')

const totalWeight = computed(() =>
  items.value.filter((i) => i.enabled).reduce((sum, i) => sum + Number(i.weight || 0), 0)
)
const enabledCount = computed(() => items.value.filter((i) => i.enabled).length)
const balanced = computed(() => totalWeight.value === 100)

async function loadData() {
  loading.value = true
  try {
    const data = await getAdminStrategy()
    items.value = (data.items || []).map((i) => ({ ...i }))
    const times = items.value.map((i) => i.updateTime).filter((t): t is string => Boolean(t))
    lastUpdate.value = times.length ? times.sort().slice(-1)[0] ?? '-' : '-'
  } catch (e: any) {
    ElMessage.error(e?.message || '加载推荐策略失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  const invalid = items.value.find((i) => i.weight < 0 || i.weight > 100)
  if (invalid) {
    ElMessage.warning(`「${invalid.name}」权重需在 0-100 之间`)
    return
  }
  saving.value = true
  try {
    await updateAdminStrategy(
      items.value.map((i) => ({ key: i.key, weight: Number(i.weight), enabled: i.enabled }))
    )
    ElMessage.success('推荐策略已保存')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
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

.header-actions {
  display: flex;
  gap: 8px;
}

.tip {
  margin-bottom: 16px;
}

.summary {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #606266;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.summary-value.warn {
  color: #e6a23c;
}

.strategy-list {
  min-height: 120px;
}

.strategy-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 18px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: opacity 0.2s;
}

.strategy-item.off {
  opacity: 0.55;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.item-weight-tag {
  font-size: 13px;
  color: #409eff;
  font-weight: 600;
}

.item-remark {
  font-size: 12px;
  color: #909399;
  margin: 6px 0 10px;
  line-height: 1.5;
}

.item-control {
  display: flex;
  align-items: center;
  gap: 18px;
}

.slider {
  flex: 1;
  max-width: 460px;
}

.item-switch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 60px;
}

.switch-text {
  font-size: 12px;
  color: #909399;
}

.footer-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #c0c4cc;
  text-align: right;
}
</style>
