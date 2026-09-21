# -*- coding: utf-8 -*-
"""Genera il piano editoriale a 90 giorni in JSON.
Ogni volume/KD qui dentro viene dai file in ricerca/ (rilevazioni 20/09/2026).
None = dato non confermato dal database: NON scrivere zero."""
import json, datetime

START = datetime.date(2026, 9, 22)
R = "DataForSEO 20/09/2026"

def d(n):
    return (START + datetime.timedelta(days=n - 1)).isoformat()

ITEMS = []
def add(**kw):
    ITEMS.append(kw)

# =====================================================================
# BLOCCO 1 — giorni 1-14 · APERTURA
# Doppio binario: (a) i picchi di OTTOBRE vanno online adesso,
# (b) si pianta subito il pilastro busta paga.
# =====================================================================

add(g=1, titolo="Come si legge una busta paga, riga per riga, con i conti rifatti",
    slug="come-leggere-busta-paga", q="come leggere la busta paga",
    q2="come leggere una busta paga; busta paga come leggerla; come si legge la busta paga; busta paga come si legge",
    vol=3600, kd=0, cluster="Leggere la busta paga", tipo="Pilastro",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco="Gennaio", prio="Alta", diff="Media", aio=False,
    angolo="Il pezzo più importante dei 90. SERP senza AI Overview e senza PAA, primo risultato un PDF del 2016, BustaIA oltre la 50a. L'avversario e Zeta Service, primo con 3.500 parole e ZERO numeri, che promette nel titolo la lista dei codici e non la da. Noi diamo quello che lui promette: un cedolino annotato navigabile riga per riga, ogni importo ricalcolato dal motore con la formula in chiaro, la lista dei codici davvero completa, fonti con estremi (L. 4/1953, art. 39 D.L. 112/2008, D.M. 9/7/2008 - da riverificare su Normattiva), data di aggiornamento visibile e FAQ. Factorial ha i cedolini annotati ma sono placeholder SVG rotti: il nostro deve funzionare.",
    note="Articolo piu lungo del piano (2.000-2.500 parole). Le norme citate dai concorrenti NON sono verificate: controllarle su Normattiva prima di riusarle. Se /busta-paga.html e ancora 404, CTA sul calcolatore.",
    paa="Busta paga spiegazione voci; Come leggere la busta paga INAIL; Come leggere una busta paga pdf; Codici busta paga pdf; Come leggere la busta paga ferie e permessi")

add(g=2, titolo="Taglio IRPEF: cosa cambia davvero sul tuo netto, con il conto a confronto",
    slug="taglio-irpef-effetto-sul-netto", q="taglio irpef",
    q2="taglio irpef 2026", vol=14800, kd=0, cluster="IRPEF e manovra", tipo="Stagionale",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Ottobre", prio="Alta", diff="Media", aio=None,
    angolo="A ottobre 'taglio irpef' passa da 14.800 a 74.000: e il mese della legge di bilancio, la gente chiede a ottobre cosa succedera l'anno dopo. Sulla SERP controllata di 'taglio irpef 2026' ci sono DynamicaRetail, FunniFin, Sole 24 Ore, Corriere, Ipsoa e NESSUNA Agenzia delle Entrate: aggredibile. Tutti spiegano la norma a parole. Noi diamo la tabella: a parita di profilo, quanto cambia il netto a 20k, 25k, 30k, 35k, 40k, 50k di RAL, calcolato dal motore, con il delta in euro al mese.",
    note="Invecchia in settimane: segnare in tabella come da rivedere a ogni passaggio parlamentare. Dichiarare la data del testo su cui e calcolato.")

add(g=3, titolo="Il netto e sceso rispetto al mese scorso: le cause, una per una, con il conto",
    slug="netto-piu-basso-del-mese-scorso", q="troppe trattenute in busta paga",
    q2="perche ho tante trattenute in busta paga; trattenute sulla busta paga",
    vol=390, kd=0, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Gennaio", prio="Alta", diff="Bassa", aio=True,
    angolo="Il format /controllo/{sintomo} e l'idea migliore di BustaIA e l'hanno lasciato a 680 parole senza un numero ne una fonte. Questo e il cluster piu difendibile di tutti: nessun occupante della SERP ha un motore di calcolo in pagina, e nessuno ha incentivo a costruirlo perche monetizza altrove (SaaS alle aziende). Struttura: le cinque cause piu frequenti - conguaglio, fine detrazione, scaglione superato, giorni di assenza, premio una tantum del mese prima - ognuna con il conto rifatto su un caso concreto e quanto spiega del delta. Sopravvive all'AI Overview perche la risposta dipende dai numeri di chi legge.",
    note="Mai dire che il cedolino e sbagliato. Formula: 'potrebbe valere la pena verificare'.",
    paa="Perche ci sono tante trattenute in busta paga?; Quante trattenute ci sono in uno stipendio?; Qual e la differenza tra ritenute e trattenute?; Come abbassare le trattenute in busta paga; Le trattenute in busta paga vengono restituite")

add(g=4, titolo="Tredicesima detassata: cosa significa e quanto vale in euro nel tuo caso",
    slug="tredicesima-detassata", q="tredicesima detassata",
    q2="detassazione tredicesima", vol=8100, kd=0, cluster="Tredicesima", tipo="Stagionale",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Ottobre", prio="Alta", diff="Media", aio=None,
    angolo="A ottobre fa 74.000 contro una media di 8.100: fattore 9, ed e il primo picco della finestra. Va online subito. La domanda vera sotto la query non e 'cos'e la detassazione' ma 'a me quanto arriva in piu'. Tabella per fascia di RAL con il netto della tredicesima nei due scenari, e la riga che nessuno scrive: per chi NON cambia nulla e perche.",
    note="Verificare se la detassazione e in vigore, in discussione o solo annunciata, e dirlo in chiaro. Se e una proposta, il pezzo lo dichiara nel primo paragrafo.")

add(g=5, titolo="Esempio di busta paga: un cedolino vero, spiegato importo per importo",
    slug="esempio-busta-paga", q="esempio busta paga",
    q2="busta paga esempio; esempio di busta paga", vol=1600, kd=None,
    cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco="Gennaio", prio="Alta", diff="Bassa", aio=None,
    angolo="Il cluster degli esempi e l'unico che regge il trend (-23% contro -47% delle query esplicative): chi chiede un ARTEFATTO continua a cliccare, chi chiede una spiegazione se la fa dare dall'AI Overview. Un esempio e un artefatto: l'AI puo riassumerlo, non sostituirlo. Cedolino completo per un caso dichiarato (dipendente privato, RAL nota, Milano, 13 mensilita), ogni voce con importo calcolato dal motore, la riconciliazione competenze - trattenute = netto che torna, e il link a ogni caso particolare del cluster.",
    note="E l'hub del cluster esempi: da qui partono i link agli altri 12 casi. Costruirlo per primo.")

add(g=6, titolo="Tassazione della tredicesima: perche e piu bassa di quanto ti aspetti",
    slug="tassazione-tredicesima", q="tassazione tredicesima",
    q2="tredicesima tassata di piu", vol=6600, kd=0, cluster="Tredicesima", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Ottobre", prio="Alta", diff="Media", aio=True,
    angolo="Q4 x3,30, picco a ottobre a 49.500. ATTENZIONE: SERP controllata, c'e FiscoeTasse, la CISL e BUSTAIA IN POSIZIONE 3 - e l'unica query del piano dove il concorrente diretto e gia davanti con il nostro stesso posizionamento. Si entra solo con il conto: la tredicesima non ha detrazioni da lavoro dipendente, ed e questo che la fa sembrare piu tassata. Mostrarlo numericamente sullo stesso profilo, mese ordinario contro mese di tredicesima, riga per riga.",
    note="L'unica query dove BustaIA e davanti. Se dopo 8 settimane non si muove, non insistere: cambiare angolo invece di riscrivere.")

add(g=7, titolo="Contributo IVS in busta paga: cos'e quel 9,19% e su cosa si calcola",
    slug="contributo-ivs-busta-paga", q="contributo ivs in busta paga",
    q2="contributi ivs busta paga; busta paga contributo ivs", vol=2400, kd=None,
    cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Luglio", prio="Alta", diff="Bassa", aio=None,
    angolo="Sigla incomprensibile su cui l'intento e problema/sintomo: chi cerca ha visto una trattenuta grossa e non sa cos'e. Taglio obbligatorio del cluster: MAI 'cos'e', sempre 'dove sta nel tuo PDF e come lo verifichi'. Qui abbiamo un vantaggio raro: l'aliquota 9,19% e gia nel catalogo fonti verificate (INPS circ. 101/2024), e il motore sa rifare il conto sull'imponibile. Mostrare il calcolo inverso: dall'importo trattenuto risalire all'imponibile e verificare che torni.",
    note="Dichiarare che il 9,19% vale per FPLD ordinario e NON per ogni dipendente privato: settore, inquadramento e dimensione del datore cambiano la contribuzione.")

add(g=8, titolo="Esempio di busta paga con malattia: quanto ti paga l'INPS e quanto il datore",
    slug="esempio-busta-paga-malattia", q="esempio busta paga con malattia",
    q2="carenza malattia busta paga", vol=1900, kd=0, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco="Gennaio", prio="Alta", diff="Bassa", aio=None,
    angolo="1.900 di volume, KD 0, BustaIA non posizionata, nessuno presidia. Il format vincente e quello di Skello (posizione 1 con backlink rank piu basso di Factorial): esempio lavorato in tabella, simulatore funzionante, fonti con estremi, data visibile, FAQ a 9 domande. Applicarlo qui. Il pezzo mostra i giorni di carenza non pagati, la quota INPS, l'integrazione del datore secondo CCNL, e perche il netto del mese scende meno (o piu) di quanto ci si aspetta.",
    note="La quota di integrazione dipende dal CCNL: dichiarare quale si usa nell'esempio e che altri CCNL fanno diversamente.")

