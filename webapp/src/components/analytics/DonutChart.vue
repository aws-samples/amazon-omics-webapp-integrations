<template>
  <div>
    <apexchart
      width="380"
      type="donut"
      :options="options"
      :series="series"
    ></apexchart>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DonutChart',
  setup() {
    return {
      options: {
        title: {
          text: 'Base ratio',
          align: 'left',
          style: {
            fontSize: '18px',
          },
        },
        labels: ['T', 'A', 'C', 'G'],
        tooltip: {
          theme: 'dark',
        },
        dataLabels: {
          enabled: true,
        },
        chart: {
          foreColor: '#ccc',
          toolbar: {
            show: false,
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
      },
      series: [44, 55, 41, 17],
    };
  },
});
</script>
