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
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
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

  return true
})

export default router
