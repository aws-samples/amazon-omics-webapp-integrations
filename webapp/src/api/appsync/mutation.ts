export const startRunCommand = /* GraphQL */ `
  mutation startRunCommand(
    $OmicsStartRunCommandInput: OmicsStartRunCommandInput!
  ) {
    startRunCommand(input: $OmicsStartRunCommandInput) {
      arn
      id
      status
    }
  }
`;

export const createWorkflowCommand = /* GraphQL */ `
  mutation createWorkflowCommand(
    $OmicsCreateWorkflowCommandInput: OmicsCreateWorkflowCommandInput!
  ) {
    createWorkflowCommand(input: $OmicsCreateWorkflowCommandInput) {
      arn
      id
      status
    }
  }
`;

export const createRepositoryCommand = /* GraphQL */ `
  mutation createRepositoryCommand(
    $CreateRepositoryCommandInput: CreateRepositoryCommandInput!
  ) {
    createRepositoryCommand(input: $CreateRepositoryCommandInput) {
      repository {
        repositoryArn
        repositoryName
        repositoryUri
      }
    }
  }
`;
