import { Discord, EventTypes } from '../lib/discord.mjs';
// import { ResponseBuilder } from '../lib/http.mjs';
import { DynamoTable } from '../lib/database.mjs';

// Get environment variables - set by CloudFormation/SAM

// Need the ARN of the DiscordApi secret in order to send Discord messages
const secretArn = process.env.DISCORD_SECRET_ARN;

// Initialize Discord
const discord = new Discord(secretArn, 'Keebatron');

// Need the table name of the DynamoDB instance which holds all product/stock data
const inventoryTableName = process.env.INVENTORY_TABLE;
const region = process.env.Region ? process.env.Region : 'us-east-1';

// Initialize database connections
const inventoryTable = new DynamoTable(region, inventoryTableName, 'id');

// Prepare the response
// const rb = new ResponseBuilder()
//   .setBase64Encoded(false)
//   .setHeader('Content-Type', 'application/json');
const response_success = {
  statusCode: 200,
  body: JSON.stringify({
    message: 'ok'
  })
};

const response_error = {
  statusCode: 400,
  body: JSON.stringify({
    message: 'error'
  })
};

/**
 * Sends a Discord notification via webhook
 * @param {*} event
 * @param {*} context
 * @param {*} callback
 * @returns
 */
export const handler = async (event, context, callback) => {
  // All log statements are written to CloudWatch
  console.info('Received event:', JSON.stringify(event));

  if (event.httpMethod && event.httpMethod === 'POST' && event.path === '/') {
    try {
      await checkAllItemsAndNotify();
      callback(undefined, response_success); // TODO <-- fill in the context with a res object
    } catch (err) {
      callback(response_error); // TODO <-- fill in the context with a res object
    }
  } else if (event.Records) {
    for (const record of event.Records) {
      console.log(record.eventID);
      console.log(record.eventName);
      console.log('DynamoDB Record: %j', record.dynamodb);

      // Determine what time of item change event occurred:
      // 1. Item was available but is now sold out
      // 2. Item was sold out but is now available
      // 3. Item inventory quantity changed and is still available
      // 4. Item is new/just posted (when this happens, OldImage will not be present in Record)
      //    4a. Item is new to the bot - ignore
      //    4b. Item is new to bot AND Shopify merchant
      const analyzedEvent = analyzeEvent(record.dynamodb);

      if (analyzedEvent.eventType === EventTypes.False_Positive) {
        console.warn('Skipping item because it already exists and no changes were detected.');
        callback(undefined, response_success);
        continue; // skip to next loop iteration
      }

      // Send a message to Discord
      try {
        await discord.sendMessage(analyzedEvent);
      } catch (err) {
        console.log('Error', err);
        // Do not throw the error. Instead, log it and continue on to the next stream record.
        // Reason: Sometimes Discord will send a red herring. For example, JSON SyntaxErrors
        // can sometimes be triggered by Discord, but Discord will still send the message, so
        // we don't really care.
      }
    // end forEach
    }
  }
  callback(undefined, response_success); // TODO <-- fill in the context with a res object
};

async function checkAllItemsAndNotify () {
  // get the content from the database
  const inventoryItems = await inventoryTable.getAllItems();
  console.debug(`Received ${inventoryItems?.length} objects from database`);

  // send the content to discord
  return await notify(inventoryItems);
}

async function checkItemAndNotify (item) {
  // get the content from the database
  const inventoryItem = await inventoryTable.getOneItem(item.id);
  console.debug(`Received ${inventoryItem?.length} objects from database`);

  // send the content to discord
  return await notify(inventoryItem);
}

async function notify (inventoryItems) {
  for (const item of inventoryItems) {
    if (item.available && item.quantity > 0) {
      console.debug(`Item ${JSON.stringify(item)} is available. Notifying Discord.`);
      try {
        await discord.sendMessage({
          eventType: EventTypes.Status_Update,
          newImage: item
        });
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

function analyzeEvent (dynamodbRecordEvent) {
  /**
   * "NewImage":{
   *     "quantity":{
   *       "N": 0
   *     },
   *     "Id":{
   *       "N":"101"
   *     }
   *   },
   *   "OldImage":{
   *     "quantity":{
   *       "N": 1
   *     },
   *     "Id":{
   *       "N":"101"
   *     }
   *   }
   */

  // All we care about is the NewImage and OldImage so grab them and ignore the rest of the stream event
  // const newAndOldImage = {
  //   OldImage: { ...record.dynamodb.OldImage },
  //   NewImage: { ...record.dynamodb.NewImage }
  // };

  if (!('OldImage' in dynamodbRecordEvent)) {
    return {
      eventType: EventTypes.New_Inventory,
      newImage: dynamodbRecordEvent.NewImage
    };
  }

  if (!('NewImage' in dynamodbRecordEvent)) {
    return {
      eventType: EventTypes.False_Positive,
      oldImage: dynamodbRecordEvent.OldImage
    };
  }

  if (dynamodbRecordEvent.OldImage.quantity.S === 'true' &&
    dynamodbRecordEvent.NewImage.available.S === 'false') {
    return {
      eventType: EventTypes.Available_to_Not_Available,
      newImage: dynamodbRecordEvent.NewImage,
      oldImage: dynamodbRecordEvent.OldImage
    };
  }
  if (dynamodbRecordEvent.OldImage.available.S === 'false' &&
    dynamodbRecordEvent.NewImage.available.S === 'true') {
    return {
      eventType: EventTypes.Not_Available_to_Available,
      newImage: dynamodbRecordEvent.NewImage,
      oldImage: dynamodbRecordEvent.OldImage
    };
  }
  if (dynamodbRecordEvent.OldImage.quantity.S !== dynamodbRecordEvent.NewImage.quantity.S) {
    return {
      eventType: EventTypes.Quantity_Changed,
      newImage: dynamodbRecordEvent.NewImage,
      oldImage: dynamodbRecordEvent.OldImage
    };
  }
  throw new Error('Unable to process images');
}
