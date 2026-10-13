-- FreshCompare Supabase schema (Postgres)
-- Run in Supabase SQL editor.

create table if not exists stores (
  id text primary key,
  name text not null,
  color text default '#15803d',
  delivery_fee numeric default 0,
  rating numeric default 4.5
);

create table if not exists products (
  id text primary key,
  name text not null,
  category text not null,
  unit text default '',
  image text default '🛒',
  prices jsonb not null default '{}',
  previous_prices jsonb not null default '{}',
  updated_at timestamptz default now()
);

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  store text,
  total numeric,
  items jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists price_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id text references products(id),
  target_price numeric not null,
  created_at timestamptz default now()
);

-- Seed stores
insert into stores (id, name, color, delivery_fee, rating) values
 ('walmart','Walmart','#0071ce',0,4.4),
 ('kroger','Kroger','#004990',4.99,4.5),
 ('aldi','Aldi','#ff7f00',0,4.6),
 ('target','Target','#cc0000',5.99,4.3),
 ('costco','Costco','#005daa',0,4.8),
 ('wholefoods','Whole Foods','#00674a',9.99,4.2)
on conflict (id) do nothing;

-- Enable realtime for live price updates
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table shopping_lists;
