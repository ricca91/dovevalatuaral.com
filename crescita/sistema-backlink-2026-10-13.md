# Sistema backlink — 13 ottobre 2026

_Sviluppa il punto 16 (autorità) del [piano ×10](piano-x10-2026-10-06.md). Dati grezzi:
[sistema-backlink-2026-10-13-dati.json](sistema-backlink-2026-10-13-dati.json)._

## Fonti e limiti

- **Articolo**: post X di Distribb (tweet `2106860317481525608`), estratto con l'actor Apify
  `fastcrawler/x-twitter-article-to-markdown`. L'estrattore non ha restituito i sei SKILL.md: il testo esatto
  l'ha incollato Riccardo il 13 ottobre. Il repo pubblico
  [`Bomx/distribb-skill`](https://github.com/Bomx/distribb-skill) (`references/link-building-playbooks.md`)
  descrive gli stessi playbook più in dettaglio.
- L'articolo è marketing: la rete di scambio link di Distribb è il prodotto in vendita. Lo studio
  "4.231 citazioni AI" è un loro dato, non verificato.
- **Misure del 13 ottobre**: DataForSEO (backlink nostri e dei competitor, ChatGPT con ricerca web forzata
  Italia/it, LLM mentions su AI Overview Italia/it, Content Analysis), `curl` sul dominio legacy.
  Il test ChatGPT è un solo run: le risposte cambiano da un giorno all'altro.
- **Non disponibili oggi**: Perplexity (quota esaurita), Firecrawl (crediti esauriti), GSC (non letta).

## Cosa fanno, esattamente

### Organigramma

| Ruolo | Chi | Cosa fa |
|---|---|---|
| "Chief of SEO Backlinks" | Claude Code (Opus) con 6 skill in `.claude/skills/` | trova i prospect, prepara l'asset per ogni publisher, scrive le email, fa i controlli settimanali |
| Dati e rete | Distribb via MCP | Search Console, domini citati dagli LLM per le domande dei clienti, rete di scambio link, pubblicazione sul CMS |
| Umano | il titolare del sito | invia ogni email e approva ogni placement. **L'agente non preme mai invio** |

### Le sei skill, dal testo dei prompt

| # | Skill | Quando | Passi | Output |
|---|---|---|---|---|
| 1 | `sources` | a richiesta | report di visibilità AI di Distribb sui buyer prompt → ogni dominio citato che non è nostro né di un competitor, con **quanti prompt e quanti motori** lo citano → via i giganti (Reddit, YouTube, Wikipedia, LinkedIn, grandi testate) → apre ogni pagina e la classifica: listicle, tutorial con screenshot, pagina di statistiche, guida lunga senza immagini | `prospects.md`: dominio, pagina citata, citazioni, tipo, contatto pubblico. Mai DR, traffico o email inventati: "n/a" |
| 2 | `reclaim` | a richiesta | export dei backlink rotti → conferma che il link esiste ancora e che la pagina dà 404/410 (richiesta bloccata = non verificato) → ripristino o redirect a pagina equivalente, **mai la home**, piano mostrato prima di toccare il sito → brand cercato fuori dal dominio, controllando che il link non ci sia già → fornitori SaaS pagati: le loro storie clienti linkano? → numeri veri da Search Console, altrimenti si descrive il flusso di lavoro | bozze in `reclaim.md`. Non invia niente |
| 3 | `gift` | a richiesta, dopo `sources` | play scelto dal tipo di pagina: listicle o statistiche → foglio di correzioni; tutorial → screenshot rifatti da un account vero; guida senza immagini → diagramma con i soli fatti della loro pagina → mail: cosa è vecchio o manca, asset allegato, **nessuna richiesta di link** → **cancello di verifica**: ogni affermazione sulla loro pagina con l'URL della fonte primaria; il non confermato si toglie dalla mail | lista delle affermazioni + bozza. Non parte niente senza il sì; invia l'umano |
| 4 | `listicles` | a richiesta | 5 keyword d'acquisto → query "best <keyword> <anno>" → top 10 → per ogni lista: ci siamo? quali competitor? prodotti chiusi, acquisiti o fuori segmento? → prova della chiusura (URL dell'annuncio, data, screenshot): **niente prova, niente pitch** | `geo.md` + una mail per lista, con il testo per lo slot nel loro stile. Se non siamo l'alternativa più vicina, si dice chi lo è |
| 5 | `drip` | **ogni giorno, sul timer** | stato dello scambio → prossimo placement proposto → legge il paragrafo intorno al link e la pagina di destinazione → **test in una frase: cosa ottiene chi legge cliccando?** Senza risposta, rifiuta → rifiuta fuori tema e pagine fatte solo per ospitare link; chiede anchor di brand | `links.md`; un placement per run, mai di più |
| 6 | `linkreview` | **ogni lunedì, sul timer** | link ricevuti negli ultimi 7 giorni: vivi, sulla pagina concordata, verso l'URL concordato, `rel` → Search Console 28 contro 56 giorni: pagine linkate che guadagnano impressioni o perdono clic, query entrate in top 10 → visibilità AI: prompt che ora ci citano, domini citati nuovi aggiunti ai prospect → link recuperati separati dai nuovi, domini referenti separati dai link → pagine con link da meno di 60 giorni: "attesa", nessun giudizio | `reviews/<data>.md` + **5 azioni ordinate per valore di business**, non per numero di link |

