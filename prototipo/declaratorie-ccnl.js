/* ------------------------------------------------------------
   DECLARATORIE DEI LIVELLI (RIC-146)

   Per contratto: chi rientra in ogni livello, con le parole del
   contratto. Il template ne fa la sezione «I livelli del CCNL» della
   tabella e il blocco «Chi rientra nel …» delle pagine livello.

   Regole:
   - `testo` ed `elenco` sono citati dal testo del contratto, senza
     parafrasi. Si accorcia solo con «[…]». Circa 600 caratteri al
     massimo per categoria, testo ed elenco insieme.
   - `esempi` solo con profili o posizioni scritti nel contratto, con il
     codice a cui il contratto li assegna. Nessuna mappatura mansione →
     livello fatta da noi (RIC-58).
   - Ogni codice della tabella vigente sta in una sola categoria; più
     codici nella stessa categoria se il contratto li descrive insieme.
   - `testo:null` solo dove la declaratoria non si è potuta leggere: lo
     dice `senzaDeclaratoria`, e la categoria porta almeno gli esempi.
   - Le declaratorie valgono per la sezione `sezioneLivelli` del
     contratto (CONTRATTI_SEO), o per l'unica scala se non ha sezioni.

   Per aggiungere un contratto (RIC-147) basta una voce qui sotto con
   l'id del dataset: tabella e pagine livello la leggono da sole.
   Fonti, pagine lette e limiti: processo/fonti-ccnl-gruppo2-*.md,
   sezione «Declaratorie».
   ------------------------------------------------------------ */

const CNEL_API='https://az-apim-cne-sa-0002-lgc-we.azure-api.net/ricerca-api/ricerca/pubblica/accordi/scarica/accordi/';

/* Posizioni professionali per area: indice dell'allegato 2 della
   stesura 2020 (pp. 101–103), che le elenca per area e livello. Nomi
   delle aree come nell'ipotesi 2025 (art. 4 c.10). */
const AREA={
  amm:'amministrazione',
  com:'commerciale/logistica',
  man:'manutenzione',
  per:'personale, organizzazione e sistemi informativi',
  pro:'produzione',
  qua:'qualità',
  rs:'ricerca e sviluppo',
  fit:'funzioni integrate e trasversali',
};
const posizioni=(codice,perArea)=>Object.entries(perArea).map(([a,profili])=>({codice,gruppo:AREA[a],profili}));

