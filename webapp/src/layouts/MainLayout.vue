<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '../stores/auth-store';
import NavigationLink from '../components/NavLink.vue';

const drawer = ref(false);
const auth = useAuthStore();
const isAuthenticated = computed(() => auth.isAuthenticated);
const username = computed(() => auth.userName);
const isAdmin = computed(() => auth.isAdmin);

const lists = computed(() => {
  let linksList = [
    {
      title: 'Dashoboard',
      caption: 'Job Status List',
      icon: 'dashboard',
      link: 'dashboard',
    },
    {
      title: 'Repository',
      caption: 'Creae repository in ECR',
      icon: 'calendar_view_week',
      link: 'repository',
    },
    {
      title: 'Workflow',
      caption: 'Create Workflow',
      icon: 'account_tree',
      link: 'workflow',
    },
    {
      title: 'Job',
      caption: 'Job Execution/Status',
      icon: 'play_circle_filled',
      link: 'job',
    },
    // {
    //   title: 'Analytics',
    //   caption: 'Analytics',
    //   icon: 'analytics',
    //   link: 'analytics',
    // },
  ];
  if (isAdmin.value) {
    linksList.push({
      title: 'Users',
      caption: 'User configuration',
      icon: 'person_add',
      link: 'users',
    });
    return linksList;
  }
  return linksList;
});

const linkList = ref(lists);
</script>

<template>
  <q-layout
    view="hHh Lpr lFf"
    style="height: 300px"
    class="shadow-2 rounded-borders"
    v-if="isAuthenticated"
  >
    <q-header elevated>
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" dense round icon="menu" />
        <q-avatar rounded size="60px">
          <img src="logo.png" />
        </q-avatar>
        <q-toolbar-title> Amazon Omics app prototype </q-toolbar-title>
        <div>{{ username }}</div>
        <q-btn icon="logout" :to="{ name: 'signout' }" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="200" :breakpoint="500">
      <q-list class="q-py-sm">
        <!-- <q-item-label header> Genomics on AWS </q-item-label> -->

        <NavigationLink
          v-for="link in linkList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
  <q-layout view="lHh Lpr lFf" v-else>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
