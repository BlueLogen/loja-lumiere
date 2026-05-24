-- ============================================================
-- Basic & Bijus — Supabase Migration
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- TABELA: products
create table if not exists public.products (
  id             bigserial    primary key,
  name           text         not null,
  category       text         not null,
  price          numeric      not null,
  original_price numeric,
  image          text         not null,
  images         text[],
  description    text,
  badge          text,
  badge_color    text         default '#c9a84c',
  featured       boolean      default false,
  material       text,
  stone          text,
  sizes          text[],
  sold           integer,
  created_at     timestamptz  default now()
);

-- Habilitar leitura pública dos produtos
alter table public.products enable row level security;

create policy "Leitura pública de produtos"
  on public.products for select
  using (true);

create policy "Inserção pública de produtos"
  on public.products for insert
  with check (true);

create policy "Atualização pública de produtos"
  on public.products for update
  using (true);

create policy "Exclusão pública de produtos"
  on public.products for delete
  using (true);

-- ============================================================

-- TABELA: orders
create table if not exists public.orders (
  id                    bigserial    primary key,
  order_number          text         not null unique,
  customer_name         text,
  customer_email        text,
  customer_phone        text,
  customer_cpf          text,
  address_cep           text,
  address_street        text,
  address_number        text,
  address_complement    text,
  address_neighborhood  text,
  address_city          text,
  address_state         text,
  payment_method        text,
  payment_installments  integer      default 1,
  subtotal              numeric,
  shipping              numeric      default 0,
  total                 numeric,
  items                 jsonb,
  status                text         default 'confirmado',
  created_at            timestamptz  default now()
);

-- Habilitar RLS e permitir inserção pública de pedidos
alter table public.orders enable row level security;

create policy "Inserção pública de pedidos"
  on public.orders for insert
  with check (true);

create policy "Leitura pública de pedidos"
  on public.orders for select
  using (true);
