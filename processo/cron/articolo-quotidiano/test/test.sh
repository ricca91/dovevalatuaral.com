#!/usr/bin/env bash
# Test end-to-end di run.sh su un repo fixture con stub per claude, agentmail, npm e curl.
# Nessun run di Opus, nessuna mail vera, nessun push vero (origin è un bare locale).
# Casi: happy path, guardia anti-doppione, sotto soglia, build rotta, claude fallito,
# nessun articolo, checkout diverso da origin/main, dry run, report indentato,
# main che avanza durante il run, e lancia.sh (worktree usa e getta).
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
RUN="$HERE/../run.sh"
FIX="$(mktemp -d)"
# KEEP=1 lascia la fixture su disco per leggerne i log quando un caso fallisce.
trap 'if [ -n "${KEEP:-}" ]; then echo "fixture: $FIX"; else rm -rf "$FIX"; fi' EXIT

REPO="$FIX/repo"
JOB="$REPO/processo/cron/articolo-quotidiano"
LOGDIR="$JOB/logs"
STATE="$LOGDIR/state"
OGGI="$(date +%F)"

# --- fixture ------------------------------------------------------------------
mkdir -p "$REPO/prototipo/articoli" "$JOB" "$FIX/bin"
git init -q --bare "$FIX/origin.git"
git -C "$FIX/origin.git" symbolic-ref HEAD refs/heads/main
cd "$REPO"
git init -q . && git checkout -q -b main 2>/dev/null; git remote add origin "$FIX/origin.git"
git config user.email t@t && git config user.name test
echo '{"name":"fix"}' > package.json
echo 'process.exit(Number(process.env.BUILD_STUB_RC||0))' > prototipo/genera-articoli.js
git add -A && git commit -q -m init && git push -q -u origin main

# stub claude: due chiamate diverse (articolo, poi Airtable). Scrive l'articolo che
# gli dicono le env, così ogni caso controlla un ramo.
cat > "$FIX/bin/claude" <<'EOF'
#!/usr/bin/env bash
if echo "$*" | grep -q "Airtable appAsCWc"; then
  echo "CALL_AIRTABLE: $*" >> "${STUB_OUT}/airtable.log"; echo OK; exit 0
fi
printf '%s' "$2" > "${STUB_OUT}/last-prompt.txt"
[ "${CLAUDE_STUB_RC:-0}" -ne 0 ] && exit "${CLAUDE_STUB_RC}"
# Simula un PR mergiato mentre l'agente scrive: origin/main va avanti.
if [ -n "${STUB_RACE:-}" ]; then
  ALTRO="$(mktemp -d)"; git clone -q "${STUB_OUT}/origin.git" "$ALTRO"
  git -C "$ALTRO" -c user.email=t@t -c user.name=t commit -q --allow-empty -m "PR mergiato nel frattempo"
  git -C "$ALTRO" push -q origin HEAD:main; rm -rf "$ALTRO"
fi
if [ -n "${STUB_SLUG:-}" ]; then
  printf 'slug: %s\nstato: %s\n' "$STUB_SLUG" "${STUB_STATO:-pubblicato}" \
    > "${STUB_REPO}/prototipo/articoli/${STUB_SLUG}.md"
fi
PAD=""; [ -n "${STUB_INDENT:-}" ] && PAD="    "
sed "s/^/$PAD/" <<BODY
Scritto l'articolo. Fonti verificate su fonti primarie.

