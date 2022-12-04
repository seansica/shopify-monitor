import AWS from 'aws-sdk';

// Set the region where the database is deployed
AWS.config.update({ region: process.env.Region, apiVersion: '2012-08-10' });
if (process.env.AWS_SAM_LOCAL) AWS.config.update({ dynamodb: { endpoint: process.env.DynamoDbEndpoint } });

// Create connection outside of your functions to save
// function process billing time (100 ms increments)
const docClient = new AWS.DynamoDB.DocumentClient();

/**
 * A simple function to write/put an object to a DynamoDB table
 * @param {*} tableName The name of the DynamoDB table
 * @param {*} item An object with properties: 'id', 'title', 'available', and 'quantity'
 * @returns
 */
export async function writeContentToDatabase (tableName, item) {
  console.debug(`Executing database::writeContentToDatabase - item '${JSON.stringify(item)}'`);

  // do not process put request if required fields are not present
  if (!('id' in item) ||
        !('title' in item) ||
        !('available' in item) ||
        !('quantity' in item) ||
        !('site' in item)
  ) {
    console.warn('Cannot put item because a property is missing');
    return;
  }

  const { id, title, available, quantity, site } = item;

  const params = {
    TableName: tableName,
    Item: { id, title, available, quantity, site }
  };

  try {
    await docClient.put(params).promise();
  } catch (err) {
    console.log('Error', err);
    return err;
  } finally {
    console.debug(`Item ${item.id} has been added to the database`);
  }
}

export async function getAllItems (tableName) {
  console.debug('Executing database::getContentFromDatabase');

  const params = {
    TableName: tableName
  };

  const scanResults = [];
  let items;
  do {
    items = await docClient.scan(params).promise();
    items.Items.forEach((item) => {
      scanResults.push(item);
    });
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  }
  while (typeof items.LastEvaluatedKey !== 'undefined');

  return scanResults;

  //   try {
  //     const scanResults = [];
  //     const data = await docClient.scan(params).promise();
  //     data?.Items.forEach((item) => scanResults.push(item));

//     console.debug(`Items received: '${JSON.stringify(scanResults)}'`);
//     return scanResults;
//   } catch (err) {
//     console.error('Error', err);
//   }
}
