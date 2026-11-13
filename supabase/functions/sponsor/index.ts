// Sponsorship limitate (RIC-51) — l'unico pezzo di backend del sito.
// Quattro rotte, una funzione:
//   POST /webhook    Stripe: un pagamento completato diventa una prenotazione in approvazione
//   GET  /stato      la pagina di ringraziamento chiede a che punto è la prenotazione
//   GET|POST /admin  Riccardo approva, rifiuta o termina uno sponsor (token per prenotazione)
//   POST /scadenze   pg_cron ogni ora: libera gli slot scaduti e avvisa chi sta per scadere
// La funzione non conosce la chiave segreta di Stripe: verifica la firma del webhook e basta.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITO = Deno.env.get("SPONSOR_SITO") ?? "https://www.dovevalatuaral.com";
const MITTENTE = Deno.env.get("SPONSOR_MITTENTE") ?? "Dove va la tua RAL <sponsor@riccsartori.com>";
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

// I segreti stanno nel Vault del database (o nelle env della funzione, se impostate).
const cache = new Map<string, string>();
async function segreto(nome: string): Promise<string> {
  const env = Deno.env.get(nome.toUpperCase());
  if (env) return env;
  if (cache.has(nome)) return cache.get(nome)!;
  const { data, error } = await db.rpc("sponsor_segreto", { nome });
  if (error || !data) throw new Error(`Segreto mancante: ${nome}`);
  cache.set(nome, data as string);
  return data as string;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const euro = (cent: number | null, valuta = "eur") =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: (valuta || "eur").toUpperCase() }).format((cent ?? 0) / 100);
const giorno = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("it-IT", { dateStyle: "long", timeZone: "Europe/Rome" }).format(new Date(iso)) : "";

async function email(a: string | null | undefined, oggetto: string, righe: string[], rispondiA?: string) {
  if (!a) return;
  try {
    const html = `<div style="font:16px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#1E1C2B;max-width:560px">${
      righe.map((r) => `<p style="margin:0 0 14px">${r}</p>`).join("")
    }<p style="margin:24px 0 0;font-size:13px;color:#66617F">Dove va la tua RAL · <a href="${SITO}/sponsor/" style="color:#096B76">${SITO.replace("https://", "")}/sponsor/</a></p></div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${await segreto("resend_api_key")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: MITTENTE, to: [a], subject: oggetto, html, ...(rispondiA ? { reply_to: rispondiA } : {}) }),
    });
    if (!r.ok) console.error("Resend", r.status, await r.text());
  } catch (e) {
    console.error("Email non inviata", e);
  }
}
const admin = () => segreto("admin_email").catch(() => "");

// --- Stripe ---------------------------------------------------------------
async function firmaValida(corpo: string, intestazione: string | null, chiave: string): Promise<boolean> {
  if (!intestazione) return false;
  const parti = intestazione.split(",").map((p) => p.split("="));
  const t = parti.find(([k]) => k === "t")?.[1];
  const firme = parti.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !firme.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(chiave), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${t}.${corpo}`)));
  const atteso = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return firme.some((f) => {
    if (f.length !== atteso.length) return false;
    let diff = 0;
    for (let i = 0; i < f.length; i++) diff |= f.charCodeAt(i) ^ atteso.charCodeAt(i);
    return diff === 0;
  });
}

