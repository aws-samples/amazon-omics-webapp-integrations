import { StackProps, NestedStack, aws_cloudfront } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { has } from 'lodash';

import { Web } from './constructs/web';
import { Waf } from './constructs/waf';

interface WebAppStackProps extends StackProps {
  allowedIps: Array<string>;
  websiteFolder: string;
}

export class WebAppStack extends NestedStack {
  public readonly distribution: aws_cloudfront.Distribution;
  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // WAF
    const webappWaf = new Waf(this, `${id}-cloudfrontWaf`, {
      useCloudFront: true,
      allowedIps: props.allowedIps,
    });

    // SPA Deploy with WAF
    const frontend = new Web(this, `${id}-spa`, {
      indexDoc: 'index.html',
      websiteFolder: props.websiteFolder,
      webACLId: has(webappWaf, 'waf.attrArn') ? webappWaf.waf.attrArn : undefined,
    });

    this.distribution = frontend.distribution;
  }
}