add(g=9, titolo="Detassazione degli straordinari: cosa cambia sull'ora in piu",
    slug="detassazione-straordinari", q="tassazione straordinari",
    q2="detassazione straordinari; detassazione straordinari 2026; tassazione straordinario",
    vol=2400, kd=0, cluster="Straordinari", tipo="Stagionale",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco="Ottobre", prio="Alta", diff="Bassa", aio=None,
    angolo="Cluster piccolo tutto l'anno che a ottobre raddoppia (8.100) per lo stesso motivo del taglio IRPEF: e in manovra. BustaIA e in posizione 40-50 con un articolo generico. Il pezzo risponde alla sola domanda che conta: un'ora di straordinario, quanto ti resta in tasca? Tabella con maggiorazione contrattuale, imponibile, prelievo e netto orario effettivo, a due o tre fasce di RAL.",
    note="Legare alla manovra in corso e datare. Se la detassazione e solo annunciata, dirlo.")

add(g=10, titolo="TFR: come si calcola davvero, e come verificare l'accantonamento in busta paga",
    slug="come-si-calcola-il-tfr", q="tfr come calcolarlo",
    q2="calcolatore tfr; calcolo tfr; tfr come calcolare; come funziona il tfr",
    vol=12100, kd=0, cluster="TFR", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco="Ottobre", prio="Alta", diff="Media", aio=None,
    angolo="Picco a ottobre (18.100), KD 0, intento di calcolo puro. ATTENZIONE: 'tfr come calcolarlo' e 'calcolatore tfr' valgono 12.100 ciascuna e sono LA STESSA RICERCA - un solo articolo, non due. Skello vince questa famiglia con un esempio lavorato (RAL 28.000, 5 anni, TFR 10.554 euro) + simulatore + art. 2120 c.c., L. 297/1982, artt. 17-19 TUIR + data di aggiornamento. Si batte solo facendo lo stesso meglio: quota annua, rivalutazione, tassazione separata, e come leggere la riga dell'accantonamento sul proprio cedolino.",
    note="Le norme citate da Skello vanno riverificate su Normattiva prima di riusarle. La rivalutazione richiede l'indice ISTAT: citare fonte e data.")

add(g=11, titolo="Gli straordinari non ci sono in busta paga: dove cercarli e come verificarli",
    slug="straordinari-non-pagati-busta-paga", q="straordinari non pagati busta paga",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Uno dei quattro sintomi che BustaIA ha scelto per le sue /controllo/, il che conferma che la domanda esiste anche dove il volume esatto non e stato misurato. Il pezzo insegna a distinguere i tre casi che la gente confonde: ore non retribuite, ore retribuite come ordinarie senza maggiorazione, e ore convertite in banca ore o ROL. Per ognuno: dove guardare nel PDF, che numero deve tornare, e il conto della maggiorazione dovuta.",
    note="Volume non misurato: e una scommessa motivata dal format del concorrente, non dal dato. Segnata come Media, non Alta.")

add(g=12, titolo="Quanto vale davvero un'ora del tuo lavoro, al netto",
    slug="quanto-vale-un-ora-di-lavoro-netta", q="calcolo ral da busta paga",
    q2="calcolatore busta paga; calcolare busta paga", vol=390, kd=None,
    cluster="Strumenti", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Percorso inverso: dal cedolino alla RAL, e dalla RAL al valore netto di un'ora. Utile per chi valuta straordinari, part-time o un cambio di lavoro. BustaIA e oltre l'80a posizione dove c'e. Ogni pagina di questo cluster deve essere uno strumento vero, non un articolo che descrive uno strumento.",
    note="Dichiarare che il valore orario netto non e lineare: dipende dallo scaglione marginale.")

add(g=13, titolo="Esempio di busta paga con liquidazione del TFR",
    slug="esempio-busta-paga-liquidazione-tfr", q="esempio busta paga liquidazione tfr",
    q2="busta paga tfr; tfr in busta paga", vol=1900, kd=0,
    cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Alta", diff="Bassa", aio=True,
    angolo="BustaIA e in posizione 40 con un articolo generico sul TFR, non con un esempio. 'tfr in busta paga' vale 5.400 con KD 0 e BustaIA non e posizionata affatto. L'ultimo cedolino e il documento che la gente controlla con piu ansia e meno strumenti. Mostrare il cedolino di fine rapporto completo: ultime competenze, ratei di tredicesima e ferie non godute, TFR con la sua tassazione separata, e la riconciliazione finale.",
    note="Distinguere nettamente tassazione separata del TFR da IRPEF ordinaria: e l'errore piu comune nei contenuti concorrenti.",
    paa="Quando viene pagato il TFR in busta paga?; Come faccio a sapere quanto e il mio TFR?; Perche sulla busta paga non c'e il TFR?; Quanto e l'importo netto di un TFR di 10.000 euro?")

add(g=14, titolo="Voci della busta paga: il dizionario delle diciture, con dove trovarle",
    slug="voci-busta-paga", q="voci busta paga",
    q2="busta paga spiegazione voci; voci busta paga codici; codici busta paga",
    vol=320, kd=None, cluster="Voce per voce", tipo="Pilastro",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Alta", diff="Media", aio=None,
    angolo="Zeta Service e primo su questa query con 3.500 parole senza un numero, senza data e senza consegnare la lista che promette. GioIA ha provato il glossario ed e a posizione 37-103: il glossario da solo non basta. Funziona solo se ogni voce ha un esempio numerico e la posizione nel PDF. Questa pagina e l'hub: elenco navigabile delle diciture piu frequenti, ognuna con dove compare, cosa muove (lordo, netto, niente) e link alla pagina dedicata del cluster voce-per-voce.",
    note="Hub del cluster voce-per-voce: i 12 pezzi successivi linkano qui e da qui. Volume della singola query basso, ma raccoglie l'intero cluster.")


# =====================================================================
# BLOCCO 2 — giorni 15-45 · OTTOBRE
# Si pubblica cio che esplode a NOVEMBRE (tredicesima-anticipazione,
# rinnovi CCNL) e si costruisce il corpo evergreen: sintomi ed esempi.
# =====================================================================

add(g=15, titolo="Tredicesima: quanto ti arrivera, calcolato sul tuo caso",
    slug="tredicesima-mensilita-quanto-arriva", q="tredicesima mensilita",
    q2="cos'e la tredicesima", vol=8100, kd=0, cluster="Tredicesima", tipo="Stagionale",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco="Novembre", prio="Alta", diff="Media", aio=None,
    angolo="Indice Q4 x3,83, il piu alto fra le keyword sopra 5.000: a novembre passa da 8.100 a 60.500. Momento psicologico preciso: a novembre la tredicesima e ANTICIPAZIONE ('quanto mi arrivera'), a dicembre diventa ATTESA ('quando arriva'). Sono due articoli diversi e vanno serviti separati. Questo e quello di novembre: la formula dei ratei, il caso di chi non ha lavorato l'anno intero, e la tabella netto per fascia di RAL.",
    note="Non fondere con il pezzo di dicembre 'quando arriva la tredicesima': sono intenti distinti. Linkarli reciprocamente.")

add(g=16, titolo="Il ROL in busta paga: dove sta, quante ore ti spettano e quanto valgono",
    slug="rol-in-busta-paga", q="rol busta paga",
    q2="cosa sono i rol in busta paga; rol busta paga cosa sono; rol ap busta paga",
    vol=1300, kd=0, cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Marzo", prio="Media", diff="Alta", aio=True,
    angolo="CAVEAT FORTE: la SERP ha un AI Overview lungo e completo che cita Indeed, Randstad, Gi Group, Jet HR, Coverflex, TikTok e YouTube. La definizione e gia data sopra il fold: scrivere la ventesima definizione di ROL e tempo buttato. Cio che l'AI Overview NON fa: dire dove sta la voce nel PDF, quante ore maturi col tuo CCNL, quanto valgono in euro, e cosa fare se il saldo non torna. Solo quel taglio. Dipendenti in Cloud e primo senza fonti, senza data, senza FAQ e senza calcolo.",
    note="Mai formato 'cos'e'. Se il pezzo apre con una definizione, e sbagliato e va riscritto.",
    paa="Che differenza c'e tra rol e permessi?; Che fine fanno i rol non goduti?; Quante ore di rol si accumulano al mese?; Quanto viene pagata un'ora di rol?; Quali scadono prima, i ROL o le ferie?")

add(g=17, titolo="Ho pagato piu tasse di quelle che mi aspettavo: le quattro spiegazioni possibili",
    slug="ho-pagato-piu-tasse-del-previsto", q="trattenute fiscali busta paga",
    q2="trattenute irpef busta paga", vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Alta", diff="Bassa", aio=None,
    angolo="Il pezzo-sintomo sul lato fiscale. Quattro cause con il conto: scaglione superato nel mese (premio, straordinari, arretrati), detrazione che si e esaurita per capienza, addizionali che partono in un mese preciso dell'anno, conguaglio. Per ognuna un esempio numerico dal motore che mostra di quanto sposta il netto. E il concetto di capienza spiegato come si deve: a IRPEF lorda 400 euro una detrazione da 1.955 entra per 400, non per 1.955.",
    note="Capienza e nel glossario del progetto (CONTEXT.md): usare quella definizione, non inventarne un'altra.")

add(g=18, titolo="Esempio di busta paga part-time: come cambiano le voci con le ore ridotte",
    slug="esempio-busta-paga-part-time", q="esempio busta paga part time",
    q2="stipendio part-time 20 ore netto", vol=320, kd=0,
    cluster="Esempi per casistica", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco=None, prio="Media", diff="Media", aio=None,
    angolo="Unica casistica delle sette dove c'e gia un presidio: GioIA e in posizione 5, e su 'esempio busta paga part time' e primo uno studio di consulenti con backlink rank 203 - prova che qui si vince col contenuto, non coi link. Il part-time e anche una lacuna del lato RAL (nessun competitor con contenuto dedicato). Mostrare come la percentuale part-time si applica alle voci, e che non tutto scala linearmente.",
    note="Le sole ore non determinano uno stipendio: serve la base contrattuale. Dichiararlo.")

add(g=19, titolo="Rinnovo del CCNL metalmeccanici: cosa arriva in busta paga e quando",
    slug="rinnovo-ccnl-metalmeccanici", q="rinnovo ccnl metalmeccanici",
    q2="aumento metalmeccanici; metalmeccanico ccnl", vol=6600, kd=0,
    cluster="CCNL e rinnovi", tipo="Stagionale",
    prod="CCNL", cta="/ccnl-livello.html", intento="Informazionale",
    picco="Novembre", prio="Alta", diff="Media", aio=None,
    angolo="Q4 x2,60, picco a novembre a 27.100. Novembre e il mese dei rinnovi. Qui c'e un vantaggio strutturale: il generatore CCNL del sito copre gia Metalmeccanica industria (C011) e sa comporre la RAL da livello, scatti, orario e superminimo. Il pezzo puo mostrare, per ogni livello, l'aumento lordo tabellare E il corrispondente aumento netto - che e il numero che interessa e che nessuno pubblica.",
    note="Il minimo tabellare cambia a ogni rinnovo: e contenuto ad alta manutenzione. Segnare la decorrenza usata e la data di verifica delle fonti CCNL.")

