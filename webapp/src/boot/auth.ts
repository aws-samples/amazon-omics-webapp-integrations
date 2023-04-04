import { Notify } from 'quasar';
import { boot } from 'quasar/wrappers';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
import { useAuthStore } from 'src/stores/auth-store';

export default boot(async ({ router }) => {
  const auth = useAuthStore();
  await auth.loadUser();
  router.beforeResolve((to, _, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (auth.isAuthenticated) {
        if (to.matched.some((record) => record.meta.isAdmin)) {
          if (auth.isAdmin) {
            next();
          } else {
            Notify.create({
              message: 'Your role is not authorized to see this view. ',
              color: 'negative',
            });
            next({ name: 'dashboard' });
          }
        }
        next();
      } else {
        next({
          name: 'signin',
        });
      }
    } else {
      next();
    }
  });
});