const GOMMA_PLASTICA={
  articolo:'art. 4 e allegato 2',
  fonti:[
    {parte:'art. 4 e allegato 2',titolo:'Stesura del CCNL 16 settembre 2020, deposito CNEL',
      url:`${CNEL_API}138012`,archivio:'processo/dati/fonti/gomma-plastica-b371-cnel-stesura-ccnl-2020-09-16.pdf',
      pagine:'pp. 25–28 e 101–108'},
    {parte:'art. 4',titolo:'Ipotesi di accordo di rinnovo 10 dicembre 2025, deposito CNEL',
      url:`${CNEL_API}239732`,archivio:'processo/dati/fonti/gomma-plastica-b371-cnel-ipotesi-accordo-rinnovo-2025-12-10.pdf',
      pagine:'pp. 24–26'},
  ],
  verificataIl:'2026-10-21',
  introduzione:[
    {testo:'Nell’ambito di ogni area funzionale l’inquadramento dei lavoratori nei livelli previsti viene effettuato in base alle relative declaratorie e posizioni professionali.',riferimento:'art. 4 c.3'},
    {testo:'Le posizioni professionali determinano il minimo contenuto professionale che una mansione deve presentare per essere inquadrata nel corrispondente livello.',riferimento:'art. 4 c.6'},
  ],
  avvertenza:'Il contratto scrive le declaratorie area per area, nell’allegato 2. Il testo depositato al CNEL riporta solo quelle dei livelli G, H e I dell’area produzione; per i quadri c’è l’art. 4. Per gli altri livelli qui ci sono le posizioni professionali che l’indice dell’allegato assegna al livello, non la declaratoria. Le posizioni sono quelle del CCNL 2020: l’ipotesi del 10 dicembre 2025 ne aggiunge dodici, dal 1° gennaio 2027, che qui non sono elencate.',
  senzaDeclaratoria:'La declaratoria di questo livello è nell’allegato 2, in pagine che il testo depositato al CNEL non riporta.',
  nomeEsempi:'Posizioni professionali',
  categorie:[
    {codici:['Q'],titolo:'Quadri',riferimento:'art. 4 c.9, pp. 25–26',
      testo:'[…] caratteristiche indispensabili per l’appartenenza alla categoria dei quadri sono:',
      elenco:['lo svolgimento con carattere continuativo di funzioni di rilevante importanza ai fini dello sviluppo e dell’attuazione degli obiettivi dell’impresa;',
        'il coordinamento, il controllo e la responsabilità di unità organizzative, con discrezionalità di poteri, per l’attuazione di programmi stabiliti dalla direzione da cui dipendono o che espletano autonome mansioni specialistiche di equivalente importanza e responsabilità; […]']},
    {codici:['A'],titolo:'Livello A',riferimento:'allegato 2, indice per area, pp. 101–103',testo:null,
      esempi:posizioni('A',{
        amm:['responsabile settore/coordinatore attività contabili','specialista attività contabili','coordinatore attività di revisione interna'],
        com:['specialista di marketing','coordinatore di sezione commerciale','venditore','coordinatore tecnico-commerciale','coordinatore gestione ordini','acquisitore','acquisitore di macchinari e apparecchiature complesse','coordinatore programmazione e gestione scorte/programmatore','gestore dei flussi ai depositi','coordinatore trasporti','responsabile di magazzino'],
        man:['assistente capo manutenzione'],
        per:['responsabile amministrazione del personale','specialista risorse umane','responsabile di formazione','specialista di selezione','analista di organizzazione','analista programmatore','responsabile operativo','specialista di software'],
        pro:['assistente capo/sovraintendente/capo reparto','specialista di programmazione'],
        qua:['responsabile laboratorio','specialista di industrializzazione','specialista procedure di qualità','coordinatore controllo qualità'],
        rs:['ricercatore','tecnologo','assistente capo alle prove di ricerca e sviluppo','progettista disegnatore'],
        fit:['responsabile del servizio di sorveglianza e di sicurezza','specialista ambiente e sicurezza del lavoro']})},
    {codici:['B'],titolo:'Livello B',riferimento:'allegato 2, indice per area, pp. 101–102',testo:null,
      esempi:posizioni('B',{
        amm:['revisore'],
        per:['coordinatore incaricati pratiche amministrative del personale']})},
    {codici:['C'],titolo:'Livello C',riferimento:'allegato 2, indice per area, pp. 101–103',testo:null,
      esempi:posizioni('C',{
        amm:['contabile','cassiere'],
        com:['assistente commerciale/tecnico gestione ordini','tecnico raccolta ed elaborazione dati di mercato','assistente tecnico','compratore/approvvigionatore','assistente magazzino','capo squadra di magazzino'],
        man:['tecnico di manutenzione','assistente di manutenzione'],
        per:['tecnico d’organizzazione industriale','tecnico d’organizzazione amministrativa','programmatore','schedulatore lavori','assistente di turno edp','tecnico pratiche amministrative del personale'],
        pro:['assistente/supervisor','programmatore di produzione','capo turno/squadra di produzione'],
        qua:['tecnico analista di qualità','tecnico di laboratorio','assistente di qualità','tecnico delle procedure di collaudo','capo squadra di qualità'],
        rs:['disegnatore aiuto progettista','tecnico delle prove di ricerca e sviluppo','assistente tecnologo/ricercatore'],
        fit:['segretaria assistente']})},
    {codici:['D'],titolo:'Livello D',riferimento:'allegato 2, indice per area, p. 101',testo:null,
      esempi:posizioni('D',{
        man:['addetto alla programmazione lavori di manutenzione','giuntista montatore provetto','aggiustatori/montatori','specialista elettronico','montatore/riparatore provetto di nastri trasportatori','costruttore di prototipi di stampi per presse','specialista sistemi di misura','specialista meccatronico']})},
    {codici:['E'],titolo:'Livello E',riferimento:'allegato 2, indice per area, pp. 101–103',testo:null,
      esempi:posizioni('E',{
        com:['incaricato pratiche di magazzino/spedizione','preparatore documenti per import/export'],
        man:['manutentore di impianti tecnologicamente complessi','montatore','attrezzista','addetto industrializzazione stampi materie plastiche','giuntista montatore','conduttore impianti di centrale termica'],
        per:['incaricato pratiche del personale','operatore edp','incaricato supporto utenti e trattamenti input/output','addestratore'],
        pro:['capogruppo di produzione','conduttore impianti a gestione complessa'],
        qua:['controllore di qualità','controllore qualità materiali e componenti','classificatore prodotto finito'],
        rs:['disegnatore/lucidista particolarista','conduttore prove ad esecuzione complessa di r&s','aggiustatore/montatore, impiantista su prototipi'],
        fit:['segretaria di direzione o servizi equivalenti']})},
    {codici:['F'],titolo:'Livello F',riferimento:'allegato 2, indice per area, pp. 101–103',testo:null,
      esempi:posizioni('F',{
        amm:['addetto contabilità'],
        com:['addetto assistenza tecnica','preparatore merci/magazziniere','autista'],
        man:['addetto macchine utensili','addetto alla manutenzione e al montaggio di macchine e impianti','addetto alla conduzione di generatori termici'],
        per:['addetto registrazione/verifica dati','operatore ausiliario edp'],
        pro:['regleur/attrezzatore','addetto conduzione impianti','addetto a macchine a ciclo complesso','addetto produzioni di piccola serie'],
        qua:['verificatore prodotto finito','addetto alle prove e collaudi di laboratorio'],
        rs:['addetto alle prove di r&s','addetto alla realizzazione di prototipi','addetto a lavorazioni sul prodotto'],
        fit:['segretaria','operatore custode/sorvegliante','autista di vettura']})},
    {codici:['G'],titolo:'Livello G',ambito:'area produzione',riferimento:'allegato 2, p. 106',
      testo:'appartengono a questo livello i lavoratori che:',
      elenco:['in possesso di conoscenze acquisite attraverso insegnamento ed addestramento specifici per maturare una buona abilità manuale, la conoscenza dei mezzi di lavoro […];',
        'hanno la responsabilità di assicurare la conformità/adeguatezza del risultato delle attività e di accertare la corrispondenza qualitativa e quantitativa […];',
        'operano in condizioni di autonomia parzialmente vincolata, eseguendo compiti secondo istruzioni specifiche, nell’ambito di procedure e di processi standardizzati; ricevono una supervisione sul modo di operare ed un controllo sul risultato delle attività.'],
      esempi:posizioni('G',{
        com:['carrellista','addetto a magazzini'],
        pro:['addetto a macchine/impianti','preparatore mescole'],
        qua:['addetto a collaudi diversificati','operatore alle macchine di controllo prodotto finito']})},
    {codici:['H'],titolo:'Livello H',ambito:'area produzione',riferimento:'allegato 2, pp. 106–107',
      testo:'appartengono a questo livello i lavoratori che:',
      elenco:['in possesso di conoscenze acquisite attraverso un insegnamento limitato ed un addestramento specifico per maturare una buona abilità manuale, capacità operativa e conoscenza dei mezzi di lavoro;',
        'hanno la responsabilità dell’accuratezza nella esecuzione dei compiti assegnati e dell’accertamento del risultato dell’attività;',
        'operano in condizioni di autonomia vincolata, eseguendo compiti secondo istruzioni dettagliate nell’ambito di procedure vincolanti e di processi standardizzati; ricevono un controllo sul modo di operare e sul risultato delle attività.'],
      note:[{testo:'A partire dal 1° gennaio 2027, i lavoratori e le lavoratrici inquadrati/e al liv. H dell’area commerciale - logistica, con posizione professionale di carrellista, saranno inquadrati/e al livello G con posizione di “carrellista movimentatore merci” dopo dodici mesi di permanenza nel livello H.',
        riferimento:'ipotesi 10 dicembre 2025, art. 4 c.16, p. 26'}],
      esempi:posizioni('H',{
        com:['carrellista'],
        man:['ausiliario di manutenzione'],
        pro:['operatore di macchine o impianti','addetto montaggio/imballaggio'],
        qua:['operatore alle prove'],
        rs:['operatore alle prove di r&s'],
        fit:['fattorino']})},
    {codici:['I'],titolo:'Livello I',ambito:'area produzione',riferimento:'allegato 2, p. 107',
      testo:'appartengono a questo livello i lavoratori che:',
      elenco:['in possesso di conoscenze generiche acquisite anche mediante breve affiancamento per l’esecuzione di operazioni semplici e/o manuali e/o ripetitive;',
        'hanno la responsabilità dell’esecuzione accurata delle operazioni assegnate;',
        'operano in condizioni di autonomia esecutiva, eseguendo operazioni semplici e/o manuali e/o ripetitive, vincolate a dettagliate istruzioni e procedure ricevute; ricevono un controllo sull’esecuzione, modalità e risultato delle operazioni.'],
      note:[
        {testo:'A partire dal 1° gennaio 2021, tutti i lavoratori inquadrati al livello I dell’area produzione, con posizione professionale di addetti alla conduzione di macchine di produzione o all’esecuzione di operazioni di montaggio ed assemblaggio di prodotti, saranno inquadrati al livello H dopo il superamento del periodo di prova […].',
          riferimento:'art. 4 c.17, p. 28'},
        {testo:'A far data dal 1° dicembre 2028 sarà eliminato il livello I nelle aree di produzione e delle funzioni integrate trasversali. Pertanto, le posizioni di “addetti/e a lavori di preparazione”, “aiuto esecutivo” per l’area produzione e le posizioni di “addetto/a a lavori non rientranti nel ciclo produttivo”, “addetto/a al prelievo e consegna di documenti” e “addetto/a all’archivio” saranno inquadrati nel livello H.',
          riferimento:'ipotesi 10 dicembre 2025, art. 4 c.18, p. 26'}],
      esempi:posizioni('I',{
        pro:['addetti a lavori di preparazione','aiuto esecutivo'],
        fit:['addetto a lavori non rientranti nel ciclo produttivo','addetto al prelievo e consegna documenti','addetto all’archivio']})},
  ],
};

