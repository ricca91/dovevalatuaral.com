#!/usr/bin/env bash
# link — i job del sistema backlink (RIC-119) sul timer: link-review, link-dono, link-fonti, link-recupero.
#
#   run.sh <job>     job = link-review | link-dono | link-fonti | link-recupero
#
# Divisione del lavoro, come in articolo-quotidiano:
#   l'agente (la skill .claude/skills/<job>) legge, misura, scrive su Airtable e crea bozze Gmail,
#   e chiude con un blocco REPORT_. Poi si ferma.
#   QUESTO script fa ciò che deve andare bene sempre: la data, la guardia anti-doppione,
#   l'allowlist, il controllo che Gmail ci sia prima di partire, e la mail di esito,
#   unico punto d'uscita. Niente commit, niente push: il repo è pubblico e i dati dei
#   prospect stanno solo su Airtable.
#
# Segreti fuori dal repo: /root/.config/agentmail/env, /root/.config/claude-cron/env, e la
# chiave DataFast nel file indicato da DATAFAST_ENV_FILE (la legge misure.mjs, non questo script).

set -uo pipefail

JOB="${1:-}"

# Override per i test (vedi test/test.sh): repo fixture e stub, nessun Opus né mail veri.
REPO="${DOVEVALA_REPO:-/root/ricc-os/projects/dovevalatuaral.com}"
CLAUDE_BIN="${CLAUDE_BIN:-claude}"
AGENTMAIL_BIN="${AGENTMAIL_BIN:-agentmail}"
CLAUDE_CRON_ENV="${CLAUDE_CRON_ENV:-/root/.config/claude-cron/env}"   # CLAUDE_CODE_OAUTH_TOKEN
AGENTMAIL_ENV="${AGENTMAIL_ENV:-/root/.config/agentmail/env}"         # AGENTMAIL_API_KEY
DRY_RUN="${DRY_RUN:-0}"     # 1 = niente mail (stampata nel log), niente stato, niente scritture Airtable/Gmail
LOGDIR="${LINK_LOGDIR:-/root/cron/link/logs}"
MODEL="${MODEL:-claude-opus-5}"
PREFLIGHT_MODEL="${PREFLIGHT_MODEL:-claude-sonnet-5}"   # solo per il controllo Gmail, una riga
# L'interruttore dell'autenticazione per i job che creano bozze (link-dono, link-recupero):
#   login = senza CLAUDE_CODE_OAUTH_TOKEN, con la login interattiva di ~/.claude: oggi è l'unico
#           modo in cui `claude -p` carica i connettori claude.ai, Gmail compreso (RIC-120);
#   token = col token di claude-cron/env, come gli altri job: da provare quando claude
#           sincronizzerà i connettori anche col token di setup-token.
# In entrambi i casi Gmail si controlla prima di partire: se manca, mail e nessun lavoro.
LINK_GMAIL_AUTH="${LINK_GMAIL_AUTH:-login}"
# Dove misure.mjs (link-review) cerca DATAFAST_API_KEY. Oggi è il .env del checkout principale:
# spostarla in /root/.config/datafast/env è una decisione di Riccardo (README, "Decisioni aperte").
export DATAFAST_ENV_FILE="${DATAFAST_ENV_FILE:-/root/ricc-os/projects/dovevalatuaral.com/.env}"

FROM="claude.sartori@agentmail.to"
TO="riccsartori@gmail.com"

# cron e systemd partono con un PATH minimo che non include ~/.local/bin, dove vive `claude`.
export PATH="/root/.local/bin:$PATH"

