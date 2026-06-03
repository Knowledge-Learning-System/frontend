<template>
  <div class="kg-sidebar">
    <!-- 头部 -->
    <div class="sidebar-header">
      <div class="sidebar-header-main">
        <span
          class="sidebar-type-badge"
          :style="{ background: typeColor + '15', color: typeColor, borderColor: typeColor + '30' }"
        >
          {{ typeLabel }}
        </span>
        <h3 class="sidebar-name">{{ node.name }}</h3>
      </div>
      <el-button class="sidebar-close" :icon="Close" circle size="small" @click="$emit('close')" />
    </div>

    <!-- 掌握度 -->
    <div class="sidebar-section">
      <div class="section-header">
        <span class="section-label">掌握度</span>
        <span class="section-value mastery-value">{{ masteryPercent }}%</span>
      </div>
      <el-progress
        :percentage="masteryPercent"
        :stroke-width="8"
        :show-text="false"
        :color="masteryColor"
      />
    </div>

    <!-- 描述 -->
    <div class="sidebar-section">
      <div class="section-label">知识点描述</div>
      <p class="sidebar-desc">{{ node.description || '暂无描述' }}</p>
    </div>

    <!-- 前置知识点 -->
    <div v-if="prerequisites.length > 0" class="sidebar-section">
      <div class="section-label">前置知识点</div>
      <div class="tag-list">
        <el-tag
          v-for="item in prerequisites"
          :key="item"
          size="small"
          type="info"
          class="prereq-tag"
        >
          {{ item }}
        </el-tag>
      </div>
    </div>

    <!-- 相关资源 -->
    <div v-if="resources.length > 0" class="sidebar-section">
      <div class="section-label">相关学习资源</div>
      <div class="resource-list">
        <div v-for="r in resources" :key="r.title" class="resource-item">
          <div class="resource-left">
            <el-icon class="resource-icon" :size="16">
              <VideoPlay v-if="r.type === 'video'" />
              <Document v-else />
            </el-icon>
            <div class="resource-info">
              <span class="resource-title">{{ r.title }}</span>
              <span v-if="r.duration" class="resource-duration">{{ r.duration }}</span>
            </div>
          </div>
          <el-tag size="small" :type="r.type === 'video' ? 'primary' : ''">
            {{ r.type === 'video' ? '视频' : '文档' }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="sidebar-actions">
      <el-button type="primary" class="action-btn" @click="$emit('start-assessment')">
        开始测评
      </el-button>
      <el-button
        type="success"
        class="action-btn"
        :loading="mastering"
        @click="handleMarkMastered"
      >
        标记为已掌握
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Close, Document, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { markAsMastered } from '@/api/knowledgeGraph'
import type { KnowledgeNode } from '@/types/knowledgeGraph'

interface ResourceItem {
  title: string
  type: string
  duration?: string
}

interface Props {
  node: KnowledgeNode
  resources?: ResourceItem[]
}

const props = withDefaults(defineProps<Props>(), {
  resources: () => [],
})

const emit = defineEmits<{
  close: []
  'start-assessment': []
  mastered: [nodeId: string]
}>()

const mastering = ref(false)

const handleMarkMastered = async () => {
  mastering.value = true
  try {
    await markAsMastered(props.node.id)
    ElMessage.success(`知识点 "${props.node.name}" 已标记为已掌握`)
    emit('mastered', props.node.id)
  } catch (e: any) {
    ElMessage.error('标记失败：' + (e.message ?? e))
  } finally {
    mastering.value = false
  }
}

const typeLabels: Record<number, string> = {
  0: '知识领域',
  1: '子主题',
  2: '知识点',
  3: '术语',
}

const typeColors: Record<number, string> = {
  0: '#3b82f6',
  1: '#10b981',
  2: '#f59e0b',
  3: '#8b5cf6',
}

const typeLabel = computed(() => typeLabels[props.node.group] ?? '知识领域')
const typeColor = computed(() => typeColors[props.node.group] ?? '#3b82f6')

const masteryMap: Record<string, number> = {
  k1: 75, k2: 80, k3: 65, k4: 55, k5: 40,
  k6: 30, k7: 20, k8: 35, k9: 45, k10: 60,
}

const masteryPercent = computed(() => masteryMap[props.node.id] ?? 50)

const masteryColor = computed(() => {
  const v = masteryPercent.value
  if (v >= 80) return '#10b981'
  if (v >= 60) return '#3b82f6'
  if (v >= 40) return '#f59e0b'
  return '#ef4444'
})

const prerequisitesMap: Record<string, string[]> = {
  k3: ['软件测试', '单元测试'],
  k4: ['JUnit框架'],
  k5: ['JUnit框架'],
  k6: ['软件测试', '单元测试'],
  k8: ['JUnit框架', '断言机制'],
  k9: ['单元测试'],
  k10: ['单元测试'],
}

const prerequisites = computed(() => prerequisitesMap[props.node.id] ?? [])
</script>

<style scoped>
.kg-sidebar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 340px;
  background: #fff;
  border-left: 1px solid #e8ecf1;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 10;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f1f5f9;
  gap: 12px;
}

.sidebar-header-main {
  flex: 1;
  min-width: 0;
}

.sidebar-type-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid;
  margin-bottom: 8px;
}

.sidebar-name {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
}

.sidebar-close {
  flex-shrink: 0;
  margin-top: 2px;
}

/* Sections */
.sidebar-section {
  padding: 16px 20px;
  border-bottom: 1px solid #f8fafc;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.section-value {
  font-size: 13px;
}

.mastery-value {
  font-weight: 700;
  font-size: 16px;
}

.sidebar-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* Tags */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.prereq-tag {
  border-radius: 6px;
  font-size: 12px;
}

/* Resources */
.resource-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 8px;
  transition: background 0.2s;
}

.resource-item:hover {
  background: #f1f5f9;
}

.resource-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.resource-icon {
  color: #3b82f6;
  flex-shrink: 0;
}

.resource-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.resource-title {
  font-size: 13px;
  color: #334155;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.resource-duration {
  font-size: 11px;
  color: #94a3b8;
}

/* Actions */
.sidebar-actions {
  padding: 20px;
  margin-top: auto;
}

.action-btn {
  width: 100%;
  height: 42px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
}
</style>