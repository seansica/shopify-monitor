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
        return await ddbDocClient.send(new GetCommand(params));
    } catch (err) {
        console.log(`Failed get operation in table '${tableName}'`);
        console.log("Error", err);
    }
};

