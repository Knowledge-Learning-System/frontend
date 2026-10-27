import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
        },
        {
          path: 'assessment',
          name: 'Assessment',
          component: () => import('@/views/Assessment.vue'),
        },
        {
          path: 'radar-chart',
          name: 'RadarChart',
          component: () => import('@/views/RadarChart.vue'),
        },
        {
          path: 'statistics',
          name: 'MyStatistics',
          component: () => import('@/views/MyStatistics.vue'),
        },
        {
          path: 'weak-points',
          name: 'WeakPoints',
          component: () => import('@/views/WeakPoints.vue'),
        },
        {
          path: 'recommendations',
          name: 'Recommendations',
          component: () => import('@/views/Recommendations.vue'),
        },
        {
          path: 'learning-plan',
          name: 'LearningPlan',
          component: () => import('@/views/LearningPlan.vue'),
        },
        {
          path: 'course/:courseId',
          name: 'CourseDetail',
          component: () => import('@/views/CourseDetail.vue'),
        },
        {
          path: 'notes',
          name: 'NotesManagement',
          component: () => import('@/views/NotesManagement.vue'),
        },
        {
          path: 'search',
          name: 'SearchPage',
          component: () => import('@/views/SearchPage.vue'),
        },
        {
          path: 'personal-center',
          name: 'PersonalCenter',
          component: () => import('@/views/PersonalCenter.vue'),
        },
        {
          path: 'my-courses',
          name: 'MyCourses',
          component: () => import('@/views/MyCourses.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/Settings.vue'),
        },
        {
          path: 'qa',
          name: 'QA',
          component: () => import('@/views/QAPage.vue'),
        },
        {
          path: 'discussions',
          name: 'Discussions',
          component: () => import('@/views/Discussion.vue'),
        },
      ],
    },
    {
      path: '/teacher',
      component: () => import('@/layouts/TeacherLayout.vue'),
      redirect: '/teacher/hall',
      children: [
        {
          path: 'hall',
          name: 'TeacherCourseHall',
          component: () => import('@/views/teacher/TeacherCourseHall.vue'),
        },
        {
          path: 'graph',
          name: 'TeacherGraphManage',
          component: () => import('@/views/teacher/TeacherGraphManage.vue'),
        },
        {
          path: 'knowledge/:courseId/:kpId',
          name: 'TeacherKnowledgePointDetail',
          component: () => import('@/views/teacher/TeacherKnowledgePointDetail.vue'),
        },
        {
          path: 'courses',
          name: 'TeacherCourses',
          component: () => import('@/views/teacher/TeacherCourses.vue'),
        },
        {
          path: 'students',
          name: 'TeacherStudents',
          component: () => import('@/views/teacher/TeacherStudents.vue'),
        },
        {
          path: 'homework',
          name: 'TeacherHomework',
          component: () => import('@/views/teacher/TeacherHomework.vue'),
        },
        {
          path: 'questions',
          name: 'TeacherQuestions',
          component: () => import('@/views/teacher/TeacherQuestions.vue'),
        },
        {
          path: 'discussions',
          name: 'TeacherDiscussions',
          component: () => import('@/views/Discussion.vue'),
        },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: '/admin/teachers',
      children: [
        {
          path: 'teachers',
          name: 'AdminTeacherCourses',
          component: () => import('@/views/admin/AdminTeacherCourses.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
      const role = userStore.userInfo?.role
      if (role === 'teacher') return '/teacher/hall'
      if (role === 'admin') return '/admin/teachers'
      return '/dashboard'
    }
    return true
  }

  if (!userStore.isLoggedIn) {
    return '/login'
  }

  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch {
      userStore.clearAuth()
      return '/login'
    }
  }

  const role = userStore.userInfo?.role

  // 学生访问教师端/管理员端 → 重定向回学生端首页
  if ((to.path.startsWith('/teacher') || to.path.startsWith('/admin')) && role !== 'teacher' && role !== 'admin') {
    return '/dashboard'
  }

  // 教师访问任何非教师端页面 → 锁死在教师端
  if (role === 'teacher' && !to.path.startsWith('/teacher')) {
    return '/teacher/hall'
  }

  // 管理员访问任何非管理员端页面 → 锁死在管理员端
  if (role === 'admin' && !to.path.startsWith('/admin')) {
    return '/admin/teachers'
  }

  return true
})

export default router
