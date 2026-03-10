import { useState } from 'react';
import InstrumentSearch from './components/InstrumentSearch';
import Watchlist from './components/Watchlist';
import MarketChart from './components/MarketChart';
import QuotePanel from './components/QuotePanel';
import EconomicCalendar from './components/EconomicCalendar';
import NewsFeed from './components/NewsFeed';
import MarketOverview from './components/MarketOverview';

type LayoutKey = 'default' | 'trading' | 'research';

export default function App() {
  const [selectedUrl, setSelectedUrl] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [activeLayout, setActiveLayout] = useState<LayoutKey>('default');

  function handleSelect(url: string, name: string) {
    setSelectedUrl(url);
    setSelectedName(name);
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Top bar */}
      <div className="bg-[#0d1b2a] border-b border-gray-700 px-4 py-3">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-7 h-7" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#0d1b2a" stroke="#3b82f6" strokeWidth="1.5" />
              <path d="M6 22L12 12L16 18L22 8L26 14" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <span className="text-white font-bold text-sm">PS Terminal</span>
              <span className="text-gray-500 text-xs mr-2"> | Market Workspace</span>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <InstrumentSearch onSelect={(r) => handleSelect(r.url, r.name)} />
          </div>

          {/* Layout presets */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-gray-400 text-xs ml-2">תצוגה:</span>
            {([
              { key: 'default' as const, label: 'ברירת מחדל' },
              { key: 'trading' as const, label: 'מסחר' },
              { key: 'research' as const, label: 'מחקר' },
            ]).map((preset) => (
              <button key={preset.key} onClick={() => setActiveLayout(preset.key)}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${activeLayout === preset.key
                  ? 'bg-blue-600 text-white' : 'bg-[#1a2332] text-gray-300 hover:bg-[#243447] border border-gray-600'}`}>
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace panels */}
      <div className="max-w-[1920px] mx-auto p-4">
        {activeLayout === 'default' && (
          <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="col-span-2 overflow-hidden">
              <Watchlist onSelectInstrument={handleSelect} />
            </div>
            <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 min-h-0">
                <MarketChart instrumentUrl={selectedUrl} instrumentName={selectedName} />
              </div>
              <div className="grid grid-cols-2 gap-4" style={{ height: '300px' }}>
                <EconomicCalendar />
                <NewsFeed />
              </div>
            </div>
            <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
              <QuotePanel instrumentUrl={selectedUrl} instrumentName={selectedName} />
              <div className="flex-1 min-h-0">
                <MarketOverview onSelectInstrument={handleSelect} />
              </div>
            </div>
          </div>
        )}

        {activeLayout === 'trading' && (
          <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="col-span-2 overflow-hidden">
              <Watchlist onSelectInstrument={handleSelect} />
            </div>
            <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 min-h-0">
                <MarketChart instrumentUrl={selectedUrl} instrumentName={selectedName} />
              </div>
              <div style={{ height: '280px' }}>
                <NewsFeed />
              </div>
            </div>
            <div className="col-span-3 overflow-hidden">
              <QuotePanel instrumentUrl={selectedUrl} instrumentName={selectedName} />
            </div>
          </div>
        )}

        {activeLayout === 'research' && (
          <div className="grid grid-cols-12 gap-4" style={{ height: 'calc(100vh - 80px)' }}>
            <div className="col-span-8 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 min-h-0">
                <MarketChart instrumentUrl={selectedUrl} instrumentName={selectedName} />
              </div>
              <div style={{ height: '300px' }}>
                <EconomicCalendar />
              </div>
            </div>
            <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 min-h-0">
                <MarketOverview onSelectInstrument={handleSelect} />
              </div>
              <div className="flex-1 min-h-0">
                <NewsFeed />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
