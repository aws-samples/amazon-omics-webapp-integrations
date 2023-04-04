<template>
  <div>
    <apexchart
      width="500"
      type="bar"
      :options="options"
      :series="series"
    ></apexchart>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'BarChart',
  setup() {
    const maxIndex = 10;
    const randomizeArray = (maxIndex: number, max: number) => {
      const array: number[] = [];
      [...Array(maxIndex).keys()].map(() => {
        const tmpNumber = Math.floor(Math.random() * (max + 1));
        array.push(tmpNumber);
      });
      return array;
    };
    return {
      options: {
        title: {
          text: 'Allele Frequency Spectrum',
          align: 'left',
          style: {
            fontSize: '18px',
          },
        },
        chart: {
          foreColor: '#fff',
          toolbar: {
            show: false,
          },
        },
        xaxis: {
          categories: [...Array(maxIndex).keys()].map((n) => `${n * 10}%`),
        },
        yaxis: {
          decimalsInFloat: 2,
          opposite: true,
          labels: {
            offsetX: -10,
          },
        },
        fill: {
          type: 'gradient',
          gradient: {
            type: 'vertical',
            gradientToColors: ['#F55555', '#6078ea', '#6094ea'],
          },
        },
        tooltip: {
          theme: 'dark',
        },
        dataLabels: {
          enabled: true,
        },
      },
      series: [
        {
          name: 'series-1',
          data: randomizeArray(maxIndex, 100),
        },
      ],
    };
  },
});
</script>
