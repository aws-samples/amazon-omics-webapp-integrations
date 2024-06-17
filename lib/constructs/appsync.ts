import { Construct } from 'constructs';
import { Stack, aws_appsync, aws_cognito, aws_lambda, aws_iam } from 'aws-cdk-lib';

export class AppSync extends Construct {
  public readonly api: aws_appsync.GraphqlApi;
  constructor(
    scope: Construct,
    id: string,
    props: {
      userPool: aws_cognito.UserPool;
      userPoolClient: aws_cognito.UserPoolClient;
      lambdaClient?: aws_lambda.Function[];
      schema: string;
      webACLId?: string;
    }
  ) {
    super(scope, id);

    this.api = new aws_appsync.GraphqlApi(this, 'graphql', {
      name: id,
      definition: aws_appsync.Definition.fromFile(props.schema),
      logConfig: {
        fieldLogLevel: aws_appsync.FieldLogLevel.ERROR,
        role: new aws_iam.Role(this, 'appsync-log-role', {
          assumedBy: new aws_iam.ServicePrincipal('appsync.amazonaws.com'),
          inlinePolicies: {
            logs: new aws_iam.PolicyDocument({
              statements: [
                new aws_iam.PolicyStatement({
                  actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                  resources: [`arn:aws:logs:${Stack.of(this).region}:${Stack.of(this).account}`],
                }),
              ],
            }),
          },
        }),
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: aws_appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.userPool,
            appIdClientRegex: props.userPoolClient.userPoolClientId,
            defaultAction: aws_appsync.UserPoolDefaultAction.ALLOW,
          },
        },
      },
      xrayEnabled: true,
    });

    if (props.lambdaClient) {
      props.lambdaClient.map((lambda) => {
        this.api.grantQuery(lambda);
        this.api.grantMutation(lambda);
        lambda.addEnvironment('GRAPHQL_ENDPOINT', this.api.graphqlUrl);
      });
    }
  }
}
