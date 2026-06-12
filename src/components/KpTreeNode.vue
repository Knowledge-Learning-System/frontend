<template>
  <div class="tree-node">
    <div class="tree-row" @click="handleClick">
      <span
        v-if="hasChildren"
        class="tree-arrow"
        @click.stop="toggleExpand"
      >{{ expanded ? '▼' : '▶' }}</span>
      <span v-else class="tree-arrow placeholder" />
      <span class="tree-label" :class="{ selected: isSelected }">
        {{ node.name }}
        <span v-if="hasChildren" class="child-count">({{ node.children.length }})</span>
      </span>
    </div>
    <div v-if="hasChildren && expanded" class="tree-children">
      <KpTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        @select="(kp: KnowledgePointTreeNode) => $emit('select', kp)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { KnowledgePointTreeNode } from '@/types/knowledgeGraph'

const props = defineProps<{
  node: KnowledgePointTreeNode
  selectedId: string
}>()

const emit = defineEmits<{
  select: [kp: KnowledgePointTreeNode]
}>()

const expanded = ref(false)

const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
const isSelected = computed(() => props.node.id === props.selectedId)

function handleClick() {
  emit('select', props.node)
}

function toggleExpand() {
  expanded.value = !expanded.value
}
</script>

<style scoped>
.tree-node { font-size: 13px; }
.tree-row {
  display: flex; align-items: center; padding: 5px 16px; cursor: pointer;
  border-radius: 4px; margin: 1px 8px 1px 0; transition: background .12s;
}
.tree-row:hover { background: #ecf5ff; }
.tree-arrow {
  width: 16px; font-size: 10px; color: #909399; flex-shrink: 0;
  text-align: center; line-height: 1;
}
.tree-arrow.placeholder { visibility: hidden; }
.tree-label {
  flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #606266;
}
.tree-label.selected { color: #409eff; font-weight: 600; }
.child-count { font-size: 12px; color: #c0c4cc; font-weight: 400; margin-left: 2px; }
.tree-children { padding-left: 12px; }
</style>
