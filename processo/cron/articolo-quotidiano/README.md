# articolo-quotidiano — il piano editoriale che si scrive da solo

Ogni mattina alle **06:30 ora italiana** scrive l'articolo del giorno previsto dal piano
editoriale a 90 giorni, lo verifica, e se supera la soglia lo pusha su `main` — da cui
Vercel lo mette online. Poi ti manda una mail da `claude.sartori@agentmail.to`.

## Chi fa cosa, e perché è diviso così

| | fa |
|---|---|
| l'agente<br>(`.claude/skills/seo-90-giorni`) | sceglie la riga Airtable del giorno, scrive, fa l'audit fino a 90/90 (max 5 iterazioni), salva `prototipo/articoli/{slug}.md`, chiude con un blocco `REPORT_` |
| `run.sh` | la data, la guardia anti-doppione, il controllo che il checkout sia origin/main, `npm test`, la build, il commit, il push, l'aggiornamento Airtable e **l'invio della mail** |

La divisione non è estetica. Un agente non può riferire l'esito di un'azione che non ha
ancora compiuto: se fosse lui a mandare la mail, quella mail direbbe "pubblicato" anche
quando il push è fallito. Il runner manda la mail dopo, e sa com'è andata davvero.

## I file

| file | a cosa serve |
|---|---|
| `lancia.sh` | crea un worktree usa e getta di origin/main, ci lancia `run.sh`, poi lo rimuove |
| `run.sh` | l'unico responsabile di tutto ciò che deve andare bene sempre |
| `systemd/` | timer, servizio e avviso di fallimento, come installati in `/etc/systemd/system/` |
| `test/test.sh` | 14 casi su repo fixture con stub: nessun Opus, nessuna mail, nessun push veri |

Fuori dal repo, sul VPS:

| percorso | cos'è |
|---|---|
| `/root/cron/dovevalatuaral.git` | clone bare: il database git del job, nessun branch in uso |
| `/root/cron/articolo-quotidiano/lancia.sh` | la copia installata di `lancia.sh`, quella che systemd esegue |
| `/root/cron/articolo-quotidiano/logs/` | un log per giorno |
| `/root/cron/articolo-quotidiano/logs/state` | la guardia anti-doppione: data e slug dell'ultimo articolo pubblicato |
| `/root/cron/articolo-quotidiano/run-*` | worktree di un run; resta solo se c'è un articolo non arrivato su origin |

## Perché un worktree usa e getta

Fino al 2026-09-24 il job aveva un checkout fisso su `main`. Due problemi: git non
permette lo stesso branch in due worktree, quindi nessun'altra cartella poteva più
fare `git checkout main`; e ogni run lasciava lì il suo output, che il run dopo doveva
ripulire. Ora ogni run parte da un checkout nuovo di origin/main e lo butta alla fine.
Se l'articolo non è arrivato su origin (bozza, build rotta, push fallito) il worktree
resta, e la mail dice dove.

Le istruzioni editoriali **non** stanno qui: stanno nella skill. Questo file non le duplica.

## I cancelli, in ordine

Un articolo arriva online solo se passa tutti e cinque:

1. il checkout è esattamente origin/main (altrimenti non parte nemmeno)
2. `claude` è uscito con rc=0 entro 45 minuti
3. in `prototipo/articoli/` è comparso davvero un file nuovo
4. `npm test` **e** `node prototipo/genera-articoli.js` passano — rieseguiti dal runner
   anche se l'agente giura di averli già passati
5. il frontmatter dice `stato: pubblicato`, cioè SEO ≥ 90 **e** AEO ≥ 90

Sotto soglia l'articolo resta `bozza`: la build lo scarta (`genera-articoli.js` filtra
`stato === 'pubblicato'`), quindi non finisce online nemmeno per sbaglio. Ogni esito —
successo, bozza, build rotta, run fallito — produce una mail. Il silenzio significa che
il cron non è partito, non che è andato tutto bene.

Il `git add` prende **solo** il file dell'articolo, e il push è `HEAD:main`. Se nei minuti
del run è stato mergiato un PR, il push viene rifiutato: `run.sh` fa un rebase, rifà test
e build sul main nuovo e riprova **una** volta. Se fallisce ancora, mail e worktree lasciato.

## Testarlo

