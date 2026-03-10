import { Router, Request, Response } from 'express';
import {
  searchInstruments, getQuote, getHistoricalData,
  getMajorIndices, getIsraeliIndices, getEconomicCalendar,
  getMarketNews, getMajorCurrencies, getMajorCommodities,
  getWatchlistQuotes, DEFAULT_WATCHLIST, clearAllCaches,
} from '../services/investing-scraper';

const router = Router();

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) return res.json([]);
    res.json(await searchInstruments(query));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/quote', async (req: Request, res: Response) => {
  try {
    const url = String(req.query.url || '').trim();
    if (!url) return res.status(400).json({ error: 'URL required' });
    const quote = await getQuote(url);
    if (!quote) return res.status(404).json({ error: 'Not found' });
    res.json(quote);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req: Request, res: Response) => {
  try {
    const url = String(req.query.url || '').trim();
    if (!url) return res.status(400).json({ error: 'URL required' });
    res.json(await getHistoricalData(url, req.query.start as string, req.query.end as string));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/watchlist', async (_req: Request, res: Response) => {
  try {
    res.json({ items: DEFAULT_WATCHLIST, quotes: await getWatchlistQuotes() });
  } catch {
    res.json({ items: DEFAULT_WATCHLIST, quotes: [] });
  }
});

router.get('/indices/major', async (_req: Request, res: Response) => {
  try { res.json(await getMajorIndices()); } catch { res.json([]); }
});

router.get('/indices/israel', async (_req: Request, res: Response) => {
  try { res.json(await getIsraeliIndices()); } catch { res.json([]); }
});

router.get('/currencies', async (_req: Request, res: Response) => {
  try { res.json(await getMajorCurrencies()); } catch { res.json([]); }
});

router.get('/commodities', async (_req: Request, res: Response) => {
  try { res.json(await getMajorCommodities()); } catch { res.json([]); }
});

router.get('/calendar', async (_req: Request, res: Response) => {
  try { res.json(await getEconomicCalendar()); } catch { res.json([]); }
});

router.get('/news', async (req: Request, res: Response) => {
  try { res.json(await getMarketNews(String(req.query.category || 'news'))); } catch { res.json([]); }
});

router.post('/clear-cache', (_req: Request, res: Response) => {
  clearAllCaches();
  res.json({ success: true });
});

export default router;
