import { NagSuppressions } from 'cdk-nag';

import { RemovalPolicy, aws_certificatemanager, aws_s3, aws_s3_deployment } from 'aws-cdk-lib';
import { Distribution, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Role } from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';

export interface SPADeployConfig {
  readonly indexDoc: string;
  readonly errorDoc?: string;
  readonly websiteFolder: string;
  readonly certificateARN?: string;
  readonly role?: Role;
  readonly webACLId?: string;
  readonly domainNames?: string[];
}
export interface SPAGlobalConfig {
  readonly role?: Role;
}

export interface SPADeployment {
  readonly websiteBucket: aws_s3.Bucket;
}

export interface SPADeploymentWithCloudFront extends SPADeployment {
  readonly distribution: Distribution;
}

export class SPADeploy extends Construct {
  globalConfig: SPAGlobalConfig;

  constructor(scope: Construct, id: string, config?: SPAGlobalConfig) {
    super(scope, id);
    if (typeof config !== 'undefined') {
      this.globalConfig = config;
    }
  }

  /**
   * Return a configured s3 bucket for the distribution
   */
  private getS3Bucket() {
    const bucket = new aws_s3.Bucket(this, 'WebsiteBucket', {
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
    });

    // Nag suppressions
    NagSuppressions.addResourceSuppressions(
      bucket,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'Website app access via cloudfront',
        },
        {
          id: 'AwsSolutions-S10',
          reason: 'Access is via cloudfront',
        },
      ],
      true
    );
    return bucket;
  }

  public createSiteWithCloudfront(config: SPADeployConfig): SPADeploymentWithCloudFront {
    const websiteBucket = this.getS3Bucket();
    const logBucket = new aws_s3.Bucket(this, 'AccessLoggingBucket', {
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });
    const distribution = new Distribution(this, 'cloudfrontDistribution', {
      defaultBehavior: {
        origin: new S3Origin(websiteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: config.indexDoc,
      domainNames: config.domainNames,
      certificate: config.certificateARN
        ? aws_certificatemanager.Certificate.fromCertificateArn(
            this,
            'dist-certificate',
            config.certificateARN
          )
        : undefined,
      enableLogging: true,
      logBucket: logBucket,
      webAclId: config.webACLId,
      errorResponses: [
        {
          httpStatus: 403,
          responsePagePath: config.errorDoc ? `/${config.errorDoc}` : `/${config.indexDoc}`,
          responseHttpStatus: 200,
        },
        {
          httpStatus: 404,
          responsePagePath: config.errorDoc ? `/${config.errorDoc}` : `/${config.indexDoc}`,
          responseHttpStatus: 200,
        },
      ],
    });

    new aws_s3_deployment.BucketDeployment(this, 'BucketDeployment', {
      sources: [aws_s3_deployment.Source.asset(config.websiteFolder)],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/', `/${config.indexDoc}`],
      role: config.role,
    });

    // Nag suppression
    NagSuppressions.addResourceSuppressions(
      distribution,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'Created by Cloudfront',
        },
        {
          id: 'AwsSolutions-S10',
          reason: 'Created by Cloudfront',
        },
        {
          id: 'AwsSolutions-S2',
          reason: 'Created by Cloudfront',
        },
        {
          id: 'AwsSolutions-CFR4',
          reason: 'Can be implemented by providing a certificate enforcing tls1.2',
        },
        {
          id: 'AwsSolutions-CFR1',
          reason: 'No geolocation restrictions are configured',
        },
      ],
      true
    );
    NagSuppressions.addResourceSuppressions(
      logBucket,
      [
        {
          id: 'AwsSolutions-S1',
          reason: 'This bucket is the access log bucket',
        },
      ],
      true
    );

    return { websiteBucket, distribution };
  }
}
