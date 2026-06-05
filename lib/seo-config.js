import { REGION_NAMES } from './constants'

// DB-Werte prüfen: SELECT DISTINCT category, region FROM listings WHERE is_active = true
// Aktuelle Werte: category ∈ {fahrgeschaefte, food}, region ∈ {nds, Niedersachsen}
// dbWert  = neuer Kategorie-Wert (neue Listings)
// dbAlias = Legacy-Wert (bestehende Listings) — beide werden in Abfragen berücksichtigt

export const KATEGORIE_SLUGS = {
  'imbisswagen-mieten': {
    dbWert: 'gastro',
    dbAlias: 'food',
    label: 'Imbisswagen & Foodtrucks',
    emoji: '🍔',
    beschreibung: 'Imbisswagen, Foodtrucks und Ausschankwagen von professionellen Anbietern in ganz Deutschland.',
  },
  'huepfburg-mieten': {
    dbWert: 'unterhaltung',
    label: 'Hüpfburgen & Eventmodule',
    emoji: '🎪',
    beschreibung: 'Hüpfburgen, Kletterburgen und Eventmodule für jeden Anlass.',
  },
  'fahrgeschaefte-mieten': {
    dbWert: 'fahrgeschaefte',
    label: 'Fahrgeschäfte & Karussells',
    emoji: '🎡',
    beschreibung: 'Fahrgeschäfte, Karussells und Autoscooter von professionellen Schaustellern.',
  },
  'festzelt-mieten': {
    dbWert: 'ausstattung',
    label: 'Festzelte & Pagodenzelten',
    emoji: '⛺',
    beschreibung: 'Festzelte, Bierzelte und Pagodenzelten für Veranstaltungen jeder Größe.',
  },
  'toilettenwagen-mieten': {
    dbWert: 'sanitaer_service',
    label: 'Toilettenwagen & Sanitäranlagen',
    emoji: '🚿',
    beschreibung: 'Mobile Toilettenwagen und Sanitärcontainer für Outdoor-Veranstaltungen.',
  },
  'eiswagen-mieten': {
    dbWert: 'gastro',
    dbAlias: 'food',
    label: 'Eiswagen & Süßigkeitenstände',
    emoji: '🍦',
    beschreibung: 'Mobile Eiswagen und Eisstände für Sommerfeste und Events.',
  },
  'buehne-mieten': {
    dbWert: 'ausstattung',
    label: 'Bühnen & Eventbühnen',
    emoji: '🎤',
    beschreibung: 'Mobile Bühnenanlagen für Konzerte, Stadtfeste und Firmenevents.',
  },
  'musikanlage-mieten': {
    dbWert: 'ausstattung',
    label: 'Musik- & Lichtanlagen',
    emoji: '🎵',
    beschreibung: 'PA-Anlagen, Musikanlagen und Lichtanlagen für Veranstaltungen.',
  },
  'spielgeschaefte-mieten': {
    dbWert: 'fahrgeschaefte',
    label: 'Spielgeschäfte & Schießbuden',
    emoji: '🎯',
    beschreibung: 'Schießbuden, Losbuden und Spielgeschäfte für Volksfeste und Events.',
  },
  'eventmodule-mieten': {
    dbWert: 'unterhaltung',
    label: 'Eventmodule & Attraktionen',
    emoji: '🎪',
    beschreibung: 'Bullriding, Menschenkicker, Kletterwände und weitere Eventattraktionen.',
  },
}

