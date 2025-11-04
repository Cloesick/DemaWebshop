module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/dema-webshop/src/lib/products.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getProductBySku",
    ()=>getProductBySku,
    "getProductCategories",
    ()=>getProductCategories,
    "getProducts",
    ()=>getProducts,
    "getProductsByCategory",
    ()=>getProductsByCategory,
    "getUniqueProductCategories",
    ()=>getUniqueProductCategories,
    "searchProducts",
    ()=>searchProducts
]);
// Cache for products data
let productsCache = null;
async function getProducts(filters) {
    // Load data if not in cache
    if (!productsCache) {
        try {
            // In development, fetch from public folder
            // In production, this should be an API route
            const isDev = ("TURBOPACK compile-time value", "development") === 'development';
            const url = ("TURBOPACK compile-time truthy", 1) ? '/data/Product_pdfs_analysis_v2.json' : "TURBOPACK unreachable";
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                cache: 'no-store'
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();
            // Handle both direct array response and { products } response
            const productsArray = Array.isArray(data) ? data : data.products || [];
            if (!Array.isArray(productsArray)) {
                console.error('Expected an array of products but got:', typeof data);
                return [];
            }
            // Transform and cache the data
            productsCache = productsArray.map((item, index)=>({
                    // Use product_id if available, otherwise generate a unique ID based on index
                    sku: item.sku || item.product_id || `product-${index}`,
                    name: item.name || '',
                    description: item.description || '',
                    product_category: item.product_category || '',
                    pdf_source: item.pdf_source || '',
                    source_pages: Array.isArray(item.source_pages) ? item.source_pages : [],
                    price: typeof item.price === 'number' ? item.price : 0,
                    power_kw: typeof item.power_kw === 'number' ? item.power_kw : 0,
                    power_hp: typeof item.power_hp === 'number' ? item.power_hp : 0,
                    voltage_v: typeof item.voltage_v === 'number' ? item.voltage_v : 0,
                    flow_l_min: typeof item.flow_l_min === 'number' ? item.flow_l_min : 0,
                    pressure_max_bar: typeof item.pressure_max_bar === 'number' ? item.pressure_max_bar : 0,
                    pressure_min_bar: typeof item.pressure_min_bar === 'number' ? item.pressure_min_bar : 0,
                    dimensions_mm: item.dimensions_mm || {},
                    weight_kg: typeof item.weight_kg === 'number' ? item.weight_kg : 0,
                    in_stock: item.in_stock !== false,
                    rating: typeof item.rating === 'number' ? item.rating : 0,
                    review_count: typeof item.review_count === 'number' ? item.review_count : 0,
                    // Add any additional fields that might be in your data
                    ...item
                }));
        } catch (error) {
            console.error('Error loading product data:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            } else {
                console.error('Unknown error occurred:', error);
            }
            return [];
        }
    }
    let products = productsData.map((item, index)=>({
            // Use product_id if available, otherwise generate a unique ID based on index
            sku: item.product_id || `product-${index}`,
            pdf_source: item.pdf_source || '',
            source_pages: item.source_pages || [],
            product_category: item.product_category || 'Uncategorized',
            description: item.description || '',
            pressure_max_bar: item.pressure_max_bar,
            dimensions_mm_list: item.dimensions_mm_list || [],
            length_mm: item.length_m,
            // Map any additional fields that might be in your Product type
            ...item.weight_kg && {
                weight_kg: item.weight_kg
            }
        }));
    // Apply filters if provided
    if (filters) {
        if (filters.category) {
            products = products.filter((product)=>product.product_category?.toLowerCase() === filters.category?.toLowerCase());
        }
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            products = products.filter((product)=>product.sku.toLowerCase().includes(query) || product.description.toLowerCase().includes(query) || product.product_category?.toLowerCase().includes(query));
        }
    // Add more filters as needed
    }
    return products;
}
async function getProductBySku(sku) {
    const products = await getProducts();
    return products.find((product)=>product.sku === sku);
}
async function getUniqueProductCategories() {
    const products = await getProducts();
    const categories = new Set();
    products.forEach((product)=>{
        if (product.product_category) {
            categories.add(product.product_category);
        }
    });
    return Array.from(categories).sort();
}
async function getProductsByCategory(category) {
    const products = await getProducts();
    return products.filter((p)=>p.product_category === category);
}
async function searchProducts(query) {
    const products = await getProducts();
    const q = query.toLowerCase();
    return products.filter((p)=>p.product_category?.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
}
async function getProductCategories() {
    const products = await getProducts();
    const categories = new Set();
    products.forEach((product)=>{
        if (product.product_category) {
            categories.add(product.product_category);
        }
    });
    return Array.from(categories).sort();
}
}),
"[project]/dema-webshop/src/app/api/products/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$dema$2d$webshop$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dema-webshop/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$dema$2d$webshop$2f$src$2f$lib$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/dema-webshop/src/lib/products.ts [app-route] (ecmascript)");
;
;
// Helper function to parse query parameters with type safety
function parseQueryParams(params) {
    const getParam = (key, type = 'string', defaultValue)=>{
        const value = params.get(key);
        if (value === null) return defaultValue;
        try {
            switch(type){
                case 'number':
                    {
                        const num = parseFloat(value);
                        return isNaN(num) ? defaultValue : num;
                    }
                case 'boolean':
                    return value === 'true';
                default:
                    return value;
            }
        } catch (error) {
            console.warn(`Failed to parse ${key} as ${type}:`, value);
            return defaultValue;
        }
    };
    return {
        // Category and search
        category: getParam('category'),
        searchTerm: getParam('searchTerm') || getParam('q'),
        // Price range
        minPrice: getParam('minPrice', 'number'),
        maxPrice: getParam('maxPrice', 'number'),
        // Technical filters
        minPower: getParam('minPower', 'number'),
        maxPower: getParam('maxPower', 'number'),
        minPressure: getParam('minPressure', 'number'),
        maxPressure: getParam('maxPressure', 'number'),
        // Pagination
        limit: Math.min(100, Math.max(1, getParam('limit', 'number') || 24)),
        skip: Math.max(0, getParam('skip', 'number') || 0),
        // Sorting
        sortBy: getParam('sortBy') || 'name',
        sortOrder: getParam('sortOrder') || 'asc'
    };
}
// Helper function to check if a string contains a search term (case-insensitive)
function matchesSearch(text, searchTerm) {
    if (!text) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
}
// Helper function to filter products based on the provided filters
function filterProducts(products, filters) {
    if (!products || !Array.isArray(products)) {
        console.warn('No products array provided to filterProducts');
        return [];
    }
    return products.filter((product)=>{
        // Filter by category (exact match)
        if (filters.category && product.product_category !== filters.category) {
            return false;
        }
        // Filter by price range
        const productPrice = product.price || 0;
        if (filters.minPrice !== undefined && productPrice < filters.minPrice) {
            return false;
        }
        if (filters.maxPrice !== undefined && productPrice > filters.maxPrice) {
            return false;
        }
        // Filter by power range (kW)
        const productPower = product.power_kw || 0;
        if (filters.minPower !== undefined && productPower < filters.minPower) {
            return false;
        }
        if (filters.maxPower !== undefined && productPower > filters.maxPower) {
            return false;
        }
        // Filter by pressure range (bar)
        const maxPressure = product.pressure_max_bar || 0;
        const minPressure = product.pressure_min_bar || 0;
        if (filters.minPressure !== undefined && maxPressure < filters.minPressure) {
            return false;
        }
        if (filters.maxPressure !== undefined && minPressure > filters.maxPressure) {
            return false;
        }
        // Search in multiple fields (case-insensitive)
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            // Check multiple fields for search matches
            const searchFields = [
                product.name,
                product.description,
                product.sku,
                product.product_category
            ];
            // Check if any field contains the search term
            const hasMatch = searchFields.some((field)=>field && field.toString().toLowerCase().includes(searchLower));
            if (!hasMatch) {
                return false;
            }
        }
        return true;
    });
}
// Helper function to sort products
function sortProducts(products, sortBy, sortOrder) {
    return [
        ...products
    ].sort((a, b)=>{
        let valueA = a[sortBy];
        let valueB = b[sortBy];
        // Handle undefined/null values
        if (valueA === undefined || valueA === null) valueA = '';
        if (valueB === undefined || valueB === null) valueB = '';
        // Convert to string for comparison if needed
        const strA = String(valueA).toLowerCase();
        const strB = String(valueB).toLowerCase();
        // Compare based on sort order
        return sortOrder === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = parseQueryParams(searchParams);
        console.log('Fetching products with filters:', JSON.stringify(filters, null, 2));
        // Load products from the data source
        const allProducts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$dema$2d$webshop$2f$src$2f$lib$2f$products$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProducts"])();
        // Apply filters
        const filteredProducts = filterProducts(allProducts, filters);
        // Apply sorting
        const sortedProducts = sortProducts(filteredProducts, filters.sortBy || 'name', filters.sortOrder || 'asc');
        // Apply pagination
        const page = Math.floor((filters.skip || 0) / (filters.limit || 24)) + 1;
        const limit = filters.limit || 24;
        const skip = (page - 1) * limit;
        const total = sortedProducts.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedProducts = sortedProducts.slice(skip, skip + limit);
        // Prepare the response
        const response = {
            products: paginatedProducts,
            total,
            page,
            limit,
            totalPages,
            hasMore: skip + limit < total,
            filters
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$dema$2d$webshop$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(response);
    } catch (error) {
        console.error('Error in /api/products:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dema$2d$webshop$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to fetch products',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? error.message : 'Unknown error',
            ...("TURBOPACK compile-time value", "development") === 'development' && {
                stack: error instanceof Error ? error.stack : undefined
            }
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const product = await request.json();
        // In a real app, you would save the product to a database here
        return __TURBOPACK__imported__module__$5b$project$5d2f$dema$2d$webshop$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(product, {
            status: 201
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$dema$2d$webshop$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to create product',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__cff62269._.js.map