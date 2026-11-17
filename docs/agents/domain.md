# Documentazione di dominio

Come le skill di ingegneria leggono la documentazione di dominio di questo repo.

## Prima di esplorare, leggi questi

- **`GLOSSARY.md`** alla radice del repo: il vocabolario del dominio.
- **`processo/decisioni.md`**: il registro delle decisioni. Questo progetto **non usa `docs/adr/`** (e non va creata). Le decisioni stanno qui, più i commenti di risoluzione sui ticket Linear.

Se uno di questi file non esiste, **procedi in silenzio**: non segnalarlo e non suggerire di crearlo in anticipo.

## Struttura (single-context)

```
/
├── GLOSSARY.md
├── processo/
│   └── decisioni.md
└── ...
```

## Regole per chi legge

- Usa i termini del `GLOSSARY.md` nei titoli dei ticket, nei piani di refactoring, nelle ipotesi dei test e nei nomi.
- Se un concetto che ti serve non è nel glossario, o lo stai inventando, segnalalo: è un vuoto del glossario.
- Se il tuo output contraddice una decisione di `processo/decisioni.md`, dillo esplicitamente invece di ignorarla.
- Nuove decisioni: aggiungile a `processo/decisioni.md` (solo se richiesto) e commenta il ticket Linear corrispondente.
