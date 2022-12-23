import { Discord } from '../lib/discord.mjs';
import { ResponseSuccess, ResponseError } from '../lib/http.mjs';
import { APIGatewayProxyCallback, Context, SNSEvent } from "aws-lambda";

// Get environment variables - set by CloudFormation/SAM

// Need the ARN of the DiscordApi secret in order to send Discord messages
const secretArn = process.env.DISCORD_SECRET_ARN;

// Initialize Discord
if (!secretArn) {
  throw new Error('DISCORD_SECRET_ARN is undefined');
}
const discord = new Discord(secretArn, 'Keebatron');

// Need the table name of the DynamoDB instance which holds all product/stock data
// const inventoryTableName = process.env.INVENTORY_TABLE;
// const region = process.env.Region ? process.env.Region : 'us-east-1';

// Initialize database connections
// const inventoryTable = new DynamoTable(region, inventoryTableName, 'id');


/**
 * Sends a Discord notification via webhook
 * @param {*} event
 * @param {*} context
 * @param {*} callback
 * @returns
 */
export const handler = async (event: SNSEvent, context: Context, callback: APIGatewayProxyCallback) => {
  // All log statements are written to CloudWatch
  console.info('Received event:', JSON.stringify(event));

  for (const record of event.Records) {

    // Send a message to Discord
    try {
      await discord.sendMessage(record.Sns.Message);
    } catch (err) {
      console.log('Error', err);
      callback(new ResponseError());
    }
    // end forEach
  }
  callback(undefined, new ResponseSuccess());
};
