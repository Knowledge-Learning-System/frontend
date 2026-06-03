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
          path: 'knowledge-graph',
          name: 'KnowledgeGraph',
          component: () => import('@/views/KnowledgeGraph.vue'),
        },
        {
          path: 'qa',
          name: 'QA',
          component: () => import('@/views/qa/Index.vue'),
        },
        {
          path: 'assignments',
          name: 'Assignments',
          component: () => import('@/views/assignments/Index.vue'),
        },
        {
          path: 'diagnosis',
          name: 'Diagnosis',
          component: () => import('@/views/diagnosis/Index.vue'),
        },
        {
          path: 'recommendations',
          name: 'Recommendations',
          component: () => import('@/views/recommendations/Index.vue'),
        },
        {
          path: 'assessment',
          name: 'Assessment',
          component: () => import('@/views/assessment/Index.vue'),
        },
        {
          path: 'search',
          name: 'Search',
          component: () => import('@/views/search/Index.vue'),
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