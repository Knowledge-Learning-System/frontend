<template>
  <div class="graph-manage-page">
    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-content">
        <p class="hero-label">融合学科知识图谱与大语言模型的高校个性化在线学习系统</p>
        <h1 class="hero-title">图谱管理</h1>
        <p class="hero-subtitle">下载模板填写节点与关系，上传表格即可创建/修改/删除学科知识图谱</p>
      </div>
    </section>

    <!-- 工具栏：课程选择 + 模板下载 -->
    <section class="toolbar-section">
      <div class="toolbar-left">
        <span class="field-label">选择课程</span>
        <el-select
          v-model="selectedCourseId"
          placeholder="请选择课程"
          style="width: 240px"
          :loading="courseLoading"
          @change="handleCourseChange"
        >
          <el-option
            v-for="c in myCourses"
            :key="c.id"
            :label="c.name"
            :value="c.id"
          />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-button @click="handleDownloadTemplate">
          <el-icon><Download /></el-icon>
          下载模板
        </el-button>
        <el-button
          type="success"
          :disabled="!selectedCourseId"
          @click="handleDownloadGraphFile"
        >
          <el-icon><Download /></el-icon>
          下载当前课程图谱
        </el-button>
      </div>
    </section>

    <!-- 上传区 -->
    <section class="upload-section">
      <div class="upload-card">
        <div class="upload-card-title">
          <el-icon><Upload /></el-icon>
          上传节点 / 关系表格
        </div>
        <div class="upload-body">
          <el-upload
            v-model:file-list="fileList"
            :auto-upload="false"
            :limit="5"
            :accept="'.xlsx,.xls,.csv'"
            multiple
            drag
            class="upload-area"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em>（支持 Excel / CSV，可多选）</div>
            <template #tip>
              <div class="el-upload__tip">
                请使用「下载模板」中的节点表与关系表格式填写；CSV 需含表头（UTF-8 / GBK 均可）。
              </div>
            </template>
          </el-upload>
          <el-button
            type="primary"
            class="upload-btn"
            :loading="importing"
            :disabled="fileList.length === 0 || !selectedCourseId"
            @click="handleImport"
          >
            <el-icon v-if="!importing"><Upload /></el-icon>
            上传并写入图谱
          </el-button>
        </div>
      </div>
    </section>

    <!-- 导入结果 -->
    <section v-if="importResult" class="result-section">
      <el-alert
        :type="importResult.failCount > 0 ? 'warning' : 'success'"
        :closable="false"
        show-icon
      >
        <template #title>
          导入完成：共 {{ importResult.nodeTotal + importResult.relationTotal }} 条，成功 {{ importResult.createdNodes + importResult.updatedNodes + importResult.writtenRelations + importResult.autoRelations }} 条
          <template v-if="importResult.failCount > 0">
            ，失败 {{ importResult.failCount }} 条
          </template>
        </template>
      </el-alert>
      <div v-if="(importResult.chaptersGenerated || 0) > 0" class="chapter-tip">
        已根据图谱内容自动生成 <strong>{{ importResult.chaptersGenerated }}</strong> 个章节，并将
        <strong>{{ importResult.knowledgePointsAttached || 0 }}</strong> 个知识点归属到章节；
        可前往「课程管理 → 上传资料」，在对应章节知识点下发布教学资源。
      </div>
      <div v-if="importResult.failDetails.length > 0" class="fail-details">
        <div class="fail-title">失败明细</div>
        <ul class="fail-list">
          <li v-for="(d, i) in importResult.failDetails" :key="i">{{ d }}</li>
        </ul>
      </div>
    </section>

    <!-- 图谱可视化 -->
    <section class="graph-section">
      <div class="graph-card">
        <div class="graph-card-header">
          <div class="graph-card-title">
            <el-icon><Share /></el-icon>
            图谱可视化
          </div>
          <el-button
            v-if="selectedCourseId"
            size="small"
            :loading="graphLoading"
            @click="loadGraph"
          >
            刷新图谱
          </el-button>
        </div>
        <div v-loading="graphLoading" class="graph-container">
          <el-empty
            v-if="!graphLoading && (!graphData || graphData.nodes.length === 0)"
            description="暂无图谱数据，请上传表格或导入模板样例"
          />
          <KnowledgeGraphChart
            v-else-if="graphData && graphData.nodes.length > 0"
            :data="graphData"
            auto-expand-all
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Download, Share, Upload, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadInstance } from 'element-plus'
import KnowledgeGraphChart from '@/components/knowledge-graph/KnowledgeGraphChart.vue'
import { getMyTeachingCourses } from '@/api/teacher'
import {
  downloadGraphFile,
  downloadGraphTemplate,
  getFullGraph,
  importKnowledgeGraph,
  type GraphImportResult,
} from '@/api/knowledgeGraph'
import type { Course } from '@/types/course'
import type { GraphData, KnowledgeGraphData } from '@/types/knowledgeGraph'

