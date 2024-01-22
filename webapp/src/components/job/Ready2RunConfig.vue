<script setup lang="ts">
import { ref, computed } from 'vue';
import { set, map, get, isEmpty, identity } from 'lodash';

import { useQuery, UseQueryResponse } from '@urql/vue';
import { getWorkflowCommand } from '../../api/appsync/query';
import { useReady2RunParamStore } from '../../stores/run-params-store';

const readonly = ref(false);
const disable = ref(false);
const nameRef = ref(null);
const outputUriRef = ref(null);
let parameterFile = ref(null);
let reader = new FileReader();
const store = useReady2RunParamStore();
let data = ref(store.data);
let parameters = ref(store.parameters);
let paramValue = ref('manual');
const query = ref(getWorkflowCommand);
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
  variables: {
    id: data.value.workflowId,
    workflowType: 'READY2RUN',
  },
});

const ready2RunDetails = computed(() => {
  if (response.fetching.value) return [];
  const params: Array<unknown> = get(
    response.data,
    'value.getWorkflowCommand',
    []
  );
  console.log(params);
  if (!isEmpty(params)) {
    store.updateDataState({
      workflowId: params.id,
      storageCapacity: params.storageCapacity / 1000,
      workflowType: params.type,
      priority: 100,
    });
    return params;
  }
  return [];
});
const onReadFile = (file: File) => {
  const name: string = file.name;
  if (name.endsWith('json')) {
    getFileData(file);
  }
};

const ready2RunTemplate = computed(() => {
  if (response.fetching.value) return [];
  const template: Array<unknown> = get(
    response.data,
    'value.getWorkflowCommand',
    []
  );
  if (!isEmpty(template)) return JSON.parse(template.parameterTemplate);
  return [];
});

const getFileData = (file: File) => {
  reader.onload = (e) => {
    let json = JSON.parse(e.target.result);
    map(json, (key: string, index: string) => {
      set(store.parameters, index, key);
    });
  };
  reader.readAsText(file);
};

const changeValue = (event: any, index: any) => {
  set(store.parameters.items, index, event);
};
const changeDefinition = (event: any, index: any) => {
  if (index === 'priority') event = Number(event);
  set(store.data, index, event);
};

console.log(nameRef);
</script>

<template>
  <div class="row q-gutter-sm q-py-sm">
    <q-input v-model="ready2RunDetails.id" label="Workflow id" readonly />
    <q-input
      dark
      v-model="data.name"
      label="Run name"
      :readonly="readonly"
      :disable="disable"
      class="col"
      ref="nameRef"
      :rules="[(val) => !!val || 'Field is required']"
      @change="(event) => changeDefinition(event, 'name')"
    />
    <q-input
      v-model="ready2RunDetails.storageCapacity"
      label="Storage Capacity"
      readonly
    />
    <q-input
      dark
      type="number"
      v-model.number="data.priority"
      label="Run priority"
      :readonly="readonly"
      :disable="disable"
      hint="Integers only. Range is 0-1,000"
      class="col"
      :rules="[(val) => !!val || 'Field is required']"
      @change="(event:number) => changeDefinition(event, 'priority')"
    />
  </div>

  <div class="row q-gutter-sm q-py-sm">
    <q-input
      dark
      v-model="data.outputUri"
      label="Select S3 output destination"
      :readonly="readonly"
      :disable="disable"
      class="col"
      ref="outputUriRef"
      :rules="[
        (val) => !!val || 'Field is required: s3://bucket/prefix/object',
      ]"
      @change="(event) => changeDefinition(event, 'outputUri')"
    >
      <template v-slot:hint> Format: s3://bucket/prefix/object. </template>
    </q-input>
  </div>
  <q-separator dark spaced="lg" />
  <div class="q-py-md q-col-gutter-none column">
    <p class="text-h4">Parameters</p>
    <div class="q-pa-md">
      <q-radio
        dark
        color="blue"
        v-model="paramValue"
        val="manual"
        label="Manually enter values"
      />
      <q-radio
        dark
        color="blue"
        v-model="paramValue"
        val="local"
        label="Select JSON from local"
      />
    </div>
    <div v-show="paramValue === 'local'" class="justifiy-center">
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
          Upload your json file for parameter values
        </template>
      </q-file>
    </div>
    <q-separator dark spaced="lg" />
    <ul>
      <li
        v-for="(value, key, index) in ready2RunTemplate"
        :key="index"
        class="row"
      >
        <p class="col-2 q-pt-md">
          {{ key }} ({{ value.optional ? 'Optional' : 'Required' }})
        </p>
        <q-input
          dark
          v-model="parameters[key]"
          :readonly="readonly"
          :disable="disable"
          class="col"
          @change="(event) => changeValue(event, key)"
          :hint="value.description"
          :rules="[(val) => value.optional || !!val || 'Required Field']"
        />
      </li>
    </ul>
  </div>
</template>
