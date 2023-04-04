import { defineStore } from 'pinia';

export const useRunParamStore = defineStore('run-params', {
  state: () => ({
    data: {},
    parameters: {},
  }),

  getters: {
    getDataState(state) {
      return state.data;
    },
    getParamsState(state) {
      return state.parameters;
    },
  },

  actions: {
    updateDataState(props: any) {
      this.data = props;
    },
    updateParamsState(props: any) {
      this.parameters = props;
    },
  },
});

export const useCreateWorkflowParamStore = defineStore('workflow-params', {
  state: () => ({
    data: {
      definitionUri: '',
      description: '',
      engine: '',
      name: '',
      storageCapacity: 1.2,
    },
    parameters: {},
  }),

  getters: {
    getDataState(state) {
      return state.data;
    },
    getParamsState(state) {
      return state.parameters;
    },
  },

  actions: {
    updateDataState(props: any) {
      this.data = props;
    },
    updateParamsState(props: any) {
      this.parameters = props;
    },
  },
});
