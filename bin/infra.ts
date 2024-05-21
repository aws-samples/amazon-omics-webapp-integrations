#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

import { ApplicationStack } from '../lib/application-stack';
import { deployConfig } from '../config';

const app = new cdk.App();

const path = deployConfig.ssmPath;
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const tags = {
  environment: deployConfig.stage,
  appName: deployConfig.appName,
  stageAlias: deployConfig.alias,
};

class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const application = new ApplicationStack(this, `${id}-application`, {
      adminEmail: deployConfig.adminEmail,
      adminUsername: deployConfig.alias,
      omicsInput: deployConfig.omicsBuckets.input,
      omicsOutput: deployConfig.omicsBuckets.output,
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
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Creating the policy for lambda automatically by CDK',
        },
      ],
      true
    );

    // Store the parameters for webapp in SSM
    new cdk.aws_ssm.StringParameter(this, 'userPoolId', {
      parameterName: `${path}/${deployConfig.userPoolId}`,
      stringValue: application.cognito.userPool.userPoolId,
    });
    new cdk.aws_ssm.StringParameter(this, 'IdentitiyPoolId', {
      parameterName: `${path}/${deployConfig.identityPoolId}`,
      stringValue: application.cognito.identityPool.ref || '',
    });
    new cdk.aws_ssm.StringParameter(this, 'UserPoolClientId', {
      parameterName: `${path}/${deployConfig.userPoolClientId}`,
      stringValue: application.cognito.webappClient.userPoolClientId,
    });
    new cdk.aws_ssm.StringParameter(this, 'GraphQLUrl', {
      parameterName: `${path}/${deployConfig.graphqlUrl}`,
      stringValue: application.graphqlApi.api.graphqlUrl,
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

    new cdk.CfnOutput(this, 'graphql-url', {
      value: application.graphqlApi.api.graphqlUrl,
    });
  }
}

cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: false }));

new InfraStack(
  app,
  `${deployConfig.alias}-${deployConfig.stage}-${deployConfig.appName}-infraStack`,
  {
    env: env,
    tags: tags,
    description: 'InfraStack for AWS HealthOmics integration (uksb-1tupboc60).',
  }
);
