<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { createUser } from '../api/cognito/cognito';
import ListUsers from '../components/users/ListUsers.vue';

const loading = ref(false);
const showForm = ref(false);
const ListUsersRef = ref();
const form = reactive({ username: '', email: '' });
const $q = useQuasar();

const resetValue = () => {
  form.email = '';
  form.username = '';
};

const toast = (message: string, color: string) => {
  $q.notify({
    position: 'top',
    message: message,
    color: color,
  });
};

const onSubmit = async () => {
  loading.value = true;
  const res = await createUser({
    username: form.username,
    email: form.email,
  });

  if (res.$metadata.httpStatusCode === 200) {
    loading.value = false;
    ListUsersRef.value.getUsers();
    showForm.value = false;
    resetValue();
    toast('Success', 'green');
  } else {
    toast(`Error:${res}`, 'red');
    loading.value = false;
    showForm.value = false;
    resetValue();
  }
};

const onReset = () => {
  form.username = '';
  form.email = '';
};
</script>

<template>
  <q-page padding>
    <div class="q-gutter-sm q-pa-smd">
      <q-dialog v-model="showForm" persistent>
        <q-card style="min-width: 450px">
          <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
            <q-card-section>
              <div class="text-h6">User info</div>
            </q-card-section>
            <q-card-section>
              <q-input
                filled
                :loading="loading"
                type="text"
                v-model.trim="form.username"
                label="Username *"
                lazy-rules
                :rules="[
                  (val) => (val && val.length > 0) || 'Please type something',
                ]"
              />
              <q-input
                filled
                :loading="loading"
                type="text"
                v-model.trim="form.email"
                label="Your email*"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.length > 0) ||
                    'Please input valid email address',
                ]"
              />
            </q-card-section>

            <q-card-actions align="right" class="text-primary">
              <q-btn
                label="Submit"
                type="submit"
                color="primary"
                :loading="loading"
              />
              <q-btn
                label="Reset"
                type="reset"
                color="primary"
                class="q-ml-sm"
              />

              <q-btn label="Cancel" v-close-popup color="primary" />
            </q-card-actions>
          </q-form>
        </q-card>
      </q-dialog>
      <div>
        <q-btn
          color="indigo-12"
          icon="add"
          label="Add user"
          @click="showForm = true"
        />
      </div>
      <ListUsers ref="ListUsersRef" />
    </div>
  </q-page>
</template>
