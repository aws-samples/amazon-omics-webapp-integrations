#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { DefaultStackSynthesizer } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebAppStack } from '../lib/webapp-stack';
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
    region: 'us-east-1', // WAFv2 is available only in us-east-1
  };
  env.account = baseConfg.deployAwsEnv.accountId || process.env.CDK_DEFAULT_ACCOUNT;
  return env;
};

class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const webapp = new WebAppStack(this, `${id}-webapp`, {
      allowedIps: context.allowedIps,
      websiteFolder: './webapp/dist/spa',
    });

    NagSuppressions.addResourceSuppressionsByPath(
      webapp,
      `/${cdk.Stack.of(this).stackName}/${
        cdk.Stack.of(this).stackName
      }-webapp/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C`,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Bucket deployment controlled by distribution',
        },
        {
          id: 'AwsSolutions-IAM4',
          reason: 'Bucket deployment controlled by distribution',
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
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: false }));

new FrontendStack(app, `${context.alias}-${stage}-${context.appName}-frontendStack`, {
  env: config(baseConfg),
  tags: tags,
  // synthesizer: new DefaultStackSynthesizer({
  //   qualifier: `${context.alias.slice(0, 5)}${stage.slice(0, 5)}`,
  // }),
});
