import { Context, Handler } from 'aws-lambda';
import {
  OmicsClient,
  StartRunCommand,
  CreateWorkflowCommand,
  WorkflowEngine,
} from '@aws-sdk/client-omics';
import { forIn, isEmpty, assign } from 'lodash';

interface StartRunCommandInput {
  logLevel?: string;
  name: string;
  outputUri: string;
  parameters?: ParamObject;
  priority?: string;
  requestId?: string;
  roleArn: string;
  runId?: string;
  storageCapacity?: number;
  workflowId: string;
  workflowType?: string;
}

interface CreateWorkflowCommandInput {
  definitionUri?: string;
  definitionZip?: [number];
  description?: string;
  engine?: WorkflowEngine;
  main?: string;
  parameterTemplate?: ParamObject;
  requestId?: string;
  storageCapacity?: number;
  tags?: string;
}

interface ParamObject {
  [key: string]: string | number;
}

export const handler: Handler = async (event: any, context: Context) => {
  const req = { ...event, ...context };
  const region = process.env.region || '';

  console.log(event);
  const client = new OmicsClient({
    region,
  });

  const startRunCommand = async (input: StartRunCommandInput) => {
    try {
      const filteredInput = {};
      forIn(input, (value: any, i: string) => {
        if (!isEmpty(value)) {
          assign(filteredInput, { [i]: value });
        }
      });
      const response = await client.send(new StartRunCommand(filteredInput));
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  };

  const createWorkflow = async (input: CreateWorkflowCommandInput) => {
    try {
      const filteredInput = {};
      forIn(input, (value: any, i: string) => {
        if (!isEmpty(value)) {
          assign(filteredInput, { [i]: value });
        }
      });
      const response = await client.send(new CreateWorkflowCommand(filteredInput));
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  try {
    switch (event.field) {
      case 'startRunCommand': {
        const input = { ...event.arguments.input, roleArn: process.env.runCommandRoleArn };
        const res = await startRunCommand(input);
        console.log(res);
        return res;
      }
      case 'createWorkflowCommand': {
        const res = await createWorkflow(event.arguments.input);
        console.log(res);
        return res;
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
