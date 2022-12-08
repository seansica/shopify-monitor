import { postRequest } from './http.mjs';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.Region ? process.env.Region : 'us-east-1'
});

/**
 * Send a Discord message via webhook
 * For more info: https://discord.com/developers/docs/resources/webhook
 * @param {*} secretArn
 * @param {*} messageContent
 * @returns
 */
export async function notifyDiscord (secretArn, messageContent) {
  console.debug(`Executing discord::postToDiscord - messageContent: '${JSON.stringify(messageContent)}'`);

  if (!messageContent) {
    console.warn('No messageContent received. Skipping postToDiscord.');
    return;
  }

  // Fetch and parse the Discord API key from AWS Secrets Manager
  let response;
  // eslint-disable-next-line no-useless-catch
  try {
    console.debug('Attempting to retrieve Discord API key from vault...');
    response = await client.send(
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

  const discordApiKey = JSON.parse(response.SecretString)['discord-api-key'];

  if (!discordApiKey) {
    throw new Error('Discord API key not found.');
  }

  const body = JSON.stringify({
    content: prettifyMessage(messageContent),
    username: discordUsername()
  });

  const options = {
    hostname: 'discord.com',
    path: `/api/webhooks/${discordApiKey}`,
    method: 'POST',
    port: 443, // 👈️ replace with 80 for HTTP requests
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

/**
 * Can't decide which username to use... 🤡
 * @returns
 */
function discordUsername () {
  return 'Keebatron';
}

/**
 * Format the Discord message
 * @param {*} message
 * @returns
 */
function prettifyMessage ({ title, quantity, site }) {
  if (title && quantity && site) {
    return `${title} - ${quantity || 'unknown qty of'} units available!!! [Link](${site})`;
  }
}
