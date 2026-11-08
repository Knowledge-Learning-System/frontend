// ===== 统一 Mock 题库 =====
// 教师端「新增/编辑/删除」题目与学生端「测评/答题」共用这一份数据，
// 并持久化到 localStorage，保证刷新后不丢失，教师新增的题目学生端立即可见。

export interface MockQuestion {
  id: number
  courseId?: number
  knowledgePointId?: string
  type: string
  content: string
  options: string
  answer?: string
  analysis?: string
}

const STORAGE_KEY = 'mock_questions'

// 默认种子题库（覆盖单选 / 多选 / 填空 / 问答四种题型，courseId=4 数据库原理）
const DEFAULT_QUESTIONS: MockQuestion[] = [
  {
    id: 1,
    courseId: 4,
    knowledgePointId: '6320773',
    type: 'single',
    content: '关系数据库中，存放在数据库表中的一行数据被称为？',
    options: '["记录（元组）","字段（属性）","表结构","索引"]',
    answer: 'A',
    analysis: '关系模型中一行称为元组/记录，一列称为属性/字段。',
  },
  {
    id: 2,
    courseId: 4,
    knowledgePointId: '6320773',
    type: 'multiple',
    content: '下列属于 SQL 数据定义语言（DDL）的语句有？',
    options: '["CREATE","SELECT","ALTER","DROP"]',
    answer: 'ACD',
    analysis: 'SELECT 属于 DML；CREATE/ALTER/DROP 属于 DDL。',
  },
  {
    id: 3,
    courseId: 4,
    knowledgePointId: '6320773',
    type: 'fill',
    content: 'SQL 中用于去除查询结果重复行的关键字是______。',
    options: '',
    answer: 'DISTINCT',
    analysis: 'SELECT DISTINCT column FROM table 可去除重复行。',
  },
  {
    id: 4,
    courseId: 4,
    knowledgePointId: '6320773',
    type: 'qa',
    content: '编写一条 SQL 语句：查询 students 表中年龄大于 18 岁的学生姓名与学号，按学号升序排列。',
    options: '',
    answer: 'SELECT name, student_id FROM students WHERE age > 18 ORDER BY student_id ASC;',
    analysis: '考查 SELECT / WHERE / ORDER BY 的基本组合使用。',
  },
  {
    id: 5,
    courseId: 4,
    knowledgePointId: '6320773',
    type: 'single',
    content: '事务的 ACID 特性不包括以下哪一项？',
    options: '["原子性","一致性","并发性","持久性"]',
    answer: 'C',
    analysis: 'ACID 指原子性、一致性、隔离性、持久性。',
  },
]

// 从 localStorage 读取，失败或为空则回退到默认种子
function loadQuestions(): MockQuestion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_QUESTIONS))
  return JSON.parse(JSON.stringify(DEFAULT_QUESTIONS))
}

let questions: MockQuestion[] = loadQuestions()

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
  } catch { /* ignore */ }
}

// 计算下一个自增 id
function nextId(): number {
  return questions.reduce((max, q) => Math.max(max, q.id), 0) + 1
}

/** 按 courseId / knowledgePointId 过滤题目，返回深拷贝 */
export const getMockQuestions = (courseId?: number, knowledgePointId?: string): MockQuestion[] => {
  return questions
    .filter((q) => {
      if (courseId != null && q.courseId != null && q.courseId !== courseId) return false
      if (knowledgePointId && q.knowledgePointId && q.knowledgePointId !== knowledgePointId) return false
      return true
    })
    .map((q) => ({ ...q }))
}

/** 新增题目 */
export const addMockQuestion = (data: Omit<MockQuestion, 'id'>): MockQuestion => {
  const created: MockQuestion = { id: nextId(), ...data }
  questions.push(created)
  persist()
  return { ...created }
}

/** 编辑题目 */
export const updateMockQuestion = (id: number, data: Omit<MockQuestion, 'id'>): MockQuestion => {
  const idx = questions.findIndex((q) => q.id === id)
  if (idx === -1) throw new Error('题目不存在')
  questions[idx] = { ...questions[idx], ...data, id }
  persist()
  return { ...questions[idx] }
}

/** 删除题目 */
export const deleteMockQuestion = (id: number): void => {
  const idx = questions.findIndex((q) => q.id === id)
  if (idx > -1) {
    questions.splice(idx, 1)
    persist()
  }
}
