# Schema della tabella Airtable — Piano editoriale 90 giorni

_Base: `appAsCWc7NBzY5nam`. Tabella di riferimento esistente: `tblJZuKkpqXJReHhh`._

Una riga = un articolo = un giorno. La riga deve contenere tutto ciò che serve a scrivere
l'articolo **senza rifare ricerca**: chi scrive apre la riga, apre
[`guida-scrittura-articoli.md`](guida-scrittura-articoli.md), e scrive.

## Principio di progettazione

Tre gruppi di campi:

1. **Brief** — cosa scrivere e perché (compilato ora, non si tocca più)
2. **Dati SEO** — i numeri che giustificano la scelta, con la loro provenienza
3. **Produzione** — stato e tracciamento (si aggiorna scrivendo)

I campi del gruppo 1 e 2 sono il lavoro di questo piano. Il gruppo 3 resta vuoto.

## Campi

### Gruppo 1 — Brief

| Campo | Tipo | Contenuto |
|---|---|---|
| `Giorno` | Number | 1-90 |
| `Data pubblicazione` | Date | Data effettiva assegnata |
| `Titolo di lavoro` | Single line text | Non è l'H1 definitivo: è l'oggetto dell'articolo |
| `Slug proposto` | Single line text | `parole-separate-da-trattini` |
| `Query principale` | Single line text | Una sola, quella che l'articolo deve vincere |
| `Query secondarie` | Long text | Varianti che l'articolo copre naturalmente, una per riga |
| `Angolo` | Long text | **Il campo più importante.** 2-4 frasi: qual è la risposta, perché la nostra è migliore di quella che c'è oggi in SERP, cosa deve contenere che gli altri non hanno |
| `People Also Ask` | Long text | Le domande raccolte dalla SERP, una per riga. Vanno risposte nel corpo |
| `Cluster` | Single select | Il tema di appartenenza |
| `Tipo` | Single select | `Pilastro` · `Risposta` · `Sintomo` · `Calcolo` · `Confronto` · `Stagionale` |
| `Prodotto agganciato` | Single select | `Calcolatore RAL` · `Busta paga` · `Netto→RAL` · `CCNL` · `Confronto offerte` · `Nessuno` |
| `CTA` | Single select | L'URL di destinazione, da §7 della guida |
| `Link interni suggeriti` | Long text | URL esistenti verso cui linkare |
| `Ipotesi di calcolo` | Single line text | Il profilo da dichiarare accanto ai numeri |
| `Fonti da citare` | Long text | Atti primari già noti per questo tema (da `fonti.js` o da verificare) |
| `Note` | Long text | Avvertenze specifiche: cosa NON dire, rischi, sovrapposizioni |

### Gruppo 2 — Dati SEO

| Campo | Tipo | Contenuto |
|---|---|---|
| `Volume mensile` | Number | Stima DataForSEO per la query principale |
| `KD` | Number | Keyword difficulty. Vuoto = non disponibile, **non** zero |
| `Intento` | Single select | `Informazionale` · `Info + calcolo` · `Sintomo/problema` · `Transazionale` · `Navigazionale` |
| `Chi domina la SERP` | Long text | I domini in top 5 al momento della rilevazione |
| `AI Overview` | Checkbox | Presente nella SERP al momento del controllo |
| `Difficoltà reale` | Single select | `Bassa` · `Media` · `Alta` · `Istituzionale` — giudizio sulla SERP, non sul KD |
| `Mese di picco` | Single select | Quando la domanda sale, dai dati mensili |
| `Priorità` | Single select | `Alta` · `Media` · `Bassa` |
| `Fonte del dato` | Single line text | L'endpoint DataForSEO da cui viene il numero |
| `Data rilevazione` | Date | Quando è stato misurato |

### Gruppo 3 — Produzione (vuoto ora)

| Campo | Tipo | Contenuto |
|---|---|---|
| `Stato` | Single select | `Da scrivere` · `In scrittura` · `In revisione` · `Pubblicato` · `Scartato` |
| `Lunghezza target` | Number | Parole |
| `File` | Single line text | `prototipo/articoli/{slug}.md` |
| `URL pubblicato` | URL | Dopo il deploy |
| `Fonti verificate il` | Date | Compilato da chi scrive |
| `Note di revisione` | Long text | |

## Viste

| Vista | A cosa serve |
|---|---|
| `Calendario` | Grid ordinata per `Giorno`, è la vista di default |
| `Per cluster` | Raggruppata per `Cluster`, per vedere la copertura tematica |
| `Da scrivere` | Filtro `Stato = Da scrivere`, ordinata per `Giorno` |
| `Alta priorità` | Filtro `Priorità = Alta`, per capire cosa va difeso se il ritmo salta |
| `Aggancio busta paga` | Filtro `Prodotto agganciato = Busta paga` — è l'obiettivo commerciale della fase due |

## Regole di compilazione

- **Nessun numero inventato.** `Volume mensile` e `KD` vengono da una chiamata reale, con
  `Fonte del dato` e `Data rilevazione` compilati. Se DataForSEO non restituisce il KD, il
  campo resta **vuoto**; scriverci `0` sarebbe un dato falso.
- `Angolo` non è un riassunto della query. Se dice «spiegare cos'è il TFR» è scritto male.
  Deve dire **perché il nostro pezzo vince**: un numero che gli altri non danno, un'ipotesi
  che gli altri non dichiarano, una domanda che gli altri non rispondono.
- `Difficoltà reale` prevale sul `KD`. Una query con KD 5 la cui SERP è INPS + Agenzia
  Entrate è `Istituzionale`, non `Bassa`.
- Nessun articolo deve duplicare l'intento di una pagina già esistente (le 17
  `/ral-{N}-netto/`, l'hub, i calcolatori). Se succede, `Note` lo dichiara e l'`Angolo`
  spiega la differenza.
