# API Documentation

REST API served by JSON Server on port 3001. The Vite dev server proxies `/api/*` requests to `http://localhost:3001` (stripping the `/api` prefix).

**Base URL:** `http://localhost:3001`

## Authentication

None. This is a mock API for development purposes.

## Real-time Events

Socket.IO WebSocket server runs alongside the HTTP server. On any order mutation (POST/PATCH), the server broadcasts an `order:update` event to all connected clients.

```javascript
// Server emits
io.emit('order:update', {
  id: string,
  status: OrderStatus,
  orderNumber: number,
  customerId?: number,
})
```

---

## Customers

### List Customers

```
GET /customers
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by name |

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Ahmed Khan",
    "phone": "03001234567",
    "email": "ahmed.khan@email.com"
  }
]
```

---

## Ingredients

### List Ingredients

```
GET /ingredients
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by name |
| `unit` | string | Filter by unit (kg, l, etc.) |
| `category` | string | Filter by category |

**Response:** `200 OK`
```json
[
  {
    "id": "ing-001",
    "name": "Chicken Breast",
    "unit": "kg",
    "currentStock": 18,
    "reorderLevel": 5,
    "reorderQty": 10,
    "unitCost": 4.5,
    "supplier": "FarmFresh Co.",
    "category": "protein",
    "updatedAt": "2026-07-14T06:00:00Z"
  }
]
```

### Get Ingredient

```
GET /ingredients/:id
```

**Response:** `200 OK` — Single ingredient object

### Create Ingredient

```
POST /ingredients
```

**Request Body:**
```json
{
  "name": "New Ingredient",
  "unit": "kg",
  "currentStock": 10,
  "reorderLevel": 3,
  "reorderQty": 5,
  "unitCost": 2.5,
  "supplier": "Supplier Name",
  "category": "protein"
}
```

**Response:** `201 Created` — Created ingredient with auto-generated `id`

### Update Ingredient

```
PATCH /ingredients/:id
```

**Request Body:** Partial ingredient fields to update

**Response:** `200 OK` — Updated ingredient

### Delete Ingredient

```
DELETE /ingredients/:id
```

**Response:** `200 OK`

### Adjust Stock

Stock adjustment is a client-side two-step operation:

1. `GET /ingredients/:id` — read current stock
2. `PATCH /ingredients/:id` — set `currentStock` to `currentStock + delta`

**Note:** This has a race condition under concurrent access. In production, this should be an atomic server-side operation.

---

## Orders

### List Orders

```
GET /orders
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `orderNumber` | number | Filter by order number |
| `customerId` | number | Filter by customer ID |
| `status` | string | Filter by status |
| `brandId` | string | Filter by brand |
| `source` | string | Filter by source (foodpanda, careem, direct) |

**Response:** `200 OK`
```json
[
  {
    "id": "ord-001",
    "orderNumber": 2001,
    "source": "foodpanda",
    "customerName": "Ahmed Khan",
    "customerId": 1,
    "phone": "03001234567",
    "items": [
      {
        "menuItemId": "item-002",
        "name": "Chicken Biryani",
        "quantity": 2,
        "unitPrice": 14.99
      }
    ],
    "totalAmount": 34.97,
    "status": "dispatched",
    "brandId": "brand-01",
    "timestamps": {
      "placedAt": "2026-07-15T12:30:00Z",
      "startedAt": "2026-07-15T12:35:00Z",
      "readyAt": "2026-07-15T12:50:00Z",
      "dispatchedAt": "2026-07-15T12:55:00Z"
    },
    "prepTimeTarget": 20
  }
]
```

### Get Order

```
GET /orders/:id
```

**Response:** `200 OK` — Single order object

### Create Order

```
POST /orders
```

**Request Body:**
```json
{
  "source": "foodpanda",
  "customerName": "Customer Name",
  "customerId": 1,
  "phone": "03001234567",
  "items": [
    {
      "menuItemId": "item-001",
      "name": "Butter Chicken Bowl",
      "quantity": 1,
      "unitPrice": 12.99
    }
  ],
  "totalAmount": 12.99,
  "brandId": "brand-01",
  "prepTimeTarget": 15
}
```

**Response:** `201 Created` — Created order with auto-generated `id` and `orderNumber`

**Side effect:** Server broadcasts `order:update` via Socket.IO

### Update Order Status

```
PATCH /orders/:id
```

**Request Body:**
```json
{
  "status": "preparing"
}
```

**Valid statuses:** `pending`, `preparing`, `ready`, `dispatched`, `cancelled`

**Response:** `200 OK` — Updated order

