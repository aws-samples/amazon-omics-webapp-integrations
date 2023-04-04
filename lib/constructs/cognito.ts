import { Construct } from 'constructs';
import { RemovalPolicy, Stack, aws_cognito, aws_iam } from 'aws-cdk-lib';
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from 'aws-cdk-lib/custom-resources';

export interface CognitoProps {
  adminEmail: string;
  adminUsername: string;
  passwordPolicy: aws_cognito.PasswordPolicy;
}

export class Cognito extends Construct {
  public readonly userPool: aws_cognito.UserPool;
  public readonly webappClient: aws_cognito.UserPoolClient;
  public readonly identityPool: aws_cognito.CfnIdentityPool;
  public readonly adminGroup: aws_cognito.CfnUserPoolGroup;
  public readonly userGroup: aws_cognito.CfnUserPoolGroup;
  public readonly adminUserRole: aws_iam.Role;
  public readonly userRole: aws_iam.Role;
  constructor(scope: Construct, id: string, props: CognitoProps) {
    super(scope, id);

    const cognitoUserPoolProps: aws_cognito.UserPoolProps = {
      userPoolName: `${id}-app-userpool`,
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: props.passwordPolicy,
      accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: RemovalPolicy.DESTROY,
    };

    this.userPool = new aws_cognito.UserPool(this, 'userpool', cognitoUserPoolProps);

    this.webappClient = this.userPool.addClient('webappClient', {
      authFlows: {
        userSrp: true,
        adminUserPassword: true,
      },
      disableOAuth: true,
      generateSecret: false,
    });

    this.identityPool = new aws_cognito.CfnIdentityPool(this, 'identityPool', {
      allowUnauthenticatedIdentities: false,
      identityPoolName: `${id}-app-identitypool`,
      cognitoIdentityProviders: [
        {
          clientId: this.webappClient.userPoolClientId,
          providerName: this.userPool.userPoolProviderName,
          serverSideTokenCheck: true,
        },
      ],
    });

    this.adminUserRole = this.createAdminRole(`${id}-admin`, []);
    this.adminGroup = new aws_cognito.CfnUserPoolGroup(this, 'adminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'admin',
      roleArn: this.adminUserRole.roleArn,
    });

    this.userRole = this.createBioinformaticianRole(`${id}-bioinformatician`, []);
    this.userGroup = new aws_cognito.CfnUserPoolGroup(this, 'bioinformaticianGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'bioinformatician',
      roleArn: this.userRole.roleArn,
    });

    const statement = new aws_iam.PolicyStatement({
      actions: ['cognito-idp:AdminDeleteUser', 'cognito-idp:AdminCreateUser'],
      resources: [this.userPool.userPoolArn],
    });

    new AwsCustomResource(this, `CreateUser-${id}`, {
      onCreate: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminCreateUser',
        parameters: {
          UserPoolId: this.userPool.userPoolId,
          Username: props.adminUsername,
          UserAttributes: [
            {
              Name: 'email',
              Value: props.adminEmail,
            },
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
        },
        physicalResourceId: PhysicalResourceId.of(`CreateUser-${id}-${props.adminUsername}`),
      },
      onDelete: {
        service: 'CognitoIdentityServiceProvider',
        action: 'adminDeleteUser',
        parameters: {
          UserPoolId: this.userPool.userPoolId,
          Username: props.adminUsername,
        },
      },
      policy: AwsCustomResourcePolicy.fromStatements([statement]),
    });

    new aws_cognito.CfnIdentityPoolRoleAttachment(this, 'identity-pool-role-attachment', {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.adminUserRole.roleArn,
      },
      roleMappings: {
        tokenMapping: {
          type: 'Token',
          ambiguousRoleResolution: 'AuthenticatedRole',
          identityProvider: `cognito-idp.${Stack.of(this).region}.amazonaws.com/${
            this.userPool.userPoolId
          }:${this.webappClient.userPoolClientId}`,
        },
      },
    });
  }

  createAdminRole(id: string, policies: aws_iam.PolicyStatement[]) {
    const adminUserRole = new aws_iam.Role(this, 'adminCognitoRole', {
      roleName: `adminRole-${id}`.slice(0, 64),
      assumedBy: new aws_iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        [`adminRolePolicy-${id}`]: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              actions: [
                'cognito-idp:AdminCreateUser',
                'cognito-idp:AdminAddUserToGroup',
                'cognito-idp:AdminDisableUser',
                'cognito-idp:AdminEnableUser',
                'cognito-idp:AdminDeleteUser',
                'cognito-idp:ListUsers',
                'cognito-idp:ListUsersInGroup',
                'cognito-idp:ListGroups',
                'cognito-idp:GetUser',
                'cognito-idp:GetUserAttributeVerificationCode',
                'cognito-idp:GetUserPoolMfaConfig',
                'cognito-idp:GetGroup',
                'cognito-idp:ChangePassword',
                'cognito-idp:AdminListGroupsForUser',
              ],
              resources: [this.userPool.userPoolArn],
            }),
          ],
        }),
      },
    });
    adminUserRole.assumeRolePolicy?.addStatements(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        principals: [new aws_iam.AccountPrincipal(Stack.of(this).account)],
      })
    );

    policies.forEach((policy) => {
      adminUserRole.addToPolicy(policy);
    });

    return adminUserRole;
  }
  createBioinformaticianRole(id: string, policies: aws_iam.PolicyStatement[]) {
    const userRole = new aws_iam.Role(this, 'bioinformaticianCognitoRole', {
      roleName: `bioinformaticianRole-${id}`.slice(0, 64),
      assumedBy: new aws_iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: {
            'cognito-identity.amazonaws.com:aud': this.identityPool.ref,
          },
          'ForAnyValue:StringLike': {
            'cognito-identity.amazonaws.com:amr': 'authenticated',
          },
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      inlinePolicies: {
        [`bioinformaticianRolePolicy-${id}`]: new aws_iam.PolicyDocument({
          statements: [
            new aws_iam.PolicyStatement({
              actions: [
                'cognito-idp:ListUsers',
                'cognito-idp:ListUsersInGroup',
                'cognito-idp:ListGroups',
                'cognito-idp:GetUser',
                'cognito-idp:GetUserAttributeVerificationCode',
                'cognito-idp:GetUserPoolMfaConfig',
                'cognito-idp:GetGroup',
                'cognito-idp:ChangePassword',
                'cognito-idp:AdminListGroupsForUser',
              ],
              resources: [this.userPool.userPoolArn],
            }),
          ],
        }),
      },
    });
    userRole.assumeRolePolicy?.addStatements(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        principals: [new aws_iam.AccountPrincipal(Stack.of(this).account)],
      })
    );

    policies.forEach((policy) => {
      userRole.addToPolicy(policy);
    });

    return userRole;
  }

  attachAdminToAdminGroup(name: string, props: aws_cognito.CfnUserPoolUserToGroupAttachmentProps) {
    const groupAttachment = new aws_cognito.CfnUserPoolUserToGroupAttachment(this, name, {
      groupName: props.groupName,
      userPoolId: props.userPoolId,
      username: props.username,
    });

    return groupAttachment;
  }
}
