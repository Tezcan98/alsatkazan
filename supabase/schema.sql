create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;
revoke all on table public.game_saves from anon;
grant select, insert, update on public.game_saves to authenticated;

drop policy if exists "game_saves_select_own" on public.game_saves;
create policy "game_saves_select_own" on public.game_saves for select
to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "game_saves_insert_own" on public.game_saves;
create policy "game_saves_insert_own" on public.game_saves for insert
to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "game_saves_update_own" on public.game_saves;
create policy "game_saves_update_own" on public.game_saves for update
to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists game_saves_user_id_idx on public.game_saves(user_id);
