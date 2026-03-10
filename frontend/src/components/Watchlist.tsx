import { useState, useEffect } from 'react';
import api from '../api';

interface WatchlistItem {
  name: string;
  symbol: string;
  url: string;
  type: string;
}

interface QuoteData {
  price: number;
  change: number;
  changePercent: number;
  watchlistItem: WatchlistItem;
}

interface Props {
  onSelectInstrument: (url: string, name: string) => void;
}

export default function Watchlist({ onSelectInstrument }: Props) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');

  useEffect(() => {
    loadWatchlist();
    const interval = setInterval(loadWatchlist, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadWatchlist() {
    try {
      const { data } = await api.get('/market/watchlist');
      setItems(data.items);
      setQuotes(data.quotes);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  function handleClick(item: WatchlistItem) {
    setSelected(item.url);
    onSelectInstrument(item.url, item.name);
  }

  const quoteMap = new Map(quotes.map(q => [q.watchlistItem.url, q]));

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-white font-semibold text-sm">Watchlist</h3>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {loading ? (
          <div className="p-3 space-y-2">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {items.map((item) => {
              const quote = quoteMap.get(item.url);
              const isSelected = selected === item.url;
              return (
                <button
                  key={item.url}
                  onClick={() => handleClick(item)}
                  className={`w-full px-4 py-3 text-right transition ${isSelected ? 'bg-[#1a2d44]' : 'hover:bg-[#1a2332]'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-xs font-medium truncate">{item.name}</div>
                      <div className="text-gray-500 text-xs">{item.symbol}</div>
                    </div>
                    <div className="text-left mr-3">
                      {quote ? (
                        <>
                          <div className="text-white text-xs font-mono">
                            {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs font-mono ${quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-600 text-xs">--</div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
