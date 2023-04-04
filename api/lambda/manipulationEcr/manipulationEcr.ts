import { Context, Handler } from 'aws-lambda';
import {
  ECRClient,
  CreateRepositoryCommand,
  DescribeRepositoriesCommand,
} from '@aws-sdk/client-ecr';
import { forIn, isEmpty, assign } from 'lodash';

interface CreateRepositoryCommandInput {
  encryptionConfiguration?: EncryptionConfiguration;
  imageScanningConfiguration?: ImageScanningConfiguration;
  imageTagMutability?: string;
  registryId?: string;
  repositoryName: string;
  // tags?: Tags[];
}

// interface Tags {
//   [key: string]: string | string;
// }

interface EncryptionConfiguration {
  encryptionType: string;
}

interface ImageScanningConfiguration {
  scanOnPush: boolean;
}

export const handler: Handler = async (event: any, context: Context) => {
  const req = { ...event, ...context };
  const region = process.env.region || '';

  console.log(event);
  const client = new ECRClient({
    region,
  });

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
      const response = await client.send(new DescribeRepositoriesCommand({}));
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
