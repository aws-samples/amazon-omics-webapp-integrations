export type BaseConfig = {
  appName: string;
  alias: string;
  multiTenancy: boolean;
  awsProfile: string;
  adminEmail: string;
  allowedIps: string[];
  ssmPath: string;
  userPoolId: string;
  identityPoolId: string;
  userPoolClientId: string;
  functionUrl: string;
  graphqlUrl: string;
  omicsBuckets: {
    input: string;
    output: string;
  };
};
