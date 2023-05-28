import { ResponseError, ResponseSuccess } from "../../plugins/http";
import { Callback, Context } from "aws-lambda";
import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda/trigger/dynamodb-stream";
import { MySQSClient } from "../../plugins/sqs";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const region = process.env.Region ? process.env.Region : 'us-east-1';
const queueUrl = process.env.QUEUE_URL;

if (!region) {
    throw new Error('process.env.Region must be defined.');
}
if (!queueUrl) {
    throw new Error('process.env.QUEUE_URL must be defined.');
}

const sqs = new MySQSClient(queueUrl);

export const handler = async (event: DynamoDBStreamEvent, context: Context, callback: Callback) => {
    // All log statements are written to CloudWatch
    console.info('Received event:', JSON.stringify(event));
    try {
        for (const dbRecord of event.Records) {
            await processInventoryUpdate(dbRecord);
        }
        callback(undefined, new ResponseSuccess());
    } catch (err: unknown) {
        console.error(err);
        callback(new ResponseError());
    }
}

async function processInventoryUpdate (event: DynamoDBRecord) {

    if (!event.dynamodb) {
        return;
    }

    let discordMessage = '';
    let oldImage;
    let newImage;

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
                    discordMessage = `New product ([${productName}](${hyperlink})) appeared! 🚨`;
                }
                break;
            }
            case 'MODIFY': {
                console.debug('Processing MODIFY event.');

                // Unmarshall both the old and new images

                // @ts-ignore
                oldImage = unmarshall(event.dynamodb.OldImage);
                // @ts-ignore
                newImage = unmarshall(event.dynamodb.NewImage);

                console.debug(`Unmarshalled old image - '${JSON.stringify(oldImage)}'`);
                console.debug(`Unmarshalled new image - '${JSON.stringify(newImage)}'`);

                // Process a Discord message based on whether the item went out of stock, is back in stock, or the
                // quantity available just changed

                // item is out of stock
                if (oldImage?.available === true && newImage?.available === false) {
                    console.debug('The item changed from Available to Not Available');
                    const productName = newImage.title;
                    const hyperlink = newImage.site;
                    discordMessage = `Product ([${productName}](${hyperlink})) is no longer available...☹️`;
                }
                // item is back in stock
                else if (oldImage?.available === false && newImage?.available === true) {
                    console.debug('The item changed from Not Available to Available');
                    const productName = newImage.title;
                    const newQuantity = newImage.quantity;
                    const hyperlink = newImage.site;
                    discordMessage = `Product ([${productName}](${hyperlink})) is available! 🥳 (${newQuantity || 'unknown number of'} units available)`;

                }
                // item quantity changed
                else if ((oldImage?.available === newImage?.available) && (oldImage?.quantity !== newImage?.quantity)) {
                    console.debug('The item quantity changed.');
                    const productName = newImage?.title;
                    const hyperlink = newImage?.site;
                    if (newImage?.quantity && oldImage?.quantity) {
                        const oldQuantity = oldImage.quantity;
                        const newQuantity = newImage.quantity;
                        discordMessage = `Product ([${productName}](${hyperlink})) quantity changed from ${oldQuantity} to ${newQuantity}!`;
                    } else {
                        discordMessage = `Product ([${productName}](${hyperlink})) quantity changed.`;
                    }
                }
                break;
            }
            case 'REMOVE': {
                console.debug('Processing REMOVE event.');

                if (event.dynamodb && !('OldImage' in event.dynamodb)) {
                    // do nothing - there is something wrong
                    // OldImage should always be present in removals
                    break;
                }

                // Unmarshall the old image

                // @ts-ignore
                oldImage = unmarshall(event.dynamodb.OldImage);

                console.debug(`Unmarshalled old image - '${JSON.stringify(oldImage)}'`);

                const productName = oldImage.title;
                const hyperlink = oldImage.site;

                discordMessage = `Product ([${productName}](${hyperlink})) has been removed from the store...☹️`;
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

    // @ts-ignore
    await sqs.publish(discordMessage, 'default');
    console.log(`Published Discord message.`);
}
