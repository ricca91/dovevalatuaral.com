---
name: link-fonti
description: trova i siti che ChatGPT e AI Overview citano sui CCNL e li porta su Airtable come prospect da qualificare
disable-model-invocation: true
---

Trova i domini che ChatGPT e AI Overview citano sulle domande di `crescita/link/prompt.md`, scarta quelli che non
servono, classifica gli altri e scrivili su Airtable con Stato `Da qualificare`. La qualifica la fa Riccardo.
Budget fisso: una chiamata dello scraper ChatGPT per prompt, una `ai_opt_llm_ment_top_domains` per cluster, al
massimo un nuovo tentativo per chiamata fallita. Nessun'altra chiamata DataForSEO a pagamento.

## Contesto

Sistema backlink, spec `crescita/sistema-backlink-2026-10-13.md` (sezione "link-fonti"). Si scrive ai siti che l'AI
legge, non a quelli col DR più alto. Gira il primo lunedì del mese, prima di `link-dono`.

Cosa si può misurare per l'Italia, e cosa no:

- **ChatGPT**: solo con `mcp__dataforseo__ai_optimization_chat_gpt_scraper`, un prompt per chiamata. Ogni chiamata è
  una risposta sola, e le risposte cambiano da un giorno all'altro: un dominio citato oggi può sparire domani.
- **AI Overview**: con `mcp__dataforseo__ai_opt_llm_ment_top_domains`. Per Italia/italiano LLM Mentions copre solo
  `platform: "google"`; `chat_gpt` esiste solo per Stati Uniti/inglese. Restituisce domini, non pagine: la pagina
  di un dominio visto solo in AI Overview la trovi tu sul sito, e lo scrivi.
- Gemini e Perplexity: non coperti.

CRM: Airtable, base `appAsCWc7NBzY5nam`, tabella Outreach `tbl3ELP9SWiFPTO2A`. Gli strumenti Airtable possono
arrivare come `mcp__plugin_airtable_airtable__*` o `mcp__claude_ai_Airtable__*`: usa quelli che hai.

## Leggi prima di partire

1. `crescita/link/prompt.md`: i prompt con ID e cluster, e per ogni cluster il filtro AI Overview e le pagine nostre.
2. `.claude/skills/link-fonti/esclusi.json`: domini nostri, competitor, giganti, istituzioni.

## I passi

### 1. Cosa c'è già su Airtable

`list_records_for_table` sulla tabella Outreach, campo Dominio (`flddr04MQcT7yAPJu`). Questi domini non si riscrivono,
qualunque sia il loro Stato. Non toccare i record esistenti.

### 2. ChatGPT, un prompt alla volta

Per ogni prompt: `keyword` = testo del prompt identico, `location_name: "Italy"`, `language_code: "it"`,
`force_web_search: true`. Le fonti citate sono gli `url` in `items[].sources[]`, di tutti gli item. Se una chiamata
fallisce, riprova una volta; se fallisce ancora, salta il prompt e scrivilo nel report.

### 3. AI Overview, un cluster alla volta

`target` = il filtro del cluster scritto in `prompt.md`, più `platform: "google"`, `location_name: "Italy"`,
`language_code: "it"`, `links_scope: "sources"`, `items_list_limit: 10`, `internal_list_limit: 10`.
Dalla risposta prendi:

- `top`: per ogni `items[]`, `key` → la sua `mentions` (`items[].platform[0].mentions`);
- `co`: per ogni dominio che compare in `items[].sources_domain[]` e non è un `key`, la `mentions` più alta tra
  quelle con cui compare. Sono i domini co-citati: `aggrega.js` li tiene solo da 3 menzioni in su.

Stessa regola sui fallimenti: un nuovo tentativo, poi salta e scrivilo.

### 4. Aggrega

Scrivi la raccolta in `.link-fonti/raccolta-AAAA-MM-GG.json` nella root del repo (cartella ignorata da git: sono dati
dei prospect e il repo è pubblico), oppure nella cartella di lavoro dei RUNNER FACTS se c'è:

    {"chatgpt": {"COM-1": ["https://…", "…"], "COM-2": []},
     "aiOverview": {"commercio": {"top": {"www.esempio.it": 107}, "co": {"altro.it": 13}}},
     "giaInAirtable": ["dominio.it"]}

