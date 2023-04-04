export interface resolverSet {
  type: string;
  field: string;
  requestTemplate: string;
  responseTemplate?: string;
  templatesBase?: string;
}

export const mutationResolvers: resolverSet[] = [
  {
    field: 'startRunCommand',
    type: 'Mutation',
    requestTemplate: 'startRunCommand.vtl',
  },
  {
    field: 'createWorkflowCommand',
    type: 'Mutation',
    requestTemplate: 'createWorkflowCommand.vtl',
  },
];
