<template>
  <q-page class="row items-center justify-evenly" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAuthStore } from '../../src/stores/auth-store';

export default defineComponent({
  name: 'SignOut',
  async mounted() {
    const auth = useAuthStore();
    await auth.signOut();
    this.$router.push({ name: 'signin' });
  },
});
</script>
