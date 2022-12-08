import { sendShopifyRequest, processShopifyResponse } from '../lib/shopify.mjs';
import { DynamoTable } from '../lib/database.mjs';
import { ResponseBuilder } from '../lib/http.mjs';

// Get environment variables - set by CloudFormation/SAM

const inventoryTableName = process.env.INVENTORY_TABLE;
const configTableName = process.env.CONFIG_TABLE;
const region = process.env.Region ? process.env.Region : 'us-east-1';

// Initialize database connections
const configTable = new DynamoTable(region, configTableName, 'name');
const inventoryTable = new DynamoTable(region, inventoryTableName, 'id');

/**
 * A simple example includes a HTTP get method to get all items from a DynamoDB table.
 * @param {*} event
 * @param {*} context
 * @returns
 */
export const shopifySyncHandler = async (event, context) => {
  if ('httpMethod' in event && event.httpMethod !== 'GET') {
    throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('Received event:', event);

  // Prepare the response
  const responseBuilder = new ResponseBuilder()
    .setHeader('Content-Type', 'application/json')
    .setBase64Encoded(false);

  // Retrieve the list of Shopify site URLs to check from the ConfigTable
  const configItems = await configTable.getAllItems();
  const sites = [];
  for (const item of configItems) {
    if (item.type === 'SITE') {
      sites.push(item.name);
    }
  }

  let allItems = [];
  // Get the content from the Shopify site(s)
  try {
    for (const site of sites) {
      // Parse the host and path from the full website URL
      const { pathname, hostname } = new URL(site);

      // Send a GET request to the website for a list of inventory
      const shopifyResponse = await sendShopifyRequest(hostname, pathname);

      // Parse the list of inventory response
      const listOfStockItems = processShopifyResponse(shopifyResponse, site);

      // Merge the list into the master list which will be returned when the function has completed processing
      allItems = allItems.concat(listOfStockItems);

      // Add each item retrieved to the database table
      for (const item of listOfStockItems) {
      /**
         * Write the content to the database.
         * Each item will be structured like:
         * {
         *      id: number,
         *      title: str,
         *      available: bool,
         *      quantity: number,
         *      site: str
         * }
         */
        await inventoryTable.putItem(item);
      }
    }

    // Return a 200 HTTP response
    const res = responseBuilder
      .setStatusCode(200)
      .setBody(allItems)
      .build();

    return res.toJSON();
  } catch (err) {
    console.log(err.message);
    const res = responseBuilder
      .setStatusCode(500)
      .setBody({
        title: 'Failed to handle Shopify content',
        error: err.message
      })
      .build();
    return res.toJSON();
  }
};
