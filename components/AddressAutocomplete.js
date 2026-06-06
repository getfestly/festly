'use client'
import { useState, useRef } from 'react'

// Nominatim-Autocomplete für deutsche Adressen.
// Props:
//   value              — aktueller Feldwert (location_address)
//   onChange(str)      — wird bei jeder Eingabe aufgerufen
//   onRegionDetected   — wird mit address.state (oder null) aufgerufen wenn Vorschlag gewählt
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
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(v)}&countrycode=de&format=json&addressdetails=1&limit=5`,
          { headers: { 'User-Agent': 'Festly/1.0 (https://festly.de)' } }
        )
        if (!res.ok) return
        const data = await res.json()
        setSuggestions(data)
        setOpen(data.length > 0)
      } catch {}
    }, 400)
  }

  // onMouseDown statt onClick — feuert vor onBlur, verhindert dass Dropdown
  // sich schließt bevor der Klick registriert wird.
  function handleSelect(item) {
    onChange(item.display_name)
    onRegionDetected(item.address?.state ?? null)
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
          {suggestions.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={() => handleSelect(item)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 transition-colors hover:text-purple-900"
                style={{ '--tw-bg-opacity': '1' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <span className="block truncate">{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
