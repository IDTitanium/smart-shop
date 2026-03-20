-- =============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- =============================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Create the products table
create table products (
  id bigint primary key generated always as identity,
  name text not null,
  description text not null,
  price numeric(10,2) not null,
  rating numeric(2,1) default 0,
  reviews_count integer default 0,
  category text not null,
  image_url text,
  is_prime boolean default false,
  tags jsonb default '[]'::jsonb,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Create HNSW index for fast cosine similarity search
create index products_embedding_idx
  on products
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- 4. Full-text search index for hybrid mode
create index products_fts_idx
  on products
  using gin (to_tsvector('english', name || ' ' || description));

-- 5. Enable Row Level Security (Supabase best practice)
alter table products enable row level security;

-- Public read access (anyone can search/view products)
create policy "Products are publicly readable"
  on products for select
  using (true);

-- Only authenticated service role can insert/update/delete
create policy "Service role can manage products"
  on products for all
  using (auth.role() = 'service_role');


-- =============================================================
-- 6. RPC Function: Semantic search
--    Called via supabase.rpc('search_products', { ... })
-- =============================================================
create or replace function search_products(
  query_embedding vector(1536),
  match_count int default 20,
  max_distance float default 0.5
)
returns table (
  id bigint,
  name text,
  description text,
  price numeric,
  rating numeric,
  reviews_count integer,
  category text,
  image_url text,
  is_prime boolean,
  tags jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      p.id,
      p.name,
      p.description,
      p.price,
      p.rating,
      p.reviews_count,
      p.category,
      p.image_url,
      p.is_prime,
      p.tags,
      (1 - (p.embedding <=> query_embedding))::float as similarity
    from products p
    where p.embedding is not null
      and (p.embedding <=> query_embedding) < max_distance
    order by p.embedding <=> query_embedding
    limit match_count;
end;
$$;


-- =============================================================
-- 7. RPC Function: Hybrid search (semantic + keyword)
-- =============================================================
create or replace function hybrid_search_products(
  query_embedding vector(1536),
  query_text text,
  match_count int default 20,
  semantic_weight float default 0.7,
  keyword_weight float default 0.3
)
returns table (
  id bigint,
  name text,
  description text,
  price numeric,
  rating numeric,
  reviews_count integer,
  category text,
  image_url text,
  is_prime boolean,
  tags jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      p.id,
      p.name,
      p.description,
      p.price,
      p.rating,
      p.reviews_count,
      p.category,
      p.image_url,
      p.is_prime,
      p.tags,
      (
        semantic_weight * (1 - (p.embedding <=> query_embedding)) +
        keyword_weight * coalesce(
          ts_rank_cd(
            to_tsvector('english', p.name || ' ' || p.description),
            plainto_tsquery('english', query_text)
          ),
          0
        )
      )::float as similarity
    from products p
    where p.embedding is not null
    order by similarity desc
    limit match_count;
end;
$$;


-- =============================================================
-- 8. RPC Function: Find similar products
-- =============================================================
create or replace function similar_products(
  product_id bigint,
  match_count int default 6
)
returns table (
  id bigint,
  name text,
  description text,
  price numeric,
  rating numeric,
  reviews_count integer,
  category text,
  image_url text,
  is_prime boolean,
  tags jsonb,
  similarity float
)
language plpgsql
as $$
declare
  target_embedding vector(1536);
begin
  select p.embedding into target_embedding
    from products p
    where p.id = product_id;

  if target_embedding is null then
    return;
  end if;

  return query
    select
      p.id,
      p.name,
      p.description,
      p.price,
      p.rating,
      p.reviews_count,
      p.category,
      p.image_url,
      p.is_prime,
      p.tags,
      (1 - (p.embedding <=> target_embedding))::float as similarity
    from products p
    where p.id != product_id
      and p.embedding is not null
    order by p.embedding <=> target_embedding
    limit match_count;
end;
$$;