add(g=20, titolo="Esempio di busta paga con infortunio: chi paga cosa dal primo giorno",
    slug="esempio-busta-paga-infortunio", q="esempio busta paga con infortunio",
    q2=None, vol=1300, kd=0, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Alta", diff="Bassa", aio=None,
    angolo="1.300, KD 0, nessuno presidia. Caso in cui la busta paga diventa illeggibile: indennita INAIL, integrazione del datore, giorni a carico di chi. Applicare il format Skello. La related search 'Come leggere la busta paga INAIL' conferma che la gente cerca esattamente questo e non trova risposta.",
    note="Distinguere infortunio (INAIL) da malattia (INPS): e la confusione piu frequente.")

add(g=21, titolo="EDR in busta paga: cos'e quella voce da 10,33 euro",
    slug="edr-in-busta-paga", q="edr in busta paga",
    q2=None, vol=1300, kd=0, cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Maggio", prio="Media", diff="Bassa", aio=None,
    angolo="BustaIA e in posizione 58. Factorial dedica a questa voce l'unico importo numerico di tutta la sua pagina da 4.500 parole (10,33 euro) - segno che e la cosa che la gente cerca davvero. Noi possiamo fare molto meglio: da dove viene quella cifra, perche e ferma da decenni, su quali mensilita si paga e quanto incide sul netto annuo. Taglio 'dove sta nel PDF', mai definizione.",
    note="Verificare l'importo e la fonte (accordo interconfederale) prima di pubblicare: non copiarlo da Factorial.")

add(g=22, titolo="Le ferie in busta paga sono in ore o in giorni? Come leggere il saldo",
    slug="ferie-busta-paga-ore-o-giorni", q="le ferie in busta paga sono in ore o giorni",
    q2="saldo ferie in busta paga cosa significa; ferie ap significato; ferie godute ap significato",
    vol=480, kd=None, cluster="Ferie e permessi", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Le sigle del blocco ferie - AP (anno precedente), MAT, residuo - sono fra le cose meno spiegate del cedolino e hanno volume confermato. Il pezzo e una mappa: dove sta il blocco ferie, come si leggono maturato/goduto/residuo, perche AP e separato dall'anno corrente, e come si converte fra ore e giorni con il proprio orario contrattuale.",
    note="NOTA DI STAGIONE: il picco del tema ferie NON e a dicembre ma a marzo-luglio, perche la scadenza che genera domanda e il 30 giugno (18 mesi), non il 31 dicembre. In finestra vale meno di quanto sembri: tenerlo, ma non moltiplicarlo.")

add(g=23, titolo="Il conguaglio in busta paga, spiegato con il conto rifatto",
    slug="conguaglio-in-busta-paga", q="conguaglio in busta paga",
    q2="conguaglio busta paga; conguaglio busta paga come si calcola", vol=2400, kd=0,
    cluster="Conguaglio", tipo="Pilastro",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Gennaio", prio="Alta", diff="Bassa", aio=True,
    angolo="La SERP piu debole osservata in tutta la ricerca: Pictet, 4Stars, studi di consulenti locali (Studio Signore, Campagnoli, Carafa, Graber), un PDF NoiPA e UN POST FACEBOOK DELLA UILM BASILICATA IN POSIZIONE 5-6. BustaIA ha un pezzo con ETV 2,1 e non e in top 20 su nessuna variante. Nove PAA disponibili. E il miglior rapporto sforzo/risultato del piano. Il pezzo rifa il conguaglio: imposta dovuta sull'anno, imposta gia trattenuta mese per mese, differenza, e perche puo essere a credito o a debito.",
    note="Pubblicato ora per raccogliere il picco di gennaio (2.400 contro 1.000 di dicembre). Hub del cluster conguaglio.",
    paa="Come evitare il conguaglio a debito?; In che mese si prende il conguaglio?; Come si fa il calcolo del conguaglio?; In quale busta paga viene fatto il conguaglio?; Il datore di lavoro e obbligato a fare il conguaglio fiscale?")

add(g=24, titolo="Mi hanno dato un premio e il netto e cresciuto meno del lordo",
    slug="premio-netto-cresciuto-meno-del-lordo", q="premio di risultato busta paga",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Calcolatore RAL", cta="/", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Sintomo classico e mai spiegato coi numeri: un importo una tantum entra tutto nello scaglione marginale del mese, e puo far perdere capienza a una detrazione. Il motore permette di mostrare il delta esatto fra lordo aggiunto e netto ottenuto su tre fasce di RAL. E anche l'occasione per spiegare i 'salti' - le sette discontinuita in cui il netto scende mentre il lordo sale - che sono un asset documentato del progetto e che nessun concorrente ha.",
    note="I sette salti vanno riconfermati sul profilo scelto prima di pubblicarli: il numero non va promesso come universale (cfr. strategia-seo.md).")

add(g=25, titolo="Esempio di busta paga con pignoramento: cosa si vede e cosa resta",
    slug="esempio-busta-paga-pignoramento", q="esempio busta paga con pignoramento",
    q2="cessione del quinto busta paga", vol=880, kd=0,
    cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Alta", diff="Bassa", aio=None,
    angolo="880 di volume, KD 0, nessuno presidia. E uno dei due casi (con la cessione del quinto) in cui il cedolino e un documento imbarazzante: qui la non conservazione non e un claim di marketing, e il motivo per cui uno sceglie noi invece di caricare il PDF su un sito che chiede un account. Alzare il volume sul blocco 'cosa succede al tuo cedolino' e renderlo dimostrabile: apri la scheda Rete, il PDF non parte.",
    note="Trattare con rispetto: niente tono leggero. Nessun giudizio su chi ha un pignoramento in corso.")

add(g=26, titolo="Superminimo in busta paga: cos'e e perche puo sparire",
    slug="superminimo-in-busta-paga", q="superminimo in busta paga",
    q2=None, vol=1300, kd=0, cluster="Voce per voce", tipo="Risposta",
    prod="CCNL", cta="/ccnl-livello.html", intento="Sintomo/problema",
    picco="Febbraio", prio="Media", diff="Bassa", aio=None,
    angolo="Voce che la gente non capisce e teme di perdere - l'assorbimento in caso di rinnovo o passaggio di livello e la paura vera sotto la query. Vantaggio nostro: il generatore CCNL compone gia la RAL includendo il superminimo, quindi possiamo mostrare numericamente cosa succede al netto quando il superminimo viene assorbito da un aumento tabellare.",
    note="L'assorbibilita dipende da contratto individuale e CCNL: non generalizzare.")

add(g=27, titolo="Trasferta in busta paga: indennita, rimborsi e cosa e tassato",
    slug="trasferta-in-busta-paga", q="trasferta italia busta paga",
    q2="indennita di trasferta busta paga", vol=880, kd=0, cluster="Straordinari", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="880 su quattro varianti, KD 0, scoperto. La confusione vera e fra indennita forfettaria (imponibile entro soglie), rimborso analitico (esente se documentato) e rimborso misto. Il pezzo mostra le tre forme sullo stesso viaggio e quanto resta netto in ciascuna.",
    note="Le soglie di esenzione hanno estremi normativi precisi: citarli con data di verifica.")

add(g=28, titolo="Esempio di busta paga con contratto a chiamata",
    slug="esempio-busta-paga-contratto-a-chiamata", q="esempio busta paga contratto a chiamata",
    q2=None, vol=880, kd=0, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="880, KD 0, scoperto. Il lavoro intermittente ha un cedolino che non somiglia a nessun altro: ore effettive, eventuale indennita di disponibilita, ratei proporzionali. Chi ha questo contratto ha anche meno accesso a un consulente. Format Skello.",
    note="Il motore assume un rapporto a tempo pieno annuo: dichiarare esplicitamente che qui il calcolo e ricostruito sulle ore effettive e non uscito dal calcolatore standard.")

add(g=29, titolo="Ex festivita in busta paga: quelle quattro ore che non sai di avere",
    slug="ex-festivita-busta-paga", q="ex festivita busta paga",
    q2=None, vol=720, kd=0, cluster="Ferie e permessi", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Bassa", diff="Bassa", aio=None,
    angolo="720, KD 0, scoperto. Voce residuale di cui quasi nessuno conosce l'origine storica (le festivita civili abolite) e che compare come monte ore o come importo. Taglio operativo: dove compare, quante ne hai, e come si monetizzano se non le usi.",
    note=None)

add(g=30, titolo="Contingenza in busta paga: la voce ferma dal 1991",
    slug="contingenza-in-busta-paga", q="cos'e la contingenza in busta paga",
    q2="contingenza in busta paga; busta paga contingenza; contingenze busta paga",
    vol=590, kd=0, cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Marzo", prio="Media", diff="Bassa", aio=None,
    angolo="Le varianti valgono insieme circa 1.900-4.400 (non sommabili automaticamente) e BustaIA e a posizione 49-58 col solo glossario. Voce storica che nessuno spiega bene: da dove viene, perche e congelata, e soprattutto che peso ha ancora oggi sul minimo tabellare e quindi sul netto. Qui il motore CCNL puo mostrare quanto pesa in un caso reale.",
    note=None)

add(g=31, titolo="Controllare la busta paga da soli: la procedura in sette verifiche",
    slug="controllare-la-busta-paga", q="controllare la busta paga",
    q2="come verificare se la busta paga e corretta; controllo buste paga", vol=480, kd=0,
    cluster="Sintomi", tipo="Pilastro",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Alta", diff="Alta", aio=True,
    angolo="ATTENZIONE STRATEGICA: la query commerciale vicina, 'controllo busta paga online gratis', e gia persa - BustaIA e in posizione 2 ED e il brand citato dentro l'AI Overview. Non ci si schianta contro. Si entra dal lato informativo: non 'quale servizio uso' ma 'come lo faccio io, passo per passo'. Sette verifiche in ordine, ognuna con il numero che deve tornare e cosa significa se non torna. In fondo, e solo in fondo, lo strumento.",
    note="Non attaccare frontalmente la query commerciale. Se il pezzo suona come una landing di prodotto, ha sbagliato bersaglio.",
    paa="Come faccio a verificare se la mia busta paga e corretta?; Dove posso far controllare le mie buste paga?; Quanto costa far controllare le buste paga al CAF?; Qual e la migliore app per controllare le buste paga?")

