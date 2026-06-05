import { KATEGORIE_SLUGS, REGION_SLUGS, ANLASS_SLUGS, regionDbWerte, kategorieDbWerte } from '@/lib/seo-config'

export const revalidate = 86400

const STATISCHE_SEITEN = [
  { url: 'https://festly.de',                        lastModified: new Date(), priority: 1.0   },
  { url: 'https://festly.de/ueber-festly',           lastModified: new Date(), priority: 0.8   },
  { url: 'https://festly.de/faq',                    lastModified: new Date(), priority: 0.8   },
  { url: 'https://festly.de/imbisswagen-mieten',     lastModified: new Date(), priority: 0.8   },
  { url: 'https://festly.de/huepfburg-mieten',       lastModified: new Date(), priority: 0.8   },
  { url: 'https://festly.de/toilettenwagen-mieten',  lastModified: new Date(), priority: 0.8   },
  { url: 'https://festly.de/fahrgeschaefte-mieten',  lastModified: new Date(), priority: 0.8   },
  { url: 'https://festly.de/festzelt-mieten',        lastModified: new Date(), priority: 0.8   },
  { url: 'https://festly.de/betriebsfest-planen',    lastModified: new Date(), priority: 0.7   },
  { url: 'https://festly.de/stadtfest-planen',       lastModified: new Date(), priority: 0.7   },
]

export default async function sitemap() {
  let listings = []
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const res = await fetch(
        `${url}/rest/v1/listings?is_active=eq.true&select=category,region`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } }
      )
      if (res.ok) listings = await res.json()
    }
  } catch {
    return STATISCHE_SEITEN
  }

  const dynamischeSeiten = []
  for (const kategorieSlug of Object.keys(KATEGORIE_SLUGS)) {
    const katWerte = kategorieDbWerte(kategorieSlug)
    for (const regionSlug of Object.keys(REGION_SLUGS)) {
      const regWerte = regionDbWerte(regionSlug)
      const hatAnbieter = listings.some(
        l => katWerte.includes(l.category) && regWerte.includes(l.region)
      )
      if (hatAnbieter) {
        for (const anlassSlug of Object.keys(ANLASS_SLUGS)) {
          dynamischeSeiten.push({
            url: `https://festly.de/${kategorieSlug}/${regionSlug}/${anlassSlug}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
          })
        }
      }
    }
  }

  return [...STATISCHE_SEITEN, ...dynamischeSeiten]
}