# --- i job ------------------------------------------------------------------------
# Allowlist per nome di strumento, mai per server: `mcp__claude_ai_Gmail` ammetterebbe anche
# send_message. Airtable con i due prefissi: col token di run.sh arriva il plugin, con la
# login interattiva il connettore claude.ai (RIC-120).
airtable() { local t out=""; for t in "$@"; do out+="mcp__plugin_airtable_airtable__$t,mcp__claude_ai_Airtable__$t,"; done; printf '%s' "${out%,}"; }
# Gmail: lettura e creazione di bozze, nient'altro (nomi da RIC-120).
GMAIL_LETTURA="mcp__claude_ai_Gmail__list_drafts,mcp__claude_ai_Gmail__get_draft,mcp__claude_ai_Gmail__search_threads,mcp__claude_ai_Gmail__get_thread,mcp__claude_ai_Gmail__get_message"
GMAIL_BOZZA="mcp__claude_ai_Gmail__create_draft"
# Negati in ogni job, anche se nessuno li ammette: send_message, reply e forward INVIANO
# (reply non crea una bozza); le bozze create sono di Riccardo e non si toccano dopo;
# AgentMail manderebbe mail dall'agente; Perplexity e Firecrawl sono senza credito.
NEGATI="mcp__claude_ai_Gmail__send_message,mcp__claude_ai_Gmail__reply,mcp__claude_ai_Gmail__forward,mcp__claude_ai_Gmail__update_draft,mcp__claude_ai_Gmail__delete_draft,mcp__claude_ai_Gmail__trash_message,mcp__claude_ai_Gmail__trash_thread,mcp__agentmail,mcp__perplexity,mcp__claude_ai_Firecrawl"
FILE_LOCALI="Write,Edit,NotebookEdit"

# Per ogni job:
#   PERIODO    chiave della guardia anti-doppione
#   STRUMENTI  allowlist sempre ammessa (lettura, attrezzi, file di lavoro locali)
#   SCRIVE     scritture su Airtable e Gmail: tolte e negate in DRY_RUN
#   GMAIL=1    il job crea bozze: interruttore LINK_GMAIL_AUTH e controllo prima di partire
#   FILE=1     scrive file di lavoro nel worktree (.link-fonti/, .link-dono/); altrimenti Write negato
#   ARGOMENTI  righe in più per i RUNNER FACTS
GMAIL=0; FILE=0; SCRIVE=""; ARGOMENTI=""
case "$JOB" in
  link-review)
    PERIODO="$(date +%G-W%V)"   # una revisione per settimana ISO
    TIMEOUT_JOB=30m
    STRUMENTI="$(airtable list_records_for_table),mcp__dataforseo__backlinks_summary,mcp__dataforseo__backlinks_backlinks,Bash(node processo/link/misure.mjs:*)"
    ;;
  link-dono)
    PERIODO="$(date +%G-W%V)"
    TIMEOUT_JOB=60m
    GMAIL=1; FILE=1
    STRUMENTI="$(airtable list_records_for_table),$GMAIL_LETTURA,WebFetch,Read,Write,Edit,Bash(node processo/link/dono-ccnl.js:*),Bash(node processo/link/verifica-pagina.js:*),Bash(node processo/link/misure.mjs:*)"
    SCRIVE="$(airtable update_records_for_table),$GMAIL_BOZZA"
    ARGOMENTI="
- oggi=$(date +%F)
- invio=$(date +%F)
- Al massimo 5 bozze in questo run, solleciti compresi: prima i solleciti, poi i prospect nuovi."
    ;;
  link-fonti)
    PERIODO="$(date +%Y-%m)"    # il primo lunedì del mese
    TIMEOUT_JOB=60m
    FILE=1
    # WebSearch: la skill lo usa (site:dominio) per trovare la pagina di un dominio visto solo
    # in AI Overview. Non è Perplexity né Firecrawl.
    STRUMENTI="$(airtable list_records_for_table),mcp__dataforseo__ai_optimization_chat_gpt_scraper,mcp__dataforseo__ai_opt_llm_ment_top_domains,WebFetch,WebSearch,Read,Write,Edit,Bash(node processo/link/aggrega.js:*)"
    SCRIVE="$(airtable create_records_for_table)"
    ARGOMENTI="
- La raccolta va in .link-fonti/ nella root del repo: il checkout è usa e getta, lancia.sh la mette da parte fuori dal repo a fine run."
    ;;
  link-recupero)
    PERIODO="$(date +%Y-%m)"
    TIMEOUT_JOB=45m
    GMAIL=1
    STRUMENTI="$(airtable list_records_for_table),mcp__dataforseo__backlinks_backlinks,mcp__dataforseo__serp_organic_live_advanced,mcp__dataforseo__content_analysis_search,$GMAIL_LETTURA,WebFetch,Bash(node processo/link/verifica-pagina.js:*)"
    SCRIVE="$(airtable create_records_for_table update_records_for_table),$GMAIL_BOZZA"
    ARGOMENTI="
