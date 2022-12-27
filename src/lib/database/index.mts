import { getItem } from "./ddbdoc-get-item.mjs";
import { putItem } from "./ddbdoc-put-item.mjs";
import { scanItems } from "./ddbdoc-scan-items.mjs";
import * as Types from './types.mjs';

export const Database = {
    getItem,
    putItem,
    scanItems,
    Types
}
