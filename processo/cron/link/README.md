# link — le skill backlink sul timer

I quattro job del sistema backlink (RIC-119, spec `crescita/sistema-backlink-2026-10-13.md`) girano da soli
e ogni giro finisce con una mail da `claude.sartori@agentmail.to`. Stesso schema di `articolo-quotidiano`,
senza commit né push: l'agente scrive solo su Airtable e nelle bozze Gmail.

| Quando (ora di Roma) | Job | Cosa produce |
|---|---|---|
| lunedì 07:00 | `link-review` | mail con la revisione (sola lettura) |
| martedì 07:00 | `link-dono` | al massimo 5 bozze Gmail, solleciti compresi + Airtable `Bozza pronta` |
| primo lunedì del mese 07:05 | `link-fonti` | prospect `Da qualificare` su Airtable |
| primo lunedì del mese 07:10 | `link-recupero` | link persi e menzioni senza link, al massimo 5 bozze |

**Stato: costruito e testato, non installato.** La spec dice "prima a mano, poi sul timer": i timer si
accendono dopo i giri a mano (vedi "Accenderlo").

## Chi fa cosa

| | fa |
|---|---|
| l'agente (`.claude/skills/<job>`) | legge, misura, scrive su Airtable, crea bozze, chiude con un blocco `REPORT_` |
| `run.sh <job>` | la data, la guardia anti-doppione, l'allowlist, il controllo che Gmail ci sia prima di partire, **la mail di esito** |
| `lancia.sh <job>` | il checkout usa e getta di origin/main, un job alla volta, i dati di lavoro messi da parte |

Un agente non può riferire l'esito di ciò che non ha ancora fatto: la mail la manda lo script, dopo, e
distingue ciò che ha verificato lui (claude uscito bene, blocco `REPORT_` presente, Gmail caricato) da ciò
che riporta l'agente (record, bozze, misure).

## I file

| file | a cosa serve |
|---|---|
| `lancia.sh` | lock, worktree staccato su origin/main dal clone bare, `run.sh <job>`, copia dei dati di lavoro, rimozione del worktree |
| `run.sh` | tutto ciò che deve andare bene sempre (sopra) |
| `systemd/link@.service` | il servizio, uno per job (`link@link-review.service`, …) |
| `systemd/link-fallito@.service` | mail se il servizio muore prima che `run.sh` possa scrivere |
| `systemd/link-*.timer` | i quattro orari |
| `test/test.sh` | casi su repo fixture con stub: nessun Opus, nessuna mail, nessun Airtable o Gmail veri |

Fuori dal repo, sul VPS:

| percorso | cos'è |
|---|---|
| `/root/cron/dovevalatuaral.git` | il clone bare di `articolo-quotidiano`, riusato |
| `/root/cron/link/lancia.sh` | la copia installata, quella che systemd esegue |
| `/root/cron/link/logs/<job>-AAAA-MM-GG.log` | un log per job e giorno |
| `/root/cron/link/logs/state-<job>` | la guardia anti-doppione |
| `/root/cron/link/dati/.link-fonti/`, `.link-dono/` | raccolte e affermazioni dei prospect: dati che il repo pubblico non deve vedere, tenuti per rileggere un run |
| `/root/cron/link/link.lock` | un job alla volta |

## Calendario e guardia

I timer hanno il fuso nell'`OnCalendar` (`CRON_TZ` su questo VPS non funziona) e `Persistent=true`: se il
VPS era spento all'orario, il job parte all'avvio. La guardia di `run.sh` tiene un giro riuscito per periodo:
settimana ISO per `link-review` e `link-dono`, mese per `link-fonti` e `link-recupero`. Lo stato avanza solo
se il run è riuscito e la mail è partita: dopo un fallimento il giro successivo riparte.

Il primo lunedì del mese partono tre job. `lancia.sh` prende un lock (`flock`, attesa fino a 3 ore): girano
uno dopo l'altro, `link-review` per primo; tra `link-fonti` e `link-recupero` l'ordine non conta.

## L'allowlist