export const REGION_SLUGS = {
  'berlin':                 { label: 'Berlin',                dbWert: 'be'  },
  'hamburg':                { label: 'Hamburg',               dbWert: 'hh'  },
  'muenchen':               { label: 'München & Bayern',      dbWert: 'by'  },
  'nrw':                    { label: 'Nordrhein-Westfalen',   dbWert: 'nrw' },
  'niedersachsen':          { label: 'Niedersachsen',         dbWert: 'nds' },
  'hessen':                 { label: 'Hessen',                dbWert: 'he'  },
  'baden-wuerttemberg':     { label: 'Baden-Württemberg',     dbWert: 'bw'  },
  'rheinland-pfalz':        { label: 'Rheinland-Pfalz',       dbWert: 'rp'  },
  'sachsen':                { label: 'Sachsen',               dbWert: 'sn'  },
  'schleswig-holstein':     { label: 'Schleswig-Holstein',    dbWert: 'sh'  },
  'brandenburg':            { label: 'Brandenburg',           dbWert: 'bb'  },
  'sachsen-anhalt':         { label: 'Sachsen-Anhalt',        dbWert: 'st'  },
  'thueringen':             { label: 'Thüringen',             dbWert: 'th'  },
  'mecklenburg-vorpommern': { label: 'Mecklenburg-Vorpommern', dbWert: 'mv' },
  'saarland':               { label: 'Saarland',              dbWert: 'sl'  },
  'bremen':                 { label: 'Bremen',                dbWert: 'hb'  },
}

export const ANLASS_SLUGS = {
  'geburtstag':          { label: 'Geburtstag',           beschreibung: 'für deinen Geburtstag'        },
  'kindergeburtstag':    { label: 'Kindergeburtstag',     beschreibung: 'für den Kindergeburtstag'     },
  'hochzeit':            { label: 'Hochzeit',             beschreibung: 'für deine Hochzeit'           },
  'junggesellenabschied':{ label: 'Junggesellenabschied', beschreibung: 'für den JGA'                  },
  'gartenparty':         { label: 'Gartenparty',          beschreibung: 'für deine Gartenparty'        },
  'jubilaeum':           { label: 'Jubiläum',             beschreibung: 'für dein Jubiläum'            },
  'taufe':               { label: 'Taufe & Kommunion',    beschreibung: 'für Taufe oder Kommunion'     },
  'betriebsfest':        { label: 'Betriebsfest',         beschreibung: 'für dein Betriebsfest'        },
  'sommerfest':          { label: 'Sommerfest',           beschreibung: 'für dein Sommerfest'          },
  'weihnachtsfeier':     { label: 'Weihnachtsfeier',      beschreibung: 'für die Weihnachtsfeier'      },
  'teambuilding':        { label: 'Teambuilding',         beschreibung: 'für dein Teambuilding-Event'  },
  'stadtfest':           { label: 'Stadtfest',            beschreibung: 'für dein Stadtfest'           },
  'schuetzenfest':       { label: 'Schützenfest',         beschreibung: 'für dein Schützenfest'        },
  'vereinsfest':         { label: 'Vereinsfest',          beschreibung: 'für dein Vereinsfest'         },
  'weihnachtsmarkt':     { label: 'Weihnachtsmarkt',      beschreibung: 'für deinen Weihnachtsmarkt'   },
  'dorffest':            { label: 'Dorffest',             beschreibung: 'für dein Dorffest'            },
  'festival':            { label: 'Festival',             beschreibung: 'für dein Festival'            },
  'konzert':             { label: 'Konzert',              beschreibung: 'für dein Konzert'             },
  'schulveranstaltung':  { label: 'Schulveranstaltung',   beschreibung: 'für die Schulveranstaltung'   },
  'sportveranstaltung':  { label: 'Sportveranstaltung',   beschreibung: 'für deine Sportveranstaltung' },
}

// Alle DB-Werte einer Region (Shortcode + Vollname) — DB-Einträge sind inkonsistent
export function regionDbWerte(regionSlug) {
  const cfg = REGION_SLUGS[regionSlug]
  if (!cfg) return []
  const fullName = REGION_NAMES[cfg.dbWert]
  return fullName ? [cfg.dbWert, fullName] : [cfg.dbWert]
}

// Alle DB-Werte einer Kategorie (inkl. Legacy-Alias)
export function kategorieDbWerte(kategorieSlug) {
  const cfg = KATEGORIE_SLUGS[kategorieSlug]
  if (!cfg) return []
  return cfg.dbAlias ? [cfg.dbWert, cfg.dbAlias] : [cfg.dbWert]
}
