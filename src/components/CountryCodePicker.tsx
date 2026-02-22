import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface Country {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

const countries: Country[] = [
  { name: "United States", code: "US", dial: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dial: "+44", flag: "🇬🇧" },
  { name: "Canada", code: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "Australia", code: "AU", dial: "+61", flag: "🇦🇺" },
  { name: "India", code: "IN", dial: "+91", flag: "🇮🇳" },
  { name: "Germany", code: "DE", dial: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Brazil", code: "BR", dial: "+55", flag: "🇧🇷" },
  { name: "Japan", code: "JP", dial: "+81", flag: "🇯🇵" },
  { name: "South Korea", code: "KR", dial: "+82", flag: "🇰🇷" },
  { name: "China", code: "CN", dial: "+86", flag: "🇨🇳" },
  { name: "Mexico", code: "MX", dial: "+52", flag: "🇲🇽" },
  { name: "Italy", code: "IT", dial: "+39", flag: "🇮🇹" },
  { name: "Spain", code: "ES", dial: "+34", flag: "🇪🇸" },
  { name: "Netherlands", code: "NL", dial: "+31", flag: "🇳🇱" },
  { name: "Sweden", code: "SE", dial: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "NO", dial: "+47", flag: "🇳🇴" },
  { name: "Denmark", code: "DK", dial: "+45", flag: "🇩🇰" },
  { name: "Finland", code: "FI", dial: "+358", flag: "🇫🇮" },
  { name: "Switzerland", code: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Austria", code: "AT", dial: "+43", flag: "🇦🇹" },
  { name: "Belgium", code: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Portugal", code: "PT", dial: "+351", flag: "🇵🇹" },
  { name: "Ireland", code: "IE", dial: "+353", flag: "🇮🇪" },
  { name: "Poland", code: "PL", dial: "+48", flag: "🇵🇱" },
  { name: "Russia", code: "RU", dial: "+7", flag: "🇷🇺" },
  { name: "Turkey", code: "TR", dial: "+90", flag: "🇹🇷" },
  { name: "South Africa", code: "ZA", dial: "+27", flag: "🇿🇦" },
  { name: "Nigeria", code: "NG", dial: "+234", flag: "🇳🇬" },
  { name: "Kenya", code: "KE", dial: "+254", flag: "🇰🇪" },
  { name: "Egypt", code: "EG", dial: "+20", flag: "🇪🇬" },
  { name: "Saudi Arabia", code: "SA", dial: "+966", flag: "🇸🇦" },
  { name: "United Arab Emirates", code: "AE", dial: "+971", flag: "🇦🇪" },
  { name: "Israel", code: "IL", dial: "+972", flag: "🇮🇱" },
  { name: "Singapore", code: "SG", dial: "+65", flag: "🇸🇬" },
  { name: "Malaysia", code: "MY", dial: "+60", flag: "🇲🇾" },
  { name: "Thailand", code: "TH", dial: "+66", flag: "🇹🇭" },
  { name: "Philippines", code: "PH", dial: "+63", flag: "🇵🇭" },
  { name: "Indonesia", code: "ID", dial: "+62", flag: "🇮🇩" },
  { name: "Vietnam", code: "VN", dial: "+84", flag: "🇻🇳" },
  { name: "Pakistan", code: "PK", dial: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "BD", dial: "+880", flag: "🇧🇩" },
  { name: "Argentina", code: "AR", dial: "+54", flag: "🇦🇷" },
  { name: "Colombia", code: "CO", dial: "+57", flag: "🇨🇴" },
  { name: "Chile", code: "CL", dial: "+56", flag: "🇨🇱" },
  { name: "Peru", code: "PE", dial: "+51", flag: "🇵🇪" },
  { name: "New Zealand", code: "NZ", dial: "+64", flag: "🇳🇿" },
  { name: "Greece", code: "GR", dial: "+30", flag: "🇬🇷" },
  { name: "Czech Republic", code: "CZ", dial: "+420", flag: "🇨🇿" },
  { name: "Romania", code: "RO", dial: "+40", flag: "🇷🇴" },
  { name: "Hungary", code: "HU", dial: "+36", flag: "🇭🇺" },
  { name: "Ukraine", code: "UA", dial: "+380", flag: "🇺🇦" },
  { name: "Ghana", code: "GH", dial: "+233", flag: "🇬🇭" },
  { name: "Morocco", code: "MA", dial: "+212", flag: "🇲🇦" },
  { name: "Jamaica", code: "JM", dial: "+1-876", flag: "🇯🇲" },
  { name: "Trinidad and Tobago", code: "TT", dial: "+1-868", flag: "🇹🇹" },
  { name: "Costa Rica", code: "CR", dial: "+506", flag: "🇨🇷" },
  { name: "Panama", code: "PA", dial: "+507", flag: "🇵🇦" },
  { name: "Qatar", code: "QA", dial: "+974", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", dial: "+965", flag: "🇰🇼" },
  { name: "Iraq", code: "IQ", dial: "+964", flag: "🇮🇶" },
  { name: "Jordan", code: "JO", dial: "+962", flag: "🇯🇴" },
  { name: "Lebanon", code: "LB", dial: "+961", flag: "🇱🇧" },
  { name: "Ethiopia", code: "ET", dial: "+251", flag: "🇪🇹" },
  { name: "Tanzania", code: "TZ", dial: "+255", flag: "🇹🇿" },
  { name: "Uganda", code: "UG", dial: "+256", flag: "🇺🇬" },
  { name: "Sri Lanka", code: "LK", dial: "+94", flag: "🇱🇰" },
  { name: "Nepal", code: "NP", dial: "+977", flag: "🇳🇵" },
  { name: "Cambodia", code: "KH", dial: "+855", flag: "🇰🇭" },
  { name: "Myanmar", code: "MM", dial: "+95", flag: "🇲🇲" },
  { name: "Taiwan", code: "TW", dial: "+886", flag: "🇹🇼" },
  { name: "Hong Kong", code: "HK", dial: "+852", flag: "🇭🇰" },
];

interface CountryCodePickerProps {
  selected: Country;
  onSelect: (country: Country) => void;
}

export function CountryCodePicker({ selected, onSelect }: CountryCodePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-12 px-3 rounded-l-md border border-r-0 border-input bg-secondary/50 hover:bg-secondary transition-colors text-sm"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="font-medium text-foreground">{selected.dial}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 max-h-72 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-md bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No countries found
              </div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onSelect(country);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary/70 transition-colors ${
                    selected.code === country.code ? "bg-secondary" : ""
                  }`}
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="flex-1 text-left text-foreground">{country.name}</span>
                  <span className="text-muted-foreground font-medium">{country.dial}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { countries };
export const defaultCountry = countries[0]; // US
