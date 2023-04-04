<script setup lang="ts">
import { reactive } from 'vue';
import { get } from 'lodash';
import { Auth } from 'aws-amplify';
import { Notify } from 'quasar';

const state = reactive({
  show: true,
  hasCode: false,
  loading: false,
  isPwd: true,
  username: '',
  password1: '',
  password2: '',
  code: '',
  error: '',
});

async function submitUserName() {
  state.loading = true;
  try {
    await Auth.forgotPassword(state.username);
    Notify.create({
      message: 'Check your email for authorization code',
      type: 'positive',
      position: 'center',
    });
    state.loading = false;
    state.hasCode = true;
  } catch (e) {
    state.loading = false;
  }
}

async function updatePassword() {
  state.loading = true;
  try {
    await Auth.forgotPasswordSubmit(
      state.username,
      state.code,
      state.password1
    );

    state.loading = false;

    Notify.create({
      type: 'positive',
      message: 'Password updated, you can now login',
    });

    state.show = false;
  } catch (error) {
    error = get(error, 'message');
    state.loading = false;
  }
}
</script>

<template>
  <q-dialog v-model="state.show" persistent>
    <q-card style="width: 700px; max-width: 80vw">
      <q-card-section>
        <div class="text-h6">Password Recovery</div>
      </q-card-section>
      <q-card-section v-if="!state.hasCode">
        <q-form
          @submit.prevent="submitUserName()"
          autofocus
          autocorrect="off"
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
        >
          <q-input
            filled
            label="Enter your username"
            v-model="state.username"
            :error-message="state.error"
            :rules="[
              (val) => (val && val.length > 0) || 'Enter a valid username',
            ]"
            bottom-slots
          />
          <q-btn flat label="I have a code" @click="state.hasCode = true" />
          <div class="q-gutter-sm q-mt-md">
            <q-btn
              label="Submit"
              color="primary"
              type="submit"
              :loading="state.loading"
            />
            <q-btn
              label="Cancel"
              color="grey-8"
              v-close-popup
              @click="$emit('hide')"
            />
          </div>
        </q-form>
      </q-card-section>
      <q-card-selection v-else>
        <q-form
          class="q-pa-md"
          @submit.prevent="updatePassword()"
          autofocus
          autocorrect="off"
          autocapitalize="off"
          autocomplete="off"
          spellcheck="false"
        >
          <q-input
            filled
            label="Enter your username"
            v-model="state.username"
            :error-message="state.error"
            :rules="[
              (val) => (val && val.length > 0) || 'Enter a valid username',
            ]"
            bottom-slots
          />
          <q-input
            filled
            label="Code"
            v-model="state.code"
            type="text"
            hint="Code from email"
            :rules="[(val) => (val && val.length > 3) || 'Enter a valid code']"
          />
          <q-input
            filled
            label="Enter new Password"
            v-model="state.password1"
            :type="state.isPwd ? 'password' : 'text'"
            :error-message="state.error"
            hint="Min 7 characters"
            :error="state.error !== null"
            :rules="[
              (val) =>
                (val && val.length >= 7) ||
                'Your password needs to be at least 6 characters',
            ]"
            bottom-slots
            spellcheck="false"
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
            spellcheck="false"
            type="password"
            :rules="[
              (val) =>
                (val && val.length > 0 && val === state.password1) ||
                'You password should match',
            ]"
          />
          <div class="q-gutter-sm q-mt-md">
            <q-btn
              label="Update"
              color="primary"
              type="submit"
              :loading="state.loading"
            />
            <q-btn
              label="Cancel"
              color="grey-8"
              v-close-popup
              @click="$emit('hide')"
            />
          </div>
        </q-form>
      </q-card-selection>
    </q-card>
  </q-dialog>
</template>
