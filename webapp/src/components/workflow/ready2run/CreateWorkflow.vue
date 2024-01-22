<script setup lang="ts">
import { Loading, useQuasar } from 'quasar';
import { ref } from 'vue';
import { useMutation } from '@urql/vue';
import { useReady2RunParamStore } from '../../../stores/run-params-store';
import { startRunCommand } from '../../../api/appsync/mutation';
import ListReady2Run from '../../job/ListReady2RunWorkflow.vue';
import Ready2RunConfig from '../../job/Ready2RunConfig.vue';
import { set } from 'lodash';

const $q = useQuasar();
const step = ref(1);
const done1 = ref(false);
const done2 = ref(false);
const store = useReady2RunParamStore();
const startRunCommandResult = useMutation(startRunCommand);

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
};

const showLoading = async () => {
  Loading.show({
    message: 'Executing Ready2Run is in progress. Hang on...',
  });
  const transformedAwsJson: any = JSON.stringify(store.parameters);
  const input = {
    ...store.data,
    parameters: transformedAwsJson,
  };
  console.log(input);
  try {
    const result = await startRunCommandResult.executeMutation({
      OmicsStartRunCommandInput: input,
    });
    if (result.data.startRunCommand.status !== null) {
      toast('Success', 'green');
      store.updateDataState({
        outputUri: '',
        runPriority: 100,
        name: '',
      });
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
  } catch (error) {
    toast(error.message, 'red');
    Loading.hide();
    done2.value = true;

    onReset();
  }
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
      <q-step :name="1" title="Select workflow" icon="settings" :done="done1">
        <div>
          <ListReady2Run />
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
            label="Next"
          />
        </q-stepper-navigation>
      </q-step>
      <q-step :name="2" title="Run details" icon="settings" :done="done2">
        <Ready2RunConfig />
        <q-stepper-navigation>
          <q-btn
            @click="
              () => {
                done1 = true;
                step = 3;
              }
            "
            color="indigo-12"
            label="Next"
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
      <q-step :name="3" title="Confirmation" icon="settings" :done="done2">
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