add(g=32, titolo="Contributo FAP in busta paga: cos'e e chi lo paga",
    slug="contributo-fap-busta-paga", q="contributo fap in busta paga",
    q2=None, vol=1000, kd=None, cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="1.000 di volume, BustaIA in posizione 42. Sigla opaca: chi la cerca l'ha vista come trattenuta e vuole sapere se e dovuta. Taglio 'dove sta e come si verifica', con il conto dell'incidenza sul netto annuo.",
    note="Verificare a quale fondo si riferisce nel contesto piu frequente prima di scrivere: FAP non e univoco.")

add(g=33, titolo="Buoni pasto in busta paga: quanto sono esenti e quanto no",
    slug="buoni-pasto-busta-paga", q="buoni pasto 10 euro",
    q2="buoni pasto busta paga", vol=3600, kd=None, cluster="Benefit e welfare", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Ottobre", prio="Media", diff="Media", aio=None,
    angolo="Picco a ottobre (14.800 contro 3.600 di media), sempre per effetto manovra. ATTENZIONE: 'buoni pasto' generico ha KD 38, il secondo piu alto del dataset - preferire le varianti long-tail. Vantaggio nostro: il calcolatore gestisce gia i buoni pasto e le soglie di esenzione (4 euro cartacei, 8 elettronici, TUIR art. 51 c. 2 lett. c, gia nel catalogo fonti). Mostrare l'effetto reale sul pacchetto annuo.",
    note="La soglia e per titolo, non al mese: e l'errore piu comune. Verificare gli importi vigenti prima di pubblicare.")

add(g=34, titolo="Esempio di busta paga del primo mese di lavoro",
    slug="esempio-busta-paga-primo-mese", q="prima busta paga",
    q2=None, vol=None, kd=None, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Il primo cedolino e il momento in cui una persona incontra per la prima volta la distanza fra RAL promessa e soldi sul conto. Ratei parziali, detrazioni rapportate ai giorni, nessun progressivo da confrontare. E anche il momento di massima predisposizione a usare un calcolatore.",
    note="Volume non misurato: scommessa sul momento di vita, non sul dato. Priorita Media.")

add(g=35, titolo="Assenze e permessi: perche una giornata in meno costa piu di un trentesimo",
    slug="quanto-costa-un-giorno-di-assenza", q="permessi non retribuiti busta paga",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Sintomo con un conto controintuitivo: il divisore contrattuale non e sempre 26 o 30, e la stessa assenza incide diversamente su retribuzione, ratei e contributi. Mostrare il calcolo completo su un caso, e il confronto fra permesso retribuito, non retribuito e ROL.",
    note="Il divisore dipende dal CCNL: dichiarare quale si usa.")

add(g=36, titolo="Addizionale regionale e comunale: perche compaiono solo in certi mesi",
    slug="addizionali-regionale-comunale-busta-paga", q="addizionale comunale busta paga",
    q2="addizionale regionale busta paga", vol=None, kd=None, cluster="Voce per voce", tipo="Risposta",
    prod="Calcolatore RAL", cta="/", intento="Sintomo/problema",
    picco=None, prio="Alta", diff="Bassa", aio=None,
    angolo="Causa frequentissima del sintomo 'il netto e sceso' e quasi mai spiegata bene: saldo dell'anno precedente e acconto dell'anno in corso, rateizzati su mesi diversi. Qui il progetto ha un asset raro: i dati delle addizionali per comune sono gia nel motore, con le fonti (Regione Lombardia, Comune di Milano nel catalogo). Possiamo mostrare quanto cambia il netto a parita di RAL cambiando comune - cosa che nessun concorrente fa.",
    note="Collegare alle pagine RAL esistenti, che dichiarano Milano come ipotesi.")

add(g=37, titolo="Esempio di busta paga con maternita",
    slug="esempio-busta-paga-maternita", q="busta paga maternita",
    q2="maternita facoltativa busta paga", vol=None, kd=None,
    cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Media", diff="Media", aio=None,
    angolo="Casistica non presidiata da BustaIA. Indennita INPS, eventuale integrazione del datore, effetto su ratei e TFR. Il cedolino in maternita e uno di quelli che genera piu domande e meno risposte numeriche.",
    note="Terreno sensibile e con regole che variano per CCNL: prudenza, limiti dichiarati, nessuna promessa di completezza.")

add(g=38, titolo="Residuo AP in busta paga: cosa vuol dire quella sigla accanto alle ferie",
    slug="residuo-ap-busta-paga", q="busta paga residuo ap",
    q2="ferie ap significato; ferie mat significato", vol=590, kd=None,
    cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="590 confermato, KD non disponibile. Sigla pura, intento chiarissimo: uno vede 'AP' e non sa se sono ferie che perdera. Risposta secca in apertura (anno precedente), poi cosa succede a quel residuo e la scadenza dei 18 mesi.",
    note="La scadenza dei 18 mesi e il vero motivo della ricerca: metterla in evidenza, con la fonte.")

add(g=39, titolo="Indennita legge 207/24 in busta paga: cos'e quella riga nuova",
    slug="indennita-legge-207-24-busta-paga", q="indennita l. 207/24 in busta paga",
    q2=None, vol=590, kd=0, cluster="IRPEF e manovra", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Alta", diff="Bassa", aio=None,
    angolo="590 di volume su normativa recente SU CUI NESSUNO HA ANCORA SCRITTO BENE. La lezione di Cedolingo e che due soli articoli di attualita normativa reggono praticamente tutto il suo traffico: un pezzo azzeccato di normativa fresca vale venti evergreen. Vantaggio diretto: la L. 207/2024 e gia nel catalogo fonti del progetto (art. 1 c. 4-5 e c. 6), quindi il conto e gia verificato.",
    note="Slot di normativa fresca. Tenerne uno a settimana libero per queste occasioni.")

add(g=40, titolo="Bonus benzina in busta paga: quando c'e e quanto vale netto",
    slug="bonus-benzina-busta-paga", q="bonus benzina busta paga",
    q2="fringe benefit busta paga", vol=5400, kd=None, cluster="Benefit e welfare", tipo="Risposta",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco=None, prio="Alta", diff="Media", aio=None,
    angolo="5.400 di volume e BustaIA NON e posizionata. Il calcolatore gestisce gia fringe benefit e soglie (L. 207/2024 art. 1 c. 390-391: 1.000 euro, 2.000 con figli a carico, gia nel catalogo fonti). Il punto che nessuno spiega: superata la soglia diventa imponibile TUTTO il valore, non l'eccedenza. Quel salto vale centinaia di euro e va mostrato col conto.",
    note="Verificare la vigenza della soglia per l'anno in corso prima di pubblicare.")

add(g=41, titolo="Quanto costi davvero alla tua azienda, e perche non e il tuo lordo",
    slug="costo-azienda-dipendente", q="quanto costa un dipendente all'azienda",
    q2="costo azienda dipendente", vol=None, kd=None, cluster="Strumenti", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco=None, prio="Media", diff="Media", aio=None,
    angolo="Emerge dalle PAA di 'ral 30000 stipendio netto' ('Quanto costa all'azienda un dipendente con RAL di 30.000 euro?') e di '1500 euro lordi' ('Quanto costa un dipendente che prende 1500 euro netti?'): la domanda c'e, formulata dalle persone. E anche uno dei ticket aperti del progetto. Utile in fase di trattativa salariale.",
    note="Il costo azienda NON e ancora nel motore: se non c'e, il pezzo dichiara le componenti e i limiti invece di inventare un numero. Verificare prima di assegnare la giornata.")

add(g=42, titolo="Esempio di busta paga con cessione del quinto",
    slug="esempio-busta-paga-cessione-del-quinto", q="cessione del quinto busta paga",
    q2=None, vol=None, kd=5, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Una delle due sole keyword del territorio con KD diverso da 0 (KD 5). Secondo caso in cui il cedolino e imbarazzante: qui la non conservazione pesa. Mostrare come si legge la trattenuta, su quale base si calcola il quinto (netto, non lordo) e come verificare che il limite sia rispettato.",
    note="Nessun tono di giudizio. Il quinto si calcola sul netto: e l'errore piu comune.")

add(g=43, titolo="Codici della busta paga: come si decifrano, con la lista",
    slug="codici-busta-paga", q="codici busta paga",
    q2="voci busta paga codici; codice ccnl in busta paga", vol=260, kd=None,
    cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Media", aio=None,
    angolo="Zeta Service e primo su 'codici busta paga' e la lista che promette nel titolo NON LA DA. E la promessa non mantenuta piu evidente trovata in tutta la ricerca. Noi la diamo: lista navigabile dei codici ricorrenti con significato, effetto sul netto e dove compaiono. Related search 'Codici busta paga pdf' conferma che la gente vuole un artefatto scaricabile.",
    note="I codici non sono standardizzati fra software di paghe: dichiararlo subito, e dire che la lista copre i piu frequenti, non tutti.")

add(g=44, titolo="Ferie non godute: quanto vengono pagate e quando si perdono",
    slug="ferie-non-godute", q="ferie non godute",
    q2="ferie non godute quanto vengono pagate; ferie non godute dopo 18 mesi", vol=1900, kd=0,
    cluster="Ferie e permessi", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco="Marzo", prio="Media", diff="Media", aio=True,
    angolo="SERP controllata: Dipendenti in Cloud, Lavoroso, Ali Lavoro, Randstad, Moltocomuni - TUTTA B2B, taglio 'obblighi del datore di lavoro'. Spazio libero dal lato del lavoratore: quanto vale in euro una giornata di ferie non goduta sul tuo cedolino, e cosa succede davvero dopo 18 mesi. Questo e l'angolo.",
    note="Il picco e a marzo, non a dicembre: il pezzo va bene ora ma il suo momento migliore e fuori finestra. Non moltiplicare il cluster ferie.")

