import { Context, Handler } from 'aws-lambda';
import {
  ECRClient,
  CreateRepositoryCommand,
  CreateRepositoryCommandInput,
  DescribeRepositoriesCommand,
  ECRClientConfig,
} from '@aws-sdk/client-ecr';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';

import { forIn, isEmpty, assign } from 'lodash';

const generatePolicy = (region: string, accountId: string, tenantId: string) => {
  const policy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['ecr:CreateRepository', 'ecr:DescribeRepositories', 'ecr:ListImages'],
        Resource: [`arn:aws:ecr:${region}:${accountId}:repository/${tenantId}`],
      },
    ],
  });
  return policy;
};

export const handler: Handler = async (event: any, context: Context) => {
  const req = { ...event, ...context };
  const region = process.env.region || '';
  const accountId = process.env.accountId || '';
  const tenantRoleArn = process.env.tenantRoleArn || '';
  console.log(event);

  const stsClient = new STSClient({ region });

  const tenantId = event.identity.claims['custom:tenantId'] || '';
  let credentials: any;
  let input: ECRClientConfig = {
    region,
  };
  if (tenantId) {
    try {
      const policy = generatePolicy(region, accountId, tenantId);

      const stsCommand = new AssumeRoleCommand({
        // The Amazon Resource Name (ARN) of the role to assume.
        RoleArn: tenantRoleArn,
        // An identifier for the assumed role session.
        RoleSessionName: new Date().getTime().toString(),
        // DurationSeconds: 900,
        Policy: policy,
      });
      const response = await stsClient.send(stsCommand);
      credentials = response.Credentials;
      input = {
        ...input,
        credentials: {
          accessKeyId: credentials.AccessKeyId,
          secretAccessKey: credentials.SecretAccessKey,
          sessionToken: credentials.SessionToken,
        },
      };
      console.log(response);
    } catch (error) {
      console.log(error);
    }
  }

  const client = new ECRClient(input);

  const createRepository = async (input: CreateRepositoryCommandInput) => {
    try {
      const filteredInput = {};
      forIn(input, (value: any, i: string) => {
        if (!isEmpty(value)) {
          assign(filteredInput, { [i]: value });
        }
      });
      const response = await client.send(new CreateRepositoryCommand(filteredInput));
      console.log(response);
      return response;
    } catch (error) {
      console.log('error');
      console.log(error);
      return error;
    }
  };

  const describeRepositories = async () => {
    try {
      const response = await client.send(
        new DescribeRepositoriesCommand({
          repositoryNames: tenantId ? [tenantId] : [],
        })
      );
      console.log(response);
      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  };
  try {
    switch (event.field) {
      case 'createRepositoryCommand': {
        const res = await createRepository(event.arguments.input);
        console.log(res.$metadata.httpStatusCode);
        return res;
      }
      case 'describeRepositoriesCommand': {
        const res = await describeRepositories();
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
