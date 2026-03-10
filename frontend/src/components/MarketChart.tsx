import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Area,
} from 'recharts';
import api from '../api';

interface HistoricalPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  instrumentUrl: string;
  instrumentName: string;
}

type ChartType = 'line' | 'area' | 'candlestick';

export default function MarketChart({ instrumentUrl, instrumentName }: Props) {
  const [data, setData] = useState<HistoricalPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<ChartType>('area');
  const [showVolume, setShowVolume] = useState(true);

  useEffect(() => {
    if (!instrumentUrl) return;
    setLoading(true);
    api.get('/market/history', { params: { url: instrumentUrl } })
      .then(({ data: result }) => setData(result.reverse()))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [instrumentUrl]);

  if (!instrumentUrl) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 p-8 flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-sm">בחר מכשיר מה-Watchlist או חפש</p>
          <p className="text-xs text-gray-600 mt-1">Select an instrument to display chart</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 p-4 h-full min-h-[400px]">
        <div className="h-6 w-48 bg-gray-800 rounded animate-pulse mb-4" />
        <div className="h-64 bg-gray-800 rounded animate-pulse" />
      </div>
    );
  }

  const minPrice = data.length ? Math.min(...data.map(d => d.low || d.close)) : 0;
  const maxPrice = data.length ? Math.max(...data.map(d => d.high || d.close)) : 100;
  const priceRange = maxPrice - minPrice || 1;
  const yMin = minPrice - priceRange * 0.05;
  const yMax = maxPrice + priceRange * 0.05;

  const lastPrice = data[data.length - 1]?.close;
  const prevPrice = data[data.length - 2]?.close;
  const isUp = lastPrice >= prevPrice;

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold text-sm">{instrumentName}</h3>
          {lastPrice && (
            <span className={`text-sm font-mono font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
              {lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {(['line', 'area', 'candlestick'] as ChartType[]).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-2.5 py-1 text-xs rounded transition ${chartType === type ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {type === 'line' ? 'קו' : type === 'area' ? 'שטח' : 'נרות'}
            </button>
          ))}
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2.5 py-1 text-xs rounded transition ${showVolume ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            Vol
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4 min-h-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">אין נתונים היסטוריים</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={{ stroke: '#374151' }} interval={Math.floor(data.length / 8)} />
              <YAxis yAxisId="price" domain={[yMin, yMax]} tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={{ stroke: '#374151' }} tickFormatter={(v) => v.toLocaleString()} />
              {showVolume && (
                <YAxis yAxisId="volume" orientation="right" tick={{ fill: '#6b7280', fontSize: 9 }} tickLine={{ stroke: '#374151' }}
                  tickFormatter={(v) => v >= 1e6 ? `${(v / 1e6).toFixed(0)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}K` : String(v)} />
              )}
              <Tooltip
                contentStyle={{ backgroundColor: '#1e2d3d', border: '1px solid #374151', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: '#9ca3af' }}
                formatter={(value: number, name: string) => {
                  if (name === 'volume') return [value.toLocaleString(), 'מחזור'];
                  return [value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), name];
                }}
              />
              {showVolume && <Bar yAxisId="volume" dataKey="volume" fill="#1e3a5f" opacity={0.4} name="volume" />}
              {chartType === 'area' && <Area yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" fill="url(#areaGrad)" strokeWidth={2} name="מחיר" dot={false} />}
              {chartType === 'line' && <Line yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} name="מחיר" />}
              {chartType === 'candlestick' && (
                <>
                  <Line yAxisId="price" type="monotone" dataKey="high" stroke="#22c55e" strokeWidth={1} dot={false} name="גבוה" />
                  <Line yAxisId="price" type="monotone" dataKey="low" stroke="#ef4444" strokeWidth={1} dot={false} name="נמוך" />
                  <Line yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} name="סגירה" />
                  <Line yAxisId="price" type="monotone" dataKey="open" stroke="#f59e0b" strokeWidth={1} dot={false} name="פתיחה" />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
