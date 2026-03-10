import { useState, useRef, useEffect } from 'react';
import api from '../api';

interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  type: string;
  exchange: string;
  url: string;
}

interface Props {
  onSelect: (result: { name: string; url: string }) => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  stock: { label: 'מניה', color: 'bg-blue-600' },
  index: { label: 'מדד', color: 'bg-purple-600' },
  etf: { label: 'ETF', color: 'bg-green-600' },
  fund: { label: 'קרן', color: 'bg-teal-600' },
  bond: { label: 'אג"ח', color: 'bg-yellow-600' },
  currency: { label: 'מט"ח', color: 'bg-orange-600' },
  commodity: { label: 'סחורה', color: 'bg-red-600' },
  crypto: { label: 'קריפטו', color: 'bg-pink-600' },
};

export default function InstrumentSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    clearTimeout(timerRef.current);
    if (value.length < 2) { setResults([]); setIsOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/market/search', { params: { q: value } });
        setResults(data);
        setIsOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }

  function handleSelect(result: SearchResult) {
    setQuery(result.name);
    setIsOpen(false);
    onSelect({ name: `${result.name} (${result.symbol})`, url: result.url });
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="חפש מניה, מדד, מט״ח, סחורה..."
          className="w-full bg-[#1a2332] border border-gray-600 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {loading && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-[#1a2332] border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {results.map((r, i) => {
            const typeInfo = TYPE_LABELS[r.type] || { label: r.type, color: 'bg-gray-600' };
            return (
              <button
                key={`${r.id}-${i}`}
                onClick={() => handleSelect(r)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#243447] transition text-right"
              >
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{r.name}</div>
                  <div className="text-gray-400 text-xs">{r.symbol} · {r.exchange}</div>
                </div>
                <span className={`${typeInfo.color} text-white text-xs px-2 py-0.5 rounded-full mr-2`}>
                  {typeInfo.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
