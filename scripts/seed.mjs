#!/usr/bin/env node
// One-time seed: loads db.json into Supabase, preserving all string IDs.
// Run AFTER supabase/migrations/0001_erp_kitchen_init.sql:
//   node scripts/seed.mjs
// Idempotent: wipes tables (reverse FK order) then inserts.

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const env = readFileSync(resolve(root, '.env.local'), 'utf8')
const getEnv = (key) => env.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim()

const URL = getEnv('VITE_SUPABASE_URL')
const KEY = getEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
if (!URL || !KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')
  process.exit(1)
}

const db = JSON.parse(readFileSync(resolve(root, 'db.json'), 'utf8'))

// Columns that exist in the Supabase schema (extra fixture fields are dropped).
const TABLES = [
  ['brands', 'brands', ['id', 'name', 'color']],
  ['customers', 'customers', ['id', 'name', 'phone', 'email']],
  ['ingredients', 'ingredients', [
    'id', 'name', 'unit', 'currentStock', 'reorderLevel', 'reorderQty', 'unitCost',
    'supplier', 'category', 'isLowStock', 'updatedAt', 'lastAdjustReason', 'lastAdjustedAt',
  ]],
  ['menuItems', 'menu_items', [
    'id', 'name', 'brandId', 'brandName', 'price', 'category', 'isActive', 'popularity',
  ]],
  ['recipes', 'recipes', ['id', 'menuItemId', 'ingredients', 'servings', 'version']],
  ['orders', 'orders', [
    'id', 'orderNumber', 'source', 'customerName', 'customerId', 'phone', 'items',
    'totalAmount', 'status', 'brandId', 'timestamps', 'prepTimeTarget', 'updatedAt',
  ]],
  ['analytics_sales', 'analytics_sales', ['id', 'date', 'totalRevenue', 'orderCount', 'itemsSold']],
  ['wastage_logs', 'wastage_logs', ['id', 'date', 'ingredientId', 'quantity', 'unit', 'reason']],
]

const EXPECTED = {
  brands: 3,
  customers: 10,
  ingredients: 25,
  menu_items: 12,
  recipes: 12,
  orders: 15,
  analytics_sales: 6,
  wastage_logs: 4,
}

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

async function wipe(table) {
  const res = await fetch(`${URL}/rest/v1/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers,
  })
  if (!res.ok) throw new Error(`Wipe ${table} failed (${res.status}): ${await res.text()}`)
}

async function insert(table, rows) {
  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    throw new Error(`Insert into ${table} failed (${res.status}): ${await res.text()}`)
  }
}

async function count(table) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=id`, {
    headers: { ...headers, Range: '0-0', Prefer: 'count=exact' },
  })
  if (!res.ok) throw new Error(`Count ${table} failed (${res.status}): ${await res.text()}`)
  const match = res.headers.get('content-range')?.match(/\/(\d+)$/)
  return match ? Number(match[1]) : null
}

function pick(row, columns) {
  const out = {}
  for (const col of columns) {
    // Uniform keys across rows — PostgREST bulk insert rejects mixed key sets.
    // Only nullable columns may be missing from a fixture row (orders.customerId/phone).
    out[col] = row[col] !== undefined ? row[col] : null
  }
  return out
}

async function main() {
  // Wipe in reverse FK order so dependents go first.
  for (const [, table] of [...TABLES].reverse()) {
    await wipe(table)
  }
  console.log('✓ wiped existing rows')

  for (const [source, table, columns] of TABLES) {
    const rows = db[source]
    if (!Array.isArray(rows) || rows.length === 0) {
      console.error(`db.json has no rows for "${source}"`)
      process.exit(1)
    }
    await insert(table, rows.map((r) => pick(r, columns)))
    console.log(`✓ ${table}: inserted ${rows.length}`)
  }

  console.log('\nVerifying row counts…')
  let ok = true
  for (const [table, expected] of Object.entries(EXPECTED)) {
    const actual = await count(table)
    const pass = actual === expected
    ok = ok && pass
    console.log(`${pass ? '✓' : '✗'} ${table}: ${actual} (expected ${expected})`)
  }

  if (!ok) {
    console.error('\nSeed verification FAILED')
    process.exit(1)
  }
  console.log('\nSeed complete and verified.')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