- Al massimo 5 bozze in questo run."
    ;;
  *)
    echo "uso: run.sh link-review|link-dono|link-fonti|link-recupero" >&2
    exit 2 ;;
esac
TIMEOUT="${TIMEOUT:-$TIMEOUT_JOB}"

if [ "$GMAIL" = "1" ]; then
  case "$LINK_GMAIL_AUTH" in
    login|token) AUTH="$LINK_GMAIL_AUTH" ;;
    *) echo "LINK_GMAIL_AUTH deve essere login o token, non '$LINK_GMAIL_AUTH'" >&2; exit 2 ;;
  esac
else
  AUTH=token
fi

[ "$FILE" = "1" ] || NEGATI+=",$FILE_LOCALI"
if [ "$DRY_RUN" = "1" ]; then
  ALLOWED="$STRUMENTI"
  [ -n "$SCRIVE" ] && NEGATI+=",$SCRIVE"
else
  ALLOWED="$STRUMENTI${SCRIVE:+,$SCRIVE}"
fi

mkdir -p "$LOGDIR"
STATE="$LOGDIR/state-$JOB"
# Data locale, non UTC: alle 07:00 di Roma `date -u` direbbe ancora ieri per metà dell'anno.
RUN_DATE="$(date +%F)"
LOG="$LOGDIR/$JOB-$RUN_DATE.log"

cd "$REPO" || { echo "no repo at $REPO" >>"$LOG"; exit 1; }

# Manda la mail. Unico punto d'uscita per ogni esito. La chiave AgentMail entra solo nel
# processo che manda la mail, non nell'ambiente dell'agente.
avvisa() {
  local subject="$1" body="$2" rc
  [ "$DRY_RUN" = "1" ] && subject="[DRY RUN] $subject"
  echo "--- mail: $subject ---"
  if [ "$DRY_RUN" = "1" ]; then
    echo "DRY_RUN: mail NON inviata. Corpo che sarebbe partito:"
    echo "-----8<-----"; echo "$body"; echo "----->8-----"
    return 0
  fi
  ( set -a; [ -f "$AGENTMAIL_ENV" ] && . "$AGENTMAIL_ENV"; set +a
    "$AGENTMAIL_BIN" inboxes:messages send --inbox-id "$FROM" --to "$TO" --subject "$subject" --text "$body" )
  rc=$?
  echo "--- agentmail rc=$rc ---"
  return "$rc"
}

# claude con l'autenticazione del job, sotto timeout: claude_job <durata> <argomenti di claude…>
# `< /dev/null`: senza, claude aspetta 3 secondi stdin e lo scrive nell'output.
claude_job() {
  local durata="$1"; shift
  ( unset AGENTMAIL_API_KEY
    if [ "$AUTH" = "token" ]; then
      set -a; [ -f "$CLAUDE_CRON_ENV" ] && . "$CLAUDE_CRON_ENV"; set +a
    else
      unset CLAUDE_CODE_OAUTH_TOKEN
    fi
    timeout "$durata" "$CLAUDE_BIN" "$@" < /dev/null )
}

# Gmail c'è? Apre claude con la stessa autenticazione del run e legge l'evento init di
# stream-json, che elenca gli strumenti caricati prima di qualunque turno dell'agente.
# Una riga di prompt: costa centesimi, e un run senza Gmail costerebbe un run intero per niente.
# Esce 0 se c'è create_draft; altrimenti 1 con GMAIL_MOTIVO e GMAIL_DETTAGLIO.
gmail_pronto() {
  local out init
  out="$(claude_job 5m -p "Rispondi solo OK. Non usare nessuno strumento." \
    --model "$PREFLIGHT_MODEL" --disallowedTools "$NEGATI" \
    --output-format stream-json --verbose 2>&1)"
  local rc=$?
  init="$(grep -m1 '"subtype":"init"' <<<"$out")"
  if [ -z "$init" ]; then
    GMAIL_MOTIVO="claude non risponde"
    GMAIL_DETTAGLIO="rc=$rc
$(tail -n 5 <<<"$out")"
    return 1
  fi
  jq -e '.tools | index("mcp__claude_ai_Gmail__create_draft")' >/dev/null 2>&1 <<<"$init" && return 0
  GMAIL_MOTIVO="Gmail non disponibile"
  GMAIL_DETTAGLIO="$(jq -r '[.mcp_servers[]? | select(.name | test("gmail"; "i")) | "\(.name): \(.status)"] | if length == 0 then "il connettore claude.ai Gmail non compare tra i server MCP" else join("\n") end' <<<"$init")"
  return 1
}

