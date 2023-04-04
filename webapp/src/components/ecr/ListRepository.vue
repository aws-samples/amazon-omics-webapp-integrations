<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { QTableColumn } from 'quasar';
import { describeRepositoriesCommand } from '../../api/appsync/query';
import { get, isEmpty, isArray, first } from 'lodash';

const query = ref(describeRepositoriesCommand);
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
});
const fetching = response.fetching;
const getColumns = computed(() => {
  const data = executeQuery();
  return data;
});

const executeQuery = () => {
  if (response.fetching.value) return [];
  const data: Array<unknown> = get(
    response,
    'data.value.describeRepositoriesCommand.repositories',
    []
  );

  if (isEmpty(data)) return [];

  if (data && isArray(data)) {
    const responseColumns = Object.keys(first(data));
    const columns: Array<QTableColumn> = [];
    responseColumns.forEach((c) => {
      if (c !== '__typename')
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
let tableColumns: any = ref(getColumns);
const tableRows = computed(() => {
  if (response.fetching.value) return [];
  const rows: Array<unknown> = get(
    response,
    'data.value.describeRepositoriesCommand.repositories',
    []
  );
  if (!isEmpty(rows)) return rows;
  return [];
});

const onRefresh = async () => {
  await response.executeQuery({
    requestPolicy: 'network-only',
  });
};
</script>

<template>
  <div>
    <q-table
      title="Repository List"
      title-class="text-h5 text-bold text-grey"
      row-key="name"
      :rows="tableRows"
      :columns="tableColumns"
      :loading="fetching"
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
