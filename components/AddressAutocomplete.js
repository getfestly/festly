'use client'
import { useState, useRef } from 'react'

// Baut einen lesbaren Anzeigenamen aus Photon-Properties zusammen
function buildLabel(p) {
  const street = p.street
    ? (p.housenumber ? `${p.street} ${p.housenumber}` : p.street)
    : null
  const parts = []
  if (p.name && p.name !== street) parts.push(p.name)
  if (street)                       parts.push(street)
  const cityPart = [p.postcode, p.city].filter(Boolean).join(' ')
  if (cityPart)                     parts.push(cityPart)
  return parts.join(', ') || p.name || ''
}

// Photon-Autocomplete für deutsche Adressen (photon.komoot.io).
// Props:
//   value              — aktueller Feldwert (location_address)
//   onChange(str)      — wird bei jeder Eingabe aufgerufen
//   onRegionDetected   — wird mit properties.state (oder null) aufgerufen wenn Vorschlag gewählt
//   required, className, placeholder — direkt an <input> weitergegeben
export default function AddressAutocomplete({
  value,
  onChange,
  onRegionDetected,
  required    = false,
  className   = '',
  placeholder = '',
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen]               = useState(false)
  const debounceRef                   = useRef(null)

  function handleInput(e) {
    const v = e.target.value
    onChange(v)
    clearTimeout(debounceRef.current)
    if (v.length < 3) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(v)}&lang=de&limit=5&bbox=5.8,47.2,15.1,55.1`
        )
        if (!res.ok) return
        const data = await res.json()
        const features = data.features ?? []
        setSuggestions(features)
        setOpen(features.length > 0)
      } catch {}
    }, 300)
  }

  // onMouseDown statt onClick — feuert vor onBlur, verhindert Race Condition
  // zwischen Blur (schließt Dropdown) und Klick (wählt Vorschlag).
  function handleSelect(feature) {
    const p = feature.properties
    onChange(buildLabel(p))
    onRegionDetected(p.state ?? null)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        required={required}
        value={value}
        onChange={handleInput}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {suggestions.map((feature, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(feature)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 transition-colors hover:text-purple-900"
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <span className="block truncate">{buildLabel(feature.properties)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