add(g=45, titolo="Quanto devi chiedere di aumento per avere 200 euro netti in piu",
    slug="quanto-aumento-chiedere", q="aumento stipendio quanto chiedere",
    q2="dal netto al lordo; calcolo lordo dal netto", vol=1600, kd=5,
    cluster="Strumenti", tipo="Calcolo",
    prod="Netto→RAL", cta="/netto-ral.html", intento="Info + calcolo",
    picco=None, prio="Alta", diff="Bassa", aio=None,
    angolo="Lacuna confermata dal lato RAL: nessun competitor programmatizza il calcolo inverso, solo un tool istituzionale non ottimizzato (inaz.it) e una pagina debole su dalordoanetto.com. Jet HR presidia parzialmente 'aumento stipendio' (ETV 1.477) ma senza il conto. Il sito ha gia /netto-ral.html: questo pezzo e il suo articolo di supporto. Tabella: per ottenere +100, +200, +300 netti al mese, quanto lordo serve a diverse fasce di RAL - e perche la risposta non e lineare.",
    note="E il pezzo con l'aggancio di prodotto piu diretto di tutto il piano. Priorita Alta.")

# =====================================================================
# BLOCCO 3 — giorni 46-70 · NOVEMBRE
# Si pubblica cio che esplode a DICEMBRE. La tredicesima e il picco
# stagionale piu violento del dataset: 'quando arriva la tredicesima'
# fa 110.000 a dicembre contro 12.100 di media. Fattore 9.
# =====================================================================

add(g=46, titolo="Tredicesima: come si calcola, con il conto sul tuo caso",
    slug="tredicesima-come-si-calcola", q="tredicesima come si calcola",
    q2="come si calcola la tredicesima; come calcolare la tredicesima; calcolo della tredicesima",
    vol=8100, kd=0, cluster="Tredicesima", tipo="Stagionale",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco="Dicembre", prio="Alta", diff="Media", aio=True,
    angolo="Q4 x3,12: a dicembre fa 60.500. SERP controllata: AI Overview con la formula gia dentro, poi Gi HR, PMI.it, Namirial, Indeed. Nessun istituzionale. Siccome l'AI Overview da gia la formula, l'articolo che spiega la formula e morto. L'angolo che l'AIO non copre: il LORDO della tredicesima lo sanno calcolare tutti, il NETTO no - perche sulla tredicesima non spettano le detrazioni da lavoro dipendente. Tabella netto per fascia di RAL, calcolata dal motore.",
    note="BustaIA e in posizione 50 su questa query nonostante abbia l'articolo dedicato. Il cluster tredicesima e suo ma lo tiene male.")

add(g=47, titolo="Quando arriva la tredicesima, e cosa fare se non arriva",
    slug="quando-arriva-la-tredicesima", q="quando arriva la tredicesima",
    q2="tredicesima quando viene pagata; quando pagano la tredicesima; tredicesima quando si prende",
    vol=12100, kd=0, cluster="Tredicesima", tipo="Stagionale",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Dicembre", prio="Alta", diff="Alta", aio=None,
    angolo="IL PICCO PIU VIOLENTO DEL DATASET: 110.000 ricerche a dicembre contro una media annua di 12.100, fattore 9. Ma va puntata sapendo cos'e: SERP controllata con Randstad, Namirial, SKY TG24, NOIPA (MEF) e Idealista - a dicembre diventa news-driven, ed e una gara di freschezza contro testate giornalistiche. NoiPA in top 10 e un istituzionale. Il nostro angolo non e la data (quella la da l'AI Overview): e 'e arrivata ma e piu bassa del previsto, ecco perche' - che riporta sul nostro terreno.",
    note="Difficolta reale ALTA nonostante KD 0: si compete con Sky TG24 sulla freschezza. Pubblicare a inizio novembre e aggiornare a dicembre.")

add(g=48, titolo="Calcolatore della tredicesima: mettici i tuoi numeri",
    slug="calcolatore-tredicesima", q="calcolatore tredicesima",
    q2="calcolo tredicesima; calcolare tredicesima; simulatore calcolo tredicesima",
    vol=5400, kd=0, cluster="Tredicesima", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco="Dicembre", prio="Alta", diff="Media", aio=None,
    angolo="Intento di calcolo puro che porta dritto allo strumento: 33.100 a dicembre. Le varianti (calcolo/calcolare/calcolatore/simulatore) valgono 5.400 ciascuna e sono LA STESSA RICERCA - un solo pezzo. Deve essere uno strumento vero in pagina, non un articolo che descrive uno strumento. BustaIA e in posizione 69-86 su tutte queste varianti.",
    note="Se lo strumento non e implementabile in tempo, il pezzo diventa una tabella precalcolata per fasce di RAL e lo dichiara. Meglio una tabella vera di un calcolatore promesso.")

add(g=49, titolo="La tredicesima e piu bassa dell'anno scorso: le cause possibili",
    slug="tredicesima-piu-bassa-dello-scorso-anno", q="tredicesima piu bassa",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Dicembre", prio="Alta", diff="Bassa", aio=None,
    angolo="Pagina-sintomo stagionale, pubblicata prima del picco di dicembre. Cause con il conto: mesi non lavorati, assenze non utili al rateo, cambio di livello a meta anno, conguaglio che si mangia la tredicesima. E il ponte naturale fra il cluster tredicesima (traffico) e il prodotto busta paga (conversione).",
    note="Volume non misurato ma il momento e certo. Il ponte cluster-stagionale verso il prodotto e il punto di questo pezzo.")

add(g=50, titolo="Conguaglio a debito: perche a dicembre la busta paga si svuota",
    slug="conguaglio-a-debito", q="conguaglio a debito busta paga",
    q2="busta paga dicembre conguaglio; come evitare il conguaglio a debito", vol=480, kd=None,
    cluster="Conguaglio", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Dicembre", prio="Alta", diff="Bassa", aio=None,
    angolo="Il conguaglio si VEDE nel cedolino di dicembre ma si CERCA a gennaio: pubblicando ora si raccoglie l'onda. SERP del cluster debolissima (studi locali, un post Facebook sindacale in posizione 6). Le cause del debito - secondo lavoro, detrazioni chieste e non spettanti, familiare che ha superato il limite di reddito - vanno mostrate ognuna col conto.",
    note="Tema ansiogeno: tono asciutto, niente allarmismo, e mai dire che il datore ha sbagliato.",
    paa="Come evitare il conguaglio a debito?; Conguaglio IRPEF negativo in busta paga; Ritenute IRPEF conguaglio ultima busta paga")

add(g=51, titolo="IRPEF 2026: scaglioni, aliquote e quanto pesano sul tuo netto",
    slug="irpef-quanto-pesa-sul-netto", q="irpef 2026",
    q2="irpef", vol=14800, kd=0, cluster="IRPEF e manovra", tipo="Pilastro",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Dicembre", prio="Alta", diff="Alta", aio=None,
    angolo="ATTENZIONE: NON puntare 'scaglioni irpef 2026' o 'aliquote irpef 2026' (40.500 ciascuna, KD 0) - SERP controllata, l'Agenzia delle Entrate e in posizione 2 organica ed e citata dall'AI Overview. Chi definisce l'aliquota vince la query sulla definizione dell'aliquota: il KD 0 li mente. Si punta invece 'irpef 2026' con un angolo che l'AdE non ha: non quali sono le aliquote, ma quanto pesano in euro sul netto di una persona reale, scaglione per scaglione, con l'aliquota effettiva accanto a quella nominale.",
    note="La distinzione aliquota nominale / aliquota effettiva e il cuore del pezzo ed e gia calcolata dal motore nelle pagine RAL.")

add(g=52, titolo="Anticipo del TFR: quando si puo chiedere e quanto arriva netto",
    slug="anticipazione-tfr", q="anticipazioni tfr",
    q2="anticipo tfr", vol=5400, kd=0, cluster="TFR", tipo="Risposta",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Ottobre", prio="Media", diff="Media", aio=None,
    angolo="Picco a ottobre (8.100) ma domanda solida tutto l'anno. Attenzione: tre varianti = una ricerca sola. Il numero che manca ovunque e il netto: l'anticipazione ha tassazione separata e la gente scopre solo dopo quanto le resta. Mostrarlo col conto.",
    note="Requisiti (8 anni di servizio, causali) hanno estremi normativi precisi: citarli con data.")

add(g=53, titolo="TFR in azienda o nel fondo pensione: il confronto, coi numeri",
    slug="tfr-azienda-o-fondo-pensione", q="tfr silenzio-assenso",
    q2="tfr fondo pensione o azienda", vol=1600, kd=None, cluster="TFR", tipo="Confronto",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Dicembre", prio="Media", diff="Media", aio=None,
    angolo="Picco a dicembre (8.100 contro 1.600 di media). Decisione che quasi nessuno prende consapevolmente. Il pezzo non consiglia - non siamo consulenti - ma mette in tabella le variabili: rivalutazione di legge contro rendimento non garantito, tassazione diversa, disponibilita.",
    note="TERRENO DELICATO: non e consulenza finanziaria e va detto. Mostrare le variabili, non una raccomandazione.")

add(g=54, titolo="Ho cambiato lavoro a meta anno: perche il conguaglio fa paura",
    slug="cambio-lavoro-conguaglio", q="conguaglio cambio lavoro",
    q2=None, vol=None, kd=None, cluster="Conguaglio", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Dicembre", prio="Media", diff="Bassa", aio=None,
    angolo="Caso in cui il conguaglio morde di piu: due datori che hanno applicato ciascuno le proprie detrazioni sullo stesso anno. Mostrare il conto di cosa succede e perche non e un errore di nessuno.",
    note="Volume non misurato. Sintomo reale e stagionalmente giusto.")

add(g=55, titolo="Rimborso del 730 in busta paga: quando arriva e perche puo non arrivare",
    slug="rimborso-730-busta-paga", q="rimborso 730 in busta paga",
    q2="conguaglio 730 a debito busta paga", vol=590, kd=None, cluster="Conguaglio", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="590 su cinque varianti. BustaIA ha un pezzo con ETV 2,1. Il pezzo spiega il meccanismo del sostituto d'imposta e i casi in cui il rimborso non compare (capienza insufficiente, tempistiche, 730 senza sostituto).",
    note="Il picco del 730 e aprile-giugno, FUORI finestra. Questo pezzo e di presidio, non di stagione: priorita Media.")

