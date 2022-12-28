import { getRequest } from '../http.mjs';
import { RequestOptions } from "http";
import { Product, Variant } from "./types.mjs";
import { InventoryItem } from "../database/types.mjs";

const fileExtensionMatchPattern = /\.[^/.]+$/; // RegEx to match file extensions like '.jpeg', '.js', '.html', etc.


/**
 * Sends an HTTP GET request to a Shopify site
 * @param {*} hostname
 * @param {*} pathname
 * @returns
 */
export async function sendShopifyRequest (hostname: string, pathname: string) {
  console.info(`Executing util::shopify::sendShopifyRequest - pathname: '${pathname}' hostname: '${hostname}'`);
  if (!hostname || !pathname) {
    throw new Error('"hostname" and "pathname" must be defined');
  }
  const options: RequestOptions = {
    host: hostname,
    port: '443',
    path: pathname,
    method: 'GET',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'user-agent': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }
  };

  try {
    // Send a request to the Shopify site
    // @ts-ignore
    const response = <Product>await getRequest(options);
    console.debug(`Shopify Response is '${JSON.stringify(response)}'`);
    return response;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
  } catch (err: never) {
    console.error('An error occurred while sending a Shopify request');
    console.error(err?.message);
    return err;
  }
}

/**
 * Parses a typical Shopify site response
 * @param {Product} product An array of Shopify stock summaries
 * @param {string} site The site from which the Shopify response was received
 * @returns An array of summary objects
 */
export function processShopifyResponse (product: Product, site: string): InventoryItem[] {
  console.info('Executing shopify::processShopifyResponse');

  // Removes the trailing '.js' file extension from the site path. We don't want the hyperlink to open
  // client browser's to a blob of JSON; we want the browser to open to a pretty HTML page!
  const hyperlink = site.replace(fileExtensionMatchPattern, '');
  console.debug(`shopify::processShopifyResponse - generating hyperlink: '${hyperlink}'`);

  const items: InventoryItem[] = []; // will be returned

  if (!product.variants) {
    throw new Error('variants is undefined.');
  }

  // Iterate over all products available at the site. For each one, generate a summary object and push it onto the items list.
  for (let i = 0; i <= product.variants.length; i++) {
    // Parse each stock item
    const inventoryItem: Variant = product.variants[i];

    if (inventoryItem?.title) {

      // Prefer the 'name' property if it exists. Otherwise, try using 'title'. If 'name' and 'title' are both invalid,
      // then set a placeholder value.
      let itemName = !!inventoryItem.name ? inventoryItem.name : inventoryItem.title;
      if (!itemName || itemName == 'Default Title') itemName = 'UnknownProductName';

      // Log the availability status of each stock item
      if (inventoryItem?.available) {
        console.info(`IN STOCK (${inventoryItem?.inventory_quantity})!!! --> ${itemName}`);
      } else {
        console.info(`NOT IN STOCK --> ${itemName}`);
      }

      // If `available` property is undefined, then set to false
      const available = inventoryItem?.available ? inventoryItem?.available : false;

      // If `quantity` property is undefined, then set to zero
      const quantity = inventoryItem?.inventory_quantity ? inventoryItem?.inventory_quantity : 0;

      // Push a summary object for each stock item

      // @ts-ignore
      items.push(<InventoryItem>{
        id: String(inventoryItem?.id),
        title: itemName,
        available: available,
        quantity: quantity,
        site: hyperlink
      });
    }
  }
  console.debug(`Processed ${items.length} items.`);
  return items;
}
