-- ERP Kitchen schema (Supabase migration 0001)
-- camelCase identifiers are quoted everywhere to preserve frontend field names.

create table public.brands (
  "id" text primary key,
  "name" text not null,
  "color" text not null
);

create table public.customers (
  "id" integer primary key,
  "name" text not null,
  "phone" text not null,
  "email" text not null
);

create table public.ingredients (
  "id" text primary key,
  "name" text not null,
  "unit" text not null,
  "currentStock" double precision not null default 0,
  "reorderLevel" double precision not null default 0,
  "reorderQty" double precision not null default 0,
  "unitCost" double precision not null default 0,
  "supplier" text,
  "category" text,
  "isLowStock" boolean not null default false,
  "updatedAt" timestamptz not null default now(),
  "lastAdjustReason" text,
  "lastAdjustedAt" timestamptz
);

create table public.menu_items (
  "id" text primary key,
  "name" text not null,
  "brandId" text not null references public.brands ("id"),
  "brandName" text not null,
  "price" double precision not null,
  "category" text not null,
  "isActive" boolean not null default true,
  "popularity" integer not null default 0
);

create table public.recipes (
  "id" text primary key,
  "menuItemId" text not null references public.menu_items ("id"),
  "ingredients" jsonb not null default '[]'::jsonb,
  "servings" integer not null default 1,
  "version" integer not null default 1,
  unique ("menuItemId")
);

create table public.orders (
  "id" text primary key,
  "orderNumber" integer not null unique,
  "source" text not null,
  "customerName" text not null,
  "customerId" integer references public.customers ("id"),
  "phone" text,
  "items" jsonb not null default '[]'::jsonb,
  "totalAmount" double precision not null default 0,
  "status" text not null check ("status" in ('pending', 'preparing', 'ready', 'dispatched', 'cancelled')),
  "brandId" text not null references public.brands ("id"),
  "timestamps" jsonb not null,
  "prepTimeTarget" integer not null default 0,
  "updatedAt" timestamptz
);

create table public.analytics_sales (
  "id" text primary key,
  "date" text not null,
  "totalRevenue" double precision not null default 0,
  "orderCount" integer not null default 0,
  "itemsSold" jsonb not null default '[]'::jsonb
);

create table public.wastage_logs (
  "id" text primary key,
  "date" text not null,
  "ingredientId" text not null references public.ingredients ("id"),
  "quantity" double precision not null,
  "unit" text not null,
  "reason" text not null
);

-- RLS: enabled but permissive for anon (MVP parity with json-server's zero auth).
alter table public.brands enable row level security;
alter table public.customers enable row level security;
alter table public.ingredients enable row level security;
alter table public.menu_items enable row level security;
alter table public.recipes enable row level security;
alter table public.orders enable row level security;
alter table public.analytics_sales enable row level security;
alter table public.wastage_logs enable row level security;

create policy "anon all brands" on public.brands for all to anon using (true) with check (true);
create policy "anon all customers" on public.customers for all to anon using (true) with check (true);
create policy "anon all ingredients" on public.ingredients for all to anon using (true) with check (true);
create policy "anon all menu_items" on public.menu_items for all to anon using (true) with check (true);
create policy "anon all recipes" on public.recipes for all to anon using (true) with check (true);
create policy "anon all orders" on public.orders for all to anon using (true) with check (true);
create policy "anon all analytics_sales" on public.analytics_sales for all to anon using (true) with check (true);
create policy "anon all wastage_logs" on public.wastage_logs for all to anon using (true) with check (true);

-- Realtime: only orders pushes events (KDS + customer portal).
alter publication supabase_realtime add table public.orders;

create index orders_status_idx on public.orders ("status");
create index orders_customer_idx on public.orders ("customerId");
create index orders_order_number_idx on public.orders ("orderNumber");
