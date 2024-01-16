/*
 *  Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
 *  Licensed under the Amazon Software License  http://aws.amazon.com/asl/
 */

import { concat, isEmpty, uniqBy } from 'lodash';

import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

import { Construct } from 'constructs';

export interface WafRule {
  name: string;
  rule: wafv2.CfnWebACL.RuleProperty;
}

export class Waf extends Construct {
  public readonly waf: wafv2.CfnWebACL;
  constructor(
    scope: Construct,
    id: string,
    props: {
      useCloudFront?: boolean;
      webACLResourceArn?: string;
      extraRules?: Array<WafRule>;
      allowedIps: Array<string>;
    }
  ) {
    super(scope, id);

    let ipset = null;
    const distScope = props.useCloudFront ? 'CLOUDFRONT' : 'REGIONAL';

    if (!isEmpty(props.allowedIps)) {
      ipset = new wafv2.CfnIPSet(this, `${id}-ipset`, {
        addresses: props.allowedIps,
        ipAddressVersion: 'IPV4',
        scope: distScope,
        description: 'Webapp allowed IPV4',
        name: `${id}-webapp-ip-list`,
      });
    }

    // AWS WAF
    this.waf = new WAF(this, `${id}-WAFv2`, ipset, distScope, props.extraRules);

    if (!props.useCloudFront && props.webACLResourceArn) {
      // Create an association, not needed for cloudfront
      new WebACLAssociation(this, `${id}-acl-Association`, {
        resourceArn: props.webACLResourceArn,
        webAclArn: this.waf.attrArn,
      });
    }
  }
}

// AWS WAF rules
let wafRules: WafRule[] = [
  // Rate Filter
  {
    name: 'web-rate-filter',
    rule: {
      name: 'web-rate-filter',
      priority: 100,
      statement: {
        rateBasedStatement: {
          limit: 3000,
          aggregateKeyType: 'IP',
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'web-rate-filter',
      },
    },
  },
  // AWS IP Reputation list includes known malicious actors/bots and is regularly updated
  {
    name: 'AWS-AWSManagedRulesAmazonIpReputationList',
    rule: {
      name: 'AWS-AWSManagedRulesAmazonIpReputationList',
      priority: 200,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesAmazonIpReputationList',
        },
      },
      overrideAction: {
        none: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AWSManagedRulesAmazonIpReputationList',
      },
    },
  },
  // Common Rule Set aligns with major portions of OWASP Core Rule Set
  {
    name: 'AWS-AWSManagedRulesCommonRuleSet',
    rule: {
      name: 'AWS-AWSManagedRulesCommonRuleSet',
      priority: 300,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesCommonRuleSet',
          // Excluding generic RFI body rule for sns notifications
          // https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups-list.html
          excludedRules: [
            { name: 'GenericRFI_BODY' },
            { name: 'SizeRestrictions_BODY' },
            { name: 'CrossSiteScripting_BODY' },
          ],
        },
      },
      overrideAction: {
        none: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AWS-AWSManagedRulesCommonRuleSet',
      },
    },
  },
  {
    name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
    rule: {
      name: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
      priority: 400,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
        },
      },
      overrideAction: {
        none: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
      },
    },
  },
  {
    name: 'AWS-AWSManagedRulesSQLiRuleSet',
    rule: {
      name: 'AWS-AWSManagedRulesSQLiRuleSet',
      priority: 500,
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS',
          name: 'AWSManagedRulesSQLiRuleSet',
        },
      },
      overrideAction: {
        none: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AWS-AWSManagedRulesSQLiRuleSet',
      },
    },
  },
];

export class WAF extends wafv2.CfnWebACL {
  constructor(
    scope: Construct,
    id: string,
    ipset: cdk.aws_wafv2.CfnIPSet | null,
    distScope: string,
    extraRules?: Array<WafRule>
  ) {
    if (extraRules && !isEmpty(extraRules)) {
      wafRules = uniqBy(concat(wafRules, extraRules), 'name');
    }
    if (ipset) {
      wafRules.push({
        name: 'custom-web-ipfilter',
        rule: {
          name: 'custom-web-ipfilter',
          priority: 600,
          statement: {
            notStatement: {
              statement: {
                ipSetReferenceStatement: {
                  arn: ipset.attrArn,
                },
              },
            },
          },
          action: {
            block: {
              customResponse: {
                responseCode: 403,
                customResponseBodyKey: 'response',
              },
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'custom-web-ipfilter',
          },
        },
      });
    }
    super(scope, id, {
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: `${id}-metric`,
        sampledRequestsEnabled: false,
      },
      customResponseBodies: {
        response: {
          contentType: 'TEXT_HTML',
          content: '<div> Access denied </div>',
        },
      },
      scope: distScope,
      name: `${id}-waf`,
      rules: wafRules.map((wafRule) => wafRule.rule),
    });
  }
}

export class WebACLAssociation extends wafv2.CfnWebACLAssociation {
  constructor(scope: Construct, id: string, props: wafv2.CfnWebACLAssociationProps) {
    super(scope, id, {
      resourceArn: props.resourceArn,
      webAclArn: props.webAclArn,
    });
  }
}
