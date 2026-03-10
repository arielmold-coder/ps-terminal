import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

// Cache: 5 min quotes, 15 min historical, 30 min news/calendar
const quoteCache = new NodeCache({ stdTTL: 300 });
const historyCache = new NodeCache({ stdTTL: 900 });
const newsCache = new NodeCache({ stdTTL: 1800 });

const BASE_URL = 'https://www.investing.com';

const HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,he;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
};

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.text();
}

async function fetchJson(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: { ...HEADERS, 'X-Requested-With': 'XMLHttpRequest', ...(options?.headers || {}) },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return response.json();
}

// ====== Types ======
export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  type: string;
  exchange: string;
  url: string;
  flag?: string;
}

export interface Quote {
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

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndexQuote {
  name: string;
  url: string;
  price: number;
  change: number;
  changePercent: number;
  country: string;
}

export interface EconomicEvent {
  time: string;
  country: string;
  countryCode: string;
  importance: number;
  event: string;
  actual: string;
  forecast: string;
  previous: string;
}

export interface NewsItem {
  title: string;
  url: string;
  summary: string;
  source: string;
  time: string;
  imageUrl: string;
}

export interface CurrencyRate {
  name: string;
  url: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface CommodityQuote {
  name: string;
  url: string;
  price: number;
  change: number;
  changePercent: number;
}

// ====== Search ======
export async function searchInstruments(query: string): Promise<SearchResult[]> {
  const cacheKey = `search:${query}`;
  const cached = quoteCache.get<SearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await fetchJson(`${BASE_URL}/search/service/searchTopBar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `search_text=${encodeURIComponent(query)}`,
    });

    const results: SearchResult[] = [];
    const typeMap: Record<string, string> = {
      equities: 'stock', indices: 'index', etfs: 'etf', funds: 'fund',
      bonds: 'bond', currencies: 'currency', commodities: 'commodity', crypto: 'crypto',
    };

    for (const [category, items] of Object.entries(data)) {
      if (!Array.isArray(items)) continue;
      const type = typeMap[category] || category;
      for (const item of items as any[]) {
        results.push({
          id: String(item.pair_ID || item.pairId || ''),
          name: item.name || item.pair_name || '',
          symbol: item.symbol || '',
          type,
          exchange: item.exchange || item.exchange_name || '',
          url: item.link || '',
          flag: item.flag || '',
        });
      }
    }

    quoteCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.error('[Scraper] Search error:', err);
    return [];
  }
}

// ====== Quote ======
export async function getQuote(instrumentUrl: string): Promise<Quote | null> {
  const cacheKey = `quote:${instrumentUrl}`;
  const cached = quoteCache.get<Quote>(cacheKey);
  if (cached) return cached;

  try {
    const url = instrumentUrl.startsWith('http') ? instrumentUrl : `${BASE_URL}${instrumentUrl}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    const name = $('h1').first().text().trim();
    const price = parseFloat($('[data-test="instrument-price-last"]').text().replace(/,/g, '')) || 0;
    const change = parseFloat($('[data-test="instrument-price-change"]').text().replace(/,/g, '')) || 0;
    const changePercent = parseFloat($('[data-test="instrument-price-change-percent"]').text().replace(/[()%,]/g, '')) || 0;

    const overview: Record<string, string> = {};
    $('[data-test="overview-data-item"]').each((_i, el) => {
      const label = $(el).find('span').first().text().trim();
      const value = $(el).find('span').last().text().trim();
      if (label && value) overview[label.toLowerCase()] = value;
    });

    const quote: Quote = {
      name,
      symbol: $('[data-test="instrument-header-symbol"]').text().trim() || name,
      price, change, changePercent,
      open: parseFloat(overview['open']?.replace(/,/g, '') || '0'),
      high: parseFloat(overview["day's range"]?.split('-')[1]?.trim().replace(/,/g, '') || '0'),
      low: parseFloat(overview["day's range"]?.split('-')[0]?.trim().replace(/,/g, '') || '0'),
      prevClose: parseFloat(overview['prev. close']?.replace(/,/g, '') || '0'),
      volume: overview['volume'] || '-',
      marketCap: overview['market cap'] || '-',
      dayRange: overview["day's range"] || '-',
      yearRange: overview['52 wk range'] || '-',
      timestamp: new Date().toISOString(),
    };

    quoteCache.set(cacheKey, quote);
    return quote;
  } catch (err) {
    console.error('[Scraper] Quote error:', err);
    return null;
  }
}

// ====== Historical Data ======
export async function getHistoricalData(
  instrumentUrl: string,
  startDate?: string,
  endDate?: string
): Promise<HistoricalDataPoint[]> {
  const cacheKey = `history:${instrumentUrl}:${startDate}:${endDate}`;
  const cached = historyCache.get<HistoricalDataPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = instrumentUrl.startsWith('http') ? instrumentUrl : `${BASE_URL}${instrumentUrl}`;
    const histUrl = url.replace(/\/?$/, '-historical-data');
    const html = await fetchPage(histUrl);
    const $ = cheerio.load(html);

    const data: HistoricalDataPoint[] = [];
    $('table.historicalTbl tbody tr, table[data-test="historical-data-table"] tbody tr').each((_i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 6) {
        const dateStr = $(cells[0]).text().trim();
        const close = parseFloat($(cells[1]).text().replace(/,/g, '')) || 0;
        const open = parseFloat($(cells[2]).text().replace(/,/g, '')) || 0;
        const high = parseFloat($(cells[3]).text().replace(/,/g, '')) || 0;
        const low = parseFloat($(cells[4]).text().replace(/,/g, '')) || 0;
        const volText = $(cells[5]).text().replace(/,/g, '').trim();
        let volume = 0;
        if (volText.endsWith('M')) volume = parseFloat(volText) * 1_000_000;
        else if (volText.endsWith('K')) volume = parseFloat(volText) * 1_000;
        else if (volText.endsWith('B')) volume = parseFloat(volText) * 1_000_000_000;
        else volume = parseFloat(volText) || 0;

        data.push({ date: dateStr, open, high, low, close, volume });
      }
    });

