// Create clients and set shared const values outside of the handler.

import { sendShopifyRequest, processShopifyResponse } from '../lib/shopify.mjs';
import { writeContentToDatabase } from '../lib/database.mjs';

// Get the DynamoDB table name from environment variables
const tableName = process.env.KEEB_STOCK_TABLE;

// Get the Shopify sites that should be scanned
const sites = JSON.parse(process.env.SHOPIFY_SITES);
// const sites = [
//     "https://shop.norbauer.com/products/norbazaar-rare-and-sundry-topre-aftermarket-housings.js",
//     "https://shop.norbauer.com/products/the-heavy-grail-hhkb-housing.js",
//     "https://shop.norbauer.com/products/the-heavy-grail-ghost-of-christmas-future-edition.js"
// ]

/**
 * A simple example includes a HTTP get method to get all items from a DynamoDB table.
 */
export const shopifySynchronizationHandler = async (event, context) => {
  if ('httpMethod' in event && event.httpMethod !== 'GET') {
    throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('Received event:', event);

  let allItems = [];
  // FIRST, get the content from the Shopify site(s)
  try {
    for (const site of sites) {
      // Parse the host and path from the full website URL
      const { pathname, hostname } = new URL(site);

      // Send a GET request to the website for a list of inventory
      const shopifyResponse = await sendShopifyRequest(hostname, pathname);

      // Parse the list of inventory response
      const listOfStockItems = processShopifyResponse(shopifyResponse, site);

      // Merge the list into the master list - we will return the master list via context.succeed when the function is done processing
      allItems = allItems.concat(listOfStockItems);

      // Add each item retrieved to the database table
      for (const item of listOfStockItems) {
      /**
         * Each item will be structured like:
         * {
         *      id: number,
         *      title: str,
         *      available: bool,
         *      quantity: number
         * }
         */
        // SECOND write the content to the database
        await writeContentToDatabase(tableName, item);
      }
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(allItems),
      isBase64Encoded: false
    };
    // return context.succeed(res);
  } catch (err) {
    console.log(err.message);
    // return context.fail('Failed to handle Shopify content');
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Failed to handle Shopify content',
        error: err.message
      }),
      isBase64Encoded: false
    };
  }
};
