<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { getRunTasksTimeStatus } from '../../api/appsync/query';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { get, isEmpty, sortBy, map, filter } from 'lodash';

const props = defineProps(['id']);
let chartOptions = reactive({
  chart: {
    foreColor: '#fff',
    type: 'rangeBar',
    toolbar: {
      show: true,
      autoSelected: 'pan',
      theme: 'dark',
    },
    animations: {
      enabled: true,
    },
  },
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  fill: {
    opacity: 1,
    type: 'solid',
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    type: 'datetime',
  },
  tooltip: {
    theme: 'dark',
  },
  yaxis: {
    labels: {
      show: true,
    },
  },
  // theme: {
  //   mode: 'dark',
  //   palette: 'palette1',
  // },
});
const query = ref(getRunTasksTimeStatus);
const variables = computed(() => {
  const params = { id: props.id };
  return params;
});
let response: UseQueryResponse<unknown, object>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let series: any;

const getData = computed(() => {
  if (props.id === null) return [];
  response = useQuery({
    query,
    variables,
  });
  if (response.fetching.value) return [];
  const result: Array<unknown> = get(
    response,
    'data.value.getListRunTasks',
    []
  );
  if (isEmpty(result)) return [];
  const filterResult = filter(result, { status: 'COMPLETED' });
  const sortedResult = sortBy(filterResult, 'startTime');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = map(sortedResult, (r: any) => {
    const startTime = new Date(
      new Date(r.startTime).toLocaleString()
    ).getTime();
    const endTime = new Date(new Date(r.stopTime).toLocaleString()).getTime();
    return {
      x: r.name,
      y: [startTime, endTime],
    };
  });
  return [
    {
      data: data,
    },
  ];
});

series = ref(getData);
</script>

<template>
  <div>
    <apexchart
      width="100%"
      type="rangeBar"
      :options="chartOptions"
      :series="series"
    ></apexchart>
  </div>
</template>