REPORT_SLUG=${STUB_SLUG:-}
REPORT_RECORD_ID=recTEST123
REPORT_TITOLO=Un titolo di prova
REPORT_QUERY=busta paga
REPORT_ITERAZIONI=2
REPORT_SEO=93
REPORT_AEO=91
REPORT_STATO=${STUB_STATO:-pubblicato}
REPORT_CTA=/
REPORT_NOTE=nessuna
BODY
EOF
cat > "$FIX/bin/agentmail" <<'EOF'
#!/usr/bin/env bash
echo "CALL: $*" >> "${STUB_OUT}/mail.log"
exit 0
EOF
cat > "$FIX/bin/npm" <<'EOF'
#!/usr/bin/env bash
exit "${NPM_STUB_RC:-0}"
EOF
cat > "$FIX/bin/curl" <<'EOF'
#!/usr/bin/env bash
echo "${CURL_STUB_CODE:-404}"
EOF
chmod +x "$FIX"/bin/*

export STUB_OUT="$FIX" STUB_REPO="$REPO"
PASS=0; FAIL=0
ok(){ echo "  PASS: $1"; PASS=$((PASS+1)); }
bad(){ echo "  FAIL: $1"; FAIL=$((FAIL+1)); }
check(){ if eval "$2"; then ok "$1"; else bad "$1"; fi }
run(){ DOVEVALA_REPO="$REPO" CLAUDE_BIN="$FIX/bin/claude" AGENTMAIL_BIN="$FIX/bin/agentmail" \
       NPM_BIN="$FIX/bin/npm" CURL_BIN="$FIX/bin/curl" "$RUN"; echo "rc=$?" > "$FIX/rc"; }
rc(){ cat "$FIX/rc"; }
mails(){ grep -c '^CALL:' "$FIX/mail.log" 2>/dev/null || echo 0; }
log(){ cat "$LOGDIR"/*.log 2>/dev/null; }
pulisci(){ rm -f "$LOGDIR"/*.log "$FIX/mail.log" "$FIX/last-prompt.txt" "$FIX/airtable.log"; }
reset_repo(){ cd "$REPO"; git checkout -q main; git reset -q --hard HEAD; \
  rm -f prototipo/articoli/*.md; rm -f "$STATE"; pulisci; }

echo "=== caso 1: articolo sopra soglia -> commit, push, mail ==="
reset_repo
STUB_SLUG=articolo-uno STUB_STATO=pubblicato run
check "RUNNER FACTS: data di oggi"        "grep -q 'Data di oggi: $OGGI' '$FIX/last-prompt.txt'"
check "RUNNER FACTS: stato busta-paga"    "grep -q 'HTTP 404' '$FIX/last-prompt.txt'"
check "RUNNER FACTS: nega commit/mail"    "grep -q 'NON sono tuoi' '$FIX/last-prompt.txt'"
check "invoca /seo-90-giorni"              "grep -q '^/seo-90-giorni' '$FIX/last-prompt.txt'"
check "commit creato"                     "git -C '$REPO' log -1 --pretty=%s | grep -q 'Pubblica l.articolo del $OGGI'"
check "commit contiene solo l'articolo"   "[ \"\$(git -C '$REPO' show --name-only --pretty= HEAD)\" = 'prototipo/articoli/articolo-uno.md' ]"
check "push arrivato su origin"           "git -C '$FIX/origin.git' log -1 --pretty=%s | grep -q 'Pubblica'"
check "una sola mail"                     "[ \$(mails) -eq 1 ]"
check "oggetto dice pushato"              "grep -q 'pushato' '$FIX/mail.log'"
check "mail distingue il non verificato"  "grep -q 'NON verificato' '$FIX/mail.log'"
check "Airtable aggiornato dopo il push"  "grep -q 'recTEST123' '$FIX/airtable.log'"
check "Airtable via connettore claude.ai"  "grep -q 'mcp__claude_ai_Airtable' '$FIX/airtable.log'"
check "niente campo File (è un allegato)" "! grep -q \"File='\" '$FIX/airtable.log'"
check "stato avanzato"                    "grep -q 'LAST_RESULT=\"ok\"' '$STATE'"
check "rc=0"                              "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 2: secondo run nello stesso giorno -> salta ==="
pulisci
STUB_SLUG=articolo-due run
check "nessuna chiamata a claude"         "[ ! -f '$FIX/last-prompt.txt' ]"
check "nessuna mail"                      "[ \$(mails) -eq 0 ]"
check "log dice SKIP"                     "log | grep -q 'SKIP: l.articolo di $OGGI'"

echo "=== caso 3: sotto soglia -> bozza, niente push ==="
reset_repo
SHA_PRIMA="$(git -C "$REPO" rev-parse HEAD)"
STUB_SLUG=articolo-bozza STUB_STATO=bozza run
check "nessun commit nuovo"               "[ \"\$(git -C '$REPO' rev-parse HEAD)\" = '$SHA_PRIMA' ]"
check "il file resta sul disco"           "[ -f '$REPO/prototipo/articoli/articolo-bozza.md' ]"
check "mail: sotto soglia"                "grep -q 'sotto soglia' '$FIX/mail.log'"
check "stato NON avanzato"                "[ ! -f '$STATE' ]"
check "rc=0 (non è un errore)"            "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 4: build rotta -> nessun commit ==="
reset_repo
SHA_PRIMA="$(git -C "$REPO" rev-parse HEAD)"
BUILD_STUB_RC=1 STUB_SLUG=articolo-rotto run
check "nessun commit"                     "[ \"\$(git -C '$REPO' rev-parse HEAD)\" = '$SHA_PRIMA' ]"
check "mail: build rotta"                 "grep -q 'build rotta' '$FIX/mail.log'"
check "rc=1"                              "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 5: npm test fallisce -> nessun commit ==="
reset_repo
NPM_STUB_RC=1 STUB_SLUG=articolo-test-rotto run
check "mail: build rotta"                 "grep -q 'build rotta' '$FIX/mail.log'"
check "niente push"                       "! git -C '$FIX/origin.git' log --oneline main | grep -q 'articolo-test-rotto'"

echo "=== caso 6: claude fallisce -> mail di fallimento ==="
reset_repo
CLAUDE_STUB_RC=1 STUB_SLUG=mai run
check "mail: run fallito"                 "grep -q 'run fallito' '$FIX/mail.log'"
check "rc=1"                              "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 7: nessun articolo prodotto -> lo dice ==="
reset_repo
STUB_SLUG= run
check "mail: nessun articolo"             "grep -q 'nessun articolo prodotto' '$FIX/mail.log'"
check "rc=1"                              "[ \"\$(rc)\" = 'rc=1' ]"

echo "=== caso 8: checkout diverso da origin/main -> non parte ==="
reset_repo
git -C "$REPO" checkout -q -b altro
git -C "$REPO" commit -q --allow-empty -m "lavoro in corso"
STUB_SLUG=articolo-branch run
check "nessuna chiamata a claude"         "[ ! -f '$FIX/last-prompt.txt' ]"
check "mail: checkout diverso"            "grep -q 'checkout diverso da origin/main' '$FIX/mail.log'"
check "niente push"                       "! git -C '$FIX/origin.git' log --oneline main | grep -q 'lavoro in corso'"
git -C "$REPO" checkout -q main

echo "=== caso 9: DRY_RUN -> scrive, non pubblica, non manda ==="
reset_repo
SHA_PRIMA="$(git -C "$REPO" rev-parse HEAD)"
DRY_RUN=1 STUB_SLUG=articolo-dry run
check "nessun commit"                     "[ \"\$(git -C '$REPO' rev-parse HEAD)\" = '$SHA_PRIMA' ]"
check "nessuna mail inviata"              "[ \$(mails) -eq 0 ]"
check "il corpo della mail è nel log"     "log | grep -q 'DRY_RUN: mail NON inviata'"
check "Airtable non toccato"              "[ ! -f '$FIX/airtable.log' ]"
check "oggetto marcato DRY RUN"           "log | grep -q '\[DRY RUN\] Articolo'"
check "non dichiara push mai avvenuti"    "! log | grep -q 'push su origin accettato'"
check "dice cosa NON ha fatto"            "log | grep -q 'NON fatto (dry run)'"
check "stato NON avanzato"                "[ ! -f '$STATE' ]"

echo "=== caso 10: report indentato -> letto lo stesso ==="
reset_repo
STUB_INDENT=1 STUB_SLUG=articolo-indentato STUB_STATO=pubblicato run
check "titolo estratto dal report indentato" "grep -q 'Un titolo di prova' '$FIX/mail.log'"
check "record id estratto"                   "grep -q 'recTEST123' '$FIX/airtable.log'"
check "prosa senza righe REPORT_"            "! grep -q 'REPORT_SEO' '$FIX/mail.log'"
check "pushato"                              "git -C '$FIX/origin.git' log -1 --pretty=%s main | grep -q 'Pubblica'"

echo "=== caso 11: main avanza durante il run -> rebase e push ==="
reset_repo
git -C "$REPO" pull -q --ff-only origin main
STUB_RACE=1 STUB_SLUG=articolo-gara STUB_STATO=pubblicato run
check "log: push rifiutato e ritentato"   "log | grep -q 'push rifiutato'"
check "articolo su origin"                "git -C '$FIX/origin.git' log -1 --pretty=%s main | grep -q 'Pubblica'"
check "il PR intermedio non è perso"      "git -C '$FIX/origin.git' log --pretty=%s main | grep -q 'PR mergiato nel frattempo'"
check "storia lineare, niente merge"      "[ \$(git -C '$FIX/origin.git' rev-list --merges main | wc -l) -eq 0 ]"
check "mail: pushato"                     "grep -q 'pushato' '$FIX/mail.log'"
check "rc=0"                              "[ \"\$(rc)\" = 'rc=0' ]"

# --- lancia.sh --------------------------------------------------------------------
# Clone bare come quello di produzione, e un run.sh finto: qui si verifica solo il
# ciclo di vita del worktree, i rami di run.sh sono coperti sopra.
LANCIA="$HERE/../lancia.sh"
GITDIR="$FIX/job.git"; AHOME="$FIX/home"
git clone -q --bare "$FIX/origin.git" "$GITDIR"
git -C "$GITDIR" config remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
printf '%s\n' '#!/usr/bin/env bash' \
  'echo "REPO=$DOVEVALA_REPO LOGDIR=$ARTICOLO_LOGDIR" > "$STUB_OUT/finto-run.txt"' \
  'git -C "$DOVEVALA_REPO" rev-parse HEAD >> "$STUB_OUT/finto-run.txt"' \
  '[ -n "${FINTO_BOZZA:-}" ] && echo bozza > "$DOVEVALA_REPO/prototipo/articoli/bozza.md"' \
  'exit "${FINTO_RC:-0}"' > "$FIX/bin/finto-run"
chmod +x "$FIX/bin/finto-run"
lancia(){ ARTICOLO_GITDIR="$GITDIR" ARTICOLO_HOME="$AHOME" ARTICOLO_RUN="$FIX/bin/finto-run" \
          NPM_BIN="$FIX/bin/npm" "$LANCIA" 2>"$FIX/lancia.err"; echo "rc=$?" > "$FIX/rc"; }
worktrees(){ ls -d "$AHOME"/run-* 2>/dev/null | wc -l; }

echo "=== caso 12: lancia.sh, run pulito -> worktree fresco su origin/main, poi rimosso ==="
lancia
check "run.sh chiamato nel worktree"      "grep -q 'REPO=$AHOME/run-' '$FIX/finto-run.txt'"
check "log fuori dal worktree"            "grep -q 'LOGDIR=$AHOME/logs' '$FIX/finto-run.txt'"
check "worktree su origin/main"           "grep -qx \"\$(git -C '$FIX/origin.git' rev-parse main)\" '$FIX/finto-run.txt'"
check "worktree rimosso"                  "[ \$(worktrees) -eq 0 ]"
check "git non lo ricorda più"            "[ \$(git -C '$GITDIR' worktree list | wc -l) -eq 1 ]"
check "rc=0"                              "[ \"\$(rc)\" = 'rc=0' ]"

echo "=== caso 13: lancia.sh, articolo non committato -> worktree lasciato ==="
FINTO_BOZZA=1 lancia
check "worktree lasciato"                 "[ \$(worktrees) -eq 1 ]"
check "lo dice su stderr"                 "grep -q 'worktree lasciato' '$FIX/lancia.err'"
check "la bozza è lì"                     "ls '$AHOME'/run-*/prototipo/articoli/bozza.md >/dev/null"
rm -rf "${AHOME:?}"/run-*; git -C "$GITDIR" worktree prune

echo "=== caso 14: lancia.sh, rc di run.sh propagato ==="
FINTO_RC=1 lancia
check "rc=1"                              "[ \"\$(rc)\" = 'rc=1' ]"

echo
echo "=== $PASS pass, $FAIL fail ==="
[ "$FAIL" -eq 0 ]
