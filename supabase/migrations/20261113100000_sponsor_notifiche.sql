-- Le notifiche diventano recuperabili: se Resend è giù, o se uno slot scade fuori dal
-- giro orario (un pagamento o un'approvazione chiamano sponsor_scadi()), il cron le rimanda.
alter table public.sponsor_prenotazioni
  add column notifica_prenotazione_il timestamptz,
  add column notifica_scadenza_il timestamptz;

update public.sponsor_prenotazioni
   set notifica_prenotazione_il = coalesce(notifica_prenotazione_il, now()),
       notifica_scadenza_il = case when stato = 'scaduto' then now() end;
