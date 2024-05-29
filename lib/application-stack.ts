import { Duration, NestedStack, StackProps, aws_lambda, aws_iam, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';
import * as path from 'path';
import { NodejsLambda } from '../lib/constructs/nodejsLambda';
import { AppSync } from '../lib/constructs/appsync';
import { Cognito } from '../lib/constructs/cognito';
import { addResolver } from '../api/graphql/resolvers/addResolver';
import { resolvers } from '../api/graphql/resolvers/resolverConfig';
import { mutationResolvers } from '../api/graphql/resolvers/resolverMutationConfig';
import { ecrResolvers } from '../api/graphql/resolvers/resolverConfigForECR';

interface ApplicationStackProps extends StackProps {
  multiTenancy: boolean;
  adminEmail: string;
  adminUsername: string;
  omicsInput: string;
  omicsOutput: string;
}

export class ApplicationStack extends NestedStack {
  public readonly graphqlApi: AppSync;
  public readonly cognito: Cognito;
  constructor(scope: Construct, id: string, props: ApplicationStackProps) {
    super(scope, id, props);

    this.cognito = new Cognito(this, `${id}-cognito`, {
      multiTenancy: props.multiTenancy,
      adminEmail: props.adminEmail,
      adminUsername: props.adminUsername,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
    });

    const groupAttachment = this.cognito.attachAdminToAdminGroup('attachAdmintoAdminGroup', {
      groupName: 'admin',
      userPoolId: this.cognito.userPool.userPoolId,
      username: props.adminUsername,
    });
    groupAttachment.node.addDependency(this.cognito);

    // Create Amazon Omics Role for start run execution
    const omicsRole = new aws_iam.Role(this, `${id}-omicsRole`, {
      assumedBy: new aws_iam.ServicePrincipal('omics.amazonaws.com'),
      inlinePolicies: {
        omicsPolicy: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              resources: [
                'arn:aws:s3:::broad-references',
                'arn:aws:s3:::broad-references/*',
                'arn:aws:s3:::gatk-test-data',
                'arn:aws:s3:::gatk-test-data/*',
                'arn:aws:s3:::aws-genomics-datasets',
                'arn:aws:s3:::aws-genomics-datasets/*',
                `arn:aws:s3:::aws-genomics-static-${Stack.of(this).region}`,
                `arn:aws:s3:::aws-genomics-static-${Stack.of(this).region}/*`,
                `arn:aws:s3:::${props.omicsInput}`,
                `arn:aws:s3:::${props.omicsInput}/*`,
              ],
              actions: ['s3:GetObject', 's3:GetBucketLocation', 's3:ListBucket'],
              effect: aws_iam.Effect.ALLOW,
            }),
            new aws_iam.PolicyStatement({
              resources: [
                `arn:aws:s3:::${props.omicsOutput}`,
                `arn:aws:s3:::${props.omicsOutput}/*`,
              ],
              actions: ['s3:GetObject', 's3:GetBucketLocation', 's3:ListBucket', 's3:PutObject'],
              effect: aws_iam.Effect.ALLOW,
            }),

            new aws_iam.PolicyStatement({
              resources: ['*'],
              actions: ['omics:*'],
              effect: aws_iam.Effect.ALLOW,
            }),
            new aws_iam.PolicyStatement({
              resources: [
                `arn:aws:logs:${Stack.of(this).region}:${
                  Stack.of(this).account
                }:log-group:/aws/omics/WorkflowLog:*`,
              ],
              actions: ['logs:CreateLogGroup'],
              effect: aws_iam.Effect.ALLOW,
            }),
            new aws_iam.PolicyStatement({
              resources: [
                `arn:aws:logs:${Stack.of(this).region}:${
                  Stack.of(this).account
                }:log-group:/aws/omics/WorkflowLog:log-stream:*`,
              ],
              actions: ['logs:DescribeLogStreams', 'logs:CreateLogStream', 'logs:PutLogEvents'],
              effect: aws_iam.Effect.ALLOW,
            }),
          ],
        }),
      },
    });

    const mutationOmicsLambdaRole = new aws_iam.Role(this, `${id}-mutationOmicsLambdaRole`, {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    mutationOmicsLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      })
    );
    mutationOmicsLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['omics:StartRun', 'omics:CreateWorkflow', 'omics:TagResource'],
        resources: ['*'],
      })
    );
    mutationOmicsLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [`arn:aws:s3:::${props.omicsInput}`, `arn:aws:s3:::${props.omicsInput}/*`],
      })
    );

    mutationOmicsLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['iam:GetRole', 'iam:PassRole'],
        resources: [omicsRole.roleArn],
      })
    );
    mutationOmicsLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['iam:ListRoles'],
        resources: ['*'],
      })
    );

    const listOmicsJobLambdaRole = new aws_iam.Role(this, `${id}-listOmicsJobLambdaRole`, {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    listOmicsJobLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      })
    );
    listOmicsJobLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: [
          'omics:ListRunTasks',
          'omics:ListRuns',
          'omics:ListWorkflows',
          'omics:GetRun',
          'omics:GetWorkflow',
          'omics:TagResource',
        ],
        resources: ['*'],
      })
    );

    const manipulationEcrLambdaRole = new aws_iam.Role(this, `${id}-munipulationEcrLambdaRole`, {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    manipulationEcrLambdaRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: ['*'],
      })
    );

    let tenantRoleArn: string;

    if (!props.multiTenancy) {
      omicsRole.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          resources: ['*'],
          actions: [
            'ecr:GetAuthorizationToken',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetDownloadUrlForLayer',
            'ecr:GetRepositoryPolicy',
            'ecr:ListImages',
            'ecr:DescribeImages',
            'ecr:BatchGetImage',
          ],
          effect: aws_iam.Effect.ALLOW,
        })
      );
      manipulationEcrLambdaRole.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          actions: ['ecr:CreateRepository', 'ecr:DescribeRepositories'],
          resources: ['*'],
        })
      );
    } else {
      const tenancyRole = new aws_iam.Role(this, `${id}-tenancyRole`, {
        assumedBy: new aws_iam.CompositePrincipal(
          manipulationEcrLambdaRole,
          mutationOmicsLambdaRole
        ),
      });
      tenancyRole.addToPrincipalPolicy(
        new aws_iam.PolicyStatement({
          actions: ['ecr:CreateRepository', 'ecr:DescribeRepositories'],
          resources: ['*'],
        })
      );

      tenantRoleArn = tenancyRole.roleArn;
    }

    const listOmicsJob = new NodejsLambda(this, `${id}-listOmicsJob`, {
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      functionName: `listOmicsJob-${id}`.slice(0, 64),
      entry: path.join(__dirname, '../api/lambda/listOmicsJob/listOmicsJob.ts'),
      depsLockFilePath: path.join(__dirname, '../api/lambda/listOmicsJob/package-lock.json'),
      handler: 'handler',
      timeout: Duration.seconds(12),
      role: listOmicsJobLambdaRole,
      tracing: aws_lambda.Tracing.ACTIVE,
      environment: {
        region: Stack.of(this).region,
      },
      bundling: {
        externalModules: ['aws-sdk'],
        nodeModules: ['@aws-sdk/client-omics', 'lodash'],
      },
    });

    const mutationOmics = new NodejsLambda(this, `${id}-mutationOmics`, {
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      functionName: `mutationOmics-${id}`.slice(0, 64),
      entry: path.join(__dirname, '../api/lambda/mutationOmics/mutationOmics.ts'),
      depsLockFilePath: path.join(__dirname, '../api/lambda/mutationOmics/package-lock.json'),
      handler: 'handler',
      timeout: Duration.seconds(12),
      role: mutationOmicsLambdaRole,
      tracing: aws_lambda.Tracing.ACTIVE,
      environment: {
        region: Stack.of(this).region,
        runCommandRoleArn: omicsRole.roleArn,
      },
      bundling: {
        externalModules: ['aws-sdk'],
        nodeModules: [
          '@aws-sdk/client-omics',
          '@aws-sdk/client-iam',
          '@aws-sdk/client-sts',
          'lodash',
        ],
      },
    });

    const manipulationEcr = new NodejsLambda(this, `${id}-manipulationEcr`, {
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      functionName: `manipulationEcr-${id}`.slice(0, 64),
      entry: path.join(__dirname, '../api/lambda/manipulationEcr/manipulationEcr.ts'),
      depsLockFilePath: path.join(__dirname, '../api/lambda/manipulationEcr/package-lock.json'),
      handler: 'handler',
      timeout: Duration.seconds(12),
      role: manipulationEcrLambdaRole,
      tracing: aws_lambda.Tracing.ACTIVE,
      environment: {
        region: Stack.of(this).region,
        accountId: Stack.of(this).account,
        tenantRoleArn: props.multiTenancy ? tenantRoleArn! : '',
      },
      bundling: {
        externalModules: ['aws-sdk'],
        nodeModules: ['@aws-sdk/client-ecr', '@aws-sdk/client-sts', 'lodash'],
      },
    });

    this.graphqlApi = new AppSync(this, `${id}-api`, {
      schema: path.join(__dirname, '../api/graphql/schema.graphql'),
      userPool: this.cognito.userPool,
      userPoolClient: this.cognito.webappClient,
      lambdaClient: [listOmicsJob.lambda, mutationOmics.lambda, manipulationEcr.lambda],
    });

    const omicsQueryDS = this.graphqlApi.api.addLambdaDataSource(
      'omicsQuery-datasource',
      listOmicsJob.lambda,
      {
        name: 'omicsQuery-datasource',
      }
    );
    addResolver(omicsQueryDS, resolvers);

    const omicsMutationDS = this.graphqlApi.api.addLambdaDataSource(
      'omicsMutation-datasource',
      mutationOmics.lambda,
      {
        name: 'omicsMutation-datasource',
      }
    );
    addResolver(omicsMutationDS, mutationResolvers);

    const ecrManipulationDS = this.graphqlApi.api.addLambdaDataSource(
      'ecrManipulation-datasource',
      manipulationEcr.lambda,
      {
        name: 'ecrManipulation-datasource',
      }
    );
    addResolver(ecrManipulationDS, ecrResolvers);

    // Nag suppressions

    NagSuppressions.addResourceSuppressions(
      this.cognito,
      [
        {
          id: 'AwsSolutions-COG2',
          reason: 'This is a sample and no need MFA',
        },
        {
          id: 'AwsSolutions-COG3',
          reason:
            'This is a sample and avoid unnecessary extra fee. For that reason, no need AdvancedSecurityMode',
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(omicsRole, [
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Given only get and list permission of this bucket',
        appliesTo: [
          `Resource::arn:aws:s3:::${props.omicsInput}/*`,
          `Resource::arn:aws:s3:::aws-genomics-datasets/*`,
          `Resource::arn:aws:s3:::aws-genomics-static-${Stack.of(this).region}/*`,
          `Resource::arn:aws:s3:::broad-references/*`,
          `Resource::arn:aws:s3:::gatk-test-data/*`,
        ],
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Need the permission for outputs with Amazon Omics',
        appliesTo: [`Resource::arn:aws:s3:::${props.omicsOutput}/*`],
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Need the permission for Amazon Omics',
        appliesTo: ['Action::omics:*', 'Resource::*'],
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Given only create log group action foc workflow log',
        appliesTo: [
          `Resource::arn:aws:logs:${Stack.of(this).region}:${
            Stack.of(this).account
          }:log-group:/aws/omics/WorkflowLog:*`,
        ],
      },
      {
        id: 'AwsSolutions-IAM5',
        reason: 'Need workflow log stream',
        appliesTo: [
          `Resource::arn:aws:logs:${Stack.of(this).region}:${
            Stack.of(this).account
          }:log-group:/aws/omics/WorkflowLog:log-stream:*`,
        ],
      },
    ]);

    NagSuppressions.addResourceSuppressions(
      mutationOmicsLambdaRole,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Given only the permission of read to this bucket for mutation',
          appliesTo: [`Resource::arn:aws:s3:::${props.omicsInput}/*`],
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      [mutationOmicsLambdaRole, listOmicsJobLambdaRole, manipulationEcrLambdaRole],
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Need wildcard permissions for CloudWatch Logs, OmicsJobs and ECR',
          appliesTo: ['Resource::*'],
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Appsync add as resolved',
          appliesTo: [
            {
              regex: '/^Resource::arn:aws:appsync:(.*):*$/g',
            },
          ],
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      [omicsQueryDS, omicsMutationDS, ecrManipulationDS],
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'AppSync managed',
        },
      ],
      true
    );
  }
}