Poi `node .claude/skills/link-fonti/aggrega.js .link-fonti/raccolta-AAAA-MM-GG.json`. Restituisce:

- `prospect`: domini con pagine citate, prompt ChatGPT, cluster AI Overview, `motori` e la stringa `citazioni`,
  già ordinati (più motori, poi più prompt, poi più cluster e menzioni);
- `esclusi`: competitor, giganti, istituzioni e domini già su Airtable, col motivo;
- `nostre`: le pagine di dovevalatuaral.com citate e da quali prompt (la metrica GEO, sotto).

I conteggi e i filtri li fa lo script: non rifarli a mano.

### 5. Apri ogni pagina e classifica

Per ogni prospect apri la pagina (WebFetch). Se ChatGPT ne cita più di una, apri la prima e nomina le altre nelle Note.
Per un dominio visto solo in AI Overview cerca la pagina sul tema del cluster nella sitemap o nei link della home, o
con WebSearch `site:dominio`; scrivi nelle Note come l'hai trovata. Se il sito blocca la lettura (403, Cloudflare,
login), dillo nelle Note.

Scarta, e tieni il motivo per il report:

- **competitor**: la pagina è uno strumento che calcola il netto o spiega la busta paga (calcolatori, simulatori,
  assistenti AI). Se è un dominio nuovo, proponilo nel report per `esclusi.json`;
- **fuori tema**: concorsi, prestiti, assicurazioni, pensioni, lavoro domestico, aziende che hanno solo il nome
  del settore;
- **nessun Tipo adatto**: enti bilaterali, ordini professionali, datori di lavoro;
- **nessuna pagina sul tema** o **non verificabile**: non trovi una pagina sul cluster, o il sito non risponde.

Non scartare un dominio solo perché è grande o perché ti sembra improbabile che risponda: lo decide Riccardo.

Per chi resta:

- **Tipo**: Sindacato · Associazione datoriale · Consulente · Portale CCNL · Blog HR · Testata. (Fornitore non si usa qui.)
- **Tipo di pagina**: poche parole, p.es. "tabella minimi CCNL", "articolo sugli aumenti 2026", "PDF del testo del CCNL", "guida".
- **Play**:
  - firmatario che pubblica le tabelle lorde (sindacato o associazione firmataria): `Netto per livello`;
  - pagina di terzi con minimi, aumenti o decorrenze (portale, consulente, testata, blog): `Correzioni`;
  - guida senza tabelle (tredicesima, come si calcola il netto): `Diagramma`;
  - pagina su un CCNL diverso da quello del sito (p.es. un contratto firmato da altre sigle) o generica: `Menzione`.
- **CCNL**: lo slug del sito (`commercio`, `metalmeccanico`, `multiservizi`, `cooperative-sociali`,
  `studi-professionali`); vuoto per tredicesima e RAL → netto.
- **Nostra pagina di destinazione**: URL completo `https://www.dovevalatuaral.com/…` tra le pagine nostre del cluster in
  `prompt.md`; la pagina del livello se la loro parla di un livello. Mai la home.
- **Contatto**: solo un indirizzo che leggi scritto sul sito (pagina, footer, contatti, chi siamo), copiato identico,
  con l'URL dove l'hai letto in "Dove trovato il contatto". Preferisci indirizzi generici o di redazione/ufficio stampa
  a PEC e indirizzi personali. Se non lo leggi scritto, `n/d`. Mai un indirizzo dedotto dal dominio.

### 6. Scrivi su Airtable

Rileggi i domini della tabella subito prima di scrivere (un altro job può averne aggiunti). Poi
`create_records_for_table`, al massimo 50 record per chiamata, uno per dominio:

