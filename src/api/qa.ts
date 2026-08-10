/**
 * 问答模块 API — 三层管道式架构
 *
 * 用户问题
 *   → retrieveKnowledgePoints(question)   : RAG 检索层
 *   → buildPrompt(question, kps, history) : Prompt 构建层
 *   → callLLM(prompt)                     : LLM 调用层（占位）
 *   → { answer, sources, thinking }        : 结构化响应
 *
 * LLM 调用层通过 LLMProvider 接口抽象，通过 USE_LLM / LLM_PROVIDER 控制切换。
 */
import { MOCK_CHAPTERS } from './knowledgeGraph'
import type { KnowledgePointTreeNode } from '@/types/knowledgeGraph'

// ═══════════════════════════════════════════════════════════════
// 配置常量
// ═══════════════════════════════════════════════════════════════

/** 是否启用真实 LLM 调用（false 则使用 mockProvider） */
const USE_LLM = false

/** 当前使用的 LLM 提供商 */
const LLM_PROVIDER: 'mock' | 'hunyuan' | 'deepseek' = 'mock'

// ═══════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════

/** 对话消息 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** LLM 调用选项 */
export interface LLMOptions {
  temperature?: number
  maxTokens?: number
}

/** LLM Provider 接口 — 抽象大模型调用 */
export interface LLMProvider {
  name: string
  chat: (messages: ChatMessage[], options?: LLMOptions) => Promise<string>
}

/** RAG 检索命中的知识点 */
export interface KnowledgePointMatch {
  id: string
  name: string
  concept: string
  chapter: string
  prerequisites: string[]
  score: number
}

/** 回答引用来源 */
export interface QASource {
  id: string
  name: string
  chapter: string
}

/** 问答响应 */
export interface QAAnswerResponse {
  answer: string
  sources: QASource[]
  thinking: string
  /** 构建的 Prompt 全文（调试用，LLM 未启用时展示） */
  promptBuilt: string
}

// ═══════════════════════════════════════════════════════════════
// LLM Provider 实现
// ═══════════════════════════════════════════════════════════════

/** Mock Provider — 基于检索到的知识点生成结构化回答 */
const mockProvider: LLMProvider = {
  name: 'mock',
  async chat(_messages: ChatMessage[]): Promise<string> {
    // 解析最后一条 user 消息和系统提示中的知识点上下文
    const lastUser = _messages.filter((m) => m.role === 'user').pop()
    const question = lastUser?.content || ''

    // 从 system message 中提取知识点数量和名称
    const systemMsg = _messages.find((m) => m.role === 'system')
    let answer = ''

    const hasKnowledgePoints = systemMsg?.content.includes('## 检索到的知识点')
    // 尝试提取知识点名称用于生成有意义的 mock 回答
    const kpNames: string[] = []
    const kpChapters: string[] = []
    const kpConcepts: string[] = []

    if (systemMsg) {
      const kpBlocks = systemMsg.content.split('### 知识点 ')
      for (let i = 1; i < kpBlocks.length; i++) {
        const lines = kpBlocks[i].split('\n')
        const name = lines[0]?.trim() || ''
        const chapterLine = lines.find((l) => l.startsWith('- 所属章节：'))
        const conceptLine = lines.find((l) => l.startsWith('- 概念：'))
        kpNames.push(name)
        kpChapters.push(chapterLine?.replace('- 所属章节：', '').trim() || '')
        kpConcepts.push(conceptLine?.replace('- 概念：', '').trim() || '')
      }
    }

    if (hasKnowledgePoints && kpNames.length > 0) {
      answer += `根据知识图谱检索结果，为您解答如下：\n\n`

      // 针对匹配度最高的知识点展开详细解释
      const primary = kpNames[0]
      const primaryChapter = kpChapters[0] || ''
      const primaryConcept = kpConcepts[0] || ''

      answer += `## ${primary}\n\n`

      if (primaryConcept) {
        answer += `${primaryConcept}\n\n`
      }

      if (primaryChapter) {
        answer += `该知识点属于 **${primaryChapter}** 章节。\n\n`
      }

      // 其他匹配知识点
      if (kpNames.length > 1) {
        answer += `### 相关知识链接\n\n`
        for (let i = 1; i < kpNames.length; i++) {
          answer += `- **${kpNames[i]}**`
          if (kpChapters[i]) answer += `（${kpChapters[i]}）`
          if (kpConcepts[i]) answer += `：${kpConcepts[i].slice(0, 100)}...`
          answer += '\n'
        }
        answer += '\n'
      }

      answer += `---\n\n`
      answer += `以上内容基于课程知识图谱自动检索生成，共匹配到 ${kpNames.length} 个相关知识点。`
      answer += `如需深入了解，请在左侧章节列表中选择对应知识点查看视频、课件和测试题。\n\n`
      answer += `> ⚡ 当前为 Mock 模式，配置 \`USE_LLM = true\` 并填入 API Key 即可切换为真实大模型回答。`
    } else {
      answer += `关于 **"${question}"**，以下是通用领域回答：\n\n`
      answer += `该知识点暂未收录到知识图谱中。如果您的问题涉及数据库领域的基础概念、`
      answer += `SQL 语法、数据库设计、事务管理、大数据技术等内容，`
      answer += `可以尝试使用更具体的关键词重新提问。\n\n`
      answer += `> ⚡ 当前为 Mock 模式，切换真实 LLM 后将由大模型结合领域知识生成回答。`
    }

    return answer
  },
}

