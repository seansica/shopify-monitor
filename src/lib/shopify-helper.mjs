import { getRequest } from './http.mjs';

// RegEx to match file extensions like '.jpeg', '.js', '.html', etc.
const fileExtensionMatchPattern = /\.[^/.]+$/;

/**
 * Sends an HTTP GET request to a Shopify site
 * @param {*} hostname
 * @param {*} pathname
 * @returns
 */
export async function sendShopifyRequest (hostname, pathname) {
  console.info(`Executing util::shopify::sendShopifyRequest - pathname: '${pathname}' hostname: '${hostname}'`);
  if (!hostname || !pathname) {
    throw new Error('"hostname" and "pathname" must be defined');
  }
  const options = {
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
    const response = await getRequest(options);
    console.debug(`Shopify Response is '${JSON.stringify(response)}'`);
    return response;
  } catch (err) {
    console.error('An error occurred while sending a Shopify request');
    console.error(err.message);
    return err;
  }
}

/**
 * Parses a typical Shopify site response
 * @param {*} bodyJSON An array of Shopify stock summaries
 * @param {*} site The site from which the Shopify response was received
 * @returns An array of summary objects
 */
export function processShopifyResponse (bodyJSON, site) {
  console.info(`Executing "shopify::processShopifyResponse - bodyJSON '${JSON.stringify(bodyJSON)}'`);

  // Removes the trailing '.js' file extension from the site path. We don't want the hyperlink to open
  // client browser's to a blob of JSON; we want the browser to open to a pretty HTML page!
  const hyperlink = site.replace(fileExtensionMatchPattern, '');
  console.debug(`shopify::processShopifyResponse - generating hyperlink: '${hyperlink}'`);

  const items = []; // will be returned

  // Iterate over all products available at the site. For each one, generate a summary object and push it onto the items list.
  for (let i = 0; i <= bodyJSON.variants.length; i++) {
    // Parse each stock item
    const stockItem = bodyJSON.variants[i];

    if (stockItem?.title) {
      // Log the availability status of each stock item
      if (stockItem?.available) {
        console.info(`IN STOCK (${stockItem?.inventory_quantity})!!! --> ${stockItem.title}`);
      } else {
        console.info(`NOT IN STOCK --> ${stockItem.title}`);
      }

      // Push a summary object for each stock item
      items.push({
        id: String(stockItem?.id),
        title: stockItem?.title,
        available: stockItem?.available,
        quantity: stockItem?.inventory_quantity,
        site: hyperlink
      });
    }
  }
  return items;
}
