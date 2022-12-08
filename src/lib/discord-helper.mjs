import { postRequest } from './http-helper.mjs';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.Region ? process.env.Region : 'us-east-1'
});

/**
 * Discord helper class to send messages via webhook
 */
export class Discord {

  /**
   * Initializes a class instance
   * @param {*} secretArn The ARN of the Secrets Manager vault in which the Discord API key is stored
   * @param {*} discordBotUsername An optional username for the Discord bot (will be seen in posted messages on Discord)
   */
  constructor(secretArn, discordBotUsername) {
    this.secretArn = secretArn;
    this.discordBotUsername = discordBotUsername ? discordBotUsername : "Keebatron";
  }

  async sendMessage() {
    console.debug(`Executing Discord::sendMessage - messageContent: '${JSON.stringify(messageContent)}'`);

    // stop if no mesage content to send
    if (!messageContent) {
      console.warn('No messageContent received. Skipping postToDiscord.');
      return;
    }

    // Fetch and parse the Discord API key from AWS Secrets Manager
    let secretsManagerResponse;
    // eslint-disable-next-line no-useless-catch
    try {
      console.debug('Attempting to retrieve Discord API key from vault...');
      secretsManagerResponse = await client.send(
        new GetSecretValueCommand({
          SecretId: secretArn,
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

    // compose the body for the HTTP post request
    const body = JSON.stringify({
      content: this._prettifyMessage(messageContent),
      username: discordUsername()
    });

    // compose the options for the HTTP post request
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

    try {
      const res = await postRequest(options, body);
      console.debug(`Discord response: ${JSON.stringify(res)}`);
    } catch (err) {
      console.error('Discord threw an error!');
      console.error('Error', err.message);
      throw err;
    }
  }

  _prettifyMessage({ title, quantity, site }) {
    if (title && quantity && site) {
      return `${title} - ${quantity || 'unknown qty of'} units available!!! [Link](${site})`;
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
