# Prompt di link-fonti

Input della skill `/link-fonti` (RIC-121, sistema backlink RIC-119). Venticinque domande informative, divise nei
sette cluster del sito, scritte come le scriverebbe una persona a ChatGPT. Ogni domanda nasce da una query reale di
Search Console o da una "Domanda correlata" (PAA) di Google: la fonte è accanto.

Il file non contiene prospect né contatti: quelli stanno solo su Airtable (tabella Outreach).

## Come si usa

I parametri delle chiamate sono nella skill (`.claude/skills/link-fonti/SKILL.md`). In breve:

- **ChatGPT**: una chiamata dello scraper DataForSEO per prompt, testo identico, Italia/`it`, ricerca web forzata.
  Per l'Italia LLM Mentions copre solo AI Overview (`chat_gpt` esiste solo per Stati Uniti / inglese,
  `ai_opt_llm_ment_loc_and_lang`, 15/10/2026): le citazioni di ChatGPT arrivano solo dallo scraper, un prompt alla
  volta, e cambiano da un giorno all'altro.
- **AI Overview**: una chiamata `ai_opt_llm_ment_top_domains` per cluster, col filtro della riga "Filtro AI Overview".
  Il filtro è una sola parola chiave, `partial_match` (ricerca di sottostringa, documentata), cercata nella domanda
  (`search_scope: ["question"]`). Non si combinano più target: la documentazione non dice se vengono messi in AND o
  in OR.
- Cambiare un prompt cambia il confronto col mese prima: si cambia solo se la query di partenza perde peso in GSC.
  Il prompt COM-1 è lo stesso del test del 13 ottobre e va tenuto fisso.

Sigle delle fonti:

- **GSC**: Search Console, query del sito, 14/9–12/10/2026 (28 giorni). Tra parentesi: impressioni.
- **PAA**: "Le persone hanno chiesto anche", da `serp_organic_live_advanced` (Italia, `it`), raccolta in
  `crescita/piano-editoriale-90gg/ricerca/competitor-calcolatore-ral.md` §7, tra virgolette la query della SERP.
- **PAA RIC-95**: domande correlate su `ccnl commercio tabelle retributive 2026` (mobile, 6/10/2026), nel ticket RIC-95.
- **KW**: volume Google Ads Italia al mese, `crescita/piano-editoriale-90gg/ricerca/keywords.csv`.

## Commercio

Pagine nostre: `/minimi-ccnl/commercio/`, `/minimi-ccnl/commercio/{2,3,4,5}-livello/`.
Filtro AI Overview: `{"keyword": "ccnl commercio", "match_type": "partial_match", "search_scope": ["question"]}`

| ID | Prompt | Fonte |
|---|---|---|
| COM-1 | Tabelle retributive CCNL commercio 2026: quanto prende netto un 3° livello e quali sono gli aumenti da novembre 2026? | test ChatGPT del 13/10; GSC `ccnl commercio tabelle retributive 2026` (262), `ral 3 livello commercio 2026` (35) |
| COM-2 | Quanto prende netto al mese un 4° livello del CCNL commercio nel 2026? | PAA "ral 30000 stipendio netto": "Quanto guadagna netto un 4 livello commercio?" |
| COM-3 | Cosa cambia in busta paga tra il 3° e il 4° livello del CCNL commercio? | PAA RIC-95: "Cosa cambia tra 4 e 3 livello di commercio?" |
| COM-4 | Quali sono gli aumenti del CCNL commercio previsti per il 2026 e il 2027? | PAA RIC-95: "Quali sono gli aumenti previsti per il 2026 e il 2027?" |
| COM-5 | Qual è la RAL di un 2° livello del CCNL Terziario Confcommercio nel 2026? | GSC `ral 2 livello commercio 2026` (19), `ccnl terziario distribuzione e servizi tabelle retributive` (20) |

## Metalmeccanico

Pagine nostre: `/minimi-ccnl/metalmeccanico/`, `/minimi-ccnl/metalmeccanico/livello-{d1,d2,c1,c2,c3,b1,b2,b3,a1}/`,
`/blog/rinnovo-ccnl-metalmeccanici/`.
Filtro AI Overview: `{"keyword": "metalmeccanic", "match_type": "partial_match", "search_scope": ["question"]}`

| ID | Prompt | Fonte |
|---|---|---|
| MET-1 | Quali sono i minimi tabellari dei metalmeccanici nel 2026, livello per livello? | GSC `minimi tabellari metalmeccanici 2026` (89), `tabella metalmeccanici 2026` (28), `ccnl metalmeccanico tabelle retributive 2026` (26) |
| MET-2 | Quanto guadagna netto un metalmeccanico di livello C3? | PAA "ccnl metalmeccanici stipendio netto": "Quanto guadagna un C3 netto?" |
| MET-3 | Qual è la RAL di un livello D2 del CCNL metalmeccanico? | GSC `ral d2 metalmeccanico` (16) |
| MET-4 | Quanti euro netti guadagna un metalmeccanico con 2.000 euro lordi al mese? | PAA "ccnl metalmeccanici stipendio netto": stessa domanda |

## Multiservizi