add(g=56, titolo="Esempio di busta paga dell'ultimo mese di lavoro",
    slug="esempio-busta-paga-ultimo-mese", q="ultima busta paga dimissioni",
    q2="preavviso dimissioni", vol=None, kd=None, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Media", diff="Media", aio=None,
    angolo="Il cedolino di fine rapporto e il piu controllato e il meno capito: ratei di tredicesima e ferie, indennita di preavviso o sua trattenuta, TFR, conguaglio finale. Stipendee presidia 'preavviso dimissioni' (8.100) con un articolo generico, senza il conto.",
    note="Distinguere preavviso lavorato, indennizzato e non prestato: sono tre conti diversi.")

add(g=57, titolo="Livello CCNL e netto: quanto prende davvero un quinto livello",
    slug="livello-ccnl-stipendio-netto", q="5 livello metalmeccanico stipendio netto",
    q2="stipendio netto 5 livello commercio 40 ore", vol=1900, kd=None,
    cluster="CCNL e rinnovi", tipo="Calcolo",
    prod="CCNL", cta="/ccnl-livello.html", intento="Info + calcolo",
    picco=None, prio="Alta", diff="Media", aio=None,
    angolo="Lacuna confermata da entrambi i teardown: TUTTI i competitor trattano il CCNL come guida editoriale con le tabelle LORDE, nessuno ha un calcolatore che restituisca il NETTO per livello. BustaIA e in posizione 49 su questa query pur avendo la guida CCNL piu forte del settore (le sue /guida-ccnl/ valgono il 53% del suo traffico). Noi abbiamo componiRal() che fa esattamente questo. E il divario piu netto fra quello che sappiamo fare e quello che loro pubblicano.",
    note="Usare componiRal() senza creare una seconda fonte dei numeri. Dichiarare decorrenza e data di verifica delle fonti CCNL.")

add(g=58, titolo="Scatti di anzianita: quanto valgono netti e ogni quanto arrivano",
    slug="scatti-di-anzianita", q="scatti di anzianita busta paga",
    q2=None, vol=None, kd=None, cluster="CCNL e rinnovi", tipo="Risposta",
    prod="CCNL", cta="/ccnl-livello.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Cluster 'aumenti e rinnovi' con picco a novembre e KD medio 0,0, quasi nessuno lo presidia con contenuto mirato. Il generatore CCNL gestisce gia gli scatti: mostrare quanto vale uno scatto lordo e quanto ne resta netto, che e sempre meno di quanto la gente si aspetta.",
    note=None)

add(g=59, titolo="Il netto non torna con quello che mi avevano promesso al colloquio",
    slug="netto-diverso-da-quello-promesso", q="ral promessa netto diverso",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Calcolatore RAL", cta="/", intento="Sintomo/problema",
    picco=None, prio="Alta", diff="Bassa", aio=None,
    angolo="Il sintomo fondativo del sito intero: la distanza fra la RAL dell'offerta e i soldi sul conto. Cause: mensilita diverse da quelle assunte, comune con addizionali piu alte, benefit contati nella RAL ma non liquidi, premio variabile presentato come fisso. Ognuna col conto. Collega direttamente al calcolatore e alle pagine RAL.",
    note="E il pezzo che meglio rappresenta il progetto. Vale la pena curarlo piu della media.")

add(g=60, titolo="Due offerte di lavoro a confronto: quale lascia piu soldi in tasca",
    slug="confronto-due-offerte-lavoro", q="confronto offerte di lavoro stipendio netto",
    q2=None, vol=None, kd=None, cluster="Strumenti", tipo="Confronto",
    prod="Confronto offerte", cta="/compara.html", intento="Info + calcolo",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="GAP VERO: zero domini tracciati compaiono per questo pattern di query. Nessun competitor lo presidia e il sito ha gia /compara.html. Due offerte con RAL diverse, mensilita diverse, comuni diversi e benefit diversi non sono confrontabili a occhio: il pezzo mostra il confronto completo su un caso e manda allo strumento.",
    note="Volume non misurabile (nessun dominio tracciato): e una scommessa su un intento reale senza keyword consolidata. Priorita Media, ma differenziante.")

add(g=61, titolo="Detrazioni da lavoro dipendente: quanto ti spetta e quanto ne usi davvero",
    slug="detrazioni-lavoro-dipendente", q="detrazioni lavoro dipendente",
    q2="detrazione lavoro dipendente 2026", vol=None, kd=None, cluster="IRPEF e manovra", tipo="Calcolo",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Gennaio", prio="Alta", diff="Media", aio=None,
    angolo="GioIA ha il suo unico asset qui (/detrazioni-fiscali, posizione 9 su 'detrazioni lavoro dipendente 2026', 5.400). Il concetto che nessuno spiega e la CAPIENZA - la differenza fra quanto SPETTA e quanto se ne USA: a IRPEF lorda 400 euro una detrazione da 1.955 entra per 400. E gia nel glossario del progetto ed e calcolata dal motore. E il nostro terreno.",
    note="Capienza e definita in CONTEXT.md: usare quella definizione. TUIR art. 13 e gia nel catalogo fonti.")

add(g=62, titolo="Esempio di busta paga con arretrati",
    slug="esempio-busta-paga-arretrati", q="arretrati in busta paga",
    q2="arretrati contratto quando in busta paga", vol=None, kd=None,
    cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco="Novembre", prio="Media", diff="Media", aio=None,
    angolo="Dopo un rinnovo CCNL arrivano gli arretrati e il cedolino diventa illeggibile: competenze di anni precedenti, tassazione separata su alcune voci, effetto sul conguaglio. Stagionalmente coerente col picco rinnovi di novembre. Le query 'arretrati contratto medici quando in busta paga' valgono 1.600-2.400 e nessuno le presidia (anche se quel pubblico specifico e fuori ICP).",
    note="Gli arretrati di anni precedenti hanno tassazione separata: distinguerli dalle competenze correnti.")

add(g=63, titolo="Carenza per malattia: i giorni che nessuno ti paga",
    slug="carenza-malattia-busta-paga", q="carenza malattia busta paga",
    q2=None, vol=590, kd=None, cluster="Ferie e permessi", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="590 confermato. Sintomo puro: la gente vede meno soldi dopo una malattia breve e non capisce perche. I primi tre giorni sono a carico del datore o di nessuno a seconda del CCNL. Mostrare il conto su un'assenza di 3 e di 10 giorni.",
    note="La copertura dei giorni di carenza dipende dal CCNL: dichiararlo.")

add(g=64, titolo="Tabella lordo-netto per dipendenti, con le ipotesi dichiarate",
    slug="tabella-lordo-netto", q="tabella lordo netto",
    q2="tabella netto lordo", vol=4400, kd=5, cluster="Strumenti", tipo="Pilastro",
    prod="Calcolatore RAL", cta="/confronti-ral/", intento="Info + calcolo",
    picco=None, prio="Alta", diff="Media", aio=None,
    angolo="4.400 di volume e nessuno ha una pagina tabellare dedicata: stipendee e calcolastipendionetto la intercettano con la sola homepage. ATTENZIONE: la SERP e a intento misto e piena di risultati sportivi (AIC, GIBA, tabelle calciatori). Titolo e contenuto devono dire 'lavoratori dipendenti' in modo esplicito. Prima di creare un URL nuovo, valutare se arricchire /confronti-ral/ soddisfa lo stesso intento: probabilmente si.",
    note="Rischio duplicazione con l'hub esistente. Decidere PRIMA di scrivere se e una pagina nuova o un upgrade di /confronti-ral/. Il provider attribuisce a questa keyword una lingua incongrua (nb): leggere le metriche con prudenza.")

add(g=65, titolo="Apprendistato: perche la busta paga e diversa",
    slug="busta-paga-apprendistato", q="busta paga apprendistato",
    q2="stipendio apprendista netto", vol=None, kd=None, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Cluster part-time e apprendistato: 14 keyword, KD medio 0,4, quasi nessun presidio. L'apprendista ha sottoinquadramento, aliquota contributiva agevolata e progressione retributiva nel tempo: tre cose che rendono il suo cedolino incomparabile con quello di un collega.",
    note="IMPORTANTE: il motore assume FPLD ordinario. L'aliquota dell'apprendistato e diversa e il calcolatore NON la copre: dichiararlo esplicitamente invece di stimarla.")

add(g=66, titolo="Cuneo fiscale: cos'e e quanto ne vedi davvero in busta paga",
    slug="cuneo-fiscale-busta-paga", q="cuneo fiscale busta paga",
    q2="taglio cuneo fiscale", vol=None, kd=None, cluster="IRPEF e manovra", tipo="Risposta",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Ottobre", prio="Media", diff="Media", aio=None,
    angolo="BustaIA ha /strumenti/cuneo-fiscale con ETV 13: presidio debolissimo. Il cuneo e la parola piu usata e meno capita del dibattito: la gente non sa distinguere quello che vede in busta da quello che l'azienda risparmia. Il motore calcola gia la parte che riguarda il lavoratore.",
    note="Il termine e ambiguo (cuneo totale vs quota lavoratore): definirlo prima di usarlo.")

add(g=67, titolo="Esempio di busta paga a tempo determinato",
    slug="esempio-busta-paga-tempo-determinato", q="busta paga tempo determinato",
    q2=None, vol=None, kd=None, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Bassa", diff="Bassa", aio=None,
    angolo="Completa il cluster esempi. Contributo addizionale NASpI, ratei proporzionali, cosa cambia e cosa no rispetto all'indeterminato. Un esempio e un artefatto e regge il trend meglio di una spiegazione.",
    note=None)

add(g=68, titolo="Imponibile previdenziale e imponibile fiscale: perche sono due numeri diversi",
    slug="imponibile-previdenziale-e-fiscale", q="imponibile previdenziale",
    q2="imponibile fiscale busta paga", vol=None, kd=None, cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Marzo", prio="Media", diff="Media", aio=None,
    angolo="Due righe quasi identiche con due numeri diversi: e una delle cose che genera piu smarrimento nel cedolino. La spiegazione e semplice e quasi nessuno la da col conto: l'imponibile fiscale e il previdenziale meno i contributi. Il glossario del progetto definisce gia Imponibile: usare quella definizione.",
    note="Picco a marzo (periodo CU), fuori finestra. Pezzo di presidio.")

