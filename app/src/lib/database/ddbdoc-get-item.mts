import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "./ddb-doc-client.mjs";

// Set the parameters.
// export const params = {
//     TableName: "TABLE_NAME",
//     /*
//     Convert the key JavaScript object you are retrieving to the
//     required Amazon DynamoDB record. The format of values specifies
//     the datatype. The following list demonstrates different
//     datatype formatting requirements:
//     String: "String",
//     NumAttribute: 1,
//     BoolAttribute: true,
//     ListAttribute: [1, "two", false],
//     MapAttribute: { foo: "bar" },
//     NullAttribute: null
//      */
//     Key: {
//         primaryKey: "VALUE", // For example, 'Season': 2.
//         // sortKey: "VALUE", // For example,  'Episode': 1; (only required if table has sort key).
//     },
// };

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

