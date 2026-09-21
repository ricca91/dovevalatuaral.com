#!/usr/bin/env bash
# articolo-quotidiano — un articolo del piano editoriale 90 giorni, ogni mattina.
#
# Divisione del lavoro, che è tutto il punto di questo file:
#   l'agente (skill .claude/skills/seo-90-giorni) sceglie la riga Airtable, scrive,
#   fa l'audit fino a 90/90 e salva prototipo/articoli/{slug}.md. Poi si ferma.
#   QUESTO script fa tutto ciò che deve andare bene sempre: la data, la guardia
#   anti-doppione, i test, la build, il commit, il push e l'invio della mail.
#
# Il motivo è una regola imparata a caro prezzo su daily-x-drafts: un agente non può
# raccontarti l'esito di un'azione che non ha ancora fatto. Se fosse lui a mandare la
# mail, quella mail direbbe "pubblicato" anche quando il push non è mai avvenuto.
#
# Secrets fuori dal repo: /root/.config/agentmail/env, /root/.config/claude-cron/env.

set -uo pipefail

# Override per i test (vedi test/test.sh): puntano a un repo fixture e a stub, così
# si esercitano tutti i rami senza bruciare un run di Opus né mandare mail vere.
REPO="${DOVEVALA_REPO:-/root/ricc-os/projects/dovevalatuaral.com}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
AGENTMAIL_BIN="${AGENTMAIL_BIN:-agentmail}"
NPM_BIN="${NPM_BIN:-npm}"
CURL_BIN="${CURL_BIN:-curl}"
DRY_RUN="${DRY_RUN:-0}"          # 1 = fa tutto tranne push, Airtable e avanzamento stato

DIR="$REPO/processo/cron/articolo-quotidiano"
LOGDIR="$DIR/logs"
STATE="$LOGDIR/state"
ARTICOLI="prototipo/articoli"

# cron parte con un PATH minimo che non include ~/.local/bin, dove vive `claude`.
# Senza questa riga il run muore con rc=127 e non te ne accorgi per giorni.
export PATH="/root/.local/bin:$PATH"
mkdir -p "$LOGDIR"

FROM="claude.sartori@agentmail.to"
TO="riccsartori@gmail.com"
MODEL="${MODEL:-claude-opus-5}"
TIMEOUT="${TIMEOUT:-45m}"

# L'agente scrive file, legge Airtable e — se la riga lo impone — misura keyword su
# DataForSEO. Allowlist per nome di server invece di bypassPermissions: un cron che
# pusha su main non merita un agente senza freni.
ALLOWED="${ALLOWED_TOOLS:-mcp__plugin_airtable_airtable,mcp__dataforseo,mcp__perplexity,WebFetch,WebSearch,Bash(npm test),Bash(node:*),Skill,Write,Edit,Read,Glob,Grep,TodoWrite}"

set -a
[ -f /root/.config/agentmail/env ]   && . /root/.config/agentmail/env    # AGENTMAIL_API_KEY
[ -f /root/.config/claude-cron/env ] && . /root/.config/claude-cron/env  # CLAUDE_CODE_OAUTH_TOKEN
set +a

# Data locale, non UTC: il calendario editoriale è italiano e alle 06:30 di Roma
# `date -u` direbbe ancora ieri per metà dell'anno.
RUN_DATE="$(date +%F)"
LOG="$LOGDIR/$RUN_DATE.log"

cd "$REPO" || { echo "no repo at $REPO" >>"$LOG"; exit 1; }

# Manda la mail e chiude. Unico punto d'uscita per ogni esito: se un ramo dimentica
# di chiamarla, il run resta muto — che è il modo in cui questi job muoiono in silenzio.
avvisa() {
  local subject="$1" body="$2"
  echo "--- mail: $subject ---"
  if [ "$DRY_RUN" = "1" ]; then
    echo "DRY_RUN: mail NON inviata. Corpo che sarebbe partito:"
    echo "-----8<-----"; echo "$body"; echo "----->8-----"
    return 0
  fi
  "$AGENTMAIL_BIN" inboxes:messages send \
    --inbox-id "$FROM" --to "$TO" --subject "$subject" --text "$body"
  echo "--- agentmail rc=$? ---"
}

