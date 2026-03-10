import { useState, useEffect } from 'react';
import api from '../api';

interface IndexQuote {
  name: string;
  url: string;
  price: number;
  change: number;
  changePercent: number;
}

interface Props {
  onSelectInstrument: (url: string, name: string) => void;
}

type Tab = 'israel' | 'world' | 'currencies' | 'commodities';

export default function MarketOverview({ onSelectInstrument }: Props) {
  const [tab, setTab] = useState<Tab>('israel');
  const [data, setData] = useState<IndexQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const endpoints: Record<Tab, string> = {
      israel: '/market/indices/israel',
      world: '/market/indices/major',
      currencies: '/market/currencies',
      commodities: '/market/commodities',
    };
    api.get(endpoints[tab]).then(({ data }) => setData(data)).catch(() => setData([])).finally(() => setLoading(false));
  }, [tab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'israel', label: 'ישראל' },
    { key: 'world', label: 'עולמי' },
    { key: 'currencies', label: 'מט"ח' },
    { key: 'commodities', label: 'סחורות' },
  ];

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h3 className="text-white font-semibold text-sm">סקירת שוק</h3>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-2.5 py-1 text-xs rounded-full transition ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-gray-800 rounded animate-pulse" />)}</div>
        ) : data.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">אין נתונים</div>
        ) : (
          <table className="w-full text-sm" dir="ltr">
            <thead className="bg-[#1a2332] sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-gray-400 font-medium text-xs">Name</th>
                <th className="px-3 py-2 text-right text-gray-400 font-medium text-xs">Last</th>
                <th className="px-3 py-2 text-right text-gray-400 font-medium text-xs">Chg%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.map((item, i) => (
                <tr key={i} onClick={() => item.url && onSelectInstrument(item.url, item.name)} className="hover:bg-[#1a2332] transition cursor-pointer">
                  <td className="px-3 py-2 text-white text-xs font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-white text-xs font-mono text-right">
                    {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={`px-3 py-2 text-xs font-mono text-right ${item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