{
  echo "=== $JOB $RUN_DATE $(date +%T) model=$MODEL dry=$DRY_RUN ==="

  # --- guardia anti-doppione -------------------------------------------------
  # Il timer ha Persistent=true: se il VPS era spento all'orario, recupera all'avvio.
  # Un job per periodo (settimana ISO o mese): un secondo giro rifarebbe bozze e record.
  # LINK_FORZA=1 la scavalca per un giro a mano.
  LAST_PERIOD=""; LAST_RESULT=""
  [ -f "$STATE" ] && . "$STATE"
  if [ "${LINK_FORZA:-0}" != "1" ] && [ "$LAST_PERIOD" = "$PERIODO" ] && [ "$LAST_RESULT" = "ok" ]; then
    echo "SKIP: $JOB del periodo $PERIODO è già andato a buon fine. Niente da fare."
    echo "=== done $(date +%T) ==="
    exit 0
  fi

  CHECKOUT="$(git rev-parse --short HEAD 2>/dev/null || echo '?')"
  if [ ! -f ".claude/skills/$JOB/SKILL.md" ]; then
    avvisa "$JOB $RUN_DATE — NON partito: skill mancante" \
"Nel checkout $REPO ($CHECKOUT) non c'è .claude/skills/$JOB/SKILL.md.
Il job va lanciato da lancia.sh, che crea un checkout fresco di origin/main:
la skill è arrivata su main?

Non ho chiamato claude. Log: $LOG"
    exit 1
  fi

  # --- Gmail, prima di lavorare -----------------------------------------------
  if [ "$AUTH" = "login" ]; then
    AUTENTICAZIONE="login interattiva (LINK_GMAIL_AUTH=login)"
  elif [ "$GMAIL" = "1" ]; then
    AUTENTICAZIONE="token di $CLAUDE_CRON_ENV (LINK_GMAIL_AUTH=token)"
  else
    AUTENTICAZIONE="token di $CLAUDE_CRON_ENV"
  fi
  if [ "$GMAIL" = "1" ]; then
    if ! gmail_pronto; then
      echo "--- controllo Gmail: $GMAIL_MOTIVO ---"; echo "$GMAIL_DETTAGLIO"
      avvisa "$JOB $RUN_DATE — NON partito: $GMAIL_MOTIVO" \
"Prima di partire ho aperto claude con la stessa autenticazione del run
($AUTENTICAZIONE) per controllare che ci sia mcp__claude_ai_Gmail__create_draft.
Esito: $GMAIL_MOTIVO.
Senza Gmail $JOB non lavora: nessun record Airtable toccato, nessuna bozza.
Stato non avanzato: il prossimo giro riparte.

Cosa ho visto:
$GMAIL_DETTAGLIO

Cosa fare:
- LINK_GMAIL_AUTH=login (il default): la login interattiva di claude sul VPS è scaduta
  o non ha il connettore. Apri claude sul VPS, /login, e controlla con 'claude mcp list'
  che 'claude.ai Gmail' sia connesso. Poi: systemctl start link@$JOB.service
- LINK_GMAIL_AUTH=token: col token di setup-token claude -p non carica i connettori
  claude.ai (RIC-120). Torna a login.

Log: $LOG"
      exit 1
    fi
    AUTENTICAZIONE+=", Gmail verificato prima di partire"
    echo "--- controllo Gmail: ok ---"
  fi

  # Fatti misurati qui e non dall'agente.
  FATTI_JOB=""
  if [ "$JOB" = "link-review" ]; then
    # Solo il nome della variabile, mai il valore.
    if [ -f "$DATAFAST_ENV_FILE" ] && grep -Eq '^(export +)?DATAFAST_API_KEY=.' "$DATAFAST_ENV_FILE"; then
      FATTI_JOB="DataFast: DATAFAST_API_KEY presente in $DATAFAST_ENV_FILE"
    else
      FATTI_JOB="DataFast: DATAFAST_API_KEY NON trovata in $DATAFAST_ENV_FILE (misure.mjs dirà che DataFast non risponde)"
    fi
  fi
  # La settimana dopo una tranche CCNL link-dono lavora su quel contratto (spec). Il calendario
  # è quello del dataset nel checkout; il tetto delle bozze non cambia. Se non si legge, il run
  # parte lo stesso, senza filtro, e la mail lo dice.
  if [ "$JOB" = "link-dono" ]; then
    DAL="$(date -d "$RUN_DATE -7 days" +%F)"
    if TRANCHE="$(node processo/link/dono-ccnl.js tranche "$DAL" "$RUN_DATE" 2>&1)" \
       && CCNL_TRANCHE="$(jq -er 'map(.ccnl) | unique | join(",")' <<<"$TRANCHE" 2>/dev/null)"; then
      if [ -n "$CCNL_TRANCHE" ]; then
        ELENCO="$(jq -r 'map("\(.ccnl) dal \(.decorrenza)") | join(", ")' <<<"$TRANCHE")"
        ARGOMENTI+="
- ccnl=$CCNL_TRANCHE (tranche partite negli ultimi 7 giorni: $ELENCO)"
        FATTI_JOB="Tranche negli ultimi 7 giorni: $ELENCO. Run limitato a ccnl=$CCNL_TRANCHE"
      fi
    else
      FATTI_JOB="Calendario delle tranche NON letto ($(tail -n 1 <<<"$TRANCHE")): run senza filtro ccnl"
    fi
  fi

  DRY_FATTI=""
  [ "$DRY_RUN" = "1" ] && DRY_FATTI="
- DRY RUN: gli strumenti che scrivono su Airtable e Gmail sono tolti. Non provare a scrivere: fai tutto il resto e scrivi nel report cosa avresti scritto."

  # --- il run vero -----------------------------------------------------------
  # Invocazione SLASH, non tool Skill: le skill hanno disable-model-invocation e l'harness
  # rifiuta il tool. Un prompt che comincia con /link-… è invocazione esplicita, e il testo
  # che segue arriva alla skill come ARGUMENTS.
  PROMPT="/$JOB RUNNER FACTS (calcolati da run.sh, autoritativi: usali, non ri-derivarli)
- Data di oggi: $RUN_DATE
- Repo: $REPO (checkout usa e getta di origin/main, $CHECKOUT)
- La mail di esito la manda run.sh con la tua risposta: tu non mandi mail. Niente commit, niente push.
- Gli attrezzi node della skill si lanciano col percorso relativo dalla radice del repo (node processo/link/…), senza pipe verso altri programmi: l'allowlist ammette solo quella forma.$ARGOMENTI${LINK_ARGS:+
- Argomenti a mano (valgono su quelli sopra): $LINK_ARGS}$DRY_FATTI
- Chiudi col blocco REPORT_, una coppia chiave=valore per riga, senza code fence."

  INIZIO=$SECONDS
  OUT="$(claude_job "$TIMEOUT" -p "$PROMPT" \
    --model "$MODEL" \
    --permission-mode acceptEdits \
    --allowedTools "$ALLOWED" \
    --disallowedTools "$NEGATI" \
    --output-format json)"
  RC=$?
  MINUTI=$(( (SECONDS - INIZIO + 59) / 60 ))
  # --output-format json: un oggetto con result, is_error, costo, turni e strumenti negati.
  # Se claude muore prima (login scaduta, timeout) l'uscita non è JSON: la si tiene com'è.
  NEGATI_RUN=""
  # Alcune versioni stampano la lista dei messaggi invece del solo risultato: si tiene l'ultimo "result".
  RISULTATO="$(jq -c 'if type == "array" then (map(select(.type? == "result")) | last) else . end' 2>/dev/null <<<"$OUT")"
  [ -n "$RISULTATO" ] && OUT="$RISULTATO"
  if jq -e 'type == "object"' >/dev/null 2>&1 <<<"$OUT"; then
    BODY="$(jq -r '.result // empty' <<<"$OUT")"
    ESITO="$(jq -r 'if .is_error then (.subtype // "is_error") else "" end' <<<"$OUT")"
    COSTO="$(jq -r '.total_cost_usd // "?"' <<<"$OUT")"
    TURNI="$(jq -r '.num_turns // "?"' <<<"$OUT")"
    # Per Bash anche il comando (accorciato): "Bash" da solo non dice quale attrezzo mancava.
    NEGATI_RUN="$(jq -r '[.permission_denials[]? | .tool_name + (if .tool_input.command? then ": " + (.tool_input.command | gsub("\\s+"; " ") | .[0:80]) else "" end)]
      | group_by(.) | sort_by(-length) | map("\(.[0]) (\(length))") | join(", ")' <<<"$OUT")"
  else
    BODY=""; ESITO="uscita non JSON"; COSTO="?"; TURNI="?"
    [ "$RC" -eq 0 ] || ESITO=""
    echo "--- uscita di claude (non JSON) ---"; echo "$OUT"
  fi
  echo "--- claude rc=$RC esito=${ESITO:-ok} body bytes=${#BODY} costo=$COSTO turni=$TURNI minuti=$MINUTI ---"
  [ -n "$NEGATI_RUN" ] && echo "--- strumenti negati: $NEGATI_RUN ---"
  echo "$BODY"

  if [ "$RC" -ne 0 ] || [ -n "$ESITO" ] || [ -z "${BODY//[[:space:]]/}" ]; then
    MOTIVO="rc=$RC"
    [ "$RC" -eq 124 ] && MOTIVO="timeout dopo $TIMEOUT"
    [ "$RC" -eq 0 ] && MOTIVO="${ESITO:-risposta vuota}"
    avvisa "$JOB $RUN_DATE — run fallito ($MOTIVO)" \
