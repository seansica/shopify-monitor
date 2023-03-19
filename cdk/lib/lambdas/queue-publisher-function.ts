// queue-publisher-function.ts
import { Construct } from "constructs";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

export function createQueuePublisherFunction(
    scope: Construct, id: string,
    commonLambdaProps: Omit<lambda.FunctionProps, 'code' | 'handler'>,
    handler: string,
    inventoryUpdateQueue: sqs.Queue,
    inventoryTable: dynamodb.Table
)
    : lambda.Function
{
    // Create the QueuePublisherFunction
    const queuePublisherFunction = new lambda.Function(scope, id, {
        ...commonLambdaProps,
        code: lambda.Code.fromAsset('dist'),
        handler,
        description: 'Receives DynamoDB event streams from the InventoryTable and decides whether a Discord message should be sent. If so, then craft notify the SNS Topic. DiscordNotifierFunction subscribes and sends messages from the queue.',
    });

    // Add necessary permissions for the Lambda function to write to the SQS queue
    inventoryUpdateQueue.grantSendMessages(queuePublisherFunction);

    // Add the DynamoDB event source
    const dynamoDBEventSource = new lambdaEventSources.DynamoEventSource(inventoryTable, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 1,
        enabled: true,
    });

    // Add the event source to the QueuePublisherFunction
    queuePublisherFunction.addEventSource(dynamoDBEventSource);

    return queuePublisherFunction;
}
