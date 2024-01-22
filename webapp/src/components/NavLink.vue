<template>
  <div v-if="!nest">
    <q-item clickable :to="link" v-ripple active-class="menu-link">
      <q-item-section v-if="icon" avatar>
        <q-icon :name="icon" />
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ title }}</q-item-label>
        <q-item-label caption>{{ caption }}</q-item-label>
      </q-item-section>
    </q-item>
  </div>
  <div v-else>
    <q-expansion-item
      :content-inset-level="0.5"
      expand-separator
      icon="account_tree"
      label="Workflow"
    >
      <q-item
        v-for="workflow in nest"
        :key="workflow.title"
        clickable
        :to="workflow.link"
        v-ripple
        active-class="menu-link"
      >
        <q-item-section>
          <q-item-label>{{ workflow.title }}</q-item-label>
          <q-item-label caption>{{ workflow.caption }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-expansion-item>
  </div>
</template>

<style lang="sass">
.menu-link
  color: $light-blue-12
  background: $indigo-10
</style>
<script lang="ts">
import { defineComponent } from 'vue';

type NestProps = {
  title: string;
  caption: string;
  link: string;
  icon: string;
};

export default defineComponent({
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: '',
    },
    link: {
      type: String,
      default: '#',
    },
    icon: {
      type: String,
      default: '',
    },
    nest: {
      type: Array<NestProps>,
    },
  },
});
</script>
