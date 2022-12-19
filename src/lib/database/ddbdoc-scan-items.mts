import { ddbDocClient } from "./ddb-doc-client.mjs";
import { ScanCommandInput, ScanCommand } from "@aws-sdk/lib-dynamodb";

export const scanItems = async (tableName: string) => {

    // Will be returned
    const scanResults: Record<string, any>[] = [];

    // Input options to send via DDB scan command
    const params: ScanCommandInput = {
        TableName: tableName
    };

    // The DDB response data to process
    let data;

    do {
        data = await ddbDocClient.send(new ScanCommand(params));
        console.log("Success :", data);
        data.Items?.forEach((item) => {
            scanResults.push(item);
        })
        params.ExclusiveStartKey = data.LastEvaluatedKey;
    }

    while (typeof data.LastEvaluatedKey !== 'undefined');

    return scanResults;
};

