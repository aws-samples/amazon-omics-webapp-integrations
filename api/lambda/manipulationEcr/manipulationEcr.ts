import { Context, Handler } from 'aws-lambda';
import {
  ECRClient,
  CreateRepositoryCommand,
  CreateRepositoryCommandInput,
  DescribeRepositoriesCommand,
  DescribeRepositoriesCommandInput,
  ECRClientConfig,
  DescribeRepositoriesCommandOutput,
  ListTagsForResourceCommand,
  Tag,
  Repository,
} from '@aws-sdk/client-ecr';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';

import { forIn, isEmpty, assign, filter } from 'lodash';

const generatePolicy = (tenantId: string) => {
  const policy = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['ecr:DescribeRepositories', 'ecr:ListImages', 'ecr:ListTagsForResource'],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: ['ecr:CreateRepository', 'ecr:TagResource'],
        Resource: '*',
        Condition: {
          StringEquals: {
            'aws:RequestTag/tenantId': tenantId,
          },
        },
      },
    ],
  });
  return policy;
};

export const handler: Handler = async (event: any, context: Context) => {
  const req = { ...event, ...context };
  const region = process.env.region || '';
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
      const policy = generatePolicy(region);

      const stsCommand = new AssumeRoleCommand({
        // The Amazon Resource Name (ARN) of the role to assume.
        RoleArn: tenantRoleArn,
        // An identifier for the assumed role session.
        RoleSessionName: new Date().getTime().toString(),
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
      let filteredInput = {};
      forIn(input, (value: any, i: string) => {
        if (!isEmpty(value)) {
          assign(filteredInput, { [i]: value });
        }
      });
      if (tenantId) {
        filteredInput = {
          ...filteredInput,
          tags: [
            {
              // Tag
              Key: 'tenantId',
              Value: tenantId,
            },
          ],
        };
      }
      console.log(filteredInput);
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
      const input: DescribeRepositoriesCommandInput = {};
      const allRepos = [];
      let nextToken = undefined;
      do {
        const response: DescribeRepositoriesCommandOutput = await client.send(
          new DescribeRepositoriesCommand({ ...input, nextToken: nextToken })
        );
        allRepos.push(...(response.repositories || []));
        nextToken = response.nextToken;
      } while (nextToken);
      console.log(allRepos);
      if (tenantId) {
        const tenantRepos: any[] = [];
        await Promise.all(
          allRepos.map(async (repo: Repository) => {
            console.log(repo.repositoryArn);
            const command = new ListTagsForResourceCommand({
              resourceArn: repo.repositoryArn,
            });
            const res = await client.send(command);
            if (res.tags?.length) {
              filter(res.tags, (tag: Tag) => {
                if (tag.Value === tenantId) {
                  tenantRepos.push(repo);
                }
              });
            }
          })
        );
        return { repositories: tenantRepos };
      } else {
        return { repositories: allRepos };
      }
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
