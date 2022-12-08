import { Discord } from '../lib/discord-helper.mjs';
import { ResponseBuilder } from '../lib/http-helper.mjs';
import { DynamoTable } from '../lib/database-helper.mjs';

// Get environment variables - set by CloudFormation/SAM

// Need the ARN of the DiscordApi secret in order to send Discord messages
const secretArn = process.env.DISCORD_SECRET_ARN;

// Initialize Discord 
const discord = new Discord(secretArn, "Keebatron");

// Need the table name of the DynamoDB instance which holds all product/stock data
const inventoryTableName = process.env.INVENTORY_TABLE;
const region = process.env.Region ? process.env.Region : 'us-east-1';

// Initialize database connections
const inventoryTable = new DynamoTable(region, inventoryTableName, 'id');

// Prepare the response
const rb = new ResponseBuilder()
  .setBase64Encoded(false)
  .setHeader('Content-Type', 'application/json');

/**
 * Sends a Discord notification via webhook
 * @param {*} event
 * @param {*} context
 * @returns
 */
export const handler = async (event, context) => {
  // All log statements are written to CloudWatch
  console.info('Received event:', JSON.stringify(event));

  if (event.checkAll) {
    try {
      await checkAllItemsAndNotify();
    } catch (err) {
      context.fail(); // TODO <-- fill in the context with a res object 
    }
  }

  else if (event.checkOne) {
    try {
      await checkItemAndNotify(event.checkOne.id);
    } catch (err) {
      context.fail(); // TODO <-- fill in the context with a res object 
    }
  }

  context.succeed(); // TODO <-- fill in the context with a res object 
};

async function checkAllItemsAndNotify() {

  // get the content from the database
  const inventoryItems = await inventoryTable.getAllItems();
  console.debug(`Received ${inventoryItems?.length} objects from database`);

  // send the content to discord
  return await notify(inventoryItems);
}

async function checkItemAndNotify(item) {

  // get the content from the database
  const inventoryItem = await inventoryTable.getOneItem(item.id);
  console.debug(`Received ${inventoryItem?.length} objects from database`);

  // send the content to discord
  return await notify(inventoryItem);
}

async function notify(inventoryItems) {
  for (const item of inventoryItems) {
    if (item.available && item.quantity > 0) {
      console.debug(`Item ${JSON.stringify(item)} is available. Notifying Discord.`);
      try {
        await discord.sendMessage(item);
        console.debug('Discord notification sent.');
      } catch (err) {
        // An error occurred while trying to send a message to Discord
        console.error(err);
        // Inform the source know that something went wrong
        // throw err; // TODO <-- decide whether to throw or keep trying
      }
    }
  }
  // Discord notify job completed successfully
}