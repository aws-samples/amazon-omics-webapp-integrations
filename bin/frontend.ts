#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';
import { SSMClient, GetParametersByPathCommand, Parameter } from '@aws-sdk/client-ssm';
import { fromIni } from '@aws-sdk/credential-providers';
import { find } from 'lodash';

import { WebAppStack } from '../lib/webapp-stack';
import { deployConfig } from '../config';

interface FrontendStackProps extends cdk.StackProps {
  allowedIps: string[];
  backendRegion: string;
  userPoolId: string;
  identityPoolId: string;
  userPoolClientId: string;
  graphqlUrl: string;
  websiteFolder: string;
}

export const getParams = async (path: string, awsProfile: string): Promise<Parameter[]> => {
  const client = new SSMClient({
    credentials: fromIni({ profile: awsProfile }),
    region: process.env.CDK_DEFAULT_REGION,
  });
  const input = {
    Path: path,
  };
  const command = new GetParametersByPathCommand(input);
  const response = await client.send(command);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return response.Parameters!;
};

const app = new cdk.App();
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
const tags = {
  environment: deployConfig.stage,
  appName: deployConfig.appName,
  stageAlias: deployConfig.alias,
};
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: false }));

class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const {
      allowedIps,
      backendRegion,
      userPoolId,
      identityPoolId,
      userPoolClientId,
      graphqlUrl,
      websiteFolder,
    } = props;

    const webapp = new WebAppStack(this, `${id}-webapp`, {
      allowedIps: allowedIps,
      backendRegion: backendRegion,
      userPoolId: userPoolId,
      identityPoolId: identityPoolId,
      userPoolClientId: userPoolClientId,
      graphqlUrl: graphqlUrl,
      websiteFolder: websiteFolder,
    });

    NagSuppressions.addResourceSuppressions(
      webapp,
      [
        {
          id: 'AwsSolutions-L1',
          reason: 'Use Node18 in all Lambda except for automaically creating lambda',
        },
      ],
      true
    );

    new cdk.CfnOutput(this, 'cloudfront domain', {
      value: webapp.distribution.distributionDomainName,
      description: 'The domain of the website',
    });
  }
}

const createFrontend = async () => {
  const params = await getParams(deployConfig.ssmPath, deployConfig.awsProfile);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userPoolId: Parameter = find(params, {
    Name: `${deployConfig.ssmPath}/${deployConfig.userPoolId}`,
  })!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identityPoolId: Parameter = find(params, {
    Name: `${deployConfig.ssmPath}/${deployConfig.identityPoolId}`,
  })!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userPoolClientId: Parameter = find(params, {
    Name: `${deployConfig.ssmPath}/${deployConfig.userPoolClientId}`,
  })!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars
  const graphqlUrl: Parameter = find(params, {
    Name: `${deployConfig.ssmPath}/${deployConfig.graphqlUrl}`,
  })!;

  new FrontendStack(
    app,
    `${deployConfig.alias}-${deployConfig.stage}-${deployConfig.appName}-frontendStack`,
    {
      allowedIps: deployConfig.allowedIps,
      backendRegion: env.region!,
      userPoolId: userPoolId.Value!,
      identityPoolId: identityPoolId.Value!,
      userPoolClientId: userPoolClientId.Value!,
      graphqlUrl: graphqlUrl.Value!,
      websiteFolder: './webapp/',
      env: { ...env, region: 'us-east-1' }, // WAFv2 is available only in us-east-1
      tags: tags,
      description: 'FrontendStack for AWS HealthOmics integration (uksb-1tupboc60).',
    }
  );
};

createFrontend();
