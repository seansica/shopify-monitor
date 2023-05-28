import * as Shopify from '../../plugins/shopify/shopify';
import { Product } from '../../plugins/shopify/types';
import { Database } from '../../plugins/database';
import { ResponseSuccess } from '../../plugins/http';
import { APIGatewayEvent, APIGatewayProxyCallback, Context } from 'aws-lambda';
import { InventoryItem } from "../../plugins/database/types";


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
    console.warn(`ShopifySyncFunction only accepts POST requests. You tried: ${event.httpMethod}. This may not work in the future.`);
  }
  if (event.path !== '/sync') {
    console.warn(`ShopifySyncFunction only accepts requests on path "/sync". You tried: "${event.path}". This may not work in the future.`);
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
    try {
      const { hostname } = new URL(site);

      // Get product handles and their corresponding IDs
      const productHandles = await Shopify.fetchAllProducts(hostname);

      // Send a GET request to the website for a list of inventory and update the database in parallel
      const requests = productHandles.map(async (productHandle: { handle: string; }) => {
        const productPath = `/products/${productHandle.handle}.js`;
        const shopifyResponse: Product = await Shopify.sendShopifyRequest(hostname, productPath);
        const listOfStockItems: InventoryItem[] = Shopify.processShopifyResponse(shopifyResponse, site, productHandle.handle);
        allItems = allItems.concat(listOfStockItems);
      });

      // Wait for all the requests to complete
      await Promise.all(requests);

      // After all items are retrieved from the site, add them to the database table in a batch operation
      await Database.batchPutItems(inventoryTableName, allItems);

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
