# Customer Portal — Order Management Plan

## Goal
Add order management capabilities to the customer portal (`/portal`) so users can select, edit, and cancel their orders, while retaining order search functionality.

---

## Files to Modify

### 1. `src/types/api.ts`
Add `update` and `delete` methods to the `orders` type definition.

### 2. `src/api/client.ts`
Implement:
- `api.orders.update(id, data)` — `PATCH /orders/:id` with full order payload
- `api.orders.delete(id)` — `DELETE /orders/:id`

### 3. `server.js`
Handle `DELETE` on orders and broadcast `order:update` via WebSocket so the KDS gets live updates when orders are cancelled from the portal.

---

## New Files

### 4. `src/modules/order-status/composables/useOrderMutations.ts`
Composable with four mutations:
- `useUpdateOrder()` — full order edit (items, totalAmount, etc.)
- `useCancelOrder()` — set status to `cancelled`
- `useBatchCancelOrders()` — cancel multiple selected orders in parallel

### 5. `src/modules/order-status/components/OrderEditDialog.vue`
Dialog modal for editing an order:
- Lists current items with quantity controls (+/−)
- Delete individual line items
- Add new items from a menu items selector
- Auto-recalculates `totalAmount`
- Edit special instructions per item
- Save / Cancel buttons
- Follows the same pattern as `IngredientForm.vue`

### 6. `src/modules/order-status/views/CustomerPortal.vue` (major update)

| Feature | Implementation |
|---|---|
| **Search** | Client-side filter by order number, item name, status |
| **Selection** | `ref<string[]>` of selected IDs; checkbox on each card |
| **Select All** | Toggle checkbox in header bar |
| **Batch action bar** | Appears when items selected; shows count + "Cancel Selected" button |
| **Action dropdown** | Three-dot menu per card with Edit and Cancel options |
| **Edit dialog** | Opens `OrderEditDialog` for the selected order |
| **Cancel flow** | `ConfirmDialog` → `cancelOrder()` mutation → toast notification |

---

## Design Patterns

- Vue 3 `<script setup>` + Composition API
- TanStack Vue Query mutations with cache invalidation
- PrimeVue components: Dialog, Button, Checkbox, InputNumber, Select, ConfirmDialog, InputText, IconField
- Toast notifications via `useSnackbar`
- Consistent styling with existing portal (card-based layout, same spacing/typography)
