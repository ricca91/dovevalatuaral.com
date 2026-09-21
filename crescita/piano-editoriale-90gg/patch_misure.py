# -*- coding: utf-8 -*-
"""Applica al piano le misure DataForSEO del 21/09/2026 (keyword_overview, Italia/it).
Le keyword NON restituite dall'endpoint restano senza volume: e un dato mancante,
non un volume zero, e viene dichiarato come tale."""
import json

# keyword -> (volume, kd, intento, nota_dal_dato)
M = {
 "detrazioni lavoro dipendente": (8100, None, "Informazionale", "Picco gennaio 12.100. Trend annuo -19%."),
 "imponibile previdenziale": (1300, None, "Informazionale", "Picco marzo 3.600, coerente con il periodo CU."),
 "esempio di calcolo conguaglio fiscale": (480, None, "Informazionale", "STAGIONALITA FORTE CONFERMATA: 1.300 a dicembre 2025 e 2.900 a gennaio 2026 contro 480 di media. La finestra e questa."),
 "addizionale comunale busta paga": (320, None, "Informazionale", "Picco gennaio-marzo 480."),
 "quando arriva il conguaglio in busta paga": (260, None, "Informazionale", "CONFERMA NETTA: 10 a ottobre 2025, 260 a dicembre, 1.600 a gennaio. Trend annuo +400%. Pubblicare a dicembre e corretto."),
 "addizionale regionale busta paga": (260, None, "Informazionale", "Picco gennaio-febbraio 590."),
 "100 euro lordi quanto sono netti": (260, 11, "Informazionale", None),
 "banca ore busta paga": (140, None, "Sintomo/problema", "Intento rilevato navigazionale: molti cercano il gestionale aziendale, non la spiegazione. Volume reale inferiore."),
 "cessione del quinto busta paga": (140, 5, "Informazionale", "CPC 5,04 EUR: query presidiata da inserzionisti del credito. Attenzione all'intento commerciale in SERP."),
 "busta paga apprendistato": (110, None, "Informazionale", None),
 "trattenute fiscali busta paga": (90, None, "Sintomo/problema", None),
 "cuneo fiscale busta paga": (50, None, "Informazionale", "Volume basso. Il provider rileva lingua 'es': leggere il dato con prudenza."),
 "minimo tabellare busta paga": (50, 11, "Sintomo/problema", "Volume basso: vale come supporto al cluster CCNL, non come target autonomo."),
 "quanto costa un dipendente all'azienda": (50, None, "Transazionale", "Intento COMMERCIALE e CPC 3,01 EUR: la SERP e di fornitori di servizi payroll, non informativa."),
 "ratei busta paga": (40, 30, "Sintomo/problema", "KD 30, il piu alto del gruppo. Il provider rileva lingua 'de'. Volume basso: e un pezzo di collegamento interno, non di acquisizione."),
 "arretrati in busta paga": (30, 12, "Informazionale", "Volume basso ma picco a novembre (70), coerente con la stagione dei rinnovi."),
 "premio di risultato busta paga": (30, None, "Informazionale", "Volume basso sulla stringa esatta: il pezzo vive come pagina-sintomo, non come target di keyword."),
 "conguaglio cambio lavoro": (20, None, "Informazionale", "Volume basso ma picco dicembre-gennaio (40). Supporto al cluster conguaglio."),
 "progressivi busta paga": (20, None, "Sintomo/problema", "Volume basso: pezzo di collegamento e di aggancio al prodotto, non di acquisizione."),
 "busta paga tempo determinato": (10, 18, "Informazionale", "VOLUME MOLTO BASSO (10). Trend annuo -75%. Tenerlo solo per completare il cluster esempi, o sostituirlo."),
 "welfare aziendale busta paga": (10, 13, "Informazionale", "VOLUME MOLTO BASSO sulla stringa esatta. L'head term 'welfare aziendale' vale 27.100 ma e territorio di Coverflex, che il welfare lo vende. Intento rilevato navigazionale."),
 "prima busta paga": (10, 47, "Navigazionale", "SCARTARE LA QUERY: volume 10, KD 47, intento NAVIGAZIONALE (la gente cerca un'azienda, non una spiegazione). Il tema resta valido, la keyword no: ritrovare un head term migliore prima di scrivere."),
}

# Keyword interrogate e NON restituite dal database: dato mancante, non volume zero.
NON_IN_DB = {
 "straordinari non pagati busta paga", "busta paga maternita", "tredicesima piu bassa",
 "ultima busta paga dimissioni", "scatti di anzianita busta paga", "malattia lunga busta paga",
 "sigle busta paga", "stipendio gennaio piu basso", "verificare contributi versati",
 "permessi non retribuiti busta paga", "tfr in busta paga non c'e", "ral promessa netto diverso",
 "confronto offerte di lavoro stipendio netto", "aliquote irpef 2027",
 "busta paga con trasferta esempio", "due contratti di lavoro tasse busta paga",
 "controllo busta paga mensile", "addizionale comunale differenze", "confronto buste paga anno",
}

rec = json.load(open("piano-90-giorni.json", encoding="utf-8"))
mis = deg = 0
for x in rec:
    q = x["Query principale"]
    if q in M:
        vol, kd, intento, nota = M[q]
        x["Volume mensile"] = vol
        if kd is not None:
            x["KD"] = kd
        x["Intento"] = intento
        x["Fonte del dato"] = "DataForSEO keyword_overview 21/09/2026"
        x["Data rilevazione"] = "2026-09-21"
        if nota:
            x["Note"] = (x["Note"] + " — " if x["Note"] else "") + nota
        mis += 1
        # declassamento automatico sui volumi risibili
        if vol is not None and vol < 60 and x["Priorita"] != "Bassa":
            x["Priorita"] = "Bassa"
            x["Note"] += " [Priorita abbassata a Bassa: volume misurato sotto 60.]"
            deg += 1
    elif q in NON_IN_DB:
        x["Fonte del dato"] = "interrogata il 21/09/2026, NON presente nel database DataForSEO"
        x["Note"] = (x["Note"] + " — " if x["Note"] else "") + (
            "QUERY NON CONFERMATA: interrogata su keyword_overview il 21/09/2026 e non "
            "restituita. E un dato mancante, non un volume zero. La stringa in 'Query principale' "
            "e un'etichetta di lavoro: chi scrive deve trovare l'head term reale prima di partire. "
            "Il pezzo e giustificato dal cluster e dal format, non da questa keyword.")

json.dump(rec, open("piano-90-giorni.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

from collections import Counter
con = sum(1 for x in rec if x["Volume mensile"] is not None)
print(f"misurate ora: {mis} · declassate per volume basso: {deg}")
print(f"volume confermato: {con}/90 · non confermato e dichiarato: {90-con}/90")
print()
print("PRIORITA dopo il declassamento")
for k, v in Counter(x["Priorita"] for x in rec).most_common():
    print(f"  {v:3}  {k}")