"L'agente non ha completato: $MOTIVO.

Quello che ha fatto prima di fermarsi (record Airtable, bozze Gmail) resta dov'è:
controllalo prima di rilanciare. Stato non avanzato: il prossimo giro riparte.

Ultime righe del log:
$(tail -n 25 "$LOG")

Log completo: $LOG"
    exit 1
  fi

  # --- report ----------------------------------------------------------------
  # Tollerante all'indentazione: nelle skill il blocco REPORT_ è mostrato indentato e
  # l'agente tende a ricopiarlo così com'è. Prima occorrenza di ogni chiave.
  campo() { echo "$BODY" | grep -m1 -E "^[[:space:]]*$1=" | cut -d= -f2- ; }
  PROSA="$(echo "$BODY" | sed '/^[[:space:]]*REPORT_/d' | sed -e :a -e '/^[[:space:]]*$/{$d;N;ba' -e '}')"
  REPORT="$(echo "$BODY" | grep -E '^[[:space:]]*REPORT_[A-Z0-9_]+=' | sed 's/^[[:space:]]*//')"

  if [ -z "$(campo REPORT_DATA)" ]; then
    avvisa "$JOB $RUN_DATE — report mancante" \
"L'agente è uscito senza errori ma senza il blocco REPORT_ (manca REPORT_DATA):
non so dire cosa ha fatto. Stato non avanzato.

