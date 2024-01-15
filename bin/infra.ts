#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Construct } from 'constructs';

import { ApplicationStack } from '../lib/application-stack';
import { config } from '../utils/utils';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage');
const baseConfg = app.node.tryGetContext('base');
const context = app.node.tryGetContext(stage);
const path = context.ssmPath;

const tags = {
  environment: stage,
  appName: context.appName,
  stageAlias: context.alias,
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

    // Store the parameters for webapp in SSM
    new cdk.aws_ssm.StringParameter(this, 'userPoolId', {
      parameterName: `${path}/${context.userPoolId}`,
      stringValue: application.cognito.userPool.userPoolId,
    });
    new cdk.aws_ssm.StringParameter(this, 'IdentitiyPoolId', {
      parameterName: `${path}/${context.identityPoolId}`,
      stringValue: application.cognito.identityPool.ref || '',
    });
    new cdk.aws_ssm.StringParameter(this, 'UserPoolClientId', {
      parameterName: `${path}/${context.userPoolClientId}`,
      stringValue: application.cognito.webappClient.userPoolClientId,
    });
    new cdk.aws_ssm.StringParameter(this, 'GraphQLUrl', {
      parameterName: `${path}/${context.graphqlUrl}`,
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

new InfraStack(app, `${context.alias}-${stage}-${context.appName}-infraStack`, {
  env: config(baseConfg.deployAwsEnv),
  tags: tags,
});
