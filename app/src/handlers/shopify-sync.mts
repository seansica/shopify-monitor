import * as Shopify from '../lib/shopify/shopify.mjs';
import { Product } from '../lib/shopify/types.mjs';
import { Database } from '../lib/database/index.mjs';
import { ResponseError, ResponseSuccess } from '../lib/http.mjs';
import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import { InventoryItem } from "../lib/database/types.mjs";


// Get environment variables - set by CloudFormation/SAM
const inventoryTableName = process.env.INVENTORY_TABLE;
const configTableName = process.env.CONFIG_TABLE;

if (!inventoryTableName) throw new Error('INVENTORY_TABLE must be defined.')
if (!configTableName) throw new Error('CONFIG_TABLE must be defined.');


/**
 * A simple example includes an HTTP get method to get all items from a DynamoDB table.
 * @param {*} event
 * @param {*} context
 * @param callback
 * @returns
 */
export const handler = async (event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) => {

  // All log statements are written to CloudWatch
  console.info('Received event:', event);

  if (event.httpMethod !== 'POST') {
    // throw new Error(`ShopifySyncFunction only accept GET method. You tried: ${event.httpMethod}`);
    console.warn(`ShopifySyncFunction only accept GET method. You tried: ${event.httpMethod}`);
  }
  if (event.path !== '/sync') {
    // throw new Error(`ShopifySyncFunction only accepts requests on path "/sync". You tried: "${event.path}"`);
    console.warn(`ShopifySyncFunction only accepts requests on path "/sync". You tried: "${event.path}"`);
  }

  // Retrieve the list of Shopify site URLs to check from the ConfigTable
  const configItems = await Database.scanItems(configTableName)
  if (!configItems) throw new Error('No items returned from scan.');
  const sites = [];
  for (const item of configItems) {
    if (item.type === 'SITE') {
      sites.push(item.name);
    }
  }

  let allItems: InventoryItem[] = [];
  // Get the content from the Shopify site(s)
  for (const site of sites) {
    // Parse the host and path from the full website URL
    const { pathname, hostname } = new URL(site);
    try {
      // Send a GET request to the website for a list of inventory
      const shopifyResponse: Product = await Shopify.sendShopifyRequest(hostname, pathname);
      // Parse the list of inventory response
      const listOfStockItems: InventoryItem[] = Shopify.processShopifyResponse(shopifyResponse, site);
      // Merge the list into the master list which will be returned when the function has completed processing
      allItems = allItems.concat(listOfStockItems);
      try {
        // Add each item retrieved to the database table
        for (const item of listOfStockItems) {
          /**
           * Write the content to the database.
           * Each item will be structured like:
           * { id: number, title: str, available: bool, quantity: number, site: str }
           */
          await Database.putItem(inventoryTableName, item);
        }
        // @ts-ignore
      } catch(err: Error) {
        console.warn(`There was an error while trying to put item in database.`);
        console.error(err.message);
      }
      // @ts-ignore
    } catch(err: Error) {
      console.warn(`There was an error while sending a Shopify request to ${site}.`);
      console.error(err.message);
    }
  }
  // Note that it is possible that all sync requests still fail and get caught in the above try/catch blocks.
  // Ideally, this function should be split into two: one retrieves the list of Shopify sites from Dynamo and executes
  // a for-loop on them facilitates the overall execution, and one that sends the Shopify request to each site. Each
  // request should be invoked in a unique Lambda execution so that the failure of one site sync does not impact or
  // impede another. Until then, this function will blindly return a success callback response.
  callback(undefined, new ResponseSuccess());
};