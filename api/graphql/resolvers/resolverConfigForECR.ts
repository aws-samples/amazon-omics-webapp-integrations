export interface resolverSet {
  type: string;
  field: string;
  requestTemplate: string;
  responseTemplate?: string;
  templatesBase?: string;
}

export const ecrResolvers: resolverSet[] = [
  {
    field: 'describeRepositoriesCommand',
    type: 'Query',
    requestTemplate: 'describeRepositoriesCommand.vtl',
  },
  {
    field: 'createRepositoryCommand',
    type: 'Mutation',
    requestTemplate: 'createRepositoryCommand.vtl',
  },
];
