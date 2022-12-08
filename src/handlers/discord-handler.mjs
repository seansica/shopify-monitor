import { notifyDiscord } from '../lib/discord.mjs';
import { ResponseBuilder } from '../lib/http.mjs';
import { DynamoTable } from '../lib/database.mjs';

// Get environment variables - set by CloudFormation/SAM

// Need the ARN of the DiscordApi secret in order to send Discord messages
const secretArn = process.env.DISCORD_SECRET_ARN;

// Need the table name of the DynamoDB instance which holds all product/stock data
const inventoryTableName = process.env.INVENTORY_TABLE;
const region = process.env.Region ? process.env.Region : 'us-east-1';

// Initialize database connections
const inventoryTable = new DynamoTable(region, inventoryTableName, 'id');

/**
 * Sends a Discord notification via webhook
 * @param {*} event
 * @param {*} context
 * @returns
 */
export const discordNotificationHandler = async (event, context) => {
  // All log statements are written to CloudWatch
  console.info('Received event:', JSON.stringify(event));

  // Prepare the response
  const responseBuilder = new ResponseBuilder()
    .setBase64Encoded(false)
    .setHeader('Content-Type', 'application/json');

  // get the content from the database
  const items = await inventoryTable.getAllItems();

  console.debug(`Received ${items?.length} objects from database`);

  // send the content to discord
  try {
    for (const item of items) {
      if (item.available) {
        await notifyDiscord(secretArn, item);
        console.debug('Discord notification succeeded');
      }
    }

    // Return an HTTP 200 response
    const res = responseBuilder
      .setStatusCode(200)
      .setBody({
        title: 'Shopify bot successfully notified the Discord server'
      })
      .build();

    return res.toJSON();
  } catch (err) {
    // An error occurred while trying to send a message to Discord
    console.error(err);
    // Inform the source know that something went wrong
    const res = responseBuilder
      .setStatusCode(500)
      .setBody({
        title: 'Shopify bot failed to notify the Discord server.',
        description: err.message ? err.message : 'An unknown error occurred. Please notify the admin.'
      })
      .build();
    return res.toJSON();
  }
};