    historyCache.set(cacheKey, data);
    return data;
  } catch (err) {
    console.error('[Scraper] Historical data error:', err);
    return [];
  }
}

// ====== Table Scraper (reusable for indices/currencies/commodities) ======
function scrapeTable(html: string): IndexQuote[] {
  const $ = cheerio.load(html);
  const items: IndexQuote[] = [];

  $('table tbody tr').each((_i, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 5) {
      const nameEl = $(cells[1]).find('a');
      const name = nameEl.text().trim();
      const url = nameEl.attr('href') || '';
      const price = parseFloat($(cells[2]).text().replace(/,/g, '')) || 0;
      const change = parseFloat($(cells[4]).text().replace(/,/g, '')) || 0;
      const changePercent = parseFloat($(cells[5]).text().replace(/[%,]/g, '')) || 0;
      if (name) items.push({ name, url, price, change, changePercent, country: '' });
    }
  });

  return items;
}

// ====== Market Data Endpoints ======
export async function getMajorIndices(): Promise<IndexQuote[]> {
  const cacheKey = 'major-indices';
  const cached = quoteCache.get<IndexQuote[]>(cacheKey);
  if (cached) return cached;
  try {
    const html = await fetchPage(`${BASE_URL}/indices/major-indices`);
    const result = scrapeTable(html);
    quoteCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Scraper] Major indices error:', err);
    return [];
  }
}

export async function getIsraeliIndices(): Promise<IndexQuote[]> {
  const cacheKey = 'israeli-indices';
  const cached = quoteCache.get<IndexQuote[]>(cacheKey);
  if (cached) return cached;
  try {
    const html = await fetchPage(`${BASE_URL}/indices/israel-indices`);
    const result = scrapeTable(html).map(i => ({ ...i, country: 'Israel' }));
    quoteCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Scraper] Israeli indices error:', err);
    return [];
  }
}

export async function getMajorCurrencies(): Promise<CurrencyRate[]> {
  const cacheKey = 'currencies';
  const cached = quoteCache.get<CurrencyRate[]>(cacheKey);
  if (cached) return cached;
  try {
    const html = await fetchPage(`${BASE_URL}/currencies/major`);
    const result = scrapeTable(html);
    quoteCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Scraper] Currencies error:', err);
    return [];
  }
}

export async function getMajorCommodities(): Promise<CommodityQuote[]> {
  const cacheKey = 'commodities';
  const cached = quoteCache.get<CommodityQuote[]>(cacheKey);
  if (cached) return cached;
  try {
    const html = await fetchPage(`${BASE_URL}/commodities/`);
    const result = scrapeTable(html);
    quoteCache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Scraper] Commodities error:', err);
    return [];
  }
}