// /*
// /** 混元 Provider（暂未启用） */
// const hunyuanProvider: LLMProvider = {
//   name: 'hunyuan',
//   async chat(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
//     const response = await fetch('/api/llm/hunyuan/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ messages, ...options }),
//     })
//     const data = await response.json()
//     return data.answer || data.content || ''
//   },
// }
// */

// /*
// /** DeepSeek Provider（暂未启用） */
// const deepseekProvider: LLMProvider = {
//   name: 'deepseek',
//   async chat(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
//     const response = await fetch('/api/llm/deepseek/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ messages, ...options }),
//     })
//     const data = await response.json()
//     return data.answer || data.content || ''
//   },
// }
// */

/** 获取当前 Provider */
function getProvider(): LLMProvider {
  if (!USE_LLM) return mockProvider
  switch (LLM_PROVIDER) {
    // case 'hunyuan': return hunyuanProvider
    // case 'deepseek': return deepseekProvider
    default:
      return mockProvider
  }
}

// ═══════════════════════════════════════════════════════════════
// 第一步：RAG 检索层
// ═══════════════════════════════════════════════════════════════

/** 扁平化 MOCK_CHAPTERS 中的所有知识点 */
function flattenKnowledgePoints(): Array<{
  kp: KnowledgePointTreeNode
  chapterName: string
  parentKpName?: string
}> {
  const result: Array<{
    kp: KnowledgePointTreeNode
    chapterName: string
    parentKpName?: string
  }> = []

  function walk(
    kp: KnowledgePointTreeNode,
    chapterName: string,
    parentKpName?: string
  ) {
    result.push({ kp, chapterName, parentKpName })
    for (const child of kp.children) {
      walk(child, chapterName, kp.name)
    }
  }

  for (const st of MOCK_CHAPTERS) {
    for (const kp of st.knowledgePoints) {
      walk(kp, st.name)
    }
  }

  return result
}

