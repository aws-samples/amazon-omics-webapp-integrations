<script setup lang="ts">
import { reactive } from 'vue';
import { useAuthStore } from '../../stores/auth-store';
import { get } from 'lodash';
import { Notify } from 'quasar';

const auth = useAuthStore();
const state = reactive({
  show: true,
  password1: '' as string,
  password2: null,
  isPwd: true,
  loading: false,
});
async function onSubmit() {
  state.loading = true;
  try {
    await auth.setPassword(state.password1);
    state.loading = false;
    Notify.create({
      type: 'positive',
      message: 'Password updated',
    });
    state.show = false;
  } catch (error) {
    state.loading = false;
    Notify.create({
      type: 'negative',
      message: get(error, 'message'),
    });
  }
}
</script>
<template>
  <q-dialog v-model="state.show" persistent ref="dialog">
    <q-card class="q-pa-md">
      <q-card-selection>
        <div class="text-h6">Setup new password</div>
        <p>To complete your login, you need to update your password.</p>
      </q-card-selection>
      <q-card-selection>
        <q-form
          @submit="onSubmit"
          autofocus
          autocorrect="off"
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
        >
          <q-input
            filled
            label="Enter new Password"
            v-model="state.password1"
            :type="state.isPwd ? 'password' : 'text'"
            hint="Min 7 characters"
            :rules="[
              (val) =>
                (val && val.length >= 7) ||
                'Your password needs to be at least 7 characters',
            ]"
            bottom-slots
          >
            <template v-slot:append>
              <q-icon
                :name="state.isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="state.isPwd = !state.isPwd"
              />
            </template>
          </q-input>
          <q-input
            filled
            v-model="state.password2"
            label="Confirm Password"
            type="password"
            :rules="[
              (val) =>
                (val && val.length > 0 && val === state.password1) ||
                'You password should match',
            ]"
          />
          <div>
            <q-btn
              label="Update"
              color="primary"
              type="submit"
              :loading="state.loading"
            />
          </div>
        </q-form>
      </q-card-selection>
    </q-card>
  </q-dialog>
</template>
