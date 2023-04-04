import { Construct } from 'constructs';
import { CfnOutput, aws_lambda_nodejs } from 'aws-cdk-lib';
export class NodejsLambda extends Construct {
  public readonly lambda: aws_lambda_nodejs.NodejsFunction;
  constructor(scope: Construct, id: string, props: aws_lambda_nodejs.NodejsFunctionProps) {
    super(scope, id);

    this.lambda = new aws_lambda_nodejs.NodejsFunction(this, `${id}-nodejslambda`, {
      ...props,
    });

    new CfnOutput(this, `${id}-functionArn`, {
      value: `${this.lambda.functionArn}`,
    });
  }
}
