import { Context, Handler } from 'aws-lambda';
import {
  OmicsClient,
  StartRunCommand,
  CreateWorkflowCommand,
  StartRunCommandInput,
  CreateWorkflowCommandInput,
  OmicsClientConfig,
} from '@aws-sdk/client-omics';
import { IAMClient, ListRolesCommand, ListRolesCommandInput } from '@aws-sdk/client-iam';
import { forIn, isEmpty, assign } from 'lodash';

const getTenantRole = async (region: string, tenantId: string) => {
  const iamClient = new IAMClient({ region });

  const prefix = `/${tenantId}`;
  try {
    const input: ListRolesCommandInput = {
      PathPrefix: prefix,
    };
    const command = new ListRolesCommand(input);
    const response = await iamClient.send(command);
    console.log(response);
    const tenantRoleArn = response.Roles![0].Arn;
    return tenantRoleArn;
  } catch (error) {
    console.log(error);
    return '';
  }
};

export const handler: Handler = async (event: any, context: Context) => {
  const req = { ...event, ...context };
  const region = process.env.region || '';
  console.log(req);

  console.log(event);
  const tenantId = event.identity.claims['custom:tenantId'] || '';
  const input: OmicsClientConfig = {
    region,
  };

  const client = new OmicsClient(input);

  let omicsRoleArn: string;
  if (tenantId) {
    const tenantRoleArn = await getTenantRole(region, tenantId);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    omicsRoleArn = tenantRoleArn!;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    omicsRoleArn = process.env.runCommandRoleArn!;
  }
  console.log('omics role');
  console.log(omicsRoleArn);

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
      console.log(filteredInput);
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
        let input: StartRunCommandInput = {
          ...event.arguments.input,
          roleArn: omicsRoleArn,
        };
        if (tenantId) {
          input = { ...input, tags: { tenantId: tenantId } };
        }
        const res = await startRunCommand(input);
        console.log(res);
        return res;
      }
      case 'createWorkflowCommand': {
        let input: CreateWorkflowCommandInput = {
          ...event.arguments.input,
          requestId: new Date().getTime().toString(),
        };
        if (tenantId) {
          input = { ...input, tags: { tenantId: tenantId } };
        }
        console.log(input);
        const res = await createWorkflow(input);
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
