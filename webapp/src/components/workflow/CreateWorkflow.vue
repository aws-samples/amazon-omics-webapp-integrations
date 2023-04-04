<script setup lang="ts">
import { Loading, useQuasar } from 'quasar';
import { ref } from 'vue';
import { useMutation } from '@urql/vue';
import { useCreateWorkflowParamStore } from '../../stores/run-params-store';
import { createWorkflowCommand } from '../../api/appsync/mutation';
import { map, set } from 'lodash';

const $q = useQuasar();
const readonly = ref(false);
const disable = ref(false);
const step = ref(1);
const done1 = ref(false);
const done2 = ref(false);
const storageCapacityList = [1.2, 2.4, 4.8, 7.2, 9.6];
const workflowLangList = ['WDL', 'Nextflow'];
let storageCapacity = ref('');
let workflowLang = ref('');
const store = useCreateWorkflowParamStore();
const createWorkflowCommandResult = useMutation(createWorkflowCommand);
let parameterFile = ref(null);
let reader = new FileReader();
let data = ref(store.data);

const toast = (message: string, color: string) => {
  $q.notify({
    position: 'top',
    message: message,
    color: color,
  });
};

const onReset = () => {
  done1.value = false;
  done2.value = false;
  step.value = 1;
  data = ref(store.data);
};

const showLoading = async () => {
  Loading.show({
    message: 'Create new workflow is in progress. Hang on...',
  });
  const transformedAwsJson: any = JSON.stringify(store.parameters);
  const input = {
    ...store.data,
    parameterTemplate: transformedAwsJson,
  };
  const result = await createWorkflowCommandResult.executeMutation({
    OmicsCreateWorkflowCommandInput: input,
  });
  if (result.data.createWorkflowCommand.status !== null) {
    toast('Success', 'green');
    store.updateDataState({
      definitionUri: '',
      description: '',
      engine: '',
      name: '',
      storageCapacity: 1.2,
    });
    parameterFile = ref(null);
    workflowLang = ref('');
    storageCapacity = ref('');
    store.updateParamsState({});
    onReset();
    Loading.hide();
    done2.value = true;
  } else {
    toast('Error', 'red');
    Loading.hide();
    done2.value = true;
    onReset();
  }
};

const onReadFile = (file: File) => {
  const name: string = file.name;
  if (name.endsWith('json')) {
    getFileData(file);
  }
};

const getFileData = (file: File) => {
  reader.onload = (e) => {
    let json = JSON.parse(e.target.result);
    map(json, (key: string, index: string) => {
      set(store.parameters, index, key);
    });
  };
  reader.readAsText(file);
};

const changeDefinition = (event: any, index: any) => {
  set(store.data, index, event);
};
</script>

<template>
  <div>
    <q-stepper
      v-model="step"
      header-nav
      ref="stepper"
      done-color="blue"
      active-color="blue"
      animated
    >
      <q-step :name="1" title="Define workflow" icon="settings" :done="done1">
        <p class="text-h4">Workflow Definition</p>
        <div class="row q-gutter-sm q-py-sm">
          <q-input
            dark
            v-model="data.name"
            label="Workflow name"
            :readonly="readonly"
            :disable="disable"
            class="col"
            :rules="[(val) => !!val || 'Field is required']"
            @change="(event) => changeDefinition(event, 'name')"
          />

          <q-input
            dark
            v-model="data.description"
            label="Description"
            :readonly="readonly"
            :disable="disable"
            class="col"
            @change="(event) => changeDefinition(event, 'description')"
          />
          <q-select
            v-model="storageCapacity"
            :options="storageCapacityList"
            label="Storage capacity"
            style="width: 200px"
            color="purple-12"
            class="q-pl-md"
            @update:model-value="
              (event) => changeDefinition(event, 'storageCapacity')
            "
          />
        </div>

        <div class="row q-gutter-sm q-py-sm">
          <q-input
            dark
            v-model="data.definitionUri"
            label="Workflow definition in S3"
            :readonly="readonly"
            :disable="disable"
            class="col"
            :rules="[
              (val) => !!val || 'Field is required: s3://bucket/prefix/object',
            ]"
            @change="(event) => changeDefinition(event, 'definitionUri')"
          >
            <template v-slot:hint>
              Format: s3://bucket/prefix/object. File type must be .zip.
            </template>
          </q-input>

          <q-select
            v-model="workflowLang"
            :options="workflowLangList"
            label="Workflow language"
            style="width: 300px"
            color="purple-12"
            class="q-pl-md"
            :rules="[(val) => !!val || 'Field is required']"
            @update:model-value="(event) => changeDefinition(event, 'engine')"
          />
        </div>
        <q-separator dark spaced="lg" />
        <div class="q-py-md q-col-gutter-none column">
          <p class="text-h4">Parameters</p>
          <q-file
            filled
            class="self-center"
            style="width: 350px"
            v-model="parameterFile"
            bottom-slots
            @update:model-value="onReadFile"
            label="Select your json file"
            counter
          >
            <template v-slot:prepend>
              <q-icon name="cloud_upload" @click.stop.prevent />
            </template>

            <template v-slot:hint>
              Upload your json file for advanced parameters
            </template>
          </q-file>
          <q-separator dark spaced="lg" />
          <ul>
            <li
              v-for="(param, index) in store.parameters"
              :key="index"
              class="row"
            >
              <p class="col-6 q-pt-md">{{ index }}</p>
              <p class="col-6 q-pt-md">{{ param }}</p>
            </li>
          </ul>
        </div>
        <q-stepper-navigation>
          <q-btn
            @click="
              () => {
                done1 = true;
                step = 2;
              }
            "
            color="indigo-12"
            label="Confirmation"
          />
        </q-stepper-navigation>
      </q-step>
      <q-step :name="2" title="Confirmation" icon="settings" :done="done2">
        <div class="q-pa-md">
          <p class="text-h4">Workflow Definition</p>
          <ul>
            <li v-for="(data, index) in store.data" :key="index" class="row">
              <p class="col-3 text-h6">{{ index }}</p>
              <p class="text-h6">{{ data }}</p>
            </li>
          </ul>
          <q-separator dark spaced="lg" />
          <p class="text-h4">Parameters</p>
          <ul>
            <li
              v-for="(data, index) in store.parameters"
              :key="index"
              class="row"
            >
              <p class="text-h6">{{ index }}</p>
            </li>
          </ul>
        </div>

        <q-stepper-navigation>
          <q-btn color="indigo-12" @click="showLoading" label="Execute" />
          <q-btn @click="step = 1" color="pink" label="Back" class="q-ml-sm" />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </div>
</template>
