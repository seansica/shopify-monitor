import { postToDiscord, prettifyMessage } from '../lib/discord.mjs';
import { getAllItems } from '../lib/database.mjs';

// Get the Discord webook URL path
const path = process.env.DISCORD_API_PATH;
// const path = '/api/webhooks/1045794458228236348/Bl_b9FiHVno8orohzPQiyMhyniDHOzhiuxIkQUxkikadjUf8wBwbAjlv7CnYHkzpWvI5';

// Get the DynamoDB table name from environment variables
const tableName = process.env.KEEB_STOCK_TABLE;

export const discordNotificationHandler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    throw new Error(`postToDiscordHandler only accept POST method, you tried: ${event.httpMethod}`);
  }
  // All log statements are written to CloudWatch
  console.info('received:', event);

  // first, get the content from the database
  /** code here */
  const items = await getAllItems(tableName);

  console.debug(`Received ${items?.length} objects from database`);

  // third, send the content to discord
  try {
    for (const item of items) {
      if (item.available) {
        await postToDiscord(
          path,
          prettifyMessage(item) // second, format the content to render nicely as discord
        );
        console.debug('Discord notification succeeded');
      }
    }

    return context.succeed('Keeb bot Discord notification succeeded');
  } catch (err) {
    console.log(err);
  }
  return context.fail('Keeb bot Discord notification failed');
};
