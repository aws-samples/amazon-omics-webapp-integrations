import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: true, isAdmin: false },
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: true, isAdmin: false },
      },
      {
        path: '/users',
        name: 'users',
        component: () => import('src/pages/UserPage.vue'),
        meta: { requiresAuth: true, isAdmin: true },
      },
      {
        path: '/workflow',
        name: 'workflow',
        component: () => import('pages/Workflow.vue'),
        meta: { requiresAuth: true, isAdmin: false },
      },
      {
        path: '/ready2run',
        name: 'ready2run',
        component: () => import('pages/Ready2RunWorkflow.vue'),
        meta: { requiresAuth: true, isAdmin: false },
      },
      {
        path: '/job',
        name: 'job',
        component: () => import('pages/Job.vue'),
        meta: { requiresAuth: true, isAdmin: false },
      },
      {
        path: '/repository',
        name: 'repository',
        component: () => import('pages/Repository.vue'),
        meta: { requiresAuth: true, isAdmin: false },
      },
      {
        path: '/analytics',
        name: 'analytics',
        component: () => import('pages/Analytics.vue'),
        meta: { requiresAuth: true, isAdmin: false },
      },
      {
        path: '/signin',
        component: () => import('src/pages/Signin.vue'),
        name: 'signin',
      },
      {
        path: '/signout',
        component: () => import('src/pages/SignOut.vue'),
        meta: { requiresAuth: true, isAdmin: false },
        name: 'signout',
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
