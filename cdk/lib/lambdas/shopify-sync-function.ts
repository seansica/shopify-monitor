// shopify-sync-function.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from "constructs";

export function createShopifySyncFunction(
    scope: Construct, id: string,
    commonLambdaProps: Omit<lambda.FunctionProps, 'code' | 'handler'>,
    handler: string, configTable: dynamodb.Table,
    inventoryTable: dynamodb.Table)
    : lambda.Function
{
    // Create the ShopifySyncFunction
    const shopifySyncFunction = new lambda.Function(scope, id, {
        ...commonLambdaProps,
        code: lambda.Code.fromAsset('dist'),
        handler,
        timeout: cdk.Duration.seconds(15),
        description: 'Scans Shopify sites and writes updates to a DynamoDB table',
    });

    // Grant necessary permissions to the InventoryTable and ConfigTable
    inventoryTable.grantReadWriteData(shopifySyncFunction);
    configTable.grantReadWriteData(shopifySyncFunction);

    // Add environment variables
    shopifySyncFunction.addEnvironment('CONFIG_TABLE', configTable.tableName);
    shopifySyncFunction.addEnvironment('INVENTORY_TABLE', inventoryTable.tableName);

    // Create a Rule for the scheduled event
    // @ts-ignore
    const scheduleRule = new events.Rule(scope, 'ShopifySyncSchedule', {
        schedule: events.Schedule.rate(cdk.Duration.minutes(5)),
        targets: [
            new eventsTargets.LambdaFunction(shopifySyncFunction, {
                maxEventAge: cdk.Duration.hours(24),
                retryAttempts: 185,
            }),
        ],
    });

    return shopifySyncFunction;
}
