<script setup lang="ts">
import ListRunCommand from '../components/job/ListRunCommand.vue';
import ListWorkflow from '../components/job/ListWorkflow.vue';
import StartRun from '../components/job/StartRun.vue';
</script>

<template>
  <q-page padding>
    <div class="q-gutter-sm q-pa-smd">
      <StartRun class="q-pb-md" />
      <ListWorkflow class="q-pb-md" />
      <ListRunCommand />
    </div>
  </q-page>
</template>
