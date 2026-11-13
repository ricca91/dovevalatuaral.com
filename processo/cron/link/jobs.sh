# La tabella dei job backlink: tutto ciò che cambia da un job all'altro sta qui, e solo qui.
# La leggono run.sh (allowlist, guardia, autenticazione, RUNNER FACTS), lancia.sh (quali job
# esistono) e test/test.sh. Si carica con `source`; non esegue niente.
#
# lancia.sh è installato fuori dal repo e legge la copia installata accanto a sé
# (/root/cron/link/jobs.sh): a ogni modifica di questo file si reinstalla (README, "Accenderlo").

LINK_JOBS="link-review link-dono link-fonti link-recupero"

# Il tetto di bozze Gmail per run, solleciti compresi. run.sh lo passa alla skill nei RUNNER
# FACTS (bozze_max) e lo controlla sul blocco REPORT_.
MAX_BOZZE=5

# I due valori convenzionali dei blocchi REPORT_ (README, "Il blocco REPORT_"): NESSUNO quando
# non c'è niente da dire (zero elementi, nessuna data), ND quando il valore non si è potuto sapere.
NESSUNO=nessuno
ND=n/d

# --- i mattoni dell'allowlist -------------------------------------------------------
# Per nome di strumento, mai per server: `mcp__claude_ai_Gmail` ammetterebbe anche send_message.
# Airtable con i due prefissi: col token arriva il plugin, con la login interattiva il
# connettore claude.ai (RIC-120).
airtable() { local t out=""; for t in "$@"; do out+="mcp__plugin_airtable_airtable__$t,mcp__claude_ai_Airtable__$t,"; done; printf '%s' "${out%,}"; }
# Gmail: lettura e creazione di bozze, nient'altro (nomi da RIC-120).
GMAIL_LETTURA="mcp__claude_ai_Gmail__list_drafts,mcp__claude_ai_Gmail__get_draft,mcp__claude_ai_Gmail__search_threads,mcp__claude_ai_Gmail__get_thread,mcp__claude_ai_Gmail__get_message"
GMAIL_BOZZA="mcp__claude_ai_Gmail__create_draft"
# Negati in ogni job, anche se nessuno li ammette: send_message, reply e forward INVIANO
# (reply non crea una bozza); le bozze create sono di Riccardo e non si toccano dopo;
# AgentMail manderebbe mail dall'agente; Perplexity e Firecrawl sono senza credito.
NEGATI_SEMPRE="mcp__claude_ai_Gmail__send_message,mcp__claude_ai_Gmail__reply,mcp__claude_ai_Gmail__forward,mcp__claude_ai_Gmail__update_draft,mcp__claude_ai_Gmail__delete_draft,mcp__claude_ai_Gmail__trash_message,mcp__claude_ai_Gmail__trash_thread,mcp__agentmail,mcp__perplexity,mcp__claude_ai_Firecrawl"
# Gli strumenti che scrivono file: ogni job ha solo quelli che la sua skill usa, gli altri negati
# (con --permission-mode acceptEdits non basterebbe non ammetterli).
FILE_LOCALI="Write Edit NotebookEdit"

# job_config <job>: imposta le colonne della tabella per quel job. Esce 1 se il job non c'è.
#   PERIODO     formato di date(1) della guardia anti-doppione: un run riuscito per periodo
#   TIMEOUT_JOB timeout del run di claude
#   MODELLO     modello del run (MODEL nell'ambiente lo scavalca)
#   GMAIL       1 = crea bozze: interruttore LINK_GMAIL_AUTH e controllo Gmail prima di partire;
#               0 = gira col token di claude-cron, senza Gmail
#   BOZZE       1 = vale il tetto MAX_BOZZE
#   FILE        strumenti di file che la skill usa (.link-fonti/, .link-dono/); gli altri negati
#   STRUMENTI   allowlist sempre ammessa (lettura, attrezzi)
#   SCRIVE      scritture su Airtable e Gmail: tolte e negate in DRY_RUN
#   ARGOMENTI   righe in più per i RUNNER FACTS
#   REPORT      chiavi del blocco REPORT_ che run.sh legge per l'oggetto della mail
job_config() {
  GMAIL=0; BOZZE=0; FILE=""; SCRIVE=""; ARGOMENTI=""; MODELLO=claude-opus-5
  case "$1" in
    link-review)
      PERIODO=%G-W%V; TIMEOUT_JOB=30m   # una revisione per settimana ISO
      STRUMENTI="$(airtable list_records_for_table),mcp__dataforseo__backlinks_summary,mcp__dataforseo__backlinks_backlinks,Bash(node processo/link/misure.mjs:*)"
      REPORT="REPORT_DATA REPORT_STATO REPORT_LINK_NUOVI REPORT_GSC REPORT_DATAFAST REPORT_DATAFORSEO REPORT_AIRTABLE"
      ;;
    link-dono)
      PERIODO=%G-W%V; TIMEOUT_JOB=60m
      GMAIL=1; BOZZE=1; FILE="Write"
      STRUMENTI="$(airtable list_records_for_table),$GMAIL_LETTURA,WebFetch,Read,Write,Bash(node processo/link/dono-ccnl.js:*),Bash(node processo/link/verifica-pagina.js:*),Bash(node processo/link/misure.mjs:*)"
      SCRIVE="$(airtable update_records_for_table),$GMAIL_BOZZA"
      ARGOMENTI="
- oggi=$(date +%F)
- invio=$(date +%F)"
      REPORT="REPORT_DATA REPORT_BOZZE REPORT_SOLLECITI REPORT_RISPOSTE REPORT_NON_PRIMA_DEL"
      ;;
    link-fonti)
      PERIODO=%Y-%m; TIMEOUT_JOB=60m    # il primo lunedì del mese
      FILE="Write Edit"
      # WebSearch: la skill lo usa (site:dominio) per trovare la pagina di un dominio visto solo
      # in AI Overview. Non è Perplexity né Firecrawl.
      STRUMENTI="$(airtable list_records_for_table),mcp__dataforseo__ai_optimization_chat_gpt_scraper,mcp__dataforseo__ai_opt_llm_ment_top_domains,WebFetch,WebSearch,Read,Write,Edit,Bash(node processo/link/aggrega.js:*)"
      SCRIVE="$(airtable create_records_for_table)"
      ARGOMENTI="
- La raccolta va in .link-fonti/ nella root del repo: il checkout è usa e getta, lancia.sh la mette da parte fuori dal repo a fine run."
      REPORT="REPORT_DATA REPORT_SCRITTI REPORT_PROMPT REPORT_FALLITE"
      ;;
    link-recupero)
      PERIODO=%Y-%m; TIMEOUT_JOB=45m
      GMAIL=1; BOZZE=1
      STRUMENTI="$(airtable list_records_for_table),mcp__dataforseo__backlinks_backlinks,mcp__dataforseo__serp_organic_live_advanced,mcp__dataforseo__content_analysis_search,$GMAIL_LETTURA,WebFetch,Bash(node processo/link/verifica-pagina.js:*)"
      SCRIVE="$(airtable create_records_for_table update_records_for_table),$GMAIL_BOZZA"
      REPORT="REPORT_DATA REPORT_LINK_PERSI REPORT_MENZIONI REPORT_BOZZE REPORT_PIANO_REDIRECT"
      ;;
    *) return 1 ;;
  esac
}
