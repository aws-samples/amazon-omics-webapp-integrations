<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '../../stores/auth-store';
import { useRouter } from 'vue-router';
import PasswordRecovery from './PasswordRecovery.vue';

const auth = useAuthStore();

if (auth.isAuthenticated) {
  const router = useRouter();
  router.push({ name: 'dashboard' });
}

const loading = ref(false);
const startPasswordRecovery = ref(false);
const form = reactive({ username: '', password: '' });

const onReset = () => {
  form.username = '';
  form.password = '';
};

const onSubmit = async () => {
  loading.value = true;
  await auth.login(form);
  loading.value = false;
};
</script>

<template>
  <div class="q-pa-md" style="max-width: 500px">
    <PasswordRecovery
      v-if="startPasswordRecovery"
      v-on:hide="startPasswordRecovery = false"
    />
    <div class="text-h4 q-py-md">Sign in</div>
    <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
      <q-input
        filled
        :loading="loading"
        type="text"
        v-model.trim="form.username"
        label="Your email or username *"
        lazy-rules
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <q-input
        filled
        type="password"
        v-model="form.password"
        label="Your password *"
        lazy-rules
        spellcheck="false"
        :rules="[(val) => (val && val.length > 0) || 'Please type something']"
      />
      <div>
        <q-btn label="Login" type="submit" color="primary" :loading="loading" />
        <q-btn label="Reset" type="reset" color="grey-8" flat class="q-ml-sm" />
        <q-btn
          label="Forgot password"
          color="grey-8"
          flat
          class="q-ml-sm"
          @click="startPasswordRecovery = true"
        />
      </div>
    </q-form>
  </div>
</template>