add(g=69, titolo="Banca ore: dove sta e cosa ci puoi fare",
    slug="banca-ore-busta-paga", q="banca ore busta paga",
    q2=None, vol=None, kd=None, cluster="Ferie e permessi", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Bassa", diff="Bassa", aio=None,
    angolo="Completa il filone 'gli straordinari non ci sono': spesso non mancano, sono finiti in banca ore. Dove compare il saldo, come si usa, cosa succede se scade.",
    note=None)

add(g=70, titolo="Quattordicesima: chi ce l'ha, quando arriva e quanto vale netta",
    slug="quattordicesima", q="come si calcola la quattordicesima",
    q2="quattordicesima quando arriva", vol=2400, kd=None, cluster="Tredicesima", tipo="Risposta",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco="Giugno", prio="Media", diff="Bassa", aio=None,
    angolo="BustaIA e in posizione 103 pur avendo l'articolo dedicato. ATTENZIONE STAGIONALE: il picco e giugno-luglio, FUORI finestra. Qui serve come contenuto di supporto alla tredicesima e alle pagine RAL (che confrontano gia 12/13/14 mensilita), non come target autonomo. Il pezzo forte e il confronto: a parita di RAL, lo stesso netto annuo diviso per 12, 13 o 14 - che e esattamente quello che fanno le pagine RAL.",
    note="Fuori stagione: non aspettarsi traffico prima di giugno. Collega alle 17 pagine /ral-{N}-netto/.")

# =====================================================================
# BLOCCO 4 — giorni 71-90 · DICEMBRE
# Il conguaglio si VEDE a dicembre ma si CERCA a gennaio: questi pezzi
# vanno online ora per raccogliere il picco appena fuori finestra.
# Piu la preparazione delle aliquote dell'anno nuovo.
# =====================================================================

add(g=71, titolo="Aliquote e scaglioni del prossimo anno: cosa cambia sul tuo netto",
    slug="aliquote-irpef-anno-nuovo", q="aliquote irpef 2027",
    q2="scaglioni irpef 2027", vol=None, kd=None, cluster="IRPEF e manovra", tipo="Stagionale",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco="Ottobre", prio="Alta", diff="Alta", aio=None,
    angolo="Il segnale e indiretto ma solido: 'aliquote irpef 2025' nel Q4 2025 stava a 90.500/74.000/74.000 contro una media di 40.500. La stringa che salira nel Q4 2026 e quella con l'anno nuovo, che oggi NON ha ancora dati. Va preparato adesso. Ma la SERP di questa famiglia ha l'Agenzia delle Entrate in posizione 2: non si vince sulla definizione. Si vince sul delta calcolato - quanto cambia il netto, in euro al mese, per fascia di RAL.",
    note="Volume non misurabile oggi: la keyword con l'anno nuovo non ha storico. Scommessa motivata dal comportamento dell'anno precedente. Aggiornare appena la manovra e definitiva.")

add(g=72, titolo="Il conguaglio di fine anno, con l'esempio del calcolo completo",
    slug="esempio-calcolo-conguaglio", q="esempio di calcolo conguaglio fiscale",
    q2="conguaglio irpef a debito", vol=None, kd=None, cluster="Conguaglio", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Info + calcolo",
    picco="Gennaio", prio="Alta", diff="Bassa", aio=None,
    angolo="Da related_keywords: 1.300 a dicembre e 2.900 a gennaio. Il cluster conguaglio ha la SERP piu debole vista in tutta la ricerca e nessuno pubblica un esempio numerico completo. Questo e l'esempio: dodici mesi di trattenute, imposta dovuta sull'anno, differenza, e come si legge la riga a dicembre.",
    note="Pubblicato ora per il picco di gennaio. Linkare all'hub conguaglio del giorno 23.")

add(g=73, titolo="Quando arriva il conguaglio, e in quale busta paga",
    slug="quando-arriva-il-conguaglio", q="quando arriva il conguaglio in busta paga",
    q2="in che mese si prende il conguaglio; dove si vede il conguaglio in busta paga",
    vol=None, kd=None, cluster="Conguaglio", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Gennaio", prio="Alta", diff="Bassa", aio=None,
    angolo="Da related_keywords: 260 a dicembre, 1.600 a gennaio. Domanda secca, risposta secca in apertura, poi dove guardare nel PDF. Quattro delle nove PAA del cluster sono esattamente questa domanda riformulata.",
    note="Risposta nelle prime tre righe. Il resto e contorno.",
    paa="In che mese viene fatto il conguaglio in busta paga?; In quale busta paga viene fatto il conguaglio?; Come funziona il conguaglio della busta paga a gennaio?")

add(g=74, titolo="Cosa cambia in busta paga da gennaio",
    slug="cosa-cambia-in-busta-paga-da-gennaio", q="cosa cambia nella busta paga da gennaio",
    q2="conguaglio busta paga gennaio", vol=2400, kd=None, cluster="IRPEF e manovra", tipo="Stagionale",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco="Gennaio", prio="Alta", diff="Media", aio=None,
    angolo="'conguaglio busta paga gennaio 2026' vale 2.400 con intento transazionale e BustaIA non e posizionata. E una PAA ricorrente in due cluster diversi. Pezzo di sintesi annuale: nuove aliquote, nuove soglie, conguaglio, addizionali che ripartono - ognuno col delta calcolato.",
    note="Contenuto ad alta deperibilita. Va riscritto ogni anno, non aggiornato a pezzi.")

add(g=75, titolo="Il netto di gennaio e diverso da quello di dicembre: perche",
    slug="netto-gennaio-diverso-da-dicembre", q="stipendio gennaio piu basso",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Gennaio", prio="Alta", diff="Bassa", aio=None,
    angolo="Pagina-sintomo con il timing migliore del piano: pubblicata a meta dicembre, intercetta gennaio. Cause col conto: addizionali che ripartono, nuove aliquote, detrazioni ricalcolate sull'anno nuovo, fine del conguaglio. Il cluster sintomi e il piu difendibile perche nessun occupante ha un motore in pagina.",
    note="Ultimo pezzo-sintomo forte della finestra. Curarlo.")

add(g=76, titolo="Ratei in busta paga: cosa sono quei numeri che crescono ogni mese",
    slug="ratei-in-busta-paga", q="ratei busta paga",
    q2="ratei tredicesima e ferie", vol=None, kd=None, cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Taglio del cluster: dove stanno nel PDF, cosa significa che maturano, e soprattutto che sono soldi gia tuoi anche se non li hai ancora visti. Collega a tredicesima, ferie e TFR, che sono tre cluster del piano.",
    note="Pezzo di collegamento interno: alta densita di link, basso costo.")

add(g=77, titolo="Progressivi in busta paga: a cosa servono quei totali da inizio anno",
    slug="progressivi-busta-paga", q="progressivi busta paga",
    q2=None, vol=None, kd=None, cluster="Voce per voce", tipo="Risposta",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="I progressivi sono l'unico strumento che uno ha per verificare da solo se i conti dell'anno tornano, e nessuno glielo dice. Il pezzo insegna a usarli come controllo: confrontare il progressivo con la somma dei mesi, e cosa significa se non torna. E anche una delle categorie che il prodotto riconosce.",
    note="Aggancio diretto al prodotto: 'progressivo' e una delle categorie dell'analisi.")

add(g=78, titolo="Il TFR non compare in busta paga: e normale?",
    slug="tfr-non-compare-in-busta-paga", q="tfr in busta paga non c'e",
    q2="perche sulla busta paga non c'e il tfr", vol=None, kd=None,
    cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Related search esplicita su 'tfr in busta paga', e una delle nove PAA del cluster. Risposta in tre righe (dipende da dove e destinato: azienda, fondo, o erogato in busta), poi come verificarlo. Sintomo puro con risposta secca.",
    note="Non affermare mai che il datore non sta versando: dire come si verifica.",
    paa="Il TFR e obbligatorio sulla busta paga?; Il datore di lavoro e obbligato ad accantonare il TFR?; Cosa rischia il datore di lavoro se non versa il TFR?")

add(g=79, titolo="Minimo tabellare: da dove parte davvero il tuo stipendio",
    slug="minimo-tabellare", q="minimo tabellare busta paga",
    q2=None, vol=None, kd=None, cluster="CCNL e rinnovi", tipo="Risposta",
    prod="CCNL", cta="/ccnl-livello.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="La voce da cui si costruisce tutto il resto e che quasi nessuno sa leggere. Il generatore CCNL del sito la usa gia come base: possiamo mostrare la composizione completa da minimo a RAL a netto, che e la tracciabilita che nessun concorrente offre.",
    note="Dichiarare CCNL, livello e decorrenza usati nell'esempio.")

add(g=80, titolo="Stipendio medio netto in Italia: cosa dicono i numeri e cosa non dicono",
    slug="stipendio-medio-netto-italia", q="stipendio medio netto italia",
    q2="stipendio medio italiano", vol=3600, kd=None, cluster="Strumenti", tipo="Confronto",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco=None, prio="Media", diff="Media", aio=None,
    angolo="3.600 di volume, intercettato solo debolmente da calcolastipendionetto in posizione 38-50. Lacuna confermata dal teardown RAL. Il pezzo e onesto su cosa una media non dice (mediana contro media, part-time inclusi, differenze territoriali) e usa il motore per tradurre i lordi delle fonti statistiche in netti confrontabili - che e il passaggio che manca sempre.",
    note="Servono fonti statistiche primarie (ISTAT, INPS Osservatorio) con data. Non riportare numeri da altri blog.")

add(g=81, titolo="Welfare aziendale in busta paga: cosa e davvero esente",
    slug="welfare-aziendale-busta-paga", q="welfare aziendale busta paga",
    q2=None, vol=None, kd=None, cluster="Benefit e welfare", tipo="Risposta",
    prod="Calcolatore RAL", cta="/", intento="Informazionale",
    picco=None, prio="Media", diff="Alta", aio=None,
    angolo="ATTENZIONE: 'welfare aziendale' generico (27.100) e territorio di Coverflex, che il welfare lo VENDE ed e in posizione 11 con un dominio da 206k di ETV. Non competere sull'head term. Angolo dal lato del lavoratore, che Coverflex non ha interesse a coprire: cosa compare in busta, cosa no, e perche un euro di welfare non vale un euro di stipendio.",
    note="Il calcolatore gestisce gia welfare e benefit. TUIR art. 51 c. 2 lett. f e gia nel catalogo fonti.")

