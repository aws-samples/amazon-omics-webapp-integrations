<script setup lang="ts">
import ListRunDetails from '../components/omics/ListRunDetails.vue';
import ListRunId from '../components/omics/ListRunId.vue';
import RunStatusDonutChart from '../components/omics/RunStatusDonutChart.vue';
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth-store';

import NewPasswordModal from '../components/signin/NewPasswordModal.vue';

const auth = useAuthStore();
const newPasswordRequired = computed(() => auth.newPasswordRequired);
</script>

<template>
  <q-page class="q-pa-md">
    <NewPasswordModal v-if="newPasswordRequired" />
    <div v-else>
      <div class="q-gutter-sm q-pa-sm row">
        <q-card class="q-pa-xs">
          <q-card-section class="text-grey text-h5 text-bold"
            >Run Command Status
          </q-card-section>
          <RunStatusDonutChart />
        </q-card>
      </div>
      <div class="q-gutter-sm q-pa-sm">
        <ListRunDetails />
        <q-card class="q-pa-md">
          <q-card-section class="text-grey text-h5 text-bold"
            >Run Tasks Timeline
          </q-card-section>
          <ListRunId />
        </q-card>
      </div>
    </div>
  </q-page>
</template>
