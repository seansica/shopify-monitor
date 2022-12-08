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
  const rb = new ResponseBuilder()
    .setBase64Encoded(false)
    .setHeader('Content-Type', 'application/json');

  // get the content from the database
  const items = await inventoryTable.getAllItems();

  console.debug(`Received ${items?.length} objects from database`);

  // send the content to discord

  let someFailures = false;
  for (const item of items) {
    if (item.available && item.quantity > 0) {
      console.debug(`Item ${JSON.stringify(item)} is available. Notifying Discord.`);
      try {
        await notifyDiscord(secretArn, item);
        console.debug('Discord notification succeeded');
      } catch (err) {
        // An error occurred while trying to send a message to Discord
        console.error(err);
        someFailures = true;
        // Inform the source know that something went wrong
        rb
          .setStatusCode(500)
          .setBody({
            title: 'Shopify bot failed to notify the Discord server.',
            description: 'An error occurred. Please notify the admin.'
          });
      }
    }
  }
  if (!someFailures) {
    const reply = { title: 'Shopify bot successfully notified the Discord server' };
    const res = rb.setBody(reply).setStatusCode(200).build();
    // Return an HTTP 200 response
    return context.success(res.toJSON());
  }

  // Return an HTTP 500 response
  const res = rb.build();
  context.fail(res.toJSON());
};
