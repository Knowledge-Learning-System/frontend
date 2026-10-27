<template>
  <div class="kp-picker">
    <template v-if="courseId">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="{ label: 'label', children: 'children' }"
        node-key="id"
        highlight-current
        default-expand-all
        :expand-on-click-node="false"
        class="kp-tree"
        @node-click="handleNodeClick"
      />
      <div v-if="placeholderWhenEmpty && treeData.length === 0 && !loading" class="kp-empty">
        该课程暂无章节结构
      </div>
      <div v-if="selectedLabel" class="kp-selected">
        已选择：<el-tag size="small" type="primary">{{ selectedLabel }}</el-tag>
      </div>
    </template>
    <el-empty v-else description="请先选择课程" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getChapterStructure } from '@/api/knowledgeGraph'
import type { SubTopicVO } from '@/types/knowledgeGraph'

export interface KpTreeNode {
  id: string
  label: string
  isChapter: boolean
  children?: KpTreeNode[]
}

const props = defineProps<{
  /** 课程 ID，变化时自动重新加载章节树 */
  courseId?: number
  /** v-model：选中的节点 id（章节或知识点） */
  modelValue?: string
  /** 无数据时的占位提示 */
  placeholderWhenEmpty?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', node: KpTreeNode): void
}>()

const treeRef = ref()
const treeData = ref<KpTreeNode[]>([])
const loading = ref(false)
const selectedLabel = ref('')

const buildTree = (subTopics: SubTopicVO[]): KpTreeNode[] => {
  const buildKp = (kp: SubTopicVO['knowledgePoints'][number]): KpTreeNode => ({
    id: kp.id,
    label: kp.name,
    isChapter: false,
    children: kp.children?.length ? kp.children.map(buildKp) : undefined,
  })
  return subTopics.map((st) => ({
    id: st.id,
    label: st.name,
    isChapter: true,
    children: st.knowledgePoints?.length ? st.knowledgePoints.map(buildKp) : undefined,
  }))
}

const loadTree = async (courseId: number) => {
  loading.value = true
  try {
    const data = await getChapterStructure(courseId)
    treeData.value = buildTree(data ?? [])
  } catch {
    treeData.value = []
    ElMessage.error('加载章节结构失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.courseId,
  (newId) => {
    selectedLabel.value = ''
    treeData.value = []
    if (newId) {
      loadTree(newId)
    }
  },
  { immediate: true },
)

const handleNodeClick = (node: KpTreeNode) => {
  selectedLabel.value = node.label
  emit('update:modelValue', node.id)
  emit('select', node)
}

/** 对外暴露：清空选中状态 */
const clearSelection = () => {
  selectedLabel.value = ''
  treeRef.value?.setCurrentKey?.(null)
}

defineExpose({ clearSelection, setLabel: (label: string) => (selectedLabel.value = label) })
</script>

<style scoped>
.kp-picker {
  width: 100%;
}

.kp-tree {
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
  width: 100%;
}

.kp-empty {
  padding: 16px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.kp-selected {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}
</style>
