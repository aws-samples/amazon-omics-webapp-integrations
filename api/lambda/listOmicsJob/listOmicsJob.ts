import { Context, Handler } from 'aws-lambda';
import {
  OmicsClient,
  ListWorkflowsCommand,
  WorkflowListItem,
  ListRunsCommand,
  ListRunTasksCommand,
  GetRunCommand,
  GetWorkflowCommand,
  ListRunTasksCommandOutput,
  ListTagsForResourceCommand,
  WorkflowType,
  RunListItem,
} from '@aws-sdk/client-omics';
import { find } from 'lodash';

export const handler: Handler = async (event: any, context: Context) => {
  const req = { ...event, ...context };
  const region = process.env.region || '';

  console.log(event);
  const tenantId = event.identity.claims['custom:tenantId'] || '';
  console.log(tenantId);

  const client = new OmicsClient({
    region,
  });
  const listWorkflow = async (workflowType: WorkflowType) => {
    let nextToken = undefined;
    const items = [];
    try {
      do {
        const response = await client.send(
          new ListWorkflowsCommand({
            type: workflowType,
          })
        );
        items.push(...(response.items || []));
        nextToken = response.nextToken;
      } while (nextToken);

      if (tenantId) {
        const workflowsByTenantId: any[] = [];
        await Promise.all(
          items.map(async (workflow: WorkflowListItem) => {
            const command = new ListTagsForResourceCommand({
              resourceArn: workflow.arn,
            });
            const res = await client.send(command);
            if (res.tags!.tenantId === tenantId) {
              workflowsByTenantId.push(workflow);
            }
          })
        );
        console.log(workflowsByTenantId);
        return workflowsByTenantId;
      } else {
        return items;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  const listRunCommand = async () => {
    let nextToken = undefined;
    const items = [];
    try {
      do {
        const response = await client.send(new ListRunsCommand({}));
        items.push(...(response.items || []));
        nextToken = response.nextToken;
      } while (nextToken);

      if (tenantId) {
        const runsByTenantId: any[] = [];
        await Promise.all(
          items.map(async (run: RunListItem) => {
            console.log(run.arn);
            const command = new ListTagsForResourceCommand({
              resourceArn: run.arn,
            });
            const res = await client.send(command);
            if (res.tags!.tenantId === tenantId) {
              runsByTenantId.push(run);
            }
          })
        );
        console.log(runsByTenantId);
        return runsByTenantId;
      } else {
        return items;
      }
    } catch (error) {
      console.error(error);
      return error;
    }
  };

  const listRunTasksCommand = async (id: string) => {
    let nextToken = undefined;
    const items = [];
    try {
      do {
        const response = await client.send(
          new ListRunTasksCommand({
            id,
          })
        );
        items.push(...(response.items || []));
        nextToken = response.nextToken;
      } while (nextToken);

      return items;
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
  const getWorkflowCommand = async (id: string, workflowType: string) => {
    try {
      const response = await client.send(
        new GetWorkflowCommand({
          id,
          type: workflowType,
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
        const workflow = await listWorkflow(event.arguments.workflowType);
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
        const getWorkflowCommandOutputs = await getWorkflowCommand(
          event.arguments.id,
          event.arguments.workflowType
        );
        console.log(getWorkflowCommandOutputs);
        return getWorkflowCommandOutputs;
      }
      case 'getListRunCommand': {
        const runCommandList = await listRunCommand();
        console.log(runCommandList);
        return runCommandList;
      }
      case 'getListRunDetails': {
        const result: ListRunTasksCommandOutput[] = [];
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
