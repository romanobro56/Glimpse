-- Living Map: schema for places and dated contributions ("what they used to be")
-- Run this in the Supabase SQL editor (https://app.supabase.com -> your project -> SQL).

-- A physical location on the map. Identified (when possible) by its Google place_id
-- so we never create duplicates for the same establishment.
create table if not exists places (
  id              uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name            text not null,
  address         text,
  lat             double precision not null,
  lng             double precision not null,
  created_at      timestamptz not null default now()
);

-- A single dated memory / record for a place. The very first contribution for a
-- place is auto-created with is_current = true, dated "now", titled with the
-- current Google establishment name. Every later contribution is authored by a
-- person and carries the exact date the memory is about.
create table if not exists contributions (
  id                uuid primary key default gen_random_uuid(),
  place_id          uuid not null references places(id) on delete cascade,
  user_id           text,                 -- Clerk user id (null for the auto "current" entry)
  author_name       text,
  title             text,                 -- e.g. the name of what the place used to be
  body              text not null default '' check (char_length(body) <= 10000),
  image_urls        text[] not null default '{}',
  memory_date       date not null,        -- the exact date this contribution is about
  is_current        boolean not null default false,
  created_at        timestamptz not null default now(),
  constraint max_five_images check (array_length(image_urls, 1) is null or array_length(image_urls, 1) <= 5)
);

create index if not exists contributions_place_id_idx on contributions(place_id);
create index if not exists contributions_memory_date_idx on contributions(memory_date desc);

-- Storage bucket for uploaded images. Create a PUBLIC bucket named "contributions"
-- in the Supabase dashboard (Storage -> New bucket -> name: contributions, Public: on),
-- or run the statement below.
insert into storage.buckets (id, name, public)
values ('contributions', 'contributions', true)
on conflict (id) do nothing;

-- ─── Row Level Security ───────────────────────────────────────────────
-- Enable RLS on both tables
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to READ places and contributions (GET routes are public)
CREATE POLICY "Public read access for places"
  ON places FOR SELECT
  USING (true);

CREATE POLICY "Public read access for contributions"
  ON contributions FOR SELECT
  USING (true);

-- Storage: allow public reads on the contributions bucket
CREATE POLICY "Public read access for contribution images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contributions');
