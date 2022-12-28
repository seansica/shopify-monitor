import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "./ddb-doc-client.mjs";

export const putItem = async (tableName: string, item: object) => {
    console.log(`Attempting put operation of item '${JSON.stringify(item)}' in table '${tableName}'`);
    try {
        const params: PutCommandInput = {
            TableName: tableName,
            Item: { ...item }
        };
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log('Successfully executed PUT operation.');
        console.log('PUT Response :', data);
        return data;
    } catch (err) {
        console.log('Error', err);
    }
};

