<template>
  <div class="homework-page">
    <!-- TODO: 教师视角 — 作业列表（el-table：标题/截止日期/提交人数/状态）+ 新建按钮 -->
    <!-- TODO: 新建作业弹窗（el-dialog：标题、描述、知识点、截止日期 el-date-picker） -->
    <!-- TODO: 学生视角 — 作业列表 + 提交入口（el-dialog 含富文本编辑区 + 文件上传） -->
    <!-- TODO: 教师评分入口：点击某作业 → 查看提交列表 → 评分弹窗（分数+反馈） -->
    <!--
      后端 API:
        POST   /homework                  — 创建作业
        PUT    /homework/{id}/publish     — 发布
        GET    /homework?courseId=         — 列表
        GET    /homework/{id}             — 详情
        POST   /homework/{id}/submit      — 提交
        GET    /homework/{id}/submissions — 查看提交列表
        PUT    /homework/submission/{id}/grade — 评分
    -->
  </div>
</template>

<script setup lang="ts">
// TODO
</script>
