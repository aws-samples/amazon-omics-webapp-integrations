<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { getRunCommandStatus } from '../../api/appsync/query';
import { useQuery, UseQueryResponse } from '@urql/vue';
import { get, isEmpty, countBy, has } from 'lodash';

let chartOptions = reactive({
  // https://docs.aws.amazon.com/omics/latest/api/API_GetRun.html
  labels: [
    'COMPLETED',
    'STARTING',
    'RUNNING',
    'PENDING',
    'CANCELLED',
    'FAILED',
  ],
  tooltip: {
    theme: 'dark',
  },
  colors: [
    '#0A84FFFF',
    '#FF9F0AFF',
    '#30D158FF',
    '#BF5AF2FF',
    '#5E5CE6FF',
    '#FF453AFF',
  ],
  dataLabels: {
    enabled: true,
  },
  chart: {
    foreColor: '#ccc',
    toolbar: {
      show: false,
    },
    animations: {
      enabled: true,
    },
  },
  legend: {
    position: 'left',
    offsetY: 80,
  },
  grid: {
    borderColor: '#535A6C',
    xaxis: {
      lines: {
        show: true,
      },
    },
  },
  stroke: {
    width: 2,
    lineCap: 'round',
  },
});
const query = ref(getRunCommandStatus);
let response: UseQueryResponse<unknown, object>;
response = useQuery({
  query,
});

const sampleData = {
  COMPLETED: 4,
  STARTING: 1,
  RUNNING: 2,
  PENDING: 5,
  STOPPING: 6,
  CANCELLED: 1,
  FAILED: 2,
};
const getSeries = computed(() => {
  const result = getStatusCount();
  const data = updateSeries(result);
  return data;
});
let series = ref(getSeries);

const updateSeries = (data: any) => {
  let res = [];
  has(data, 'COMPLETED') ? res.push(get(data, 'COMPLETED')) : res.push(0);
  has(data, 'STARTING') ? res.push(get(data, 'STARTING')) : res.push(0);
  has(data, 'RUNNING') ? res.push(get(data, 'RUNNING')) : res.push(0);
  has(data, 'PENDING') ? res.push(get(data, 'PENDING')) : res.push(0);
  has(data, 'CANCELLED') ? res.push(get(data, 'CANCELLED')) : res.push(0);
  has(data, 'FAILED') ? res.push(get(data, 'FAILED')) : res.push(0);
  return res;
};
const getStatusCount = () => {
  if (response.fetching.value) return sampleData;
  const result = get(response, 'data.value.getListRunCommand', []);
  if (isEmpty(result)) return [];
  let statusArray: string[] = [];
  result.map((data: any) => {
    const status = get(data, 'status');
    statusArray.push(status);
  });
  if (isEmpty(statusArray)) return [];
  const sumStatus = countBy(statusArray);
  return sumStatus;
};
</script>

<template>
  <div>
    <apexchart
      width="450"
      type="donut"
      :options="chartOptions"
      :series="series"
    ></apexchart>
  </div>
</template>
