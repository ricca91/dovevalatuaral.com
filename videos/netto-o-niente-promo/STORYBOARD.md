---
format: 1080x1920
duration: 30s
message: "Due offerte, una domanda: quale ti lascia più soldi in tasca? Gioca a Netto o niente."
arc: Hook → Reveal → Come si gioca → Serie → Trappola → Sfida → CTA
audience: lavoratori dipendenti italiani 25-45 (Reels / TikTok / Shorts)
mode: autonomous
music: energetic electronic 128 BPM (synth locale, assets/bgm/netto-beat-128.mp3)
---

## Video direction

- **Beat grid:** 128 BPM, battuta = 1.875 s, 16 battute = 30.0 s. Ogni frame inizia su una battuta; le entrate forti cadono sui quarti (0.469 s). Nessuna voce: il ritmo lo dà la musica.
- **Palette (frame.md):** graphite `#1E1C2B` inchiostro e fondi scuri · bone `#EDEBE4` / chalk `#F7F6F1` carta · citron `#DCF06B` punteggio/vincitore · flux `#21D4E3` CTA (Scelgo A/B, Gioca) · signal red `#FF5F56` errore / "NIENTE" · blush/peri come decorazioni. Alternanza chiaro/scuro frame per frame per dare energia.
- **Type:** Archivo 800 espanso (display, maiuscolo, tracking negativo) · JetBrains Mono (etichette tra [ parentesi ], contatori, cifre €).
- **Motion grammar:** entrate secche su power4.out / expo.out, slam con overshoot leggero (back.out 1.6) solo sui colpi forti, split parola per parola, count-up sulle cifre, bordi neri 6px + ombre sfalsate nette che "atterrano". Camera: punch-in lenti sotto il contenuto. Hold brevi solo in F2 (logo) e F7 (CTA).
- **Negative list:** niente gradienti viola "AI", niente bokeh, niente angoli arrotondati (solo la pillola), niente slideshow (tutto dentro al primo 25% e poi fermo) né screensaver (cose che galleggiano a caso). Nessuna uscita nei frame non finali.
- **Keep-out:** tutto il contenuto sopra y ≈ 1600 (fascia UI di Reels/TikTok).

## Frame 1 — Hook: il lordo promette

- scene: "IL LORDO PROMETTE." sbatte parola per parola su bone; una RAL grande "43.500 €" si gonfia; poi "IL NETTO DECIDE." la taglia a metà
- duration: 3.75s
- transition_in: cut
- status: animated
- src: compositions/frames/01-hook.html
- type: hook
- blueprint: compose
- asset_candidates: none (tipografia)
- focal: kinetic type
- sfx: impact@0, whoosh@1.8, impact@1.875
- poster: 3.2

Scene 1 (0.0–1.87s): fondo bone con griglia a puntini; "IL LORDO" slam dall'alto, "PROMETTE." dal basso (0.47s); dietro, "43.500 €" in mono gigante sale con count-up e scala lenta, etichetta pill "RAL ANNUA".
Scene 2 (1.87–3.2s): sul downbeat un pannello graphite taglia in diagonale dal basso; "IL NETTO" in citron + "DECIDE." in chalk slam; la cifra RAL viene barrata da una riga signal red.
Scene 3 (3.2–3.75s): tiene, piccolo jitter della riga rossa.

## Frame 2 — Title: NETTO O NIENTE

- scene: logo "NETTO / O NIENTE" gigantesco in stamp, eyebrow "[ IL GIOCO DEL LORDO E DEL NETTO ]", pill "GRATIS · NEL BROWSER"
- duration: 3.75s
- transition_in: zoom-through 0.35s
- status: animated
- src: compositions/frames/02-title.html
- type: product_reveal
- blueprint: compose
- asset_candidates: none (logotipo tipografico)
- focal: wordmark
- sfx: impact@0, pop@1.4, pop@1.875
- poster: 2.6

Scene 1 (0.0–0.94s): fondo graphite; "NETTO" slam scala 1.4→1 con ombra citron che atterra; "O NIENTE" in peri a lettere sfalsate.
Scene 2 (0.94–1.87s): eyebrow mono si scrive a macchina sopra; stelle/badge inclinati entrano ai lati.
Scene 3 (1.87–3.75s): pill "GRATIS · SENZA ACCOUNT · NEL BROWSER" pop; hold con punch-in lento sul wordmark.

## Frame 3 — Come si gioca: due offerte, una scelta

- scene: le due carte offerta vere (A 37.500 € / B 43.500 €) entrano dai lati; "DUE OFFERTE." / "UNA SCELTA."; un tap su "Scelgo B" → "✓ PIÙ DISPONIBILE +2.294 €/anno"
- duration: 5.625s
- transition_in: push-slide UP 0.4s
- status: animated
- src: compositions/frames/03-scelta.html
- type: how_it_works
- blueprint: compose
- asset_candidates: assets/game/02-offers-r1.png
- focal: assets/game/02-offers-r1.png
- roles: 02-offers-r1 = cutout (le due carte, separate con clip)
- sfx: whoosh@0, whoosh@0.47, tick@2.3, ding@2.81, pop@3.75
- poster: 4.5

