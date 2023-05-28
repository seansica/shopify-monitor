# Developer Guide

## Initial Deployment

To use the AWS SAM CLI, you need the following tools:

* AWS SAM CLI - [Install the AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
* Node.js - [Install Node.js 18](https://nodejs.org/en/), including the npm package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community).

Before you start deploying or developing, please make sure that your AWS SSO is properly configured. You can do this with the `aws configure sso` command.

```bash
aws configure sso
SSO start URL [None]: <SSO_URL>
SSO Region [None]: <AWS_REGION>
```

During the SSO configuration process, a browser window will be opened for you to login and grant permission to the CLI. If it doesn't, you can manually open the displayed URL.

Once you have completed the SSO configuration process, you can start developing or deploying the Shopify Bot.

## Developing

Before you start developing, make sure that you've cleaned the previous build files and built the current files.

```shell
npm run clean
npm run build:dev
```

## Deploying

After you've made your changes, you can build the application again and deploy it.

For a development environment deployment:

```shell
sam deploy --template-file .aws-sam/build/template.yaml --config-file <Path_to_your_config_file> --config-env dev
```

For a production environment deployment:
```shell
npm run clean
npm run build
sam deploy --profile <Your_Profile_Name> --guided --stack-name shopify-bot --region <AWS_REGION> --template-file template.yaml --config-env default
```

The `<Your_Profile_Name>` is the profile name you set when you configured the SSO. `<AWS_REGION>` is the AWS region you want to deploy your app to. `<Path_to_your_config_file>` is the full path to your `samconfig.toml` file.

## Set the Discord API Key

You need to update the Discord API key stored in AWS Secrets Manager. You can do this by running the following command:

```shell
aws secretsmanager \
  --profile <Your_Profile_Name> \
  --region <AWS_REGION> \
  put-secret-value \
  --secret-id DiscordApiKey \
  --secret-string <Your_Discord_API_Key>
```
Replace `<Your_Discord_API_Key>` with your actual Discord API key.

## Add Shopify websites

Now you are ready to start monitoring some Shopify websites! You can do this by sending a `POST` request to the `/config` endpoint of your API with the `site` parameter set to the Shopify website URL:

```shell
curl -X POST <Your_API_URL>/Prod/config?site=<Shopify_Website_URL>
```

Replace `<Your_API_URL>` with the URL of your API and `<Shopify_Website_URL>` with the URL of the Shopify website you want to monitor.

## Deleting the Stack

If you want to delete the stack, you can do so with the `sam delete` command:

```shell
sam delete --profile <Your_Profile_Name> --stack-name <Stack_Name> --region <AWS_REGION>
```