Quello che ha raccontato:
$PROSA

Log: $LOG"
    exit 1
  fi

  AVVISI=""
  [ "$(campo REPORT_DATA)" != "$RUN_DATE" ] && \
    AVVISI+="REPORT_DATA=$(campo REPORT_DATA) non è la data del run ($RUN_DATE). "

  case "$JOB" in
    link-review)
      OGGETTO="$JOB $RUN_DATE: $(campo REPORT_STATO), $(campo REPORT_LINK_NUOVI) link nuovi"
      MUTE=""
      for f in GSC:GSC DATAFAST:DataFast DATAFORSEO:DataForSEO AIRTABLE:Airtable; do
        v="$(campo "REPORT_${f%%:*}")"
        [ -n "$v" ] && [ "$v" != "ok" ] && MUTE+="${MUTE:+, }${f#*:}"
      done
      [ -n "$MUTE" ] && OGGETTO+=" — fonti mute: $MUTE"
      ;;
    link-dono)
      OGGETTO="$JOB $RUN_DATE: $(campo REPORT_BOZZE) bozze, $(campo REPORT_SOLLECITI) solleciti"
      v="$(campo REPORT_NON_PRIMA_DEL)"; [ -n "$v" ] && [ "$v" != "nessuna" ] && OGGETTO+=", non inviare prima del $v"
      v="$(campo REPORT_RISPOSTE)"; [ -n "$v" ] && [ "$v" != "nessuna" ] && OGGETTO+=", risposte da leggere"
      ;;
    link-fonti)
      OGGETTO="$JOB $RUN_DATE: $(campo REPORT_SCRITTI) prospect su Airtable (prompt $(campo REPORT_PROMPT))"
      v="$(campo REPORT_FALLITE)"; [ -n "$v" ] && [ "$v" != "nessuna" ] && OGGETTO+=", fallite: $v"
      ;;
    link-recupero)
      OGGETTO="$JOB $RUN_DATE: $(campo REPORT_LINK_PERSI) link persi, $(campo REPORT_MENZIONI) menzioni, $(campo REPORT_BOZZE) bozze"
      v="$(campo REPORT_PIANO_REDIRECT)"; [ -n "$v" ] && [ "$v" != "nessuno" ] && OGGETTO+=", piano redirect da applicare"
      ;;
  esac
  # Il tetto di bozze lo dice la skill; qui lo si controlla sul suo report. I solleciti sono
  # bozze anche loro: contano nel tetto (link-recupero non ne fa).
  B="$(campo REPORT_BOZZE)"; S="$(campo REPORT_SOLLECITI)"
  [[ "$S" =~ ^[0-9]+$ ]] || S=0
  if [[ "$B" =~ ^[0-9]+$ ]] && [ $((B + S)) -gt 5 ]; then
    OGGETTO+=" — ATTENZIONE: $((B + S)) bozze, oltre il tetto di 5"
  fi
  [ -n "$NEGATI_RUN" ] && OGGETTO+=" (strumenti negati)"

  if [ "$DRY_RUN" = "1" ]; then
    VERIFICATO="NON fatto (dry run): mail non inviata, stato non avanzato, strumenti di scrittura
