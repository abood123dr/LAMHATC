create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Public can read categories'
  ) then
    create policy "Public can read categories"
    on public.categories
    for select
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'categories'
      and policyname = 'Authenticated users can manage categories'
  ) then
    create policy "Authenticated users can manage categories"
    on public.categories
    for all
    to authenticated
    using (true)
    with check (true);
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'files',
  'files',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow authenticated uploads to files'
  ) then
    create policy "Allow authenticated uploads to files"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'files');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow anonymous uploads to files'
  ) then
    create policy "Allow anonymous uploads to files"
    on storage.objects
    for insert
    to anon
    with check (
      bucket_id = 'files'
      and (storage.foldername(name))[1] = 'uploads'
      and (storage.foldername(name))[2] = 'anonymous'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow public reads from files'
  ) then
    create policy "Allow public reads from files"
    on storage.objects
    for select
    using (bucket_id = 'files');
  end if;
end $$;

do $$
begin
  if to_regclass('public.products') is not null then
    alter table public.products enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'products'
        and policyname = 'Public can read products'
    ) then
      create policy "Public can read products"
      on public.products
      for select
      using (true);
    end if;
  end if;

  if to_regclass('public.orders') is not null then
    alter table public.orders enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'orders'
        and policyname = 'Anonymous users can create orders'
    ) then
      create policy "Anonymous users can create orders"
      on public.orders
      for insert
      to anon
      with check (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'orders'
        and policyname = 'Authenticated users can create orders'
    ) then
      create policy "Authenticated users can create orders"
      on public.orders
      for insert
      to authenticated
      with check (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'orders'
        and policyname = 'Authenticated users can read orders'
    ) then
      create policy "Authenticated users can read orders"
      on public.orders
      for select
      to authenticated
      using (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'orders'
        and policyname = 'Authenticated users can update orders'
    ) then
      create policy "Authenticated users can update orders"
      on public.orders
      for update
      to authenticated
      using (true)
      with check (true);
    end if;

    begin
      alter publication supabase_realtime add table public.orders;
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end if;

  if to_regclass('public.customers') is not null then
    alter table public.customers enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'customers'
        and policyname = 'Anonymous users can create customers'
    ) then
      create policy "Anonymous users can create customers"
      on public.customers
      for insert
      to anon
      with check (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'customers'
        and policyname = 'Authenticated users can read customers'
    ) then
      create policy "Authenticated users can read customers"
      on public.customers
      for select
      to authenticated
      using (true);
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'customers'
        and policyname = 'Authenticated users can update customers'
    ) then
      create policy "Authenticated users can update customers"
      on public.customers
      for update
      to authenticated
      using (true)
      with check (true);
    end if;
  end if;

  if to_regclass('public.discount_codes') is not null then
    alter table public.discount_codes enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'discount_codes'
        and policyname = 'Public can read discount codes'
    ) then
      create policy "Public can read discount codes"
      on public.discount_codes
      for select
      using (true);
    end if;
  end if;
end $$;