```bash
# stub: veloce, gratis, non tocca niente di vero
processo/cron/articolo-quotidiano/test/test.sh

# prova vera ma senza pubblicare: scrive l'articolo, gira test e build,
# NON pusha, NON tocca Airtable, NON manda la mail (te la stampa nel log).
# Il worktree resta (c'è un articolo non committato): cancellalo dopo averlo letto.
DRY_RUN=1 /root/cron/articolo-quotidiano/lancia.sh
cat /root/cron/articolo-quotidiano/logs/$(date +%F).log
```

## Accenderlo

È un timer systemd, non cron: il cron di questo VPS (3.0pl1) ignora `CRON_TZ`, e
l'articolo deve uscire alle 06:30 di Roma anche col cambio d'ora.

```bash
# una volta: il database git del job
git clone --bare git@github.com:ricca91/dovevalatuaral.com.git /root/cron/dovevalatuaral.git
git -C /root/cron/dovevalatuaral.git config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git -C /root/cron/dovevalatuaral.git fetch origin

# a ogni modifica di lancia.sh o delle unit (da un checkout aggiornato di main)
install -D -m 755 processo/cron/articolo-quotidiano/lancia.sh /root/cron/articolo-quotidiano/lancia.sh
cp processo/cron/articolo-quotidiano/systemd/* /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now articolo-quotidiano.timer
systemctl list-timers articolo-quotidiano.timer
```

`run.sh` invece non si installa: arriva ogni mattina da origin/main.
Per fermarlo: `systemctl disable --now articolo-quotidiano.timer`.

## Come viene invocata la skill (e perché non col tool Skill)

`seo-90-giorni` ha `disable-model-invocation: true`, e il flag **resta**: senza, una
qualunque sessione interattiva potrebbe far partire da sola una pubblicazione.

Il primo tentativo — `claude -p "invoca col tool Skill la skill seo-90-giorni"` — è stato
rifiutato dall'harness: *"cannot be used with Skill tool due to disable-model-invocation
… reserved for explicit user invocation"*. L'agente si è fermato e non ha replicato il
workflow a mano, che è il comportamento giusto.

La via legittima è il prompt che **comincia** con la slash:

```
claude -p "/seo-90-giorni RUNNER FACTS …"
```

Un prompt slash è invocazione esplicita dell'utente, e il testo che segue arriva alla skill
come `ARGUMENTS`. Verificato con una skill usa-e-getta prima di metterlo in `run.sh`.

Il trucco vale solo per la skill in cima. Dentro il run, `seo-article` e `seo-audit`
vengono invocate col tool Skill dall'agente: a loro il flag è stato **tolto**
(`/root/.claude/skills/*/SKILL.md`), altrimenti il loop si blocca al primo giro. Il
prezzo è che ora Claude può proporle da solo in sessione interattiva quando sono
pertinenti; per rimetterle come prima basta riaggiungere `disable-model-invocation: true`
al loro frontmatter — ma il cron smette di funzionare.

## Permessi e segreti

`run.sh` passa un'allowlist esplicita (`--allowedTools`) invece di `bypassPermissions`:
un cron che pusha su `main` non merita un agente senza freni. L'allowlist copre l'MCP
Airtable, DataForSEO e Perplexity, la scrittura dei file, `npm test`, `node`, e il tool
Skill. Se un giorno il run muore dicendo che un tool non è autorizzato, il posto da
toccare è la variabile `ALLOWED` in cima a `run.sh`.

- `AGENTMAIL_API_KEY` da `/root/.config/agentmail/env`
- `CLAUDE_CODE_OAUTH_TOKEN` da `/root/.config/claude-cron/env` (opzionale ma consigliato:
  senza, il cron dipende dalla login interattiva e si ferma in silenzio se scade.
  Si genera con `claude setup-token`)

Airtable non ha un PAT sul box, solo l'MCP: per questo l'aggiornamento del record a
`Pubblicato` è una seconda chiamata `claude -p` corta, fatta **dopo** il push. Se un
giorno servisse renderla deterministica, basta un PAT in `/root/.config/airtable/env`
e una `curl` al posto di quella chiamata.

## Il costo

È il job più caro della casa: fino a 5 iterazioni di due skill pesanti, ogni mattina,
per 90 giorni. Il tetto di iterazioni sta nella skill, il `timeout 45m` in `run.sh`.
La mail riporta ogni giorno quante iterazioni sono servite: se la media si assesta
in basso, il tetto va abbassato.

## È acceso davvero solo quando

- [ ] `test/test.sh` è verde
- [ ] un `DRY_RUN=1` ha scritto un articolo vero e passato test e build
- [ ] un run vero ha pushato e la mail è arrivata
- [ ] il timer compare in `systemctl list-timers`
- [ ] il primo run notturno lascia un log senza errori
