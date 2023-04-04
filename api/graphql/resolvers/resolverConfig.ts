export interface resolverSet {
  type: string;
  field: string;
  requestTemplate: string;
  responseTemplate?: string;
  templatesBase?: string;
}

export const resolvers: resolverSet[] = [
  {
    field: 'getListWorkflow',
    type: 'Query',
    requestTemplate: 'getListWorkflow.vtl',
  },
  {
    field: 'getListRunTasks',
    type: 'Query',
    requestTemplate: 'getListRunTasks.vtl',
  },
  {
    field: 'getListRunCommand',
    type: 'Query',
    requestTemplate: 'getListRunCommand.vtl',
  },
  {
    field: 'getListRunDetails',
    type: 'Query',
    requestTemplate: 'getListRunDetails.vtl',
  },
  {
    field: 'getRunCommand',
    type: 'Query',
    requestTemplate: 'getRunCommand.vtl',
  },
  {
    field: 'getWorkflowCommand',
    type: 'Query',
    requestTemplate: 'getWorkflowCommand.vtl',
  },
];
