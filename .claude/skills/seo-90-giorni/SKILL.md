---
name: seo-90-giorni
description: scrive un articolo al giorno per dovevalatuaral.com
disable-model-invocation: true
---

Scrivi e pubblica l'articolo del blog di dovevalatuaral.com previsto per oggi.
Massimo 5 iterazioni.

## Contesto

Il blog porta traffico al sito per sostenere due prodotti: "Ti spiego la busta paga" (carichi il cedolino, il sito spiega ogni riga) e il calcolatore RAL → netto.

Piano editoriale: Airtable, base appAsCWc7NBzY5nam, tabella "Piano editoriale". 90 articoli già definiti, uno per giorno.

## Leggi prima di partire, in quest'ordine

1. /root/ricc-os/projects/dovevalatuaral.com/crescita/piano-editoriale-90gg/guida-scrittura-articoli.md   — come si scrive. La voce e lo standard di verifica stanno qui e vincono su qualunque default delle skill, incluso context/brand.md.
2. .../piano-editoriale-90-giorni.md — perché il piano è fatto così.
3. .../ricerca/ — quattro documenti: teardown dei competitor sulla busta paga, sul calcolatore RAL, sui veri occupanti della top 10, più l'universo keyword con 397 keyword misurate e le PAA. LA RICERCA COMPETITOR È GIÀ FATTA: leggila, non rifarla. Usa DataForSEO solo per ciò che manca davvero.

## Quale articolo

Il record con Data pubblicazione = oggi. Se manca o è già Pubblicato, il primo con Stato = "Da scrivere" ordinato per Giorno.

Se nelle Note c'è scritto che la query non è confermata dal database, allora l'ampliamento con DataForSEO è obbligatorio: trova l'head term reale prima di scrivere.

## Come scrivi

Loop: seo:seo-article per scrivere, seo:seo-audit per valutare.
Entrambe le skill aprono domande interattive: NON aprirle. Passa direttamente
keyword, angolo, PAA e scaletta presi dalla riga Airtable, e chiedi l'audit completo.

Soglia: SEO Score >= 90 E AEO Score >= 90. Massimo 5 iterazioni.
Se dopo 5 iterazioni non ci arrivi: NON pubblicare. Lascia stato: bozza,
metti Airtable su "In revisione", e dillo nella mail col punteggio raggiunto.

## Il file

prototipo/articoli/{slug}.md, dove {slug} è lo Slug proposto della riga. Il nome del file deve essere esattamente {slug}.md.

Frontmatter obbligatorio, tutti i campi, nessun campo in più (l'unico opzionale ammesso è data_aggiornamento): slug, titolo, title_seo, description, query_principale, cluster, data_pubblicazione, cta, link_interni, ipotesi_calcolo, fonti_verificate, stato

Attenzione:
- data_pubblicazione è la data di OGGI, quella in cui il runner pubblica davvero, non
  quella della riga Airtable. Il piano su Airtable resta il riferimento interno per
  l'ordine; il lettore non deve mai vedere una data futura sulla pagina.
- cluster va in minuscolo-con-trattini: "Voce per voce" diventa voce-per-voce
- link_interni è un array JSON inline di path che iniziano con /
- i link interni sono validati: se la rotta non esiste, la build fallisce
- stato: pubblicato solo se hai superato la soglia, altrimenti bozza

Markdown: sono ammessi ##, ###, tabelle, liste, blockquote, ---, e inline
code/grassetto/corsivo/link. Fanno FALLIRE la build: # (H1), #### e oltre,
immagini, code fence, liste annidate, righe indentate, HTML grezzo.
Nelle tabelle ogni riga deve avere le stesse celle dell'intestazione.

CTA: quella della riga. MA il runner ti passa nei RUNNER FACTS lo stato HTTP reale di
https://www.dovevalatuaral.com/busta-paga.html — non controllarlo tu. Se non è 200,
la CTA va al calcolatore (/) e lo scrivi in REPORT_NOTE.

## Prima di chiudere

    npm test
    node prototipo/genera-articoli.js

Servono a te per correggerti: se falliscono, il file è rotto e lo aggiusti ora.
Il runner li rieseguirà comunque come cancello, e un fallimento lì blocca la pubblicazione.

## Cosa NON fai

Non committi, non pushi, non mandi mail: sono del runner `processo/cron/articolo-quotidiano/run.sh`,
che gira dopo di te e sa cose che tu non puoi sapere (se il push è riuscito, se la build è passata).
Se lo facessi tu, la mail potrebbe annunciare come pubblicato un articolo mai arrivato su main.

Su Airtable tocchi lo Stato solo per dire il vero adesso:
- sotto soglia dopo 5 iterazioni → `In revisione`
- `Pubblicato` NON lo metti mai tu: lo mette il runner dopo un push riuscito

## Il report

Chiudi la risposta con questo blocco, una coppia per riga, niente altro dopo.
Il runner lo legge con grep: valori su una riga sola, nessuna riga vuota in mezzo.

    REPORT_SLUG=lo-slug-esatto-del-file
    REPORT_RECORD_ID=recXXXXXXXXXXXXXX
    REPORT_TITOLO=il titolo dell'articolo
    REPORT_QUERY=la query principale
    REPORT_ITERAZIONI=3
    REPORT_SEO=92
    REPORT_AEO=91
    REPORT_STATO=pubblicato
    REPORT_CTA=/busta-paga.html
    REPORT_NOTE=tutto ciò che non è riuscito o che hai assunto, in una riga sola

`REPORT_STATO` deve coincidere col campo `stato` del frontmatter: è quello che decide
se il runner pubblica. Se non hai superato la soglia scrivi `bozza` in entrambi.
Se un valore non lo hai, scrivi `REPORT_NOTE=` con la spiegazione: mai inventarlo.

Prima del blocco, in prosa e in poche righe, dimmi com'è andata: cosa hai verificato
davvero e cosa resta da confermare al deploy. Finisce nella mail.
