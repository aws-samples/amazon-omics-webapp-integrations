<script setup lang="ts">
import { ref, computed } from 'vue';
import { getListRunDetails } from '../../api/appsync/query';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { QTableColumn } from 'quasar';
import { first, get, isArray, isEmpty, omit, pick, filter } from 'lodash';

const loading = ref(false);
const query = ref(getListRunDetails);
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
});

const fetching = response.fetching;
const getColumns = computed(() => {
  if (response.fetching.value) return [];
  const data: Array<unknown> = get(
    response,
    'data.value.getListRunDetails',
    []
  );

  if (isEmpty(data)) return [];
  if (data && isArray(data)) {
    const responseColumns = Object.keys(omit(first(data), ['tasks']));
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

const getTaskColumns = computed(() => {
  if (response.fetching.value) return [];
  const data: Array<unknown> = get(
    response,
    'data.value.getListRunDetails',
    []
  );

  if (isEmpty(data)) return [];
  if (data && isArray(data)) {
    const filterdData = filter(data, (v: any) => {
      if (v.tasks.length !== 0) {
        return v;
      }
    });
    const responseTaskColumns = Object.keys(
      first(get(pick(first(filterdData), ['tasks']), 'tasks'))
    );
    const columns: Array<QTableColumn> = [];
    responseTaskColumns.forEach((c) => {
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
let taskColumns: any = ref(getTaskColumns);

const tableRows = computed(() => {
  if (response.fetching.value) return [];
  const rows: Array<unknown> = get(
    response,
    'data.value.getListRunDetails',
    []
  );
  if (!isEmpty(rows)) return rows;
  return [];
});

const onRefresh = async () => {
  loading.value = true;
  await response.executeQuery({
    requestPolicy: 'network-only',
  });
  loading.value = false;
};
</script>

<template>
  <div>
    <q-table
      title="Run Details"
      title-class="text-h5 text-bold text-grey"
      row-key="name"
      :rows="tableRows"
      :columns="tableColumns"
      :loading="fetching"
      dark
      color="amber"
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width />
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <q-btn
              size="sm"
              color="blue-grey-8"
              round
              dense
              @click="props.expand = !props.expand"
              :icon="props.expand ? 'remove' : 'add'"
            />
          </q-td>
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.value }}
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <q-table
              row-key="name"
              :rows="props.row.tasks"
              :columns="taskColumns"
              :loading="fetching"
              dark
              color="amber"
            />
          </q-td>
        </q-tr>
      </template>
      <template v-slot:top-right>
        <q-btn
          color="primary"
          :disable="loading"
          @click="onRefresh"
          icon="refresh"
        />
        <q-space />
      </template>
    </q-table>
  </div>
</template>
