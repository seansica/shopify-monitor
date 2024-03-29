import { Context, APIGatewayProxyCallback, APIGatewayEvent } from 'aws-lambda';
import { putItem } from '../../plugins/database/ddbdoc-put-item';
import { ResponseError, ResponseSuccess } from "../../plugins/http";

// Get environment variables - set by CloudFormation/SAM

const configTableName = process.env.CONFIG_TABLE;
if (!configTableName) throw new Error('process.env.CONFIG_TABLE is undefined.');

/**
 * Perform various config actions on the Config Table
 * @param {*} event
 * @param {*} context
 * @param callback
 */
export const handler = async (event: APIGatewayEvent, context: Context, callback: APIGatewayProxyCallback) => {
  console.log('Received event', JSON.stringify(event));

  /** analyze the event - reject non-compliant requests */
  if ('httpMethod' in event) {
    if (event.httpMethod !== 'POST') {
      throw new Error(`ConfigFunction only accepts POST requests. You tried: ${event.httpMethod}`);
    }
    if (event.path !== "/config") {
      throw new Error(`ConfigFunction only accepts requests on path "/config". You tried: "${event.path}"`);
    }

    // Process request to add new Shopify site(s) to config table
    if (event.multiValueQueryStringParameters?.site) {
      /**
       * You can POST multiple sites in the same request.
       * e.g., POST /config?site=www.mysite.com&site=www.mysite2.com
       *       The Lambda function will receive event:
       *       "multiValueQueryStringParameters": {
       *             "site": [
       *                 "www.mysite.com",
       *                 "www.mysite2.com"
       *            ]
       *       }
       */
      if (configTableName === undefined) {
        // Table name is undefined. Cannot add new Shopify site without a table name.
        return callback(new ResponseError());
      }
      const monitorTargets = event.multiValueQueryStringParameters.site;

      // Write each site to the table
      for (const site of monitorTargets) {
        const siteItem = {
          name: site,
          type: 'SITE'
        };
        console.debug(`Writing site item ${JSON.stringify(siteItem)} to ConfigTable`);
        await putItem(configTableName, siteItem);
      }

      // Return a 200 response
      console.log(`Successfully started monitoring ${monitorTargets.length} sites`);
      return callback(undefined, new ResponseSuccess());
    }
  }
  // Request must be an HTTP event
  callback(new ResponseError());
};
