<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { QTableColumn } from 'quasar';
import { first, get, isArray, isEmpty, merge, map } from 'lodash';
import { getListReady2RunWorkflow } from '../../api/appsync/query';

import { useReady2RunParamStore } from '../../stores/run-params-store';

const query = ref(getListReady2RunWorkflow);
const store = useReady2RunParamStore();
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
  variables: {
    workflowType: 'READY2RUN',
  },
});
const fetching = response.fetching;
const getColumns = computed(() => {
  const data = executeQuery();
  return data;
});

const selected = ref();
watch(selected, (current) => {
  store.updateDataState({
    workflowId: current[0].id,
  });
});

const executeQuery = () => {
  if (response.fetching.value) return [];
  const rowData: Array<unknown> = get(
    response,
    'data.value.getListWorkflow',
    []
  );
  const data = map(rowData, (v: any) => {
    const flatData = merge(v, v.metadata);
    return flatData;
  });

  if (isEmpty(data)) return [];

  if (data && isArray(data)) {
    const responseColumns = Object.keys(first(data)).filter((name: string) => {
      if (!(name === '__typename' || name === 'metadata')) return name;
    });
    const columns: Array<QTableColumn> = [];
    responseColumns.forEach((c) => {
      columns.push({
        name: c,
        required: false,
        label: c,
        align: 'left',
        field: c,
        sortable: true,
      });
    });

    return columns;
  }

  return data;
};

const getData = () => {
  if (response.fetching.value) return [];
  const rows: Array<unknown> = get(response, 'data.value.getListWorkflow', []);
  if (!isEmpty(rows)) return rows;
  return [];
};

let tableColumns: any = ref(getColumns);
const tableRows = computed(() => getData());

const onRefresh = async () => {
  await response.executeQuery({
    requestPolicy: 'network-only',
  });
};
</script>

<template>
  <div>
    <q-table
      title="Ready2Run Workflow List"
      title-class="text-h5 text-bold text-grey"
      row-key="name"
      :rows="tableRows"
      :columns="tableColumns"
      :loading="fetching"
      selection="single"
      v-model:selected="selected"
      dark
      color="amber"
    >
      <template v-slot:top-right>
        <q-btn color="primary" @click="onRefresh" icon="refresh" />
        <q-space />
      </template>
    </q-table>
  </div>
</template>
