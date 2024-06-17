import { Context, Handler } from 'aws-lambda';
import {
  OmicsClient,
  StartRunCommand,
  CreateWorkflowCommand,
  StartRunCommandInput,
  CreateWorkflowCommandInput,
  OmicsClientConfig,
} from '@aws-sdk/client-omics';
import {
  GetRoleCommand,
  GetRoleCommandInput,
  IAMClient,
  ListRolesCommand,
  ListRolesCommandInput,
} from '@aws-sdk/client-iam';
import {
  ECRClient,
  ListTagsForResourceCommand,
  DescribeRepositoriesCommand,
  DescribeRepositoriesCommandInput,
  ListTagsForResourceCommandInput,
} from '@aws-sdk/client-ecr';
import { forIn, isEmpty, assign, values, every } from 'lodash';

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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tenantRoleArn = response.Roles![0].Arn;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const roleName = response.Roles![0].RoleName;
    const getRoleInput: GetRoleCommandInput = {
      RoleName: roleName,
    };
    const getRoleCommand = new GetRoleCommand(getRoleInput);
    const getRoleResponse = await iamClient.send(getRoleCommand);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tenantRoleTag = getRoleResponse.Role?.Tags![0].Value;

    return { tenantRoleArn, tenantRoleTag };
  } catch (error) {
    console.log(error);
    return { error };
  }
};

const checkRepositoryPermission = async (
  region: string,
  inputParams: any,
  omicsRoleTag: string
) => {
  const ecrClient = new ECRClient({ region });
  const describeRepoCommandInput: DescribeRepositoriesCommandInput = {
    repositoryNames: [omicsRoleTag],
  };
  const describeRepoCommand = new DescribeRepositoriesCommand(describeRepoCommandInput);
  const describeRepoResponse = await ecrClient.send(describeRepoCommand);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const repositoryArn = describeRepoResponse.repositories![0].repositoryArn;

  const listTagInput: ListTagsForResourceCommandInput = {
    resourceArn: repositoryArn,
  };
  const listTagCommand = new ListTagsForResourceCommand(listTagInput);
  const listTagResponse = await ecrClient.send(listTagCommand);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const tagValue = listTagResponse.tags![0].Value;
  if (tagValue !== omicsRoleTag) {
    return 'AccessDenied: No match tenantId tags between ECR repositotry and Omics Role';
  }
  const paramValues = values(inputParams);
  const imageUri = paramValues
    .map((v: string) => {
      if (v.includes(`dkr.ecr.${region}.amazonaws.com`)) {
        return v;
      }
    })
    .filter((v) => v !== undefined);
  console.log(imageUri);

  if (
    !every(imageUri, (v: string) => {
      const res = v.includes(omicsRoleTag);
      return res;
    })
  ) {
    return 'AccessDenied: No permission of accessing the repository';
  }
  return 'Passed: TanantId tags between ECR repositotry and Omics Role';
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

  let omicsRoleArn: string;
  let omicsRoleTag: string;
  if (tenantId) {
    try {
      const { tenantRoleArn, tenantRoleTag } = await getTenantRole(region, tenantId);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      omicsRoleArn = tenantRoleArn!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      omicsRoleTag = tenantRoleTag!;
    } catch (error) {
      console.log(error);
      return error;
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    omicsRoleArn = process.env.runCommandRoleArn!;
    omicsRoleTag = '';
  }

  const client = new OmicsClient(input);

  const startRunCommand = async (input: StartRunCommandInput) => {
    try {
      const filteredInput = {};
      forIn(input, (value: any, i: string) => {
        if (!isEmpty(value.toString())) {
          assign(filteredInput, { [i]: value });
        }
      });
      console.log(filteredInput);
      console.log(omicsRoleTag);

      const response = await client.send(new StartRunCommand(filteredInput));
      return response;
    } catch (error) {
      console.log('start run command error');
      console.log(error);
      return error;
    }
  };

  const createWorkflow = async (input: CreateWorkflowCommandInput) => {
    try {
      const filteredInput = {};
      forIn(input, (value: any, i: string) => {
        if (!isEmpty(value.toString())) {
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
        console.log('start run');
        let input: StartRunCommandInput = {
          ...event.arguments.input,
          roleArn: omicsRoleArn,
        };
        if (tenantId) {
          input = { ...input, tags: { tenantId: tenantId } };
          const res: string = await checkRepositoryPermission(
            region,
            input.parameters,
            omicsRoleTag
          );
          if (res.includes('AccessDenied')) {
            throw new Error(res);
          }
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
