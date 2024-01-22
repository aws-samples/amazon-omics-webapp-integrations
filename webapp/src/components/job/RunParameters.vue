<script setup lang="ts">
import { ref, computed, toRef } from 'vue';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { useRunParamStore } from '../../stores/run-params-store';

import { getWorkflowCommand } from '../../api/appsync/query';
import { get, isEmpty, set, map } from 'lodash';

interface Props {
  id: string;
}
interface QueryResponse {
  id: string;
  logLevel?: null;
  name: string;
  outputUri: string;
  parameterTemplates: any;
  priority?: string;
  roleArn: string;
  storageCapacity?: any;
  type: string;
}

const storageCapacityList = [1.2, 2.4, 4.8, 7.2, 9.6];
const props = defineProps<Props>();
const readonly = ref(false);
const disable = ref(false);
const id = toRef(props, 'id');
const storageCapacity = ref('');
const store = useRunParamStore();
const query = ref(getWorkflowCommand);
const variables = computed(() => {
  const params = { id: id.value, workflowType: 'PRIVATE' };
  return params;
});

let reader = new FileReader();
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
  variables,
});

const getData = computed(() => {
  if (isEmpty(store.data || id.value !== store.data.id)) {
    if (response.fetching.value) return [];
    const data: QueryResponse = get(
      response,
      'data.value.getWorkflowCommand',
      []
    );
    if (isEmpty(data)) return [];
    store.updateDataState({
      logLevel: '',
      name: '',
      outputUri: '',
      parameters: '',
      priority: '',
      storageCapacity: data.storageCapacity,
      workflowId: data.id,
      workflowType: data.type,
    });
    return store.data;
  }
  return store.data;
});
const getParameters = computed(() => {
  if (isEmpty(store.parameters) || id.value !== store.data.id) {
    if (response.fetching.value) return [];
    const result: QueryResponse = get(
      response,
      'data.value.getWorkflowCommand',
      []
    );
    if (isEmpty(result)) return [];
    const res = JSON.parse(result.parameterTemplate);
    map(res, (key, index) => {
      set(res, index, '');
    });
    if (isEmpty(res)) return {};
    const items = {
      items: res,
    };
    store.updateParamsState(items);
    return store.parameters;
  }
  return store.parameters;
});

const file = ref(null);
const data = ref(getData);
let parameters = ref(getParameters);
const changeBasicValue = (event: any, index: any) => {
  if (index === 'priority') event = Number(event);
  set(store.data, index, event);
};
const changeValue = (event: any, index: any) => {
  set(store.parameters.items, index, event);
};

const onReadFile = (file: File) => {
  getFileData(file);
};

const getFileData = (file: File) => {
  reader.onload = (e) => {
    let json = JSON.parse(e.target.result);
    map(json, (key: string, index: string) => {
      set(store.parameters.items, index, key);
    });
  };
  reader.readAsText(file);
};
</script>

<template>
  <div class="q-pa-md">
    <p class="text-h4">Basic Run parameters</p>
    <div class="row q-gutter-sm q-py-sm">
      <q-input
        dark
        v-model="data.name"
        label="name"
        :readonly="readonly"
        :disable="disable"
        class="col"
        :rules="[(val) => !!val || 'Field is required']"
        @change="(event) => changeBasicValue(event, 'name')"
      />
      <q-select
        v-model="storageCapacity"
        :options="storageCapacityList"
        label="storageCapacity"
        style="width: 200px"
        color="purple-12"
        class="q-pl-md"
        @update:model-value="
          (event) => changeBasicValue(event, 'storageCapacity')
        "
      />
      <q-input
        dark
        type="number"
        v-model.number="data.priority"
        label="Priority"
        :readonly="readonly"
        :disable="disable"
        class="col"
        @change="(event) => changeBasicValue(event, 'priority')"
      />
    </div>
    <div class="row q-gutter-sm q-py-sm">
      <q-input
        dark
        v-model="data.workflowId"
        label="workflowId"
        readonly
        :disable="disable"
        class="col"
      />
      <q-input
        dark
        v-model="data.logLevel"
        label="logLevel"
        :readonly="readonly"
        :disable="disable"
        class="col"
        @change="(event) => changeBasicValue(event, 'logLevel')"
      />
    </div>
    <div class="row q-gutter-sm q-py-sm">
      <q-input
        dark
        v-model="data.workflowType"
        label="workflowType"
        readonly
        :disable="disable"
        class="col"
        @change="(event) => changeBasicValue(event, 'workflowType')"
      />
      <q-input
        dark
        v-model="data.outputUri"
        label="outputUri"
        :readonly="readonly"
        :disable="disable"
        class="col"
        :rules="[
          (val) => !!val || 'Field is required: s3://bucket/prefix/object.',
        ]"
        @change="(event) => changeBasicValue(event, 'outputUri')"
      >
        <template v-slot:hint> Format: s3://bucket/prefix/object. </template>
      </q-input>
    </div>
    <q-separator dark spaced="lg" />
    <div class="q-py-md q-col-gutter-none column">
      <p class="text-h4">Advanced parameters</p>
      <q-file
        filled
        class="self-center"
        style="width: 350px"
        v-model="file"
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
      <ul>
        <li v-for="(param, index) in parameters.items" :key="index" class="row">
          <p class="col-3 q-pt-md">{{ index }}</p>
          <q-input
            dark
            v-model="store.parameters.items[index]"
            :readonly="readonly"
            :disable="disable"
            class="col"
            @change="(event) => changeValue(event, index)"
          />
        </li>
      </ul>
    </div>
  </div>
</template>
