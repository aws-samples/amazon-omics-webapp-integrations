<script setup lang="ts">
import DonutChart from '../components/analytics/DonutChart.vue';
import BarChart from '../components/analytics/BarChart.vue';
import LineChart from '../components/analytics/LineChart.vue';
</script>
<template>
  <q-page padding>
    <div class="q-pa-xs">
      <div class="q-gutter-sm row">
        <q-card class="q-pa-xs"><donut-chart /></q-card>
        <q-card class="q-pa-xs"> <bar-chart /> </q-card>
      </div>
      <div class="q-gutter-sm">
        <q-card class="q-pa-xs"> <line-chart /> </q-card>
      </div>
    </div>
  </q-page>
</template>