Tre cose che dall'articolo non si capivano:

- **Solo due skill girano da sole**, `drip` e `linkreview`. Le altre quattro sono sessioni con l'umano ("chiedimi", "mostrami prima").
- **`drip` non invia niente**: è un controllo di qualità sui link proposti dallo scambio. Il suo test ("cosa ottiene
  chi legge cliccando?") vale per qualunque link, anche fuori dallo scambio.
- **Lo stato vive in file markdown** (`prospects.md`, `reclaim.md`, `geo.md`, `links.md`, `reviews/`). Noi non
  possiamo: il repo `ricca91/dovevalatuaral.com` è pubblico, e prospect e contatti non vanno pubblicati.

Ordine di avvio: setup con GSC → `sources` → `reclaim` → `gift` sui 10 prospect migliori → `drip` quotidiano →
`linkreview` il lunedì → `listicles` quando hai una pagina di confronto da far inserire.
Volume dichiarato per i play `gift`: 10–30 email al mese.

## Cosa ho misurato oggi

### Backlink: il punto zero è zero

- `dovevalatuaral.com`: **2 domini referenti**, `gym-essentials-shop.shop` (nofollow) e `gunghapcafe.com`
  (link immagine, spam score 50). Nessuno dei due è un link utile.
- `jethr.riccsartori.com` **risponde 301** verso `www.dovevalatuaral.com`. Il problema aperto nei piani
  del 5 e del 6 ottobre è risolto.
- Menzioni di "dovevalatuaral" e "dove va la tua ral" nell'indice Content Analysis: zero.
  L'indice è limitato: non prova che non ci siano menzioni.

### I competitor hanno pochi link, e di bassa qualità

| Dominio | Domini referenti | Contesto |
|---|---:|---|
| calcolonetto.it | 1 (nofollow) | 2° per `ral 40000 stipendio netto` a settembre |
| stipendionettocalcolatore.it | 104 | 1° per `livello d2 metalmeccanico stipendio netto` a settembre |

Tra i primi 30 di stipendionettocalcolatore per rank: blog di PMI italiane fuori tema (immobiliare, assicurazioni,
piscine, polizia locale) con link nel corpo, più spam e nofollow. Il pattern è compatibile con articoli comprati
su piattaforme italiane; è un'ipotesi, non una prova. Nessun dominio linka tutti e quattro i competitor principali.

Lettura: in questa nicchia si arriva in prima posizione con pochissimi link. **Bastano pochi link pertinenti,
il volume non serve.**

### Quali fonti cita l'AI sui CCNL

- **ChatGPT** (ricerca web forzata, Italia/it), prompt *"Tabelle retributive CCNL commercio 2026: quanto prende
  netto un 3° livello e quali sono gli aumenti da novembre 2026?"*: cita
  **`dovevalatuaral.com/minimi-ccnl/commercio/`** insieme a `ascom.bo.it`, `filcams.cgil.it`,
  `fisascatcislromaelazio.it` e `tuttocalcolo.it`.
- **AI Overview Google** (Italia/it, domande con "ccnl"), domini più citati in ordine: YouTube, Fiscoetasse,
  ilccnl.it, lavoro-economia.it, kitech.it, Facebook, Coverflex, ARAN, conflavoro.it, Indeed.
  Più in basso: bustaia.it, cislfp.it.

Lettura:

- La pagina commercio è già citata: è la destinazione naturale dei primi link.
- I domini citati accanto a noi (sindacati territoriali, Ascom locali, portali CCNL, studi di consulenza) sono
  la prima lista di prospect. È la coda che l'articolo consiglia di lavorare.
- Distribb consiglia di scartare le domande informative. Per noi vale il contrario: il prodotto risponde proprio
  a domande informative, e le fonti citate sono siti di nicchia, non enciclopedie.
- Sindacati e associazioni linkano raramente siti privati. Ci si aspetta un tasso di link più alto da consulenti,
  portali CCNL e blog HR.

## Cosa si porta e cosa no

| Skill Distribb | Per noi | Perché |
|---|---|---|
| `sources` | **Sì, adattata** | prompt informativi per cluster (CCNL, livello, netto, tredicesima) invece di "best X". DataForSEO fa il lavoro di Distribb |
| `reclaim` | Sì, leggera | oggi c'è poco da recuperare. Restano proprietà proprie (GitHub, LinkedIn, X, riccsartori.com) e testimonianze ai fornitori |
| `gift`: correzioni | **Sì, è il cuore** | i minimi CCNL scadono in date note. Ogni tranche rende superate le pagine di sindacati, consulenti e blog che non si aggiornano. Le fonti primarie sono già verificate in `processo/dati/fonti/` |
| `gift`: diagramma dal loro testo | Più avanti | "dal lordo al netto" spiegato solo a parole → schema con le loro parole |
| `gift`: screenshot | No | non c'è un software di cui rifare gli screenshot |
| `listicles` e Tombstone | Più avanti | liste italiane "migliori calcolatori stipendio netto" da verificare prima. Revisione trimestrale |
| `drip` (scambio link) | **No lo scambio, sì il test** | lo scambio è un link scheme per le policy di Google; il tema (stipendi) è vicino al YMYL; la rete Distribb è SaaS in inglese. Si tengono il ritmo umano e il test "cosa ottiene chi legge cliccando?" su ogni link proposto o ricevuto |
| `linkreview` | **Sì** | GSC + DataFast + DataForSEO. Il punto debole è il token GSC |

Due cose nostre, che nell'articolo non ci sono:

- **Il netto per livello come dono.** Sindacati e associazioni pubblicano il lordo. Il netto per livello, prima e
  dopo l'aumento, è il complemento che non hanno, ed è calcolato dal motore del sito.
- **Il widget incorporabile** (piano ×10, punto 16) è il nostro asset da linkare. Distribb, a chi non ha niente
  da far linkare, consiglia una pagina di statistiche; noi abbiamo le tabelle, e il widget le porta su altri siti.

## Il sistema

### Mappa

Il giro, dalla ricerca dei siti alla misura. `[AGENTE]` gira sul timer, `[TU]` sono i tre punti in cui decidi tu.

```text
 1. TROVARE · primo lunedì del mese                                      [AGENTE]
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ link-fonti     25 prompt sui CCNL → ChatGPT + AI Overview (DataForSEO)       │
 │                → domini citati, via i giganti, tipo di pagina, contatto      │
 │ link-recupero  menzioni senza link · pagine 404 con backlink                 │
 └───────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
                             Airtable: Da qualificare
                                         ▼
                [TU] qualifichi i prospect, 20 min  →  Qualificato
                                         ▼
 2. PREPARARE · martedì + la settimana dopo ogni aumento CCNL            [AGENTE]
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ link-dono  prende fino a 5 prospect Qualificato e legge la loro pagina       │
 │            → confronta minimi, aumenti e decorrenze con il dataset del sito  │
 │            → CANCELLO: ogni correzione ha la sua fonte primaria, o esce      │
 │            → foglio correzioni + netto per livello + mail senza "linkami"    │
 └───────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
            Gmail: bozza   +   Airtable: Bozza pronta, campo Verifica
                                         ▼
 3. INVIARE · martedì e mercoledì                                            [TU]
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ leggi la Verifica → correggi → invii 1–2 email al giorno dal tuo Gmail       │
 │ 7 giorni senza risposta → link-dono prepara un solo sollecito → Chiuso       │
 └───────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
             il sito contattato aggiorna la pagina, e forse ci linka
                                         ▼
 4. MISURARE · lunedì                                                    [AGENTE]
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ link-review  link nuovi: vivi? pagina e URL giusti? rel?                     │
 │              GSC 28 contro 56 giorni · DataFast per sito di provenienza      │
 │              link da meno di 60 giorni = attesa · 5 azioni per valore        │
 └───────────────────────────────────────┬──────────────────────────────────────┘
                                         ▼
                     mail di riepilogo → [TU] la leggi, 5 min
                      domini citati nuovi → si riparte da 1
```

Sotto il cofano, come per `articolo-quotidiano`:

```text
 timer systemd ──▶ run.sh ──▶ claude -p "/link-…" ──▶ Airtable + bozze Gmail
 (Europe/Rome)       │         allowlist: DataForSEO, Airtable, WebFetch,
                     │         Gmail solo bozze e lettura, mai invio
                     └──▶ mail di esito via AgentMail, sempre, anche quando fallisce
```

La sequenza dei ticket:

```text
 13 ott   ●  oggi
 19 ott   ●  RIC-120  Airtable "Outreach" + bozze Gmail da claude -p
 24 ott   ●  RIC-121  link-fonti, primo giro a mano → qualifichi 15 prospect
 26 ott   ●  RIC-122  link-recupero, primo giro a mano
 31 ott   ●  RIC-124  link-dono provato su 2 prospect
  1 nov   ◆  aumento CCNL commercio: le pagine non aggiornate diventano superate
  2 nov   ●  RIC-123  prima link-review
 3–9 nov  ●  RIC-125  5 email commercio, le invii tu
 16 nov   ●  RIC-126  tutto sul timer
 18 dic   ●  RIC-128  revisione a 60 giorni: continuare, cambiare o fermarsi
 gen 2027 ◆  tabelle 2027: secondo momento di pagine superate
```

### Strumenti: cosa sostituisce Distribb

| Funzione | Noi | Stato |
|---|---|---|
| Agente | Claude Code + skill in `.claude/skills/` | come `seo-90-giorni` |
| Fonti citate dall'AI | DataForSEO `ai_optimization_chat_gpt_scraper` (per prompt) + `ai_opt_llm_ment_top_domains` (AI Overview) | provati oggi |
| Backlink, nostri e dei competitor | DataForSEO Backlinks | provato oggi (Distribb non lo ha) |
| Menzioni senza link | DataForSEO Content Analysis + SERP `"dovevalatuaral" -site:dovevalatuaral.com` | indice CA vuoto per noi |
| Search Console | connettore GSC / export | token: dato per risolto, da confermare al primo `link-review` |
| Traffico portato dai link | DataFast API, per referrer | in uso |
| CRM dei prospect | Airtable, base `appAsCWc7NBzY5nam`, nuova tabella "Outreach" | da creare |
| Bozze email | connettore Gmail: bozze su riccsartori@gmail.com, invii tu | confermato; da verificare in `claude -p` |
| Notifiche | AgentMail, come il cron articoli | in uso |
| Pianificazione | timer systemd + `lancia.sh`/`run.sh`, come `articolo-quotidiano` | in uso (`CRON_TZ` qui non funziona) |
| Sviluppo del sistema | Linear | in uso |

Il runner riusa il pattern di `articolo-quotidiano`: l'agente prepara, lo script fa tutto ciò che deve andare
bene sempre (data, guardia anti-doppione, mail come unico punto d'uscita). Qui il runner non committa niente:
l'agente scrive solo su Airtable e nelle bozze Gmail.

Distribb tiene lo stato in file markdown del repo. Noi no: `ricca91/dovevalatuaral.com` è pubblico, e prospect,
contatti e review restano su Airtable e nelle mail.

### Quattro skill

**1. `link-fonti` — mensile.** Trova chi l'AI legge.

- Input: `crescita/link/prompt.md`, 20–25 prompt per cluster (commercio, metalmeccanico, multiservizi,
  cooperative sociali, studi professionali, tredicesima, RAL → netto).
- ChatGPT scraper per prompt e LLM mentions per cluster. Aggrega i domini, scarta i giganti e i competitor
  diretti, classifica la coda: sindacato, associazione datoriale, consulente, portale CCNL, blog HR, testata locale.
- Per ogni dominio: pagina citata, quanti prompt e quanti motori lo citano (ChatGPT e AI Overview; Gemini e
  Perplexity oggi non coperti), tipo, play, contatto **solo se pubblicato sul sito**. Quello che non si trova è "n/d":
  mai DR, traffico o email inventati.
- Annota quali pagine nostre sono citate: sono la metrica GEO del mese e le destinazioni dei link.
- Scrive su Airtable con stato `Da qualificare`. La qualifica la fai tu.

**2. `link-recupero` — mensile, leggera.** 404 con backlink, menzioni senza link, proprietà proprie.
Una volta sola: testimonianze per i fornitori (Vercel, Airtable, DataForSEO, Apify, AgentMail, DataFast, Linear),
con il racconto vero di come il sito è costruito. Senza numeri inventati.

**3. `link-dono` — settimanale, il cuore.**

- Prende fino a 5 prospect `Qualificato`.
- Legge la pagina ed estrae ogni dato controllabile: minimi, aumenti, decorrenze, una tantum, date della tredicesima.
- Confronta con il dataset del sito e con la fonte primaria (accordo di rinnovo, tabelle dei firmatari).
  Classifica: ancora vero, cambiato, superato, non verificabile.
- **Cancello**: una correzione entra nel foglio solo con la fonte primaria. Non verificabile = fuori.
  Se una pagina non ha almeno due correzioni solide, non si scrive.
- La lista delle affermazioni, ognuna con l'URL della fonte primaria, va nel campo "Verifica" di Airtable:
  la leggi prima di inviare la bozza.
- Test del lettore sulla nostra pagina proposta: cosa ottiene chi legge quel paragrafo cliccando? Se la risposta
  è debole, si propone un'altra pagina o nessun link.
- Produce il foglio (frase vecchia, cosa è cambiato, fonte, frase sostitutiva nel loro stile) e la mail,
  senza richiesta di link. Allega il netto per livello con il link alla pagina specifica.
- Crea la bozza in Gmail e mette Airtable su `Bozza pronta`. Non invia.
- Follow-up: thread senza risposta dopo 7 giorni → una sola bozza di sollecito, poi `Chiuso`.

**4. `link-review` — ogni lunedì.**

- Link ottenuti negli ultimi 7 giorni (Airtable `Link ottenuto` + DataForSEO nuovi/persi): vivi, sulla pagina
  concordata, verso l'URL concordato, `rel` registrato, test del lettore superato.
- GSC 28 contro 56 giorni: pagine linkate che guadagnano impressioni o perdono clic, query entrate in top 10.
  DataFast: visitatori dai domini che linkano.
- Una volta al mese, con `link-fonti`: prompt che ora ci citano e domini citati nuovi, aggiunti ad Airtable.
- Si contano a parte link recuperati e link nuovi, domini referenti e link.
- Pagine con link da meno di 60 giorni: "attesa", nessun giudizio.
- Chiude con **5 azioni ordinate per valore di business**, non per numero di link. Mail di riepilogo;
  se GSC non risponde, lo scrive invece di stimare.
- DataFast e GSC sono gli stessi dati del report del lunedì di RIC-109: unire i due report o tenerli separati
  si decide quando si costruisce.

### Tabella Airtable "Outreach"

Dominio · URL pagina · Tipo · Fonte del prospect (ChatGPT, AI Overview, competitor, menzione, fornitore) ·
Prompt o query · Citazioni (prompt, motori) · Tipo di pagina · Play · Nostra pagina di destinazione · CCNL ·
Contatto e dove trovato · **Verifica** (affermazioni + fonte primaria) · **Stato** · Data invio · Data link ·
URL del link · Anchor · `rel` · Recuperato o nuovo · Note.

Stati: `Da qualificare` → `Qualificato` → `Bozza pronta` → `Inviata` → `Follow-up` →
`Link ottenuto` / `Menzione` / `Rifiutato` / `Chiuso`.

## Cadenza

| Quando | Cosa | Chi | Tempo tuo |
|---|---|---|---|
| Lunedì, 07:00 | `link-review` | automatico → mail | 5 minuti |
| Martedì, 07:00 | `link-dono`, al massimo 5 bozze | automatico → bozze Gmail | — |
| Martedì–mercoledì | rileggi, correggi, invia (1–2 al giorno) | tu | 30–45 minuti |
| Primo lunedì del mese | `link-fonti` + `link-recupero` | automatico → Airtable | 20 minuti per qualificare |
| Settimana dopo ogni tranche CCNL | `link-dono` su quel contratto | automatico + tu | come il martedì |
| Ogni trimestre | commercio è in top 10? I link portano clic? Liste e Tombstone? | tu + agente | 1 ora |

Circa un'ora e mezza a settimana, 10–20 invii al mese.

### Perché questa cadenza

- **Il bacino è piccolo.** Chi pubblica tabelle CCNL in italiano è qualche centinaio di siti. Una mail sbagliata
  brucia un prospect per sempre: meglio 5 mail buone a settimana che 50.
- **I dati si muovono a ritmo settimanale.** GSC ha 2–3 giorni di ritardo, i link nuovi entrano negli indici
  in giorni o settimane. Una revisione quotidiana leggerebbe rumore.
- **Le tranche danno la data.** Alla decorrenza di un aumento tutte le pagine non aggiornate diventano superate
  insieme, e la correzione è un fatto, non un'opinione. Il 1° novembre (commercio) è la prima finestra.
- **I link sono lenti.** Si giudicano su 60–90 giorni. Il primo trimestre, in GSC, sembrerà piatto.
- **Prima a mano, poi sul timer.** I primi due giri di `link-dono` li facciamo in sessione: servono a capire
  quali mail ricevono risposta prima di automatizzarle.

## Prossimi 90 giorni

| Periodo | Cosa |
|---|---|
| 13–19 ottobre | Prerequisiti: GSC stabile, tabella Airtable, 20–25 prompt, indirizzo di invio. Punto zero salvato |
| 20–26 ottobre | `link-fonti` a mano, prima volta → qualifichi 15 prospect. `link-recupero` a mano |
| 27 ottobre – 2 novembre | `link-dono` a mano su 5 prospect commercio. Prima, la pagina commercio rinforzata (piano ×10, fase 1): è la destinazione |
| 3–9 novembre | Invii commercio. `link-review` sul timer |
| 10–30 novembre | `link-dono` sul timer. Metalmeccanico se la pagina è pronta |
| Dicembre | Revisione dei primi 60 giorni: risposte e link, non ancora il ranking |
| Gennaio 2027 | Tabelle 2027: secondo grande momento di pagine superate. Tranche commercio di febbraio, da verificare sull'accordo |

### Come capiamo se funziona

- **Processo, ogni mese**: invii, tasso di risposta, link o menzioni ottenuti. Niente target sul numero di link:
  oggi non c'è un tasso di risposta su cui basarlo.
- **Risultato, a 60–90 giorni**: clic e posizione GSC delle pagine linkate, visitatori DataFast dai domini che linkano,
  pagine nostre citate da ChatGPT sugli stessi prompt.
- **Stop (proposta)**: dopo 30 invii con meno di 2 link o menzioni, il play non funziona su questo pubblico.
  Si cambia play (widget, dati per la stampa) invece di alzare il volume.

## Regole fisse

1. L'agente non invia mai. Bozze in Gmail, invii tu.
2. Niente scambi di link, niente link comprati. Se qualcuno chiede soldi: no, oppure `rel="sponsored"`, e decidi tu.
3. Nessuna correzione senza fonte primaria. Un numero sbagliato mandato a un sindacato costa più di dieci link.
4. Un link, una destinazione: la tabella o il livello di cui si parla, non la home.
5. Anchor: il brand ("Dove va la tua RAL"), l'URL o parole neutre.
6. Contatti solo se pubblicati. Mai email indovinate.
7. Al massimo 1–2 invii al giorno.

## Decisioni (13 ottobre)

1. **Bozze Gmail** su riccsartori@gmail.com: confermato. L'agente crea le bozze, Riccardo invia.
2. **QN Media**: nessun vincolo. I dati per la stampa sono un play possibile.
3. **GSC**: secondo Riccardo il problema del token è risolto. Va confermato al primo `link-review`.
4. **Crediti**: Perplexity e Firecrawl si ricaricano al rinnovo. Il sistema backlink non ne dipende.

Ticket: macro RIC-119 "SEO backlink" su Linear, con i sotto-ticket RIC-120 (Airtable e Gmail),
RIC-121 (`link-fonti`), RIC-122 (`link-recupero`), RIC-123 (`link-review`), RIC-124 (`link-dono`),
RIC-125 (primo batch commercio), RIC-126 (runner), RIC-127 (play di secondo livello), RIC-128 (revisione a 60 giorni).
