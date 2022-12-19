import { ResponseError, ResponseSuccess } from "../lib/http.mjs";
import { Callback, Context } from "aws-lambda";
import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda/trigger/dynamodb-stream";
import { SimpleNotificationService } from "../lib/sns.mjs";

const region = process.env.Region ? process.env.Region : 'us-east-1';
const topicArn = process.env.TOPIC_ARN;

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

    if (!region) {
        throw new Error('region must be defined.');
    }
    if (!topicArn) {
        throw new Error('topicArn must be defined.');
    }

    let discordMessage = '';

    const oldImage = event.dynamodb.OldImage;
    const newImage = event.dynamodb.NewImage;

    try {
        switch (event.eventName) {
            case 'INSERT': {
                if (newImage != undefined) {
                    // new item was added
                    const productName = newImage.title.S;
                    const hyperlink = newImage.site.S;
                    discordMessage = `A new product (${productName}) appeared! 🚨 Go check it out! [LINK](${hyperlink}`;
                }
                break;
            }
            case 'MODIFY': {
                // item is out of stock
                if (oldImage?.quantity.N === 'true' &&
                    newImage?.available.S === 'false') {
                    console.debug('The item changed from Available to Not Available');
                    const productName = newImage.title.S;
                    const hyperlink = newImage.site.S;
                    discordMessage = `Product ${productName} is no longer available...☹️ [LINK](${hyperlink})️`;
                }
                // item is back in stock
                else if (oldImage?.available.S === 'false' &&
                    newImage?.available.S === 'true') {
                    console.debug('The item changed from Not Available to Available');
                    const productName = newImage.title.S;
                    const newQuantity = newImage.quantity.N;
                    const hyperlink = newImage.site.S;
                    discordMessage = `Product ${productName} is available! 🥳 (${newQuantity || 'unknown number of'} units available) - [BUY HERE](${hyperlink})`;

                }
                // item quantity changed
                else if (oldImage?.quantity.S !== newImage?.quantity.S) {
                    console.debug('The item quantity changed.');
                    const productName = newImage?.title.S;
                    const hyperlink = newImage?.site.S;
                    if (newImage?.quantity.S && oldImage?.quantity.S) {
                        const oldQuantity = oldImage.quantity.N;
                        const newQuantity = newImage.quantity.N;
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
    // push notification
    const sns = new SimpleNotificationService(region, topicArn);
    return await sns.publish(discordMessage);
}
