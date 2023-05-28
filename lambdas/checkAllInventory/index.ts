import { APIGatewayEvent, APIGatewayProxyCallback, Context } from "aws-lambda";

export const handler = async (event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) => {

}

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
