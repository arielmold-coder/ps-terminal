import { useState, useEffect } from 'react';
import api from '../api';

interface Quote {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: string;
  marketCap: string;
  dayRange: string;
  yearRange: string;
  timestamp: string;
}

interface Props {
  instrumentUrl: string;
  instrumentName: string;
}

export default function QuotePanel({ instrumentUrl, instrumentName }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!instrumentUrl) return;
    setLoading(true);
    api.get('/market/quote', { params: { url: instrumentUrl } })
      .then(({ data }) => setQuote(data))
      .catch(() => setQuote(null))
      .finally(() => setLoading(false));
  }, [instrumentUrl]);

  if (!instrumentUrl) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 p-6 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 text-sm">בחר מכשיר להצגת ציטוט</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 p-4">
        <div className="h-6 w-32 bg-gray-800 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-5 bg-gray-800 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 p-6 text-center">
        <p className="text-gray-500 text-sm">לא ניתן לטעון ציטוט</p>
      </div>
    );
  }

  const isUp = quote.changePercent >= 0;
  const fields = [
    { label: 'פתיחה', value: quote.open ? quote.open.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-' },
    { label: 'סגירה קודמת', value: quote.prevClose ? quote.prevClose.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-' },
    { label: 'טווח יומי', value: quote.dayRange },
    { label: 'טווח שנתי', value: quote.yearRange },
    { label: 'מחזור', value: quote.volume },
    { label: 'שווי שוק', value: quote.marketCap },
  ];

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm truncate">{instrumentName || quote.name}</h3>
        <div className="text-gray-400 text-xs">{quote.symbol}</div>
      </div>

      <div className="p-4">
        {/* Main price */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-white font-mono">
            {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </div>
          <div className={`text-lg font-mono mt-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{quote.change.toFixed(2)} ({isUp ? '+' : ''}{quote.changePercent.toFixed(2)}%)
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {new Date(quote.timestamp).toLocaleTimeString('he-IL')}
          </div>
        </div>

        {/* Change indicator bar */}
        <div className="w-full h-1.5 bg-gray-700 rounded-full mb-4">
          <div
            className={`h-full rounded-full transition-all ${isUp ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(Math.abs(quote.changePercent) * 10, 100)}%` }}
          />
        </div>

        {/* Details */}
        <div className="space-y-2.5">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{f.label}</span>
              <span className="text-white font-mono">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
