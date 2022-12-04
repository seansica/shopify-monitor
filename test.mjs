import { writeContentToDatabase } from './src/util/database.mjs';
import AWS from 'aws-sdk';

AWS.config.update({ region: 'us-east-1' });

const tableName = 'keeb-bot-ShopifyStockTable-L064KMVC9EHC';
const item = {
  id: '123456',
  title: 'Super Keyboard',
  quantity: 1,
  available: true
};
writeContentToDatabase(tableName, item);
