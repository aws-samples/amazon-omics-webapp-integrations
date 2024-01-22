<script setup lang="ts">
import { ref, computed } from 'vue';
import { getListRunCommand } from '../../api/appsync/query';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { QTableColumn } from 'quasar';
import { first, get, isArray, isEmpty } from 'lodash';

const query = ref(getListRunCommand);
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
});
const fetching = response.fetching;
const getColumns = computed(() => {
  if (response.fetching.value) return [];
  const data: Array<unknown> = get(
    response,
    'data.value.getListRunCommand',
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
});

let tableColumns: any = ref(getColumns);
const tableRows = computed(() => {
  if (response.fetching.value) return [];
  const rows: Array<unknown> = get(
    response,
    'data.value.getListRunCommand',
    []
  );
  if (!isEmpty(rows)) return rows;
  return [];
});
</script>

<template>
  <div>
    <q-table
      title="RunCommand List"
      row-key="name"
      :rows="tableRows"
      :columns="tableColumns"
      :loading="fetching"
      dark
      color="amber"
    />
  </div>
</template>
