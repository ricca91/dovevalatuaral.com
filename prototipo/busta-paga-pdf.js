/* ============================================================
   BUSTA PAGA — IL LETTORE.

   L'unico file che tocca pdf.js. Prende un File, restituisce
   righe già ricomposte oppure un codice di errore.

   È un modulo ES perché la libreria lo è: questa pagina, sola
   nel sito, non si apre con un doppio clic da `file://`. La
   libreria sta in `vendor/pdfjs/`, non su una CDN, perché una
   pagina che promette «il PDF non lascia il browser» non può
   aprire una connessione a un terzo mentre lo legge.

   Il buffer del PDF vive dentro questa funzione e muore con
   lei: non viene mai serializzato, salvato o passato altrove.
   Gli errori della libreria non escono: potrebbero contenere
   pezzi del documento.
   ============================================================ */
import * as pdfjs from './vendor/pdfjs/pdf.min.mjs';

const E=globalThis.BUSTA_PAGA_ESTRAZIONE;

pdfjs.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).href;

function codiceDaErrore(errore){
  const nome=errore&&errore.name;
  if(nome==='PasswordException')return'PDF_PROTETTO';
  if(nome==='InvalidPDFException')return'PDF_ILLEGGIBILE';
  return'PDF_ILLEGGIBILE';
}

async function leggi(file){
  const ammesso=E.verificaFile({nome:file.name,tipo:file.type,dimensione:file.size});
  if(!ammesso.ok)return ammesso;

  let compito=null;
  try{
    compito=pdfjs.getDocument({
      data:new Uint8Array(await file.arrayBuffer()),
      isEvalSupported:false,      // un PDF costruito apposta non deve poter eseguire codice
      disableFontFace:true,       // non renderizziamo: i font non servono
      useSystemFonts:false,
      disableAutoFetch:true,
      enableXfa:false,
      // Serve anche solo per estrarre il testo: un cedolino composto con i
      // caratteri base del PDF (Helvetica, Times) non si legge senza queste
      // tabelle, e pdf.js fallisce l'intera pagina. Stanno accanto alla
      // libreria, quindi restano una richiesta allo stesso dominio.
      standardFontDataUrl:new URL('./vendor/pdfjs/standard_fonts/',import.meta.url).href,
    });
    const documento=await compito.promise;

    const pagine=documento.numPages;
    const entroILimiti=E.verificaDocumento({pagine});
    if(!entroILimiti.ok)return entroILimiti;

    const frammenti=[];
    for(let numero=1;numero<=pagine;numero++){
      const pagina=await documento.getPage(numero);
      const contenuto=await pagina.getTextContent();
      frammenti.push(...E.frammentiDaTextContent(contenuto.items,{pagina:numero}));
      pagina.cleanup();
    }

    const righe=E.componiRighe(frammenti);
    const leggibile=E.verificaRighe(righe);
    if(!leggibile.ok)return leggibile;
    return{ok:true,pagine,righe};
  }catch(errore){
    return{ok:false,codice:codiceDaErrore(errore)};
  }finally{
    // Distruggere il compito chiude il documento e il worker: qui se ne va il
    // buffer del PDF. Se fallisce non deve coprire l'errore vero.
    if(compito)await compito.destroy().catch(()=>{});
  }
}

globalThis.BUSTA_PAGA_PDF={leggi,versione:pdfjs.version};
globalThis.dispatchEvent(new Event('busta-paga-pdf-pronto'));
