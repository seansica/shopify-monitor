import { getItem } from "./ddbdoc-get-item";
import { putItem } from "./ddbdoc-put-item";
import { scanItems } from "./ddbdoc-scan-items";
import { batchPutItems } from "./ddbdoc-batch-put-items";
import * as Types from './types';

export const Database = {
    getItem,
    putItem,
    scanItems,
    batchPutItems,
    Types
}
