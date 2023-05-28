import { BatchWriteCommand, BatchWriteCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "./ddb-doc-client";

export const batchPutItems = async (tableName: string, items: object[]) => {
    try {
        /**
         * This approach ensures that the total number of items from a site will not exceed the maximum limit of 25 put
         * requests that DynamoDB allows in a single BatchWriteItem operation. It splits the items into chunks of 25 and
         * sends multiple batch write requests.
         */
        const chunkSize = 25;
        for (let i = 0; i < items.length; i += chunkSize) {
            const params: BatchWriteCommandInput = {
                RequestItems: {
                    [tableName]: items.slice(i, i + chunkSize).map(item => ({
                        PutRequest: {
                            Item: item
                        }
                    }))
                }
            };
            await ddbDocClient.send(new BatchWriteCommand(params));
        }
    } catch (err) {
        console.error(`Failed batch put operation of items '${JSON.stringify(items)}' in table '${tableName}'`);
        console.error('Error', err);
    }
};