/** 中文分词：按分隔符切割 + 2-gram */
function tokenize(text: string): string[] {
  const cleaned = text
    .replace(
      /[，,。\.\s、；;：:！!？?（）()【】\[\]《》""''"“”'\-/\\]+/g,
      ' '
    )
    .trim()
    .toLowerCase()
  if (!cleaned) return []

  const words = cleaned.split(/\s+/).filter((w) => w.length > 0)
  const tokens: string[] = []

  for (const word of words) {
    if (word.length <= 2) {
      tokens.push(word)
    } else {
      tokens.push(word)
      for (let i = 0; i < word.length - 1; i++) {
        tokens.push(word.substring(i, i + 2))
      }
    }
  }

  return tokens
}

/** 计算关键词匹配得分 */
function calcMatchScore(queryTokens: string[], targetText: string): number {
  const targetTokens = tokenize(targetText)
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0

  let hits = 0
  for (const qt of queryTokens) {
    if (targetTokens.includes(qt)) hits++
  }
  return hits / Math.max(queryTokens.length, 1)
}

/**
 * RAG 检索层：基于关键词匹配从知识图谱中检索相关知识点
 * 返回结构化结果供 Prompt 构建层使用
 */
async function retrieveKnowledgePoints(
  question: string,
  _courseId?: number
): Promise<KnowledgePointMatch[]> {
  const queryTokens = tokenize(question)
  const flat = flattenKnowledgePoints()

  const scored = flat.map((item) => {
    let score = 0
    score += calcMatchScore(queryTokens, item.kp.name) * 3 // 名称权重最高
    score += calcMatchScore(queryTokens, item.kp.description || '') * 2
    // 题目内容加权
    const questionText =
      item.kp.questions?.map((q) => q.content).join(' ') || ''
    score += calcMatchScore(queryTokens, questionText) * 1
    // 章节名加权
    score += calcMatchScore(queryTokens, item.chapterName) * 0.5
    // 父知识点名加权
    if (item.parentKpName) {
      score += calcMatchScore(queryTokens, item.parentKpName) * 0.5
    }
    return { ...item, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.filter((s) => s.score > 0).slice(0, 5)

  // 收集前置知识点（父知识点名称作为 prerequisites）
  return top.map((item) => {
    const prerequisites: string[] = []
    if (item.parentKpName) {
      prerequisites.push(item.parentKpName)
    }
    return {
      id: item.kp.id,
      name: item.kp.name,
      concept: item.kp.description || '',
      chapter: item.chapterName,
      prerequisites,
      score: Math.round(item.score * 100) / 100,
    }
  })
}

// ═══════════════════════════════════════════════════════════════
// 第二步：Prompt 构建层
// ═══════════════════════════════════════════════════════════════

/**
 * 构建完整 Prompt：
 *   系统指令 + 知识点上下文 + 对话历史 + 用户问题
 */
function buildPrompt(
  question: string,
  knowledgePoints: KnowledgePointMatch[],
  history: ChatMessage[]
): string {
  const lines: string[] = []

  // 系统指令
  lines.push(
    '你是一个课程知识问答助手。请基于以下从知识图谱中检索到的知识点，',
    '准确回答用户的问题。回答需包含：知识点概念解释、所属章节、相关前置知识。',
    '如果检索到的知识点不足以回答问题，请结合你的领域知识给出通用回答，',
    '并注明"该知识点暂未收录到知识图谱中"。',
    ''
  )

  // 知识点上下文
  if (knowledgePoints.length > 0) {
    lines.push('## 检索到的知识点')
    lines.push('')
    knowledgePoints.forEach((kp, i) => {
      lines.push(`### 知识点 ${i + 1}：${kp.name}`)
      lines.push(`- 所属章节：${kp.chapter}`)
      if (kp.concept) {
        lines.push(`- 概念：${kp.concept}`)
      }
      if (kp.prerequisites.length > 0) {
        lines.push(`- 前置知识：${kp.prerequisites.join('、')}`)
      }
      lines.push(`- 匹配度：${Math.round(kp.score * 100)}%`)
      lines.push('')
    })
  } else {
    lines.push('## 检索到的知识点')
    lines.push('')
    lines.push('（未匹配到相关知识点）')
    lines.push('')
  }

  // 对话历史
  if (history.length > 0) {
    lines.push('## 对话历史')
    lines.push('')
    for (const msg of history) {
      const roleLabel = msg.role === 'user' ? '用户' : '助手'
      lines.push(`**${roleLabel}**：${msg.content}`)
      lines.push('')
    }
  }

  // 用户问题
  lines.push('## 用户问题')
  lines.push('')
  lines.push(question)

  return lines.join('\n')
}

// ═══════════════════════════════════════════════════════════════
// 第三步：LLM 调用层
// ═══════════════════════════════════════════════════════════════

/**
 * 调用 LLM：将 Prompt 转换为 ChatMessage 数组，通过 Provider 获取回答
 */
async function callLLM(prompt: string): Promise<string> {
  const provider = getProvider()
  const messages: ChatMessage[] = [
    { role: 'system', content: prompt },
  ]
  return provider.chat(messages)
}

// ═══════════════════════════════════════════════════════════════
// 对外接口：管道编排
// ═══════════════════════════════════════════════════════════════

/**
 * 问答主函数 — 三层管道编排
 *
 * @param question  用户问题
 * @param history   对话历史
 * @param courseId  课程 ID（预留，用于未来多课程检索）
 */
export async function askQuestion(
  question: string,
  history: ChatMessage[] = [],
  courseId?: number
): Promise<QAAnswerResponse> {
  // 第一步：RAG 检索
  const knowledgePoints = await retrieveKnowledgePoints(question, courseId)

  // 第二步：构建 Prompt
  const promptBuilt = buildPrompt(question, knowledgePoints, history)

  // 第三步：调用 LLM
  const answer = await callLLM(promptBuilt)

  // 组装 sources
  const sources: QASource[] = knowledgePoints.map((kp) => ({
    id: kp.id,
    name: kp.name,
    chapter: kp.chapter,
  }))

  return {
    answer,
    sources,
    thinking: `检索到 ${knowledgePoints.length} 个相关知识点`,
    promptBuilt,
  }
}

// ═══════════════════════════════════════════════════════════════
// 兼容旧接口（带 ChatMessage(id/timestamp) 的格式）
// ═══════════════════════════════════════════════════════════════

export interface LegacyChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/** 兼容包装：将旧格式 history 传给管道 */
export async function askQuestionLegacy(
  question: string,
  history: LegacyChatMessage[]
): Promise<QAAnswerResponse> {
  const simplifiedHistory: ChatMessage[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }))
  return askQuestion(question, simplifiedHistory)
}
