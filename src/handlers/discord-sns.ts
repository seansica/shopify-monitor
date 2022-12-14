import { ResponseError, ResponseSuccess } from "../lib/http";
import { Callback, Context } from "aws-lambda";
import { AttributeValue, DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda/trigger/dynamodb-stream";
import { EventTypes, InventoryItem, NotificationEvent } from "../types/inventory-event";

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

    // initialize placeholder
    const discordSnsEvent: NotificationEvent = {
        eventType: EventTypes.False_Positive,
        inventoryItemAfterChange: undefined,
        inventoryItemBeforeChange: undefined
    };

    try {
        switch (event.eventName) {
            case 'INSERT': {
                if (event.dynamodb && !('OldImage' in event.dynamodb)) {
                    // a new item was added
                    discordSnsEvent.eventType = EventTypes.New_Inventory;
                    discordSnsEvent.inventoryItemAfterChange = dynamoImageToInventoryItem(event.dynamodb.NewImage)
                }
                break;
            }
            case 'MODIFY': {
                if (event?.dynamodb?.OldImage !== undefined &&
                    event?.dynamodb?.NewImage !== undefined &&
                    event?.dynamodb?.OldImage?.quantity.N === 'true' &&
                    event?.dynamodb?.NewImage?.available.S === 'false') {
                    console.debug('The item changed from Available to Not Available');
                    discordSnsEvent.eventType = EventTypes.Available_to_Not_Available;
                    discordSnsEvent.inventoryItemBeforeChange = dynamoImageToInventoryItem(event.dynamodb.OldImage);
                    discordSnsEvent.inventoryItemAfterChange = dynamoImageToInventoryItem(event.dynamodb.NewImage);
                }
                if (event?.dynamodb?.OldImage !== undefined &&
                    event?.dynamodb?.NewImage !== undefined &&
                    event?.dynamodb?.OldImage?.available.S === 'false' &&
                    event?.dynamodb?.NewImage?.available.S === 'true') {
                    // the item changed from Not Available to Available, i.e. the item is back in stock
                    console.debug('The item changed from Not Available to Available');
                    discordSnsEvent.eventType = EventTypes.Not_Available_to_Available;
                    discordSnsEvent.inventoryItemBeforeChange = dynamoImageToInventoryItem(event.dynamodb.OldImage);
                    discordSnsEvent.inventoryItemAfterChange = dynamoImageToInventoryItem(event.dynamodb.NewImage);

                }
                if (event?.dynamodb?.OldImage !== undefined &&
                    event?.dynamodb?.NewImage !== undefined &&
                    event?.dynamodb?.OldImage?.quantity.S !== event?.dynamodb?.NewImage?.quantity.S) {
                    console.debug('The item quantity changed.');
                    discordSnsEvent.eventType = EventTypes.Quantity_Changed;
                    discordSnsEvent.inventoryItemBeforeChange = dynamoImageToInventoryItem(event.dynamodb.OldImage);
                    discordSnsEvent.inventoryItemAfterChange = dynamoImageToInventoryItem(event.dynamodb.NewImage);
                }
                break;
            }
            case 'REMOVE': {
                // removals are not supported yet
                console.warn('Removals are not supported yet');
                if (event.dynamodb && !('NewImage' in event.dynamodb)) {
                    discordSnsEvent.eventType = EventTypes.Item_Removed;
                    discordSnsEvent.inventoryItemBeforeChange = dynamoImageToInventoryItem(event.dynamodb.OldImage);
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

    // TODO send NotificationEvent to SNS topic
}

function dynamoImageToInventoryItem(
    image: { [key: string]: AttributeValue } | undefined
): InventoryItem {
    if (image === undefined) {
        throw new Error('The image is undefined.');
    }
    else if (
        !image.title.S ||
        !image.quantity.N ||
        !image.available.BOOL ||
        !image.site.S
    ) {
        throw new Error('An attribute from the inventory item');
    }
    return {
        title: image.title.S,
        quantity: Number(image.quantity.N),
        available: image.available.BOOL,
        site: image.site.S
    }
}
