<template>
  <router-view />
  <AIAssistant />
</template>

<script setup lang="ts">
import AIAssistant from '@/components/AIAssistant.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Microsoft YaHei', sans-serif;
  color: #222;
  background: #f8fafc;
}
</style>
