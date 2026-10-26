-- Realtime collaborative daily notes (Yjs + @supabase-labs/y-supabase)
--
-- Each daily note (category + date) is one Yjs document. Its full state is stored
-- base64-encoded in `state` by SupabasePersistence, keyed by the room name:
--   gridio:entry:<category_id>:<YYYY-MM-DD>     (see lib/collab-notes.ts → entryRoom)
--
-- Live sync between open browsers uses Supabase Realtime *broadcast* on public
-- channels, which needs no table or RLS. Only persistence needs this table.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.yjs_documents (
  room       text primary key,
  state      text not null,
  updated_at timestamptz(6) not null default now()
);

comment on table public.yjs_documents is
  'Persisted Yjs document state for realtime daily notes (managed by @supabase-labs/y-supabase).';

-- y-supabase upserts only (room, state); keep updated_at current
create or replace function public.yjs_documents_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists yjs_documents_touch_updated_at on public.yjs_documents;
create trigger yjs_documents_touch_updated_at
  before update on public.yjs_documents
  for each row execute function public.yjs_documents_touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The browser talks to this table directly with the logged-in user's session.
-- Workspaces/categories are not owned per user in this app, so any authenticated
-- user may read and write notes (same access model as the rest of the app).
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;

alter table public.yjs_documents enable row level security;

revoke all on public.yjs_documents from anon;
grant select, insert, update, delete on public.yjs_documents to authenticated;

drop policy if exists "Authenticated users can read notes" on public.yjs_documents;
create policy "Authenticated users can read notes"
  on public.yjs_documents for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can create notes" on public.yjs_documents;
create policy "Authenticated users can create notes"
  on public.yjs_documents for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update notes" on public.yjs_documents;
create policy "Authenticated users can update notes"
  on public.yjs_documents for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete notes" on public.yjs_documents;
create policy "Authenticated users can delete notes"
  on public.yjs_documents for delete
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Keep Yjs documents in step with `entries`
-- When an entry is deleted (directly, from List View, or by cascading from a
-- deleted category/workspace) its Yjs document goes too. Otherwise the editor
-- would reload the old content and autosave would recreate the entry.
-- ---------------------------------------------------------------------------
create or replace function public.delete_entry_yjs_document()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.yjs_documents
  where room = 'gridio:entry:' || old.category_id || ':' || to_char(old.entry_date, 'YYYY-MM-DD');
  return old;
end;
$$;

drop trigger if exists entries_delete_yjs_document on public.entries;
create trigger entries_delete_yjs_document
  after delete on public.entries
  for each row execute function public.delete_entry_yjs_document();
