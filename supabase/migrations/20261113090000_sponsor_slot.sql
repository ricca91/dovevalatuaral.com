-- Sponsorship limitate (RIC-51). Applicata al progetto dovevalatuaral il 2026-11-13.
-- I segreti del Vault (sponsor_stripe_webhook_secret, sponsor_resend_api_key,
-- sponsor_admin_email, sponsor_cron_secret) non stanno in questo file.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create type public.sponsor_stato as enum
  ('riservato','in_approvazione','attivo','scaduto','rifiutato','in_coda');

create table public.sponsor_impostazioni (
  id boolean primary key default true check (id),
  slot_totali int not null check (slot_totali between 1 and 12),
  prezzo_cent int not null check (prezzo_cent > 0),
  valuta text not null default 'eur',
  durata_giorni int not null check (durata_giorni > 0),
  checkout_url text not null check (checkout_url ~ '^https://'),
  stripe_payment_link_id text,
  vendite_aperte boolean not null default true,
  aggiornato_il timestamptz not null default now()
);

create table public.sponsor_prenotazioni (
  id uuid primary key default gen_random_uuid(),
  slot int check (slot between 1 and 12),
  stato public.sponsor_stato not null,
  nome text not null check (char_length(nome) between 1 and 60),
  claim text not null default '' check (char_length(claim) <= 120),
  url text not null check (url ~ '^https://[^\s]+$'),
  logo_url text check (logo_url is null or logo_url ~ '^https://'),
  logo_alt text,
  email text,
  stripe_session_id text unique,
  stripe_payment_intent text,
  importo_cent int,
  valuta text,
  durata_giorni int not null check (durata_giorni > 0),
  inizio timestamptz,
  fine timestamptz,
  admin_token text not null default encode(extensions.gen_random_bytes(24),'hex'),
  avviso_scadenza_il timestamptz,
  creato_il timestamptz not null default now(),
  deciso_il timestamptz,
  check (fine is null or inizio is null or fine > inizio),
  check (stato <> 'attivo' or (slot is not null and inizio is not null and fine is not null)),
  check (stato not in ('riservato','in_approvazione') or slot is not null)
);

-- Uno slot ospita al massimo una prenotazione viva: niente rotazione, niente doppioni.
create unique index sponsor_slot_occupato on public.sponsor_prenotazioni (slot)
  where stato in ('riservato','in_approvazione','attivo');

-- Nessuna policy: le tabelle si leggono solo con la service role o dalle funzioni qui sotto.
alter table public.sponsor_impostazioni enable row level security;
alter table public.sponsor_prenotazioni enable row level security;

create or replace function public.sponsor_scadi()
returns setof public.sponsor_prenotazioni
language sql security definer set search_path = '' as $$
  update public.sponsor_prenotazioni
     set stato = 'scaduto'
   where stato = 'attivo' and fine <= now()
  returning *;
$$;

create or replace function public.sponsor_tabellone()
returns jsonb
language sql stable security definer set search_path = '' as $$
  with imp as (select * from public.sponsor_impostazioni limit 1),
  numeri as (select generate_series(1,(select slot_totali from imp)) as slot),
  vivi as (
    select p.* from public.sponsor_prenotazioni p
     where p.stato in ('riservato','in_approvazione')
        or (p.stato = 'attivo' and p.inizio <= now() and p.fine > now())
  ),
  righe as (
    select n.slot,
      case when v.id is null then 'disponibile'
           when v.stato = 'attivo' then 'attivo'
           else 'riservato' end as stato,
      case when v.stato = 'attivo' then v.nome end as nome,
      case when v.stato = 'attivo' then v.claim end as claim,
      case when v.stato = 'attivo' then v.url end as url,
      case when v.stato = 'attivo' then v.logo_url end as logo_url,
      case when v.stato = 'attivo' then coalesce(v.logo_alt,'') end as logo_alt
    from numeri n left join vivi v on v.slot = n.slot
  )
  select jsonb_build_object(
    'slot_totali',(select slot_totali from imp),
    'disponibili',(select count(*) from righe where stato = 'disponibile'),
    'prezzo_cent',(select prezzo_cent from imp),
    'valuta',(select valuta from imp),
    'durata_giorni',(select durata_giorni from imp),
    'checkout_url',(select checkout_url from imp),
    'vendite_aperte',(select vendite_aperte from imp),
    'slot',(select coalesce(jsonb_agg(to_jsonb(r) order by r.slot),'[]'::jsonb) from righe r)
  );
$$;

create or replace function public.sponsor_registra_pagamento(
  p_session text, p_intent text, p_importo int, p_valuta text,
  p_nome text, p_claim text, p_url text, p_email text, p_slot_preferito int default null)
returns public.sponsor_prenotazioni
language plpgsql security definer set search_path = '' as $$
declare
  imp public.sponsor_impostazioni;
  scelto int;
  riga public.sponsor_prenotazioni;
begin
  select * into riga from public.sponsor_prenotazioni where stripe_session_id = p_session;
  if found then return riga; end if;
  perform public.sponsor_scadi();
  select * into imp from public.sponsor_impostazioni limit 1;
  perform pg_advisory_xact_lock(hashtext('sponsor_slot'));
  select n into scelto
    from generate_series(1, imp.slot_totali) n
   where not exists (select 1 from public.sponsor_prenotazioni p
                      where p.slot = n and p.stato in ('riservato','in_approvazione','attivo'))
   order by (n = p_slot_preferito) desc, n
   limit 1;
  insert into public.sponsor_prenotazioni
    (slot, stato, nome, claim, url, logo_alt, email, stripe_session_id, stripe_payment_intent,
     importo_cent, valuta, durata_giorni)
  values
    (scelto, case when scelto is null then 'in_coda' else 'in_approvazione' end::public.sponsor_stato,
     p_nome, p_claim, p_url, 'Logo di ' || p_nome, p_email, p_session, p_intent,
     p_importo, p_valuta, imp.durata_giorni)
  returning * into riga;
  return riga;
end;
$$;

create or replace function public.sponsor_segreto(nome text)
returns text language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'sponsor_' || nome limit 1;
$$;

revoke all on function public.sponsor_scadi() from public, anon, authenticated;
revoke all on function public.sponsor_tabellone() from public;
revoke all on function public.sponsor_registra_pagamento(text,text,int,text,text,text,text,text,int) from public, anon, authenticated;
revoke all on function public.sponsor_segreto(text) from public, anon, authenticated;
grant execute on function public.sponsor_tabellone() to anon, authenticated, service_role;
grant execute on function public.sponsor_scadi() to service_role;
grant execute on function public.sponsor_registra_pagamento(text,text,int,text,text,text,text,text,int) to service_role;
grant execute on function public.sponsor_segreto(text) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sponsor-loghi','sponsor-loghi',true,262144,array['image/png','image/jpeg','image/webp','image/x-icon','image/vnd.microsoft.icon','image/svg+xml','image/gif'])
on conflict (id) do nothing;

select cron.schedule('sponsor-scadenze', '7 * * * *', $cron$
  select net.http_post(
    url := 'https://rifkyfawojizgbzabyxn.supabase.co/functions/v1/sponsor/scadenze',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret', public.sponsor_segreto('cron_secret')),
    body := '{}'::jsonb
  );
$cron$);

insert into public.sponsor_impostazioni (slot_totali, prezzo_cent, valuta, durata_giorni, checkout_url, stripe_payment_link_id)
values (5, 9900, 'eur', 30, 'https://book.stripe.com/eVq5kEc3lfiNfqi393aMU06', 'plink_1UbGRqK7ztjNTKWCZHOQxces');
