# -*- coding: utf-8 -*-
import json
from collections import Counter, OrderedDict

r = json.load(open("piano-90-giorni.json", encoding="utf-8"))
MESI = {9: "Settembre", 10: "Ottobre", 11: "Novembre", 12: "Dicembre"}

out = []
w = out.append

w("## Il calendario, giorno per giorno\n")
w("`vol` = volume mensile stimato DataForSEO. Cella vuota = **dato mancante**, non volume zero.")
w("`KD` vuoto = non restituito dal provider. L'angolo completo di ogni articolo sta in Airtable.\n")

cur = None
for x in r:
    m = int(x["Data pubblicazione"].split("-")[1])
    if m != cur:
        cur = m
        w(f"\n### {MESI[m]} 2026\n")
        w("| G | Data | Titolo | Query principale | Vol | KD | Cluster | Prod. | Pri. |")
        w("|--:|---|---|---|--:|--:|---|---|---|")
    vol = f"{x['Volume mensile']:,}".replace(",", ".") if x["Volume mensile"] else "—"
    kd = x["KD"] if x["KD"] is not None else "—"
    prod = {"Busta paga": "BP", "Calcolatore RAL": "RAL", "CCNL": "CCNL",
            "Netto→RAL": "N→R", "Confronto offerte": "Conf."}[x["Prodotto agganciato"]]
    w(f"| {x['Giorno']} | {x['Data pubblicazione'][8:]}/{m:02d} | {x['Titolo']} | "
      f"`{x['Query principale']}` | {vol} | {kd} | {x['Cluster']} | {prod} | {x['Priorita'][0]} |")

w("\n---\n")
w("## Composizione\n")
w("| Cluster | Articoli | Volume confermato (somma grezza) |")
w("|---|--:|--:|")
agg = OrderedDict()
for x in r:
    c = x["Cluster"]
    a = agg.setdefault(c, [0, 0])
    a[0] += 1
    a[1] += x["Volume mensile"] or 0
for c, (n, v) in sorted(agg.items(), key=lambda kv: -kv[1][0]):
    w(f"| {c} | {n} | {v:,}".replace(",", ".") + " |")
w(f"| **Totale** | **{len(r)}** | **" +
  f"{sum(x['Volume mensile'] or 0 for x in r):,}".replace(",", ".") + "** |")
w("\n> La somma dei volumi **non e domanda disponibile**: contiene sinonimi che descrivono la stessa")
w("> ricerca e non vanno sommati. Serve a dare un ordine di grandezza fra cluster, niente di piu.\n")

w("| Prodotto agganciato | Articoli |")
w("|---|--:|")
for k, v in Counter(x["Prodotto agganciato"] for x in r).most_common():
    w(f"| {k} | {v} |")

w("\n| Priorita | Articoli |   | Tipo | Articoli |")
w("|---|--:|---|---|--:|")
pri = Counter(x["Priorita"] for x in r).most_common()
tip = Counter(x["Tipo"] for x in r).most_common()
for i in range(max(len(pri), len(tip))):
    a = f"| {pri[i][0]} | {pri[i][1]} " if i < len(pri) else "|  |  "
    b = f"| {tip[i][0]} | {tip[i][1]} |" if i < len(tip) else "|  |  |"
    out.append(a + "|  " + b)

con = sum(1 for x in r if x["Volume mensile"] is not None)
w(f"\n**Copertura del dato:** {con}/90 articoli hanno un volume confermato da una chiamata "
  f"DataForSEO. I restanti {90-con} hanno in `Query principale` un'etichetta di lavoro interrogata "
  "il 21/09/2026 e **non presente nel database**: sono dichiarati riga per riga nel campo Note, "
  "e chi scrive deve trovare l'head term reale prima di partire.")

open("_calendario.md", "w", encoding="utf-8").write("\n".join(out))
print("righe generate:", len(out))