Pagine nostre: `/minimi-ccnl/multiservizi/`, `/minimi-ccnl/multiservizi/{1,2,3,4}-livello/`.
Filtro AI Overview: `{"keyword": "multiservizi", "match_type": "partial_match", "search_scope": ["question"]}`

| ID | Prompt | Fonte |
|---|---|---|
| MUL-1 | Tabelle retributive CCNL multiservizi 2026: quanto è lo stipendio per livello? | GSC `ccnl multiservizi tabelle retributive 2026` (120) |
| MUL-2 | Quanto prende netto al mese un 1° livello del CCNL multiservizi? | GSC `ccnl multiservizi 1 livello stipendio netto` (54) |
| MUL-3 | Quanto prende al mese un addetto alle pulizie part-time al 1° livello del CCNL multiservizi? | GSC `ccnl multiservizi 1 livello paga part-time` (17), `ccnl pulizie paga oraria netta` (20) |

## Cooperative sociali

Pagine nostre: `/minimi-ccnl/cooperative-sociali/`, `/minimi-ccnl/cooperative-sociali/livello-{b1,c1,c2,d1,d2,d3,e1,e2}/`.
Filtro AI Overview: `{"keyword": "cooperative sociali", "match_type": "partial_match", "search_scope": ["question"]}`

| ID | Prompt | Fonte |
|---|---|---|
| COO-1 | Quali sono le tabelle retributive del CCNL cooperative sociali nel 2026? | GSC `ccnl cooperative sociali tabelle retributive 2026` (193), `tabelle retributive ccnl cooperative sociali 2026` (30) |
| COO-2 | Quanto guadagna netto al mese un educatore D2 nelle cooperative sociali? | GSC `ral d2 cooperative sociali` (8), `ral educatore d2` (6) |
| COO-3 | Quanto è lo stipendio netto per livello nel CCNL cooperative sociali? | GSC `ccnl cooperative sociali tabelle retributive netto` (7) |

## Studi professionali

Pagine nostre: `/minimi-ccnl/studi-professionali/`, `/minimi-ccnl/studi-professionali/{2,3,4,4s}-livello/`.
Filtro AI Overview: `{"keyword": "studi professionali", "match_type": "partial_match", "search_scope": ["question"]}`

| ID | Prompt | Fonte |
|---|---|---|
| STU-1 | Tabelle retributive CCNL studi professionali 2026: quali sono i minimi per livello? | GSC `ccnl studi professionali tabelle retributive 2026` (312, la query del sito con più impressioni), `tabelle retributive studi professionali 2026` (29) |
| STU-2 | Quanto prende netto un 4° livello del CCNL studi professionali a 40 ore? | GSC `stipendio netto 4 livello studi professionali 40 ore` (19), `ccnl studi professionali 4 livello` (26) |
| STU-3 | Cos'è il livello 4° super negli studi professionali e quanto si guadagna? | GSC `livello 4s studi professionali` (25) |

## Tredicesima

Pagine nostre: `/calcolo-tredicesima/`, `/blog/tassazione-tredicesima/`, `/blog/tredicesima-mensilita-quanto-arriva/`,
`/blog/tredicesima-detassata/`.
Filtro AI Overview: `{"keyword": "tredicesima", "match_type": "partial_match", "search_scope": ["question"]}`

| ID | Prompt | Fonte |
|---|---|---|
| TRE-1 | Come viene tassata la tredicesima nel 2026? | GSC `tassazione tredicesima 2026` (84), `tassazione tredicesima` (18); KW `tassazione tredicesima` 6.600 |
| TRE-2 | Come si calcola la tredicesima netta? | PAA "calcolo tredicesima": "Come si calcola la 13esima?"; KW `tredicesima come si calcola` 8.100 |
| TRE-3 | Quanto è la tredicesima se prendo 1.500 euro netti al mese? | PAA "calcolo tredicesima": "Quanto è la tredicesima di 1.500 euro nette al mese?" |
| TRE-4 | La tredicesima del 2026 è detassata? | KW `tredicesima detassata` 8.100 (picco a ottobre) |

## RAL → netto

Pagine nostre: `/netto-ral.html`, `/ral-{20000…100000}-netto/` (passo 5.000), `/ccnl-livello.html`.
Filtro AI Overview: `{"keyword": "stipendio netto", "match_type": "partial_match", "search_scope": ["question"]}`
(`ral` come sottostringa prenderebbe "generale", "morale"; "stipendio netto" è la forma con più volume, KW 49.500).

| ID | Prompt | Fonte |
|---|---|---|
| RAL-1 | Qual è il netto mensile di una RAL di 30.000 euro nel 2026? | PAA "ral 30000 stipendio netto": "Qual è il netto di 30000 euro lordi?"; GSC `ral 30000 euro netto` (4) |
| RAL-2 | Quanta RAL serve per avere 2.000 euro netti al mese? | PAA "ral 30000 stipendio netto": "Quanto RAL devo avere per avere 2000 € netti al mese?" |
| RAL-3 | Come si calcola lo stipendio netto partendo dalla RAL? | GSC `calcolo netto da ral` (10); KW `calcolo stipendio netto dalla ral` 8.100 |
