<template>
  <div>
    <apexchart
      height="300"
      type="line"
      :options="options"
      :series="series"
    ></apexchart>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'LineChart',
  setup() {
    const sparklineData = [
      47, 45, 54, 38, 56, 24, 65, 31, 37, 39, 62, 51, 35, 41, 35, 27, 93, 53,
      61, 27, 54, 43, 19, 46,
    ];

    const randomizeArray = (arg: number[]) => {
      const array = arg.slice();
      let currentIndex = array.length;

      while (0 !== currentIndex) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        const temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    };
    return {
      series: [
        {
          name: 'chartarea',
          data: randomizeArray(sparklineData),
        },
      ],
      options: {
        chart: {
          foreColor: '#fff',
          type: 'area',
          brush: {
            target: 'chartarea',
            enabled: true,
          },
          height: 160,
          // sparkline: {
          //   enabled: true,
          // },
          toolbar: {
            show: true,
            autoSelected: 'pan',
            theme: 'dark',
          },
        },
        stroke: {
          curve: 'smooth',
        },
        fill: {
          opacity: 1,
          type: 'solid',
        },
        dataLabels: {
          enabled: false,
        },
        labels: [...Array(24).keys()].map((n) => `${n + 1}`),

        title: {
          text: 'Variant Quality',
          offsetX: 30,
          style: {
            fontSize: '24px',
            cssClass: 'apexcharts-yaxis-title',
          },
        },
        subtitle: {
          text: 'demo',
          offsetX: 30,
          style: {
            fontSize: '14px',
            cssClass: 'apexcharts-yaxis-title',
          },
        },
      },
    };
  },
});
</script>