// ====== Economic Calendar ======
export async function getEconomicCalendar(): Promise<EconomicEvent[]> {
  const cacheKey = 'eco-calendar';
  const cached = newsCache.get<EconomicEvent[]>(cacheKey);
  if (cached) return cached;

  try {
    const html = await fetchPage(`${BASE_URL}/economic-calendar/`);
    const $ = cheerio.load(html);

    const events: EconomicEvent[] = [];
    $('#economicCalendarData tbody tr.js-event-item').each((_i, row) => {
      const cells = $(row).find('td');
      const time = $(cells[0]).text().trim();
      const countryEl = $(cells[1]).find('span');
      const country = countryEl.attr('title') || '';
      const countryCode = countryEl.attr('class')?.match(/cemark-(\w+)/)?.[1] || '';
      const importance = $(cells[2]).find('i.grayFullBullishIcon').length || 0;
      const event = $(cells[3]).text().trim();
      const actual = $(cells[4]).text().trim();
      const forecast = $(cells[5]).text().trim();
      const previous = $(cells[6]).text().trim();

      if (event) {
        events.push({ time, country, countryCode, importance, event, actual, forecast, previous });
      }
    });

    newsCache.set(cacheKey, events);
    return events;
  } catch (err) {
    console.error('[Scraper] Calendar error:', err);
    return [];
  }
}

// ====== News ======
export async function getMarketNews(category: string = 'news'): Promise<NewsItem[]> {
  const cacheKey = `news:${category}`;
  const cached = newsCache.get<NewsItem[]>(cacheKey);
  if (cached) return cached;

  try {
    const urlMap: Record<string, string> = {
      news: '/news/latest-news',
      stocks: '/news/stock-market-news',
      forex: '/news/forex-news',
      commodities: '/news/commodities-news',
      economy: '/news/economy',
      crypto: '/news/cryptocurrency-news',
    };
    const path = urlMap[category] || urlMap.news;
    const html = await fetchPage(`${BASE_URL}${path}`);
    const $ = cheerio.load(html);

    const news: NewsItem[] = [];
    $('article[data-test="article-item"], .largeTitle article, .mediumTitle1 article, div.articleItem').each((_i, el) => {
      const titleEl = $(el).find('a[data-test="article-title-link"], a.title');
      const title = titleEl.text().trim();
      const url = titleEl.attr('href') || '';
      const summary = $(el).find('p[data-test="article-description"], .textDiv p').text().trim();
      const source = $(el).find('span[data-test="article-provider-name"], .articleDetails span').first().text().trim();
      const time = $(el).find('time, .date').text().trim();
      const imageUrl = $(el).find('img').attr('src') || $(el).find('img').attr('data-src') || '';

      if (title) {
        news.push({
          title,
          url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
          summary, source, time, imageUrl,
        });
      }
    });

    newsCache.set(cacheKey, news);
    return news;
  } catch (err) {
    console.error('[Scraper] News error:', err);
    return [];
  }
}

// ====== Default Watchlist ======
export const DEFAULT_WATCHLIST = [
  { name: 'TA 35', symbol: 'TA35', url: '/indices/ta-35', type: 'index' },
  { name: 'TA 90', symbol: 'TA90', url: '/indices/ta-90', type: 'index' },
  { name: 'TA 125', symbol: 'TA125', url: '/indices/ta-125', type: 'index' },
  { name: 'S&P 500', symbol: 'SPX', url: '/indices/us-spx-500', type: 'index' },
  { name: 'Nasdaq', symbol: 'IXIC', url: '/indices/nasdaq-composite', type: 'index' },
  { name: 'STOXX 50', symbol: 'STOXX50', url: '/indices/eu-stoxx50', type: 'index' },
  { name: 'USD/ILS', symbol: 'USDILS', url: '/currencies/usd-ils', type: 'currency' },
  { name: 'EUR/ILS', symbol: 'EURILS', url: '/currencies/eur-ils', type: 'currency' },
  { name: 'Gold', symbol: 'XAU', url: '/commodities/gold', type: 'commodity' },
  { name: 'Oil (Brent)', symbol: 'BRENT', url: '/commodities/brent-oil', type: 'commodity' },
];

export async function getWatchlistQuotes(): Promise<(Quote & { watchlistItem: typeof DEFAULT_WATCHLIST[0] })[]> {
  const results: (Quote & { watchlistItem: typeof DEFAULT_WATCHLIST[0] })[] = [];
  const batchSize = 3;
  for (let i = 0; i < DEFAULT_WATCHLIST.length; i += batchSize) {
    const batch = DEFAULT_WATCHLIST.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      const quote = await getQuote(item.url);
      if (quote) results.push({ ...quote, watchlistItem: item });
    });
    await Promise.allSettled(promises);
  }
  return results;
}

// ====== Cache Control ======
export function clearAllCaches(): void {
  quoteCache.flushAll();
  historyCache.flushAll();
  newsCache.flushAll();
}
