import { postToDiscord } from '../lib/discord.mjs';
import { getAllItems } from '../lib/database.mjs';

// Get the Discord webook URL path
const path = process.env.DISCORD_API_PATH;
// const path = '/api/webhooks/1045794458228236348/Bl_b9FiHVno8orohzPQiyMhyniDHOzhiuxIkQUxkikadjUf8wBwbAjlv7CnYHkzpWvI5';

// Get the DynamoDB table name from environment variables
const tableName = process.env.KEEB_STOCK_TABLE;

export const discordNotificationHandler = async (event, context) => {
  if ('httpMethod' in event && event.httpMethod !== 'POST') {
    throw new Error(`postToDiscordHandler only accept POST method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  // get the content from the database
  const items = await getAllItems(tableName);

  console.debug(`Received ${items?.length} objects from database`);

  // send the content to discord
  try {
    for (const item of items) {
      if (item.available) {
        await postToDiscord(path, item);
        console.debug('Discord notification succeeded');
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Shopify bot successfully notified the Discord server'
      }),
      isBase64Encoded: false
    };
  } catch (err) {
    console.log(err);
  }
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: 'Shopify bot failed to notify the Discord server. Please inform the admin.'
    }),
    isBase64Encoded: false
  };
};
