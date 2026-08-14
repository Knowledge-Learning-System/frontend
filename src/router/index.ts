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
      redirect: '/teacher/courses',
      children: [
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
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
      const role = userStore.userInfo?.role
      return role === 'teacher' ? '/teacher/courses' : '/dashboard'
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

  // 学生访问教师端 → 重定向回学生端首页
  if (to.path.startsWith('/teacher') && role !== 'teacher') {
    return '/dashboard'
  }

  // 教师访问任何非教师端页面 → 锁死在教师端
  if (role === 'teacher' && !to.path.startsWith('/teacher')) {
    return '/teacher/courses'
  }

  return true
})

export default router
