import { Context, Handler } from 'aws-lambda';
import {
  OmicsClient,
  ListWorkflowsCommand,
  ListRunsCommand,
  ListRunTasksCommand,
  GetRunCommand,
  GetWorkflowCommand,
} from '@aws-sdk/client-omics';
import { find } from 'lodash';

interface ListRunTasksOutput {
  name: string;
  id: string;
  arn: string;
  creationTime: Date;
  priority: string;
  workflowId: string;
  storageCapacity: string;
  startTime: Date;
  stopTime: Date;
  status: string;
  tasks: [];
}
export const handler: Handler = async (event: any, context: Context) => {
  const req = { ...event, ...context };
  const region = process.env.region || '';

  const client = new OmicsClient({
    region,
  });
  const listWorkflow = async () => {
    try {
      const response = await client.send(new ListWorkflowsCommand({}));
      return response.items;
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  const listRunCommand = async () => {
    try {
      const response = await client.send(new ListRunsCommand({}));
      return response.items;
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  const listRunTasksCommand = async (id: string) => {
    try {
      const response = await client.send(
        new ListRunTasksCommand({
          id,
        })
      );
      return response.items;
    } catch (error) {
      console.log(error);
    }
  };
  const getRunCommand = async (id: string) => {
    try {
      const response = await client.send(
        new GetRunCommand({
          id,
        })
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  };
  const getWorkflowCommand = async (id: string) => {
    try {
      const response = await client.send(
        new GetWorkflowCommand({
          id,
        })
      );
      return response;
    } catch (error) {
      console.log(error);
    }
  };
  try {
    switch (event.field) {
      case 'getListWorkflow': {
        const workflow = await listWorkflow();
        console.log(workflow);
        return workflow;
      }

      case 'getListRunTasks': {
        const runTasks = await listRunTasksCommand(event.arguments.id);
        console.log(runTasks);
        return runTasks;
      }

      case 'getRunCommand': {
        const runCommandOutputs = await getRunCommand(event.arguments.id);
        console.log(runCommandOutputs);
        return runCommandOutputs;
      }

      case 'getWorkflowCommand': {
        const getWorkflowCommandOutputs = await getWorkflowCommand(event.arguments.id);
        console.log(getWorkflowCommandOutputs);
        return getWorkflowCommandOutputs;
      }
      case 'getListRunCommand': {
        const runCommandList = await listRunCommand();
        console.log(runCommandList);
        return runCommandList;
      }
      case 'getListRunDetails': {
        const result: ListRunTasksOutput[] = [];
        const runCommand: [] = await listRunCommand();
        await Promise.all(
          runCommand.map(async (res: any) => {
            const runTasks = await listRunTasksCommand(res.id);
            const temp: any = find(runCommand, ['id', res.id]);
            if (temp) {
              temp['tasks'] = runTasks;
              result.push(temp);
            }
          })
        );
        console.log(result);
        return result;
      }
      default:
        return `Unknown field, unable to resolve ${event.field}`;
    }
  } catch (error: any) {
    console.error(error);
    if (error && error.message)
      return {
        statusCode: 403,
        body: JSON.stringify(error.message),
      };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(req),
  };
};
