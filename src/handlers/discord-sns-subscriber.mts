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

// async function checkAllItemsAndNotify () {
//   // get the content from the database
//   const inventoryItems = await inventoryTable.getAllItems();
//   console.debug(`Received ${inventoryItems?.length} objects from database`);
//
//   // send the content to discord
//   return await notify(inventoryItems);
// }
//
// async function checkItemAndNotify (item) {
//   // get the content from the database
//   const inventoryItem = await inventoryTable.getOneItem(item.id);
//   console.debug(`Received ${inventoryItem?.length} objects from database`);
//
//   // send the content to discord
//   return await notify(inventoryItem);
// }
//
// async function notify (inventoryItems) {
//   for (const item of inventoryItems) {
//     if (item.available && item.quantity > 0) {
//       console.debug(`Item ${JSON.stringify(item)} is available. Notifying Discord.`);
//       try {
//         await discord.sendMessage({
//           eventType: EventTypes.Status_Update,
//           newImage: item
//         });
//         console.debug('Discord notification sent.');
//       } catch (err) {
//         // An error occurred while trying to send a message to Discord
//         console.error(err);
//         // Inform the source know that something went wrong
//         // throw err; // TODO <-- decide whether to throw or keep trying
//       }
//     }
//   }
//   // Discord notify job completed successfully
// }
//
// function analyzeEvent (dynamodbRecordEvent) {
//   /**
//    * "NewImage":{
//    *     "quantity":{
//    *       "N": 0
//    *     },
//    *     "Id":{
//    *       "N":"101"
//    *     }
//    *   },
//    *   "OldImage":{
//    *     "quantity":{
//    *       "N": 1
//    *     },
//    *     "Id":{
//    *       "N":"101"
//    *     }
//    *   }
//    */
//
//   // All we care about is the NewImage and OldImage so grab them and ignore the rest of the stream event
//   // const newAndOldImage = {
//   //   OldImage: { ...record.dynamodb.OldImage },
//   //   NewImage: { ...record.dynamodb.NewImage }
//   // };
//
//   if (!('OldImage' in dynamodbRecordEvent)) {
//     return {
//       eventType: EventTypes.New_Inventory,
//       newImage: dynamodbRecordEvent.NewImage
//     };
//   }
//
//   if (!('NewImage' in dynamodbRecordEvent)) {
//     return {
//       eventType: EventTypes.False_Positive,
//       oldImage: dynamodbRecordEvent.OldImage
//     };
//   }
//
//   if (dynamodbRecordEvent.OldImage.quantity.S === 'true' &&
//     dynamodbRecordEvent.NewImage.available.S === 'false') {
//     return {
//       eventType: EventTypes.Available_to_Not_Available,
//       newImage: dynamodbRecordEvent.NewImage,
//       oldImage: dynamodbRecordEvent.OldImage
//     };
//   }
//   if (dynamodbRecordEvent.OldImage.available.S === 'false' &&
//     dynamodbRecordEvent.NewImage.available.S === 'true') {
//     return {
//       eventType: EventTypes.Not_Available_to_Available,
//       newImage: dynamodbRecordEvent.NewImage,
//       oldImage: dynamodbRecordEvent.OldImage
//     };
//   }
//   if (dynamodbRecordEvent.OldImage.quantity.S !== dynamodbRecordEvent.NewImage.quantity.S) {
//     return {
//       eventType: EventTypes.Quantity_Changed,
//       newImage: dynamodbRecordEvent.NewImage,
//       oldImage: dynamodbRecordEvent.OldImage
//     };
//   }
//   throw new Error('Unable to process images');
// }