/* Profili per posizione organizzativa, art. 4 del testo 2006 (CNEL).
   Corretti quattro refusi del .doc: «unite» (unità), «dr» e «d» (di),
   «Conifezionatore». */
const profili=perPosizione=>Object.entries(perPosizione).map(([codice,lista])=>({codice,profili:lista}));

const CHIMICO={
  articolo:'art. 4',
  fonti:[
    {parte:'art. 4 «Classificazione del personale»',titolo:'CCNL 10 maggio 2006, testo definitivo depositato al CNEL',
      url:'https://azstcnesa0002prodwe001.blob.core.windows.net/archivio-contratti/archivio%2F2006%2F76f9b81a-010b-43a3-9dda-5cc14ae8a486%2F8955.doc',
      archivio:'processo/dati/fonti/chimico-b011-ccnl-testo-definitivo-2006-05-10-cnel.doc',pagine:null},
  ],
  verificataIl:'2026-10-21',
  introduzione:[
    {testo:'I lavoratori sono inquadrati in un’unica scala classificatoria composta dalle seguenti 6 categorie nell’ambito delle quali sono previste figure professionali con mansioni contrattualmente considerate equivalenti, distribuite su diverse posizioni organizzative.',riferimento:'art. 4'},
    {testo:'I profili, distribuiti nell’ambito delle diverse posizioni organizzative, descrivono il contenuto professionale delle mansioni in essi individuate.',riferimento:'art. 4'},
  ],
  avvertenza:'Il testo è quello del 2006 depositato al CNEL, l’ultimo integrale che si può leggere. I rinnovi dal 2009 al 2025 non riscrivono le declaratorie: il 2012 aggiorna il profilo dell’informatore scientifico del farmaco, il 2015 supera la qualifica speciale per i nuovi assunti. La stesura 2025–2028 è riservata e non è stata letta.',
  senzaDeclaratoria:null,
  nomeEsempi:'Profili',
  categorie:[
    {codici:['A1','A2','A3'],titolo:'Categoria A',riferimento:'art. 4, categoria A',
      testo:'Appartengono a questa categoria di inquadramento i lavoratori quadri che ricoprono posizioni preposte a importanti settori di attività aziendale che richiedono:',
      elenco:['conoscenza specifica e pluriennale esperienza in più discipline da integrare tra loro, maturate anche attraverso il presidio di posizioni appartenenti alle categorie inferiori;',
        'ampia autonomia direttiva nell’ambito delle politiche aziendali e di obiettivi di carattere generale, i cui risultati sono oggetto di supervisione;',
        'eventuale guida, controllo e sviluppo di un significativo gruppo di risorse umane;',
        'responsabilità economiche di impatto rilevante per l’impresa […].'],
      esempi:profili({
        A1:['Responsabile assicurazione qualità di società','Responsabile Protezione Ambientale e Sicurezza stabilimento complesso','Responsabile sistemi informativi di società','Responsabile aree amministrative/contabili di società','Responsabile controllo gestione/amministrazione di stabilimento complesso','Responsabile ufficio tecnico e lavori di stabilimento complesso','Responsabile centro di distribuzione','Responsabile logistica stabilimento complesso','Responsabile di più settori di acquisto/materiali stabilimento complesso','Responsabile pianificazione produzione','Responsabile manutenzione stabilimento complesso','Project leader','Group product manager','Responsabile training tecnico/scientifico','Responsabile assistenza tecnica alla clientela','Capo aree (farmaceutico)','Responsabile personale/organizzazione di unità operativa','Responsabile centrale di area del personale','Responsabile impianti complessi','Responsabile gestione attività industriali','Responsabile gruppo di laboratori/unità di ricerca','Responsabile medico di prodotto di area terapeutica','Senior scientist','Responsabile tecnologia di processo di impianti complessi','Capo aree di vendita'],
        A2:['Responsabile laboratori controllo stabilimento complesso','Esperto di sistemi operativi complessi','Responsabile sviluppo sistemi informativi di società','Responsabile impianti','Responsabile customer service integrato'],
        A3:['Responsabile area applicativa','Responsabile area amministrativa/finanziaria complessa di società','Capo commessa di stabilimento','Responsabile progettazione specialistica','Responsabile lavori di stabilimento','Responsabile settore logistica stabilimento complesso','Responsabile logistica di stabilimento','Responsabile manutenzione specialistica stabilimento complesso','Responsabile preparazione lavori','Responsabile manutenzione di area','Capo area (farmaceutico)','Product manager senior','Ricercatore di mercato senior','Esperto tecnico di prodotto','Responsabile settore personale/organizzazione di unità operativa','Capo reparto impianti complessi','Capo laboratorio specialistico','Ricercatore senior','Tecnologo di ricerca senior','Tecnologo di processo senior','Sperimentatore clinico','Responsabile servizi generali e security di stabilimento di grandi dimensioni','Capo area/ispettore senior vendite','Tecnico di vendita ai mercati industriali']})},
    {codici:['B1','B2'],titolo:'Categoria B',riferimento:'art. 4, categoria B',
      testo:'Appartengono a questa categoria di inquadramento i lavoratori impiegati con funzioni direttive o che svolgono funzioni specialistiche equivalenti per importanza, responsabilità e delicatezza cui sono assegnate posizioni di lavoro che richiedono:',
      elenco:['conoscenza ed esperienza pluriennale in più attività, tra loro connesse, maturata anche in posizioni appartenenti a categorie inferiori;',
        'responsabilità economiche rilevanti connesse alla realizzazione di significativi programmi aziendali, che comportano l’assunzione di decisioni, con un ampio grado di autonomia […];',
        'eventuale guida, controllo e sviluppo di collaboratori.'],
      esempi:profili({
        B1:['Responsabile settore Protezione Ambientale e Sicurezza di stabilimento complesso','Analista controllo gestione','Product manager','Ricercatore di mercato','Addestratore tecnico scientifico','Informatore scientifico del farmaco','Capo ufficio commerciale/customer service','Capo aree/ispettore vendite'],
        B2:['Responsabile settore amministrativo','Analista programmatore','Progettista','Responsabile magazzini e spedizioni di stabilimento','Specialista acquisti','Specialista pianificazione','Capo manutenzione specialistica','Assistente di marketing','Specialista di prodotto','Responsabile amministrazione personale di unità operativa','Specialista di settore personale/organizzazione','Capo reparto','1° assistente di giornata impianti complessi','Specialista tecnico di laboratorio','Ricercatore','Tecnologo di ricerca','Tecnologo di processo','Responsabile servizi generali e sorveglianza di stabilimento','Specialista sviluppo mercato ad alta tecnologia','Operatore di vendita tecnico agrario senior','Responsabile Key Account']})},
    {codici:['C1','C2'],titolo:'Categoria C',riferimento:'art. 4, categoria C',
      testo:'Appartengono a questa categoria di inquadramento i lavoratori impiegati cui sono assegnate posizioni di lavoro che richiedono:',
      elenco:['esperienza specialistica consolidata delle mansioni svolte e delle problematiche connesse;',
        'controllo da parte del superiore esercitato preventivamente e/o direttamente solo per quanto riguarda i casi più impegnativi ed extraroutine;',
        'procedure/istruzioni normalmente di tipo generale che prevedono significativi margini di discrezionalità;',
        'eventuale guida e controllo di un gruppo di risorse umane.'],
      esempi:profili({
        C1:['Coordinatore ufficio amministrativo','Responsabile sala macchine','Assistente lavori','Disegnatore progettista','Coordinatore settore magazzino','Coordinatore lavori/assistente manutenzione','Responsabile in turno impianti complessi','Assistente di giornata impianti complessi','Operatore di vendite senior','Addetto esperto customer service'],
        C2:['Assistente laboratorio controllo','Addetto tecnico Protezione Ambientale e Sicurezza','Contabile esperto','Programmatore esperto','Capo squadra/turno centro di distribuzione','Addetto import/export','Addetto acquisti','Coordinatore tecnico/preparatore lavori','Addetto servizi di marketing','Assistente amministrazione personale','Responsabile in turno','Assistente di giornata impianto','Tecnico di laboratorio ricerca','Segretario/a di direzione','Operatore di vendita','Dimostratore tecnico esperto','Tecnico esperto di assistenza']})},
    {codici:['D1','D2','D3'],titolo:'Categoria D',riferimento:'art. 4, categoria D',
      testo:'Appartengono a questa categoria i lavoratori impiegati, qualifiche speciali e operai cui sono assegnate posizioni di lavoro che richiedono:',
      elenco:['conoscenze teoriche di base relative alla propria specializzazione acquisite anche attraverso percorsi formativi;',
        'esperienza approfondita di più specializzazioni tra loro strettamente collegate e di tutte le loro applicazioni operative;',
        'svolgimento in autonomia dei compiti secondo metodi e procedure solo parzialmente definite;',
        'controllo da parte del superiore, o di altre posizioni di coordinamento, dei risultati operativi;',
        'eventuale guida e controllo di collaboratori.'],
      esempi:profili({
        D1:['Contabile','Programmatore','Disegnatore','Addetto pianificazione produzione','Addetto amministrazione personale','Operatore tecnico polivalente di ricerca','Capo sorveglianza','Addetto tecnico di infermeria','Addetto customer service','Capo squadra/turno magazzino/spedizioni','Capo squadra','Coordinatore area fibre','Operatore tecnico polivalente manutenzione','Strumentista polivalente','Operatore tecnico polivalente impianti complessi','Conduttore impianti complessi','1° colorista'],
        D2:['Addetto collaudi','Operatore sala macchine e telecomunicazioni','Addetto centro di distribuzione','Operatore servizi di marketing','Segretario/a','Tecnico di assistenza','Dimostratore tecnico'],
        D3:['Addetto contabilità','Disegnatore particolarista','Operatore acquisti','Addetto spedizioni','Addetto settore personale','Tecnico di stabulario','Receptionist/centralinista','Addetto di infermeria','Operatore polivalente controllo qualità','Operatore antincendio','Operatore parco serbatoi','Operatore specialista di manutenzione','Conduttore impianto complesso','Operatore polivalente impianti','Preparatore','Operatore di ricerca','Colorista']})},
    {codici:['E1','E2','E3','E4'],titolo:'Categoria E',riferimento:'art. 4, categoria E',
      testo:'Appartengono a questa categoria i lavoratori impiegati, qualifiche speciali e operai cui sono assegnate posizioni di lavoro che richiedono:',
      elenco:['conoscenze professionali specifiche accompagnate da adeguata esperienza acquisita nell’esercizio della mansione;',
        'autonomia esecutiva nell’ambito di metodi e procedure sostanzialmente definiti;',
        'supervisione da parte della posizione superiore.'],
      esempi:profili({
        E1:['Operatore sala macchine','Capo squadra','Pompiere','Conduttore di impianto/conduttore di sezione impianto complesso','Operatore ambiente sterile','Operatore stazione di miscelazione'],
        E2:['Addetto di segreteria/servizi','Operatore controllo qualità','Operatore di manutenzione','Operatore polivalente esterno','Operatore polivalente','Operatore di laboratorio','Operatore polivalente fibre','Operatore di infermeria'],
        E3:['Addetto archivio disegni','Operatore magazzino/carrellista','Operatore generico manutenzione','Confezionatore','Operatore esterno','Operatore','Operatore fibre','Operatore laboratorio di ricerca','Stabularista','Guardia giurata/autista'],
        E4:['Campionatore','Operatore spedizioni','Confezionatore','Addetto operatore ausiliario','Operatore ausiliario fibre','Ausiliario laboratorio di ricerca','Ausiliario servizi']})},
    {codici:['F'],titolo:'Categoria F',riferimento:'art. 4, categoria F',
      testo:'Appartengono a questa categoria i lavoratori impiegati e operai che svolgono mansioni, lavori ed operazioni che richiedono generiche conoscenze professionali e capacità pratiche quali addetti a lavori di carico e scarico a mano, generici di pulizia, lavaggio manuale e analoghi lavori di fatica.'},
  ],
};

const congela=x=>{
  for(const c of x.categorie){Object.freeze(c.codici);(c.elenco||[]).length&&Object.freeze(c.elenco);Object.freeze(c);}
  return Object.freeze({...x,categorie:Object.freeze(x.categorie)});
};
const DECLARATORIE=Object.freeze({
  'gomma-plastica-industria-b371':congela(GOMMA_PLASTICA),
  'chimico-farmaceutico-industria-b011':congela(CHIMICO),
});

const declaratorie=id=>DECLARATORIE[id]||null;
const categoriaDi=(id,codice)=>{const x=declaratorie(id);return x&&x.categorie.find(c=>c.codici.includes(codice))||null;};
/* Caratteri citati di una categoria: testo più elenco. */
const lunghezza=c=>[c.testo||'',...(c.elenco||[])].join(' ').length;

module.exports={DECLARATORIE,declaratorie,categoriaDi,lunghezza};