// Solo https, niente credenziali, niente spazi: il link finisce su ogni pagina del sito.
export function urlSicuro(grezzo: string): string | null {
  let s = String(grezzo ?? "").trim();
  if (!s) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (u.protocol !== "https:" || u.username || u.password || !u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function salvaLogo(id: string, sorgente: Blob | null, host?: string): Promise<string | null> {
  try {
    let file = sorgente;
    if (!file && host) {
      const r = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`);
      if (!r.ok) return null;
      file = await r.blob();
    }
    if (!file || file.size === 0 || file.size > 262144) return null;
    const tipo = file.type || "image/png";
    const est = ({ "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "image/gif": "gif" } as Record<string, string>)[tipo] ?? "ico";
    const percorso = `${id}-${Date.now().toString(36)}.${est}`;
    const { error } = await db.storage.from("sponsor-loghi").upload(percorso, file, { contentType: tipo, cacheControl: "31536000", upsert: true });
    if (error) return null;
    // In tabella resta l'URL dello storage; /api/sponsor lo riscrive sul dominio del sito.
    return db.storage.from("sponsor-loghi").getPublicUrl(percorso).data.publicUrl;
  } catch {
    return null;
  }
}

async function webhook(req: Request) {
  const corpo = await req.text();
  if (!(await firmaValida(corpo, req.headers.get("stripe-signature"), await segreto("stripe_webhook_secret")))) {
    return json({ errore: "firma non valida" }, 400);
  }
  const evento = JSON.parse(corpo);
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(evento.type)) return json({ ignorato: evento.type });
  const s = evento.data.object;
  const { data: imp } = await db.from("sponsor_impostazioni").select("*").single();
  if (!imp || s.payment_link !== imp.stripe_payment_link_id) return json({ ignorato: "altro prodotto" });
  if (!["paid", "no_payment_required"].includes(s.payment_status)) return json({ ignorato: "non ancora pagato" });

  const { data: gia } = await db.from("sponsor_prenotazioni").select("id").eq("stripe_session_id", s.id).maybeSingle();
  if (gia) return json({ ok: true, ripetuto: true });

  const campo = (k: string) => String((s.custom_fields ?? []).find((c: { key: string }) => c.key === k)?.text?.value ?? "").trim();
  const nome = (campo("nome") || s.customer_details?.business_name || s.customer_details?.name || "Sponsor").slice(0, 60);
  const claim = campo("claim").slice(0, 120);
  const urlGrezzo = campo("url");
  const url = urlSicuro(urlGrezzo);
  const preferito = Number(String(s.client_reference_id ?? "").match(/^slot-(\d{1,2})$/)?.[1]) || null;
  const mail = s.customer_details?.email ?? s.customer_email ?? null;

  const { data: p, error } = await db.rpc("sponsor_registra_pagamento", {
    p_session: s.id,
    p_intent: typeof s.payment_intent === "string" ? s.payment_intent : null,
    p_importo: s.amount_total ?? 0,
    p_valuta: s.currency ?? imp.valuta,
    p_nome: nome,
    p_claim: claim,
    p_url: url ?? `${SITO}/sponsor/`,
    p_email: mail,
    p_slot_preferito: preferito,
  });
  if (error || !p) {
    console.error("Registrazione fallita", error);
    return json({ errore: "registrazione fallita" }, 500); // Stripe riprova
  }

  if (url) {
    const logo = await salvaLogo(p.id, null, new URL(url).hostname);
    if (logo) await db.from("sponsor_prenotazioni").update({ logo_url: logo }).eq("id", p.id);
  }

  const inCoda = p.stato === "in_coda";
  const adminMail = await admin();
  await email(
    mail,
    inCoda ? "Pagamento ricevuto: slot al momento esauriti" : "Prenotazione ricevuta: il tuo slot sponsor è riservato",
    inCoda
      ? [
        `Ciao, abbiamo ricevuto il pagamento per <strong>${esc(nome)}</strong>.`,
        "Nel frattempo gli slot sono andati esauriti. Ti scriviamo entro un giorno lavorativo: puoi scegliere il rimborso completo oppure il primo slot che si libera.",
      ]
      : [
        `Ciao, abbiamo ricevuto il pagamento per <strong>${esc(nome)}</strong>: lo slot ${p.slot} è riservato a te.`,
        "Ogni sponsor viene approvato a mano, di solito entro un giorno lavorativo. I " + p.durata_giorni +
        " giorni partono dalla pubblicazione, non dal pagamento.",
        `Quello che pubblicheremo: <strong>${esc(nome)}</strong> — ${esc(claim)}<br>${esc(url ?? urlGrezzo)}`,
        "Il logo lo prendiamo dall'icona del tuo sito. Se ne preferisci un altro, o vuoi correggere qualcosa, rispondi a questa email.",
        "Se non possiamo pubblicarlo ricevi il rimborso completo.",
      ],
    adminMail || undefined,
  );
  await email(adminMail, `${inCoda ? "[IN CODA] " : ""}Nuovo sponsor da approvare: ${nome}`, [
    `<strong>${esc(nome)}</strong> — ${esc(claim)}`,
    `Link: ${esc(url ?? "NON VALIDO: " + urlGrezzo)}<br>Email: ${esc(mail)}<br>Pagato: ${euro(p.importo_cent, p.valuta)}<br>Slot: ${p.slot ?? "nessuno libero, in coda"}`,
    `<a href="${SITO}/sponsor/approva/?id=${p.id}&t=${p.admin_token}" style="display:inline-block;padding:10px 16px;background:#1E1C2B;color:#F7F6F1;text-decoration:none">Apri la pagina di approvazione</a>`,
    "Da lì puoi correggere nome, claim, link e logo, poi approvare o rifiutare. Se rifiuti, il rimborso si fa da Stripe.",
  ]);
  return json({ ok: true, id: p.id, stato: p.stato });
}

// --- Pagina di ringraziamento ---------------------------------------------
async function stato(req: Request) {
  const sessione = new URL(req.url).searchParams.get("sessione") ?? "";
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessione)) return json({ errore: "sessione non valida" }, 400);
  const { data } = await db.from("sponsor_prenotazioni").select("stato,slot,nome,claim,url,durata_giorni,fine").eq("stripe_session_id", sessione).maybeSingle();
  return data ? json({ trovata: true, ...data }) : json({ trovata: false }, 404);
}

// --- Approvazione ----------------------------------------------------------
async function amministra(req: Request) {
  const q = new URL(req.url).searchParams;
  const corpo = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const id = String(corpo.id ?? q.get("id") ?? "");
  const t = String(corpo.t ?? q.get("t") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id) || !/^[0-9a-f]{48}$/.test(t)) return json({ errore: "link non valido" }, 400);
  const { data: p } = await db.from("sponsor_prenotazioni").select("*").eq("id", id).eq("admin_token", t).maybeSingle();
  if (!p) return json({ errore: "prenotazione non trovata" }, 404);
  const pubblica = (r: Record<string, unknown>) => {
    const { admin_token: _t, ...resto } = r;
    return { ...resto, stripe_url: r.stripe_payment_intent ? `https://dashboard.stripe.com/payments/${r.stripe_payment_intent}` : null };
  };
  if (req.method === "GET") return json({ prenotazione: pubblica(p) });

  const azione = String(corpo.azione ?? "");
  const modifiche: Record<string, unknown> = {};
  if (typeof corpo.nome === "string" && corpo.nome.trim()) modifiche.nome = corpo.nome.trim().slice(0, 60);
  if (typeof corpo.claim === "string") modifiche.claim = corpo.claim.trim().slice(0, 120);
  if (typeof corpo.url === "string" && corpo.url.trim()) {
    const u = urlSicuro(corpo.url);
    if (!u) return json({ errore: "Il link deve essere un indirizzo https valido." }, 400);
    modifiche.url = u;
  }
  if (typeof corpo.logo_base64 === "string" && corpo.logo_base64) {
    const tipo = String(corpo.logo_tipo ?? "image/png");
    if (!/^image\/(png|jpeg|webp|svg\+xml|gif)$/.test(tipo)) return json({ errore: "Formato del logo non supportato." }, 400);
    const bytes = Uint8Array.from(atob(corpo.logo_base64), (c) => c.charCodeAt(0));
    const logo = await salvaLogo(p.id, new Blob([bytes], { type: tipo }));
    if (!logo) return json({ errore: "Logo non caricato: massimo 256 KB." }, 400);
    modifiche.logo_url = logo;
  }
  if (modifiche.nome) modifiche.logo_alt = `Logo di ${modifiche.nome}`;

  const ora = new Date();
  if (azione === "approva") {
    if (!["in_approvazione", "in_coda", "riservato"].includes(p.stato)) return json({ errore: `Non si può approvare una prenotazione nello stato «${p.stato}».` }, 409);
    let slot = p.slot;
    if (!slot) {
      await db.rpc("sponsor_scadi");
      const { data: tab } = await db.rpc("sponsor_tabellone");
      slot = (tab?.slot ?? []).find((s: { stato: string }) => s.stato === "disponibile")?.slot ?? null;
      if (!slot) return json({ errore: "Nessuno slot libero: aspetta che uno scada oppure rifiuta e rimborsa." }, 409);
    }
    Object.assign(modifiche, {
      stato: "attivo", slot, inizio: ora.toISOString(),
      fine: new Date(ora.getTime() + p.durata_giorni * 86400000).toISOString(), deciso_il: ora.toISOString(),
    });
  } else if (azione === "rifiuta") {
    if (!["in_approvazione", "in_coda", "riservato"].includes(p.stato)) return json({ errore: `Non si può rifiutare una prenotazione nello stato «${p.stato}».` }, 409);
    Object.assign(modifiche, { stato: "rifiutato", deciso_il: ora.toISOString() });
  } else if (azione === "termina") {
    if (p.stato !== "attivo") return json({ errore: "Solo uno sponsor attivo si può terminare." }, 409);
    Object.assign(modifiche, { stato: "scaduto", fine: ora.toISOString() });
  } else if (azione !== "salva") {
    return json({ errore: "azione sconosciuta" }, 400);
  }
  if (!Object.keys(modifiche).length) return json({ prenotazione: pubblica(p) });

  const { data: nuovo, error } = await db.from("sponsor_prenotazioni").update(modifiche).eq("id", p.id).select("*").single();
  if (error || !nuovo) return json({ errore: "Aggiornamento non riuscito: " + (error?.message ?? "") }, 500);

  const adminMail = await admin();
  if (azione === "approva") {
    await email(nuovo.email, `${nuovo.nome} è online su Dove va la tua RAL`, [
      `<strong>${esc(nuovo.nome)}</strong> è stato approvato ed è visibile da adesso su tutte le pagine del sito, nello slot ${nuovo.slot}.`,
      `Resta online fino al <strong>${giorno(nuovo.fine)}</strong>. Non c'è rinnovo automatico: qualche giorno prima della scadenza ti avvisiamo.`,
      `Il link pubblicato porta i parametri utm_source=dovevalatuaral, utm_medium=referral, utm_campaign=sponsor: li ritrovi nei tuoi analytics.`,
      `<a href="${SITO}/" style="color:#096B76">Guarda il sito</a>`,
    ], adminMail || undefined);
  } else if (azione === "rifiuta") {
    await email(nuovo.email, "Il tuo slot sponsor non è stato approvato", [
      `Ciao, non possiamo pubblicare <strong>${esc(nuovo.nome)}</strong> tra gli sponsor di Dove va la tua RAL.`,
      `Ricevi il rimborso completo di ${euro(nuovo.importo_cent, nuovo.valuta)} sul metodo di pagamento usato: di solito arriva in 5-10 giorni lavorativi.`,
      "Se pensi sia un errore, rispondi a questa email.",
    ], adminMail || undefined);
  }
  return json({ prenotazione: pubblica(nuovo) });
}

// --- Scadenze --------------------------------------------------------------
async function scadenze(req: Request) {
  if (req.headers.get("x-cron-secret") !== (await segreto("cron_secret"))) return json({ errore: "non autorizzato" }, 401);
  const adminMail = await admin();
  const { data: scaduti } = await db.rpc("sponsor_scadi");
  for (const p of scaduti ?? []) {
    await email(p.email, `Il tuo slot su Dove va la tua RAL è terminato`, [
      `I ${p.durata_giorni} giorni di <strong>${esc(p.nome)}</strong> sono finiti e lo slot è tornato disponibile.`,
      `Se vuoi restare online puoi prenotarne un altro quando vuoi: <a href="${SITO}/sponsor/" style="color:#096B76">${SITO.replace("https://", "")}/sponsor/</a>`,
    ], adminMail || undefined);
    await email(adminMail, `Slot ${p.slot} libero: ${p.nome} è scaduto`, [`Lo slot ${p.slot} è tornato disponibile.`]);
  }
  const tra3 = new Date(Date.now() + 3 * 86400000).toISOString();
  const { data: inScadenza } = await db.from("sponsor_prenotazioni").select("*").eq("stato", "attivo").lte("fine", tra3).is("avviso_scadenza_il", null);
  for (const p of inScadenza ?? []) {
    await db.from("sponsor_prenotazioni").update({ avviso_scadenza_il: new Date().toISOString() }).eq("id", p.id);
    await email(p.email, `Il tuo slot scade il ${giorno(p.fine)}`, [
      `<strong>${esc(p.nome)}</strong> resta online su Dove va la tua RAL fino al ${giorno(p.fine)}.`,
      `Non c'è rinnovo automatico. Se vuoi continuare, prenota un nuovo slot da <a href="${SITO}/sponsor/" style="color:#096B76">${SITO.replace("https://", "")}/sponsor/</a> e te lo attiviamo in continuità.`,
    ], adminMail || undefined);
  }
  return json({ scaduti: (scaduti ?? []).length, avvisati: (inScadenza ?? []).length });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  const rotta = new URL(req.url).pathname.replace(/\/+$/, "").split("/").pop();
  try {
    if (rotta === "webhook" && req.method === "POST") return await webhook(req);
    if (rotta === "stato" && req.method === "GET") return await stato(req);
    if (rotta === "admin" && (req.method === "GET" || req.method === "POST")) return await amministra(req);
    if (rotta === "scadenze" && req.method === "POST") return await scadenze(req);
    return json({ errore: "non trovato" }, 404);
  } catch (e) {
    console.error(e);
    return json({ errore: "errore interno" }, 500);
  }
});
