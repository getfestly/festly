/**
 * Erkennt Kontaktdaten in Freitext — Standard und verschleiert.
 * Wird im Chat (Client) und in Server Actions eingesetzt.
 */

const BLOCKED_PATTERNS = [
  // ── Telefon: Ländervorwahl ────────────────────────────────────────────────
  /(\+49|0049|00\s?49)[\s\-]?[\d\s\-\/]{6,}/,

  // Mobil-Nummern (01x...)
  /\b(01[5-7]\d[\s\-]?\d{3,}[\s\-]?\d{2,})/,

  // Allgemeines Telefon-Muster: Blöcke aus Ziffern mit Trennzeichen
  /\b\d{3,5}[\s\/\-]\d{3,8}\b/,

  // ── E-Mail (Standard) ────────────────────────────────────────────────────
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/,

  // ── URLs ────────────────────────────────────────────────────────────────
  /(https?:\/\/|www\.)[^\s]+/,
  /\b\w+\.(de|com|net|org|io|app|eu|info|biz|me|co)\b/i,

  // ── Social Media & Messenger ────────────────────────────────────────────
  /\b(instagram|whatsapp|telegram|signal|snapchat|tiktok|facebook|linkedin|twitter|discord|viber|wechat)\b/i,

  // Kurzformen mit Sonderzeichen: "ig: username", "wa=..." usw.
  /\b(ig|wa|tg|fb)\s*[:=@]?\s*\w+/i,

  // @Handle (überall)
  /@[a-zA-Z0-9_]{2,}/,

  // ── Verschleierte E-Mail ─────────────────────────────────────────────────
  // "name at domain dot de" / "name [at] domain"
  /\w+\s*(at|\[at\]|\(at\)|@|ät|ätt|att)\s*\w+\s*(dot|\[dot\]|\(dot\)|punkt|\.)\s*\w{2,}/i,

  // ── Verschleierte Domain ─────────────────────────────────────────────────
  // "festly . de" / "festly dot de"
  /\w+\s+\.\s+\w{2,4}\b/,
  /\w+\s+(dot|punkt)\s+\w{2,4}\b/i,

  // ── Ausgeschriebene Ziffern ──────────────────────────────────────────────
  // "null eins fünf..." (mind. 2 Wortzahlen hintereinander = Verdacht auf Nummer)
  /\b(null|zero|nul)\s+(eins?|one|zwei|two|drei|three|vier|four|fünf|five|sechs|six|sieben|seven|acht|eight|neun|nine)\b/i,
  /\b(eins?|zwei|drei|vier|fünf|sechs|sieben|acht|neun)[\s\-]+(eins?|zwei|drei|vier|fünf|sechs|sieben|acht|neun)[\s\-]+/i,

  // Einzelne Ziffern mit Trennzeichen: "0-1-5-1-2-3-4-5-6-7"
  /(\d[\s\-_\.]{1,3}){5,}/,

  // ── Direkte Aufforderung ─────────────────────────────────────────────────
  /\b(meine\s+nummer|mein\s+handy|ruf\s+mich\s+an|schreib\s+mir\s+(auf|bei|per)|kontaktier\w*|erreich\s+mich)\b/i,

  // ── Messenger-Nutzung via Präposition ────────────────────────────────────
  /\b(auf|bei|per|via|über)\s+(instagram|whatsapp|telegram|signal|snapchat|tiktok|facebook|insta|gramm|gram|discord|viber)\b/i,

  // ── Messenger mit eingebautem Leerzeichen ────────────────────────────────
  /\bin\s*sta\s*gram\b/i,
  /\bwhat\s*s?\s*app\b/i,
  /\bte\s*le\s*gram\b/i,
  /\bsig\s*nal\b/i,
  /\btik\s*tok\b/i,
]

/**
 * Normalisiert den Text vor der Prüfung:
 * – Entfernt Zero-Width- und unsichtbare Zeichen
 * – Wandelt Unicode-Look-alikes (Fullwidth @, Punkt-Varianten) in ASCII um
 */
function normalize(text) {
  return text
    // Zero-width-Zeichen entfernen
    .replace(/[​-‍﻿­]/g, '')
    // Fullwidth-Zeichen → ASCII (z.B. ＠ → @, ． → .)
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    // Mehrfach-Leerzeichen komprimieren
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Prüft Text auf unerlaubte Kontaktdaten.
 * @returns {string|null} Fehlermeldung oder null wenn sauber
 */
export function validateNoContact(text) {
  if (!text) return null
  const normalized = normalize(text)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(normalized)) {
      return 'Bitte teile keine Kontaktdaten im Chat. Die gesamte Kommunikation läuft über Festly.'
    }
  }
  return null
}

/**
 * Gibt true zurück wenn der Text Kontaktdaten enthält.
 */
export function containsContact(text) {
  return validateNoContact(text) !== null
}
