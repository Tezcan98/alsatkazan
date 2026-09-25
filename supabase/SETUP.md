# Üyelik ve bulut kayıt kurulumu

Bu sürümde üyelik altyapısı Supabase Auth + Postgres için hazırdır.

Yapılacaklar:
1. Supabase'te proje oluştur.
2. Email/password girişini aç ve email doğrulamasını zorunlu yap.
3. Supabase SQL Editor'da aşağıdaki tabloyu oluştur:

create table public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;

grant select, insert, update on public.game_saves to authenticated;

create policy game_saves_select_own on public.game_saves
for select to authenticated
using ((select auth.uid()) = user_id);

create policy game_saves_insert_own on public.game_saves
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy game_saves_update_own on public.game_saves
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

4. Redirect URL olarak GitHub Pages oyun adresini ekle:
https://tezcan98.github.io/alsatkazan/game/ikinci-el-simsari/

5. Project URL ve Publishable key değerlerini js/config.js içine yaz.

Secret/service_role anahtarını tarayıcıya koyma.

Yerel oyuncu IndexedDB kullanır. Üye oyuncunun aynı oyun kaydı game_saves tablosuna yazılır.
