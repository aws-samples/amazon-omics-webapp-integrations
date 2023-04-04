#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { ApplicationStack } from '../lib/application-stack';
import { DefaultStackSynthesizer } from 'aws-cdk-lib';
import { Construct } from 'constructs';

type Env = {
  account: string;
  region: string;
};

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');
const baseConfg = app.node.tryGetContext('base');
const context = app.node.tryGetContext(stage);
const tags = {
  environment: stage,
  appName: context.appName,
  stageAlias: context.alias,
};

export const config = (baseConfg: any) => {
  const env: Env = {
    account: '',
    region: '',
  };
  env.account = baseConfg.deployAwsEnv.accountId || process.env.CDK_DEFAULT_ACCOUNT;
  env.region =
    baseConfg.deployAwsEnv.region || process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION;
  return env;
};

class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const application = new ApplicationStack(this, `${id}-application`, {
      adminEmail: context.appAdminEmail,
      adminUsername: context.alias,
      omicsInput: context.omicsBuckets.input,
      omicsOutput: context.omicsBuckets.output,
    });

    NagSuppressions.addResourceSuppressions(
      application,
      [
        {
          id: 'AwsSolutions-L1',
          reason: 'Use Node18 in all Lambda except for automaically creating lambda',
        },

        {
          id: 'AwsSolutions-IAM4',
          reason:
            'Use no AWSLambdaBasicExecutionRole in all lambda except for automaically creating lambda',
          appliesTo: [
            'Policy::arn:<AWS::Partition>:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ],
        },
      ],
      true
    );

    new cdk.CfnOutput(this, 'cognito_region', {
      value: props?.env?.region as string,
    });

    new cdk.CfnOutput(this, 'user-pool-client-id', {
      value: application.cognito.webappClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'identity-pool-id', {
      value: application.cognito.identityPool.ref || '',
    });

    new cdk.CfnOutput(this, 'user-pool-id', {
      value: application.cognito.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'cognito-url', {
      value: application.cognito.userPool.userPoolProviderUrl,
    });
    new cdk.CfnOutput(this, 'graphql-url', {
      value: application.graphqlApi.api.graphqlUrl,
    });
  }
}

cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: false }));

new InfraStack(app, `${context.alias}-${stage}-${context.appName}-infraStack`, {
  env: config(baseConfg),
  tags: tags,
  // synthesizer: new DefaultStackSynthesizer({
  //   qualifier: `${context.alias.slice(0, 5)}${stage.slice(0, 5)}`,
  // }),
});
