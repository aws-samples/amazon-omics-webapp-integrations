/*
 *  Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
 *  Licensed under the Amazon Software License  http://aws.amazon.com/asl/
 */

import { Construct } from 'constructs';
import {
  RemovalPolicy,
  StackProps,
  aws_s3_deployment,
  aws_cloudfront,
  aws_s3,
  aws_iam,
  aws_cloudfront_origins,
  aws_certificatemanager,
  DockerImage,
} from 'aws-cdk-lib';
import * as fs from 'fs';
import { NagSuppressions } from 'cdk-nag';
import { execSync } from 'child_process';
export interface WebProps extends StackProps {
  readonly indexDoc: string;
  readonly errorDoc?: string;
  readonly backendRegion: string;
  readonly userPoolId: string;
  readonly identityPoolId: string;
  readonly userPoolClientId: string;
  readonly graphqlUrl: string;
  readonly websiteFolder: string;
  readonly certificateARN?: string;
  readonly role?: aws_iam.Role;
  readonly webACLId?: string;
  readonly domainNames?: string[];
}

export class Web extends Construct {
  public readonly distribution: aws_cloudfront.Distribution;
  constructor(scope: Construct, id: string, props: WebProps) {
    super(scope, id);

    const {
      backendRegion,
      userPoolId,
      identityPoolId,
      userPoolClientId,
      graphqlUrl,
      websiteFolder,
    } = props;

    // Access logs bucket
    const accessLoggingBucket = new aws_s3.Bucket(this, 'OriginAccessLoggingBucket', {
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false,
    });

    // Origin bucket
    const origin = new aws_s3.Bucket(this, 'Origin', {
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      versioned: false,
      serverAccessLogsBucket: accessLoggingBucket,
    });
    const identity = new aws_cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity', {
      comment: 'website-distribution-originAccessIdentity',
    });
    const bucketPolicyStatement = new aws_iam.PolicyStatement({
      actions: ['s3:GetObject'],
      effect: aws_iam.Effect.ALLOW,
      principals: [identity.grantPrincipal],
      resources: [`${origin.bucketArn}/*`],
    });
    origin.addToResourcePolicy(bucketPolicyStatement);

    const bucketOrigin = new aws_cloudfront_origins.S3Origin(origin, {
      originAccessIdentity: identity,
    });

    // Amazon CloudFront
    const cloudFrontWebDistribution = new aws_cloudfront.Distribution(this, 'CloudFront', {
      webAclId: props.webACLId,
      minimumProtocolVersion: aws_cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: new aws_s3.Bucket(this, 'CloudFrontLoggingBucket', {
        blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
        encryption: aws_s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        versioned: false,
        objectOwnership: aws_s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      }),
      defaultBehavior: {
        origin: bucketOrigin,
        allowedMethods: aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: aws_cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: props.indexDoc,
      domainNames: props.domainNames,
      certificate: props.certificateARN
        ? aws_certificatemanager.Certificate.fromCertificateArn(
            this,
            'dist-certificate',
            props.certificateARN
          )
        : undefined,

      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: props.errorDoc ? `/${props.errorDoc}` : `/${props.indexDoc}`,
          responseHttpStatus: 200,
        },
        {
          httpStatus: 404,
          responsePagePath: props.errorDoc ? `/${props.errorDoc}` : `/${props.indexDoc}`,
          responseHttpStatus: 200,
        },
      ],
    });

    this.distribution = cloudFrontWebDistribution;

    const bucketDeploymentRole = new aws_iam.Role(this, 'BucketDeploymentRole', {
      assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    bucketDeploymentRole.addToPrincipalPolicy(
      new aws_iam.PolicyStatement({
        resources: ['*'],
        actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      })
    );

    // Deployment
    const bucketDeployment = new aws_s3_deployment.BucketDeployment(this, 'bucketDeployment', {
      destinationBucket: origin,
      distribution: cloudFrontWebDistribution,
      role: bucketDeploymentRole,
      sources: [
        aws_s3_deployment.Source.asset(websiteFolder, {
          bundling: {
            image: DockerImage.fromRegistry('node:lts'),
            local: {
              tryBundle(outputDir: string) {
                try {
                  execSync('npm --version');
                } catch (error) {
                  return false;
                }
                execSync(
                  `cd ${websiteFolder} && echo "VITE_COGNITO_WEBCLIENTID = ${userPoolClientId}\nVITE_COGNITO_USERPOOLID = ${userPoolId}\nVITE_COGNITO_IDENTITYPOOLID = ${identityPoolId}\nVITE_COGNITO_REGION = ${backendRegion}\nVITE_GRAPHQL_URL = ${graphqlUrl}" > .env && npm i && npm run build`
                );
                fs.cpSync(`${websiteFolder}/dist/spa`, outputDir, {
                  recursive: true,
                });
                return true;
              },
            },
          },
        }),
      ],
      memoryLimit: 512,
    });

    // Suppressions
    NagSuppressions.addResourceSuppressions(
      accessLoggingBucket,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'This bucket is the access log bucket',
        },
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      bucketDeploymentRole,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Given the least privilege to this role based on LambdaExecutionRole',
          appliesTo: ['Resource::*'],
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Automatically created this policy and access to the restricted bucket',
          appliesTo: [
            'Action::s3:GetObject*',
            'Action::s3:List*',
            'Action::s3:GetBucket*',
            'Action::s3:Abort*',
            'Action::s3:DeleteObject*',
          ],
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Automatically created this policy',
          appliesTo: [
            {
              regex: '/^Resource::(.*)$/g',
            },
          ],
        },
      ],
      true
    );
    NagSuppressions.addResourceSuppressions(
      this.distribution.stack,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'CloudfrontLoggingBucket is the access log bucket',
        },
        {
          id: 'AwsSolutions-CFR1',
          reason: 'Disable warning',
        },
        {
          id: 'AwsSolutions-CFR4',
          reason: 'Attached the minimum security policy of TLS_V1_2_2021',
        },
      ],
      true
    );
  }
}
