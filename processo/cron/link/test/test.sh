#!/usr/bin/env bash
# Test di run.sh e lancia.sh dei job backlink su un repo fixture, con stub per claude e agentmail.
# Nessun Opus, nessuna mail, nessun Airtable, nessun Gmail veri.
# Casi: prompt e mail di ogni job, guardia per periodo, fallimenti (rc, timeout, uscita non JSON,
# report mancante, mail non partita), DRY_RUN, controllo Gmail e interruttore dell'autenticazione,
# segreti, allowlist che non può inviare, lancia.sh (worktree, lock, dati), unit systemd, contratto
# con le skill vere. Uso: processo/cron/link/test/test.sh (KEEP=1 per tenere la fixture).
set -u
# Ermetico: i segreti arrivano solo dai file finti della fixture (il caso 14 ne rimette uno apposta).
unset AGENTMAIL_API_KEY CLAUDE_CODE_OAUTH_TOKEN DATAFAST_API_KEY DATAFAST_ENV_FILE DRY_RUN LINK_FORZA LINK_ARGS LINK_GMAIL_AUTH MODEL TIMEOUT

HERE="$(cd "$(dirname "$0")" && pwd)"
RUN="$HERE/../run.sh"
# La tabella dei job, la stessa di run.sh e lancia.sh: LINK_JOBS, job_config, MAX_BOZZE, NESSUNO.
. "$HERE/../jobs.sh"
ROOT="$(cd "$HERE/../../../.." && pwd)"   # il repo vero: per controllare che gli attrezzi esistano
FIX="$(mktemp -d)"
# KEEP=1 lascia la fixture su disco per leggerne i log quando un caso fallisce.
trap 'if [ -n "${KEEP:-}" ]; then echo "fixture: $FIX"; else rm -rf "$FIX"; fi' EXIT

REPO="$FIX/repo"
LOGDIR="$FIX/logs"
OGGI="$(date +%F)"
SETTIMANA="$(date +%G-W%V)"
MESE="$(date +%Y-%m)"

# --- fixture ------------------------------------------------------------------
mkdir -p "$REPO" "$FIX/bin" "$FIX/conf"
git init -q --bare "$FIX/origin.git"
git -C "$FIX/origin.git" symbolic-ref HEAD refs/heads/main
cd "$REPO"
git init -q . && git checkout -q -b main 2>/dev/null; git remote add origin "$FIX/origin.git"
git config user.email t@t && git config user.name test
for j in review dono fonti recupero; do
  mkdir -p ".claude/skills/link-$j"; echo "skill finta" > ".claude/skills/link-$j/SKILL.md"
done
# Calendario delle tranche finto: run.sh lo chiede al checkout come chiede le skill.
mkdir -p processo/link
cat > processo/link/dono-ccnl.js <<'EOF2'
require('node:fs').appendFileSync(`${process.env.STUB_OUT}/tranche-args.txt`, `${process.argv.slice(2).join(' ')}\n`);
if (process.env.STUB_TRANCHE_RC) { console.error('calendario finto rotto'); process.exit(Number(process.env.STUB_TRANCHE_RC)); }
process.stdout.write(process.env.STUB_TRANCHE || '[]');
EOF2
git add -A && git commit -q -m init && git push -q -u origin main

# Segreti finti: i test controllano a chi arrivano, non il valore.
echo 'CLAUDE_CODE_OAUTH_TOKEN=token-finto' > "$FIX/conf/claude-cron.env"
echo 'AGENTMAIL_API_KEY=chiave-finta' > "$FIX/conf/agentmail.env"
echo 'DATAFAST_API_KEY=chiave-finta' > "$FIX/conf/datafast.env"

# stub claude: due chiamate diverse. Il controllo Gmail (stream-json) stampa un evento
# init come quello vero; il run della skill (json) stampa il risultato con il blocco REPORT_.
cat > "$FIX/bin/claude" <<'EOF'
#!/usr/bin/env bash
if printf '%s\n' "$@" | grep -qx 'stream-json'; then
  printf '%s\n' "$@" > "$STUB_OUT/preflight-args.txt"
  echo "token=${CLAUDE_CODE_OAUTH_TOKEN:+si}" >> "$STUB_OUT/preflight.log"
  if [ "${STUB_PREFLIGHT_RC:-0}" -ne 0 ]; then
    echo "Invalid API key · Please run /login"; exit "$STUB_PREFLIGHT_RC"
  fi
  echo '{"type":"system","subtype":"hook_started","hook_name":"SessionStart:startup"}'
  if [ "${STUB_GMAIL:-1}" = 1 ]; then
    echo '{"type":"system","subtype":"init","tools":["Read","mcp__claude_ai_Gmail__create_draft","mcp__claude_ai_Gmail__send_message"],"mcp_servers":[{"name":"claude.ai Gmail","status":"connected"}]}'
  else
    echo '{"type":"system","subtype":"init","tools":["Read","mcp__plugin_airtable_airtable__list_records_for_table"],"mcp_servers":[{"name":"plugin:airtable:airtable","status":"connected"},{"name":"claude.ai Gmail","status":"needs-auth"}]}'
  fi
  echo '{"type":"result","subtype":"success","is_error":false,"result":"OK","total_cost_usd":0.13}'
  exit 0
fi
printf '%s\n' "$@" > "$STUB_OUT/last-args.txt"
printf '%s' "$2" > "$STUB_OUT/last-prompt.txt"
echo "token=${CLAUDE_CODE_OAUTH_TOKEN:+si} agentmail=${AGENTMAIL_API_KEY:+si} datafast=${DATAFAST_ENV_FILE:-}" >> "$STUB_OUT/main.log"
if [ "${CLAUDE_STUB_RC:-0}" -ne 0 ]; then echo "${STUB_STDOUT:-}"; exit "$CLAUDE_STUB_RC"; fi
if [ -n "${STUB_RAW+x}" ]; then printf '%s' "$STUB_RAW"; exit 0; fi
PAD=""; [ -n "${STUB_INDENT:-}" ] && PAD="    "
REPORT="${STUB_REPORT-REPORT_DATA=$(date +%F)
REPORT_NOTE=nessuno}"
BODY="$(printf '%s\n\n%s\n' "${STUB_PROSA:-Prosa di prova: cosa ho verificato.}" "$(sed "s/^/$PAD/" <<<"$REPORT")")"
jq -n --arg r "$BODY" --argjson err "${STUB_IS_ERROR:-false}" --argjson den "${STUB_DENIALS:-[]}" \
  '{type:"result", subtype:(if $err then "error_max_turns" else "success" end), is_error:$err,
    result:$r, total_cost_usd:1.5, num_turns:7, permission_denials:$den}'
