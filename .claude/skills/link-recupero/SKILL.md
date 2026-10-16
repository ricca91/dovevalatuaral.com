---
name: link-recupero
description: giro mensile di recupero link per dovevalatuaral.com (link persi verso pagine 404/410, menzioni senza link)
disable-model-invocation: true
---

Fai il giro mensile di recupero link di dovevalatuaral.com: link persi verso pagine 404/410 e menzioni senza link.
Al massimo 5 bozze Gmail per run.

## Contesto

Prima di chiedere link a sconosciuti si raccolgono quelli che sono già nostri: chi linka una pagina che non
esiste più, chi nomina il sito senza linkarlo. Spec: `crescita/sistema-backlink-2026-10-13.md`, skill 2.

Lo stato vive su Airtable, base `appAsCWc7NBzY5nam`, tabella **Outreach** (`tbl3ELP9SWiFPTO2A`). Il repo è
pubblico: prospect, contatti e frasi trovate stanno solo su Airtable e nelle bozze, mai in un file del repo.

La parte una tantum di RIC-122 (proprietà proprie, testimonianze ai fornitori) è chiusa: i fornitori hanno già un
record con Fonte = `Fornitore`. Qui non li ricontatti, e non ricontrolli le proprietà di Riccardo (README, GitHub,
riccsartori.com, profili): si sono sistemate una volta sola.

Data del run: quella dei RUNNER FACTS se ci sono, altrimenti oggi.

## Regole fisse

1. Le email restano bozze: Gmail solo con `create_draft`, `list_drafts`, `get_draft`, `search_threads`,
   `get_thread`, `get_message`. Invia sempre e solo Riccardo.
2. Ogni affermazione nel record e nella bozza ha la sua prova: l'URL e l'esito di `verifica-pagina.js`. Quello che
   non hai verificato si scrive `n/d` o `non verificato`.
3. Contatti solo se pubblicati sul sito, con l'URL della pagina dove li hai letti.
4. Un link, una destinazione specifica: la pagina nostra di cui parla il loro paragrafo, mai la home.
   Anchor: il brand ("Dove va la tua RAL"), l'URL o parole neutre.
5. Niente scambi di link, niente link comprati.

## Lo strumento: `verifica-pagina.js`

    node processo/link/verifica-pagina.js <url> [<url>...]

Una riga JSON per URL: `stato` HTTP, `esito`, `urlFinale` dopo i redirect, `link` (ogni `<a>` verso
`dovevalatuaral.com`, `www.` o il dominio di lancio `jethr.riccsartori.com`, con `href`, `testo`, `rel`) e
`menzioni` (i paragrafi visibili che nominano il sito).

- `esito: morta` solo per 404 e 410. 403, 429, 5xx, 999 (LinkedIn), timeout ed errori di rete danno
  `non verificato`: una richiesta bloccata non prova niente.
- Legge l'HTML servito, non quello disegnato da JavaScript. Su Instagram, Facebook, LinkedIn, X, TikTok e YouTube
  `link: []` e `menzioni: []` non provano assenza: lì decidi dallo snippet della SERP o da WebFetch, e lo scrivi.
- Un link a `jethr.riccsartori.com` è già nostro (301 verso www): conta come link presente.

## 1. Link persi

1. `backlinks_backlinks` con `target: "dovevalatuaral.com"`, `filters: ["url_to_status_code", "in", [404, 410]]`,
   `limit: 1000`. Ripeti con `target: "jethr.riccsartori.com"`. Il crawl di DataForSEO può essere vecchio di settimane.
2. Per ogni risultato, `verifica-pagina.js` su `url_to` e su `url_from`. È un link perso solo se la pagina nostra è
   `morta` adesso **e** la loro pagina è `viva` con quel link in `link`. Se una delle due è `non verificato`, il
   link va nel report come non verificato, con il motivo.
3. Per ogni link perso confermato scegli la pagina equivalente dalla sitemap
   (`https://www.dovevalatuaral.com/sitemap.xml`) e controllala con `verifica-pagina.js` (`viva`, senza redirect
   verso la home). Il piano è una riga per link, nel formato di `vercel.json`:
   `{"source": "/vecchio", "destination": "/nuovo/", "permanent": true}`. Senza pagina equivalente: nessun
   redirect, lo dici.
4. Il piano va nel report: lo applica Riccardo, con una PR, dopo averlo letto.

Fatto quando: ogni backlink restituito è classificato come perso, vivo o non verificato.

## 2. Menzioni senza link

Ricerche (DataForSEO, `location_name: "Italy"`, `language_code: "it"`, `depth: 100`):

- `serp_organic_live_advanced` con `"dovevalatuaral" -site:dovevalatuaral.com`
- `serp_organic_live_advanced` con `"dove va la tua ral"`
- `content_analysis_search` con `dovevalatuaral` e con `"dove va la tua ral"`, `limit: 100`

