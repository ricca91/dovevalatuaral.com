# Slot sponsor (RIC-51): cosa vive fuori dal sito

Progetto Supabase `dovevalatuaral` (`rifkyfawojizgbzabyxn`, eu-central-1).

| Pezzo | Dove | Cosa fa |
|---|---|---|
| `sponsor_impostazioni` | tabella, una riga | numero di slot, prezzo, durata, link di checkout, vendite aperte |
| `sponsor_prenotazioni` | tabella | una riga per pagamento: slot, stato, sponsor, date, prezzo venduto |
| `sponsor_tabellone()` | funzione pubblica | l'unica lettura concessa al sito, via `/api/sponsor` |
| `functions/sponsor` | Edge Function | webhook Stripe, pagina di approvazione, scadenze, email (Resend) |
| `sponsor-scadenze` | pg_cron, ogni ora | libera gli slot scaduti, avvisa 3 giorni prima |
| `sponsor-loghi` | bucket pubblico | loghi, serviti dal sito su `/sponsor-loghi/` |

Stati di una prenotazione: `in_approvazione` → `attivo` → `scaduto`, oppure `rifiutato`;
`in_coda` se il pagamento arriva a slot esauriti; `riservato` per bloccare uno slot a mano.

I segreti (firma del webhook Stripe, chiave Resend, email delle notifiche, segreto del cron)
stanno nel Vault del database con prefisso `sponsor_`. Nel repo non ce n'è nessuno.

## Operazioni

- **Cambiare prezzo**: crea un nuovo prezzo sul prodotto Stripe, aggiorna il Payment Link e poi
  `update sponsor_impostazioni set prezzo_cent = …`. Chi ha già pagato conserva prezzo e durata:
  sono copiati nella prenotazione.
- **Chiudere le vendite**: `update sponsor_impostazioni set vendite_aperte = false`.
- **Cambiare numero di slot**: `update sponsor_impostazioni set slot_totali = …` (il riquadro
  «Sponsorizza» resta sempre l'ultimo, in basso a destra).
- **Approvare, rifiutare, terminare**: dal link nell'email di notifica (`/sponsor/approva/`).
  Il rimborso di un rifiuto si fa da Stripe: la funzione non ha la chiave segreta.
- **Togliere tutto**: basta non chiamare `iniettaCartella` in `processo/attrezzi/build.cjs`.
