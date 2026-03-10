import { useState, useEffect } from 'react';
import api from '../api';

interface NewsItem {
  title: string;
  url: string;
  summary: string;
  source: string;
  time: string;
  imageUrl: string;
}

type Category = 'news' | 'stocks' | 'forex' | 'commodities' | 'economy' | 'crypto';

export default function NewsFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category>('news');

  useEffect(() => {
    setLoading(true);
    api.get('/market/news', { params: { category } }).then(({ data }) => setNews(data)).catch(() => setNews([])).finally(() => setLoading(false));
  }, [category]);

  const categories: { key: Category; label: string }[] = [
    { key: 'news', label: 'כללי' },
    { key: 'stocks', label: 'מניות' },
    { key: 'forex', label: 'מט"ח' },
    { key: 'commodities', label: 'סחורות' },
    { key: 'crypto', label: 'קריפטו' },
  ];

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-700 overflow-hidden h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
        <h3 className="text-white font-semibold text-sm">חדשות</h3>
        <div className="flex gap-1">
          {categories.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={`px-2 py-1 text-xs rounded transition ${category === c.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-800 rounded animate-pulse" />)}</div>
        ) : news.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">אין חדשות</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {news.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="block px-4 py-3 hover:bg-[#1a2332] transition">
                <div className="flex gap-3">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="w-16 h-12 rounded object-cover flex-shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-white text-xs font-medium leading-snug line-clamp-2" dir="ltr">{item.title}</h4>
                    {item.summary && <p className="text-gray-400 text-xs mt-1 line-clamp-1" dir="ltr">{item.summary}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {item.source && <span className="text-blue-400 text-xs">{item.source}</span>}
                      {item.time && <span className="text-gray-500 text-xs">{item.time}</span>}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