const courseLoading = ref(false)
const myCourses = ref<Course[]>([])
const selectedCourseId = ref<number | null>(null)

const fileList = ref<UploadFile[]>([])
const importing = ref(false)
const importResult = ref<GraphImportResult | null>(null)

const graphLoading = ref(false)
const graphData = ref<GraphData | null>(null)

// 后端返回 GraphNode[]（group 可选），组件需要 KnowledgeNode[]（group 必选），做一次收敛转换
const toComponentData = (data: KnowledgeGraphData): GraphData => ({
  nodes: (data.nodes || []).map((n) => ({
    id: n.id,
    name: n.name,
    group: n.group ?? 0,
    level: n.level,
    description: n.description,
  })),
  links: (data.links || []).map((l) => ({
    source: l.source,
    target: l.target,
    type: l.type,
  })),
})

const handleDownloadTemplate = async () => {
  try {
    await downloadGraphTemplate()
    ElMessage.success('模板已开始下载')
  } catch {
    ElMessage.error('模板下载失败')
  }
}

const handleDownloadGraphFile = async () => {
  if (!selectedCourseId.value) {
    ElMessage.warning('请先选择课程')
    return
  }
  const course = myCourses.value.find((c) => c.id === selectedCourseId.value)
  try {
    await downloadGraphFile(
      selectedCourseId.value,
      `${course?.name || '知识图谱'}图谱数据.xlsx`,
    )
    ElMessage.success('当前课程图谱文件已开始下载')
  } catch {
    ElMessage.error('图谱数据文件下载失败')
  }
}

const handleCourseChange = () => {
  importResult.value = null
  graphData.value = null
  loadGraph()
}

const loadGraph = async () => {
  if (selectedCourseId.value == null) return
  graphLoading.value = true
  try {
    const data = await getFullGraph(selectedCourseId.value)
    graphData.value = toComponentData(data)
  } catch {
    graphData.value = null
    ElMessage.warning('图谱数据加载失败，请稍后重试')
  } finally {
    graphLoading.value = false
  }
}

const handleImport = async () => {
  if (!selectedCourseId.value) {
    ElMessage.warning('请先选择课程')
    return
  }
  const files: File[] = []
  fileList.value.forEach((f) => {
    if (f.raw) files.push(f.raw)
  })
  if (files.length === 0) {
    ElMessage.warning('请选择表格文件')
    return
  }
  importing.value = true
  try {
    const result = await importKnowledgeGraph(selectedCourseId.value, files)
    importResult.value = result
    if (result.failCount > 0) {
      ElMessage.warning(`导入完成，但有 ${result.failCount} 条失败`)
    } else {
      const chapterTip = result.chaptersGenerated
        ? `，已自动生成 ${result.chaptersGenerated} 个章节`
        : ''
      ElMessage.success(`导入成功，图谱已更新${chapterTip}`)
    }
    await loadGraph()
  } catch (e: any) {
    ElMessage.error(e?.message || '导入失败，请检查表格格式')
  } finally {
    importing.value = false
  }
}

onMounted(async () => {
  courseLoading.value = true
  try {
    myCourses.value = await getMyTeachingCourses()
    const first = myCourses.value[0]
    if (first) {
      selectedCourseId.value = first.id
      await loadGraph()
    }
  } catch {
    ElMessage.error('课程列表加载失败')
  } finally {
    courseLoading.value = false
  }
})
</script>

<style scoped>
.graph-manage-page {
  min-height: 100%;
}

.hero-section {
  background: #fff;
  padding: 24px;
  margin: -24px -24px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.hero-label {
  font-size: 13px;
  color: #8c8c8c;
  margin: 0 0 8px;
}

.hero-title {
  font-size: 26px;
  font-weight: 700;
  color: #262626;
  margin: 0 0 8px;
}

.hero-subtitle {
  font-size: 14px;
  color: #595959;
  margin: 0;
}

.toolbar-section {
  max-width: 1200px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
}

.upload-section,
.result-section,
.graph-section {
  max-width: 1200px;
  margin: 0 auto 20px;
}

.upload-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
}

.upload-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
  margin-bottom: 16px;
}

.upload-body {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.upload-area {
  flex: 1;
}

.upload-btn {
  height: 40px;
  margin-top: 12px;
}

.result-section .el-alert {
  margin-bottom: 8px;
}

.chapter-tip {
  margin-top: 8px;
  padding: 12px 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  font-size: 13px;
  color: #389e0d;
  line-height: 1.8;
}

.fail-details {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px 16px;
  margin-top: 8px;
}

.fail-title {
  font-size: 13px;
  font-weight: 600;
  color: #d46b08;
  margin-bottom: 6px;
}

.fail-list {
  margin: 0;
  padding-left: 18px;
  max-height: 180px;
  overflow-y: auto;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.8;
}

.graph-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
}

.graph-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.graph-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #262626;
}

.graph-container {
  height: calc(100vh - 320px);
  min-height: 420px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
  overflow: hidden;
}
</style>