| Campo | ID | Valore |
|---|---|---|
| Dominio | `flddr04MQcT7yAPJu` | il dominio di `aggrega.js` (senza protocollo né www) |
| URL pagina | `fldqMOgooN21RLGSA` | la pagina aperta al passo 5 |
| Tipo | `fldje56NX5Wv4gRaZ` | vedi sopra |
| Fonte del prospect | `fldDadcmemhuPh6Jx` | `ChatGPT` se lo cita almeno un prompt, altrimenti `AI Overview` |
| Prompt o query | `fldmT5Qm6hSNsC7oA` | una riga per prompt `COM-1 (ChatGPT): <testo>` e una per cluster `AI Overview, cluster commercio: domande con «ccnl commercio», 107 menzioni` (`(co-citato)` se lo è) |
| Citazioni | `fld6Hy3AnFPonqGUg` | la stringa `citazioni` di `aggrega.js`, identica |
| Tipo di pagina | `flduiekXicEm91ooy` | vedi sopra |
| Play | `fldqO2iM581Cf3S7K` | vedi sopra |
| Nostra pagina di destinazione | `fldJtrP3VCTQuwTzg` | vedi sopra |
| CCNL | `fldHYRtUN1SaFVYHh` | slug, o non scriverlo |
| Contatto | `fldBKV9mPAqx1z327` | indirizzo o `n/d` |
| Dove trovato il contatto | `fld0eRBnzwBcJepIl` | URL, solo se c'è un contatto |
| Stato | `fldkWYpJEJTuiP7OY` | `Da qualificare` |
| Note | `fldhJwhlPaqkJm7Xg` | `link-fonti, run del GG/MM/AAAA.` + come hai trovato la pagina, altre pagine citate, cosa non hai potuto leggere |

Nessun DR, traffico o altro numero che non venga da questo run.

## La metrica GEO

`nostre` dice quali pagine di dovevalatuaral.com ChatGPT ha citato e per quali prompt, e se il dominio compare in AI
Overview. È la metrica del mese e indica le destinazioni dei link. Va nel report, non in un file del repo.

## Cosa NON fai

- Non mandi mail e non crei bozze: le bozze sono di `link-dono`.
- Non scrivi prospect, domini citati o contatti in file tracciati da git; la raccolta sta in `.link-fonti/`.
- Non modifichi i record già su Airtable e non metti nessuno Stato diverso da `Da qualificare`.
- Non committi e non pushi.
- Non fai chiamate DataForSEO oltre il budget (niente `ai_opt_llm_ment_search`, `top_pages`, SERP).

## Il report

Chiudi la risposta con questo blocco, una coppia per riga, niente altro dopo, nessuna riga vuota in mezzo, valori su
una riga sola:

    REPORT_DATA=AAAA-MM-GG
    REPORT_PROMPT=<eseguiti>/<totali>
    REPORT_CLUSTER=<eseguiti>/<totali>
    REPORT_FALLITE=nessuna
    REPORT_CANDIDATI=<prospect di aggrega.js>
    REPORT_SCRITTI=<record creati su Airtable>
    REPORT_SCARTATI=<scartati al passo 5>
    REPORT_COMPETITOR_NUOVI=<domini da aggiungere a esclusi.json, o nessuno>
    REPORT_GEO_PROMPT=<prompt che citano una pagina nostra>/<prompt eseguiti>
    REPORT_GEO_PAGINE=<path della pagina> (<ID prompt>); <path> (<ID>, <ID>)
    REPORT_GEO_AIO=<cluster in cui dovevalatuaral.com compare, con le menzioni, o "assente">
    REPORT_NOTE=tutto ciò che non è riuscito o che hai assunto, in una riga sola

`REPORT_FALLITE` elenca gli ID dei prompt e i cluster saltati. `REPORT_GEO_PROMPT` = prompt che citano almeno una
pagina nostra / prompt eseguiti. Se un valore non lo hai, scrivilo in `REPORT_NOTE`: mai inventarlo.

Prima del blocco, in poche righe: quanti prospect per Tipo, i 5 più citati, cosa non hai potuto verificare (pagine
bloccate, contatti non letti). Finisce nella mail.
