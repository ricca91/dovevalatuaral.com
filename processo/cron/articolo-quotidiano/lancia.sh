#!/usr/bin/env bash
# lancia.sh — prepara un checkout usa e getta di origin/main e ci fa girare run.sh.
#
# Perché esiste: fino al 2026-09-24 il job viveva in un worktree fisso su `main`.
# Git non permette lo stesso branch in due worktree, quindi la cartella di lavoro di
# Riccardo non poteva più tornare su main; e ogni build lasciava file sporchi che il
# run successivo doveva ripulire con un `checkout -- .` alla cieca.
#
# Ora il job ha solo un clone bare (il database git, nessun branch in uso) e a ogni
# run crea un worktree staccato su origin/main, fresco. Log e guardia anti-doppione
# stanno fuori, in $ARTICOLO_HOME, perché il worktree sparisce a fine run.
#
# Questo file è installato fuori dal repo (vedi README, "Accenderlo"): è il solo
# pezzo che systemd lancia, e run.sh arriva sempre dalla versione su origin/main.
# Se lo modifichi, reinstallalo.
#
# Un errore qui esce con rc≠0 senza mail propria: ci pensa OnFailure= del servizio,
# che manda le ultime righe del journal. Per questo ogni errore va su stderr.

set -uo pipefail

GITDIR="${ARTICOLO_GITDIR:-/root/cron/dovevalatuaral.git}"
ARTICOLO_HOME="${ARTICOLO_HOME:-/root/cron/articolo-quotidiano}"
NPM_BIN="${NPM_BIN:-npm}"

WT="$ARTICOLO_HOME/run-$(date +%F-%H%M%S)"
mkdir -p "$ARTICOLO_HOME/logs"

muori(){ echo "lancia.sh: $1" >&2; exit 1; }

git -C "$GITDIR" fetch --quiet --prune origin || muori "fetch da origin fallito ($GITDIR)"
# Worktree di run precedenti cancellati a mano: senza prune git li crede ancora vivi.
git -C "$GITDIR" worktree prune
git -C "$GITDIR" worktree add --quiet --detach "$WT" origin/main \
  || muori "impossibile creare il worktree $WT su origin/main"

RUN="${ARTICOLO_RUN:-$WT/processo/cron/articolo-quotidiano/run.sh}"

# Le dipendenze servono a `npm test`: un worktree nuovo non ha node_modules.
( cd "$WT" && "$NPM_BIN" ci --silent --no-audit --no-fund ) \
  || muori "npm ci fallito in $WT (worktree lasciato per diagnosi)"

DOVEVALA_REPO="$WT" ARTICOLO_LOGDIR="$ARTICOLO_HOME/logs" "$RUN"
RC=$?

# Un articolo non committato (bozza sotto soglia, build rotta) o committato ma non
# arrivato su origin (push fallito) è lavoro da non buttare: il worktree resta, e la
# mail di run.sh dice dove. Altrimenti via.
git -C "$GITDIR" fetch --quiet origin
if [ -n "$(git -C "$WT" status --porcelain -- prototipo/articoli)" ]; then
  echo "lancia.sh: articolo non committato, worktree lasciato in $WT" >&2
elif [ -n "$(git -C "$WT" log --oneline origin/main..HEAD)" ]; then
  echo "lancia.sh: commit non arrivato su origin/main, worktree lasciato in $WT" >&2
else
  git -C "$GITDIR" worktree remove --force "$WT" \
    || echo "lancia.sh: non riesco a rimuovere $WT, lo farà il prossimo prune" >&2
fi

exit "$RC"
