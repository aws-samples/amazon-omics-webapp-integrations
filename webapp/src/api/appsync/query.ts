export const getListRunCommand = /* GraphQL */ `
  query getListRunCommand {
    getListRunCommand {
      # arn
      creationTime
      id
      name
      # priority
      startTime
      status
      stopTime
      # storageCapacity
      workflowId
    }
  }
`;

export const getRunCommandStatus = /* GraphQL */ `
  query getRunCommandStatus {
    getListRunCommand {
      status
    }
  }
`;
export const getRunCommandId = /* GraphQL */ `
  query getRunCommandId {
    getListRunCommand {
      id
    }
  }
`;

export const getRunCommand = /* GraphQL */ `
  query getRunCommand($id: String!) {
    getRunCommand(id: $id) {
      id
      logLevel
      name
      outputUri
      parameters
      priority
      roleArn
      runId
      storageCapacity
      workflowId
      workflowType
    }
  }
`;
export const getWorkflowCommand = /* GraphQL */ `
  query getWorkflowCommand($id: String!) {
    getWorkflowCommand(id: $id) {
      definition
      description
      engine
      id
      name
      main
      parameterTemplate
      storageCapacity
      status
      type
    }
  }
`;

export const getRunTasksTimeStatus = /* GraphQL */ `
  query getListRunTasks($id: String!) {
    getListRunTasks(id: $id) {
      status
      name
      startTime
      stopTime
    }
  }
`;

export const getListWorkflowId = /* GraphQL */ `
  query getListWorkflowId($workflowType: String!) {
    getListWorkflow(workflowType: $workflowType) {
      id
      name
      status
    }
  }
`;

export const getListReady2RunWorkflow = /* GraphQL */ `
  query getListReady2RunWorkflow {
    getListWorkflow {
      id
      name
      status
    }
  }
`;

export const getListRunTasks = /* GraphQL */ `
  query getListRunTasks($id: String!, $status: String) {
    getListRunTasks(id: $id, status: $status) {
      cpu
      creationTime
      memory
      name
      startTime
      status
      stopTime
      taskId
    }
  }
`;

export const getListRunDetails = /* GraphQL */ `
  query getListRunDetails {
    getListRunDetails {
      tasks {
        name
        status
        cpu
        creationTime
        memory
        startTime
        stopTime
        taskId
      }
      status
      id
      # arn
      creationTime
      name
      # priority
      startTime
      stopTime
      # storageCapacity
    }
  }
`;

export const describeRepositoriesCommand = /* GraphQL */ `
  query describeRepositoriesCommand {
    describeRepositoriesCommand {
      repositories {
        repositoryArn
        repositoryName
        repositoryUri
      }
    }
  }
`;
