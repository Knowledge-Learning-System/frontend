<template>
  <el-dialog
    :model-value="visible"
    title="关联知识点"
    width="680px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @open="handleOpen"
  >
    <template v-if="courseId">
      <el-input
        v-model="keyword"
        placeholder="搜索知识点名称"
        clearable
        class="kp-search"
        @input="handleSearch"
      />
      <div class="kp-body" v-loading="loading">
        <div class="kp-tree-wrap">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="{ label: 'label', children: 'children' }"
            node-key="id"
            show-checkbox
            check-strictly
            default-expand-all
            :expand-on-click-node="false"
            :filter-node-method="filterNode"
            class="kp-tree"
            @check="handleCheck"
          />
          <div v-if="!loading && treeData.length === 0" class="kp-empty">
            该课程暂无章节结构
          </div>
        </div>
        <div class="kp-selected-panel">
          <div class="kp-selected-title">已选 {{ checkedNodes.length }} 个知识点</div>
          <div class="kp-selected-list">
            <el-tag
              v-for="item in checkedNodes"
              :key="item.id"
              size="small"
              type="primary"
              closable
              class="kp-tag"
              @close="uncheckNode(item.id)"
            >
              {{ item.label }}
            </el-tag>
            <span v-if="!checkedNodes.length" class="kp-empty-tip">未选择知识点</span>
          </div>
        </div>
      </div>
    </template>
    <el-empty v-else description="请先选择课程" :image-size="60" />

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getChapterStructure } from '@/api/knowledgeGraph'
import type { SubTopicVO } from '@/types/knowledgeGraph'

export interface KpNodeOption {
  id: string
  label: string
  children?: KpNodeOption[]
}

const props = defineProps<{
  visible: boolean
  courseId?: number
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:modelValue', value: string): void
  (e: 'confirm', node: KpNodeOption): void
}>()

const treeRef = ref()
const treeData = ref<KpNodeOption[]>([])
const keyword = ref('')
const loading = ref(false)

const buildTree = (subTopics: SubTopicVO[]): KpNodeOption[] => {
  const buildKp = (kp: SubTopicVO['knowledgePoints'][number]): KpNodeOption => ({
    id: kp.id,
    label: kp.name,
    children: kp.children?.length ? kp.children.map(buildKp) : undefined,
  })
  return subTopics.map((st) => ({
    id: st.id,
    label: st.name,
    children: st.knowledgePoints?.length ? st.knowledgePoints.map(buildKp) : undefined,
  }))
}

const loadTree = async (courseId: number) => {
  loading.value = true
  try {
    const data = await getChapterStructure(courseId)
    treeData.value = buildTree(data ?? [])
    await syncChecked()
  } catch {
    treeData.value = []
    ElMessage.error('加载章节结构失败')
  } finally {
    loading.value = false
  }
}

/** 根据 modelValue 回显勾选 */
const syncChecked = async () => {
  await nextTick()
  const target = props.modelValue
  treeRef.value?.setCheckedKeys?.(target ? [target] : [])
}

const handleOpen = () => {
  if (props.courseId && !treeData.value.length) {
    loadTree(props.courseId)
  } else {
    syncChecked()
  }
}

watch(
  () => props.courseId,
  (newId) => {
    treeData.value = []
    keyword.value = ''
    if (newId) {
      loadTree(newId)
    }
  },
)

watch(
  () => props.modelValue,
  () => {
    if (props.visible) syncChecked()
  },
)

const checkedNodes = computed(() => (treeRef.value?.getCheckedNodes?.() ?? []) as KpNodeOption[])

/** 单选互斥：勾选新节点时清除其它勾选 */
const handleCheck = (node: KpNodeOption) => {
  const keys = (treeRef.value?.getCheckedKeys?.() ?? []) as string[]
  if (keys.length > 1) {
    treeRef.value.setCheckedKeys([node.id])
  }
}

const uncheckNode = (id: string) => {
  treeRef.value?.setChecked?.(id, false)
}

const filterNode = (value: string, data: KpNodeOption) => {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}

const handleSearch = () => {
  treeRef.value?.filter?.(keyword.value)
}

const handleConfirm = () => {
  const nodes = checkedNodes.value
  if (!nodes.length) {
    ElMessage.warning('请先勾选一个知识点')
    return
  }
  const node = nodes[0]
  if (!node) return
  emit('update:modelValue', node.id)
  emit('confirm', { id: node.id, label: node.label })
  emit('update:visible', false)
}
</script>

<style scoped>
.kp-search {
  margin-bottom: 12px;
}

.kp-body {
  display: flex;
  gap: 12px;
  min-height: 320px;
}

.kp-tree-wrap {
  flex: 1 1 0;
  min-width: 0;
  position: relative;
}

.kp-tree {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 8px;
  max-height: 360px;
  overflow-y: auto;
}

.kp-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
}

.kp-selected-panel {
  width: 180px;
  flex-shrink: 0;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 8px;
}

.kp-selected-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.kp-selected-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.kp-tag {
  max-width: 100%;
}

.kp-empty-tip {
  font-size: 12px;
  color: #909399;
}
</style>
