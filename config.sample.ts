import { BaseConfig } from './types/type';

/* Base config */
const stage = 'dev';
const baseConfig: BaseConfig = {
  appName: 'omics-app',
  alias: 'japan-hcls',
  awsProfile: 'your_profile',
  adminEmail: 'your_email@acme.com',
  allowedIps: ['192.0.3.0/24'],
  ssmPath: '/omics',
  userPoolId: 'userPoolId',
  identityPoolId: 'identityPoolId',
  userPoolClientId: 'userPoolClientId',
  functionUrl: 'functionUrl',
  graphqlUrl: 'graphqlUrl',
  omicsBuckets: {
    input: 'InputBucketName',
    output: 'outputBucketName',
  },
};

const deployConfig = { ...baseConfig, stage };

export { deployConfig };