Scene 1 (0.0–0.94s): fondo bone; "DUE OFFERTE." kinetic in alto; carta A entra da sinistra inclinata −4°, carta B da destra +4° (screenshot reale ritagliato), con ombra graphite.
Scene 2 (0.94–2.81s): "QUALE TI LASCIA PIÙ SOLDI?" sotto in mono; cursore-dito (cerchio) si muove su B; tap = pressione carta (scale 0.96), anello che si espande.
Scene 3 (2.81–4.7s): carta A sfuma a grigio; su B timbro citron "✓ PIÙ DISPONIBILE"; badge "+2.294 € / ANNO" slam con count-up.
Scene 4 (4.7–5.63s): "UNA SCELTA." sostituisce "DUE OFFERTE." con swap per parola.

## Frame 4 — La serie: fino al primo errore

- scene: contatore gigante "X DI FILA" che corre 1→12 sul beat; caselle 1 2 3 … si riempiono; i nomi dei livelli lampeggiano (Riscaldamento → Occhio ai costi → Leggi tra le righe → Sfida fiscale)
- duration: 5.625s
- transition_in: squeeze 0.4s
- status: animated
- src: compositions/frames/04-serie.html
- type: feature
- blueprint: compose
- asset_candidates: none (motion graphics su dati reali del gioco)
- focal: contatore
- sfx: tick x12 sugli ottavi da 0.47s
- poster: 5.0

Scene 1 (0.0–0.94s): fondo graphite con griglia; eyebrow "[ UNA SERIE. FINO AL PRIMO ERRORE. ]" typewriter; numero "0" enorme citron.
Scene 2 (0.94–4.69s): il numero sale 1→12 ogni croma con piccolo slam; sotto una fila di caselle tratteggiate si riempie di citron; a destra una pila di etichetta-livello cambia: RISCALDAMENTO (1–3), OCCHIO AI COSTI (4–7), LEGGI TRA LE RIGHE (8–12); "DI FILA" fisso.
Scene 3 (4.69–5.63s): "QUANTO VAI AVANTI?" slam in chalk; il livello diventa "SFIDA FISCALE" in amber, tremolio di tensione.

## Frame 5 — La trappola: 14 mensilità?

- scene: confronto 13 reale (Verona): 32.500 € + welfare vs 33.000 € 14 mensilità; trappole evidenziate "14 MENSILITÀ?" "WELFARE?" "TRASPORTO?"; scelta sbagliata → X rossa enorme "NIENTE."
- duration: 3.75s
- transition_in: cut
- status: animated
- src: compositions/frames/05-trappola.html
- type: tension
- blueprint: compose
- asset_candidates: assets/game/05-offers-r13.png
- focal: assets/game/05-offers-r13.png
- roles: 05-offers-r13 = cutout
- sfx: impact@0, error@1.875, impact@1.875
- poster: 3.0

Scene 1 (0.0–1.87s, breakdown musicale): fondo bone; carte del confronto 13 con zoom lento; tre sticker inclinati si attaccano a ritmo di semiminima: "14 MENSILITÀ?" su B, "WELFARE 1.500 €?" su A, "VERONA" pill.
Scene 2 (1.87–3.1s): flash signal red; X rossa gigante con bordo nero slam al centro; la frame trema; "NIENTE." enorme chalk su rosso.
Scene 3 (3.1–3.75s): sotto, mono: "13 O 14 MENSILITÀ: STESSO NETTO ANNUO." hold.

## Frame 6 — La sfida: condividi lo scontrino

- scene: lo scontrino reale "12 risposte giuste di fila" sale dal basso in tilt; "12 DI FILA. TU ARRIVI A 13?"; bottoni LinkedIn / X / WhatsApp / Telegram pop
- duration: 3.75s
- transition_in: push-slide LEFT 0.4s
- status: animated
- src: compositions/frames/06-sfida.html
- type: social_proof
- blueprint: compose
- asset_candidates: assets/game/06-scontrino.png
- focal: assets/game/06-scontrino.png
- roles: 06-scontrino = cutout
- sfx: whoosh@0, pop@1.4, pop@1.64, pop@1.87, pop@2.1
- poster: 3.3

Scene 1 (0.0–0.94s): fondo citron con righe diagonali; scontrino entra dal basso ruotato −6° → −3°, ombra graphite.
Scene 2 (0.94–1.4s): headline "SFIDA UN AMICO." in alto, split.
Scene 3 (1.4–2.35s): quattro bottoni social pop uno per croma sotto lo scontrino.
Scene 4 (2.35–3.75s): pill "TU ARRIVI A 13?" slam inclinata sopra lo scontrino; hold.

## Frame 7 — CTA: gioca ora

- scene: "QUANTO VAI AVANTI?" poi bottone flux "GIOCA ORA" + "dovevalatuaral.com" + "GRATIS · SENZA ACCOUNT"
- duration: 3.75s
- transition_in: zoom-through 0.35s
- status: animated
- src: compositions/frames/07-cta.html
- type: cta
- blueprint: compose
- asset_candidates: none
- focal: bottone GIOCA
- sfx: impact@0, pop@0.94, impact@3.28
- poster: 3.0

Scene 1 (0.0–0.94s): fondo graphite; wordmark piccolo "NETTO O NIENTE" in alto; "QUANTO / VAI / AVANTI?" slam parola per croma, "AVANTI?" in citron.
Scene 2 (0.94–1.87s): bottone flux "GIOCA ORA ▸" pop con ombra citron; il dito lo preme sul downbeat.
Scene 3 (1.87–3.75s): URL "dovevalatuaral.com" in mono si scrive; pill "GRATIS · SENZA ACCOUNT"; ultimo colpo a 3.28 fa pulsare il bottone; poi fade dolce (frame finale).
