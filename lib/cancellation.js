// ============================================================================
// FESTLY — Storno-Logik (gestaffelt nach Vorlauf)
// ============================================================================
// Diese Datei berechnet die Stornogebühr, wenn ein Kunde eine bestätigte,
// bereits bezahlte Buchung absagt. Die Staffel richtet sich nach dem Abstand
// zwischen Stornozeitpunkt und Event-Datum.
//
// Die Staffel ist bewusst als zentrale, leicht änderbare Tabelle gebaut —
// du kannst die Prozentsätze jederzeit anpassen, ohne anderen Code zu ändern.
// ============================================================================

/**
 * Storno-Staffel: je näher am Event, desto höher die Gebühr.
 * `minDaysBefore` = Mindestabstand zum Event in Tagen, ab dem dieser Satz gilt.
 * `feeRate`       = Anteil des Buchungsbetrags, der einbehalten wird.
 *
 * Beispiel: Storno 20 Tage vor Event -> 10 % Gebühr.
 *           Storno 3 Tage vor Event  -> 75 % Gebühr.
 */
const CANCELLATION_TIERS = [
  { minDaysBefore: 30, feeRate: 0.00 },  // 30+ Tage vorher: kostenlos
  { minDaysBefore: 14, feeRate: 0.10 },  // 14–29 Tage: 10 %
  { minDaysBefore: 7,  feeRate: 0.30 },  // 7–13 Tage:  30 %
  { minDaysBefore: 3,  feeRate: 0.50 },  // 3–6 Tage:   50 %
  { minDaysBefore: 0,  feeRate: 0.75 },  // 0–2 Tage:   75 %
];

/**
 * Berechnet die Stornogebühr in Cent.
 * @param {number} amountCents  Gesamtbetrag der Buchung in Cent
 * @param {Date}   eventDate    Datum des Events
 * @param {Date}   cancelDate   Zeitpunkt der Stornierung (Standard: jetzt)
 * @returns {{ feeCents:number, refundCents:number, feeRate:number, daysBefore:number }}
 */
function calculateCancellationFee(amountCents, eventDate, cancelDate = new Date()) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysBefore = Math.floor((eventDate.getTime() - cancelDate.getTime()) / msPerDay);

  // Passenden Staffel-Eintrag finden (höchste zutreffende Schwelle)
  const tier = CANCELLATION_TIERS.find(t => daysBefore >= t.minDaysBefore)
            || CANCELLATION_TIERS[CANCELLATION_TIERS.length - 1];

  const feeCents = Math.round(amountCents * tier.feeRate);
  const refundCents = amountCents - feeCents;

  return { feeCents, refundCents, feeRate: tier.feeRate, daysBefore };
}

module.exports = { calculateCancellationFee, CANCELLATION_TIERS };
