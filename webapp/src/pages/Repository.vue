<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useMutation } from '@urql/vue';
import { createRepositoryCommand } from '../api/appsync/mutation';
import ListRepository from '../components/ecr/ListRepository.vue';

const loading = ref(false);
const showForm = ref(false);
const form = reactive({ repoName: '', scanOption: true, tagOption: 'MUTABLE' });
const $q = useQuasar();
const createRepositoryCommandResult = useMutation(createRepositoryCommand);
const toast = (message: string, color: string) => {
  $q.notify({
    position: 'top',
    message: message,
    color: color,
  });
};

const onReset = () => {
  form.repoName = '';
  form.scanOption = true;
  form.tagOption = 'MUTABLE';
};

const onSubmit = async () => {
  loading.value = true;
  const input = {
    repositoryName: form.repoName,
    encryptionConfiguration: {
      encryptionType: 'AES256',
    },
    imageScanningConfiguration: {
      scanOnPush: form.scanOption,
    },
    imageTagMutability: form.tagOption,
  };
  const res = await createRepositoryCommandResult.executeMutation({
    CreateRepositoryCommandInput: input,
  });
  if (res.data.createRepositoryCommand.repository !== null) {
    loading.value = false;
    showForm.value = false;
    onReset();
    toast('Success', 'green');
  } else {
    toast(
      'Error: Cannot create new repository. Please check whether repository name is duplicated',
      'red'
    );
    showForm.value = false;
    loading.value = false;
    onReset();
  }
};
</script>

<template>
  <q-page padding>
    <div class="q-gutter-sm q-pa-smd">
      <q-dialog v-model="showForm" persistent>
        <q-card style="min-width: 450px">
          <q-form @submit="onSubmit" @reset="onReset" class="q-gutter-md">
            <q-card-section>
              <div class="text-h6">Repository configuration</div>
            </q-card-section>
            <q-card-section>
              <q-input
                filled
                :loading="loading"
                type="text"
                v-model.trim="form.repoName"
                label="Repository name *"
                lazy-rules
                :rules="[
                  (val) =>
                    (val && val.length > 2) ||
                    'Please input more than three characters',
                ]"
              />
              <div class="q-gutter-sm">
                <q-toggle
                  :label="`Scan on push is ${form.scanOption}`"
                  v-model="form.scanOption"
                  color="indigo-12"
                />
              </div>
              <div class="q-px-sm">
                Enable scan on push to have each image automatically scanned
                after being pushed to a repository. If disabled, each image scan
                must be manually started to get scan results.
              </div>
              <div class="q-gutter-sm">
                <q-toggle
                  :label="`Tag immutability is ${form.tagOption}`"
                  true-value="IMMUTABLE"
                  false-value="MUTABLE"
                  v-model="form.tagOption"
                  color="indigo-12"
                />
              </div>
              <div class="q-px-sm">
                Enable tag immutability to prevent image tags from being
                overwritten by subsequent image pushes using the same tag.
                Disable tag immutability to allow image tags to be overwritten.
              </div>
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
          label="Create repository"
          @click="showForm = true"
        />
      </div>
      <ListRepository />
    </div>
  </q-page>
</template>
