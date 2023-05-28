/**
 * https://shopify.dev/api/liquid/objects/media
 */
export interface Media {
    alt?: string;
    id?: number;
    position?: number;
    preview_image?: Image;
    aspect_ratio?: number;
    height?: number;
    media_type?: string;
    src?: string;
    width?: number;
}

/**
 * https://shopify.dev/api/liquid/objects/image
 */
export interface Image {
    aspect_ratio?: number;
    height?: number;
    width?: number;
    src?: string;
}


/**
 * https://shopify.dev/api/liquid/objects/variant
 */
export interface Variant {
    name?: string;
    available?: boolean,
    barcode?: string,
    compare_at_price?: number,
    featured_image?: Image, // https://shopify.dev/api/liquid/objects/image
    featured_media?: Media, // https://shopify.dev/api/liquid/objects/media
    id?: number,
    image?: Image, // https://shopify.dev/api/liquid/objects/image
    incoming?: false,
    inventory_management?: string,
    inventory_policy?: string,
    inventory_quantity?: number,
    matched?: boolean,
    metafields?: never,
    next_incoming_date?: string,
    option1?: string,
    option2?: string,
    option3?: string,
    options?: string[],
    price?: number,
    product?: Product,
    requires_selling_plan?: boolean,
    requires_shipping?: boolean,
    selected?: boolean,
    selected_selling_plan_allocation: null,
    selling_plan_allocations?: never[], // https://shopify.dev/api/liquid/objects/selling_plan_allocation
    sku?: string,
    store_availabilities?: StoreAvailability[],
    taxable?: boolean,
    title?: string,
    unit_price?: number,
    unit_price_measurement?: never,
    url?: string,
    weight?: number,
    weight_in_unit?: number,
    weight_unit?: string
}

/**
 * https://shopify.dev/api/liquid/objects/product
 */
export interface Product {
    available?: boolean,
    collections?: never[], // https://shopify.dev/api/liquid/objects/collection
    compare_at_price?: number,
    compare_at_price_max?: number,
    compare_at_price_min?: number,
    compare_at_price_varies?: boolean,
    content?: string,
    created_at?: string,
    description?: string,
    featured_image?: Image,
    featured_media?: Media,
    first_available_variant?: Variant,
    gift_card?: boolean,
    handle?: string,
    has_only_default_variant?: boolean,
    id?: number,
    images?: Image[],
    media?: Media[],
    metafields?: never,
    options?: string[],
    options_by_name?: string,
    options_with_values?: never[], // ProductOption[] <-- https://shopify.dev/api/liquid/objects/product_option
    price?: number,
    price_max?: number,
    price_min?: number,
    price_varies?: boolean,
    published_at?: string,
    requires_selling_plan?: boolean,
    selected_or_first_available_selling_plan_allocation?: SellingPlanAllocation,
    selected_or_first_available_variant?: Variant,
    selected_selling_plan?: never, // SellingPlan <-- https://shopify.dev/api/liquid/objects/selling_plan
    selected_selling_plan_allocation?: SellingPlanAllocation,
    selected_variant?: Variant,
    selling_plan_groups?: never[], // SellingPlanGroup[] <-- https://shopify.dev/api/liquid/objects/selling_plan_group
    tags?: string[],
    template_suffix?: string,
    title?: string,
    type?: string,
    url?: string,
    variants?: Variant[],
    vendor?: string
}

/**
 * https://shopify.dev/api/liquid/objects/selling_plan_allocation
 */
export interface SellingPlanAllocation {
    checkout_charge_amount?: number,
    compare_at_price?: number,
    per_delivery_price?: number,
    price: number,
    price_adjustments?: never[], // https://shopify.dev/api/liquid/objects/selling_plan_allocation_price_adjustment
    remaining_balance_charge_amount?: number,
    selling_plan?: never, // https://shopify.dev/api/liquid/objects/selling_plan
    selling_plan_group_id?: string,
    unit_price?: number
}


/**
 * https://shopify.dev/api/liquid/objects/store_availability
 */
export interface StoreAvailability {
    available?: boolean;
    location?: ShopifyLocation;
    pick_up_enabled?: boolean;
    pick_up_time?: string;
}

/**
 * https://shopify.dev/api/liquid/objects/location
 */
export interface ShopifyLocation {
    address?: Address;
    id?: number;
    latitude?: number;
    longitude?: number;
    metafields?: never;
    name?: string;
}

/**
 * https://shopify.dev/api/liquid/objects/address
 */
export interface Address {
    address1: string,
    address2: string,
    city: string,
    company: string,
    country: Country,
    country_code: string,
    first_name: string,
    id: number,
    last_name: string,
    name: string,
    phone: string,
    province: string,
    province_code: string,
    street: string,
    summary: string,
    url: string,
    zip: string
}

/**
 * https://shopify.dev/api/liquid/objects/country
 */
export interface Country {
    currency: Currency;
    iso_code: string;
    name?: string;
    unit_system?: UnitSystem
}

/**
 * https://shopify.dev/api/liquid/objects/country#country-unit_system
 */
export enum UnitSystem {
    imperial = "imperial",
    metric = "metric"
}

/**
 * https://shopify.dev/api/liquid/objects/currency
 */
export interface Currency {
    iso_code?: string;
    name?: string;
    symbol?: string;
}

export interface ProductsListResponse {
    products: Array<{
        id: number;
        handle: string;
    }>;
}

export interface ProductHandle {
    id: number;
    handle: string;
}