{
  echo "=== run $RUN_DATE $(date +%T) model=$MODEL dry=$DRY_RUN ==="

  # --- guardia anti-doppione -------------------------------------------------
  # Un articolo al giorno. Se oggi è già andato a buon fine, un secondo giro
  # scriverebbe l'articolo di domani stanotte e sfaserebbe il piano per 90 giorni.
  LAST_DATE=""; LAST_RESULT=""
  [ -f "$STATE" ] && . "$STATE"
  if [ "$LAST_DATE" = "$RUN_DATE" ] && [ "$LAST_RESULT" = "ok" ]; then
    echo "SKIP: l'articolo di $RUN_DATE è già stato pubblicato. Niente da fare."
    echo "=== done $(date +%T) ==="
    exit 0
  fi

  # --- il repo deve essere in uno stato da cui si può pushare ----------------
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [ "$BRANCH" != "main" ]; then
    avvisa "Articolo $RUN_DATE — non parte: repo su $BRANCH" \
"Il repo dovevalatuaral.com è sul branch '$BRANCH', non su main.

Non ho scritto niente: un articolo committato sul branch sbagliato non arriva sul sito
e te lo ritrovi fra giorni. Rimetti il repo su main e domani riparte da solo.

Log: $LOG"
    exit 1
  fi

  if ! git pull --ff-only --quiet 2>>"$LOG"; then
    avvisa "Articolo $RUN_DATE — non parte: pull fallito" \
"git pull --ff-only su main è fallito: il repo locale è divergente da origin.

Non ho scritto niente. Committare sopra una divergenza significa o un merge che non
ho chiesto, o un push rifiutato dopo aver speso il run. Sistema il repo a mano.

Log: $LOG"
    exit 1
  fi

  # Fotografia del prima: serve a riconoscere il file nuovo senza fidarmi del nome
  # che l'agente dichiara nel report.
  PRIMA="$(ls -1 "$ARTICOLI" 2>/dev/null | sort)"

  # Lo stato della pagina busta paga lo misuro io: è un fatto, non un giudizio, e
  # l'agente non deve spenderci un giro di WebFetch né sbagliarlo.
  BUSTA_STATUS="$("$CURL_BIN" -s -o /dev/null -w '%{http_code}' --max-time 20 \
    https://www.dovevalatuaral.com/busta-paga.html 2>/dev/null || echo "000")"
  echo "--- busta-paga.html HTTP $BUSTA_STATUS ---"

  # --- il run vero -----------------------------------------------------------
  # Invocazione SLASH, non tool Skill: la skill ha disable-model-invocation e l'harness
  # rifiuta il tool ("reserved for explicit user invocation"). Un prompt che comincia con
  # /seo-90-giorni È invocazione esplicita dell'utente, e il testo che segue arriva alla
  # skill come ARGUMENTS. Così il flag resta al suo posto e nessuna sessione interattiva
  # può far partire una pubblicazione per sbaglio.
  # `< /dev/null`: senza, claude aspetta 3 secondi stdin e lo scrive nell'output.
  BODY="$(timeout "$TIMEOUT" "$CLAUDE_BIN" -p "/seo-90-giorni RUNNER FACTS (calcolati da run.sh, autoritativi: usali, non ri-derivarli)
- Data di oggi: $RUN_DATE
- Repo: $REPO (branch main, allineato a origin)
- https://www.dovevalatuaral.com/busta-paga.html risponde: HTTP $BUSTA_STATUS
- Commit, push, aggiornamento Airtable a Pubblicato e invio mail NON sono tuoi: li fa run.sh dopo di te.
- Chiudi col blocco REPORT_, una coppia chiave=valore per riga, senza code fence." \
    --model "$MODEL" \
    --permission-mode acceptEdits \
    --allowedTools "$ALLOWED" < /dev/null)"
  RC=$?
  echo "--- claude rc=$RC, body bytes=${#BODY} ---"
  echo "$BODY"

  if [ "$RC" -ne 0 ] || [ -z "${BODY//[[:space:]]/}" ]; then
    MOTIVO="rc=$RC"
    [ "$RC" -eq 124 ] && MOTIVO="timeout dopo $TIMEOUT"
    avvisa "Articolo $RUN_DATE — run fallito ($MOTIVO)" \
"L'agente non ha completato: $MOTIVO.

Niente commit, niente push. Se ha lasciato un file a metà in $ARTICOLI lo trovi lì,
non è stato toccato.

Ultime righe del log:
$(tail -n 25 "$LOG")

Log completo: $LOG"
    exit 1
  fi

  # --- report ----------------------------------------------------------------
  # Tollerante all'indentazione: nella skill il blocco REPORT_ è mostrato indentato
  # (i code fence fanno fallire la build degli articoli, quindi non si possono usare
  # come esempio) e l'agente tende a ricopiarlo così com'è.
  campo() { echo "$BODY" | grep -m1 -E "^[[:space:]]*$1=" | cut -d= -f2- ; }
  R_SLUG="$(campo REPORT_SLUG)"
  R_RECORD="$(campo REPORT_RECORD_ID)"
  R_TITOLO="$(campo REPORT_TITOLO)"
  R_QUERY="$(campo REPORT_QUERY)"
  R_ITER="$(campo REPORT_ITERAZIONI)"
  R_SEO="$(campo REPORT_SEO)"
  R_AEO="$(campo REPORT_AEO)"
  R_STATO="$(campo REPORT_STATO)"
  R_CTA="$(campo REPORT_CTA)"
  R_NOTE="$(campo REPORT_NOTE)"
  PROSA="$(echo "$BODY" | sed '/^[[:space:]]*REPORT_/d' | sed -e :a -e '/^[[:space:]]*$/{$d;N;ba' -e '}')"

  # --- cancello 1: esiste davvero un articolo nuovo? -------------------------
  DOPO="$(ls -1 "$ARTICOLI" 2>/dev/null | sort)"
  NUOVI="$(comm -13 <(echo "$PRIMA") <(echo "$DOPO"))"
  FILE=""
  if [ -n "$R_SLUG" ] && [ -f "$ARTICOLI/$R_SLUG.md" ]; then
    FILE="$ARTICOLI/$R_SLUG.md"
  elif [ "$(echo "$NUOVI" | grep -c '\.md$')" -eq 1 ]; then
    FILE="$ARTICOLI/$(echo "$NUOVI" | grep '\.md$')"
    echo "--- attenzione: REPORT_SLUG non corrisponde, uso il file nuovo $FILE ---"
  fi

  if [ -z "$FILE" ]; then
    avvisa "Articolo $RUN_DATE — nessun articolo prodotto" \
"Il run è finito senza errori ma in $ARTICOLI non è comparso nessun file nuovo.

REPORT_SLUG dichiarato: ${R_SLUG:-(nessuno)}

Quello che l'agente ha raccontato:
$PROSA

Log: $LOG"
    exit 1
  fi
  echo "--- articolo: $FILE ---"

  # --- cancello 2: test e build ----------------------------------------------
  # Autoritativi anche se l'agente dice di averli già passati: è esattamente la cosa
  # che un modello può credere in buona fede senza che sia vera.
  VERIFICA="$("$NPM_BIN" test 2>&1 && node prototipo/genera-articoli.js 2>&1)"
  VRC=$?
  echo "--- test + build rc=$VRC ---"
  echo "$VERIFICA" | tail -n 30

  if [ "$VRC" -ne 0 ]; then
    avvisa "Articolo $RUN_DATE — build rotta, NON pubblicato" \
"L'articolo è stato scritto ma test o build falliscono. Non ho committato niente.

File lasciato dov'è: $FILE
Titolo: ${R_TITOLO:-?}
SEO ${R_SEO:-?} / AEO ${R_AEO:-?} in ${R_ITER:-?} iterazioni

Errore:
$(echo "$VERIFICA" | tail -n 30)

Log: $LOG"
    exit 1
  fi

  # --- cancello 3: la soglia ---------------------------------------------------
  FM_STATO="$(sed -n 's/^stato:[[:space:]]*//p' "$FILE" | head -1 | tr -d '"'"'"' ')"
  echo "--- stato frontmatter=$FM_STATO report=$R_STATO ---"

  if [ "$FM_STATO" != "pubblicato" ]; then
    avvisa "Articolo $RUN_DATE — sotto soglia, resta bozza" \
"Scritto ma non pubblicato: il frontmatter dice stato: $FM_STATO.

Titolo: ${R_TITOLO:-?}
Query: ${R_QUERY:-?}
SEO ${R_SEO:-?} / AEO ${R_AEO:-?} dopo ${R_ITER:-?} iterazioni (soglia 90/90)
File: $FILE

Non è su main e non è online: una bozza non viene nemmeno renderizzata dalla build.
Airtable dovrebbe essere su 'In revisione'.

Note dell'agente: ${R_NOTE:-(nessuna)}

$PROSA

Log: $LOG"
    exit 0
  fi

  # --- pubblicazione ------------------------------------------------------------
  # `git add` SOLO del file dell'articolo. Il working tree di questo repo ha una ventina
  # di file untracked di lavoro in corso: un `git add -A` li spedirebbe tutti su main.
  PUSH_OK=0
  if [ "$DRY_RUN" = "1" ]; then
    echo "DRY_RUN: salto commit e push. Avrei committato solo $FILE."
    git --no-pager diff --stat -- "$FILE" 2>/dev/null
  else
    git add -- "$FILE"
    if git commit -q -m "Pubblica l'articolo del $RUN_DATE: ${R_TITOLO:-$R_SLUG}

Query principale: ${R_QUERY:-?}
SEO ${R_SEO:-?} / AEO ${R_AEO:-?} in ${R_ITER:-?} iterazioni.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" 2>>"$LOG" && git push --quiet origin main 2>>"$LOG"; then
      PUSH_OK=1
      echo "--- push ok ---"
    else
      echo "--- push FALLITO ---"
    fi
  fi

  if [ "$DRY_RUN" != "1" ] && [ "$PUSH_OK" -ne 1 ]; then
    avvisa "Articolo $RUN_DATE — scritto ma NON pushato" \
"L'articolo ha passato test, build e soglia, ma commit o push sono falliti.
È sul VPS, non su GitHub, non online.

File: $FILE
Titolo: ${R_TITOLO:-?}

$(tail -n 15 "$LOG")

Log: $LOG"
    exit 1
  fi

  # --- Airtable, solo dopo un push riuscito --------------------------------------
  # Non c'è un PAT Airtable sul box, solo l'MCP: quindi serve una seconda chiamata,
  # corta. Sta qui e non prima perché 'Pubblicato' deve essere vero quando lo scrivo.
  AIRTABLE_ESITO="non tentato (dry run)"
  if [ "$DRY_RUN" != "1" ]; then
    if [ -n "$R_RECORD" ]; then
      AIR="$(timeout 5m "$CLAUDE_BIN" -p "Nella base Airtable appAsCWc7NBzY5nam, tabella 'Piano editoriale', aggiorna il record $R_RECORD: Stato='Pubblicato', File='$FILE', URL pubblicato='https://www.dovevalatuaral.com/blog/$R_SLUG/'. Non toccare altri campi e non scrivere altro. Rispondi solo OK o l'errore." \
        --model claude-sonnet-5 --permission-mode acceptEdits \
        --allowedTools "mcp__plugin_airtable_airtable" 2>&1 | tail -n 3)"
      AIRTABLE_ESITO="$AIR"
    else
      AIRTABLE_ESITO="saltato: l'agente non ha riportato REPORT_RECORD_ID"
    fi
    echo "--- airtable: $AIRTABLE_ESITO ---"
  fi

  URL="https://www.dovevalatuaral.com/blog/$R_SLUG/"
  # In dry run non c'è stato nessun commit: la riga "verificato da me" deve dirlo,
  # altrimenti il log di una prova racconta una pubblicazione mai avvenuta.
  if [ "$DRY_RUN" = "1" ]; then
    OGGETTO="[DRY RUN] Articolo $RUN_DATE: ${R_TITOLO:-$R_SLUG}"
    VERIFICATO="Verificato da me: npm test verde, build verde, soglia superata.
NON fatto (dry run): nessun commit, nessun push, Airtable non toccato. L'articolo esiste solo sul VPS."
  else
    OGGETTO="Articolo $RUN_DATE pushato: ${R_TITOLO:-$R_SLUG}"
    VERIFICATO="Verificato da me: npm test verde, build verde, commit su main, push su origin accettato.
NON verificato: che il deploy Vercel sia andato a buon fine e che $URL risponda.
Il push è la fine di quello che posso vedere da qui — controlla l'URL fra qualche minuto."
  fi
  avvisa "$OGGETTO" \
"$PROSA

--- i fatti, misurati da run.sh ---
Titolo:      ${R_TITOLO:-?}
Query:       ${R_QUERY:-?}
Punteggi:    SEO ${R_SEO:-?} / AEO ${R_AEO:-?} (soglia 90/90) in ${R_ITER:-?} iterazioni
File:        $FILE
CTA:         ${R_CTA:-?}   (busta-paga.html oggi risponde HTTP $BUSTA_STATUS)
Note:        ${R_NOTE:-(nessuna)}
Airtable:    $AIRTABLE_ESITO

$VERIFICATO

Log: $LOG"

  if [ "$DRY_RUN" != "1" ]; then
    printf 'LAST_DATE="%s"\nLAST_RESULT="ok"\nLAST_SLUG="%s"\n' "$RUN_DATE" "$R_SLUG" >"$STATE"
  fi
  echo "=== done $(date +%T) ==="
} >>"$LOG" 2>&1
