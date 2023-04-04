<script setup lang="ts">
import { Loading, useQuasar } from 'quasar';
import { ref, computed } from 'vue';
import { useQuery, useMutation, UseQueryResponse } from '@urql/vue';
import { useRunParamStore } from '../../stores/run-params-store';
import { getListWorkflowId } from '../../api/appsync/query';
import { startRunCommand } from '../../api/appsync/mutation';
import { get, isArray, isEmpty, map, omit } from 'lodash';
import RunParameter from './RunParameters.vue';

const $q = useQuasar();
const step = ref(1);
const done1 = ref(false);
const done2 = ref(false);
const done3 = ref(false);
const store = useRunParamStore();
const workflowQuery = ref(getListWorkflowId);

const startRunCommandResult = useMutation(startRunCommand);
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query: workflowQuery,
});

const model = ref(null);

const toast = (message: string, color: string) => {
  $q.notify({
    position: 'top',
    message: message,
    color: color,
  });
};

const onReset = () => {
  done2.value = false;
  done3.value = false;
};

const showLoading = async () => {
  Loading.show({
    message: 'Executing run command is in progress. Hang on...',
  });

  const transformedAwsJson: any = JSON.stringify(params.value.items);
  const input = {
    ...basicData.value.items,
    parameters: transformedAwsJson,
  };
  const result = await startRunCommandResult.executeMutation({
    OmicsStartRunCommandInput: input,
  });

  if (result.data.startRunCommand.status !== null) {
    toast('Success', 'green');
    Loading.hide();
    store.updateDataState({});
    store.updateParamsState({});
    done3.value = true;
    onReset();
    done1.value = false;
    step.value = 1;
  } else {
    toast('Error', 'red');
    store.updateDataState({});
    store.updateParamsState({});
    Loading.hide();
    onReset();
    step.value = 2;
  }
};

const runIdList = computed(() => {
  if (response.fetching.value) return [];
  const data: Array<unknown> = get(response, 'data.value.getListWorkflow', []);

  if (isEmpty(data)) return [];

  if (data && isArray(data)) {
    const list = map(data, 'id');
    return list;
  }

  return [];
});

const data = computed(() => {
  const filteredData = omit(store.data, ['id', 'parameters', '__typename']);
  return {
    items: filteredData,
  };
});

const parameters = computed(() => {
  return store.parameters;
});

let basicData = ref(data);
let params = ref(parameters);
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
      <q-step
        :name="1"
        title="Select workflow id"
        icon="settings"
        :done="done1"
      >
        <q-select
          v-model="model"
          :options="runIdList"
          label="Workflow ID"
          style="width: 150px"
          color="purple-12"
          class="q-pl-md"
        />
        <q-stepper-navigation>
          <q-btn
            @click="
              () => {
                done1 = true;
                step = 2;
              }
            "
            color="indigo-12"
            label="Continue"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="2" title="Set parameters" icon="settings" :done="done2">
        <RunParameter :id="model" />
        <q-stepper-navigation>
          <q-btn
            @click="
              () => {
                done2 = true;
                step = 3;
              }
            "
            color="indigo-12"
            label="Continue"
          />
          <q-btn
            @click="
              () => {
                step = 1;
              }
            "
            color="pink"
            label="Back"
            class="q-ml-sm"
          />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="3" title="Confirmation" icon="settings" :done="done3">
        <div class="q-pa-md">
          <p class="text-h4">Basic Run parameters</p>
          <ul>
            <li
              v-for="(data, index) in basicData.items"
              :key="index"
              class="row"
            >
              <p class="col-3 text-h6">{{ index }}</p>
              <p class="text-h6">{{ data }}</p>
            </li>
          </ul>
          <q-separator dark spaced="lg" />
          <p class="text-h4">Advanced Parameters</p>
          <ul>
            <li v-for="(data, index) in params.items" :key="index" class="row">
              <p class="col-3 text-h6">{{ index }}</p>
              <p class="text-h6">{{ data }}</p>
            </li>
          </ul>
        </div>

        <q-stepper-navigation>
          <q-btn color="indigo-12" @click="showLoading" label="Execute" />
          <q-btn @click="step = 2" color="pink" label="Back" class="q-ml-sm" />
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </div>
</template>
