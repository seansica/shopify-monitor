import * as lambda from 'aws-cdk-lib/aws-lambda';
import {FunctionProps} from 'aws-cdk-lib/aws-lambda';
import {Construct} from "constructs";

export function createConfigFunction(
    scope: Construct,
    id: string,
    commonLambdaProps: Omit<FunctionProps, 'code' | 'handler'>,
    handler: string)
    : lambda.Function
{
    return new lambda.Function(scope, id, {
        ...commonLambdaProps,
        code: lambda.Code.fromAsset('dist'),
        handler,
        description: 'Returns a list of available Shopify sites from the ConfigTable',
    });
}
