import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

import { createQueuePublisherFunction } from './lambdas/queue-publisher-function';
import { createShopifySyncFunction } from './lambdas/shopify-sync-function';
import { createConfigFunction } from "./lambdas/config-function";
import { createDiscordNotifierFunction } from "./lambdas/discord-notifier-function";

export class ShopifyBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Initialize the DynamoDB ConfigTable. This is where configuration parameters such as which Shopify URLs to track
    // inventory from.
    const configTable = new dynamodb.Table(this, 'ConfigTable', {
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      readCapacity: 2,
      writeCapacity: 2,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // Initialize the DynamoDB InventoryTable. This is where inventory is tracked.
    const inventoryTable = new dynamodb.Table(this, 'InventoryTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      readCapacity: 2,
      writeCapacity: 2,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // Initialize Secrets Manager vault. It will store the Discord webhook key.
    const discordApiKey = new secretsmanager.Secret(this, 'DiscordApiKey', {
      description: 'This is the sensitive hash value that comes after "api/hooks/" in the Discord API key',
      secretName: 'DiscordApiKey',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ 'discord-api-key': 'this-is-not-a-valid-key-please-replace' }),
      },
    });

    // Create the SQS queue where DynamoDB will send inventory updates
    const inventoryUpdateQueue = new sqs.Queue(this, 'InventoryUpdateQueue', {
      fifo: true,
      queueName: 'InventoryUpdateQueue.fifo',
      contentBasedDeduplication: true
    });

    /*** Initialize all Lambda functions below */

    // First, we need to create a Lambda Layer to centralize common configuration parameters.

    const runtimeDependenciesLayer = new lambda.LayerVersion(this, 'RuntimeDependenciesLayer', {
      code: lambda.Code.fromAsset('../app/'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'Runtime dependencies for Lambdas',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    const commonLambdaProps: Omit<lambda.FunctionProps, 'code' | 'handler'> = {
      // `code` and `handler` properties are excluded from the type. Now, when you create each Lambda function, you can
      // spread the commonLambdaProps and include the code and handler properties for each specific function.
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(6),
      layers: [runtimeDependenciesLayer],
      environment: {
        APP_ROOT: `${this.stackName}/app`,
        Region: 'us-east-1',
      },
    };

    // Next, we can start initializing each Lambda function.

    // Create the DiscordNotifierFunction
    const discordNotifierFunction = createDiscordNotifierFunction(
        this,
        'DiscordNotifierFunction',
        commonLambdaProps,
        'handlers/discord-notifier.handler',
        inventoryUpdateQueue,
        discordApiKey
    );

    // Create the ConfigFunction
    const configFunction = createConfigFunction(
        this,
        'ConfigFunction',
        commonLambdaProps,
        'handlers/config.handler'
    );

    // Create the QueuePublisherFunction
    const queuePublisherFunction = createQueuePublisherFunction(
        this,
        'QueuePublisherFunction',
        commonLambdaProps,
        'handlers/queue-publisher.handler',
        inventoryUpdateQueue,
        inventoryTable
    );

    // Create the ShopifySyncFunction
    const shopifySyncFunction = createShopifySyncFunction(
        this,
        'ShopifySyncFunction',
        commonLambdaProps,
        'handlers/shopify-sync.handler',
        configTable,
        inventoryTable
    );

    // Initialize the REST API and map endpoints to Lambda functions.
    const api = new apigateway.RestApi(this, 'ShopifyBotApi', {
      restApiName: 'Shopify Bot Service'
    });

    // Create a resource and method for the ConfigFunction:
    // POST /config --> ConfigFunction
    const configResource = api.root.addResource('config');
    configResource.addMethod('POST', new apigateway.LambdaIntegration(configFunction));

    // Define the value to be output when the stack is created or updated. In our case, we want to show the API
    // Gateway endpoint URL for the Prod stage.
    new cdk.CfnOutput(this, 'WebEndpoint', {
      description: 'API Gateway endpoint URL for Prod stage',
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/Prod/`,
    });


  }
}
