<template>
  <!-- 课程级推荐独立页面：仅展示按算法（知识图谱先修关系 + 掌握度）给出的整门课推荐，不占用知识点内页 -->
  <RecommendationsPage :course-id="courseId" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import RecommendationsPage from './Recommendations.vue'

const route = useRoute()

const courseId = computed(() => {
  const id = Number(route.params.courseId)
  return Number.isFinite(id) && id > 0 ? id : undefined
})
</script>
