import { postRequest } from './http.mjs';
import {
  SecretsManagerClient,
  GetSecretValueCommand
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
  region: process.env.Region ? process.env.Region : 'us-east-1'
});

interface DiscordMessage {
  username: string;
  content: string;
}

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

  async sendMessage (discordMessage: string) {
    console.debug(`Executing Discord::sendMessage - '${discordMessage}'`);

    // stop if no message content to send
    if (!discordMessage) {
      console.warn('analyzedEvent is undefined');
      throw new Error('No message content received. Exiting.');
    }

    // Fetch and parse the Discord API key from AWS Secrets Manager
    const discordApiKey = await this._getApiKey();

    // compose the body for the HTTP post request

    const message: DiscordMessage = {
      content: discordMessage,
      username: this.discordBotUsername
    };

    // the body must be stringified before sending the HTTP request
    const body: Buffer = Buffer.from(JSON.stringify(message), 'utf-8');

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
