# Shopify Bot

![AWS](https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![DynamoDB](https://img.shields.io/badge/Amazon%20DynamoDB-4053D6?style=for-the-badge&logo=Amazon%20DynamoDB&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

A serverless Shopify Discord monitoring application that you can deploy with the AWS Serverless Application Model (AWS SAM) command line interface (CLI).

![](_docs/shopify-bot-demo.png)

## Overview

![](_docs/shopify-bot-overview.png)

It includes the following files and folders:

- `src` - Code for the application's Lambda function.
- `events` - Invocation events that you can use to invoke the function.
- `__tests__` - Unit tests for the application code.
- `template.yaml` - A template that defines the application's AWS resources.

The application uses several AWS resources, including Lambda functions, an API Gateway API, and Amazon DynamoDB tables. These resources are defined in the `template.prod.yaml` and `template.dev.yaml` files in this project. You can update the templates to add AWS resources through the same deployment process that updates your application code.

If you wish to contribute to this project, please refer to our [Developer Guide](DEVELOPMENT.md) for instructions on how to get started, build, test, and deploy this project.

## Getting Started

Whether you're interested in contributing to the project, or wish to deploy your own instance of the Shopify Bot, you'll find everything you need in the [DEVELOPMENT.md](./DEVELOPMENT.md) file.

The aforementioned developer guide contained detailed instructions covering the following topics:

- Setting up your development environment
- Building the project
- Running the unit tests (Coming Soon&trade;)
- Deploying your own stack
- Cleaning up your environment after you're done

## Visual Tour

After the app has been deployed, here are some screenshots to give you an idea of what is deployed:

Two DynamoDB tables are initialized:
- `ConfigTable` for storing Shopify site URLs (and possibly other things in the future)
- `InventoryTable` for storing items scraped from Shopify targets

![](_docs/shopify-bot-dynamo-tables.png)
![](_docs/shopify-bot-config-table.png)
![](_docs/shopify-bot-inventory-table.png)

Four Lambda functions are deployed:

![](_docs/shopify-bot-functions.png)

One SQS instance is initialized. This is where all Discord messages are queued up:

![](_docs/shopify-bot-sqs-overview.png)

One secret will be initialized for the Discord API key:

![](_docs/shopify-bot-secrets-manager.png)

One EventBridge rule will be created to schedule the `ShopifySyncFunction` to check all of the Shopify targets every 5
minutes:

![](_docs/shopify-bot-eventbridge-rule.png)

And lastly, an API Gateway instance containing one `GET` endpoint and two `POST` endpoints will be initialized.

- `GET {api-root}` : triggers `ShopifySyncFunction` (helpful if you don't want to wait the 5 minutes for the bot the check the Shopify targets)
- `POST {api-root}` : FUTURE RELEASE -- will trigger a general status update to post on Discord
- `POST {api-root}/config?site=` : adds Shopify targets to the `ConfigTable`

![](_docs/shopify-bot-api-gw.png)
