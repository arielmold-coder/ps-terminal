import { useState, useEffect } from 'react';
import api from '../api';

interface EconomicEvent {
  time: string;
  country: string;
  countryCode: string;
  importance: number;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
}

export default function EconomicCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [minImportance, setMinImportance] = useState(2);

  useEffect(() => {
    api.get('/market/calendar').then(({ data }) => setEvents(data)).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => e.importance >= minImportance);

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h3 className="text-white font-semibold text-sm">לוח כלכלי</h3>
        <div className="flex gap-1">
          {[1, 2, 3].map((level) => (
            <button key={level} onClick={() => setMinImportance(level)}
              className={`px-2 py-1 text-xs rounded transition ${minImportance === level ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {'★'.repeat(level)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">אין אירועים</div>
        ) : (
          <table className="w-full text-xs" dir="ltr">
            <thead className="bg-[#1a2332] sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left text-gray-400 font-medium">Time</th>
                <th className="px-2 py-2 text-left text-gray-400 font-medium">Country</th>
                <th className="px-2 py-2 text-left text-gray-400 font-medium">Event</th>
                <th className="px-2 py-2 text-right text-gray-400 font-medium">Actual</th>
                <th className="px-2 py-2 text-right text-gray-400 font-medium">Forecast</th>
                <th className="px-2 py-2 text-right text-gray-400 font-medium">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((e, i) => (
                <tr key={i} className="hover:bg-[#1a2332]">
                  <td className="px-2 py-2 text-gray-300 font-mono whitespace-nowrap">{e.time}</td>
                  <td className="px-2 py-2 text-gray-300" title={e.country}>{e.country.slice(0, 12)}</td>
                  <td className="px-2 py-2 text-white font-medium">
                    <div className="flex items-center gap-1">
                      <span className={`text-yellow-400`}>{'★'.repeat(e.importance)}</span>
                      <span className="truncate max-w-[150px]">{e.event}</span>
                    </div>
                  </td>
                  <td className={`px-2 py-2 text-right font-mono ${e.actual ? 'text-white font-bold' : 'text-gray-500'}`}>{e.actual || '-'}</td>
                  <td className="px-2 py-2 text-right font-mono text-gray-400">{e.forecast || '-'}</td>
                  <td className="px-2 py-2 text-right font-mono text-gray-400">{e.previous || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
