import AWS from 'aws-sdk';

export class DynamoTable {
  constructor (region, tableName, primaryKey) {
    if (!tableName || !primaryKey) {
      throw new Error('Cannot created Table without required parameters');
    }
    // Set the region where the database is deployed
    AWS.config.update({ region, apiVersion: '2012-08-10' });
    if (region === 'AWS_SAM_LOCAL') {
      AWS.config.update({ dynamodb: { endpoint: process.env.DynamoDbEndpoint } });
    }

    // Create connection outside your functions to save function process billing time (100 ms increments)
    this.docClient = new AWS.DynamoDB.DocumentClient();

    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  async _scan (params) {
    const scanResults = [];
    let items;
    do {
      items = await this.docClient.scan(params).promise();
      items.Items.forEach((item) => {
        scanResults.push(item);
      });
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    }
    while (typeof items.LastEvaluatedKey !== 'undefined');

    return scanResults;
  }

  async putItem (item) {
    console.debug(`Executing database::putItem - item '${JSON.stringify(item)}'`);

    if (!(Object.keys(item).indexOf(this.primaryKey) > -1)) {
      // Primary key not in the object
      throw new Error('Cannot put item. Primary key is missing');
    }

    const params = {
      TableName: this.tableName,
      Item: { ...item }
    };

    try {
      await this.docClient.put(params).promise();
    } catch (err) {
      console.log('Error', err);
      return err;
    } finally {
      console.debug(`Item ${item.id} has been added to the database`);
    }
  }

  async getAllItems () {
    console.debug('Executing database::getAllItems');
    const params = { TableName: this.tableName };
    return await this._scan(params);
  }

  async getOneItem (itemKeyId) {
    const params = {
      TableName: this.tableName,
      Key: {
        KEY_NAME: { S: itemKeyId }
      }
    };

    return await this._scan(params);
  }
}
