import { Discord } from '../../plugins/discord';
import { ResponseSuccess, ResponseError } from '../../plugins/http';
import { APIGatewayProxyCallback, Context, SQSEvent } from "aws-lambda";
import { MySQSClient } from "../../plugins/sqs";

// Initialize Discord client
const secretArn = process.env.DISCORD_SECRET_ARN;
if (!secretArn) throw new Error('DISCORD_SECRET_ARN is undefined');
const discord = new Discord(secretArn, 'Keebatron');

// Initialize SQS client
const queueUrl = process.env.QUEUE_URL;
if (!queueUrl) throw new Error('process.env.QUEUE_URL must be defined.');
const sqs = new MySQSClient(queueUrl);

/**
 * Sends a Discord notification via webhook
 * @param {*} event
 * @param {*} context
 * @param {*} callback
 * @returns
 */
export const handler = async (event: SQSEvent, context: Context, callback: APIGatewayProxyCallback) => {
  // All log statements are written to CloudWatch
  console.info('Received event:', JSON.stringify(event));

  for (const record of event.Records) {

    // Send a message to Discord
    try {
      await discord.sendMessage(record.body);
    } catch (err) {
      console.log(`Error sending message: ${err}`);
      // Don't break because Discord will sometimes throw a SyntaxError yet still process the message.
      // If this happens we still want to delete/purge the message that was processed.
    }
    try {
      await sqs.delete(record.receiptHandle);
    } catch (err) {
      console.log(`Error deleting message: ${err}`);
      callback(new ResponseError());
    }
    // end forEach
  }
  callback(undefined, new ResponseSuccess());
};
