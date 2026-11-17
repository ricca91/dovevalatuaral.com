# Etichette di triage

Il progetto **non usa** le etichette di default delle skill: si tengono le etichette Linear italiane esistenti e **non se ne creano di nuove**.

## Mappatura dei ruoli

| Ruolo canonico   | Equivalente in Linear                              | Tipo di mappatura |
| ---------------- | -------------------------------------------------- | ----------------- |
| `ready-for-agent` | etichetta **"Pronto per agente"**                 | Etichetta esistente. Significa: specifica completa, un agente può prenderla e implementarla senza altre domande. |
| `needs-info`     | etichetta **"Blocked"**                            | Convenzione. "Blocked" = attività ferma per dipendenza, decisione o accesso mancante. Spiegare nel commento cosa manca. |
| `needs-triage`   | stato Linear **Triage** (o **Backlog**)            | Convenzione. Nessuna etichetta: un ticket non ancora smistato resta in Triage/Backlog. |
| `wontfix`        | stato Linear **Canceled** (o **Duplicate**)        | Convenzione. Nessuna etichetta: si chiude con lo stato e un commento col motivo. |
| `ready-for-human` | nessun equivalente                                | Non esiste un'etichetta né una convenzione: non inventarla. Un ticket per una persona si lascia senza "Pronto per agente". |

## Altre etichette esistenti (non sono ruoli di triage)

- Gruppo **Tipo**: Bug, Feature, Improvement, Spec, Decisione, Ricerca, Mappa, Prototipo
- **Esperimento**
- Gruppo **Reparto**: "Reparto · Prodotto/Tech (Rally)", "Reparto · Contenuti/SEO", "Reparto · Vendite (Sally)"
- Gruppo **Obiettivo**: A / B / C

Queste classificano il ticket, ma non ne indicano lo stato di triage. Non crearne di nuove e non toglierle.
