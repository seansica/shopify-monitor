import {GetCommand} from "@aws-sdk/lib-dynamodb";
import {ddbDocClient} from "./ddb-doc-client.mjs";

export const getItem = async (tableName: string, primaryKey: string) => {
    try {
        const params = {
            TableName: tableName,
            Key: {
                primaryKey: primaryKey
            },
        };
        const data = await ddbDocClient.send(new GetCommand(params));
        console.log("Success :", data);
        // console.log("Success :", data.Item);
        return data;
    } catch (err) {
        console.log("Error", err);
    }
};