Per nome di strumento, mai per server (`mcp__claude_ai_Gmail` ammetterebbe anche l'invio). Airtable con i due
prefissi (`mcp__plugin_airtable_airtable__` col token, `mcp__claude_ai_Airtable__` con la login).

| job | ammessi |
|---|---|
| `link-review` | Airtable `list_records_for_table`; DataForSEO `backlinks_summary`, `backlinks_backlinks`; `Bash(node .claude/skills/link-review/misure.mjs:*)` |
| `link-dono` | Airtable `list_records_for_table`, `update_records_for_table`; Gmail (sotto); WebFetch, Read, Write, Edit; `dono-ccnl.js`, `verifica-pagina.js`, `misure.mjs` |
| `link-fonti` | Airtable `list_records_for_table`, `create_records_for_table`; DataForSEO `ai_optimization_chat_gpt_scraper`, `ai_opt_llm_ment_top_domains`; WebFetch, WebSearch, Read, Write, Edit; `aggrega.js` |
| `link-recupero` | Airtable `list_records_for_table`, `create_records_for_table`, `update_records_for_table`; DataForSEO `backlinks_backlinks`, `serp_organic_live_advanced`, `content_analysis_search`; Gmail (sotto); WebFetch; `verifica-pagina.js` |

Gmail, solo questi sei: `create_draft`, `list_drafts`, `get_draft`, `search_threads`, `get_thread`,
`get_message`. Negati in ogni job con `--disallowedTools`, anche se nessuno li ammette: `send_message`,
`reply` e `forward` (inviano: `reply` non crea una bozza), `update_draft`, `delete_draft`, `trash_*`,
il server AgentMail, Perplexity e Firecrawl (senza credito). `link-review` e `link-recupero` non scrivono
file: `Write`, `Edit` e `NotebookEdit` negati. Il test fallisce se `send_message`, `reply` o `forward`
compaiono nell'allowlist di un job, in qualunque modalità.

Se un run muore o salta un passo per un permesso, la mail elenca gli strumenti negati
(`permission_denials` dell'output JSON di claude): il posto da toccare è il `case` dei job in `run.sh`.

## Autenticazione e Gmail

RIC-120 ha verificato che con `CLAUDE_CODE_OAUTH_TOKEN` (il token di `/root/.config/claude-cron/env`, quello
di `articolo-quotidiano`) `claude -p` non carica nessun connettore claude.ai: niente Gmail. Gmail arriva solo
con la login interattiva di `~/.claude`.

- `link-review` e `link-fonti` non usano Gmail: girano col token, come `articolo-quotidiano`.
- `link-dono` e `link-recupero` girano secondo l'interruttore `LINK_GMAIL_AUTH`, in `systemd/link@.service`:
  - `login` (default): senza il token, con la login interattiva;
  - `token`: col token, da provare quando claude sincronizzerà i connettori anche col token di setup-token.

In entrambi i casi, prima di lavorare, `run.sh` apre claude con la stessa autenticazione e una riga di prompt,
legge l'evento `init` di `--output-format stream-json` e cerca `mcp__claude_ai_Gmail__create_draft`. Se manca,
o se claude non risponde (login scaduta), il job non parte e la mail lo dice con lo stato del connettore e cosa
fare. Mai silenzio. Costo del controllo: circa 0,13 $ (misurato da RIC-120 con lo stesso comando).

Il rischio della login: se scade, i due job si fermano finché Riccardo non rifà `/login` sul VPS (la mail
arriva ogni volta). Per controllarla: `env -u CLAUDE_CODE_OAUTH_TOKEN claude mcp list` deve mostrare
`claude.ai Gmail` connesso.

L'alternativa, non costruita: bozze create da uno script con la Gmail API e un client OAuth Google proprio
(scope `gmail.compose`), con l'agente che scrive la bozza in un file e lo script che la crea. Deterministica e
indipendente dalla login, ma da configurare. È un ticket a parte, se la login si rivela fragile.

## DataFast

`misure.mjs` legge `DATAFAST_API_KEY` dall'ambiente o dal file `DATAFAST_ENV_FILE`. `run.sh` non legge né copia
la chiave: passa solo il percorso, di default `/root/ricc-os/projects/dovevalatuaral.com/.env` (il checkout
principale, dove sta oggi), e la mail di `link-review` dice se nel file c'è la variabile. Spostarla in un file
fuori dal repo (per esempio `/root/.config/datafast/env`, come gli altri segreti dei cron) è una decisione di
Riccardo: basta `Environment=DATAFAST_ENV_FILE=…` in `link@.service`.

## DRY_RUN

`DRY_RUN=1` fa girare la skill vera, ma:

- gli strumenti che scrivono su Airtable (`create_records_for_table`, `update_records_for_table`) e
  `create_draft` sono tolti dall'allowlist e negati, e il prompt lo dice all'agente;
- la mail non parte: oggetto `[DRY RUN] …` e corpo finiscono nel log;
- lo stato non avanza.

Le chiamate di lettura costano lo stesso (DataForSEO, il run di Opus, il controllo Gmail).

## Giri a mano

```bash
# come il timer, con systemd
systemctl start link@link-review.service

# un secondo giro nello stesso periodo (la guardia lo salterebbe)
LINK_FORZA=1 /root/cron/link/lancia.sh link-dono

# argomenti della skill a mano, dopo i RUNNER FACTS (valgono su quelli di run.sh)
LINK_FORZA=1 LINK_ARGS="ccnl=commercio" /root/cron/link/lancia.sh link-dono
```

La settimana dopo una tranche CCNL (spec) non serve niente a mano: `run.sh` chiede al dataset del checkout le
tranche partite negli ultimi 7 giorni (`node processo/link/dono-ccnl.js tranche <7 giorni fa> <oggi>`) e, se ce
ne sono, passa a link-dono `ccnl=<slug,…>`. Il martedì dopo il 1° novembre 2026 sarà `ccnl=commercio,dmo`. Il
tetto delle 5 bozze resta. Se il calendario non si legge, il run parte senza filtro e la mail lo dice.

## La mail

Oggetto con i numeri del blocco `REPORT_`: `link-review AAAA-MM-GG: punto-zero, 0 link nuovi`,
`link-dono AAAA-MM-GG: 2 bozze, 1 solleciti, non inviare prima del …`, `link-fonti …: 12 prospect su Airtable
(prompt 24/24)`, `link-recupero …: 0 link persi, 0 menzioni, 0 bozze`. In coda all'oggetto: fonti che non hanno
risposto, strumenti negati, più di 5 bozze (per `link-dono` bozze nuove e solleciti insieme).

Corpo: la prosa dell'agente, poi i fatti misurati da `run.sh` (checkout, modello, turni, minuti, costo,
autenticazione, strumenti negati, avvisi), il blocco `REPORT_` e la riga "verificato da me / non verificato".

Ogni esito ha la sua mail: run riuscito, run fallito o in timeout, report mancante, Gmail non disponibile,
claude che non risponde, skill assente nel checkout. Se il servizio muore prima (fetch, lock), la manda
`link-fallito@.service`. Se la mail di esito non parte, `run.sh` esce con errore e scatta quella.

## Testarlo

```bash
# stub: veloce, gratis, non tocca niente di vero
processo/cron/link/test/test.sh

# prova vera senza effetti fuori dal VPS (dopo l'installazione)
DRY_RUN=1 /root/cron/link/lancia.sh link-review
cat /root/cron/link/logs/link-review-$(date +%F).log
```

## Accenderlo

Da fare a mano, da un checkout aggiornato di main con questo runner già mergiato (`lancia.sh` prende `run.sh`
e le skill da origin/main):

```bash
# il clone bare c'è già: /root/cron/dovevalatuaral.git (articolo-quotidiano)
install -D -m 755 processo/cron/link/lancia.sh /root/cron/link/lancia.sh
cp processo/cron/link/systemd/* /etc/systemd/system/
systemctl daemon-reload

# una prova vera senza effetti, poi un timer alla volta, quando i giri a mano sono fatti
DRY_RUN=1 /root/cron/link/lancia.sh link-review
systemctl enable --now link-review.timer
systemctl enable --now link-dono.timer                    # dopo i due giri a mano di link-dono
systemctl enable --now link-fonti.timer link-recupero.timer
systemctl list-timers 'link-*'
```

Per fermarne uno: `systemctl disable --now link-dono.timer`. A ogni modifica di `lancia.sh` o delle unit si
reinstallano; `run.sh` no, arriva ogni volta da origin/main.

## Decisioni aperte, per Riccardo

- **Gmail**: `LINK_GMAIL_AUTH=login` (default, dipende dalla login interattiva) o la Gmail API da script
  (ticket a parte). Il token non basta oggi.
- **Chiave DataFast**: resta nel `.env` del checkout principale o si sposta in `/root/.config/datafast/env`.
- **WebSearch in link-fonti**: la skill lo usa per trovare la pagina di un dominio visto solo in AI Overview.
  È nell'allowlist; si toglie dal `case` di `run.sh` se lo si vuole fuori.
- **Modello**: `claude-opus-5` per tutti e quattro (`MODEL` lo cambia).

## È acceso davvero solo quando

- [ ] `test/test.sh` è verde
- [ ] un `DRY_RUN=1` di `link-review` ha mandato nel log una mail con il blocco `REPORT_` letto
- [ ] i giri a mano di `link-dono` sono fatti (spec)
- [ ] i timer compaiono in `systemctl list-timers 'link-*'`
- [ ] tre run consecutivi sul timer senza intervento, ognuno con la sua mail (RIC-126)