Google riscrive le parole che non conosce e scioglie le virgolette: il 15/10/2026 `"dovevalatuaral"` è diventato
`"dove al natural"` (si vede nell'URL della SERP) e nessun risultato conteneva il brand. Quindi la query non
qualifica niente: qualifica solo la pagina.

1. Raccogli gli URL organici e di Content Analysis. Togli `dovevalatuaral.com` e le proprietà di Riccardo
   (`riccsartori.com`, `linkedin.com/in/riccsartori` e i suoi post `linkedin.com/posts/riccsartori_…`,
   `github.com/ricca91`).
2. `verifica-pagina.js` su tutti, in una chiamata. È una **menzione senza link** se `menzioni` (o, sui social, lo
   snippet) nomina il sito e `link` è vuoto. Con un link già presente non c'è niente da chiedere.
3. Leggi il paragrafo. Il nome è anche una frase comune ("dove va la tua RAL quando cambi lavoro"): conta solo se
   parla del sito o del calcolatore.
4. Cerca su Airtable un record con lo stesso `URL pagina`: se c'è, la menzione è già registrata e passi oltre.
5. Pagina nostra da citare: quella che risponde al paragrafo (una cifra di RAL → `/ral-<n>-netto/`, un contratto →
   `/minimi-ccnl/<slug>/`, il lancio → `/la-storia.html`, il gioco → `/netto-o-niente.html`). Test del lettore:
   cosa ottiene chi legge quel paragrafo cliccando? Se nessuna pagina lo supera, `n/d` e la scelta resta a Riccardo.
6. Contatto editoriale: pagina contatti, redazione, chi siamo del loro sito (WebFetch). Un indirizzo pubblicato o un
   modulo, con l'URL dove l'hai letto. Un post social non ha contatto editoriale: `n/d`.

Fatto quando: ogni URL raccolto è scartato con un motivo o registrato.

## Il record su Airtable

Server Airtable: quello che hai tra `mcp__plugin_airtable_airtable__*` e `mcp__claude_ai_Airtable__*`.
Un record per menzione senza link e per link perso che chiede un intervento loro (il redirect non basta):

| Campo | Valore |
|---|---|
| Dominio | senza protocollo né `www.` |
| URL pagina | la loro pagina |
| Tipo | la scelta vera tra quelle esistenti, altrimenti vuoto |
| Fonte del prospect | `Menzione` |
| Prompt o query | la ricerca che l'ha trovata |
| Tipo di pagina | articolo, post social, forum, guida… |
| Play | `Menzione` |
| Nostra pagina di destinazione | dal passo 5, o vuoto |
| Contatto / Dove trovato il contatto | dal passo 6, o `n/d` |
| Verifica | `<data>: verifica-pagina.js esito <esito>, link [], frase «…»` |
| Recuperato o nuovo | `Recuperato`, per i link persi e per le menzioni: sono link già nostri da riprendere |
| Stato | `Bozza pronta` se hai creato la bozza, altrimenti `Da qualificare` |
| Note | id della bozza Gmail, o perché la bozza non c'è |

## La bozza

Solo se c'è un indirizzo email pubblicato. Testo semplice, italiano, firmata Riccardo Sartori, breve:

- chi è Riccardo e che ha costruito Dove va la tua RAL;
- dove ci hanno citato, con la loro frase tra virgolette, e un grazie;
- la pagina nostra che corrisponde al paragrafo e cosa ci trova chi clicca, in una frase: un solo link;
- che il testo può restare com'è, se preferiscono.

`create_draft` con `to`, `subject`, `body`. Se il tool Gmail non c'è in questo run, il record resta
`Da qualificare` con la nota "bozza non creata: Gmail non disponibile".

## Cosa NON fai

Le modifiche al sito (redirect in `vercel.json`) sono di Riccardo: tu scrivi il piano. Non committi,
non pushi, non mandi mail: la mail di esito la manda il runner. Su Airtable crei record e ne aggiorni solo lo Stato
dei tuoi; i record degli altri playbook li leggi soltanto.

## Il report

Prima del blocco, in poche righe di prosa: cosa hai cercato, quanti risultati, cosa hai verificato davvero e cosa è
rimasto non verificato. Zero menzioni è un esito valido: scrivilo così. Finisce nella mail.

Poi chiudi con questo blocco, una coppia per riga, niente altro dopo. Il runner lo legge con grep: valori su una riga
sola, nessuna riga vuota in mezzo.

    REPORT_DATA=2026-11-02
    REPORT_FONTI=backlinks 2+0, SERP 10+10, Content Analysis 0+0
    REPORT_LINK_PERSI=0
    REPORT_LINK_NON_VERIFICATI=0
    REPORT_PIANO_REDIRECT=nessuno
    REPORT_MENZIONI=0
    REPORT_RECORD=nessuno
    REPORT_BOZZE=0
    REPORT_NOTE=tutto ciò che non è riuscito o che hai assunto, in una riga sola

`REPORT_RECORD` elenca gli id `rec…` creati, separati da virgola. `REPORT_PIANO_REDIRECT` mette i redirect proposti
separati da `;`. Se un valore non lo hai, scrivi `REPORT_NOTE=` con la spiegazione: mai inventarlo.
