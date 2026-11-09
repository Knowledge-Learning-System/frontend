<template>
  <!-- 课程级知识点掌握度独立页面：仅展示整门课的知识点掌握情况，不占用知识点内页 -->
  <RadarChartPage :course-id="courseId" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import RadarChartPage from './RadarChart.vue'

const route = useRoute()

const courseId = computed(() => {
  const id = Number(route.params.courseId)
  return Number.isFinite(id) && id > 0 ? id : undefined
})
</script>
