#!/usr/bin/env bash
# lancia.sh <job> — prepara un checkout usa e getta di origin/main e ci fa girare run.sh <job>.
#
#   job = link-review | link-dono | link-fonti | link-recupero
#
# Stesso schema di articolo-quotidiano/lancia.sh: il job ha solo un clone bare (lo stesso,
# /root/cron/dovevalatuaral.git) e a ogni run crea un worktree staccato su origin/main, così
# skill e attrezzi sono sempre quelli di main. Log, guardia anti-doppione e dati di lavoro
# stanno fuori, in $LINK_HOME, perché il worktree sparisce a fine run.
#
# Differenze da articolo-quotidiano:
# - niente commit né push, quindi il worktree si butta sempre;
# - niente npm ci: gli attrezzi delle skill sono node puro, senza node_modules;
# - un job alla volta (flock): il primo lunedì del mese link-review, link-fonti e
#   link-recupero partono a pochi minuti l'uno dall'altro e scrivono sulla stessa tabella;
# - i file di lavoro dei prospect (.link-fonti/, .link-dono/, ignorati da git) si copiano
#   in $LINK_HOME/dati prima di buttare il worktree: fuori dal repo pubblico, ma rileggibili.
#
# Questo file è installato fuori dal repo (vedi README, "Accenderlo"): è il solo pezzo che
# systemd lancia, e run.sh arriva sempre da origin/main. Se lo modifichi, reinstallalo.
#
# Un errore qui esce con rc≠0 senza mail propria: ci pensa OnFailure= del servizio, che
# manda le ultime righe del journal. Per questo ogni errore va su stderr.

set -uo pipefail

JOB="${1:-}"
case "$JOB" in
  link-review|link-dono|link-fonti|link-recupero) ;;
  *) echo "uso: lancia.sh link-review|link-dono|link-fonti|link-recupero" >&2; exit 2 ;;
esac

GITDIR="${LINK_GITDIR:-/root/cron/dovevalatuaral.git}"
LINK_HOME="${LINK_HOME:-/root/cron/link}"
LOCK_WAIT="${LINK_LOCK_WAIT:-10800}"           # 3 ore: il primo lunedì i job si mettono in fila
RETRY_SLEEP="${LINK_FETCH_RETRY_SLEEP:-30}"

mkdir -p "$LINK_HOME/logs" "$LINK_HOME/dati"
muori(){ echo "lancia.sh $JOB: $1" >&2; exit 1; }

exec 9>"$LINK_HOME/link.lock"
flock -w "$LOCK_WAIT" 9 || muori "un altro job link tiene il lock da più di ${LOCK_WAIT}s ($LINK_HOME/link.lock)"

# Il clone bare è lo stesso di articolo-quotidiano, che a fine run (fino a ~07:15) rifà un
# fetch: due fetch insieme possono litigare sui lock dei ref. Un nuovo tentativo basta.
fetch(){ git -C "$GITDIR" fetch --quiet --prune origin; }
if ! fetch; then
  echo "lancia.sh $JOB: fetch fallito, riprovo tra ${RETRY_SLEEP}s" >&2
  sleep "$RETRY_SLEEP"
  fetch || muori "fetch da origin fallito ($GITDIR)"
fi
# Worktree di run precedenti cancellati a mano: senza prune git li crede ancora vivi.
git -C "$GITDIR" worktree prune
WT="$LINK_HOME/run-$JOB-$(date +%F-%H%M%S)"
git -C "$GITDIR" worktree add --quiet --detach "$WT" origin/main \
  || muori "impossibile creare il worktree $WT su origin/main"

RUN="${LINK_RUN:-$WT/processo/cron/link/run.sh}"
# 9>&-: il lock resta di questo script, non dei processi dell'agente.
DOVEVALA_REPO="$WT" LINK_LOGDIR="$LINK_HOME/logs" "$RUN" "$JOB" 9>&-
RC=$?

for d in .link-fonti .link-dono; do
  if [ -d "$WT/$d" ]; then
    mkdir -p "$LINK_HOME/dati/$d" && cp -r "$WT/$d/." "$LINK_HOME/dati/$d/" \
      || echo "lancia.sh $JOB: non riesco a copiare $WT/$d in $LINK_HOME/dati" >&2
  fi
done

git -C "$GITDIR" worktree remove --force "$WT" \
  || echo "lancia.sh $JOB: non riesco a rimuovere $WT, lo farà il prossimo prune" >&2

exit "$RC"
