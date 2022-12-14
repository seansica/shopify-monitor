import { postRequest } from './http';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.Region ? process.env.Region : 'us-east-1'
});

export const EventTypes = {
  Available_to_Not_Available: 0,
  Not_Available_to_Available: 1,
  Quantity_Changed: 2,
  New_Inventory: 3,
  False_Positive: 4,
  Status_Update: 5
};

/**
 * Discord helper class to send messages via webhook
 */
export class Discord {

  private readonly secretArn: string;
  private readonly discordBotUsername: string;

  /**
   * Initializes a class instance
   * @param {*} secretArn The ARN of the Secrets Manager vault in which the Discord API key is stored
   * @param {*} discordBotUsername An optional username for the Discord bot (will be seen in posted messages on Discord)
   */
  constructor (secretArn: string, discordBotUsername: string) {
    this.secretArn = secretArn;
    this.discordBotUsername = discordBotUsername || 'Keebatron';
  }

  async _getApiKey (): Promise<unknown> {
    let secretsManagerResponse;
    // eslint-disable-next-line no-useless-catch
    try {
      console.debug('Attempting to retrieve Discord API key from vault...');
      secretsManagerResponse = await client.send(
        new GetSecretValueCommand({
          SecretId: this.secretArn,
          VersionStage: 'AWSCURRENT' // VersionStage defaults to AWSCURRENT if unspecified
        })
      );
      console.debug('Key retrieval from vault success!');
    } catch (error) {
      console.error('Error', error);
      console.error('An error occurred while trying to retrieve the Discord API key.');
      throw error;
    }

    // Parse the discord api key

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const discordApiKey = JSON.parse(secretsManagerResponse.SecretString)['discord-api-key'];

    if (!discordApiKey) {
      throw new Error('Discord API key not found.');
    }

    return discordApiKey;
  }

  /**
   * Send a Discord message via webhook
   * @param analyzedEvent
   * @param {EventTypes} analyzedEvent.eventType
   * @param {*} analyzedEvent.newImage
   * @param {*} [analyzedEvent.oldImage]
   * @returns {Promise<void>}
   */
  async sendMessage (analyzedEvent) {
    console.debug(`Executing Discord::sendMessage - newAndOldImages: '${JSON.stringify(analyzedEvent)}'`);

    // stop if no message content to send
    if (!analyzedEvent) {
      console.warn('analyzedEvent is undefined');
      throw new Error('No message content received. Exiting.');
    }

    // Fetch and parse the Discord API key from AWS Secrets Manager
    const discordApiKey = await this._getApiKey();

    // compose the body for the HTTP post request

    interface DiscordMessage {
      username: string;
      content: string;
    }

    const message: DiscordMessage = {
      content: "", // 👈 this will be set in the following switch statement
      username: this.discordBotUsername
    };

    // set the message based on the event type. this will result in a better user experience.
    // for example, if the product is no longer available, say "Product X is no longer available."
    // or if the product quantity simply changed, let the user know how much inventory is remaining

    switch (analyzedEvent.eventType) {
      case EventTypes.Status_Update: {
        const productName = analyzedEvent.newImage.title;
        const productAvailability = analyzedEvent.newImage.available ? analyzedEvent.newImage.available : 'unknown';
        const productQuantity = analyzedEvent.newImage.quantity ? analyzedEvent.newImage.quantity : 'unknown';
        const hyperlink = analyzedEvent.newImage.site;
        message.content = `Status Check: PRODUCT ${productName} | AVAILABLE: ${productAvailability} | QUANTITY: ${productQuantity} | [Link](${hyperlink})`;
        break;
      }
      case EventTypes.Available_to_Not_Available: {
        const productName = analyzedEvent.newImage.title.S;
        const hyperlink = analyzedEvent.newImage.site.S;
        message.content = `Product ${productName} is no longer available...☹️ [LINK](${hyperlink})️`;
        break;
      }
      case EventTypes.Not_Available_to_Available: {
        // e.g., "Product X is available! 10 units available - BUY HERE"
        const productName = analyzedEvent.newImage.title.S;
        const newQuantity = analyzedEvent.newImage.quantity.N;
        const hyperlink = analyzedEvent.newImage.site.S;
        message.content = `Product ${productName} is available! 🥳 (${newQuantity || 'unknown number of'} units available) - [BUY HERE](${hyperlink})`;
        break;
      }
      case EventTypes.Quantity_Changed: {
        const productName = analyzedEvent.newImage.title.S;
        const newQuantity = analyzedEvent.newImage.quantity.N;
        const oldQuantity = analyzedEvent.oldImage.quantity.N;
        const hyperlink = analyzedEvent.newImage.site.S;
        if (newQuantity && oldQuantity) {
          message.content = `Product ${productName} quantity changed from ${oldQuantity} to ${newQuantity} - [BUY HERE](${hyperlink})`;
        } else {
          message.content = `Product quantity changed - [BUY HERE](${hyperlink})`;
        }
        break;
      }
      case EventTypes.New_Inventory: {
        message.content = `New product posted 🚨 ${productName} (Qty ${newQuantity}) - [LINK](${hyperlink})`;
        break;
      }
      default:
        throw new Error('An unhandled stream event occurred.');
    }

    // the body must be stringified before sending the HTTP request
    const body = JSON.stringify(message);

    // compose the HTTP post options
    const options = {
      hostname: 'discord.com',
      path: `/api/webhooks/${discordApiKey}`,
      method: 'POST',
      port: 443,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': body.length
      }
    };

    // send the message!
    try {
      const res = await postRequest(options, body);
      console.debug(`Discord response: ${JSON.stringify(res)}`);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    } catch (err: Error) {
      console.error('Discord threw an error!');
      console.error('Error', err.message);
      throw err;
    }
  }
}
