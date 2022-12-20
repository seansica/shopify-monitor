import { ResponseError, ResponseSuccess } from "../lib/http.mjs";
import { Callback, Context } from "aws-lambda";
import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda/trigger/dynamodb-stream";
import { SimpleNotificationService } from "../lib/sns.mjs";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const region = process.env.Region ? process.env.Region : 'us-east-1';
const topicArn = process.env.TOPIC_ARN;

if (!region) {
    throw new Error('region must be defined.');
}
if (!topicArn) {
    throw new Error('topicArn must be defined.');
}

const sns = new SimpleNotificationService(region, topicArn);

export const handler = async (event: DynamoDBStreamEvent, context: Context, callback: Callback) => {
    // All log statements are written to CloudWatch
    console.info('Received event:', JSON.stringify(event));
    try {
        for (const dbRecord of event.Records) {
            await processDiscordSnsEvent(dbRecord);
        }
        callback(undefined, new ResponseSuccess());
    } catch (err: unknown) {
        console.error(err);
        callback(new ResponseError());
    }
}

async function processDiscordSnsEvent (event: DynamoDBRecord) {

    if (!event.dynamodb) {
        return;
    }

    let discordMessage = '';

    try {
        switch (event.eventName) {
            case 'INSERT': {
                console.debug('Processing INSERT event.');

                // Unmarshall the new item

                // @ts-ignore
                const newImage = unmarshall(event.dynamodb.NewImage);
                console.debug(`Unmarshalled new image - '${JSON.stringify(newImage)}'`);

                // Process a Discord message for the new item

                if (newImage != undefined) {
                    // new item was added
                    const productName = newImage.title;
                    const hyperlink = newImage.site;
                    discordMessage = `A new product (${productName}) appeared! 🚨 Go check it out! [LINK](${hyperlink}`;
                }
                break;
            }
            case 'MODIFY': {
                console.debug('Processing MODIFY event.');

                // Unmarshall both the old and new images

                // @ts-ignore
                const oldImage = unmarshall(event.dynamodb.OldImage);
                // @ts-ignore
                const newImage = unmarshall(event.dynamodb.NewImage);

                console.debug(`Unmarshalled old image - '${JSON.stringify(oldImage)}'`);
                console.debug(`Unmarshalled new image - '${JSON.stringify(newImage)}'`);

                // Process a Discord message based on whether the item went out of stock, is back in stock, or the
                // quantity available just changed

                // item is out of stock
                if (oldImage?.available === true && newImage?.available === false) {
                    console.debug('The item changed from Available to Not Available');
                    const productName = newImage.title;
                    const hyperlink = newImage.site;
                    discordMessage = `Product ${productName} is no longer available...☹️ [LINK](${hyperlink})️`;
                }
                // item is back in stock
                else if (oldImage?.available === false && newImage?.available === true) {
                    console.debug('The item changed from Not Available to Available');
                    const productName = newImage.title;
                    const newQuantity = newImage.quantity;
                    const hyperlink = newImage.site;
                    discordMessage = `Product ${productName} is available! 🥳 (${newQuantity || 'unknown number of'} units available) - [BUY HERE](${hyperlink})`;

                }
                // item quantity changed
                else if ((oldImage?.available === newImage?.available) && (oldImage?.quantity !== newImage?.quantity)) {
                    console.debug('The item quantity changed.');
                    const productName = newImage?.title;
                    const hyperlink = newImage?.site;
                    if (newImage?.quantity && oldImage?.quantity) {
                        const oldQuantity = oldImage.quantity;
                        const newQuantity = newImage.quantity;
                        discordMessage = `Product ${productName} quantity changed from ${oldQuantity} to ${newQuantity}! [BUY HERE](${hyperlink})`;
                    } else {
                        discordMessage = `Product quantity changed - [BUY HERE](${hyperlink})`;
                    }
                }
                break;
            }
            case 'REMOVE': {
                // removals are not supported yet
                console.warn('Removals are not supported yet');
                if (event.dynamodb && !('NewImage' in event.dynamodb)) {
                    // do nothing
                }
                break;
            }
        }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    }catch (e: Error) {
        console.error('Error', e.message);
        throw e;
    }

    console.debug(`Set Discord message: ${discordMessage}`);

    // push notification
    await sns.publish(discordMessage);
    console.log(`Published Discord message.`);
}
