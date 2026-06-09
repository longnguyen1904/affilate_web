export interface Product {
    id: string;
    name: string;
    category: 'thoi-trang' | 'my-pham';
    sub_category?: string;
    price: number;
    image_url: string;
    affiliate_link: string;
    created_at?: string;
}

export interface ClickLog {
    id: string;
    product_id: string;
    clicked_at: string;
    products?: {
        name: string;
    };
}

export interface Statistics {
    today: number;
    week: number;
    month: number;
}

export interface TopProductStat {
    name: string;
    count: number;
}