EOF
cat > "$FIX/bin/agentmail" <<'EOF'
#!/usr/bin/env bash
echo "CALL: $* key=${AGENTMAIL_API_KEY:+si}" >> "$STUB_OUT/mail.log"
exit "${AGENTMAIL_STUB_RC:-0}"
EOF
chmod +x "$FIX"/bin/*

export STUB_OUT="$FIX"
PASS=0; FAIL=0
ok(){ echo "  PASS: $1"; PASS=$((PASS+1)); }
bad(){ echo "  FAIL: $1"; FAIL=$((FAIL+1)); }
check(){ if eval "$2"; then ok "$1"; else bad "$1"; fi }
run(){ DOVEVALA_REPO="$REPO" LINK_LOGDIR="$LOGDIR" CLAUDE_BIN="$FIX/bin/claude" AGENTMAIL_BIN="$FIX/bin/agentmail" \
       CLAUDE_CRON_ENV="$FIX/conf/claude-cron.env" AGENTMAIL_ENV="$FIX/conf/agentmail.env" \
       DATAFAST_ENV_FILE="${DATAFAST_ENV_FILE:-$FIX/conf/datafast.env}" "$RUN" "$@"; echo "rc=$?" > "$FIX/rc"; }
rc(){ cat "$FIX/rc"; }
mails(){ grep -c '^CALL:' "$FIX/mail.log" 2>/dev/null || echo 0; }
log(){ cat "$LOGDIR"/*.log 2>/dev/null; }
# Il valore di un'opzione passata allo stub nell'ultimo run (una riga per argomento).
opzione(){ awk -v o="$1" 'p{print; exit} $0==o{p=1}' "$FIX/last-args.txt"; }
pulisci(){ rm -f "$LOGDIR"/*.log "$FIX"/mail.log "$FIX"/last-*.txt "$FIX"/preflight* "$FIX"/main.log "$FIX"/tranche-args.txt; }
azzera(){ pulisci; rm -f "$LOGDIR"/state-*; }

echo "=== caso 1: link-review -> prompt slash con RUNNER FACTS, una mail, stato avanzato ==="
azzera
STUB_PROSA="Revisione backlink del $OGGI" STUB_REPORT="REPORT_DATA=$OGGI
REPORT_STATO=punto-zero
REPORT_GSC=ok
REPORT_DATAFAST=ok
REPORT_DATAFORSEO=ok
REPORT_AIRTABLE=ok
REPORT_LINK_NUOVI=0
REPORT_NOTE=nessuno" run link-review
check "invoca /link-review in testa"        "head -c 13 '$FIX/last-prompt.txt' | grep -qx '/link-review '"
check "RUNNER FACTS: data di oggi"          "grep -q 'Data di oggi: $OGGI' '$FIX/last-prompt.txt'"
check "RUNNER FACTS: la mail non è sua"     "grep -q 'tu non mandi mail' '$FIX/last-prompt.txt'"
check "una sola mail"                       "[ \$(mails) -eq 1 ]"
check "oggetto: job, data, stato"           "grep -q -- \"--subject link-review $OGGI: punto-zero, 0 link nuovi\" '$FIX/mail.log'"
check "corpo: la prosa dell'agente"         "grep -q 'Revisione backlink del' '$FIX/mail.log'"
check "corpo: costo e turni"                "grep -q '1.5 USD' '$FIX/mail.log'"
check "stato avanzato per settimana ISO"    "grep -q 'LAST_PERIOD=\"$SETTIMANA\"' '$LOGDIR/state-link-review'"
check "rc=0"                                "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 2: secondo link-review nella stessa settimana -> salta ==="
pulisci
run link-review
check "nessuna chiamata a claude"           "[ ! -f '$FIX/last-prompt.txt' ]"
check "nessuna mail"                        "[ \$(mails) -eq 0 ]"
check "log dice SKIP"                       "log | grep -q 'SKIP: link-review del periodo $SETTIMANA'"
check "rc=0"                                "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 3: LINK_FORZA=1 -> riparte anche nella stessa settimana ==="
pulisci
LINK_FORZA=1 run link-review
check "claude chiamato"                     "[ -f '$FIX/last-prompt.txt' ]"
check "una mail"                            "[ \$(mails) -eq 1 ]"

echo "=== caso 4: claude fallisce -> mail di fallimento, stato fermo ==="
azzera
CLAUDE_STUB_RC=1 STUB_STDOUT="errore finto" run link-review
check "mail: run fallito"                   "grep -q -- '--subject link-review $OGGI — run fallito (rc=1)' '$FIX/mail.log'"
check "la mail porta il log"                "grep -q 'errore finto' '$FIX/mail.log'"
check "stato NON avanzato"                  "[ ! -f '$LOGDIR/state-link-review' ]"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 5: timeout -> lo dice ==="
azzera
CLAUDE_STUB_RC=124 run link-review
check "mail: timeout"                       "grep -q 'run fallito (timeout dopo 30m)' '$FIX/mail.log'"

echo "=== caso 6: uscita non JSON o is_error -> run fallito ==="
azzera
STUB_RAW="Invalid API key · Please run /login" run link-review
check "non JSON: mail di fallimento"        "grep -q 'run fallito' '$FIX/mail.log'"
check "non JSON: porta l'errore"            "grep -q 'Please run /login' '$FIX/mail.log'"
azzera
STUB_IS_ERROR=true run link-review
check "is_error: mail di fallimento"        "grep -q 'run fallito (error_max_turns)' '$FIX/mail.log'"
check "is_error: stato fermo"               "[ ! -f '$LOGDIR/state-link-review' ]"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 6b: uscita JSON come lista di messaggi -> letto il risultato ==="
azzera
STUB_RAW="$(jq -n --arg r "Prosa in lista.

REPORT_DATA=$OGGI
REPORT_STATO=punto-zero
REPORT_LINK_NUOVI=0" '[{type:"system",subtype:"init"},{type:"result",subtype:"success",is_error:false,result:$r,total_cost_usd:2.5,num_turns:3}]')" run link-review
check "mail di esito, non di fallimento"    "grep -q -- '--subject link-review $OGGI: punto-zero, 0 link nuovi' '$FIX/mail.log'"
check "costo letto"                         "grep -q '2.5 USD' '$FIX/mail.log'"

echo "=== caso 7: nessun blocco REPORT_ -> report mancante ==="
azzera
STUB_REPORT="" run link-review
check "mail: report mancante"               "grep -q -- '--subject link-review $OGGI — report mancante' '$FIX/mail.log'"
check "la prosa arriva lo stesso"           "grep -q 'Prosa di prova' '$FIX/mail.log'"
check "stato NON avanzato"                  "[ ! -f '$LOGDIR/state-link-review' ]"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 8: DRY_RUN -> niente mail, niente stato, la mail finisce nel log ==="
azzera
DRY_RUN=1 run link-review
check "nessuna mail inviata"                "[ \$(mails) -eq 0 ]"
check "il corpo è nel log"                  "log | grep -q 'DRY_RUN: mail NON inviata'"
check "oggetto marcato DRY RUN"             "log | grep -q -- '--- mail: \[DRY RUN\] link-review $OGGI'"
check "dice cosa NON ha fatto"              "log | grep -q 'NON fatto (dry run)'"
check "il prompt lo dice all'agente"        "grep -q 'DRY RUN' '$FIX/last-prompt.txt'"
check "stato NON avanzato"                  "[ ! -f '$LOGDIR/state-link-review' ]"
check "rc=0"                                "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 9: report indentato -> letto lo stesso ==="
azzera
STUB_INDENT=1 STUB_REPORT="REPORT_DATA=$OGGI
REPORT_STATO=attesa
REPORT_LINK_NUOVI=2
REPORT_NOTE=nessuno" run link-review
check "oggetto dal report indentato"        "grep -q -- '--subject link-review $OGGI: attesa, 2 link nuovi' '$FIX/mail.log'"
check "blocco REPORT_ nella mail, senza rientro" "grep -q '^REPORT_LINK_NUOVI=2' '$FIX/mail.log'"
check "prosa senza righe REPORT_"           "[ \$(grep -c 'REPORT_LINK_NUOVI' '$FIX/mail.log') -eq 1 ]"
check "stato avanzato"                      "grep -q 'LAST_RESULT=\"ok\"' '$LOGDIR/state-link-review'"

echo "=== caso 10: strumenti negati all'agente -> la mail li elenca ==="
azzera
STUB_DENIALS='[{"tool_name":"mcp__dataforseo__backlinks_bulk_ranks","tool_use_id":"a","tool_input":{}},{"tool_name":"mcp__dataforseo__backlinks_bulk_ranks","tool_use_id":"b","tool_input":{}},{"tool_name":"WebSearch","tool_use_id":"c","tool_input":{}}]' run link-review
check "elenca gli strumenti negati"         "grep -q 'Strumenti negati: mcp__dataforseo__backlinks_bulk_ranks (2), WebSearch (1)' '$FIX/mail.log'"
check "l'oggetto lo segnala"                "grep -q -- '--subject .*strumenti negati' '$FIX/mail.log'"
azzera
STUB_DENIALS='[{"tool_name":"Bash","tool_use_id":"a","tool_input":{"command":"node processo/link/misure.mjs gsc 2026-10-15 | python3 -c \"import json\""}}]' run link-review
check "Bash negato: dice quale comando"     "grep -q 'Bash: node processo/link/misure.mjs gsc 2026-10-15 | python3 -c' '$FIX/mail.log'"

echo "=== caso 10b: il prompt dice in che forma si lanciano gli attrezzi ==="
check "percorso relativo, niente pipe"      "grep -q 'percorso relativo dalla radice del repo' '$FIX/last-prompt.txt'"

echo "=== caso 11: una fonte non risponde -> l'oggetto lo dice ==="
azzera
STUB_REPORT="REPORT_DATA=$OGGI
REPORT_STATO=punto-zero
REPORT_GSC=non ha risposto: token scaduto
REPORT_DATAFAST=ok
REPORT_DATAFORSEO=ok
REPORT_AIRTABLE=non ha risposto: 401
REPORT_LINK_NUOVI=0" run link-review
check "oggetto: fonti mute"                 "grep -q -- '--subject link-review $OGGI: punto-zero, 0 link nuovi — fonti mute: GSC, Airtable' '$FIX/mail.log'"

echo "=== caso 12: REPORT_DATA diversa da oggi -> avviso ==="
azzera
STUB_REPORT="REPORT_DATA=2020-01-01
REPORT_STATO=punto-zero" run link-review
check "avviso sulla data"                   "grep -q 'REPORT_DATA=2020-01-01 non è la data del run' '$FIX/mail.log'"

echo "=== caso 13: la mail non parte -> rc=1, così scatta OnFailure ==="
azzera
AGENTMAIL_STUB_RC=1 run link-review
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"
check "log: agentmail rc=1"                 "log | grep -q 'agentmail rc=1'"

echo "=== caso 14: segreti -> la chiave AgentMail non arriva all'agente ==="
azzera
AGENTMAIL_API_KEY=ereditata run link-review
check "agentmail ha la sua chiave"          "grep -q 'key=si' '$FIX/mail.log'"
azzera
run link-review
check "chiave AgentMail letta dal suo file" "grep -q 'key=si' '$FIX/mail.log'"
check "l'agente non ha la chiave AgentMail" "grep -q 'agentmail= ' '$FIX/main.log'"
check "link-review usa il token di run.sh"  "grep -q 'token=si' '$FIX/main.log'"
check "link-review: niente controllo Gmail" "[ ! -f '$FIX/preflight.log' ]"

echo "=== caso 15: DataFast -> la mail dice dove cerca la chiave ==="
azzera
run link-review
check "chiave trovata"                      "grep -q 'DataFast: DATAFAST_API_KEY presente in $FIX/conf/datafast.env' '$FIX/mail.log'"
azzera
DATAFAST_ENV_FILE="$FIX/conf/manca.env" run link-review
check "chiave assente"                      "grep -q 'DataFast: DATAFAST_API_KEY NON trovata in $FIX/conf/manca.env' '$FIX/mail.log'"
check "il percorso arriva a misure.mjs"     "grep -q 'datafast=$FIX/conf/manca.env' '$FIX/main.log'"

echo "=== caso 16: job sconosciuto -> uso, niente claude, niente mail ==="
azzera
run link-tutto
check "rc=2"                                "[ \"\$(rc)\" = 'rc=2' ]"
check "nessuna chiamata a claude"           "[ ! -f '$FIX/last-prompt.txt' ]"
check "nessuna mail"                        "[ \$(mails) -eq 0 ]"

echo "=== caso 17: skill assente nel checkout -> mail, niente claude ==="
azzera
mv "$REPO/.claude/skills/link-review" "$FIX/via"
run link-review
mv "$FIX/via" "$REPO/.claude/skills/link-review"
check "mail: skill mancante"                "grep -q -- '--subject link-review $OGGI — NON partito: skill mancante' '$FIX/mail.log'"
check "nessuna chiamata a claude"           "[ ! -f '$FIX/last-prompt.txt' ]"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"

# --- link-dono: Gmail ----------------------------------------------------------------
GMAIL6="mcp__claude_ai_Gmail__create_draft mcp__claude_ai_Gmail__list_drafts mcp__claude_ai_Gmail__get_draft mcp__claude_ai_Gmail__search_threads mcp__claude_ai_Gmail__get_thread mcp__claude_ai_Gmail__get_message"
REPORT_DONO="REPORT_DATA=$OGGI
REPORT_INVIO=$OGGI
REPORT_PROSPECT=4
REPORT_BOZZE=2
REPORT_SOLLECITI=1
REPORT_RISPOSTE=nessuno
REPORT_NON_PRIMA_DEL=nessuno
REPORT_NOTE=nessuno"
in_lista(){ tr ',' '\n' <<<"$1" | grep -qxF -- "$2"; }

echo "=== caso 18: link-dono -> controllo Gmail con la login, poi il run ==="
azzera
CLAUDE_CODE_OAUTH_TOKEN=ereditato STUB_REPORT="$REPORT_DONO" run link-dono
A="$(opzione --allowedTools)"
check "controllo Gmail fatto"               "[ -f '$FIX/preflight.log' ]"
check "controllo senza token (login)"       "grep -qx 'token=' '$FIX/preflight.log'"
check "run senza token (login)"             "grep -q '^token= ' '$FIX/main.log'"
check "invoca /link-dono in testa"          "head -c 11 '$FIX/last-prompt.txt' | grep -qx '/link-dono '"
check "argomenti oggi e invio"              "grep -qx -- '- oggi=$OGGI' '$FIX/last-prompt.txt' && grep -qx -- '- invio=$OGGI' '$FIX/last-prompt.txt'"
check "tetto di 5 bozze nel prompt"         "grep -q 'Al massimo 5 bozze' '$FIX/last-prompt.txt'"
for t in $GMAIL6; do check "allowlist: $t" "in_lista '$A' '$t'"; done
check "allowlist: dono-ccnl.js"             "in_lista '$A' 'Bash(node processo/link/dono-ccnl.js:*)'"
check "allowlist: Airtable update, due prefissi" "in_lista '$A' 'mcp__plugin_airtable_airtable__update_records_for_table' && in_lista '$A' 'mcp__claude_ai_Airtable__update_records_for_table'"
check "negati: send_message, reply, forward" "N=\"\$(opzione --disallowedTools)\"; in_lista \"\$N\" mcp__claude_ai_Gmail__send_message && in_lista \"\$N\" mcp__claude_ai_Gmail__reply && in_lista \"\$N\" mcp__claude_ai_Gmail__forward"
check "oggetto: bozze e solleciti"          "grep -q -- \"--subject link-dono $OGGI: 2 bozze, 1 solleciti\" '$FIX/mail.log'"
check "nessuno: niente da leggere né date"  "! grep -q -- '--subject .*\\(risposte da leggere\\|non inviare prima\\)' '$FIX/mail.log'"
check "il tetto viene da jobs.sh"           "grep -qx -- '- bozze_max=$MAX_BOZZE. Al massimo $MAX_BOZZE bozze in questo run, solleciti compresi.' '$FIX/last-prompt.txt'"
check "il prompt dice nessuno e n/d"        "grep -q 'Dove non c.è niente scrivi nessuno; dove un valore non lo hai, n/d' '$FIX/last-prompt.txt'"
check "Edit: la skill non lo usa, negato"   "! in_lista '$A' Edit && in_lista \"\$(opzione --disallowedTools)\" Edit && in_lista '$A' Write"
check "la mail dice l'autenticazione"       "grep -q 'Autenticazione: login interattiva (LINK_GMAIL_AUTH=login), Gmail verificato prima di partire' '$FIX/mail.log'"
check "stato per settimana ISO"             "grep -q 'LAST_PERIOD=\"$SETTIMANA\"' '$LOGDIR/state-link-dono'"
check "rc=0"                                "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 19: Gmail non caricato -> non lavora, mail esplicita ==="
azzera
STUB_GMAIL=0 run link-dono
check "nessun run della skill"              "[ ! -f '$FIX/last-prompt.txt' ]"
check "mail: Gmail non disponibile"         "grep -q -- '--subject link-dono $OGGI — NON partito: Gmail non disponibile' '$FIX/mail.log'"
check "la mail dice lo stato del connettore" "grep -q 'claude.ai Gmail: needs-auth' '$FIX/mail.log'"
check "stato NON avanzato"                  "[ ! -f '$LOGDIR/state-link-dono' ]"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 20: claude non parte nel controllo -> mail esplicita ==="
azzera
STUB_PREFLIGHT_RC=1 run link-dono
check "nessun run della skill"              "[ ! -f '$FIX/last-prompt.txt' ]"
check "mail: claude non risponde"           "grep -q -- '--subject link-dono $OGGI — NON partito: claude non risponde' '$FIX/mail.log'"
check "porta l'errore di claude"            "grep -q 'Please run /login' '$FIX/mail.log'"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 21: LINK_GMAIL_AUTH=token -> controllo e run col token ==="
azzera
LINK_GMAIL_AUTH=token STUB_REPORT="$REPORT_DONO" run link-dono
check "controllo col token"                 "grep -qx 'token=si' '$FIX/preflight.log'"
check "run col token"                       "grep -q '^token=si ' '$FIX/main.log'"
azzera
LINK_GMAIL_AUTH=boh run link-dono
check "valore sconosciuto: rc=2"            "[ \"\$(rc)\" = 'rc=2' ]"
check "valore sconosciuto: niente claude"   "[ ! -f '$FIX/preflight.log' ] && [ ! -f '$FIX/last-prompt.txt' ]"

echo "=== caso 22: link-dono oltre il tetto, o con una data da rispettare -> l'oggetto lo dice ==="
azzera
STUB_REPORT="REPORT_DATA=$OGGI
REPORT_BOZZE=6
REPORT_SOLLECITI=0
REPORT_RISPOSTE=esempio.it
REPORT_NON_PRIMA_DEL=2026-11-01" run link-dono
check "tetto superato"                      "grep -q -- '--subject .*ATTENZIONE: 6 bozze, oltre il tetto di 5' '$FIX/mail.log'"
check "non inviare prima del"               "grep -q -- '--subject .*non inviare prima del 2026-11-01' '$FIX/mail.log'"
check "risposte da leggere"                 "grep -q -- '--subject .*risposte da leggere' '$FIX/mail.log'"

echo "=== caso 22b: link-dono, i solleciti contano nel tetto delle 5 bozze ==="
azzera
STUB_REPORT="REPORT_DATA=$OGGI
REPORT_BOZZE=4
REPORT_SOLLECITI=2" run link-dono
check "il prompt: solleciti compresi"       "grep -q 'Al massimo 5 bozze in questo run, solleciti compresi' '$FIX/last-prompt.txt'"
check "4 nuove + 2 solleciti: oltre il tetto" "grep -q -- '--subject .*ATTENZIONE: 6 bozze, oltre il tetto di 5' '$FIX/mail.log'"
azzera
STUB_REPORT="REPORT_DATA=$OGGI
REPORT_BOZZE=3
REPORT_SOLLECITI=2" run link-dono
check "3 nuove + 2 solleciti: nel tetto"    "! grep -q 'ATTENZIONE' '$FIX/mail.log'"

echo "=== caso 23: DRY_RUN di link-dono -> niente strumenti di scrittura ==="
azzera
DRY_RUN=1 STUB_REPORT="$REPORT_DONO" run link-dono
A="$(opzione --allowedTools)"; N="$(opzione --disallowedTools)"
check "controllo Gmail fatto lo stesso"     "[ -f '$FIX/preflight.log' ]"
check "niente create_draft"                 "! in_lista '$A' mcp__claude_ai_Gmail__create_draft"
check "niente update_records"               "! grep -q 'update_records_for_table' <<<'$A'"
check "lettura Gmail resta"                 "in_lista '$A' mcp__claude_ai_Gmail__get_thread"
check "create_draft tra i negati"           "in_lista '$N' mcp__claude_ai_Gmail__create_draft"
check "nessuna mail"                        "[ \$(mails) -eq 0 ]"
check "stato NON avanzato"                  "[ ! -f '$LOGDIR/state-link-dono' ]"

echo "=== caso 24: LINK_ARGS -> argomenti a mano nel prompt ==="
azzera
LINK_ARGS="ccnl=commercio" STUB_REPORT="$REPORT_DONO" run link-dono
check "argomenti a mano nel prompt"         "grep -q 'ccnl=commercio' '$FIX/last-prompt.txt'"

echo "=== caso 24b: link-dono la settimana dopo una tranche -> ccnl= da solo ==="
azzera
STUB_TRANCHE='[{"ccnl":"commercio","decorrenza":"2026-11-01","sezioni":[]},{"ccnl":"dmo","decorrenza":"2026-11-01","sezioni":[]}]' \
  STUB_REPORT="$REPORT_DONO" run link-dono
check "chiede le tranche degli ultimi 7 giorni" "grep -qx \"tranche \$(date -d '7 days ago' +%F) $OGGI\" '$FIX/tranche-args.txt'"
check "ccnl= nel prompt"                    "grep -qx -- '- ccnl=commercio,dmo (tranche partite negli ultimi 7 giorni: commercio dal 2026-11-01, dmo dal 2026-11-01)' '$FIX/last-prompt.txt'"
check "il tetto resta nel prompt"           "grep -q 'Al massimo 5 bozze in questo run' '$FIX/last-prompt.txt'"
check "la mail lo dice"                     "grep -q 'Tranche negli ultimi 7 giorni: commercio dal 2026-11-01, dmo dal 2026-11-01' '$FIX/mail.log'"
azzera
STUB_TRANCHE='[]' STUB_REPORT="$REPORT_DONO" run link-dono
check "nessuna tranche: niente ccnl="       "! grep -q 'ccnl=' '$FIX/last-prompt.txt'"
azzera
STUB_TRANCHE_RC=1 STUB_REPORT="$REPORT_DONO" run link-dono
check "calendario rotto: il run parte"      "[ -f '$FIX/last-prompt.txt' ] && ! grep -q 'ccnl=' '$FIX/last-prompt.txt'"
check "calendario rotto: la mail lo dice"   "grep -q 'Calendario delle tranche NON letto' '$FIX/mail.log'"
azzera
STUB_TRANCHE='[{"ccnl":"commercio","decorrenza":"2026-11-01","sezioni":[]}]' run link-review
check "link-review non lo chiede"           "[ ! -f '$FIX/tranche-args.txt' ]"

# --- link-fonti e link-recupero: il primo lunedì del mese ------------------------------
echo "=== caso 25: link-fonti -> token, niente Gmail, guardia per mese ==="
azzera
STUB_REPORT="REPORT_DATA=$OGGI
REPORT_PROMPT=23/24
REPORT_CLUSTER=7/7
REPORT_FALLITE=COM-3
REPORT_SCRITTI=12" run link-fonti
A="$(opzione --allowedTools)"; N="$(opzione --disallowedTools)"
check "invoca /link-fonti in testa"         "head -c 12 '$FIX/last-prompt.txt' | grep -qx '/link-fonti '"
check "nessun controllo Gmail"              "[ ! -f '$FIX/preflight.log' ]"
check "col token"                           "grep -q '^token=si ' '$FIX/main.log'"
check "allowlist: scraper ChatGPT"          "in_lista '$A' mcp__dataforseo__ai_optimization_chat_gpt_scraper"
check "allowlist: AI Overview top domains"  "in_lista '$A' mcp__dataforseo__ai_opt_llm_ment_top_domains"
check "allowlist: aggrega.js"               "in_lista '$A' 'Bash(node processo/link/aggrega.js:*)'"
check "allowlist: crea record, due prefissi" "in_lista '$A' mcp__plugin_airtable_airtable__create_records_for_table && in_lista '$A' mcp__claude_ai_Airtable__create_records_for_table"
check "allowlist: niente Gmail"             "! grep -q 'Gmail' <<<'$A'"
check "Write ammesso (la raccolta)"         "in_lista '$A' Write && ! in_lista '$N' Write"
check "il prompt dice dove va la raccolta"  "grep -q '.link-fonti/' '$FIX/last-prompt.txt'"
check "oggetto: scritti e prompt"           "grep -q -- \"--subject link-fonti $OGGI: 12 prospect su Airtable (prompt 23/24), fallite: COM-3\" '$FIX/mail.log'"
check "stato per mese"                      "grep -q 'LAST_PERIOD=\"$MESE\"' '$LOGDIR/state-link-fonti'"

echo "=== caso 26: link-recupero -> controllo Gmail, sola lettura sui file, guardia per mese ==="
azzera
STUB_REPORT="REPORT_DATA=$OGGI
REPORT_LINK_PERSI=1
REPORT_MENZIONI=2
REPORT_BOZZE=1
REPORT_PIANO_REDIRECT={\"source\": \"/vecchio\", \"destination\": \"/nuovo/\", \"permanent\": true}" run link-recupero
A="$(opzione --allowedTools)"; N="$(opzione --disallowedTools)"
check "controllo Gmail fatto"               "[ -f '$FIX/preflight.log' ]"
check "invoca /link-recupero in testa"      "head -c 15 '$FIX/last-prompt.txt' | grep -qx '/link-recupero '"
check "allowlist: backlink, SERP, Content Analysis" "in_lista '$A' mcp__dataforseo__backlinks_backlinks && in_lista '$A' mcp__dataforseo__serp_organic_live_advanced && in_lista '$A' mcp__dataforseo__content_analysis_search"
check "allowlist: verifica-pagina.js"       "in_lista '$A' 'Bash(node processo/link/verifica-pagina.js:*)'"
for t in $GMAIL6; do check "allowlist: $t" "in_lista '$A' '$t'"; done
check "Write negato"                        "in_lista '$N' Write && ! in_lista '$A' Write"
check "oggetto: persi, menzioni, bozze, redirect" "grep -q -- \"--subject link-recupero $OGGI: 1 link persi, 2 menzioni, 1 bozze, piano redirect da applicare\" '$FIX/mail.log'"
check "stato per mese"                      "grep -q 'LAST_PERIOD=\"$MESE\"' '$LOGDIR/state-link-recupero'"

# --- l'allowlist non può mai inviare ---------------------------------------------------
# Fallisce se send_message, reply o forward (o un server intero, o Perplexity/Firecrawl)
# compaiono nell'allowlist di un job, in qualunque modo. Gli attrezzi Bash devono esistere nel repo.
allowlist_sicura(){
  local voce
  while IFS= read -r voce; do
    [ -z "$voce" ] && continue
    case "$voce" in
      *send_message*|*reply*|*forward*) echo "invia: $voce"; return 1 ;;
      *perplexity*|*erplexity*|*irecrawl*) echo "senza credito: $voce"; return 1 ;;
      mcp__claude_ai_Gmail__*) grep -qxF -- "$voce" <<<"$(tr ' ' '\n' <<<"$GMAIL6")" || { echo "Gmail non ammesso: $voce"; return 1; } ;;
      mcp__*__*) ;;
      mcp__*) echo "server intero: $voce"; return 1 ;;
      "Bash(node "*":*)") local f="${voce#Bash(node }"; f="${f%:*)}"
        [ -f "$ROOT/$f" ] || { echo "attrezzo inesistente: $f"; return 1; } ;;
      Bash*) echo "Bash generico: $voce"; return 1 ;;
    esac
  done < <(tr ',' '\n' <<<"$1")
  return 0
}
echo "=== caso 27: il controllo dell'allowlist riconosce gli invii ==="
for cattiva in "WebFetch,mcp__claude_ai_Gmail__send_message" "mcp__claude_ai_Gmail__reply" "mcp__claude_ai_Gmail__forward" \
               "mcp__claude_ai_Gmail" "mcp__perplexity__perplexity_ask" "mcp__claude_ai_Firecrawl__firecrawl_scrape" \
               "mcp__claude_ai_Gmail__trash_thread" "Bash(node:*)" "Bash(node processo/link/non-esiste.js:*)"; do
  check "rifiuta: $cattiva"                 "! allowlist_sicura '$cattiva' >/dev/null"
done

echo "=== caso 28: allowlist di ogni job, normale e DRY_RUN -> nessuno strumento che invia ==="
for j in $LINK_JOBS; do
  for d in 0 1; do
    azzera
    DRY_RUN=$d LINK_FORZA=1 run "$j"
    A="$(opzione --allowedTools)"; N="$(opzione --disallowedTools)"
    check "$j dry=$d: allowlist presente"   "[ -n '$A' ]"
    check "$j dry=$d: allowlist sicura"     "allowlist_sicura '$A'"
    check "$j dry=$d: invii negati"         "in_lista '$N' mcp__claude_ai_Gmail__send_message && in_lista '$N' mcp__claude_ai_Gmail__reply && in_lista '$N' mcp__claude_ai_Gmail__forward"
  done
done

# --- lancia.sh --------------------------------------------------------------------
# Clone bare come quello di produzione e un run.sh finto: qui si verifica solo il ciclo di
# vita del worktree, il lock e i dati di lavoro; i rami di run.sh sono coperti sopra.
LANCIA="$HERE/../lancia.sh"
GITDIR="$FIX/job.git"; AHOME="$FIX/home"
git clone -q --bare "$FIX/origin.git" "$GITDIR"
git -C "$GITDIR" config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git -C "$GITDIR" fetch -q origin
printf '%s\n' '#!/usr/bin/env bash' \
  'echo "REPO=$DOVEVALA_REPO LOGDIR=$LINK_LOGDIR JOB=$1" > "$STUB_OUT/finto-run.txt"' \
  'git -C "$DOVEVALA_REPO" rev-parse HEAD >> "$STUB_OUT/finto-run.txt"' \
  '[ -n "${FINTO_DATI:-}" ] && mkdir -p "$DOVEVALA_REPO/.link-dono" && echo "{}" > "$DOVEVALA_REPO/.link-dono/esempio.it-oggi.json"' \
  'exit "${FINTO_RC:-0}"' > "$FIX/bin/finto-run"
chmod +x "$FIX/bin/finto-run"
lancia(){ LINK_GITDIR="$GITDIR" LINK_HOME="$AHOME" LINK_RUN="$FIX/bin/finto-run" \
          "$LANCIA" "$@" 2>"$FIX/lancia.err"; echo "rc=$?" > "$FIX/rc"; }
worktrees(){ ls -d "$AHOME"/run-* 2>/dev/null | wc -l; }

echo "=== caso 29: lancia.sh -> worktree fresco su origin/main, run.sh col job, poi rimosso ==="
rm -f "$FIX/finto-run.txt"
lancia link-review
check "run.sh chiamato nel worktree"        "grep -q 'REPO=$AHOME/run-link-review-' '$FIX/finto-run.txt'"
check "col nome del job"                    "grep -q 'JOB=link-review' '$FIX/finto-run.txt'"
check "log fuori dal worktree"              "grep -q 'LOGDIR=$AHOME/logs' '$FIX/finto-run.txt'"
check "worktree su origin/main"             "grep -qx \"\$(git -C '$FIX/origin.git' rev-parse main)\" '$FIX/finto-run.txt'"
check "worktree rimosso"                    "[ \$(worktrees) -eq 0 ]"
check "git non lo ricorda più"              "[ \$(git -C '$GITDIR' worktree list | wc -l) -eq 1 ]"
check "rc=0"                                "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 30: lancia.sh -> i dati di lavoro dei prospect restano fuori dal repo ==="
FINTO_DATI=1 lancia link-dono
check "dati copiati in home/dati"           "[ -f '$AHOME/dati/.link-dono/esempio.it-oggi.json' ]"
check "worktree rimosso lo stesso"          "[ \$(worktrees) -eq 0 ]"

echo "=== caso 31: lancia.sh -> rc di run.sh propagato, worktree rimosso ==="
FINTO_RC=1 lancia link-fonti
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"
check "worktree rimosso"                    "[ \$(worktrees) -eq 0 ]"

echo "=== caso 32: lancia.sh -> un job alla volta (lock) ==="
rm -f "$FIX/finto-run.txt"
flock "$AHOME/link.lock" sleep 5 & BLOCCO=$!
sleep 0.3
LINK_LOCK_WAIT=1 lancia link-recupero
kill "$BLOCCO" 2>/dev/null; wait "$BLOCCO" 2>/dev/null
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"
check "lo dice su stderr"                   "grep -q 'lock' '$FIX/lancia.err'"
check "run.sh non chiamato"                 "[ ! -f '$FIX/finto-run.txt' ]"

echo "=== caso 33: lancia.sh -> job sconosciuto ==="
lancia link-tutto
check "rc=2"                                "[ \"\$(rc)\" = 'rc=2' ]"
check "nessun worktree"                     "[ \$(worktrees) -eq 0 ]"

echo "=== caso 34: lancia.sh -> fetch fallito, un nuovo tentativo, poi muore ==="
git clone -q --bare "$FIX/origin.git" "$FIX/rotto.git"
git -C "$FIX/rotto.git" remote set-url origin "$FIX/non-esiste.git"
rm -f "$FIX/finto-run.txt"
LINK_GITDIR="$FIX/rotto.git" LINK_HOME="$AHOME" LINK_RUN="$FIX/bin/finto-run" LINK_FETCH_RETRY_SLEEP=0 \
  "$LANCIA" link-review 2>"$FIX/lancia.err"; echo "rc=$?" > "$FIX/rc"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"
check "ha riprovato"                        "grep -q 'riprovo' '$FIX/lancia.err'"
check "run.sh non chiamato"                 "[ ! -f '$FIX/finto-run.txt' ]"

echo "=== caso 34b: lancia.sh installato senza jobs.sh accanto -> muore e lo dice ==="
mkdir -p "$FIX/solo" && cp "$LANCIA" "$FIX/solo/lancia.sh"
rm -f "$FIX/finto-run.txt"
LINK_GITDIR="$GITDIR" LINK_HOME="$AHOME" LINK_RUN="$FIX/bin/finto-run" "$FIX/solo/lancia.sh" link-review 2>"$FIX/lancia.err"; echo "rc=$?" > "$FIX/rc"
check "rc=1"                                "[ \"\$(rc)\" = 'rc=1' ]"
check "dice che manca jobs.sh"              "grep -q 'manca $FIX/solo/jobs.sh' '$FIX/lancia.err'"
check "run.sh non chiamato"                 "[ ! -f '$FIX/finto-run.txt' ]"

# --- systemd ----------------------------------------------------------------------
# Le unit non si installano qui: si controllano i file e, con systemd-analyze, che ogni
# OnCalendar scatti nel giorno e all'ora di Roma giusti, cambio d'ora compreso.
UNITS="$HERE/../systemd"
chiave(){ sed -n "s/^$2=//p" "$UNITS/$1" | head -1; }
# Le prossime 4 esecuzioni di un OnCalendar, in ora di Roma: "Mon 07:00 02".
scatti(){ systemd-analyze calendar --iterations=4 "$1" 2>/dev/null \
  | sed -n 's/^ *\(Next elapse\|Iteration #[0-9]*\): [A-Za-z]* \(.*\) UTC$/\2/p' \
  | while read -r d t; do LC_ALL=C TZ=Europe/Rome date -d "$d $t UTC" '+%a %H:%M %d'; done; }

echo "=== caso 35: timer -> giorno, ora di Roma, servizio giusto ==="
for riga in "link-review:Mon:07:00:tutti" "link-dono:Tue:07:00:tutti" "link-fonti:Mon:07:05:primi" "link-recupero:Mon:07:10:primi"; do
  IFS=: read -r j g h m quali <<<"$riga"
  T="$j.timer"
  check "$T esiste"                         "[ -f '$UNITS/$T' ]"
  check "$T: fuso nell'OnCalendar"          "chiave $T OnCalendar | grep -q 'Europe/Rome\$'"
  check "$T: Persistent=true"               "[ \"\$(chiave $T Persistent)\" = true ]"
  check "$T: lancia link@$j.service"        "[ \"\$(chiave $T Unit)\" = 'link@$j.service' ]"
  check "$T: installabile"                  "[ \"\$(chiave $T WantedBy)\" = timers.target ]"
  if command -v systemd-analyze >/dev/null; then
    S="$(scatti "$(chiave "$T" OnCalendar)")"
    check "$T: 4 scatti calcolati"          "[ \$(grep -c . <<<'$S') -eq 4 ]"
    check "$T: sempre $g alle $h:$m di Roma" "! grep -qv '^$g $h:$m ' <<<'$S'"
    [ "$quali" = primi ] && check "$T: solo il primo $g del mese" "! awk '{ if (\$3+0 > 7) bad=1 } END { exit !bad }' <<<'$S'"
  fi
done

echo "=== caso 36: link@.service e link-fallito@.service ==="
S=link@.service
check "$S: lancia.sh col job dell'istanza"  "[ \"\$(chiave $S ExecStart)\" = '/root/cron/link/lancia.sh %i' ]"
check "$S: oneshot"                         "[ \"\$(chiave $S Type)\" = oneshot ]"
check "$S: OnFailure per istanza"           "[ \"\$(chiave $S OnFailure)\" = 'link-fallito@%i.service' ]"
check "$S: HOME=/root"                      "grep -qx 'Environment=HOME=/root' '$UNITS/$S'"
check "$S: PATH con ~/.local/bin"           "grep -q '^Environment=PATH=/root/.local/bin:' '$UNITS/$S'"
check "$S: timeout sopra lock + run"        "[ \"\$(chiave $S TimeoutStartSec)\" = 5h ]"
F=link-fallito@.service
check "$F: manda la mail con AgentMail"     "grep -q 'agentmail inboxes:messages send' '$UNITS/$F'"
check "$F: oggetto col job"                 "grep -q -- '--subject \"%i FALLITO' '$UNITS/$F'"
check "$F: stato del servizio dell'istanza" "grep -q 'systemctl status link@%i.service' '$UNITS/$F'"
check "$F: %% per la data"                  "grep -q 'date +%%F' '$UNITS/$F'"

# --- il contratto con le skill vere -------------------------------------------------
# run.sh le invoca con lo slash e legge chiavi precise del loro blocco REPORT_: se una skill
# perde il flag o rinomina una chiave, la mail si svuota senza errori. Lo dice questo test.
echo "=== caso 37: le skill vere -> slash e chiavi REPORT_ che run.sh legge ==="
for j in $LINK_JOBS; do
  job_config "$j"; SK="$ROOT/.claude/skills/$j/SKILL.md"
  check "$j: disable-model-invocation"      "grep -qx 'disable-model-invocation: true' '$SK'"
  for k in $REPORT; do
    check "$j: $k nel blocco REPORT_"       "grep -qE '^[[:space:]]*$k=' '$SK'"
  done
  check "$j: un solo nessuno nel REPORT_"   "! grep -qE '^[[:space:]]*REPORT_[A-Z_]+=.*nessuna' '$SK'"
  check "$j: dice nessuno e n/d"            "grep -q 'Dove non c.è niente scrivi \`$NESSUNO\`; se un valore non lo hai, \`$ND\`' '$SK'"
  [ "$BOZZE" = 1 ] && check "$j: il tetto dai RUNNER FACTS" "grep -q 'bozze_max' '$SK' && ! grep -qE 'Al massimo [0-9]+ bozze' '$SK'"
done

echo "=== caso 38: le skill vere -> Recuperato o nuovo scritto da chi crea o lavora il record ==="
skill(){ echo "$ROOT/.claude/skills/$1/SKILL.md"; }
check "link-fonti scrive Nuovo"             "grep -qE 'Recuperato o nuovo.*\`Nuovo\`' \"\$(skill link-fonti)\""
check "link-dono scrive Nuovo"              "grep -qE 'Recuperato o nuovo.*\`Nuovo\`' \"\$(skill link-dono)\""
check "link-recupero scrive Recuperato"     "grep -qE 'Recuperato o nuovo.*\`Recuperato\`' \"\$(skill link-recupero)\""
check "link-recupero: anche sulle menzioni" "! grep -q 'vuoto per le menzioni' \"\$(skill link-recupero)\""
check "link-review: vuoto conta come Nuovo" "grep -qE 'Recuperato o nuovo.*vuoto.*\`Nuovo\`' \"\$(skill link-review)\""

echo
echo "=== $PASS pass, $FAIL fail ==="
[ "$FAIL" -eq 0 ]
