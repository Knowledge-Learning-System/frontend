import request from './request'
import type { KnowledgeGraphData, KnowledgePointDetail, LearningPathItem, RecommendationItem, QASearchResult, SubTopicVO, GraphNode, GraphLink } from '@/types/knowledgeGraph'

// 使用真实后端接口（不再使用 Mock 章节数据，课件列表来自数据库真实资源）
const USE_MOCK = false

// ===== Mock 数据：从 Neo4j + MySQL 查询的课程 4（数据库系统原理）章节结构 =====
export const MOCK_CHAPTERS: SubTopicVO[] = [
        {
          id: '6320773',
          name: '数据库基础',
          description: '数据库系统基础是指在计算机系统中面向数据管理应用的整体系统。它包括硬件、操作系统、数据库、数据库管理系统（DBMS）、开发工具、应用系统、用户和数据库管理员等组成部分。DBMS是数据库系统的核心，负责科学地组织、存储、获取和维护数据，提供一个方便、安全的环境来存取信息。数据库系统广泛应用于各个领域，如银行交易、电子商务、社交网络等，极大地提高了数据管理的效率和安全性。',
          order: 0,
          knowledgePoints: [
            {
              id: '6320775',
              name: '基本概念',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 24, courseId: 4, knowledgePointId: '6320775', title: '第一节 数据库 1.1 数据库', filePath: '视频\\第一章 绪论  (上)\\第一节 数据库_1.1 数据库_blurred.mp4', duration: null},
                {id: 25, courseId: 4, knowledgePointId: '6320775', title: '第二节 数据库系统', filePath: '视频\\第一章 绪论  (上)\\第二节 数据库系统_数据库系统_blurred.mp4', duration: null},
                {id: 26, courseId: 4, knowledgePointId: '6320775', title: '第三节 数据库管理系统', filePath: '视频\\第一章 绪论 (下)\\第三节 数据库管理系统_数据库管理系统_blurred.mp4', duration: null},
                {id: 27, courseId: 4, knowledgePointId: '6320775', title: '第四节 数据管理技术发展趋势', filePath: '视频\\第一章 绪论 (下)\\第四节 数据管理技术发展趋势_数据管理技术发展趋势_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 110, courseId: 4, knowledgePointId: '6320775', title: '总结与提高（总时长8分20秒）_第一章总结与提高---教学内容', filePath: '课件\\总结与提高（总时长8分20秒）_第一章总结与提高---教学内容.pdf', fileType: 'pdf'},
                {id: 126, courseId: 4, knowledgePointId: '6320775', title: '第一章ppt_第一章 ppt (精简版)', filePath: '课件\\第一章ppt_第一章 ppt (精简版).pdf', fileType: 'pdf'},
                {id: 127, courseId: 4, knowledgePointId: '6320775', title: '第一章ppt_第一章ppt （详细版）', filePath: '课件\\第一章ppt_第一章ppt （详细版）.pdf', fileType: 'pdf'}
              ],
              questions: [
                {id: 1, type: 'single', content: '一个抽象类型包括数据对象、和一组处理数据的操作。', options: '["A. 数据对象中各元素间的结构关系", "B. 数据元素集", "C. 接口", "D. 数据对象集"]', answer: 'A', analysis: '抽象数据类型由数据对象、数据对象中各元素间的结构关系以及一组处理数据的操作三部分组成，因此A正确描述了ADT的组成部分，BC均不全面。', knowledgePointId: '6320775'},
                {id: 3, type: 'single', content: '线性表是具有n个（）的有限序列（n>0）', options: '["A. 数据对象", "B. 数据元素", "C. 字符", "D. 数据项"]', answer: 'B', analysis: '线性表是由n个数据元素组成的有限序列，数据元素是构成线性表的基本单位，故选B；数据对象是数据元素的集合，字符过于片面，数据项是元素的组成部分。', knowledgePointId: '6320775'},
                {id: 4, type: 'single', content: '线性表是一个（  ）。', options: '["A. 有限序列，可以为空", "B. 有限序列，不可以为空", "C. 无限序列，可以为空", "D. 无限序列，可以为空"]', answer: 'A', analysis: '线性表是长度为n（n≥0）的有限序列，当n=0时为空表，因此是有限序列且可以为空，A正确；线性表长度有限且可为空。', knowledgePointId: '6320775'},
                {id: 5, type: 'judge', content: '线性表的特点是每个元素都有一个前驱和一个后继。（）', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '线性表中只有首元素没有前驱、尾元素没有后继，并非每个元素都有一个前驱和一个后继，故该说法错误。', knowledgePointId: '6320775'},
                {id: 6, type: 'judge', content: '线性结构只能用顺序结构来存放，非线性结构只能用非顺序结构来存放。（ ）', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '线性结构既可以采用顺序存储也可以采用链式存储，非线性结构同理，存储结构与逻辑结构无对应关系，故该说法错误。', knowledgePointId: '6320775'},
                {id: 10, type: 'single', content: '若长度为n的线性表采用顺序存储结构，在其第i个位置插入一个新元素的算法的时间复杂度为（ ）(1<=i<=n+1)。', options: '["A. O(1)", "B. O(n)", "C. O(n*n)", "D. O（）"]', answer: 'B', analysis: '顺序表插入元素需要从表尾到插入位置之间的所有元素后移一位，最多移动n个元素，时间复杂度为O(n)，与插入位置有关。', knowledgePointId: '6320775'},
                {id: 11, type: 'single', content: '若长度为n的线性表采用顺序存储结构，删除第i个位置的元素，需要移动的元素个数为（  ）。', options: '["A. i", "B. n-i", "C. n-i+1", "D. n-i-1"]', answer: 'B', analysis: '删除第i个位置的元素后，需将i+1到n的元素依次前移，共需移动n-i个元素，故选B；其他选项计算结果不对。', knowledgePointId: '6320775'},
                {id: 12, type: 'single', content: '当需要用一个形式参数直接改变对应实参的值时，该形式参数应说明为。', options: '["A. 与实参同类型指针参数", "B. 不需要参数", "C. 与实参同类型的参数", "D. 全局变量"]', answer: 'A', analysis: '要通过形参改变实参的值，需传递实参的地址，即使用与实参同类型的指针作为形参，才能间接修改实参指向的内容。', knowledgePointId: '6320775'},
                {id: 13, type: 'single', content: '对一个长度为n的顺序表，假设在任何位置上插入一个元素的概率是相等的，那么插入一个元素时要移动表中的（  ）个元素。', options: '["A. n", "B. n+1", "C. n/2", "D. n(n+1)/2"]', answer: 'C', analysis: '插入位置有n+1种均匀分布可能，位置i处插入需移动n-i+1个元素，期望移动次数为各位置平均值即(n+1)/2≈n/2，故选C。', knowledgePointId: '6320775'},
                {id: 14, type: 'judge', content: '线性表的顺序存储是指将表中元素按照从大到小或从小到大存储。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '顺序存储是指用一段连续的存储空间依次存放表中元素，与元素是否有序无关，有序性由排序决定而非存储方式，故错误。', knowledgePointId: '6320775'},
                {id: 15, type: 'single', content: '1、执行下面的程序段的时间复杂度为 。for(int i=0;i<m;i++) for(int j=0;j<n;j++) a[i][j]=i*j;', options: '["A. O()", "B. O()", "C. O(m*n)", "D. O (m+n)"]', answer: 'C', analysis: '外层循环执行m次，内层每次执行n次，语句共执行m*n次，因此时间复杂度为O(m*n)。', knowledgePointId: '6320775'},
                {id: 16, type: 'single', content: '2、执行下面程序段时，语句S的执行次数为 。for(int i=0;i<=n;i++) for(int j=0;j<i;j++) S;', options: '["A. n^2", "B. n(n-1)/2", "C. n(n+1)", "D. n(n+1)/2"]', answer: 'D', analysis: '外层i从0到n，内层j从0到i-1，执行次数为0+1+2+…+n=n(n+1)/2，故选D。', knowledgePointId: '6320775'},
                {id: 17, type: 'single', content: '通过表达式可以获取带头结点的单链表L中首元素结点的数据值。', options: '["A. L->next", "B. (L->next)->data", "C. L->data", "D. L->next"]', answer: 'B', analysis: '带头结点的单链表L中，首元素结点为L->next，其数据值通过(L->next)->data获取；L->data是头结点数据，首元素应跳过头结点。', knowledgePointId: '6320775'},
                {id: 18, type: 'judge', content: '单链表中必须设有头结点。（）', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '头结点是为方便操作而设置的，单链表可以不设头结点，没有头结点时首结点即为第一个元素结点，故该说法错误。', knowledgePointId: '6320775'},
                {id: 19, type: 'single', content: '下列选项中， 项是链表不具有的特点。', options: '["A. 插入和删除运算不需要移动元素", "B. 所需要的存储空间与线性表的长度成正比", "C. 不必事先估计存储空间大小", "D. 可以随机访问表中的任意元素"]', answer: 'D', analysis: '链表通过指针链接，访问元素需从头开始顺序查找，不能像顺序表那样按下标直接访问，故D是链表不具有的特点。', knowledgePointId: '6320775'},
                {id: 20, type: 'single', content: '有一个带头结点的单链表HEAD，则判断其是否为空链表的表达式是', options: '["A. HEAD= =NULL", "B. HEAD-〉NEXT= =NULL", "C. HEAD-〉NEXT= =HEAD", "D. HEAD！=NULL"]', answer: 'B', analysis: '带头结点的单链表为空时，头结点仍存在但其后继指针为NULL，故判断条件为HEAD->next==NULL，而非HEAD==NULL。', knowledgePointId: '6320775'},
                {id: 21, type: 'single', content: '在一个单链表中P所指结点后插入一个S所指结点时，应执行语句： 。', options: '["A. P->next=S;S->next=P->next;", "B. S->next=P->next;P->next=S;", "C. S->next=P->next;P=S;", "D. S->next=P;P->next=S;"]', answer: 'B', analysis: '在P后插入S必须先将S指向P的后继，再将P指向S，否则会丢失P原后继结点的链接，顺序不可颠倒，故选B。', knowledgePointId: '6320775'},
                {id: 22, type: 'single', content: '算法设计的要求是：正确性、可读性、和高效率和低存储 。', options: '["A. 确定性", "B. 健壮性", "C. 可行性", "D. 有限性"]', answer: 'B', analysis: '算法设计的基本要求包括正确性、可读性、健壮性以及高效率和低存储量，健壮性指算法对异常输入的处理能力，故选B。', knowledgePointId: '6320775'},
                {id: 23, type: 'single', content: '算法具有 有限性、确定性、      、输入、输出五大特性。', options: '["A. 可行性", "B. 可读性", "C. 健壮性", "D. 正确性"]', answer: 'A', analysis: '算法的五大特性为有穷性、确定性、可行性、有输入、有输出，其中可行性是指算法操作可通过有限次基本运算实现，故选A。', knowledgePointId: '6320775'},
                {id: 24, type: 'single', content: '设指针变量p指向单链表中结点A的直接前驱，若删除单链表中结点A，则需要修改指针的操作序列为（ ）。', options: '["A. q=p->next；p->next=q->next；free(q)；", "B. q=p->next； p->next=q->next；", "C. p->next=p-> next->next；", "D. q=p->next；p->data=q->data；free(q)；"]', answer: 'A', analysis: '删除P的后继结点A时，先用q保存A，再让P指向q的后继，最后释放q的内存，三步缺一不可，故选A。', knowledgePointId: '6320775'},
                {id: 25, type: 'judge', content: '对链表进行插入和删除操作时不必移动链表中结点。( )', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '链表通过修改指针即可完成插入和删除，无需像顺序表那样移动大量元素，故该说法正确。', knowledgePointId: '6320775'},
                {id: 26, type: 'judge', content: '在单链表中，可以从头结点出发，查找到表中所有结点。（ ）', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '单链表中每个结点都可通过next指针找到下一结点，从头结点出发沿next链依次访问即可遍历所有结点，故正确。', knowledgePointId: '6320775'},
                {id: 27, type: 'single', content: '有一个带头结点的循环单链表HEAD，则判断其是否为空链表的条件是    。', options: '["A. HEAD==NULL", "B. HEAD-〉NEXT==NULL", "C. HEAD-〉NEXT==HEAD", "D. HEAD！=NULL"]', answer: 'C', analysis: '带头结点的循环单链表为空时，头结点的next指针指向自身，即HEAD->next==HEAD，这是循环链表为空的关键条件。', knowledgePointId: '6320775'},
                {id: 28, type: 'judge', content: '在单向循环链表中，从表中任意结点出发都可以顺着next域访问到表中所有元素（）', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '单向循环链表的尾结点next指向头结点形成闭环，从任意结点出发沿next方向都可循环回到起点遍历所有元素，故正确。', knowledgePointId: '6320775'},
                {id: 29, type: 'single', content: '与单链表相比，双向链表的优点之一是 。', options: '["A. 插入删除操作更加方便", "B. 可以进行随机访问", "C. 可以省略表头指针和表尾指针", "D. 访问前后相邻结点更方便。"]', answer: 'D', analysis: '双向链表每个结点含前驱和后继两个指针，可直接访问前后相邻结点，比单链表更方便，这是其主要优点；插入删除并不更省操作。', knowledgePointId: '6320775'},
                {id: 30, type: 'judge', content: '在双向链表L中，可以从任一结点p出发沿同一方向的指针域查找到表中所有元素。（）', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '双向链表虽有两个方向指针，但从任一结点出发沿同一方向只能回到该方向终点，不能遍历所有结点，需结合两个方向才能走全，故错误。', knowledgePointId: '6320775'},
                {id: 31, type: 'judge', content: '静态链表中与动态链表的插入和删除运算类似，不需要做元素的移动。（）', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '静态链表用数组模拟链表结构，插入和删除通过修改游标实现，不必移动元素，与动态链表操作思路相同，故正确。', knowledgePointId: '6320775'},
                {id: 32, type: 'judge', content: '静态链表既有顺序存储结构的优点，又有动态链表的优点。所以，它存取表中第ｉ个元素的时间与位置序号ｉ无关，可以实现随机存取。（）', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '静态链表本质仍是链表结构，存取第i个元素仍需从头遍历，时间与位置i有关，不能实现随机存取，故错误。', knowledgePointId: '6320775'},
                {id: 34, type: 'judge', content: '关系数据库的标准语言是SQL,是Structured Query Language的简称，意思是是结构化查询语言。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'SQL即Structured Query Language（结构化查询语言），是关系数据库的标准查询和操作语言，该说法正确。', knowledgePointId: '6320775'},
                {id: 35, type: 'judge', content: '基本Select语句的一般形式共有七个子句，都是可选的。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '基本SELECT语句七个子句中，SELECT子句是必须有的，不能省略，其余子句可选，故该说法错误。', knowledgePointId: '6320775'},
                {id: 37, type: 'judge', content: '查询（SELECT）语句中其它子句都可以不出现，但至少要有一个SELECT子句。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'SELECT语句的核心是SELECT子句，用于指定要查询的列，其余如FROM、WHERE等子句均可省略，故该说法正确。', knowledgePointId: '6320775'},
                {id: 38, type: 'single', content: '关系数据库系统的术语中行是（ ）。', options: '["A. 元组", "B. 关系", "C. 属性", "D. 域"]', answer: 'A', analysis: '在关系数据库术语中，行对应元组即一条记录，列对应属性，表对应关系，整体结构由元组和属性组成，故选A。', knowledgePointId: '6320775'},
                {id: 39, type: 'single', content: '（ ）能够唯一地标识表中的一行数据。', options: '["A. 主键", "B. 超键", "C. 候选键", "D. 以上都是"]', answer: 'D', analysis: '主键、超键、候选键都能唯一标识表中一行：候选键无冗余，超键包含候选键，主键是从候选键中选定的一个，故选D。', knowledgePointId: '6320775'},
                {id: 40, type: 'single', content: '一个表只能有一个（ ）。', options: '["A. 主键", "B. 候选键", "C. 替换键", "D. 以上都是"]', answer: 'A', analysis: '一个表只能有一个主键，但可以有多个候选键；主键是从候选键中选定的一个用于唯一标识元组，故选A。', knowledgePointId: '6320775'},
                {id: 41, type: 'single', content: '对于关系中要求其值必须与其他关系中的主键匹配的属性或属性组，称为（ ）。', options: '["A. 候选键", "B. 主键", "C. 外键", "D. 匹配键"]', answer: 'C', analysis: '外键是本关系中的属性或属性组，其值必须参照另一关系中的主键取值，用于建立表之间的关联，故选C。', knowledgePointId: '6320775'},
                {id: 42, type: 'single', content: '关系数据库系统的术语中列是（ ）。', options: '["A. 元组", "B. 关系", "C. 属性", "D. 记录"]', answer: 'C', analysis: '关系数据库术语中：表是关系，行是元组，列是属性；故选C，列对应属性，记录是行（元组）的另一称呼。', knowledgePointId: '6320775'},
                {id: 43, type: 'single', content: '关系数据库系统的术语中表是（ ）。', options: '["A. 元组", "B. 关系", "C. 属性", "D. 域"]', answer: 'B', analysis: '关系数据库以表为基本结构组织数据，表即对应数学意义上的"关系"，由元组和属性组成，故选B。', knowledgePointId: '6320775'},
                {id: 44, type: 'single', content: '属性可以具有的值的合法集合是（ ）。', options: '["A. 元组", "B. 关系", "C. 属性", "D. 域"]', answer: 'D', analysis: '域是属性取值的合法集合范围，例如成绩属性的域是0~100的整数，定义了属性的取值约束，故选D。', knowledgePointId: '6320775'},
                {id: 45, type: 'judge', content: '关系数据库使用一个或多个表来存储数据。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '关系数据库的基本组织形式就是表，一个数据库可包含多个相互关联的表来存储和管理数据，该说法正确。', knowledgePointId: '6320775'},
                {id: 46, type: 'judge', content: '关系数据库中，同一表中行次序无关紧要。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '关系是一个集合，集合元素无序，关系表中行的先后次序不影响其表达的数据内容与查询结果，故正确。', knowledgePointId: '6320775'},
                {id: 47, type: 'judge', content: '关系数据库中，因为每个列都有一个名字，同一表中列次序无关紧要。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '关系表中每个列都有独立的名字，列的次序不影响数据含义和访问，可通过列名定位，故该说法正确。', knowledgePointId: '6320775'},
                {id: 50, type: 'judge', content: '考官表中，按照反射律，(erid,ername)→ername成立。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '函数依赖的反射律指出：若Y是X的子集则X→Y成立，(erid,ername)中包含ername，因此(erid,ername)→ername成立。', knowledgePointId: '6320775'},
                {id: 51, type: 'judge', content: '考官表中，erid→ername成立，则(erid,erage)→(ername,erage)也成立，依据是增广律。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '增广律是指若X→Y成立，则XZ→YZ也成立，erid→ername两边同时增加erage即得(erid,erage)→(ername,erage)，故正确。', knowledgePointId: '6320775'},
                {id: 52, type: 'judge', content: '当考官号→考官院系名，考官院系名→考官院系办公地点，都成立时，考官号→考官院系办公地点 也成立，这依据的是增广律。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '该推导依据的是传递律而非增广律：考官号→考官院系名，考官院系名→考官院系办公地点，因此考官号→考官院系办公地点，故错误。', knowledgePointId: '6320775'},
                {id: 57, type: 'judge', content: '数据库系统的特点之一就是由数据库管理系统提供统一的机制保护数据安全。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '数据库管理系统（DBMS）负责统一管理数据并提供安全保护机制，防止非法访问和破坏，这是数据库系统的重要特点，故正确。', knowledgePointId: '6320775'},
                {id: 58, type: 'judge', content: '数据完整性指对数据的期望使用能力，保护数据可用性通常指减少数据库系统停工时间，保持数据持续可访问。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '数据完整性指数据的正确性、有效性和相容性，而可用性指数据可被访问使用。该题前半句对完整性的定义错误，因此判断为错误。', knowledgePointId: '6320775'},
                {id: 60, type: 'judge', content: '数据库管理系统中的故障恢复机制不仅维护故障情况下的数据完整性，并且由于故障恢复机制对故障的有效处理，它也是保护数据可用性的重要手段。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '故障恢复机制在故障时既能恢复数据保证完整性，又能缩短系统停机时间保证可用性，因此不仅是数据完整性手段，也是数据可用性保护手段。', knowledgePointId: '6320775'},
                {id: 62, type: 'single', content: '下列软件系统中，（ ）不属于数据库管理系统。', options: '["A. PostgreSQL", "B. Oracle", "C. MySQL", "D. excel"]', answer: 'D', analysis: 'PostgreSQL、Oracle和MySQL都是典型的关系数据库管理系统，而Excel是电子表格软件，仅提供简单的数据存储功能，不属于DBMS。', knowledgePointId: '6320775'},
                {id: 63, type: 'judge', content: '只要有大量数据就可以称之为数据库。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '数据库不仅是大量数据的集合，还需由数据库管理系统统一管理，按照一定的数据模型组织、描述和存储，具有共享性、独立性和完整性，并非数据多就是数据库。', knowledgePointId: '6320775'},
                {id: 64, type: 'judge', content: '数据库管理系统DBMS有多种，比如PostgreSQL、Oracle等。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'DBMS即数据库管理系统，是位于用户和操作系统之间的数据管理软件，PostgreSQL、Oracle、MySQL等都是常见的关系数据库管理系统。', knowledgePointId: '6320775'},
                {id: 65, type: 'judge', content: 'B/S结构的软件需要针对不同的操作系统开发不同版本的软件，每台客户机需要安装专门的客户端，而且当系统升级时，每一台客户机都需要重新安装客户端新版本。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '描述是C/S结构的特点而非B/S结构。B/S结构通过浏览器访问服务器，无需针对不同操作系统开发版本，也无需在客户机安装专门客户端，升级时只需更新服务器端。', knowledgePointId: '6320775'},
                {id: 67, type: 'judge', content: 'C/S系统利用SQL语言和C/C++/Java/C#等高级语言的各自优势，SQL语言访问数据库，C/C++/Java/C#等高级语言进行数据处理和表示。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'C/S结构中客户端程序利用高级语言进行界面展示和业务处理，后端通过SQL语言访问数据库，发挥两种语言各自优势，是典型C/S系统的实现方式。', knowledgePointId: '6320775'},
                {id: 68, type: 'judge', content: 'C/S结构通常包括多层：浏览器层、Web服务器、应用服务器、数据库服务器和数据库。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '描述的是B/S多层结构而非C/S结构。C/S结构通常只有客户端和数据库服务器两层，而非浏览器层、Web服务器、应用服务器等多层架构。', knowledgePointId: '6320775'},
                {id: 69, type: 'judge', content: '从HTML到SQL需要两个桥梁，HTML与高级语言之间的JDBC、ODBC、ADO等桥梁；高级语言与数据库之间的CGI、ASP、JSP等桥梁。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '两桥梁的对应关系颠倒了。正确对应应为：HTML与高级语言之间通过CGI、ASP、JSP等连接，而高级语言与数据库之间通过JDBC、ODBC、ADO等连接。', knowledgePointId: '6320775'},
                {id: 70, type: 'judge', content: '数据库设计方法主要包括实体-联系方法和属性-联系方法两种。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '数据库设计方法主要包括实体-联系方法和属性-联系方法两种，前者面向实体建模，后者面向属性依赖关系，二者均为数据库设计的经典方法。', knowledgePointId: '6320775'},
                {id: 71, type: 'judge', content: '实体-联系设计方法围绕实体展开，从软件工程角度来看，数据库生命周期经历需求分析、概念设计、逻辑设计、物理设计、数据库实现以及运行维护等阶段。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '实体-联系方法围绕实体及其联系展开设计，数据库生命周期包括需求分析、概念设计、逻辑设计、物理设计、数据库实现以及运行维护等阶段，是数据库开发的完整过程。', knowledgePointId: '6320775'},
                {id: 72, type: 'judge', content: '概念模式与具体DBMS有关。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '概念模式描述数据的全局逻辑结构，独立于任何具体的DBMS，与具体DBMS无关；内模式才与具体DBMS和物理存储相关，因此该说法错误。', knowledgePointId: '6320775'},
                {id: 73, type: 'judge', content: '概念模式通常使用实体-联系图表示。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '概念模式是数据库的整体逻辑结构，通常采用实体-联系图（E-R图）来表示实体、属性及实体间的联系。', knowledgePointId: '6320775'},
                {id: 74, type: 'judge', content: '属性-联系数据库设计方法围绕属性展开。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '属性-联系方法以属性为基本元素，围绕属性的取值与依赖关系来构造数据模型，是一种基于函数依赖的设计方法。', knowledgePointId: '6320775'},
                {id: 75, type: 'judge', content: '属性-联系设计方法，是在需求分析的基础上直接采用属性-联系方法进行逻辑设计，也就是把数据库保存的所有属性放在一张关系表中，进而通过属性之间的联系，来不断的优化这个关系表的模式，得到期望的结果模式。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '属性-联系设计方法直接从需求分析入手，将全部属性归入一个关系表，通过分析属性间的函数依赖逐步分解优化，最终得到符合范式要求的关系模式。', knowledgePointId: '6320775'},
                {id: 77, type: 'judge', content: '属性联系方法，以属性为中心，着重于属性之间的依赖关系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '属性联系方法以属性为核心，重点分析属性间的函数依赖等约束关系，通过模式分解不断优化关系结构。', knowledgePointId: '6320775'},
                {id: 78, type: 'judge', content: '实际当中的数据库设计，通常将两种方法相结合，宏观上采用实体-联系方法，微观上采用属性-联系方法，也就是对由概念模式转换而来的关系表运用属性-联系方法进行分析优化。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '实际数据库设计中通常将两种方法结合：宏观上用实体-联系方法构建概念模型，微观上用属性-联系方法对关系模式进行范式优化。', knowledgePointId: '6320775'},
                {id: 82, type: 'judge', content: 'JDBC是一种用于执行SQL语句的Java API，它定义了用来访问PG数据库的标准Java类库，只能是PG的SQL语句，而不包括其它关系数据库系统。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: 'JDBC是Java访问数据库的标准API，并非只能访问PostgreSQL，它通过不同数据库驱动可以连接Oracle、MySQL等多种关系数据库。', knowledgePointId: '6320775'},
                {id: 83, type: 'judge', content: 'JDBC定义了用来访问数据库的标准Java类库，使用这个类库可以以一种标准的方法、方便地访问各种关系数据库，包括pgSQL。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'JDBC是Java数据库连接的标准类库，通过加载相应驱动即可用统一的标准方法访问各种关系数据库，包括pgSQL。', knowledgePointId: '6320775'},
                {id: 84, type: 'judge', content: 'Java通过JDBC来访问数据库，这些包含了JDBC连接访问数据库语句的Java程序就是普通Java程序，需要导入相应的包，即import Java.sql.*，用Java语言编译器编译成字节码，就可以在Java虚拟机上运行了。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'JDBC程序是普通Java程序，通过import java.sql.*引入相关类，由Java编译器编译为字节码，运行于JVM之上。', knowledgePointId: '6320775'},
                {id: 85, type: 'judge', content: '用 Class.forName (“org.postgresql.Driver”);加载JDBC驱动程序后就可以访问各种关系数据库系统，比如ORACLE等。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: 'Class.forName加载的是特定数据库的驱动类，org.postgresql.Driver仅用于加载PostgreSQL驱动，不能访问Oracle等其他数据库。', knowledgePointId: '6320775'},
                {id: 86, type: 'judge', content: 'JDBC还提供了查询结果集模式和数据库模式的机制。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'JDBC不仅提供执行SQL语句的接口，还提供ResultSetMetaData和DatabaseMetaData等机制来获取结果集和数据库的模式信息。', knowledgePointId: '6320775'},
                {id: 87, type: 'judge', content: 'JSP是一种使用Java开发Web应用程序的服务器端脚本技术，它把Java代码嵌入在html文档中，用<% 和 %>括起来的部分是html代码。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: 'JSP将Java代码嵌入HTML文档中，但用<% 和 %>括起来的部分是Java代码而非HTML代码，HTML代码放在这些标记之外。', knowledgePointId: '6320775'},
                {id: 88, type: 'judge', content: '用JSP编写的动态Web页面中，会出现用<% 和 %>括起来的Java代码，包括通过JDBC访问数据库的加载驱动程序、建立数据库连接、创建Statement对象，执行pgSQL语句以及善后处理，以及输出等。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'JSP页面中<% 和 %>之间的代码是Java代码，包含JDBC访问数据库的完整流程：加载驱动、建立连接、创建Statement、执行SQL以及关闭资源。', knowledgePointId: '6320775'},
                {id: 89, type: 'judge', content: '当把一个实体转换为一个关系模式时，实体的一个属性对应为该表的一个列，实体的主键就是表的主键。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '实体转换为关系模式时，实体的属性对应表的列，实体的主键（关键字）即成为该表的主键，这符合E-R图向关系模式转换的基本规则。', knowledgePointId: '6320775'},
                {id: 90, type: 'judge', content: '一个联系转换为一个关系模式，联系的属性对应表的属性，并上所有参与联系的各实体主键的并集。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '联系转换为关系模式时，联系的属性转为表的属性，再加上所有参与联系的实体的主键，构成该关系模式的完整属性集合。', knowledgePointId: '6320775'},
                {id: 91, type: 'judge', content: '由联系转换来的表的主键﻿与任一端实体主键相同。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '由联系转换来的表的主键需根据联系类型确定：m:n联系由两端实体主键组合而成，并不一定与任一端实体主键相同。', knowledgePointId: '6320775'},
                {id: 92, type: 'judge', content: '一个1：1联系转换的表可与任一端实体对应的表合并在一起。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '1:1联系转换的表包含双方主键，与任一端实体对应的表合并时不会产生冗余，因此可与任一端合并。', knowledgePointId: '6320775'},
                {id: 93, type: 'judge', content: '一个1：n联系转换的表可以与1端对应的表合并在一起。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '1:n联系转换的表应与n端实体对应的表合并，而不是与1端合并，因为只有n端才能包含联系属性而避免冗余。', knowledgePointId: '6320775'},
                {id: 95, type: 'judge', content: '流式计算处理的源数据通常是开放的，都是流数据，也称流式数据，是指将数据看作数据流的形式来处理。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '流式计算处理源源不断到达的流数据，是将数据视为连续流动的数据流，实时地边接收边处理，而非一次性加载全部数据。', knowledgePointId: '6320775'},
                {id: 96, type: 'judge', content: '批处理的源数据通常是封闭的，通常将需要处理的大批量数据存入硬盘，处理的时候再从硬盘中读取数据进行一次性处理，如果产生了中间结果，需将中间结果写入外存，再继续后面的处理，因此批处理的I/O操作相对更加频繁。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '批处理的数据通常封闭且规模大，从硬盘读取后整体处理，中间结果需写回外存，因此I/O操作相对流式计算更为频繁。', knowledgePointId: '6320775'},
                {id: 97, type: 'judge', content: 'Storm流式计算框架结构中包括Spout和Bolt两种组件。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'Storm流式计算框架中包含Spout（数据源）和Bolt（处理单元）两种核心组件，共同构成Storm拓扑结构。', knowledgePointId: '6320775'},
                {id: 98, type: 'judge', content: 'Bolt用于从外部数据源接收数据，然后将其喷发到拓扑中的相应组件中去。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '从外部数据源接收数据并将其喷发到拓扑中的是Spout组件，而Bolt负责对数据进行具体处理和转发，两者功能不同。', knowledgePointId: '6320775'},
                {id: 99, type: 'judge', content: 'Storm集群中守护进程Supervisor运行在主结点上，负责代码分发，为工作结点分配任务故障监测；守护进程Nimbus运行在工作结点上，负责监听分配给所在工作结点的任务，即根据Nimbus的任务分配来决定启动或停止工作进程执行Storm拓扑，一个Supervisor可能执行拓扑的一部分，也可能执行完整的拓扑。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '该题描述颠倒了Supervisor和Nimbus的角色。Nimbus运行在主节点负责代码分发和任务分配，Supervisor运行在工作节点负责监听并执行任务。', knowledgePointId: '6320775'},
                {id: 100, type: 'judge', content: 'Storm集群中Supervisor保存了Storm的状态信息。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '保存Storm状态信息的是Nimbus守护进程，而非Supervisor；Supervisor主要负责监听任务并启动或停止工作进程。', knowledgePointId: '6320775'},
                {id: 101, type: 'judge', content: 'MapReduce中，Map任务接收从不同Reduce任务得到的键相同的键-值对，执行用户编写的Map函数，将键相同的键-值对中的所有值以Map函数指定的方式组合起来，得到键-值对并输出。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '描述颠倒了Map和Reduce的功能。Reduce任务是接收键相同的键-值对进行归并处理，而Map任务负责将输入数据转换为中间键-值对。', knowledgePointId: '6320775'},
                {id: 102, type: 'single', content: '数据库管理系统的目标是( )地共享数据。', options: '["A. 简单", "B. 高效", "C. 安全", "D. 所有其余三个选项"]', answer: 'D', analysis: '数据库管理系统的目标是简单、高效且安全地共享数据，三者缺一不可，故正确答案为所有其他三个选项的概括。', knowledgePointId: '6320775'},
                {id: 103, type: 'single', content: '数据模型是数据结构和语义的概括，比如有（ ）等等。', options: '["A. 层次模型", "B. 关系模型", "C. 实体-联系模型，也叫E-R模型", "D. 其它所有三个选项都对"]', answer: 'D', analysis: '数据模型是对数据结构和语义的抽象描述，层次模型、关系模型、实体-联系模型（E-R模型）都是常见的数据模型类型。', knowledgePointId: '6320775'},
                {id: 104, type: 'single', content: '应用程序员一般按照（ ）模式访问数据库中的数据。', options: '["A. 内", "B. 外", "C. 逻辑", "D. 物理"]', answer: 'B', analysis: '应用程序员通常按照外模式（子模式/用户模式）访问数据库，每个应用程序对应一个外模式，看到的是数据库中其所需的那部分数据。', knowledgePointId: '6320775'},
                {id: 105, type: 'single', content: '数据库管理系统提供访问数据库的语言一般包括（ ）。', options: '["A. 数据定义语言", "B. 数据操作语言", "C. 数据保护语言", "D. 所有其它三个选项"]', answer: 'D', analysis: 'DBMS提供的数据语言通常包括数据定义语言（DDL）、数据操作语言（DML）和数据保护语言（DCL），共同完成对数据库的定义、操作和保护。', knowledgePointId: '6320775'},
                {id: 106, type: 'single', content: '数据独立性指的是（  ）。', options: '["A. 数据与数据所有者相互独立", "B. 数据的组织存储结构与应用程序独立", "C. 数据和数据之间彼此孤立", "D. 数据与磁盘之间相互独立"]', answer: 'B', analysis: '数据独立性是指数据的组织与存储结构与应用程序相互独立，改变存储结构不影响应用程序，反之亦然，是DBMS的重要特性。', knowledgePointId: '6320775'},
                {id: 107, type: 'single', content: '三层模式结构中最接近外部存储器的是（ ）。', options: '["A. 模式", "B. 外模式", "C. 内模式", "D. 概念模式"]', answer: 'C', analysis: '三层模式结构中，内模式描述数据的物理存储结构，最接近外部存储器；外模式最接近用户，概念模式处于中间层。', knowledgePointId: '6320775'},
                {id: 108, type: 'single', content: '为特定用户定义一个或多个数据库视图的模式是（ ）。', options: '["A. 外模式", "B. 内模式", "C. 概念模式", "D. 以上都不对"]', answer: 'A', analysis: '外模式（子模式）是从概念模式推导出的针对特定用户或应用的数据库视图，一个外模式可对应多个用户视图。', knowledgePointId: '6320775'},
                {id: 109, type: 'judge', content: '当模式改变时，对各外模式／模式映射作相应的改变，应用程序无需修改，这是数据逻辑独立性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '当概念模式改变时只需修改外模式/模式映射，而应用程序基于外模式编写无需修改，这体现的正是数据逻辑独立性。', knowledgePointId: '6320775'},
                {id: 110, type: 'judge', content: '如果数据库的内模式变化，只要对模式／内模式映射作相应的修改，模式可以保持不变，这是数据物理独立性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '内模式改变时只需调整模式/内模式映射，概念模式保持不变，应用程序不受影响，这正是数据物理独立性的体现。', knowledgePointId: '6320775'},
                {id: 111, type: 'judge', content: '数据字典中存放元数据，比如数据模式、外模式等。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。数据字典是DBMS中的核心组件，专门用于存放元数据，包括数据库的模式、外模式、内模式以及它们的映射信息等。', knowledgePointId: '6320775'},
                {id: 113, type: 'judge', content: '日志登记对数据的修改。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。日志文件用于记录数据库中数据的修改操作（如增、删、改），以便系统出现故障时进行恢复，保证事务的原子性和持久性。', knowledgePointId: '6320775'},
                {id: 117, type: 'judge', content: '投影是指选取表中的某些列的列值；广义投影是指在选取属性列时，允许进行适当运算。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。投影（π）是从关系中选取指定的若干列；广义投影则允许在选列时对属性进行算术、字符串等运算，生成新的投影列。', knowledgePointId: '6320775'},
                {id: 118, type: 'judge', content: '如果SELECT后面是最简单的形式即单独一个×，这种情况输出FROM子句给出表中的所有列值。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。SELECT后单独跟×（星号）表示输出所有列，但题中错将×误写为乘号概念。在SQL中必须用*号才是通配所有列，其他符号无此含义。', knowledgePointId: '6320775'},
                {id: 119, type: 'judge', content: 'ORDER BY子句让查询结果中的行按一个或多个列或列表达式的值进行排序，升序时用ASC，降序时用DESC，默认为升序。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。ORDER BY子句用于排序，ASC表示升序，DESC表示降序，默认为升序，可按一个或多个列或表达式排序。', knowledgePointId: '6320775'},
                {id: 120, type: 'judge', content: '升序时排序列为空值的行最后显示，降序时排序列为空值的行最先显示。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。在SQL排序中，空值被视为最大，升序时空值行排最后，降序时空值行排最前，这与多数数据库实现一致。', knowledgePointId: '6320775'},
                {id: 121, type: 'judge', content: '除非在SELECT后跟DISTINCT明确指出要求去重，否则，默认情况下、或者SELECT后跟ALL时都保留重复。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。SQL默认不去重（等价于ALL），只有在SELECT后明确使用DISTINCT关键字时才会去除重复元组。', knowledgePointId: '6320775'},
                {id: 122, type: 'judge', content: '选择操作用WHERE子句实现，从表中选择满足给定条件的行。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。选择（Selection）是对行的操作，通过WHERE子句设定条件，从表中筛选出满足条件的元组，与投影针对列的操作相对应。', knowledgePointId: '6320775'},
                {id: 124, type: 'judge', content: 'SUM和AVG的输入必须是数值型的。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。SUM（求和）和AVG（求平均）只能作用于数值型数据，对字符、日期等类型进行这些运算在SQL中是错误的。', knowledgePointId: '6320775'},
                {id: 125, type: 'judge', content: '聚集函数可以进行复合运算。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。聚集函数（SUM、AVG、COUNT、MAX、MIN）不可进行嵌套复合运算，如SUM(AVG(x))是非法的，只能直接对一列或多列运算。', knowledgePointId: '6320775'},
                {id: 126, type: 'judge', content: 'GROUP BY子句利用指定列进行分组，所有给出列上取值相同的行被分在一个组。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。GROUP BY按指定列的值进行分组，所有在该列上取值相同的元组会被划分到同一组，以便对每组进行聚集运算。', knowledgePointId: '6320775'},
                {id: 127, type: 'judge', content: '可以使用GROUP BY子句将聚集函数作用在组上。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。GROUP BY先分组，再对每个组应用聚集函数（如SUM、COUNT），实现按组统计，这是SQL分组查询的核心机制。', knowledgePointId: '6320775'},
                {id: 128, type: 'judge', content: '使用HAVING子句可以对GROUP BY子句形成的分组进行筛选。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。HAVING子句作用于GROUP BY产生的分组，用于筛选满足条件的组，相当于分组上的WHERE子句。', knowledgePointId: '6320775'},
                {id: 129, type: 'judge', content: 'HAVING子句给出的条件只针对GROUP BY子句形成的分组起作用，也可以使用聚集函数。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。HAVING条件针对分组起作用，且条件表达式中可以使用聚集函数（如HAVING COUNT(*) > 5），这是它与WHERE的重要区别。', knowledgePointId: '6320775'},
                {id: 130, type: 'judge', content: '默认情况下SELECT的执行会自动去重。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。SELECT默认不进行去重，保留所有查询结果（包括重复行），需要DISTINCT关键字才会去除重复。', knowledgePointId: '6320775'},
                {id: 131, type: 'judge', content: 'SUM和AVG可作用在非数值数据类型的列上。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。SUM和AVG只能作用于数值型数据列，对非数值类型（如字符串、日期）的列使用会出错，结果无意义。', knowledgePointId: '6320775'},
                {id: 132, type: 'judge', content: '设K为S< A , D >的超键，若K完全决定A，则称K为S的候选键。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。若K是关系S<A,D>的超键，且K对属性集A存在完全函数依赖（而不是部分依赖），则K就是S的候选键，这是候选键的形式化定义。', knowledgePointId: '6320775'},
                {id: 133, type: 'judge', content: '如果关系模式S∈1NF，且每一个属性都不部分依赖于S的任何候选键，则S∈2NF。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。2NF要求每个非主属性完全函数依赖于候选键，而不仅仅是部分依赖不依赖；表述中"每一个属性"混淆了主属性与非主属性的概念。', knowledgePointId: '6320775'},
                {id: 136, type: 'judge', content: '关系模式S<A，D> ，它的任何一个主属性都既不部分也不传递依赖于任何候选键，则称S∈BCNF。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。BCNF要求每个决定因素都必须是候选键，即所有主属性和非主属性都不能部分或传递依赖于候选键，题中描述不完整。', knowledgePointId: '6320775'},
                {id: 138, type: 'judge', content: 'PG使用角色来统一管理用户。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。PostgreSQL采用角色（Role）统一管理用户和权限，角色既可作为用户也可作为用户组使用，这是PG访问控制的基础。', knowledgePointId: '6320775'},
                {id: 139, type: 'judge', content: 'PG提供GRANT 语句来给角色撤销数据库操作权限。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。GRANT语句用于授予权限，而REVOKE语句才用于撤销权限，两者在SQL中功能相反，不可混淆。', knowledgePointId: '6320775'},
                {id: 142, type: 'judge', content: '集合交运算必须在相容的关系间进行。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。集合交运算要求参与运算的两个关系是相容的（同结构、同属性集），否则无法进行交运算，这与并、差运算要求相同。', knowledgePointId: '6320775'},
                {id: 143, type: 'judge', content: '自然联接运算的计算过程是：首先计算笛卡尔积；然后在笛卡尔积的结果上，基于两个参数的关系模式中都出现的属性，即两个关系模式的所有同名属性进行属性值相等的选择运算；最后去除重复列。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。自然连接的过程确实是：先做笛卡尔积，再按所有同名属性进行等值选择，最后去除重复的属性列，得到无重复列的连接结果。', knowledgePointId: '6320775'},
                {id: 148, type: 'judge', content: '投影运算用来从给定关系产生一个只有其部分列的新关系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。投影运算（π）从给定关系中选取指定的若干列，生成一个只包含这些列的新关系，是关系代数的核心运算之一。', knowledgePointId: '6320775'},
                {id: 150, type: 'judge', content: '对于关系并运算，参与运算的关系必须是相容的。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。关系并运算要求两个关系相容（属性个数相同且对应属性域相同），否则结果无意义，这与集合并的性质一致。', knowledgePointId: '6320775'},
                {id: 151, type: 'judge', content: '对于关系的笛卡尔积运算，结果关系的模式是参与运算的两个关系的模式的串接。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。笛卡尔积R×S的结果关系模式是将R和S的 schema 直接拼接起来，每个元组由R的一个元组和S的一个元组组合而成。', knowledgePointId: '6320775'},
                {id: 153, type: 'judge', content: '关系运算的运算参数是关系，运算结果也是关系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。关系运算具有"封闭性"：以关系为输入，运算后输出仍然是关系，这是关系代数能够嵌套组合运算的重要特性。', knowledgePointId: '6320775'},
                {id: 158, type: 'judge', content: 'Google GFS中每个块的大小为64MB。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。Google GFS将文件切分为固定大小的块（chunk），每个块默认大小为64MB，大块设计可减少元数据开销。', knowledgePointId: '6320775'},
                {id: 159, type: 'judge', content: '为了应对可能随时发生的故障，文件的每个块都存有不同节点上的多个副本。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。GFS为了容错，将每个块在多个不同节点上保存多个副本（默认3份），即使部分节点故障也不会丢失数据。', knowledgePointId: '6320775'},
                {id: 162, type: 'judge', content: '图数据库使用图作为数据模型，有一个节点集合和表征了节点关系的边集合。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。图数据库以图结构为数据模型，由节点集合和边集合组成，节点表示实体，边表示实体间的关系。', knowledgePointId: '6320775'},
                {id: 165, type: 'judge', content: '把pgSQL嵌入到宿主语言中使用还必须要解决以下四个方面的问题：连接数据库、嵌入识别问题、宿主语言与pgSQL语言的数据交互问题、宿主语言的单记录与pgSQL的多元组的协调问题。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。把pgSQL嵌入宿主语言需解决四大问题：连接数据库、SQL语句的嵌入识别、两种语言间的数据交互、记录与元组的协调。', knowledgePointId: '6320775'},
                {id: 166, type: 'judge', content: '宿主语言连接数据库，通常需要给出数据库服务器地址、端口号、数据库名、用户名、口令等，必要时可能还需要安装和加载数据库驱动程序。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。宿主语言连接数据库需要提供服务器地址、端口号、数据库名、用户名、口令等连接参数，并加载相应的数据库驱动。', knowledgePointId: '6320775'},
                {id: 173, type: 'judge', content: '定义表的属性时不必指明数据类型。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。定义表时每个属性都必须显式指定数据类型（如INT、VARCHAR、DATE等），以确保数据完整性和存储正确性。', knowledgePointId: '6320775'},
                {id: 174, type: 'judge', content: 'PG中使用单引号做字符串常量的标识，对于包含单引号的字符串，直接使用双引号。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。PG中包含单引号的字符串不能直接用双引号代替，需使用两个连续的单引号（\'\'）进行转义，双引号在PG中用于标识符而非字符串。', knowledgePointId: '6320775'},
                {id: 176, type: 'judge', content: 'PG中使用单引号做字符串常量的标识，任何字符串中不能包含单引号。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。PG中字符串可以包含单引号，但需要用两个连续的单引号（\'\'）来表示嵌入的单引号，并非禁止包含。', knowledgePointId: '6320775'},
                {id: 177, type: 'judge', content: '通过Web界面访问在线服务时，动态页面一般都是使用数据库中的数据生成。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。通过Web动态页面访问在线服务时，后端应用程序通常从数据库读取数据，再由模板引擎生成HTML返回给用户。', knowledgePointId: '6320775'},
                {id: 178, type: 'judge', content: '通过浏览器访问在线服务，就是使用数据库系统的一个例子。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。通过浏览器访问在线服务时，后台系统会访问数据库获取数据，是典型的数据库系统应用场景。', knowledgePointId: '6320775'},
                {id: 179, type: 'judge', content: '通过Web界面访问在线服务，是由html页面直接从数据库中获取数据并展示给用户，不需要任何应用程序设计语言的帮助。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。动态Web页面的生成离不开应用程序设计语言（如Java、PHP、Python等）的支持，HTML本身无法直接从数据库取数。', knowledgePointId: '6320775'},
                {id: 183, type: 'judge', content: '非无损联接的分解意味着分解将导致信息丢失。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。非无损连接分解意味着分解后通过自然连接无法恢复原关系中的所有信息，会有信息丢失（出现伪元组或丢失元组）。', knowledgePointId: '6320775'},
                {id: 186, type: 'judge', content: '像这样能够并且用来区分一个实体集中不同的一个个实体的最小的属性集或者是属性组（一组属性），称为实体标识符，（简称标识符）也称为实体主键（简称主键）。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。该描述准确刻画了实体标识符（主键）的概念：能唯一标识实体集中每个实体的最小属性集称为实体主键。', knowledgePointId: '6320775'},
                {id: 187, type: 'judge', content: '联系不可能有属性', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。联系也可以有属性。例如学生选课联系可以具有"成绩"属性，记录学生与课程之间的关联信息。', knowledgePointId: '6320775'},
                {id: 188, type: 'judge', content: '联系关联的实体个数称为该联系的元数或度数。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。联系所关联的实体集个数称为该联系的元数或度数，一元联系度数为1，二元联系度数为2，三元联系度数为3。', knowledgePointId: '6320775'},
                {id: 189, type: 'judge', content: '同类实体集内部实体与实体之间的联系，称为一元联系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。同一个实体集内部实体之间的联系称为一元联系（或递归联系），例如员工与员工之间的"领导"关系。', knowledgePointId: '6320775'},
                {id: 190, type: 'judge', content: '两个不同实体集中实体之间的联系，称为二元联系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。两个不同实体集之间实体与实体的联系称为二元联系，如学生与课程之间的"选课"联系，是最常见的联系类型。', knowledgePointId: '6320775'},
                {id: 191, type: 'judge', content: '如果实体集E1中，每个实体可以与实体集E2中任意个（零个或多个）实体之间具有联系，并且E2中每个实体至多和E1中一个实体有联系，那么我们就把E1对E2的联系称为“一对多联系”。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。若E1中每个实体可对应E2中多个实体，而E2中每个实体至多对应E1中一个实体，则E1对E2为"一对多联系"。', knowledgePointId: '6320775'},
                {id: 192, type: 'judge', content: '一个人会喜欢另一个人，人与人之间的联系“喜欢”是一个一元联系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '联系只涉及一个实体集时为一元联系。\"喜欢\"发生在人与人之间，参与联系的实体集只有\"人\"一个，因此是一元联系。', knowledgePointId: '6320775'},
                {id: 193, type: 'judge', content: '一个辅导员只辅导一个班级，一个班级只由一个辅导员来管理，辅导员和班级之间的联系，是一个一对一的联系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '一个辅导员只辅导一个班级，一个班级也只由一个辅导员管理，两端实体数量均为1，构成一对一联系。', knowledgePointId: '6320775'},
                {id: 196, type: 'judge', content: '数据库只存储表的定义，不存储相应的数据。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '数据库不仅存储表（模式）的定义，还存储实际的数据记录，否则数据库就失去了保存数据的意义。', knowledgePointId: '6320775'},
                {id: 199, type: 'judge', content: '视频中的图书馆数据库设计，只有第四种方案是正确的，完美的，任何情况下都只能采取这种方案。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '不存在绝对完美的设计方案，不同的业务场景对数据库设计有不同要求，需根据实际情况选择合适方案。', knowledgePointId: '6320775'},
                {id: 200, type: 'judge', content: '同一个数据库，设计达到的范式越高，结果表个数越多。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '范式越高，消除的冗余和异常越多，需要将一个表拆分成多个表来满足更高范式要求，表数量随之增加。', knowledgePointId: '6320775'},
                {id: 203, type: 'judge', content: '数据冗余毫无益处。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '适度数据冗余可提高查询性能、简化数据交换，必要时还会采用反规范化设计，并非毫无益处。', knowledgePointId: '6320775'},
                {id: 205, type: 'judge', content: '一个SELECT-FROM-WHERE语句称为一个查询块，将一个查询块嵌套在另一个查询块的SELECT、FROM、WHERE、GROUP BY、HAVING、ORDER BY、LIMIT、OFFSET或WITH子句中的查询称为嵌套查询。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'SELECT-FROM-WHERE构成一个查询块，将其嵌入另一查询块的各子句中即形成嵌套查询，定义正确。', knowledgePointId: '6320775'},
                {id: 206, type: 'judge', content: '由于SELECT语句的结果就是一个表，所以查询块可以出现在另外一个查询中表名可以出现的任何地方,主要有FROM子句和WITH子句。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'SELECT的结果是表，因此可像表名一样用在FROM子句中或通过WITH定义CTE，符合嵌套查询规则。', knowledgePointId: '6320775'},
                {id: 207, type: 'judge', content: '查询块也可以出现在集合能够出现的任何合适的地方。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '查询块的结果是集合，可出现在UNION、INTERSECT、EXCEPT等集合运算能够出现的任何地方。', knowledgePointId: '6320775'},
                {id: 208, type: 'judge', content: '在写嵌套查询语句时，如果能确定查询块只返回单行单列的单个值，查询块可以出现在单个属性名、单个表达式、单个常量，即单值表达式能够出现的任何地方。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '当查询块只返回单行单列值时，可作为一个标量值使用，能出现在任何允许单值表达式的位置。', knowledgePointId: '6320775'},
                {id: 218, type: 'judge', content: '事务持久性指应用程序所定义的事务，其单独成功的执行，必定是使数据库从一个一致性状态变到另一个一致性状态。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '题目描述的是事务的一致性，而非持久性。持久性指事务提交后对数据库的修改是永久的。', knowledgePointId: '6320775'},
                {id: 219, type: 'judge', content: '事务原子性指一个事务一旦被提交，它对数据库中数据的改变就应该是持久性的，接下来的其它操作或故障不应该对其执行结果有任何影响。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '题目描述的是事务的持久性，而非原子性。原子性指事务中的操作要么全做要么全不做。', knowledgePointId: '6320775'},
                {id: 220, type: 'judge', content: 'PG用BEGIN和COMMIT（或ROLLBACK）将数据库访问操作指令序列包围以声明一个事务。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: 'PostgreSQL中确实使用BEGIN开启事务，COMMIT提交或ROLLBACK回滚来声明一个事务边界。', knowledgePointId: '6320775'},
                {id: 225, type: 'judge', content: '存储函数的主要优势之一是运行效率高。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '存储函数经编译优化存储在服务器端，避免重复解析执行，相比外部调用通常具有更高的运行效率。', knowledgePointId: '6320775'},
                {id: 227, type: 'judge', content: '基于内容推荐方法根据用户兴趣模型与每一个物项特征模型之间的相似性来进行推荐。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '基于内容的推荐通过计算用户兴趣模型与物项特征模型之间的相似度，将相似度高的物项推荐给用户。', knowledgePointId: '6320775'},
                {id: 228, type: 'judge', content: '基于用户的协同过滤推荐方法是根据用户相似性进行推荐。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '基于用户的协同过滤先找出与目标用户相似的用户群，再将其喜欢但目标用户未接触过的物项推荐出来。', knowledgePointId: '6320775'},
                {id: 229, type: 'judge', content: '基于物项的协同过滤推荐方法是根据物项相似性推荐。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '基于物项的协同过滤通过计算物项间的相似度，根据用户的历史喜好推荐与之相似的其他物项。', knowledgePointId: '6320775'},
                {id: 231, type: 'judge', content: 'eeexam表的主键由eeid，eid属性组成，此时主键由两个属性一起组成，可以同时在eeid、eid属性声明的后面分别写上PRIMARY KEY就可以了。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '复合主键不能分别在每个属性后单独声明PRIMARY KEY，应在所有属性定义后用PRIMARY KEY(eeid,eid)统一声明。', knowledgePointId: '6320775'},
                {id: 233, type: 'judge', content: '删除操作不会检验主键约束。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '主键约束约束的是被参照表中主键值的唯一性和非空性，删除操作删除的是引用表中的行，不影响主键约束的检验。', knowledgePointId: '6320775'},
                {id: 234, type: 'judge', content: '将一个表的一个或几个属性定义为外键后，被引用表删除或修改时，系统不会自动检查是否将会违背外键约束。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '定义了外键后，系统会自动维护参照完整性，被引用表删除或修改时会自动检查是否违反外键约束。', knowledgePointId: '6320775'},
                {id: 237, type: 'judge', content: '所有属性都不足以形成主键的实体称为弱实体。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '弱实体的所有属性都不能单独构成主键，必须依赖于强实体的主键结合部分键才能唯一标识。', knowledgePointId: '6320775'},
                {id: 238, type: 'judge', content: '其属性可形成主键的实体集称为弱实体集。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '自身属性可形成主键的实体集是强实体集，弱实体集是那些属性不足以形成主键的实体集。', knowledgePointId: '6320775'},
                {id: 240, type: 'judge', content: '根据实体间的区别在实体集内部进行分组的过程称为特殊化。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '特殊化是在实体集内部根据实体间的差异进行分组的过程，形成不同的低层实体集。', knowledgePointId: '6320775'},
                {id: 241, type: 'judge', content: '一般化从单一的实体集出发，通过创建不同的低层实体集来强调同一实体集中不同实体间的差异。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '题中描述的是特殊化（自顶向下），而非一般化。一般化是从多个低层实体集抽象出共同特征形成高层实体集。', knowledgePointId: '6320775'},
                {id: 242, type: 'judge', content: '低层实体集继承参与其高层实体集所参与的那些联系。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '低层实体集继承高层实体集的所有属性，同时也继承其参与的所有联系，符合ISA继承语义。', knowledgePointId: '6320775'},
                {id: 243, type: 'judge', content: '低层实体集所特有的联系也适用于其高层实体集。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '继承是单向的：低层实体集继承高层实体集的联系，而高层实体集并不继承低层特有的联系。', knowledgePointId: '6320775'},
                {id: 244, type: 'judge', content: '用表表示父子实体集时，只需为每个低层实体集创建表。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '用表表示父子实体集时，不仅要为低层实体集建表，高层实体集也需要建表（除非其不参与任何特有的联系）。', knowledgePointId: '6320775'},
                {id: 245, type: 'judge', content: '一般化是一种自底向上的方法。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '一般化是从多个具有共同特征的实体集中抽象出共性，形成一个更一般的高层实体集，方向是自底向上。', knowledgePointId: '6320775'},
                {id: 248, type: 'single', content: '下列__________是数据库中数据的特征。', options: '["A. 独立性", "B. 安全性", "C. 共享性", "D. 以上所有"]', answer: 'D', analysis: '数据库中的数据具有独立性、安全性和共享性等特征，选项A、B、C均是，因此D（以上所有）正确。', knowledgePointId: '6320775'},
                {id: 249, type: 'single', content: '下列__________是使用数据库系统的优点。', options: '["A. 增强安全性", "B. 效率的提高", "C. 因复杂而难度加大", "D. 无法持久保存数据"]', answer: 'B', analysis: '使用数据库系统的优点包括提高效率、增强安全性、减少冗余等，B项\"效率的提高\"是优点。A、C、D项不是优点。', knowledgePointId: '6320775'},
                {id: 250, type: 'judge', content: '关系数据库管理系统使用非常简单的关系模型，使得数据库设计和访问都像面对的是日常生活中广泛使用的最简单形式的表格。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '关系数据库采用结构简单的二维表模型，使数据库的设计和访问直观方便，符合日常表格使用习惯。', knowledgePointId: '6320775'},
                {id: 252, type: 'judge', content: '采用三层模式两级映射获得了良好数据独立性，使得物理模式的调整和模式的调整都独立于应用程序。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '三层模式（外模式、模式、内模式）两级映射实现了逻辑独立性和物理独立性，使应用程序不受模式调整影响。', knowledgePointId: '6320775'},
                {id: 261, type: 'judge', content: '尽管出现了大数据技术，关系数据库管理系统在在线事务处理市场的主导地位稳如泰山。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '大数据技术的出现对关系数据库的市场地位产生了冲击，并非稳如泰山，OLTP的主导地位也在被新技术挑战。', knowledgePointId: '6320775'},
                {id: 262, type: 'judge', content: '如果查询的数据涉及两个或多个表，可以使用联接操作，称为联接查询。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '查询涉及两个或多个表时，可通过联接操作将多个表组合起来进行查询，这就是联接查询。', knowledgePointId: '6320775'},
                {id: 263, type: 'judge', content: '联接查询，涉及联接条件和联接类型两个方面。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '联接查询需要确定联接条件（哪些行匹配）和联接类型（如何处理不匹配的行）两个方面。', knowledgePointId: '6320775'},
                {id: 264, type: 'judge', content: '联接条件决定了两个表中哪些行是匹配的，以及联接结果中出现哪些列。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '联接条件确实决定参与联接的行匹配关系，结果集中的列由SELECT子句决定，联接条件主要影响行的选择。', knowledgePointId: '6320775'},
                {id: 265, type: 'judge', content: '联接类型是按照对悬浮行的不同处理方式来分的，分为内联接和（左/右/全）外联接。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '联接类型按对悬浮行的处理方式划分，内联接丢弃悬浮行，外联接（左/右/全）保留悬浮行。', knowledgePointId: '6320775'},
                {id: 266, type: 'judge', content: '自然联接，即自然内联接，是在笛卡尔积的基础上选取所有同名列上取值相等的行，结果表中同名列只出现一次。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '自然联接在笛卡尔积基础上自动按所有同名列匹配，匹配后同名列在结果中只出现一次，避免重复。', knowledgePointId: '6320775'},
                {id: 267, type: 'judge', content: '属性联接，即属性内联接，是在笛卡尔积的基础上选取指定同名属性上取值相等的行，结果表中这些指定同名属性只出现一次。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '属性联接允许用户指定部分同名列进行匹配，匹配后这些指定同名列在结果中也只出现一次。', knowledgePointId: '6320775'},
                {id: 268, type: 'judge', content: '如果属性联接指定全部同名列来匹配则等价于自然联接。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '当属性联接指定全部同名列进行匹配时，效果等同于自然联接，结果集相同。', knowledgePointId: '6320775'},
                {id: 269, type: 'judge', content: '条件联接，即条件内联接，是在笛卡尔积运算的基础上选取满足给定条件的行。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '条件联接不要求同名列，用户可使用任意条件表达式在笛卡尔积结果中筛选满足条件的行。', knowledgePointId: '6320775'},
                {id: 270, type: 'judge', content: '内联接抛弃所有悬浮行。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '内联接只保留两表中能匹配上的行，所有未匹配的悬浮行都被抛弃。', knowledgePointId: '6320775'},
                {id: 272, type: 'judge', content: '如果要求分解既具有无损联接性，又具有保持依赖性，则一定能够达到3NF，但不一定能够达到BCNF。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '满足无损联接且保持函数依赖的分解一定能达到3NF，但BCNF比3NF更严格，可能无法同时满足两个性质。', knowledgePointId: '6320775'}
              ]
            },
            {
              id: '6320781',
              name: '关系模型',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 42, courseId: 4, knowledgePointId: '6320781', title: '第一节 关系结构和约束 2.1 V', filePath: '视频\\第二章 关系模型（上）\\第一节 关系结构和约束_2.1 V_blurred.mp4', duration: null},
                {id: 43, courseId: 4, knowledgePointId: '6320781', title: '第二节 基本关系代数运算 2.2V', filePath: '视频\\第二章 关系模型（上）\\第二节 基本关系代数运算_2.2V_blurred.mp4', duration: null},
                {id: 44, courseId: 4, knowledgePointId: '6320781', title: '第三节 附加关系代数运算 2.3V', filePath: '视频\\第二章 关系模型（下）\\第三节 附加关系代数运算_2.3V_blurred.mp4', duration: null},
                {id: 45, courseId: 4, knowledgePointId: '6320781', title: '第四节 扩展关系代数运算 2.4V', filePath: '视频\\第二章 关系模型（下）\\第四节 扩展关系代数运算_2.4V_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 135, courseId: 4, knowledgePointId: '6320781', title: '第二章ppt_第二章ppt精简版', filePath: '课件\\第二章ppt_第二章ppt精简版.pdf', fileType: 'pdf'},
                {id: 136, courseId: 4, knowledgePointId: '6320781', title: '第二章ppt_第二章ppt详细版', filePath: '课件\\第二章ppt_第二章ppt详细版.pdf', fileType: 'pdf'}
              ],
              questions: [
                {id: 141, type: 'judge', content: '定义附加运算没有增加关系代数的表达能力。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '附加运算如交、连接、自然连接等都可以用基本关系代数运算等价表达，并未增加关系代数的表达能力。', knowledgePointId: '6320781'},
                {id: 145, type: 'single', content: '关系代数运算有（ )。', options: '["A. 附加关系代数运算", "B. 扩展关系代数运算", "C. 基本关系代数运算", "D. 以上都对"]', answer: 'D', analysis: '关系代数运算包括基本关系代数运算、附加关系代数运算和扩展关系代数运算三类，A、B、C均正确。', knowledgePointId: '6320781'},
                {id: 146, type: 'single', content: '下列哪个运算不属于基本关系代数运算？', options: '["A. 投影", "B. 平方", "C. 交", "D. 选择"]', answer: 'C', analysis: '基本关系代数运算包括并、差、积、选择和投影，交运算可由差运算推导得到（属于扩展运算），并非基本运算；投影、选择、平方都不属于题目所指的基本运算范畴，故C正确。', knowledgePointId: '6320781'},
                {id: 149, type: 'judge', content: '关系代数每个运算都是去重的。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。关系代数的运算建立在集合（关系）之上，每个运算结果都是集合，集合本身具有无重复性，因此关系代数的每个运算结果都会自动去重。', knowledgePointId: '6320781'},
                {id: 246, type: 'judge', content: '聚集运算使得关系代数表达式可以在结果中保留悬浮元组。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。保留悬浮元组是外连接运算的特性，聚集运算（如SUM、AVG、COUNT等）是将多行数据聚合成单值，与外连接保留悬浮元组无关。', knowledgePointId: '6320781'}
              ]
            }
          ]
        },
        {
          id: '6320769',
          name: '数据库应用',
          description: '数据库技术在各行各业中都有广泛应用，特别是在银行、互联网公司、国企、高校和科研机构等领域。通过数据库技术，这些单位能够高效地进行数据存储、管理和分析，从而支持业务运作和决策制定。数据库在企业信息化中也起着基础性作用，广泛应用于汽车制造、家电生产、银行、通信和交通等领域。随着数据量的增加，数据库性能优化成为企业信息化中的重要挑战。',
          order: 0,
          knowledgePoints: [
            {
              id: '6320758',
              name: '数据库应用案例',
              description: '数据库技术在各行各业中都有广泛的应用，特别是在一些对国家非常重要的大型企事业单位中。通过对毕业生就业去向的统计可以看出，数据库技术在银行、互联网公司、国企、高校、科研机构等领域都有重要应用。这些单位利用数据库技术进行数据存储、管理和分析，从而支持其业务运作和决策制定。数据库技术在企业信息化中也有广泛应用，无论是汽车制造、家电生产，还是银行、通信、交通等领域，数据库都是信息化的基础。企业通过数据库技术实现了业务数据的高效管理和利用，支持了业务的顺利开展和优化。随着数据量的增加，数据库的性能优化显得尤为重要，这是企业信息化中的一个重要挑战。',
              level: 3,
              children: [
                {
                  id: '6320741',
                  name: '德育教育数据库',
                  description: '德育教育数据库是用于记录和管理德育教育相关信息的数据库系统。在本课程中，德育教育数据库用于记录好人好事，包括当事人信息、事件信息和贡献信息。通过建立德育教育数据库，可以弘扬社会主义核心价值观，培育社会主义道德品质。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320742',
                  name: '工匠精神与数据库',
                  description: '工匠精神在数据库管理和应用中具有重要意义。工匠精神强调执着专注、作风严谨、精益求精、敬业守信和推陈出新，这些品质在数据库管理中同样重要。在本课程中，通过对“大国工匠”事迹的学习和实际操作，学生不仅可以掌握数据库技术，还能培养严谨、细致、专注和负责的工作态度。具体操作包括创建和管理“大国工匠”年度人物表，插入和查询工匠数据，创建视图以展示特定条件下的工匠信息等。此外，通过抗疫英雄数据库的案例，学生可以感受到英雄楷模的精神，激发爱国情怀和社会责任感。这种精神有助于学生在数据库管理中追求卓越，确保数据的准确性和安全性，为实现中华民族伟大复兴贡献力量。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320743',
                  name: '应急预案数据库',
                  description: '应急预案数据库用于管理和存储应急预案相关信息，确保数据的完整性和一致性。其设计包括应急预案表（ep表）、参与单位表（org表）和记录表（record表）。应急预案表记录预案的基本信息，如预案编号、名称、灾害类型、区域、等级和发布时间；参与单位表记录参与单位的编号、名称和联系方式；记录表记录参与单位在预案编制中的职责和工作量。通过数据库管理系统（如PostgreSQL）和图形化管理工具（如pgAdmin），可以实现对应急预案数据的高效管理和查询，提升应急预案的质量和应急处置能力。数据库在政府应急管理中同样具有重要作用，能够整合基础信息、应急指挥管理、应急资源保障等多方面数据，支持政府在突发事件中的快速反应和科学决策。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320744',
                  name: '数据库在网考系统中的应用',
                  description: '大学的选课系统背后依赖于数据库的支持。每个学生所选的课程信息都被存储在数据库中，这使得学校能够有效地管理和调度课程资源。数据库记录了每个学生的选课情况，确保选课过程的顺利进行，并为后续的课程安排和成绩管理提供数据支持。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320747',
                  name: '党史数据库',
                  description: '在党史数据库中，设计了三个主要的表：事件表（event）、参与人物表（participant）和事件-参与者表（event_participant）。事件表记录了党史中的重要事件，包括事件编号、名称、日期和地点；参与人物表记录了参与这些事件的主要人物，包括人物编号、姓名、出生日期和描述；事件-参与者表则是一个关联表，用于记录每个事件与参与人物之间的关系。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                }
              ],
              videos: [],
              coursewares: [
                {id: 4, courseId: 4, knowledgePointId: '6320758', title: '1、认识Oracle_认识Oracle', filePath: '课件\\1、认识Oracle_认识Oracle.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320759',
              name: '数据库与用户交互',
              description: '数据库与Web交互是指通过编程语言将Web应用与数据库连接，实现数据的存储、查询、更新和删除等操作。在Java中，常用JDBC接口连接数据库，通过PreparedStatement执行SQL语句，并使用ResultSet处理结果集。在Python中，使用pymysql或psycopg2模块连接数据库，通过游标对象执行SQL语句并处理结果。数据库与Web交互不仅包括基本的CRUD操作，还涉及事务管理和安全性设计，以确保数据的一致性和系统的稳定性。',
              level: 3,
              children: [
                {
                  id: '6320717',
                  name: '应用体系结构',
                  description: '应用体系结构是指数据库系统中客户端与服务器端的交互方式，主要包括C/S（客户端/服务器）和B/S（浏览器/服务器）两种模式。C/S结构包括服务器和客户机两层，数据存储和处理任务由服务器负责，数据表示由客户机负责。开发时需要使用C语言访问数据库，并使用C++、Java、C#等高级语言进行数据处理和表示。C/S结构的软件需要针对不同操作系统开发不同版本，客户机需要安装专门的客户端，系统升级时每台客户机都需要重新安装客户端，维护和升级成本较高。B/S结构是浏览器服务器结构，客户机只需安装浏览器即可与服务器交互。B/S结构通常包括多层：客户端浏览器层、外部服务器层、应用服务器层、数据库服务器层和数据库层。客户端通过浏览器发送请求，外部服务器处理请求并返回HTML页面，应用服务器访问数据库并返回结果。B/S结构的优点是维护和升级简单，只需在服务器端进行，客户端无需特殊维护，减少了维护升级的费用和时间。B/S结构的优点在于客户端只需一个浏览器即可访问服务器上的应用程序，便于维护和升级。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320753',
                  name: '数据库交互',
                  description: '数据库交互是指通过编程语言与数据库进行数据操作和管理的过程。在Web开发中，常用的数据库交互方式包括使用JDBC（Java Database Connectivity）或Python的psycopg2库等。通过这些工具，开发者可以连接数据库，执行SQL语句，实现数据的插入、查询、更新和删除等操作。数据库交互的核心步骤包括建立数据库连接、执行SQL语句、处理结果集以及关闭连接。良好的数据库交互设计可以提高系统的性能和安全性。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                }
              ],
              videos: [
                {id: 67, courseId: 4, knowledgePointId: '6320759', title: '第一节 数据库应用体系结构', filePath: '视频\\第四章 PG应用（上）\\第一节 数据库应用体系结构_数据库应用体系结构_blurred.mp4', duration: null},
                {id: 69, courseId: 4, knowledgePointId: '6320759', title: '第三节 JDBC编程', filePath: '视频\\第四章 PG应用（下）\\第三节 JDBC编程_第三节 JDBC编程_blurred.mp4', duration: null},
                {id: 70, courseId: 4, knowledgePointId: '6320759', title: '第四节 PG中的函数', filePath: '视频\\第四章 PG应用（下）\\第四节 PG中的函数_第四节 PG中的函数_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 10, courseId: 4, knowledgePointId: '6320759', title: '7、游标_游标', filePath: '课件\\7、游标_游标.pdf', fileType: 'pdf'},
                {id: 19, courseId: 4, knowledgePointId: '6320759', title: 'GaussDB存储过程与函数_GaussDB存储过程与函数ppt', filePath: '课件\\GaussDB存储过程与函数_GaussDB存储过程与函数ppt.pdf', fileType: 'pdf'},
                {id: 20, courseId: 4, knowledgePointId: '6320759', title: 'GaussDB存储过程与函数_GaussDB存储过程与函数报告样板', filePath: '课件\\GaussDB存储过程与函数_GaussDB存储过程与函数报告样板.pdf', fileType: 'pdf'},
                {id: 21, courseId: 4, knowledgePointId: '6320759', title: 'GaussDB存储过程与函数_GaussDB存储过程与函数报告模板', filePath: '课件\\GaussDB存储过程与函数_GaussDB存储过程与函数报告模板.pdf', fileType: 'pdf'},
                {id: 58, courseId: 4, knowledgePointId: '6320759', title: '实验内容：概念与原理简述_ORM概念与原理简述', filePath: '课件\\实验内容：概念与原理简述_ORM概念与原理简述.pdf', fileType: 'pdf'},
                {id: 143, courseId: 4, knowledgePointId: '6320759', title: '第四章ppt_第四章ppt精炼版', filePath: '课件\\第四章ppt_第四章ppt精炼版.pdf', fileType: 'pdf'},
                {id: 144, courseId: 4, knowledgePointId: '6320759', title: '第四章ppt_第四章ppt（上）详尽版', filePath: '课件\\第四章ppt_第四章ppt（上）详尽版.pdf', fileType: 'pdf'},
                {id: 145, courseId: 4, knowledgePointId: '6320759', title: '第四章ppt_第四章ppt（下）详尽版', filePath: '课件\\第四章ppt_第四章ppt（下）详尽版.pdf', fileType: 'pdf'},
                {id: 148, courseId: 4, knowledgePointId: '6320759', title: '附加材料：ODBC举例_ODBC举例', filePath: '课件\\附加材料：ODBC举例_ODBC举例.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320770',
              name: 'SQL数据定义与操作',
              description: 'SQL编程与查询是数据库管理系统中的重要组成部分，涉及复杂的SQL查询和数据库编程技术。学生需要掌握多表连接、嵌套查询、窗口函数和聚合操作等高级查询技术。此外，学生还需学习如何使用编程语言（如Python、Java）与数据库进行高级交互，特别是通过ORM工具来简化数据库操作。课程还涵盖事务管理、并发控制和数据库安全等高级主题，帮助学生在实际应用中提高数据库操作的效率和安全性。',
              level: 3,
              children: [
                {
                  id: '6320760',
                  name: 'SQL基础与数据类型',
                  description: 'SQL（结构化查询语言）是关系数据库的标准语言，广泛应用于关系数据库管理系统（RDBMS），如 MySQL。SQL 语言涵盖了数据定义、数据查询、数据修改和数据保护等多个方面。SQL 语言是大小写不敏感的，建议SQL的保留字用大写，表名、字段名等所有数据库对象名使用小写。SQL的基本语句包括SELECT、FROM、WHERE、GROUP BY、HAVING、ORDER BY、LIMIT等。SQL语言中的基本数据类型包括：SMALLINT、INT、BIGINT、NUMERIC、REAL、DOUBLE PRECISION、VARCHAR、CHAR、DATE、TIME、BOOLEAN等。掌握这些基本语句和数据类型是进行复杂数据库操作的前提。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320761',
                  name: 'SQL函数与运算',
                  description: 'SQL函数与运算是数据库系统中用于处理和操作数据的重要工具。SQLExecDirect函数用于直接执行SQL语句，参数包括语句句柄和SQL查询字符串。SQLBindCol函数用于将结果集中的列绑定到程序变量，参数包括语句句柄、列号、C数据类型、目标变量、缓冲区长度和实际长度。这些函数在数据库操作中起着关键作用，能够提高数据处理的效率。通过学习这些函数，学生可以掌握如何高效地执行SQL查询和处理结果集。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320762',
                  name: '查询与操作',
                  description: '查询与操作是数据库管理系统中的核心功能。SQL查询操作通过SQL语句从数据库中检索数据，包含单表查询和多表查询，支持条件筛选、排序、分页、子查询、取别名和模式匹配等高级技术。数据操作包括插入、更新和删除数据，分别使用INSERT INTO、UPDATE和DELETE FROM语句。学生需熟悉数据表结构，掌握这些操作以实现对数据的有效管理。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                }
              ],
              videos: [
                {id: 33, courseId: 4, knowledgePointId: '6320770', title: '第一节 SQL概述', filePath: '视频\\第三章 PG数据定义与操作（上）\\第一节 SQL概述_SQL概述_blurred.mp4', duration: null},
                {id: 34, courseId: 4, knowledgePointId: '6320770', title: '第二节 数据定义与修改 数据定义与更新', filePath: '视频\\第三章 PG数据定义与操作（上）\\第二节 数据定义与修改_数据定义与更新_blurred.mp4', duration: null},
                {id: 35, courseId: 4, knowledgePointId: '6320770', title: '第五节 嵌套查询', filePath: '视频\\第三章 PG数据定义与操作（下）\\第五节 嵌套查询_嵌套查询_blurred.mp4', duration: null},
                {id: 36, courseId: 4, knowledgePointId: '6320770', title: '第五节 嵌套查询 父子不相关嵌套查询执行示例', filePath: '视频\\第三章 PG数据定义与操作（下）\\第五节 嵌套查询_父子不相关嵌套查询执行示例_blurred.mp4', duration: null},
                {id: 37, courseId: 4, knowledgePointId: '6320770', title: '第四节 联接查询', filePath: '视频\\第三章 PG数据定义与操作（下）\\第四节 联接查询_联接查询_blurred.mp4', duration: null},
                {id: 38, courseId: 4, knowledgePointId: '6320770', title: '第三节 简单查询', filePath: '视频\\第三章 PG数据定义与操作（中）\\第三节 简单查询_第三节 简单查询_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 1, courseId: 4, knowledgePointId: '6320770', title: '10、数据库结构调整_数据库结构调整', filePath: '课件\\10、数据库结构调整_数据库结构调整.pdf', fileType: 'pdf'},
                {id: 6, courseId: 4, knowledgePointId: '6320770', title: '3、表的创建与删除_表的创建于删除', filePath: '课件\\3、表的创建与删除_表的创建于删除.pdf', fileType: 'pdf'},
                {id: 132, courseId: 4, knowledgePointId: '6320770', title: '第三章ppt_第三章ppt上详细版', filePath: '课件\\第三章ppt_第三章ppt上详细版.pdf', fileType: 'pdf'},
                {id: 133, courseId: 4, knowledgePointId: '6320770', title: '第三章ppt_第三章ppt下详细版', filePath: '课件\\第三章ppt_第三章ppt下详细版.pdf', fileType: 'pdf'},
                {id: 134, courseId: 4, knowledgePointId: '6320770', title: '第三章ppt_第三章ppt精炼版', filePath: '课件\\第三章ppt_第三章ppt精炼版.pdf', fileType: 'pdf'}
              ],
              questions: [
                {id: 33, type: 'judge', content: 'SQL字面含义是“查询语言”，但其功能包括数据定义、查询、修改和保护等许多内容。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。SQL全称Structured Query Language（结构化查询语言），虽名含\"查询\"，但其功能远超查询，还包括数据定义（DDL）、数据操纵（DML）和数据控制（DCL）等。', knowledgePointId: '6320770'},
                {id: 36, type: 'judge', content: 'SQL语言是大小写不敏感的。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。SQL语言对大小写不敏感，关键字如SELECT、select、Select效果相同；但需注意字符串字面量中的字符大小写仍是有区别的。', knowledgePointId: '6320770'},
                {id: 66, type: 'judge', content: 'SQL语言和C/C++/Java/C#等高级语言混合编程时，可以将静态或动态SQL语句嵌入高级语言，也可以让高级语言通过ODBC、JDBC、ADO等调用SQL。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。SQL作为子语言嵌入高级语言有两种方式：一是嵌入式SQL（静态或动态），二是通过ODBC、JDBC、ADO等数据库访问接口调用，这是数据库应用体系结构的常见模式。', knowledgePointId: '6320770'},
                {id: 123, type: 'judge', content: 'PostgreSQL支持聚集查询，允许从多个输入行中计算出一个结果。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。PostgreSQL支持丰富的聚集函数（如COUNT、SUM、AVG、MAX、MIN等），通过GROUP BY子句可对多行输入进行聚合计算，得到汇总结果。', knowledgePointId: '6320770'},
                {id: 163, type: 'judge', content: 'PG提供的SQL语言可以作为子语言嵌入在宿主语言中使用，这里所说的宿主语言就是指SQL语言。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。pgSQL作为子语言嵌入到宿主语言中使用时，宿主语言是指C、C++、Java等高级语言，而不是SQL语言本身；SQL是被嵌入的子语言。', knowledgePointId: '6320770'},
                {id: 164, type: 'judge', content: '预处理程序ECPG对.c文件进行预处理，主要就是把其中的pgSQL语句转换成主语言能够识别的SQL函数调用的形式，结果是同名.pgc文件。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。ECPG预处理器处理的是.pgc文件（不是.c文件），将其中嵌入的SQL语句转换为主语言函数调用形式，输出是同名.c文件供后续编译。', knowledgePointId: '6320770'},
                {id: 167, type: 'judge', content: '为了区分宿主语言和pgSQL语句，为pgSQL语句加一个识别前缀标识“EXEC SQL” ，和结束标志：分号“;”。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。在嵌入式SQL中，为区分宿主语言语句和SQL语句，规定SQL语句以\"EXEC SQL\"开头，以分号\";\"结束，这是嵌入式SQL的语法约定。', knowledgePointId: '6320770'},
                {id: 168, type: 'judge', content: '解决宿主语言和pgSQL语言的数据交换问题的答案是，引入共享变量的概念。在pgSQL语句中使用共享变量时，变量名前需加一个引号。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。pgSQL语句中使用宿主语言的共享变量时，变量名前需加冒号\":\"作为前缀标识，而不是引号；冒号用于区分变量名与数据库字段名。', knowledgePointId: '6320770'},
                {id: 169, type: 'judge', content: '解决宿主语言一次只能处理一个记录，而pgSQL语言一次处理多个元组的矛盾，方法是使用共享变量。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。解决宿主语言单记录处理与pgSQL多记录集合处理矛盾的方法是使用游标（cursor），通过游标可以逐行处理pgSQL返回的多行结果集，而不是共享变量。', knowledgePointId: '6320770'},
                {id: 171, type: 'judge', content: 'SQLSTATE是一个特殊变量，用于连接pgSQL执行系统和宿主语言，它是一个五字符的数组，每次调用pgSQL的库函数，向SQLSTATE变量中存放一个代码，以反应调用中出现的问题，比如〞02000〞表示没有产生任何错误，〞00000〞表示没有找到结果元组。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。SQLSTATE状态码含义描述颠倒：\"00000\"表示无错误（成功执行），而\"02000\"表示没有找到结果元组，题中两个状态码的含义写反了。', knowledgePointId: '6320770'},
                {id: 172, type: 'judge', content: '如果实际应用中有时SQL语句只能在实际运行时才能完全确定，这时就需要动态pgSQL语句。动态pgSQL语句需要先准备再执行。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。当SQL语句中的某些部分（如条件、表名、列名）需在运行时才能确定时，需使用动态SQL；动态SQL的标准处理流程就是PREPARE（准备）后再EXECUTE（执行）。', knowledgePointId: '6320770'},
                {id: 216, type: 'judge', content: '行级after触发器在修改由触发SQL语句影响的每一行记录之后触发。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。行级AFTER触发器是在触发SQL语句对每一行完成INSERT、UPDATE或DELETE操作之后触发，每行受影响都会触发一次触发器函数。', knowledgePointId: '6320770'},
                {id: 224, type: 'judge', content: 'PG允许使用各种不同的程序设计语言来编写函数，特别是内建了PL/pgSQL。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。PostgreSQL支持多种过程语言编写函数，包括PL/pgSQL（内建）、PL/Tcl、PL/Perl、PL/Python等，其中PL/pgSQL是最常用且内建的。', knowledgePointId: '6320770'},
                {id: 251, type: 'judge', content: 'SQL语言非常接近自然语言，易学易用。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。SQL采用类自然语言的英语单词（如SELECT、FROM、WHERE等）作为语法关键字，接近英语表达方式，结构简洁，因此易学易用。', knowledgePointId: '6320770'},
                {id: 271, type: 'judge', content: 'pgSQL中内联接用INNER而外联接用OUTER，默认为INNER；LEFT、RIGHT、FULL均隐含外联接。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。在pgSQL中，JOIN默认即INNER JOIN，LEFT/RIGHT/FULL关键字本身已隐含外连接语义，配合OUTER可选写出，但实际使用中常省略OUTER。', knowledgePointId: '6320770'}
              ]
            },
            {
              id: '6320772',
              name: '数据保护',
              description: '数据库安全与权限是数据库管理系统中的重要组成部分，旨在保护数据的机密性、完整性和可用性。通过权限管理，管理员可以使用GRANT语句为用户分配特定操作权限，如SELECT、INSERT、UPDATE和DELETE等，确保用户只能执行被授权的操作。REVOKE语句用于收回已赋予的权限，防止未经授权的访问。权限验证机制通过检查用户权限，确保数据库操作的合法性。合理的权限管理与验证能够有效防止数据泄露和篡改，保障数据库系统的安全。',
              level: 3,
              children: [
                {
                  id: '6320718',
                  name: '数据安全性',
                  description: '数据安全性包括保密性、完整性和可用性三个方面。保密性指数据对某些用户是秘密的，只有具有合法权限的用户才能读取数据，涉及数据值和数据存在性的保密。完整性指数据是完好的、正确的，只有具有合法写权限的用户才能对数据进行正确的写操作。可用性指具有合法读写权限的用户在需要时能够顺利地访问和操作数据。数据安全性的需求源于数据的敏感性，保护数据免受未经授权的访问和修改，确保数据在需要时可用。',
                  level: 3,
                  children: [],
                  videos: [
                    {id: 48, courseId: 4, knowledgePointId: '6320718', title: '第二节 视图', filePath: '视频\\第五章 PG数据保护（上）\\第二节 视图_视图_blurred.mp4', duration: null},
                  ],
                  coursewares: [
                    {id: 12, courseId: 4, knowledgePointId: '6320718', title: '9、备份与恢复_备份与恢复', filePath: '课件\\9、备份与恢复_备份与恢复.pdf', fileType: 'pdf'},
                  ],
                  questions: [
                    {id: 194, type: 'judge', content: '视图可以对数据存在性方面的保密性提供保护。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。视图可以隐藏基表中部分行或列的存在，对用户呈现特定子集，从而对数据存在性方面的保密性提供保护，是数据库安全机制之一。', knowledgePointId: '6320718'},
                    {id: 195, type: 'judge', content: '可以使用视图定义视图。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。视图定义本身是一个查询，可以在另一个视图的定义中引用已定义的视图，形成视图的嵌套定义，体现了视图的灵活性和可组合性。', knowledgePointId: '6320718'},
                    {id: 197, type: 'judge', content: '系统只存储视图的定义，不存视图的数据。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。视图是虚拟表，系统只保存视图的定义（SQL查询语句），视图所对应的数据仍存储在基表中，查询视图时动态从基表检索，这是视图的核心特征。', knowledgePointId: '6320718'},
                    {id: 198, type: 'judge', content: '视图支持实现数据的逻辑独立性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。当基表结构改变时，可以通过修改视图定义使外模式保持不变，从而使应用程序不受影响，视图正是实现数据逻辑独立性的重要手段。', knowledgePointId: '6320718'},
                  ]
                },
                {
                  id: '6320719',
                  name: '数据库完整性',
                  description: '数据库完整性是指数据的可信度保护，防止非法或未经授权的数据修改，包括数据值的完整性和数据来源的完整性。数据库管理系统通过将数据库操作组织成事务，以事务为单位实施并发控制和故障恢复，维护并发访问情况下的数据完整性。数据可用性是指对数据的期望使用能力保护，通常指减少数据库系统停工时间，保持数据持续可访问。数据库管理系统中的故障恢复机制不仅维护故障情况下的数据完整性，并且由于故障恢复机制对故障的有效处理，它也是保护数据可用性的重要手段。完整性保护机制包括访问控制、加密、事务和触发器等。事务处理是数据库系统中确保数据一致性和完整性的重要机制，具有原子性、一致性、隔离性和持久性（ACID）四个特性。并发控制和故障恢复是事务处理中的关键问题，通过锁机制、两阶段封锁协议等方法可以实现并发控制，而通过日志和检查点等技术可以实现故障恢复。',
                  level: 3,
                  children: [],
                  videos: [
                    {id: 51, courseId: 4, knowledgePointId: '6320719', title: '第六节 事务', filePath: '视频\\第五章 PG数据保护（下）\\第六节 事务_事务_blurred.mp4', duration: null},
                    {id: 52, courseId: 4, knowledgePointId: '6320719', title: '第四节 完整性约束', filePath: '视频\\第五章 PG数据保护（下）\\第四节 完整性约束_完整性约束_blurred.mp4', duration: null}
                  ],
                  coursewares: [
                    {id: 11, courseId: 4, knowledgePointId: '6320719', title: '8、事务并发控制_事务并发控制', filePath: '课件\\8、事务并发控制_事务并发控制.pdf', fileType: 'pdf'},
                  ],
                  questions: [
                    {id: 217, type: 'judge', content: '事务具有原子性一致性、隔离性、持久性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。事务具有四大特性ACID，即原子性（Atomicity）、一致性（Consistency）、隔离性（Isolation）和持久性（Durability），这是事务的基本性质。', knowledgePointId: '6320719'},
                    {id: 221, type: 'judge', content: 'PG提供三种独立的事务隔离级别，分别是读已提交READ COMMITTED、REPEATABLE READ和可串行化SERIALIZABLE。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。PostgreSQL提供四种隔离级别：读未提交、读已提交、可重复读和可串行化，但PG仅实现后三种独立级别，读未提交退化为读已提交。', knowledgePointId: '6320719'},
                    {id: 222, type: 'judge', content: '可串行化事务中的语句看到的是该事务开始时的快照。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。可串行化（SERIALIZABLE）隔离级别下，事务中的语句看到的是该事务开始时的数据快照，整个事务期间数据视图保持稳定。', knowledgePointId: '6320719'},
                    {id: 223, type: 'judge', content: '可串行化级别提供最严格的事务隔离，因为事务是一个接着一个串行执行的。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。可串行化级别提供最严格的事务隔离，但并非通过串行执行实现，而是通过MVCC和SSI（可串行化快照隔离）机制实现并发执行而效果等价于串行。', knowledgePointId: '6320719'},
                  ]
                },
                {
                  id: '6320757',
                  name: '触发器与函数',
                  description: '触发器是数据库系统中由事件驱动的特殊函数，用于在特定事件（如插入、更新、删除）发生时自动执行预定义操作。触发器分为行级和语句级，前者针对每行数据变化触发，后者针对整个SQL语句触发。触发器还分为before和after触发器，分别在事件前后触发。触发器函数定义触发器行为，返回触发器类型。系统自动创建NEW和OLD变量，NEW表示新数据行，OLD表示旧数据行。行级BEFORE触发器返回的行将被插入或更新，行级AFTER触发器的返回值被忽略。',
                  level: 3,
                  children: [],
                  videos: [
                    {id: 50, courseId: 4, knowledgePointId: '6320757', title: '第五节 触发器', filePath: '视频\\第五章 PG数据保护（下）\\第五节 触发器_触发器_blurred.mp4', duration: null},
                  ],
                  coursewares: [
                  ],
                  questions: [
                    {id: 209, type: 'judge', content: '触发器比CHECK约束更灵活，可以实施各种复杂的检查和操作，具有更精细和更强大的数据保护能力。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。触发器功能远强于CHECK约束：CHECK只能检查列值是否满足简单条件，触发器可在BEFORE/AFTER执行复杂逻辑、跨表操作和动态修改，功能更强大灵活。', knowledgePointId: '6320757'},
                    {id: 210, type: 'judge', content: '触发器可以定义在触发事件之前或之后，即分为BEFORE和AFTER触发器，分别在操作完成前和操作完成后触发，执行触发器函数。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。触发器按触发时机分为BEFORE（在操作执行前触发，可修改数据）和AFTER（在操作执行后触发，常用于级联或日志），分别对应不同应用场景。', knowledgePointId: '6320757'},
                    {id: 211, type: 'judge', content: '行级触发器的触发器函数为每条触发语句执行一次。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。行级触发器的触发器函数是对每一条受影响的行执行一次，而语句级触发器才是对每一条触发语句执行一次，题中两者描述颠倒。', knowledgePointId: '6320757'},
                    {id: 212, type: 'judge', content: '触发器函数必须返回一个NULL或者一个元组类型的变量。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。触发器函数必须返回NULL或一个trigger相关的记录类型（行级触发器返回NEW或OLD，语句级返回NULL），返回类型不能是其他普通类型。', knowledgePointId: '6320757'},
                    {id: 213, type: 'judge', content: '行级after触发器的值总是被忽略，可以返回null；行级before触发器的返回值不同，对触发器操作的影响也不同，如果返回NULL则忽略该触发器的行级别操作，其后的触发器也不会被执行，如果非NULL则返回的行将成为被插入或者更新的行。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。AFTER行级触发器返回值被忽略；而BEFORE行级触发器返回NULL会跳过该行操作，返回非NULL则该行将替代原行被插入或更新。', knowledgePointId: '6320757'},
                    {id: 214, type: 'judge', content: '通常，用行级before触发器检查或修改将要插入或者更新的数据。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。BEFORE触发器在数据实际写入前触发，常用于检查和修改即将插入或更新的数据，可对数据做最后调整或校验后再持久化。', knowledgePointId: '6320757'},
                    {id: 215, type: 'judge', content: '语句级before触发器在触发语句开始之前触发。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。语句级BEFORE触发器在触发语句开始执行之前触发一次，无论该语句影响多少行，触发器函数只被调用一次。', knowledgePointId: '6320757'},
                  ]
                },
                {
                  id: '6320766',
                  name: '加密',
                  description: '数据加密与安全是通过使用加密算法和密钥将明文数据转换为密文数据，以保护数据的机密性。加密算法分为对称加密、非对称加密和单向加密三种。对称加密使用相同的密钥进行加密和解密，代表性算法有AES等；非对称加密使用一对公钥和私钥进行加密和解密，代表性算法有RSA等；单向加密用于数据完整性校验，代表性算法有MD5和SHA等。数据库系统如MySQL和PostgreSQL提供了多种加密函数，用户可以在数据库层面实现数据的加密存储和解密读取。',
                  level: 3,
                  children: [],
                  videos: [
                    {id: 49, courseId: 4, knowledgePointId: '6320766', title: '第七节 加密', filePath: '视频\\第五章 PG数据保护（下）\\第七节 加密_加密_blurred.mp4', duration: null},
                  ],
                  coursewares: [],
                  questions: [
                    {id: 79, type: 'judge', content: '数据被加密后的结果称为密文，把密文还原为明文的过程称为解密。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。数据经过加密算法处理后的不可读形式称为密文（ciphertext），从密文恢复出原始明文（plaintext）的过程称为解密（decryption）。', knowledgePointId: '6320766'},
                    {id: 80, type: 'judge', content: '加密体系中最核心的是用于加密解密的算法和密钥。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。加密体系的两大核心要素是加密/解密算法和密钥，算法规定变换规则，密钥提供具体参数，两者共同决定加密系统的安全性。', knowledgePointId: '6320766'},
                    {id: 81, type: 'judge', content: '现代加密体系中算法通常是公开的，密钥是保密的并且需要向可信权威机构申请，安全性完全取决于密钥的保密性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。现代密码学遵循Kerckhoffs原则：算法公开但密钥保密，安全性完全依赖于密钥的保密，公开算法有利于安全分析和标准化。', knowledgePointId: '6320766'},
                  ]
                },
                {
                  id: '6320767',
                  name: '权限管理与验证',
                  description: '权限管理与验证是数据库管理系统中的关键环节，涉及用户权限的赋予、收回和验证。通过GRANT语句，可以为用户分配特定的权限，如SELECT、INSERT、UPDATE、DELETE等，确保用户只能执行被授权的操作。REVOKE语句用于收回已赋予的权限，防止未经授权的访问和操作。权限验证通过检查用户是否具有特定操作的权限，确保数据库的安全性和完整性。合理的权限管理与验证可以有效防止数据泄露和篡改，保障数据库系统的安全。',
                  level: 3,
                  children: [],
                  videos: [
                    {id: 47, courseId: 4, knowledgePointId: '6320767', title: '第三节 访问控制', filePath: '视频\\第五章 PG数据保护（上）\\第三节 访问控制_访问控制_blurred.mp4', duration: null},
                  ],
                  coursewares: [
                  ],
                  questions: []
                }
              ],
              videos: [
                {id: 46, courseId: 4, knowledgePointId: '6320772', title: '第一节 数据保护', filePath: '视频\\第五章 PG数据保护（上）\\第一节 数据保护_数据保护_blurred.mp4', duration: null},
              ],
              coursewares: [
                {id: 137, courseId: 4, knowledgePointId: '6320772', title: '第五章ppt_第五章ppt精炼版', filePath: '课件\\第五章ppt_第五章ppt精炼版.pdf', fileType: 'pdf'},
                {id: 138, courseId: 4, knowledgePointId: '6320772', title: '第五章ppt_第五章ppt详细版（上）', filePath: '课件\\第五章ppt_第五章ppt详细版（上）.pdf', fileType: 'pdf'},
                {id: 139, courseId: 4, knowledgePointId: '6320772', title: '第五章ppt_第五章ppt详细版（下）', filePath: '课件\\第五章ppt_第五章ppt详细版（下）.pdf', fileType: 'pdf'}
              ],
              questions: [
                {id: 59, type: 'judge', content: '数据完整性包括数据值的完整性和数据来源的完整性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。数据完整性包括两个方面：一是数据值本身的正确性和有效性，二是数据来源的合法性与真实性，二者共同构成完整的数据保护。', knowledgePointId: '6320772'},
                {id: 61, type: 'judge', content: '定义了完整性约束，就可以保证数据始终真实正确。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。定义完整性约束只能一定程度上保证数据的合法性，无法完全保证数据始终真实正确，因为约束难以覆盖所有业务规则，且数据录入错误仍可能发生。', knowledgePointId: '6320772'},
                {id: 114, type: 'judge', content: '保护管理模块以一种称为“事务”的方式，维护多用户并发访问及故障情况下的数据一致性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。数据库保护管理模块通过事务机制来维护数据一致性，事务具有ACID特性，可保证并发访问和系统故障情况下数据的完整性与一致性。', knowledgePointId: '6320772'},
                {id: 253, type: 'judge', content: '视图仅允许用户见之所需。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。视图机制可向用户隐藏基表中不必要的数据，只暴露用户所需信息，是实现数据保密和最小特权访问的重要手段。', knowledgePointId: '6320772'},
                {id: 254, type: 'judge', content: '允许事务并发执行虽能带来性能上的好处，但需要对并发进行管控以保证数据完整性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。并发执行能提高系统吞吐量和资源利用率，但会带来数据不一致风险（如丢失修改、不可重复读等），因此必须通过并发控制机制保障数据完整性。', knowledgePointId: '6320772'},
                {id: 255, type: 'judge', content: '恢复机制保证并发情况下的数据完整性。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。恢复机制保障的是在系统故障（如介质故障、事务故障）情况下的数据完整性，而并发情况下的数据完整性由并发控制机制保证，两者职责不同。', knowledgePointId: '6320772'},
                {id: 256, type: 'judge', content: '并发控制机制能保障故障情况下的数据完整性。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。并发控制机制保障并发访问情况下的数据完整性，而故障情况下的数据完整性由恢复机制保障，题中将两者对应关系搞反了。', knowledgePointId: '6320772'}
              ]
            }
          ]
        },
        {
          id: '6320768',
          name: '数据库设计',
          description: '高级数据库技术涉及数据库系统的高级功能和优化技术，包括分布式数据库、并行数据库、数据仓库和数据挖掘等。分布式数据库通过网络将数据分布在多个物理位置，提高数据的可用性和容错性。并行数据库利用多处理器并行处理数据查询和操作，提升系统性能。数据仓库用于存储和分析大量历史数据，支持决策支持系统。数据挖掘通过算法从大量数据中提取有价值的信息和模式，辅助商业决策。掌握这些技术有助于提升数据库系统的效率和智能化水平。',
          order: 0,
          knowledgePoints: [
            {
              id: '6320844',
              name: '实体-联系数据库设计',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 57, courseId: 4, knowledgePointId: '6320844', title: '第一节 数据库设计方法和生命周期', filePath: '视频\\第六章 数据库设计：实体-联系方法（上）\\第一节 数据库设计方法和生命周期_数据库设计方法和生命周期_blurred.mp4', duration: null},
                {id: 58, courseId: 4, knowledgePointId: '6320844', title: '第三节 基本E-R图转换为关系模式', filePath: '视频\\第六章 数据库设计：实体-联系方法（上）\\第三节 基本E-R图转换为关系模式_基本E-R图转换为关系模式_blurred.mp4', duration: null},
                {id: 59, courseId: 4, knowledgePointId: '6320844', title: '第二节 第一小节 E-R模型元素', filePath: '视频\\第六章 数据库设计：实体-联系方法（上）\\第二节 第一小节 E-R模型元素_E-R模型元素_blurred.mp4', duration: null},
                {id: 60, courseId: 4, knowledgePointId: '6320844', title: '第二节 第二小节 基本E-R图设计', filePath: '视频\\第六章 数据库设计：实体-联系方法（上）\\第二节 第二小节 基本E-R图设计_基本E-R图设计_blurred.mp4', duration: null},
                {id: 61, courseId: 4, knowledgePointId: '6320844', title: '第五节 大数据E-R图及其转换', filePath: '视频\\第六章 数据库设计：实体-联系方法（下）\\第五节 大数据E-R图及其转换_大数据E-R图及其转换_blurred.mp4', duration: null},
                {id: 62, courseId: 4, knowledgePointId: '6320844', title: '第四节 扩展E-R图及其转换', filePath: '视频\\第六章 数据库设计：实体-联系方法（中）\\第四节 扩展E-R图及其转换_扩展E-R图及其转换_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 141, courseId: 4, knowledgePointId: '6320844', title: '第六章ppt_第六章ppt（上）详细版', filePath: '课件\\第六章ppt_第六章ppt（上）详细版.pdf', fileType: 'pdf'},
                {id: 142, courseId: 4, knowledgePointId: '6320844', title: '第六章ppt_第六章ppt（下）详细版', filePath: '课件\\第六章ppt_第六章ppt（下）详细版.pdf', fileType: 'pdf'}
              ],
              questions: [
                {id: 76, type: 'judge', content: '实体联系方法，以实体为中心，着重于一个关系模式，基本对应一个实体或联系，即关系模式与实体或联系之间基本是一一对应的。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。实体联系方法以实体为核心，每个实体或联系通常对应一个关系模式，关系模式与实体或联系之间基本保持一一对应关系。', knowledgePointId: '6320844'},
                {id: 185, type: 'judge', content: 'E-R图主要包括实体和联系以及它们各自的属性。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。E-R图（实体-联系图）的三大基本元素是实体、联系和属性，实体用矩形表示，联系用菱形表示，属性用椭圆表示，共同描述现实世界概念模型。', knowledgePointId: '6320844'},
                {id: 239, type: 'judge', content: '含弱实体E-R图向关系模式转换时，一个关联弱实体的联系和弱实体一起转换为一个关系模式，主键是参与联系的强实体的主键。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。含弱实体的E-R图转换时，弱实体与其标识联系合并为一个关系模式，主键应为强实体的主键加上弱实体的部分键，而非仅用强实体的主键。', knowledgePointId: '6320844'}
              ]
            },
            {
              id: '6320845',
              name: '属性-联系数据库设计',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 28, courseId: 4, knowledgePointId: '6320845', title: '第一节 函数依赖', filePath: '视频\\第七章 数据库设计：属性-联系方法（上）\\第一节 函数依赖_函数依赖_blurred.mp4', duration: null},
                {id: 29, courseId: 4, knowledgePointId: '6320845', title: '第二节 模式分解', filePath: '视频\\第七章 数据库设计：属性-联系方法（上）\\第二节 模式分解_模式分解_blurred.mp4', duration: null},
                {id: 30, courseId: 4, knowledgePointId: '6320845', title: '第三节 范式', filePath: '视频\\第七章 数据库设计：属性-联系方法（下）\\第三节 范式_范式_blurred.mp4', duration: null},
                {id: 31, courseId: 4, knowledgePointId: '6320845', title: '第五节 大数据与反规范化', filePath: '视频\\第七章 数据库设计：属性-联系方法（下）\\第五节 大数据与反规范化_大数据与反规范化_blurred.mp4', duration: null},
                {id: 32, courseId: 4, knowledgePointId: '6320845', title: '第四节 规范化', filePath: '视频\\第七章 数据库设计：属性-联系方法（下）\\第四节 规范化_规范化_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 128, courseId: 4, knowledgePointId: '6320845', title: '第七章ppt_第七章ppt精炼版', filePath: '课件\\第七章ppt_第七章ppt精炼版.pdf', fileType: 'pdf'},
                {id: 129, courseId: 4, knowledgePointId: '6320845', title: '第七章ppt_第七章ppt（上1）详细版', filePath: '课件\\第七章ppt_第七章ppt（上1）详细版.pdf', fileType: 'pdf'},
                {id: 130, courseId: 4, knowledgePointId: '6320845', title: '第七章ppt_第七章ppt（上2）详细版', filePath: '课件\\第七章ppt_第七章ppt（上2）详细版.pdf', fileType: 'pdf'},
                {id: 131, courseId: 4, knowledgePointId: '6320845', title: '第七章ppt_第七章ppt（下）详细版', filePath: '课件\\第七章ppt_第七章ppt（下）详细版.pdf', fileType: 'pdf'}
              ],
              questions: [
                {id: 48, type: 'judge', content: '一个关系模式中不同属性在取值上总会存在相互依赖又相互制约，这种属性与属性之间的联系，称为函数依赖。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。函数依赖是属性之间取值的一一对应关系，描述的是特定的值决定关系，并非所有属性之间都存在这种相互依赖与制约的联系。', knowledgePointId: '6320845'},
                {id: 49, type: 'judge', content: '给定关系模式S的函数依赖集D， D逻辑蕴涵的所有函数依赖的集合称为D的闭包。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。函数依赖集D的闭包D+正是D所能逻辑蕴涵的全部函数依赖的集合，这是闭包的标准定义。', knowledgePointId: '6320845'},
                {id: 53, type: 'judge', content: 'H与G等价则H中的每个函数依赖属于H的闭包。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。若H与G等价，则G⊆H+，即H中的每个函数依赖都属于H的闭包。', knowledgePointId: '6320845'},
                {id: 134, type: 'judge', content: '如果关系模式S<A，D>是1NF，且每个属性都既不部分也不传递依赖于S的任何候选键，那么称S是第三范式(3NF)的模式。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。每个属性都不部分也不传递依赖于任何候选键，是BCNF的定义，而非3NF。3NF允许非主属性对候选键的传递依赖。', knowledgePointId: '6320845'},
                {id: 135, type: 'judge', content: '如果关系模式S<A，D>是第三范式，它的任何一个主属性都既不部分也不传递依赖于S的任何候选键，则称S∈BCNF。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。这是BCNF的等价定义之一：3NF下任何主属性都不部分也不传递依赖于候选键，便属于BCNF。', knowledgePointId: '6320845'},
                {id: 137, type: 'judge', content: '关系模式S<A，D>∈1NF，其D中任意一个非平凡函数依赖的决定因素都包含键，则S∈BCNF。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。在1NF基础上，若D中每个非平凡函数依赖的决定因素都包含键，则该关系属于BCNF，这是BCNF的判定条件。', knowledgePointId: '6320845'},
                {id: 180, type: 'judge', content: '模式分解需要关注的特性是：是否无损联接、是否保持依赖。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。模式分解需同时关注无损联接性和依赖保持性这两个等价性特性，二者缺一不可。', knowledgePointId: '6320845'},
                {id: 181, type: 'judge', content: '把一个关系模式分解为两个关系模式时，分解具有无损联接性的充分必要条件是两个关系模式的公共属性是其中一个模式的键。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。把关系分解为两个子模式时，公共属性是其中一个模式的码，是分解具有无损联接性的充要条件。', knowledgePointId: '6320845'},
                {id: 182, type: 'judge', content: '如果某个分解不能保持函数依赖，则分解后的模式利用函数依赖约束来保护数据完整性的能力将会被削弱。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。若分解无法保持原有函数依赖，则需在应用层额外维护约束，削弱了依赖约束保护数据完整性的能力。', knowledgePointId: '6320845'},
                {id: 184, type: 'judge', content: '保持函数依赖的分解必定具有无损连接性。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。保持函数依赖的分解不一定具备无损联接性，二者彼此独立，没有必然蕴含关系。', knowledgePointId: '6320845'},
                {id: 201, type: 'judge', content: '若关系模式的规范化程度越高，优势在于数据冗余、插入异常、删除异常、修改复杂等问题越少。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。规范化程度越高，关系中的数据冗余和插入、删除、修改异常等问题越少，数据一致性更易维护。', knowledgePointId: '6320845'},
                {id: 202, type: 'judge', content: '较低范式的劣势在于数据冗余造成的空间代价以及修改代价（插入异常、删除异常、修改复杂）高。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。较低范式存在数据冗余，占用更多存储空间，并带来插入、删除和修改异常等问题。', knowledgePointId: '6320845'},
                {id: 204, type: 'judge', content: '关系模式满足的范式级别越高越好。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。范式并非越高越好，过高的范式会导致频繁多表连接，影响查询性能，实际常采用反规范化折中。', knowledgePointId: '6320845'},
                {id: 273, type: 'judge', content: '把较低范式的关系模式分解为若干较高范式的关系模式的方法不是唯一的，只有能够保证分解后的关系模式与原关系模式等价，分解才有意义。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。分解方法不唯一，但只有与原模式等价的分解（即保持依赖且无损联接）才有实际意义。', knowledgePointId: '6320845'},
                {id: 274, type: 'judge', content: '关系模式规范化实际上就是一个模式分解过程：把逻辑上相对独立的信息放在独立的关系模式中。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。规范化本质上就是模式分解，将逻辑独立的信息拆分到不同关系模式中以消除冗余和异常。', knowledgePointId: '6320845'}
              ]
            }
          ]
        },
        {
          id: '6320811',
          name: '核心实现技术',
          description: '',
          order: 0,
          knowledgePoints: [
            {
              id: '6320754',
              name: '查询优化',
              description: 'SQL查询优化是指通过调整SQL查询语句或数据库结构，以提高查询性能和效率的过程。常见的优化方法包括使用索引、避免全表扫描、优化连接操作、减少子查询、使用适当的SQL函数和运算符等。索引可以显著提高查询速度，但过多的索引会影响插入和更新操作的性能。优化连接操作可以通过选择合适的连接顺序和连接方式来实现。减少子查询和使用适当的SQL函数和运算符可以简化查询逻辑，减少计算量，从而提高查询效率。',
              level: 3,
              children: [],
              videos: [],
              coursewares: [],
              questions: []
            },
            {
              id: '6320842',
              name: '数据存储与存取',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 53, courseId: 4, knowledgePointId: '6320842', title: '第一节 磁盘上的元组', filePath: '视频\\第八章 数据存储与存取\\第一节 磁盘上的元组_磁盘上的元组_blurred.mp4', duration: null},
                {id: 54, courseId: 4, knowledgePointId: '6320842', title: '第三节 磁盘上元组B树索引', filePath: '视频\\第八章 数据存储与存取\\第三节 磁盘上元组B树索引_磁盘上元组B树索引_blurred.mp4', duration: null},
                {id: 55, courseId: 4, knowledgePointId: '6320842', title: '第二节 磁盘上元组索引基础', filePath: '视频\\第八章 数据存储与存取\\第二节 磁盘上元组索引基础_磁盘上元组索引基础_blurred.mp4', duration: null},
                {id: 56, courseId: 4, knowledgePointId: '6320842', title: '第四节 磁盘上元组B+树索引', filePath: '视频\\第八章 数据存储与存取\\第四节 磁盘上元组B+树索引_磁盘上元组B+树索引_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 5, courseId: 4, knowledgePointId: '6320842', title: '2、表空间管理_表空间管理', filePath: '课件\\2、表空间管理_表空间管理.pdf', fileType: 'pdf'}
              ],
              questions: [
                {id: 112, type: 'judge', content: '数据索引帮助快速定位特定数据项。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。数据索引通过建立额外的数据结构（如B+树）加快数据检索，能在大量数据中快速定位特定项。', knowledgePointId: '6320842'},
                {id: 144, type: 'judge', content: '属性联接是在笛卡尔积的基础上选取满足给定条件的元组。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。属性联接是在笛卡尔积基础上选取满足给定条件的属性列而非元组，元组的选取由θ联接完成。', knowledgePointId: '6320842'},
                {id: 147, type: 'judge', content: '选择运算是选出满足给定谓词(条件)的元组，结果关系和原关系有着相同的模式。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。选择运算按谓词筛选元组，是横向操作，不改变关系模式（属性列），故结果模式与原关系相同。', knowledgePointId: '6320842'},
                {id: 152, type: 'judge', content: '对于关系的笛卡尔积运算，运算符左侧关系中的每一个元组与右侧关系的每一个元组拼接，形成结果关系中的一个元组。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。笛卡尔积将左侧每个元组与右侧每个元组进行拼接，结果元组数为两关系元组数之积。', knowledgePointId: '6320842'},
                {id: 154, type: 'judge', content: '今有关系X和Y结构相同，且各有10个元组，那么这两个关系的交运算结果的元组个数是10。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。交运算结果是同时属于X和Y的元组，最多不超过10个，X、Y若没有公共元组则结果为空。', knowledgePointId: '6320842'},
                {id: 155, type: 'judge', content: '今有关系X和Y结构相同，且各有10个元组，那么这两个关系的自然联接运算结果的元组个数是10。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。自然联接按公共属性去重拼接，结果元组数取决于匹配情况，未必等于任一关系的元组数。', knowledgePointId: '6320842'},
                {id: 170, type: 'judge', content: '当无法确定SELECT语句查询结果至多是一个元组时，需要用游标机制把多个元组一次一个地传送给宿主语言程序进行处理。另外，在游标处于活动状态时，也可以更新或删除游标指向的元组。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。当SELECT结果可能为多行时，需用游标逐行传给宿主语言，且活动游标可执行更新或删除当前行。', knowledgePointId: '6320842'},
                {id: 175, type: 'judge', content: '在插入的常量元组中不能出现空值null。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。插入元组时完全可以出现空值null，除非该属性被显式定义为非空约束。', knowledgePointId: '6320842'},
                {id: 230, type: 'judge', content: '主键约束意味着各元组主键值不能重复，且不能为空。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。主键约束要求唯一且非空，这是实体完整性约束的核心内容。', knowledgePointId: '6320842'},
                {id: 232, type: 'judge', content: '将一个表的一个或几个属性定义为候选键后，插入元组或对主键列进行修改操作时，系统自动检查主键的各个属性是否为空，只要有一个为空就拒绝插入或修改；并且检查候选键值是否唯一，如果不唯一则拒绝插入或修改。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。主键才要求非空且唯一，候选键不强制非空，只要唯一即可，故题中描述混淆了主键与候选键。', knowledgePointId: '6320842'},
                {id: 235, type: 'judge', content: '非空约束意味着每个元组对应列值不能为空。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。非空约束（NOT NULL）确保插入或修改后该列不允许出现NULL值。', knowledgePointId: '6320842'},
                {id: 236, type: 'judge', content: '每当插入元组或者修改表中元组时, 就对基于元组的CHECK约束中的条件进行检验。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。CHECK约束在每次插入或更新元组时由系统自动检查表达式条件，不满足则拒绝操作。', knowledgePointId: '6320842'},
                {id: 247, type: 'judge', content: '分组聚集就是对关系中的元组按某一条件进行分组，并对每个分组使用聚集函数。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。分组聚集按指定属性分组，再对每组应用聚集函数，是GROUP BY的语义基础。', knowledgePointId: '6320842'}
              ]
            }
          ]
        },
        {
          id: '6320771',
          name: '大数据',
          description: '大数据与分布式系统是现代数据管理和处理的核心技术。大数据技术通过分布式存储系统和分布式计算框架，实现对海量、多样化和快速变化数据的高效处理。分布式系统通过多个计算节点协同工作，提高系统的可靠性、可扩展性和性能。它采用主从结构，主节点负责协调管理，从节点执行任务，并通过数据副本应对节点故障。大数据处理包括批处理和流计算，分别适用于离线和实时数据处理场景。',
          order: 0,
          knowledgePoints: [
            {
              id: '6320763',
              name: '大数据处理',
              description: '大数据处理是指对海量数据进行存储、处理和分析的技术和方法。它包括批处理和流计算两种主要模式。批处理通过将数据存储在磁盘上，进行一次性读取和处理，代表框架是MapReduce。流计算则处理实时数据流，数据即来即处理，代表框架是Storm。大数据处理技术广泛应用于需要处理大量数据和实时分析的场景，如社交媒体分析、金融交易监控等。',
              level: 3,
              children: [
                {
                  id: '6320728',
                  name: '流计算',
                  description: '流计算是一种处理源源不断的数据流的计算模式。它处理的数据是开放的、实时的，数据即来即处理，通常在内存中完成处理，不涉及磁盘访问。流计算的代表框架是Storm，它通过sport和bolt组件实现数据流的接收和处理。流计算适用于数据量大、实时性要求高的场景，如微博话题的实时分析。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320729',
                  name: 'MapReduce与批处理',
                  description: '批处理是一种计算模式，它将大批量数据事先存入磁盘，然后一次性读取并处理，处理过程中涉及频繁的IO操作。MapReduce是批处理的代表框架，它采用分而治之的思想，将大规模数据集分解成小数据集进行处理，最后汇总结果。MapReduce是一种处理海量数据的并行编程模型和计算框架，通过处理用户的map和reduce函数，MapReduce能够自动地并行执行在可伸缩的大规模集群上，从而可以对大规模数据进行处理和分析。MapReduce的工作原理是，首先对输入数据进行切片，每个切片分配一个Map任务。Map任务对数据进行计算并输出键值对。输出的数据在环形缓冲区内进行排序，当数据达到一定大小时输出到磁盘。最后，Reduce阶段对磁盘上的小文件进行归并排序，最终输出结果。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320730',
                  name: 'Storm集群架构',
                  description: 'Storm集群架构包括主节点和工作节点。主节点上运行守护进程name bus，负责代码分发、任务分配和故障监测。工作节点上运行守护进程supervisor，负责监听和执行分配的任务。Zookeeper作为分布式协调器，负责name bus和supervisor之间的协调工作，并保存Storm的状态信息，确保系统的稳定性和容错性。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320750',
                  name: 'Hadoop用户与安装',
                  description: '在CentOS系统中，首先需要创建一个名为hadoop的用户，并为其设置密码。通过编辑sudoers文件，赋予hadoop用户管理员权限，以便于后续的Hadoop部署和管理操作。具体步骤包括使用useradd命令创建用户，使用passwd命令设置密码，编辑sudoers文件以增加hadoop用户的管理员权限。接下来，在CentOS系统中安装Hadoop，并配置相关的环境变量。具体步骤包括将Hadoop安装包解压到指定目录，修改文件权限，编辑.bashrc文件以配置Hadoop的环境变量，并通过source命令使配置生效。最后，通过hadoop version命令验证Hadoop是否安装成功。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320751',
                  name: 'MapReduce程序运行',
                  description: '在Hadoop环境中编写并运行MapReduce程序的步骤包括：编写Java程序（如Merge.java），编译生成.class文件，并打包成.jar文件。在Hadoop中运行该.jar文件，并查看输出结果。具体操作步骤如下：首先，在主目录下创建一个名为merge.java的文件，并编译生成.class文件。然后将.class文件打包成.jar文件以便在Hadoop中运行。接着在主目录下新建input文件夹，并在该文件夹下创建两个txt文本文件，分别命名为file0和file1，输入不同的内容。通过运行代码将两个文件合并，并将合并后的文件输出到output文件夹中。MapReduce的主要功能是对两个文件进行合并，并剔除重复内容。安装MapReduce需要在CentOs系统中配置Hadoop和Java环境变量。安装完成后，通过命令行启动Hadoop，并进行NameNode的初始化。启动成功后，可以通过命令行运行MapReduce任务。通过这些步骤，可以验证MapReduce程序的正确性和性能。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320752',
                  name: 'Hadoop安装与配置',
                  description: '将Hadoop安装包放置在虚拟机的下载目录中，通过共享文件夹的方式将安装包传输到虚拟机中。解压安装包后，修改文件夹名称和权限。接着配置Hadoop的环境变量，指定Hadoop的安装路径并添加到环境变量中。配置完成后，通过输入命令使环境变量生效，并检查Hadoop是否安装成功。最后，进行NameNode的初始化并启动Hadoop。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                }
              ],
              videos: [
                {id: 64, courseId: 4, knowledgePointId: '6320763', title: '第三节 大数据计算', filePath: '视频\\第十章 大数据技术\\第三节 大数据计算_大数据计算_blurred.mp4', duration: null}
              ],
              coursewares: [],
              questions: []
            },
            {
              id: '6320764',
              name: '分布式系统',
              description: '分布式系统是一种通过多个计算节点协同工作来实现数据存储、处理和管理的系统架构。它通过将任务分配到多个节点上，提高了系统的可靠性、可扩展性和性能。分布式系统通常采用主从结构，主节点负责协调和管理，从节点执行具体任务。为了应对节点故障，分布式系统通常会在多个节点上存储数据的副本。水平扩展是分布式系统的一大特点，通过增加节点数量来提升系统能力，适应大数据和高并发需求。',
              level: 3,
              children: [
                {
                  id: '6320725',
                  name: '分布式文件系统',
                  description: '分布式文件系统是一种用于在计算机集群中存储大规模数据的技术。由于单节点存储能力有限，分布式文件系统通过将文件分布存储在多个节点上来实现数据的高效存储和访问。典型的分布式文件系统采用主从结构，主节点管理文件系统的元数据，从节点存储实际的数据块。为了应对可能的故障，每个数据块在不同节点上存有多个副本。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320726',
                  name: '水平扩展',
                  description: '水平扩展是一种通过增加更多普通商用计算机节点来扩展计算和存储能力的方法。与传统的垂直扩展（提高单个节点的性能和容量）不同，水平扩展可以大大降低硬件成本，并且更适合应对大数据的挑战。通过不断扩展集群规模，水平扩展能够灵活应对数据量的增长和计算需求的变化。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                }
              ],
              videos: [],
              coursewares: [],
              questions: []
            },
            {
              id: '6320765',
              name: '大数据基础',
              description: '大数据基础是指在大数据时代背景下，针对海量数据的存储、处理和分析所采用的技术和方法。其核心目标是实现高效、可靠和可扩展的数据管理和分析。大数据技术包括分布式存储系统、分布式计算框架以及NoSQL数据库等，能够处理多样化的数据类型和快速变化的数据。大数据的四个主要特征是数据量大、数据类型多样、数据产生速度快和数据价值高但密度稀疏，这些特征决定了大数据技术在存储、处理和分析上的复杂性和挑战。',
              level: 3,
              children: [
                {
                  id: '6320715',
                  name: '大数据数据库技术',
                  description: '大数据数据库技术是指在大数据时代背景下，针对海量数据的存储、处理和分析所采用的数据库技术。随着系统数据库规模的持续增大，传统数据库技术无法满足需求，大数据技术应运而生。其目标是实现高效、简单、安全的共享和应用大规模数据。关键需求包括可伸缩性、可靠性和高效性，确保系统能够处理大量数据和访问量，容忍合理的故障，并满足数据处理性能要求。在存储方面，采用计算机集群、分布式文件系统和NoSQL数据模型，实现海量数据的可扩展、容错和高可用存储。在处理和分析方面，使用MapReduce批处理和Storm流计算，通过分布式并行编程模型和计算框架实现对海量数据的处理和分析。大数据时代的数据库技术强调对时间跨度大、空间跨度大的数据进行聚集和分析，以发现潜在的巨大价值。数据库设计思想也发生了变化，从只保留当前业务数据转向数据的积累和长期保存，通过聚集大量历史数据进行深度分析和挖掘，支持业务决策。大数据时代的数据访问模式和需求多样化，数据库系统需要具备高效处理和响应多种数据访问请求的能力，以满足不同业务场景下的数据分析和处理需求。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320724',
                  name: '关系数据库与NoSQL',
                  description: '随着大数据技术的兴起，关系数据库管理系统（RDBMS）面临着NoSQL系统的巨大挑战。NoSQL系统专为大数据应用设计，利用计算机集群存储和处理大数据，强调可扩展性和高性能，但放弃了传统关系模型和完全ACID特性。NoSQL系统可以分为四类：键值存储系统、列族存储系统、文档存储系统和图存储系统。每种NoSQL系统都有其特定的应用场景和优势。关系数据库管理系统需要重新设计以适应新架构，并尽快适应硬件的快速发展。Spanner是一个兼顾可扩展性、高性能和关系模型的系统，代表了数据库管理系统发展的新方向。NoSQL数据模型是一种非关系型数据库模型，适用于处理大规模数据。键值存储系统通过键来访问对应的值，主要操作包括get、put和delete。列族存储系统用表来组织数据，每一行由行键标识，列簇包括若干个列。文档存储系统的数据模型是包含键/值集合的文档集合，值可以是嵌套文档、序列、数组等。图存储系统使用图作为数据模型，有节点集合和表征节点关系的边集合。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320727',
                  name: '大数据四V特征',
                  description: '大数据具有四个主要特征，即数据量大（Volume）、数据类型多样（Variety）、数据产生或变化速度快（Velocity）以及价值高但密度稀疏（Value）。\'数据量大\'指的是数据规模从TB级跃升到PB乃至EB级，这决定了大数据在存储和处理上的挑战；\'数据类型多样\'包括关系型数据、半结构化数据和非结构化数据，这增加了数据处理的复杂性；\'数据产生或变化速度快\'强调了数据的动态性和实时处理需求，这对数据处理技术提出了更高的要求；\'价值高但密度稀疏\'则说明了大数据中蕴含的商业价值需要通过大量数据的聚合和分析来实现，这对数据分析技术提出了更高的要求。',
                  level: 3,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                }
              ],
              videos: [
                {id: 63, courseId: 4, knowledgePointId: '6320765', title: '第一节 大数据及其特征', filePath: '视频\\第十章 大数据技术\\第一节 大数据及其特征_大数据及其特征_blurred.mp4', duration: null},
                {id: 65, courseId: 4, knowledgePointId: '6320765', title: '第二节 大数据存储技术', filePath: '视频\\第十章 大数据技术\\第二节 大数据存储技术_大数据存储技术_blurred.mp4', duration: null}
              ],
              coursewares: [],
              questions: [
                {id: 54, type: 'judge', content: '典型大数据应用中的数据在如下的一个或多个（4V）方面与传统技术面对的数据表现出显著不同：数据量（Volume）大、类型（Variety）多样、速度（Velocity）快、价值（Value）高而密度稀疏。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。大数据4V特征即数据量大、类型多样、速度快、价值高且密度稀疏，是其与传统数据的显著区别。', knowledgePointId: '6320765'},
                {id: 55, type: 'judge', content: '大数据技术的目标乃是简单、高效并安全地共享大数据，支持大数据应用。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。大数据技术的核心目标正是对数据进行简单、高效、安全的共享，以支撑各类大数据应用。', knowledgePointId: '6320765'},
                {id: 56, type: 'judge', content: '大数据技术的关键需求包括：①可伸缩性，能够有效处理越来越多的数据和越来越多的访问。②可靠性，能够容忍实际合理的故障。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。可伸缩性和容错可靠性是大数据处理系统的两大关键需求，保证系统能扩展并容忍故障。', knowledgePointId: '6320765'},
                {id: 94, type: 'judge', content: '大数据计算有多种计算模式，最常见的是批处理和流计算两种。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。批处理和流计算是大数据中最常见的两类计算模式，分别适用于离线与实时场景。', knowledgePointId: '6320765'},
                {id: 156, type: 'judge', content: '与早前水平扩展的思想不同，目前面对大数据挑战，总是采用垂直扩展的方式。', options: '["A. 正确", "B. 错误"]', answer: 'B', analysis: '错误。面对大数据挑战应采用水平扩展（增加节点），而非垂直扩展（升级单机性能），因单机扩展有限。', knowledgePointId: '6320765'},
                {id: 157, type: 'judge', content: '当前大数据应用中的分布式文件系统通常都采用主从结构。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。如HDFS等典型分布式文件系统普遍采用主节点（NameNode）加从节点（DataNode）的主从架构。', knowledgePointId: '6320765'},
                {id: 160, type: 'judge', content: '当前大数据应用中的分布式文件系统，当面对数据修改时，需要分布式并发控制、提交和恢复机制来维护多个副本间的一致性，归根结底需要一个异步系统中的分布式共识协议。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。数据修改需保证多副本一致性，依赖分布式并发控制及共识协议（如Paxos）来协调。', knowledgePointId: '6320765'},
                {id: 161, type: 'judge', content: '典型的NoSQL系统可以分为四类：键值存储系统、列族存储系统、文档存储系统和图存储系统。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。键值、列族、文档、图存储是NoSQL系统的四大典型类别，对应不同数据模型。', knowledgePointId: '6320765'},
                {id: 226, type: 'judge', content: '推荐系统通过研究用户的兴趣爱好，帮助用户从大数据中发觉自己潜在的需求，进行个性化推荐，缓解或解决信息过载问题。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。推荐系统通过分析用户兴趣，从海量数据中挖掘潜在需求并个性化推送，缓解信息过载。', knowledgePointId: '6320765'},
                {id: 257, type: 'judge', content: '这次大数据技术浪潮涉及基础架构的变化。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。大数据浪潮推动了底层基础架构的变革，从单机转向分布式集群等新型架构。', knowledgePointId: '6320765'},
                {id: 258, type: 'judge', content: '随着大数据现象的出现，数据管理技术正面临基础架构变化带来的深刻变革。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。大数据带来数据规模与类型变化，促使数据管理技术在基础架构层面发生深刻变革。', knowledgePointId: '6320765'},
                {id: 259, type: 'judge', content: 'NoSQL系统利用计算机集群这种新架构来存储和处理大数据。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。NoSQL系统正是利用分布式集群架构来应对大数据存储和处理需求。', knowledgePointId: '6320765'},
                {id: 260, type: 'judge', content: '当前的NoSQL系统强调可扩展性和高性能。', options: '["A. 正确", "B. 错误"]', answer: 'A', analysis: '正确。NoSQL系统为应对海量数据，普遍以可扩展性和高性能为设计核心目标。', knowledgePointId: '6320765'}
              ]
            },
            {
              id: '6320812',
              name: '大数据应用',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 66, courseId: 4, knowledgePointId: '6320812', title: '第四节 大数据应用', filePath: '视频\\第十章 大数据技术\\第四节 大数据应用_大数据应用_blurred.mp4', duration: null}
              ],
              coursewares: [],
              questions: []
            }
          ]
        },
        {
          id: '6320897',
          name: '实践技能(MySQL/PostgreSQL/......)',
          description: '',
          order: 0,
          knowledgePoints: [
            {
              id: '6320898',
              name: '入门',
              description: '',
              level: 3,
              children: [
                {
                  id: '6320916',
                  name: '系统安装',
                  description: '',
                  level: 3,
                  children: [],
                  videos: [
                    {id: 10, courseId: 4, knowledgePointId: '6320916', title: '视频 11', filePath: '视频\\实验（二 MySQL）：MySQL源码安装\\视频_11_blurred.mp4', duration: null},
                    {id: 11, courseId: 4, knowledgePointId: '6320916', title: '视频 22', filePath: '视频\\实验（二 MySQL）：MySQL源码安装\\视频_22_blurred.mp4', duration: null},
                    {id: 12, courseId: 4, knowledgePointId: '6320916', title: '视频：PostgreSQL 安装辅导视频（适用于PG10 11 12 9） PostgreSQL 安装直播精剪', filePath: '视频\\实验（二 PostgreSQL）： PostgreSQL  安装\\视频：PostgreSQL 安装辅导视频（适用于PG10_11_12_9）_PostgreSQL 安装直播精剪_blurred.mp4', duration: null},
                    {id: 13, courseId: 4, knowledgePointId: '6320916', title: '视频', filePath: '视频\\实验（二 PostgreSQL）：pgSQL源码安装\\视频_视频_blurred.mp4', duration: null}
                  ],
                  coursewares: [
                    {id: 28, courseId: 4, knowledgePointId: '6320916', title: 'GaussDB登录_GaussDB登录指南', filePath: '课件\\GaussDB登录_GaussDB登录指南.pdf', fileType: 'pdf'},
                    {id: 40, courseId: 4, knowledgePointId: '6320916', title: 'Oracle安装与配置（带解说）_Oralce安装与配置', filePath: '课件\\Oracle安装与配置（带解说）_Oralce安装与配置.pdf', fileType: 'pdf'},
                    {id: 41, courseId: 4, knowledgePointId: '6320916', title: 'PPT：PostgreSQL 10 安装指导_实验 PostgreSQL 10 安装导引', filePath: '课件\\PPT：PostgreSQL 10 安装指导_实验 PostgreSQL 10 安装导引.pdf', fileType: 'pdf'},
                    {id: 42, courseId: 4, knowledgePointId: '6320916', title: 'PPT：PostgreSQL 11 安装指导_实验 PostgreSQL 11 安装导引 ppt', filePath: '课件\\PPT：PostgreSQL 11 安装指导_实验 PostgreSQL 11 安装导引 ppt.pdf', fileType: 'pdf'},
                    {id: 43, courseId: 4, knowledgePointId: '6320916', title: 'PPT：PostgreSQL 9 安装指导_实验 PostgreSQL 9 安装导引', filePath: '课件\\PPT：PostgreSQL 9 安装指导_实验 PostgreSQL 9 安装导引.pdf', fileType: 'pdf'},
                    {id: 50, courseId: 4, knowledgePointId: '6320916', title: 'SQLServer安装操作基础（带解说）_SQLServer安装操作基础', filePath: '课件\\SQLServer安装操作基础（带解说）_SQLServer安装操作基础.pdf', fileType: 'pdf'},
                    {id: 51, courseId: 4, knowledgePointId: '6320916', title: 'python环境配置_python环境配置', filePath: '课件\\python环境配置_python环境配置.pdf', fileType: 'pdf'},
                    {id: 55, courseId: 4, knowledgePointId: '6320916', title: '安装配置及实验操作指导ppt_安装配置及实验操作指导', filePath: '课件\\安装配置及实验操作指导ppt_安装配置及实验操作指导.pdf', fileType: 'pdf'},
                    {id: 56, courseId: 4, knowledgePointId: '6320916', title: '安装配置及实验操作过程说明文档_安装配置及实验操作过程说明文档', filePath: '课件\\安装配置及实验操作过程说明文档_安装配置及实验操作过程说明文档.pdf', fileType: 'pdf'},
                    {id: 57, courseId: 4, knowledgePointId: '6320916', title: '安装配置及实验操作过程说明文档_实验操作过程', filePath: '课件\\安装配置及实验操作过程说明文档_实验操作过程.pdf', fileType: 'pdf'},
                    {id: 99, courseId: 4, knowledgePointId: '6320916', title: '实验环境搭建_实验环境搭建', filePath: '课件\\实验环境搭建_实验环境搭建.pdf', fileType: 'pdf'}
                  ],
                  questions: []
                }
              ],
              videos: [
                {id: 1, courseId: 4, knowledgePointId: '6320898', title: '实验辅导视频 实验指导直播', filePath: '视频\\实验（A）： Access实验辅导材料\\实验辅导视频_实验指导直播_blurred.mp4', duration: null},
                {id: 3, courseId: 4, knowledgePointId: '6320898', title: 'Oracle安装与配置（带解说） Oralce安装与配置', filePath: '视频\\实验（O）： Oracle实验辅导材料\\Oracle安装与配置（带解说）_Oralce安装与配置_blurred.mp4', duration: null},
                {id: 4, courseId: 4, knowledgePointId: '6320898', title: 'SQLServer安装操作基础（带解说） SQLServer安装操作（带解说）', filePath: '视频\\实验（S）： SQLServer实验辅导材料\\SQLServer安装操作基础（带解说）_SQLServer安装操作（带解说）_blurred.mp4', duration: null},
                {id: 5, courseId: 4, knowledgePointId: '6320898', title: 'SQLServer操作基础（无解说）', filePath: '视频\\实验（S）： SQLServer实验辅导材料\\SQLServer操作基础（无解说）_SQLServer操作基础（无解说）_blurred.mp4', duration: null},
                {id: 6, courseId: 4, knowledgePointId: '6320898', title: '视频：认识数据库实验辅导视频 直播录放1', filePath: '视频\\实验（一）：认识数据库_基于“国家奖励数据库”-感受正能量 传播正能量\\视频：认识数据库实验辅导视频_直播录放1_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 44, courseId: 4, knowledgePointId: '6320898', title: 'PPT：实验辅导_实验辅导PPT', filePath: '课件\\PPT：实验辅导_实验辅导PPT.pdf', fileType: 'pdf'},
                {id: 59, courseId: 4, knowledgePointId: '6320898', title: '实验报告参考样板_实验报告参考样板1', filePath: '课件\\实验报告参考样板_实验报告参考样板1.pdf', fileType: 'pdf'},
                {id: 60, courseId: 4, knowledgePointId: '6320898', title: '实验报告参考样板_实验报告参考样板2', filePath: '课件\\实验报告参考样板_实验报告参考样板2.pdf', fileType: 'pdf'},
                {id: 61, courseId: 4, knowledgePointId: '6320898', title: '实验报告参考样板_实验报告参考样板3', filePath: '课件\\实验报告参考样板_实验报告参考样板3.pdf', fileType: 'pdf'},
                {id: 63, courseId: 4, knowledgePointId: '6320898', title: '实验报告提纲_实验基本要求', filePath: '课件\\实验报告提纲_实验基本要求.pdf', fileType: 'pdf'},
                {id: 64, courseId: 4, knowledgePointId: '6320898', title: '实验报告提纲_实验报告提纲', filePath: '课件\\实验报告提纲_实验报告提纲.pdf', fileType: 'pdf'},
                {id: 66, courseId: 4, knowledgePointId: '6320898', title: '实验报告提纲_实验报告提纲pdf版', filePath: '课件\\实验报告提纲_实验报告提纲pdf版.pdf', fileType: 'pdf'},
                {id: 67, courseId: 4, knowledgePointId: '6320898', title: '实验报告提纲_实验报告提纲：数据库_表的基本操作', filePath: '课件\\实验报告提纲_实验报告提纲：数据库_表的基本操作.pdf', fileType: 'pdf'},
                {id: 68, courseId: 4, knowledgePointId: '6320898', title: '实验报告提纲：网上书店_实验报告提纲', filePath: '课件\\实验报告提纲：网上书店_实验报告提纲.pdf', fileType: 'pdf'},
                {id: 70, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板1_实验报告样板1', filePath: '课件\\实验报告样板1_实验报告样板1.pdf', fileType: 'pdf'},
                {id: 71, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板2_实验报告样板2', filePath: '课件\\实验报告样板2_实验报告样板2.pdf', fileType: 'pdf'},
                {id: 72, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板3_实验报告样板3', filePath: '课件\\实验报告样板3_实验报告样板3.pdf', fileType: 'pdf'},
                {id: 73, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板_实验报告样板', filePath: '课件\\实验报告样板_实验报告样板.pdf', fileType: 'pdf'},
                {id: 74, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板_实验报告样板1', filePath: '课件\\实验报告样板_实验报告样板1.pdf', fileType: 'pdf'},
                {id: 75, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板_实验报告样板2', filePath: '课件\\实验报告样板_实验报告样板2.pdf', fileType: 'pdf'},
                {id: 78, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板_数据库_表的基本操作样板1', filePath: '课件\\实验报告样板_数据库_表的基本操作样板1.pdf', fileType: 'pdf'},
                {id: 79, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板_数据库_表的基本操作样板2', filePath: '课件\\实验报告样板_数据库_表的基本操作样板2.pdf', fileType: 'pdf'},
                {id: 81, courseId: 4, knowledgePointId: '6320898', title: '实验报告样板：网上书店_实验报告样板', filePath: '课件\\实验报告样板：网上书店_实验报告样板.pdf', fileType: 'pdf'},
                {id: 82, courseId: 4, knowledgePointId: '6320898', title: '实验报告要求_实验报告要求', filePath: '课件\\实验报告要求_实验报告要求.pdf', fileType: 'pdf'},
                {id: 84, courseId: 4, knowledgePointId: '6320898', title: '实验报告评分标准_实验报告评分标准', filePath: '课件\\实验报告评分标准_实验报告评分标准.pdf', fileType: 'pdf'},
                {id: 86, courseId: 4, knowledgePointId: '6320898', title: '实验报告评分标准_实验报告评分标准：数据库_表的基本操作', filePath: '课件\\实验报告评分标准_实验报告评分标准：数据库_表的基本操作.pdf', fileType: 'pdf'},
                {id: 87, courseId: 4, knowledgePointId: '6320898', title: '实验报告评分标准：网上书店_实验报告评分标准', filePath: '课件\\实验报告评分标准：网上书店_实验报告评分标准.pdf', fileType: 'pdf'},
                {id: 88, courseId: 4, knowledgePointId: '6320898', title: '实验报告评分标准：高级数据查询_实验报告评分标准：高级数据查询', filePath: '课件\\实验报告评分标准：高级数据查询_实验报告评分标准：高级数据查询.pdf', fileType: 'pdf'},
                {id: 89, courseId: 4, knowledgePointId: '6320898', title: '实验指导ppt_实验指导ppt', filePath: '课件\\实验指导ppt_实验指导ppt.pdf', fileType: 'pdf'},
                {id: 90, courseId: 4, knowledgePointId: '6320898', title: '实验指导书_PD实验指导', filePath: '课件\\实验指导书_PD实验指导.pdf', fileType: 'pdf'},
                {id: 92, courseId: 4, knowledgePointId: '6320898', title: '实验指导书_实验指导', filePath: '课件\\实验指导书_实验指导.pdf', fileType: 'pdf'},
                {id: 93, courseId: 4, knowledgePointId: '6320898', title: '实验指导书_实验指导书', filePath: '课件\\实验指导书_实验指导书.pdf', fileType: 'pdf'},
                {id: 94, courseId: 4, knowledgePointId: '6320898', title: '实验指导书_实验指导：完整性约束 触发器', filePath: '课件\\实验指导书_实验指导：完整性约束 触发器.pdf', fileType: 'pdf'},
                {id: 96, courseId: 4, knowledgePointId: '6320898', title: '实验指导书_实验指导：数据库_表的基本操作', filePath: '课件\\实验指导书_实验指导：数据库_表的基本操作.pdf', fileType: 'pdf'},
                {id: 97, courseId: 4, knowledgePointId: '6320898', title: '实验指导书：网上书店_实验指导书', filePath: '课件\\实验指导书：网上书店_实验指导书.pdf', fileType: 'pdf'},
                {id: 98, courseId: 4, knowledgePointId: '6320898', title: '实验指导书：高级数据查询_实验指导：高级数据查询', filePath: '课件\\实验指导书：高级数据查询_实验指导：高级数据查询.pdf', fileType: 'pdf'},
                {id: 100, courseId: 4, knowledgePointId: '6320898', title: '实验评分标准_实验评分标准', filePath: '课件\\实验评分标准_实验评分标准.pdf', fileType: 'pdf'},
                {id: 101, courseId: 4, knowledgePointId: '6320898', title: '实验辅导PPT_ppt', filePath: '课件\\实验辅导PPT_ppt.pdf', fileType: 'pdf'},
                {id: 102, courseId: 4, knowledgePointId: '6320898', title: '实验辅导ppt_实验指导ppt', filePath: '课件\\实验辅导ppt_实验指导ppt.pdf', fileType: 'pdf'},
                {id: 103, courseId: 4, knowledgePointId: '6320898', title: '实验辅导ppt_实验辅导ppt', filePath: '课件\\实验辅导ppt_实验辅导ppt.pdf', fileType: 'pdf'},
                {id: 108, courseId: 4, knowledgePointId: '6320898', title: '实验辅导ppt：高级数据查询_ppt', filePath: '课件\\实验辅导ppt：高级数据查询_ppt.pdf', fileType: 'pdf'},
                {id: 111, courseId: 4, knowledgePointId: '6320898', title: '报告互评现场瞬间_报告互评现场瞬间', filePath: '课件\\报告互评现场瞬间_报告互评现场瞬间.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320899',
              name: '表的创建修改和删除',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 23, courseId: 4, knowledgePointId: '6320899', title: '视频：实验辅导 直播录制2', filePath: '视频\\实验（四 PostgreSQL）：SQL数据定义与修改_基于抗疫英雄数据库-致敬英雄楷模 立志报效祖国\\视频：实验辅导_直播录制2_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 25, courseId: 4, knowledgePointId: '6320899', title: 'GaussDB数据定义与修改_GaussDB数据定义与修改ppt', filePath: '课件\\GaussDB数据定义与修改_GaussDB数据定义与修改ppt.pdf', fileType: 'pdf'},
                {id: 26, courseId: 4, knowledgePointId: '6320899', title: 'GaussDB数据定义与修改_GaussDB数据定义与修改报告样板', filePath: '课件\\GaussDB数据定义与修改_GaussDB数据定义与修改报告样板.pdf', fileType: 'pdf'},
                {id: 27, courseId: 4, knowledgePointId: '6320899', title: 'GaussDB数据定义与修改_GaussDB数据定义与修改报告模板', filePath: '课件\\GaussDB数据定义与修改_GaussDB数据定义与修改报告模板.pdf', fileType: 'pdf'},
                {id: 45, courseId: 4, knowledgePointId: '6320899', title: 'PPT：实验辅导_实验辅导ppt：基于SQL的数据定义与修改', filePath: '课件\\PPT：实验辅导_实验辅导ppt：基于SQL的数据定义与修改.pdf', fileType: 'pdf'},
                {id: 46, courseId: 4, knowledgePointId: '6320899', title: 'PPT：实验辅导_数据库_表基本操作', filePath: '课件\\PPT：实验辅导_数据库_表基本操作.pdf', fileType: 'pdf'},
                {id: 65, courseId: 4, knowledgePointId: '6320899', title: '实验报告提纲_实验报告提纲_基于SQL的数据定义与修改', filePath: '课件\\实验报告提纲_实验报告提纲_基于SQL的数据定义与修改.pdf', fileType: 'pdf'},
                {id: 85, courseId: 4, knowledgePointId: '6320899', title: '实验报告评分标准_实验报告评分标准_基于SQL的数据定义与修改', filePath: '课件\\实验报告评分标准_实验报告评分标准_基于SQL的数据定义与修改.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320900',
              name: '单表查询',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 14, courseId: 4, knowledgePointId: '6320900', title: '视频：实验辅导 录放简单数据查询--基于“感动中国年度人物” 数据库', filePath: '视频\\实验（五 PostgreSQL）：简单数据查询_基于“感动中国年度人物” 数据库-弘扬中华传统美德 共建和谐美好社会\\视频：实验辅导_录放简单数据查询--基于“感动中国年度人物” 数据库_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 16, courseId: 4, knowledgePointId: '6320900', title: 'GaussDB单表查询_GaussDB单表查询ppt', filePath: '课件\\GaussDB单表查询_GaussDB单表查询ppt.pdf', fileType: 'pdf'},
                {id: 17, courseId: 4, knowledgePointId: '6320900', title: 'GaussDB单表查询_GaussDB单表查询报告样板', filePath: '课件\\GaussDB单表查询_GaussDB单表查询报告样板.pdf', fileType: 'pdf'},
                {id: 18, courseId: 4, knowledgePointId: '6320900', title: 'GaussDB单表查询_GaussDB单表查询报告模板', filePath: '课件\\GaussDB单表查询_GaussDB单表查询报告模板.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320901',
              name: '连接查询',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 16, courseId: 4, knowledgePointId: '6320901', title: '视频：高级数据查询实验辅导视频 直播', filePath: '视频\\实验（六 PostgreSQL）：高级数据查询_基于应急预案数据库-增强对突发事件的认知 提升对自我保护的能力\\视频：高级数据查询实验辅导视频_直播_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 35, courseId: 4, knowledgePointId: '6320901', title: 'GaussDB高级查询_GaussDB高级查询ppt', filePath: '课件\\GaussDB高级查询_GaussDB高级查询ppt.pdf', fileType: 'pdf'},
                {id: 36, courseId: 4, knowledgePointId: '6320901', title: 'GaussDB高级查询_GaussDB高级查询报告样板', filePath: '课件\\GaussDB高级查询_GaussDB高级查询报告样板.pdf', fileType: 'pdf'},
                {id: 37, courseId: 4, knowledgePointId: '6320901', title: 'GaussDB高级查询_GaussDB高级查询报告模版', filePath: '课件\\GaussDB高级查询_GaussDB高级查询报告模版.pdf', fileType: 'pdf'},
                {id: 69, courseId: 4, knowledgePointId: '6320901', title: '实验报告提纲：高级数据查询_实验报告提纲：高级数据查询', filePath: '课件\\实验报告提纲：高级数据查询_实验报告提纲：高级数据查询.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320904',
              name: 'Java与SQL混合编程',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 15, courseId: 4, knowledgePointId: '6320904', title: '视频：JDBC与PL pgSQL实验辅导视频 直播', filePath: '视频\\实验（八 PostgreSQL）：JDBC与PL_pgSQL_基于应急预案数据库--增强对突发事件的认知 建立科学的防范与应对机制\\视频：JDBC与PL_pgSQL实验辅导视频_直播_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 38, courseId: 4, knowledgePointId: '6320904', title: 'JDBC实验环境配置ppt_JDBC实验环境配置ppt', filePath: '课件\\JDBC实验环境配置ppt_JDBC实验环境配置ppt.pdf', fileType: 'pdf'},
                {id: 80, courseId: 4, knowledgePointId: '6320904', title: '实验报告样板：JDBC与PL_pgSQL_实验报告样板：JDBC与PL_pgSQL', filePath: '课件\\实验报告样板：JDBC与PL_pgSQL_实验报告样板：JDBC与PL_pgSQL.pdf', fileType: 'pdf'},
                {id: 106, courseId: 4, knowledgePointId: '6320904', title: '实验辅导ppt：JDBC与PL_pgSQL_PLpgSQL过程语言', filePath: '课件\\实验辅导ppt：JDBC与PL_pgSQL_PLpgSQL过程语言.pdf', fileType: 'pdf'},
                {id: 107, courseId: 4, knowledgePointId: '6320904', title: '实验辅导ppt：JDBC与PL_pgSQL_实验辅导ppt JDBC与PL_pgSQL', filePath: '课件\\实验辅导ppt：JDBC与PL_pgSQL_实验辅导ppt JDBC与PL_pgSQL.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320905',
              name: 'Python与SQL混合编程',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 68, courseId: 4, knowledgePointId: '6320905', title: '第二节 嵌入式pgSQL', filePath: '视频\\第四章 PG应用（上）\\第二节 嵌入式pgSQL_嵌入式pgSQL_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 47, courseId: 4, knowledgePointId: '6320905', title: 'Python连接Gauss DB_Python连接GaussDB ppt', filePath: '课件\\Python连接Gauss DB_Python连接GaussDB ppt.pdf', fileType: 'pdf'},
                {id: 48, courseId: 4, knowledgePointId: '6320905', title: 'Python连接Gauss DB_Python连接GaussDB报告样板', filePath: '课件\\Python连接Gauss DB_Python连接GaussDB报告样板.pdf', fileType: 'pdf'},
                {id: 49, courseId: 4, knowledgePointId: '6320905', title: 'Python连接Gauss DB_Python连接GaussDB报告模板', filePath: '课件\\Python连接Gauss DB_Python连接GaussDB报告模板.pdf', fileType: 'pdf'},
                {id: 95, courseId: 4, knowledgePointId: '6320905', title: '实验指导书_实验指导：嵌入式pgSQL', filePath: '课件\\实验指导书_实验指导：嵌入式pgSQL.pdf', fileType: 'pdf'},
                {id: 109, courseId: 4, knowledgePointId: '6320905', title: '嵌入式pgSQL_ECPG 示例_嵌入式pgSQL_ECPG 示例', filePath: '课件\\嵌入式pgSQL_ECPG 示例_嵌入式pgSQL_ECPG 示例.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320907',
              name: '完整性约束',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 18, courseId: 4, knowledgePointId: '6320907', title: '视频：完整性约束与触发器实验辅导视频 完整性约束与触发器', filePath: '视频\\实验（十一 PostgreSQL）：完整性约束与触发器_基于应急预案数据库-增强风险防范意识，提升应急预案质量\\视频：完整性约束与触发器实验辅导视频_完整性约束与触发器_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 22, courseId: 4, knowledgePointId: '6320907', title: 'GaussDB完整性约束和触发器_GaussDB完整性约束和触发器ppt', filePath: '课件\\GaussDB完整性约束和触发器_GaussDB完整性约束和触发器ppt.pdf', fileType: 'pdf'},
                {id: 23, courseId: 4, knowledgePointId: '6320907', title: 'GaussDB完整性约束和触发器_GaussDB完整性约束和触发器报告样板', filePath: '课件\\GaussDB完整性约束和触发器_GaussDB完整性约束和触发器报告样板.pdf', fileType: 'pdf'},
                {id: 24, courseId: 4, knowledgePointId: '6320907', title: 'GaussDB完整性约束和触发器_GaussDB完整性约束和触发器报告模板', filePath: '课件\\GaussDB完整性约束和触发器_GaussDB完整性约束和触发器报告模板.pdf', fileType: 'pdf'},
                {id: 76, courseId: 4, knowledgePointId: '6320907', title: '实验报告样板_实验报告样板：完整性约束与触发器', filePath: '课件\\实验报告样板_实验报告样板：完整性约束与触发器.pdf', fileType: 'pdf'},
                {id: 104, courseId: 4, knowledgePointId: '6320907', title: '实验辅导ppt_实验辅导ppt：完整性约束与触发器', filePath: '课件\\实验辅导ppt_实验辅导ppt：完整性约束与触发器.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320908',
              name: '访问控制',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 17, courseId: 4, knowledgePointId: '6320908', title: '视频：视图与访问控制实验辅导视频 视图与访问控制', filePath: '视频\\实验（十 PostgreSQL）：视图与访问控制_基于大国工匠数据库--致敬“大国工匠”，涵养“工匠精神”，服务中华民族伟大复兴\\视频：视图与访问控制实验辅导视频_视图与访问控制_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 32, courseId: 4, knowledgePointId: '6320908', title: 'GaussDB视图与访问控制_GaussDB视图与访问控制ppt', filePath: '课件\\GaussDB视图与访问控制_GaussDB视图与访问控制ppt.pdf', fileType: 'pdf'},
                {id: 33, courseId: 4, knowledgePointId: '6320908', title: 'GaussDB视图与访问控制_GaussDB视图与访问控制报告样板', filePath: '课件\\GaussDB视图与访问控制_GaussDB视图与访问控制报告样板.pdf', fileType: 'pdf'},
                {id: 34, courseId: 4, knowledgePointId: '6320908', title: 'GaussDB视图与访问控制_GaussDB视图与访问控制报告模板', filePath: '课件\\GaussDB视图与访问控制_GaussDB视图与访问控制报告模板.pdf', fileType: 'pdf'},
                {id: 77, courseId: 4, knowledgePointId: '6320908', title: '实验报告样板_实验报告样板：视图与访问控制', filePath: '课件\\实验报告样板_实验报告样板：视图与访问控制.pdf', fileType: 'pdf'},
                {id: 105, courseId: 4, knowledgePointId: '6320908', title: '实验辅导ppt_实验辅导ppt：视图与访问控制', filePath: '课件\\实验辅导ppt_实验辅导ppt：视图与访问控制.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320910',
              name: '事务',
              description: '',
              level: 3,
              children: [
                {
                  id: '6320910_acid_01',
                  name: '原子性',
                  description: '事务的原子性确保事务中的所有操作要么全部成功执行，要么全部不执行，不会出现部分执行的状态。',
                  level: 4,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320910_acid_02',
                  name: '一致性',
                  description: '事务的一致性确保事务执行前后数据库都处于一致状态，所有数据必须满足预定义的完整性约束。',
                  level: 4,
                  children: [
                    {
                      id: '6320910_acid_02_01',
                      name: '数据完整性约束',
                      description: '通过主键、外键、CHECK约束等机制保证数据在事务前后满足业务规则。',
                      level: 5,
                      children: [],
                      videos: [],
                      coursewares: [],
                      questions: []
                    },
                    {
                      id: '6320910_acid_02_02',
                      name: '一致性级别',
                      description: '不同隔离级别下的一致性保证程度不同，包括强一致性、最终一致性等。',
                      level: 5,
                      children: [],
                      videos: [],
                      coursewares: [],
                      questions: []
                    },
                    {
                      id: '6320910_acid_02_03',
                      name: 'CAP定理',
                      description: '分布式系统中一致性、可用性、分区容错性三者不可兼得，最多同时满足两个。',
                      level: 5,
                      children: [],
                      videos: [],
                      coursewares: [],
                      questions: []
                    }
                  ],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320910_acid_03',
                  name: '隔离性',
                  description: '事务的隔离性确保并发执行的事务之间互不干扰，每个事务都感觉不到其他事务的存在。',
                  level: 4,
                  children: [
                    {
                      id: '6320910_acid_03_01',
                      name: '读未提交',
                      description: '最低隔离级别，一个事务可以读取另一个未提交事务的修改，可能导致脏读。',
                      level: 5,
                      children: [],
                      videos: [],
                      coursewares: [],
                      questions: []
                    },
                    {
                      id: '6320910_acid_03_02',
                      name: '读已提交',
                      description: '一个事务只能读取已提交事务的修改，避免脏读但可能出现不可重复读。',
                      level: 5,
                      children: [],
                      videos: [],
                      coursewares: [],
                      questions: []
                    },
                    {
                      id: '6320910_acid_03_03',
                      name: '可重复读',
                      description: '在同一事务中多次读取同一数据结果一致，避免不可重复读但可能出现幻读。',
                      level: 5,
                      children: [],
                      videos: [],
                      coursewares: [],
                      questions: []
                    },
                    {
                      id: '6320910_acid_03_04',
                      name: '可串行化',
                      description: '最高隔离级别，事务串行执行，完全避免脏读、不可重复读和幻读。',
                      level: 5,
                      children: [],
                      videos: [],
                      coursewares: [],
                      questions: []
                    }
                  ],
                  videos: [],
                  coursewares: [],
                  questions: []
                },
                {
                  id: '6320910_acid_04',
                  name: '持久性',
                  description: '事务的持久性确保一旦事务提交成功，其对数据库的修改就是永久性的，即使系统崩溃也不会丢失。',
                  level: 4,
                  children: [],
                  videos: [],
                  coursewares: [],
                  questions: []
                }
              ],
              videos: [],
              coursewares: [
                {id: 13, courseId: 4, knowledgePointId: '6320910', title: 'GaussDB事务_GaussDB事务ppt', filePath: '课件\\GaussDB事务_GaussDB事务ppt.pdf', fileType: 'pdf'},
                {id: 14, courseId: 4, knowledgePointId: '6320910', title: 'GaussDB事务_GaussDB事务报告提纲', filePath: '课件\\GaussDB事务_GaussDB事务报告提纲.pdf', fileType: 'pdf'},
                {id: 15, courseId: 4, knowledgePointId: '6320910', title: 'GaussDB事务_GaussDB事务报告样板', filePath: '课件\\GaussDB事务_GaussDB事务报告样板.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320911',
              name: '加密',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 20, courseId: 4, knowledgePointId: '6320911', title: '视频：事务与加密实验辅导视频 事务与加密', filePath: '视频\\实验（十二 PostgreSQL）：事务与加密_基于应急预案数据库--提高应急预案质量，增强应急处置能力\\视频：事务与加密实验辅导视频_事务与加密_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 62, courseId: 4, knowledgePointId: '6320911', title: '实验报告提纲_事务与加密实验报告提纲', filePath: '课件\\实验报告提纲_事务与加密实验报告提纲.pdf', fileType: 'pdf'},
                {id: 83, courseId: 4, knowledgePointId: '6320911', title: '实验报告评分标准_事务与加密实验报告评分标准', filePath: '课件\\实验报告评分标准_事务与加密实验报告评分标准.pdf', fileType: 'pdf'},
                {id: 91, courseId: 4, knowledgePointId: '6320911', title: '实验指导书_事务与加密实验指导', filePath: '课件\\实验指导书_事务与加密实验指导.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320912',
              name: '数据建模',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 22, courseId: 4, knowledgePointId: '6320912', title: '视频：Powerdesigner数据库建模实验辅导视频 直播', filePath: '视频\\实验（十四 PostgreSQL）：Powerdesigner数据库建模_基于德育教育数据库-弘扬社会主义核心价值观，培育社会主义道德品质\\视频：Powerdesigner数据库建模实验辅导视频_直播_blurred.mp4', duration: null}
              ],
              coursewares: [],
              questions: []
            },
            {
              id: '6320914',
              name: '查询优化',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 19, courseId: 4, knowledgePointId: '6320914', title: '视频：索引与查询优化实验辅导视频 直播sc', filePath: '视频\\实验（十三 PostgreSQL）：索引与查询优化_基于图灵奖数据库--中华复兴，匹夫有责；立志高远，复兴中华\\视频：索引与查询优化实验辅导视频_直播sc_blurred.mp4', duration: null},
                {id: 39, courseId: 4, knowledgePointId: '6320914', title: '第一节 关系操作的实现', filePath: '视频\\第九章 查询优化\\第一节 关系操作的实现_关系操作的实现_blurred.mp4', duration: null},
                {id: 40, courseId: 4, knowledgePointId: '6320914', title: '第三节 查询优化', filePath: '视频\\第九章 查询优化\\第三节 查询优化_查询优化_blurred.mp4', duration: null},
                {id: 41, courseId: 4, knowledgePointId: '6320914', title: '第二节 关系操作的实现（续）', filePath: '视频\\第九章 查询优化\\第二节 关系操作的实现（续）_关系操作的实现（续）_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 3, courseId: 4, knowledgePointId: '6320914', title: '12、性能调优_性能调优', filePath: '课件\\12、性能调优_性能调优.pdf', fileType: 'pdf'},
                {id: 29, courseId: 4, knowledgePointId: '6320914', title: 'GaussDB索引与查询优化_GaussDB索引与查询优化ppt', filePath: '课件\\GaussDB索引与查询优化_GaussDB索引与查询优化ppt.pdf', fileType: 'pdf'},
                {id: 30, courseId: 4, knowledgePointId: '6320914', title: 'GaussDB索引与查询优化_GaussDB索引与查询优化报告模板', filePath: '课件\\GaussDB索引与查询优化_GaussDB索引与查询优化报告模板.pdf', fileType: 'pdf'},
                {id: 31, courseId: 4, knowledgePointId: '6320914', title: 'GaussDB索引与查询优化_GaussDB索引和性能优化报告样板', filePath: '课件\\GaussDB索引与查询优化_GaussDB索引和性能优化报告样板.pdf', fileType: 'pdf'}
              ],
              questions: []
            },
            {
              id: '6320915',
              name: 'Hadoop',
              description: '',
              level: 3,
              children: [],
              videos: [
              ],
              coursewares: [],
              questions: []
            },
            {
              id: '6320918',
              name: '综合练习',
              description: '',
              level: 3,
              children: [],
              videos: [
                {id: 21, courseId: 4, knowledgePointId: '6320918', title: '视频：综合应用实验辅导视频 直播zh', filePath: '视频\\实验（十五）：综合应用(Browser-Java-Server)_基于网上书店系统-读书越多，精神就愈健壮而勇敢\\视频：综合应用实验辅导视频_直播zh_blurred.mp4', duration: null}
              ],
              coursewares: [
                {id: 39, courseId: 4, knowledgePointId: '6320918', title: 'JSP案例样板_JSP', filePath: '课件\\JSP案例样板_JSP.pdf', fileType: 'pdf'}
              ],
              questions: []
            }
          ]
        }
    ]

// ── 从 MOCK_CHAPTERS 构建知识图谱 nodes & links ──
const buildGraphFromChapters = (chapters: SubTopicVO[]): KnowledgeGraphData => {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []

  const addKpTree = (
    kp: SubTopicVO['knowledgePoints'][number],
    parentId: string,
    depth: number,
    relationType: string
  ) => {
    const group = Math.min(depth + 1, 7)
    nodes.push({
      id: kp.id,
      name: kp.name,
      group,
      level: kp.level,
      description: kp.description || undefined,
    })
    links.push({ source: parentId, target: kp.id, type: relationType })
    for (const child of kp.children) {
      addKpTree(child, kp.id, depth + 1, 'PARENT_KP')
    }
  }

  for (const st of chapters) {
    nodes.push({
      id: st.id,
      name: st.name,
      group: 0,
      description: st.description || undefined,
    })
    for (const kp of st.knowledgePoints) {
      addKpTree(kp, st.id, 0, 'BELONGS_TO')
    }
  }

  return { nodes, links }
}

export const getKnowledgeGraph = (courseId: number): Promise<KnowledgeGraphData> => {
  if (USE_MOCK) {
    return Promise.resolve(buildGraphFromChapters(MOCK_CHAPTERS))
  }
  return request.get<KnowledgeGraphData, KnowledgeGraphData>(`/knowledge-graph/${courseId}`)
}

export const getKnowledgePointDetail = (id: string) => {
  return request.get<KnowledgePointDetail, KnowledgePointDetail>(`/knowledge-point/${id}`)
}

export const getLearningPath = (courseId: number) => {
  return request.get<LearningPathItem[], LearningPathItem[]>(`/courses/${courseId}/learning-path`)
}

export const getPrerequisites = (kpId: string) => {
  return request.get<KnowledgePointDetail[], KnowledgePointDetail[]>(`/knowledge-point/${kpId}/prerequisites`)
}

export const getRecommendation = (courseId: number) => {
  return request.get<RecommendationItem[], RecommendationItem[]>(`/courses/${courseId}/recommendation`)
}

export const searchQA = (query: string) => {
  return request.post<QASearchResult[], QASearchResult[]>('/qa/search', { query })
}

export const markAsMastered = (kpId: string) => {
  return request.post<void, void>(`/knowledge-point/${kpId}/master`)
}

export const getChapterStructure = (courseId: number): Promise<SubTopicVO[]> => {
  if (USE_MOCK) {
    return Promise.resolve(MOCK_CHAPTERS)
  }
  return request.get<SubTopicVO[], SubTopicVO[]>(`/courses/${courseId}/chapters`)
}

// ── 教师端：图谱表格导入 ──

/** 表格导入结果（统计 + 失败明细），字段与后端 GraphImportResultVO 一致 */
export interface GraphImportResult {
  nodeTotal: number
  createdNodes: number
  updatedNodes: number
  deletedNodes: number
  relationTotal: number
  writtenRelations: number
  deletedRelations: number
  autoRelations: number
  failCount: number
  failDetails: string[]
}

/** 上传节点/关系表格（Excel/CSV），解析后写入 Neo4j — POST /knowledge-graph/import */
export const importKnowledgeGraph = (courseId: number, files: File[]) => {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  return request.post<GraphImportResult, GraphImportResult>(
    `/knowledge-graph/import?courseId=${courseId}`,
    formData,
    {
      headers: {
        // 覆盖实例级全局 Content-Type: application/json：axios 1.x 默认 transformRequest
        // 在 Content-Type 为 application/json 时会用 formDataToJSON 把 FormData 序列化成
        // JSON 发送（实测 POST body 为 {"files":{...}}），后端 MultipartFile 收不到文件。
        // 置为 undefined 让 axios 保留 FormData 原样，由浏览器自动生成 multipart boundary。
        'Content-Type': undefined,
      },
    },
  )
}

/** 获取某课程全量图谱数据（三种节点 + 全部关系） — GET /knowledge-graph/full/{courseId} */
export const getFullGraph = (courseId: number): Promise<KnowledgeGraphData> => {
  return request.get<KnowledgeGraphData, KnowledgeGraphData>(`/knowledge-graph/full/${courseId}`)
}

/** 下载图谱导入模板（节点表 + 关系表双 Sheet） — GET /knowledge-graph/template */
export const downloadGraphTemplate = async () => {
  const blob = await request.get<Blob, Blob>('/knowledge-graph/template', {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '知识图谱导入模板.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 下载当前课程图谱数据文件（节点表 + 关系表双 Sheet，内容为该课程 source 下全部真实数据） — GET /knowledge-graph/export/{courseId} */
export const downloadGraphFile = async (courseId: number, fileName = '知识图谱数据.xlsx') => {
  const blob = await request.get<Blob, Blob>(`/knowledge-graph/export/${courseId}`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
