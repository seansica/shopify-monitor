// discord-notifier-function.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { FunctionProps } from 'aws-cdk-lib/aws-lambda';
import { Construct } from "constructs";
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export function createDiscordNotifierFunction(
    scope: Construct,
    id: string,
    commonLambdaProps: Omit<FunctionProps, 'code' | 'handler'>,
    handler: string,
    inventoryUpdateQueue: sqs.Queue,
    discordApiKey: secretsmanager.Secret)
    : lambda.Function
{
    const discordNotifierFunction = new lambda.Function(scope, id, {
        ...commonLambdaProps,
        code: lambda.Code.fromAsset('dist'),
        handler,
        description: 'Sends a Discord notification when a product is available',
        environment: {
            DISCORD_SECRET_ARN: discordApiKey.secretArn,
            QUEUE_URL: inventoryUpdateQueue.queueUrl,
        },
        initialPolicy: [
            new iam.PolicyStatement({
                actions: ['secretsmanager:GetSecretValue'],
                resources: [discordApiKey.secretArn],
            }),
        ],
    });

    // Add an SQS event source to the discordNotifierFunction. (This means the Lambda function will process one message
    // from the inventoryUpdateQueue at a time).
    discordNotifierFunction.addEventSource(new lambdaEventSources.SqsEventSource(inventoryUpdateQueue, {
        batchSize: 1,
    }));

    return discordNotifierFunction;
}