**Side effect:** Server broadcasts `order:update` via Socket.IO

---

## Menu Items

### List Menu Items

```
GET /menuItems
```

**Response:** `200 OK`
```json
[
  {
    "id": "item-001",
    "name": "Butter Chicken Bowl",
    "brandId": "brand-01",
    "brandName": "Tandoori Express",
    "price": 12.99,
    "category": "mains",
    "isActive": true,
    "updatedAt": "2026-07-14T06:00:00Z"
  }
]
```

### Get Menu Item

```
GET /menuItems/:id
```

**Response:** `200 OK` — Single menu item object

### Create Menu Item

```
POST /menuItems
```

**Request Body:**
```json
{
  "name": "New Dish",
  "brandId": "brand-01",
  "brandName": "Tandoori Express",
  "price": 11.99,
  "category": "mains",
  "isActive": true
}
```

**Response:** `201 Created`

### Update Menu Item

```
PATCH /menuItems/:id
```

**Request Body:** Partial menu item fields to update

**Response:** `200 OK`

### Delete Menu Item

```
DELETE /menuItems/:id
```

**Response:** `200 OK`

---

## Recipes

### Get Recipe by Menu Item

```
GET /recipes?menuItemId=:menuItemId
```

**Response:** `200 OK` — Array (first element is the recipe, or empty array if none)
```json
[
  {
    "id": "recipe-001",
    "menuItemId": "item-001",
    "servings": 1,
    "ingredients": [
      { "ingredientId": "ing-001", "quantity": 0.2 },
      { "ingredientId": "ing-007", "quantity": 0.05 }
    ]
  }
]
```

### Create or Update Recipe (Upsert)

The client implements an upsert pattern:

1. `GET /recipes?menuItemId=:id` — check if recipe exists
2. If exists: `PATCH /recipes/:recipeId` — update
3. If not: `POST /recipes` — create

**Create Request Body:**
```json
{
  "menuItemId": "item-001",
  "servings": 1,
  "ingredients": [
    { "ingredientId": "ing-001", "quantity": 0.25 }
  ]
}
```

**Response:** `201 Created` or `200 OK`

---

## Brands

### List Brands

```
GET /brands
```

**Response:** `200 OK`
```json
[
  {
    "id": "brand-01",
    "name": "Tandoori Express",
    "color": "#E65100"
  },
  {
    "id": "brand-02",
    "name": "Wok On Fire",
    "color": "#D32F2F"
  },
  {
    "id": "brand-03",
    "name": "Pizza Piazza",
    "color": "#2E7D32"
  }
]
```

---

## Analytics

### List Daily Sales

```
GET /analytics_sales
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `start` | string | Start date (YYYY-MM-DD) |
| `end` | string | End date (YYYY-MM-DD) |

**Response:** `200 OK`
```json
[
  {
    "id": "sales-001",
    "date": "2026-07-09",
    "totalRevenue": 980,
    "orderCount": 36,
    "itemsSold": [
      { "menuItemId": "item-001", "units": 15 },
      { "menuItemId": "item-002", "units": 10 }
    ]
  }
]
```

### List Wastage Logs

```
GET /wastage_logs
```

**Response:** `200 OK`
```json
[
  {
    "id": "waste-001",
    "date": "2026-07-13",
    "ingredientName": "Spinach",
    "ingredientId": "ing-013",
    "quantity": 0.4,
    "unit": "kg",
    "reason": "wilted",
    "cost": 1.12
  }
]
```

### Create Wastage Log

```
POST /wastage_logs
```

**Request Body:**
```json
{
  "date": "2026-07-15",
  "ingredientName": "Spinach",
  "ingredientId": "ing-013",
  "quantity": 0.3,
  "unit": "kg",
  "reason": "spoiled",
  "cost": 0.84
}
```

**Response:** `201 Created`

---

## Error Responses

JSON Server returns standard HTTP error codes:

| Code | Description |
|------|-------------|
| `200` | Success |
| `201` | Created |
| `404` | Resource not found |
| `500` | Server error |

Error responses include a JSON body with `error` and `data` fields.

---

## Order Status Flow

```
pending → preparing → ready → dispatched
    ↓         ↓
cancelled  cancelled
```

| Status | Description | Timestamp Set |
|--------|-------------|---------------|
| `pending` | Order received, waiting to start | `placedAt` |
| `preparing` | Kitchen is preparing the order | `startedAt` |
| `ready` | Order is ready for pickup/dispatch | `readyAt` |
| `dispatched` | Order has been sent out | `dispatchedAt` |
| `cancelled` | Order was cancelled | — |
