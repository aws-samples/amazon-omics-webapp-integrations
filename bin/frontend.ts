#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';
import { Construct } from 'constructs';
import { SSMClient, GetParametersByPathCommand, Parameter } from '@aws-sdk/client-ssm';
import { fromIni } from '@aws-sdk/credential-providers';
import { find } from 'lodash';

import { WebAppStack } from '../lib/webapp-stack';
import { config } from '../utils/utils';

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
const stage = app.node.tryGetContext('stage');
const baseConfig = app.node.tryGetContext('base');

const context = app.node.tryGetContext(stage);
const tags = {
  environment: stage,
  appName: context.appName,
  stageAlias: context.alias,
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

    new cdk.CfnOutput(this, 'cloudfront domain', {
      value: webapp.distribution.distributionDomainName,
      description: 'The domain of the website',
    });
  }
}

const createFrontend = async () => {
  const params = await getParams(context.ssmPath, baseConfig.awsProfile);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userPoolId: Parameter = find(params, { Name: `${context.ssmPath}/${context.userPoolId}` })!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identityPoolId: Parameter = find(params, {
    Name: `${context.ssmPath}/${context.identityPoolId}`,
  })!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const userPoolClientId: Parameter = find(params, {
    Name: `${context.ssmPath}/${context.userPoolClientId}`,
  })!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unused-vars
  const graphqlUrl: Parameter = find(params, {
    Name: `${context.ssmPath}/${context.graphqlUrl}`,
  })!;

  new FrontendStack(app, `${context.alias}-${stage}-${context.appName}-frontendStack`, {
    allowedIps: context.allowedIps,
    backendRegion: process.env.CDK_DEPLOY_REGION! || process.env.CDK_DEFAULT_REGION!,
    userPoolId: userPoolId.Value!,
    identityPoolId: identityPoolId.Value!,
    userPoolClientId: userPoolClientId.Value!,
    graphqlUrl: graphqlUrl.Value!,
    websiteFolder: './webapp/',
    env: config({ region: 'us-east-1' }), // WAFv2 is available only in us-east-1
    tags: tags,
  });
};

createFrontend();
