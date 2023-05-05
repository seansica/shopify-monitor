import {PutCommand, PutCommandInput} from "@aws-sdk/lib-dynamodb";
import {ddbDocClient} from "./ddb-doc-client.mjs";

export const putItem = async (tableName: string, item: object) => {
    try {
        const params: PutCommandInput = {
            TableName: tableName,
            Item: { ...item }
        };
        return await ddbDocClient.send(new PutCommand(params));
    } catch (err) {
        console.log(`Failed put operation of item '${JSON.stringify(item)}' in table '${tableName}'`);
        console.log('Error', err);
    }
};

