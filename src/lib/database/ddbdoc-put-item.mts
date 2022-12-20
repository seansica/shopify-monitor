import { PutCommand, PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "./ddb-doc-client.mjs";

export const putItem = async (tableName: string, item: object) => {
    try {
        const params: PutCommandInput = {
            TableName: tableName,
            Item: { ...item }
        };
        const data = await ddbDocClient.send(new PutCommand(params));
        console.log("Success :", data);
        // console.log("Success :", data.Item);
        return data;
    } catch (err) {
        console.log("Error", err);
    }
};