Airtable e Gmail tolti all'agente."
  else
    VERIFICATO="NON verificato da me: i numeri del blocco REPORT_ e ciò che dice di aver scritto su
Airtable o in Gmail sono dell'agente. Li vedi su Airtable e tra le bozze."
  fi

  avvisa "$OGGETTO" "$PROSA

--- i fatti, misurati da run.sh ---
Job:        $JOB, periodo $PERIODO, checkout $CHECKOUT
Modello:    $MODEL, $TURNI turni, $MINUTI minuti, costo $COSTO USD
Autenticazione: $AUTENTICAZIONE
Strumenti negati: ${NEGATI_RUN:-nessuno}${FATTI_JOB:+
$FATTI_JOB}${AVVISI:+
Avvisi:     $AVVISI}

--- il blocco REPORT_ dell'agente ---
$REPORT

Verificato da me (run.sh): claude è uscito con rc=0 entro $TIMEOUT e ha chiuso col blocco REPORT_.
$VERIFICATO

Log: $LOG"
  MAIL_RC=$?

  if [ "$DRY_RUN" != "1" ] && [ "$MAIL_RC" -eq 0 ]; then
    printf 'LAST_PERIOD="%s"\nLAST_DATE="%s"\nLAST_RESULT="ok"\n' "$PERIODO" "$RUN_DATE" >"$STATE"
  fi
  echo "=== done $(date +%T) ==="
  # La mail di esito non è partita: rc≠0, così almeno OnFailure manda lo stato del servizio.
  exit "$MAIL_RC"
} >>"$LOG" 2>&1
