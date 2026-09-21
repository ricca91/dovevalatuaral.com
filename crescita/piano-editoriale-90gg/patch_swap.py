# -*- coding: utf-8 -*-
"""Sostituisce tre slot il cui bersaglio, una volta misurato, si e rivelato sbagliato,
con le tre keyword forti rimaste inutilizzate nella ricerca."""
import json

SWAP = {
 34: dict(
  Titolo="Tassazione del TFR: quanto ti resta davvero della liquidazione",
  **{"Slug proposto": "tassazione-tfr",
     "Query principale": "tassazione tfr",
     "Query secondarie": "come funziona il tfr; tfr come funziona; tfr tassazione separata",
     "Volume mensile": 9900, "KD": None, "Intento": "Informazionale",
     "Cluster": "TFR", "Tipo": "Calcolo", "Prodotto agganciato": "Calcolatore RAL",
     "CTA": "/", "Priorita": "Alta", "Difficolta reale": "Media", "Mese di picco": None,
     "Angolo": "Sostituisce lo slot 'prima busta paga', scartato dopo la misurazione (volume 10, KD 47, intento navigazionale). 9.900 di volume ed e la keyword piu grossa rimasta libera in tutta la ricerca: Coverflex e in posizione 6, BustaIA in posizione 39 con un articolo generico. La domanda vera e una sola e nessuno le risponde col conto: dei X euro accantonati, quanti ne vedo? La tassazione separata usa l'aliquota media dei cinque anni precedenti, non quella dell'anno in corso: e il punto che tutti saltano e che cambia il risultato di migliaia di euro.",
     "Note": "Non confondere tassazione separata e IRPEF ordinaria: e l'errore piu diffuso nei contenuti concorrenti. Coppia con il giorno 10 (calcolo) e il giorno 52 (anticipo): linkarli.",
     "Fonte del dato": "DataForSEO 20/09/2026"}),

 67: dict(
  Titolo="Preavviso: quanto vale, e cosa succede se non lo lavori",
  **{"Slug proposto": "preavviso-dimissioni-busta-paga",
     "Query principale": "preavviso dimissioni",
     "Query secondarie": "indennita di mancato preavviso; preavviso non lavorato busta paga",
     "Volume mensile": 8100, "KD": None, "Intento": "Informazionale",
     "Cluster": "Esempi per casistica", "Tipo": "Calcolo", "Prodotto agganciato": "Busta paga",
     "CTA": "/busta-paga.html", "Priorita": "Alta", "Difficolta reale": "Media",
     "Mese di picco": None,
     "Angolo": "Sostituisce lo slot 'busta paga tempo determinato', scartato dopo la misurazione (volume 10, trend annuo -75%). 8.100 di volume, presidiato da Stipendee in posizione 9 con un articolo generico e senza il conto. Tre casi che la gente confonde e che producono tre cedolini diversi: preavviso lavorato, indennizzato dal datore, non prestato e quindi trattenuto. Per ognuno l'importo, come si calcola sulla retribuzione di fatto, e dove compare in busta.",
     "Note": "Coordinare col giorno 56 (cedolino di fine rapporto): quello e la vista d'insieme, questo e la singola voce. Linkarli reciprocamente ed evitare che si sovrappongano.",
     "Fonte del dato": "DataForSEO 20/09/2026"}),

 81: dict(
  Titolo="Trattamento integrativo, l'ex bonus Renzi: perche c'e o non c'e in busta paga",
  **{"Slug proposto": "trattamento-integrativo-bonus-renzi",
     "Query principale": "bonus renzi busta paga",
     "Query secondarie": "trattamento integrativo busta paga; bonus 100 euro busta paga",
     "Volume mensile": 880, "KD": None, "Intento": "Sintomo/problema",
     "Cluster": "IRPEF e manovra", "Tipo": "Sintomo", "Prodotto agganciato": "Calcolatore RAL",
     "CTA": "/", "Priorita": "Media", "Difficolta reale": "Bassa", "Mese di picco": None,
     "Angolo": "Sostituisce lo slot 'welfare aziendale busta paga', scartato dopo la misurazione (volume 10, e l'head term e territorio di Coverflex che il welfare lo vende). 880 di volume e BustaIA non posizionata. Intento sintomo puro: la gente vede sparire una voce e non sa perche. Le regole sono gia nel catalogo fonti verificate del progetto (D.L. 3/2020 art. 1 per il trattamento integrativo, L. 207/2024 art. 1 c. 4-5 e c. 6): il conto e gia difendibile. Mostrare le soglie e cosa succede esattamente quando le superi di poco, che e uno dei salti del netto.",
     "Note": "La denominazione popolare (bonus Renzi) non coincide piu con la norma vigente: usare entrambe, spiegando la differenza, senza dare per buona la vecchia.",
     "Fonte del dato": "DataForSEO 20/09/2026"}),
}

rec = json.load(open("piano-90-giorni.json", encoding="utf-8"))
by_day = {x["Giorno"]: x for x in rec}
for giorno, campi in SWAP.items():
    old = by_day[giorno]["Query principale"]
    by_day[giorno].update(campi)
    by_day[giorno]["Data rilevazione"] = "2026-09-21"
    print(f"giorno {giorno}: '{old}' -> '{campi['Query principale']}' ({campi['Volume mensile']}/mese)")

slugs = [x["Slug proposto"] for x in rec]
assert len(set(slugs)) == 90, "slug duplicati dopo lo swap"
assert len(rec) == 90
json.dump(rec, open("piano-90-giorni.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)

from collections import Counter
con = sum(1 for x in rec if x["Volume mensile"] is not None)
tot = sum(x["Volume mensile"] for x in rec if x["Volume mensile"])
print()
print(f"volume confermato: {con}/90 · somma grezza volumi: {tot:,} (NON e domanda disponibile: contiene sinonimi sovrapposti)")
for k, v in Counter(x["Priorita"] for x in rec).most_common():
    print(f"  {v:3}  {k}")
