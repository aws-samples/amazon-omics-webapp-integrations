<script setup lang="ts">
import { ref, computed } from 'vue';
import { getRunCommandId } from '../../api/appsync/query';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { get, isArray, isEmpty, map } from 'lodash';
import RangeBarRunTasks from './RangeBarRunTasks.vue';

const query = ref(getRunCommandId);
const runId = ref(null);
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
});
const listOptions = computed(() => {
  if (response.fetching.value) return [];
  const data: Array<unknown> = get(
    response,
    'data.value.getListRunCommand',
    []
  );

  if (isEmpty(data)) return [];

  if (data && isArray(data)) {
    const list = map(data, 'id');
    return list;
  }

  return [];
});
</script>
<template>
  <div>
    <q-select
      v-model="runId"
      :options="listOptions"
      label="Run ID"
      style="width: 150px"
      color="purple-12"
      class="q-pl-md"
    />
    <RangeBarRunTasks :id="runId" />
  </div>
</template>
