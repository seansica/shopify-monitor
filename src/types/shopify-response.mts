export interface ShopifyProduct {
    "id": number; // 39757784383542,
    "title": string; // "Default Title",
    "option1": string; // "Default Title",
    "option2"?: string; // null,
    "option3"?: string; // null,
    "sku": string; // "AP-DESKMAT-PALM1968",
    "requires_shipping": boolean; // true,
    "taxable": boolean; // true,
    "featured_image"?: string; // null,
    "available": boolean; // true,
    "name": string; // "Palm Desert 1968 Suede-finish Desk Mat",
    "public_title"?: string; // null,
    "options": string[]; // ["Default Title"],
    "price": number; // 3800,
    "weight": number; // 907,
    "compare_at_price"?: number; // null,
    "inventory_quantity": number; // 4,
    "inventory_management": string; // "shopify",
    "inventory_policy": string; // "deny",
    "barcode": string; // "",
    "requires_selling_plan": boolean; // false,
    "selling_plan_allocations": Array<never>; // []

}
export interface ShopifyResponseOptions {
    "name": string; // "Title",
    "position": number; // 1,
    "values": string[]; // ["Default Title"]
}
export interface ShopifyResponse {
    "id": number; // 6644318240822,
    "title": string; // "Palm Desert 1968 Suede-finish Desk Mat",
    "handle": string; // "palm-desert-1968-suede-finish-desk-mat",
    "description": string; // "\u003cp data-mce-fragment=\"1\"\u003eWe've created a custom desk mat illustration, in midcentury modern Norbauer \u0026amp; Co. style, that pairs perfectly with the Palm Desert 1968: Retrofuturist Arabic Keyset and its theme.\u003c\/p\u003e\n\u003cp data-mce-fragment=\"1\"\u003eThese mats, like the key sets, are also limited to 150 units. Unlike a lot of keyboard desk mats on the market, ours use as their upper surface a textile with a soft nap similar in feel to the Alcantara suede used on the highest-end luxury automobiles. The edge is finished with a serger, which is dye sublimated right to the edge along with the rest of the mat.\u003cbr\u003e\u003c\/p\u003e\n\u003cp data-mce-fragment=\"1\"\u003e900mm x 400mm x 3mm\u003c\/p\u003e",
    "published_at": string; // "2021-11-04T14:49:26-07:00",
    "created_at": string; // "2021-11-04T14:22:12-07:00",
    "vendor": string; // "Norbauer \u0026 Co.",
    "type": string; //"",
    "tags": string[]; // ["stocked"],
    "price": number; // 3800,
    "price_min": number; // 3800,
    "price_max": number; // 3800,
    "available": boolean; // true,
    "price_varies": false,
    "compare_at_price"?: number; // null,
    "compare_at_price_min": number; // 0,
    "compare_at_price_max": number; // 0,
    "compare_at_price_varies": boolean; // false,
    "variants": ShopifyProduct[],
    "images": string[]; // ["\/\/cdn.shopify.com\/s\/files\/1\/1571\/5135\/products\/PalmDesert1968Illustration.jpg?v=1636060934", "\/\/cdn.shopify.com\/s\/files\/1\/1571\/5135\/products\/PalmDesert1968DeskMatCloseup_36a2f231-07c4-4605-9fd8-ecc492073d73.jpg?v=1636060934", "\/\/cdn.shopify.com\/s\/files\/1\/1571\/5135\/products\/PalmDesert1968DeskSetting_bd6e9cf7-ac33-4d49-9297-91eb39a25ede.jpg?v=1636060934"],
    "featured_image": string; // "\/\/cdn.shopify.com\/s\/files\/1\/1571\/5135\/products\/PalmDesert1968Illustration.jpg?v=1636060934",
    "options": ShopifyResponseOptions[];
    "url": string; // "\/products\/palm-desert-1968-suede-finish-desk-mat",
    "media": ShopifyResponseMediaObject[];
    "requires_selling_plan": boolean; // false,
    "selling_plan_groups": Array<never> // []
}
export interface ShopifyResponseMediaObject {
    "alt"?: string; // null,
    "id": number; // 22046560583734,
    "position": number; // 1,
    "preview_image": ShopifyMediaObjectPreviewImage;
    "aspect_ratio": number; // 2.0,
    "height": number; // 1024,
    "media_type": string; // "image",
    "src": string; // "https:\/\/cdn.shopify.com\/s\/files\/1\/1571\/5135\/products\/PalmDesert1968Illustration.jpg?v=1636060934",
    "width": number; // 2048
}
export interface ShopifyMediaObjectPreviewImage {
    "aspect_ratio": number; // 1.5,
    "height": number; // 1387,
    "width": number; // 2080,
    "src": string; // "https:\/\/cdn.shopify.com\/s\/files\/1\/1571\/5135\/products\/PalmDesert1968DeskMatCloseup_36a2f231-07c4-4605-9fd8-ecc492073d73.jpg?v=1636060934"
}
