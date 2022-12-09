import { postRequest } from './http.mjs';
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
  False_Positive: 4
};

/**
 * Discord helper class to send messages via webhook
 */
export class Discord {
  /**
   * Initializes a class instance
   * @param {*} secretArn The ARN of the Secrets Manager vault in which the Discord API key is stored
   * @param {*} discordBotUsername An optional username for the Discord bot (will be seen in posted messages on Discord)
   */
  constructor (secretArn, discordBotUsername) {
    this.secretArn = secretArn;
    this.discordBotUsername = discordBotUsername || 'Keebatron';
  }

  async _getApiKey () {
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

    const message = {
      // content:  👈 this will be set in the following switch statement
      username: this.discordBotUsername
    };

    const productName = analyzedEvent.newImage.title.S;
    const newQuantity = analyzedEvent.newImage.quantity.N;
    const hyperlink = analyzedEvent.newImage.site.S;

    // set the message based on the event type. this will result in a better user experience.
    // for example, if the product is no longer available, say "Product X is no longer available."
    // or if the product quantity simply changed, let the user know how much inventory is remaining

    switch (analyzedEvent.eventType) {
      case EventTypes.Available_to_Not_Available: {
        message.content = `Product ${productName} is no longer available...☹️ [LINK](${hyperlink})️`;
        break;
      }
      case EventTypes.Not_Available_to_Available: {
        // e.g., "Product X is available! 10 units available - BUY HERE"
        message.content = `Product ${productName} is available! 🥳 (${newQuantity || 'unknown number of'} units available) - [BUY HERE](${hyperlink})`;
        break;
      }
      case EventTypes.Quantity_Changed: {
        const oldQuantity = analyzedEvent.oldImage.quantity.N;
        if (newQuantity && oldQuantity) {
          message.content = `Product quantity changed from ${oldQuantity} to ${newQuantity} - [BUY HERE](${hyperlink})`;
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
    } catch (err) {
      console.error('Discord threw an error!');
      console.error('Error', err.message);
      throw err;
    }
  }
}

/**
 * Send a Discord message via webhook
 * For more info: https://discord.com/developers/docs/resources/webhook
 * @param {*} secretArn
 * @param {*} messageContent
 * @returns
 */
// export async function notifyDiscord (secretArn, messageContent) {
//   console.debug(`Executing discord::postToDiscord - messageContent: '${JSON.stringify(messageContent)}'`);

//   if (!messageContent) {
//     console.warn('No messageContent received. Skipping postToDiscord.');
//     return;
//   }

//   // Fetch and parse the Discord API key from AWS Secrets Manager
//   let response;
//   // eslint-disable-next-line no-useless-catch
//   try {
//     console.debug('Attempting to retrieve Discord API key from vault...');
//     response = await client.send(
//       new GetSecretValueCommand({
//         SecretId: secretArn,
//         VersionStage: 'AWSCURRENT' // VersionStage defaults to AWSCURRENT if unspecified
//       })
//     );
//     console.debug('Key retrieval from vault success!');
//   } catch (error) {
//     console.error('Error', error);
//     console.error('An error occurred while trying to retrieve the Discord API key.');
//     throw error;
//   }

//   const discordApiKey = JSON.parse(response.SecretString)['discord-api-key'];

//   if (!discordApiKey) {
//     throw new Error('Discord API key not found.');
//   }

//   const body = JSON.stringify({
//     content: prettifyMessage(messageContent),
//     username: discordUsername()
//   });

//   const options = {
//     hostname: 'discord.com',
//     path: `/api/webhooks/${discordApiKey}`,
//     method: 'POST',
//     port: 443, // 👈️ replace with 80 for HTTP requests
//     headers: {
//       Accept: 'application/json',
//       'Content-Type': 'application/json',
//       'Content-Length': body.length
//     }
//   };

//   try {
//     const res = await postRequest(options, body);
//     console.debug(`Discord response: ${JSON.stringify(res)}`);
//   } catch (err) {
//     console.error('Discord threw an error!');
//     console.error('Error', err.message);
//     throw err;
//   }
// }

// /**
//  * Can't decide which username to use... 🤡
//  * @returns
//  */
// function discordUsername () {
//   return 'Keebatron';
// }

// /**
//  * Format the Discord message
//  * @param {*} message
//  * @returns
//  */
// function prettifyMessage ({ title, quantity, site }) {
//   if (title && quantity && site) {
//     return `${title} - ${quantity || 'unknown qty of'} units available!!! [Link](${site})`;
//   }
// }