add(g=82, titolo="Esempio di busta paga con trasferta e rimborsi",
    slug="esempio-busta-paga-trasferta", q="busta paga con trasferta esempio",
    q2=None, vol=None, kd=None, cluster="Esempi per casistica", tipo="Calcolo",
    prod="Busta paga", cta="/busta-paga.html", intento="Informazionale",
    picco=None, prio="Bassa", diff="Bassa", aio=None,
    angolo="Chiude il cluster esempi. Cedolino completo di un mese con trasferte: indennita imponibile, rimborsi esenti, effetto sul netto. Coppia naturale col pezzo del giorno 27.",
    note=None)

add(g=83, titolo="Quanto ti resta di un aumento di 100 euro lordi",
    slug="aumento-100-euro-lordi-quanto-netto", q="100 euro lordi quanto sono netti",
    q2="aumento lordo quanto netto", vol=None, kd=None, cluster="Strumenti", tipo="Calcolo",
    prod="Netto→RAL", cta="/netto-ral.html", intento="Info + calcolo",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Coppia del giorno 45, dal lato opposto. La risposta non e una percentuale fissa: dipende dallo scaglione marginale e dall'eventuale perdita di detrazioni o bonus. Tabella per fascia di RAL, e il caso in cui l'aumento fa perdere piu di quanto porta - uno dei sette salti.",
    note="Il pezzo dove i 'salti' hanno piu senso. Riconfermarli sul profilo scelto prima di pubblicarli.")

add(g=84, titolo="Ho due lavori: perche le tasse non tornano mai",
    slug="due-lavori-conguaglio-tasse", q="due contratti di lavoro tasse busta paga",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Gennaio", prio="Media", diff="Bassa", aio=None,
    angolo="Caso in cui il conguaglio e quasi sempre a debito, perche ogni datore applica le detrazioni come se fosse l'unico. Il conto mostra la differenza fra la somma dei due conguagli separati e l'imposta effettivamente dovuta sul totale.",
    note="Dire chiaramente che non e un errore di nessuno e che si puo chiedere di non applicare le detrazioni al secondo datore.")

add(g=85, titolo="Malattia lunga: cosa succede al netto mese dopo mese",
    slug="malattia-lunga-effetto-sul-netto", q="malattia lunga busta paga",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="La malattia lunga degrada il netto per scalini (percentuali INPS che scendono, integrazione che si esaurisce, ratei che si fermano) e nessuno lo mostra su una linea temporale. Tabella mese per mese su un caso.",
    note="Terreno sensibile. Limiti dichiarati, dipendenza dal CCNL esplicita.")

add(g=86, titolo="Come si verifica che i contributi siano stati versati davvero",
    slug="verificare-contributi-versati", q="verificare contributi versati",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Alta", aio=None,
    angolo="ATTENZIONE: il cluster 'contributi INPS' ha 23 keyword su 24 NAVIGAZIONALI (inps cedolino, estratto conto, verifica con SPID) - volume enorme e valore zero, chi cerca vuole fare login. Non inseguirle. Qui si copre solo il pezzo informativo che INPS non da: come si confronta la riga del cedolino con l'estratto conto contributivo, e cosa significa se non coincidono.",
    note="Non puntare le query navigazionali INPS. Rimandare a inps.it per l'accesso: e onesto e ci toglie dalla competizione sbagliata.")

add(g=87, titolo="Il glossario della busta paga, sigla per sigla",
    slug="glossario-busta-paga", q="sigle busta paga",
    q2="busta paga significato sigle", vol=None, kd=None, cluster="Voce per voce", tipo="Pilastro",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Media", aio=None,
    angolo="Il glossario da solo NON funziona - GioIA lo ha provato ed e a posizione 37-103, e anche BustaIA col suo /glossario sta a 49-58. Funziona solo se ogni voce ha un esempio numerico e la posizione nel PDF. Questa pagina chiude il cluster voce-per-voce raccogliendo tutte le sigle trattate nei 13 pezzi dedicati e linkandole. E un indice, non un dizionario.",
    note="Da pubblicare DOPO i pezzi voce-per-voce, non prima: senza quelli e un glossario qualunque e fallisce come quello dei concorrenti.")

add(g=88, titolo="Tre cose da controllare ogni mese, in due minuti",
    slug="controlli-mensili-busta-paga", q="controllo busta paga mensile",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Sintomo",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Format leggero e ripetibile che trasforma un controllo annuale in un'abitudine: netto contro mese precedente, progressivi contro somma dei mesi, ratei che crescono. Tre verifiche, tre numeri che devono tornare. E il pezzo che rende il prodotto un'abitudine invece di un'emergenza.",
    note="Aggancio al prodotto di tipo retention, non acquisizione.")

add(g=89, titolo="Come cambia il netto se cambi comune",
    slug="netto-e-comune-di-residenza", q="addizionale comunale differenze",
    q2="stipendio netto cambia con il comune", vol=None, kd=None, cluster="Voce per voce", tipo="Confronto",
    prod="Calcolatore RAL", cta="/", intento="Info + calcolo",
    picco=None, prio="Media", diff="Bassa", aio=None,
    angolo="Asset esclusivo: i dati delle addizionali per comune sono gia nel motore con le fonti. A parita di RAL, il netto cambia fra comuni - e un numero che nessun concorrente pubblica perche nessuno ha quei dati organizzati. Utile a chi valuta un trasferimento o un'offerta in un'altra citta.",
    note="Dichiarare la data di aggiornamento dei dati delle addizionali: e contenuto ad alta manutenzione.")

add(g=90, titolo="Un anno di busta paga: come rileggere i dodici cedolini insieme",
    slug="rileggere-un-anno-di-buste-paga", q="confronto buste paga anno",
    q2=None, vol=None, kd=None, cluster="Sintomi", tipo="Pilastro",
    prod="Busta paga", cta="/busta-paga.html", intento="Sintomo/problema",
    picco="Gennaio", prio="Media", diff="Bassa", aio=None,
    angolo="Chiude i 90 giorni e apre il trimestre successivo. Momento giusto: a fine anno uno ha dodici cedolini e il conguaglio appena fatto. Il pezzo usa i progressivi per verificare l'anno intero e raccoglie i link ai principali pezzi del piano. NOTA COMPETITIVA: il confronto storico e il posizionamento di GioIA ('il radar del tuo stipendio') e richiede un archivio - che noi deliberatamente non abbiamo. Qui si mostra come farlo SENZA archivio, con i documenti che uno ha gia in mano. E la risposta corretta al loro prodotto.",
    note="Pezzo di chiusura e hub di link interni. Non promettere funzioni di archivio che il prodotto non ha e non vuole avere.")

# =====================================================================
# SERIALIZZAZIONE E CONTROLLI
# =====================================================================

FIELD_DEFAULTS = dict(q2=None, vol=None, kd=None, picco=None, aio=None, note=None, paa=None)

records = []
for it in ITEMS:
    r = dict(FIELD_DEFAULTS)
    r.update(it)
    records.append({
        "Giorno": r["g"],
        "Data pubblicazione": d(r["g"]),
        "Titolo": r["titolo"],
        "Slug proposto": r["slug"],
        "Query principale": r["q"],
        "Query secondarie": r["q2"],
        "Angolo": r["angolo"],
        "People Also Ask": r["paa"],
        "Cluster": r["cluster"],
        "Tipo": r["tipo"],
        "Prodotto agganciato": r["prod"],
        "CTA": r["cta"],
        "Ipotesi di calcolo": "dipendente privato, Milano, nessun familiare a carico, anno intero, FPLD ordinario",
        "Note": r["note"],
        "Volume mensile": r["vol"],
        "KD": r["kd"],
        "Intento": r["intento"],
        "AI Overview": bool(r["aio"]) if r["aio"] is not None else False,
        "Difficolta reale": r["diff"],
        "Mese di picco": r["picco"],
        "Priorita": r["prio"],
        "Fonte del dato": R if r["vol"] is not None else "non confermato dal database",
        "Data rilevazione": "2026-09-20",
        "Stato": "Da scrivere",
    })

# --- controlli, falliscono rumorosamente ---
assert len(records) == 90, f"attesi 90 articoli, trovati {len(records)}"
giorni = [x["Giorno"] for x in records]
assert sorted(giorni) == list(range(1, 91)), "giorni mancanti o duplicati: " + str(
    sorted(set(range(1, 91)) - set(giorni)))
slugs = [x["Slug proposto"] for x in records]
assert len(set(slugs)) == 90, "slug duplicati: " + str(
    [s for s in set(slugs) if slugs.count(s) > 1])
for x in records:
    assert x["CTA"] in {"/", "/busta-paga.html", "/netto-ral.html",
                        "/compara.html", "/ccnl-livello.html", "/confronti-ral/"}, \
        f"CTA non valida al giorno {x['Giorno']}: {x['CTA']}"
    assert x["KD"] != 0 or x["Volume mensile"] is not None, \
        f"giorno {x['Giorno']}: KD senza volume"

records.sort(key=lambda x: x["Giorno"])
with open("piano-90-giorni.json", "w", encoding="utf-8") as f:
    json.dump(records, f, ensure_ascii=False, indent=1)

# --- riepiloghi ---
from collections import Counter
print("ARTICOLI:", len(records))
print("DAL", records[0]["Data pubblicazione"], "AL", records[-1]["Data pubblicazione"])
print()
print("PER CLUSTER")
for k, v in Counter(x["Cluster"] for x in records).most_common():
    print(f"  {v:3}  {k}")
print()
print("PER PRODOTTO AGGANCIATO")
for k, v in Counter(x["Prodotto agganciato"] for x in records).most_common():
    print(f"  {v:3}  {k}")
print()
print("PER TIPO")
for k, v in Counter(x["Tipo"] for x in records).most_common():
    print(f"  {v:3}  {k}")
print()
print("PER PRIORITA")
for k, v in Counter(x["Priorita"] for x in records).most_common():
    print(f"  {v:3}  {k}")
print()
con = sum(1 for x in records if x["Volume mensile"] is not None)
print(f"VOLUME CONFERMATO DA DATAFORSEO: {con}/90 · non confermato: {90-con}/90")
