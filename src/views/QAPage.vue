<template>
  <div class="qa-page">
    <div class="qa-page-header">
      <h1 class="qa-page-title">智能问答</h1>
      <p class="qa-page-desc">基于知识图谱的智能助手，可以回答课程知识点相关的问题</p>
    </div>
    <div class="qa-page-body">
      <QAChat />
    </div>
  </div>
</template>

<script setup lang="ts">
import QAChat from '@/components/QAChat.vue'
</script>

<style scoped>
.qa-page {
  height: calc(100vh - 56px - 48px);
  display: flex;
  flex-direction: column;
  background: #fff;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.qa-page-header {
  flex-shrink: 0;
  padding: 24px 24px 0;
  text-align: center;
}

.qa-page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
}

.qa-page-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.qa-page-body {
  flex: 1;
  min-height: 0;
  padding: 0 16px 16px;
}
</style>
