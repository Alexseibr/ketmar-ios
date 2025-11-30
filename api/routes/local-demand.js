import express from 'express';
import DemandStats from '../../models/DemandStats.js';
import SearchLog from '../../models/SearchLog.js';
import ngeohash from 'ngeohash';

const router = express.Router();

const STOP_WORDS = [
  // Drugs
  'наркотик', 'наркота', 'трава', 'травка', 'гашиш', 'марихуана', 'кокаин', 'героин', 'амфетамин', 
  'мефедрон', 'соль', 'спайс', 'лсд', 'экстази', 'метамфетамин', 'опиум', 'морфин', 'кодеин', 'метадон',
  // Profanity
  'блядь', 'бля', 'сука', 'хуй', 'хуя', 'хуе', 'пизд', 'ебать', 'ебан', 'ебло', 'еблан', 'ебал', 
  'ебаш', 'ёб', 'нахуй', 'пиздец', 'мудак', 'мудила', 'залупа', 'хер', 'манда', 'ёбан',
  // Violence & weapons
  'убийство', 'убить', 'оружие', 'пистолет', 'автомат', 'бомба', 'взрывчатка', 'яд', 'отрава',
  // Adult content
  'детское порно', 'порно', 'секс услуги', 'проститут', 'эскорт',
  // Stolen/fake goods
  'краденое', 'украденн', 'ворован', 'паленое', 'левое', 'без документов', 'фальшив', 'поддельн',
  // Services (excluded from demand - we only want goods)
  'ремонт', 'услуги', 'мастер', 'электрик', 'сантехник', 'уборка', 'клининг', 
  'вывоз', 'грузоперевозки', 'перевозки', 'покос', 'вспашка', 'под ключ', 
  'монтаж', 'установка', 'демонтаж', 'строительство', 'отделка', 'сборка',
  'доставка', 'такси', 'курьер', 'ремонт квартир', 'ремонт техники', 'починка',
  'настройка', 'обслуживание', 'сервис', 'мастер на час', 'помощь', 'уход за садом',
  'стрижка газона', 'вырубка', 'спил', 'благоустройство', 'земляные работы',
  // Farmer products (excluded - this section is for second-hand goods only)
  'малина', 'клубника', 'черника', 'смородина', 'крыжовник', 'вишня', 'черешня', 'слива', 'яблоки', 'груши',
  'огурцы', 'помидоры', 'томаты', 'картофель', 'картошка', 'морковь', 'свекла', 'капуста', 'лук', 'чеснок',
  'перец', 'баклажаны', 'кабачки', 'тыква', 'арбуз', 'дыня', 'виноград', 'абрикосы', 'персики',
  'мёд', 'мед', 'молоко', 'сметана', 'творог', 'сыр', 'масло сливочное', 'яйца', 'яйцо',
  'мясо', 'свинина', 'говядина', 'баранина', 'курица', 'индейка', 'утка', 'гусь', 'кролик',
  'рыба', 'карп', 'щука', 'сом', 'форель', 'судак', 'окунь',
  'грибы', 'белые грибы', 'подберезовики', 'подосиновики', 'лисички', 'опята', 'маслята',
  'зелень', 'укроп', 'петрушка', 'салат', 'шпинат', 'базилик', 'мята', 'рассада', 'саженцы',
  'варенье', 'джем', 'компот', 'соленья', 'маринады', 'квашеная капуста', 'соки',
];

function containsStopWords(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return STOP_WORDS.some(word => lowerText.includes(word));
}

function normalizeQuery(query) {
  if (!query) return '';
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 3 } = req.query;
    
    const latitude = parseFloat(lat) || 53.9;
    const longitude = parseFloat(lng) || 27.5667;
    const radiusKm = parseFloat(radius) || 3;

    console.log(`[LocalDemand] Fetching demand for lat=${latitude}, lng=${longitude}, radius=${radiusKm}km`);

    const geoHashPrecision = radiusKm <= 0.5 ? 6 : radiusKm <= 1 ? 5 : radiusKm <= 5 ? 4 : 3;
    const geoHash = ngeohash.encode(latitude, longitude, geoHashPrecision);
    const geoHashPrefix = geoHash.substring(0, geoHashPrecision - 1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);

    const excludeCategories = ['uslugi', 'remont', 'master', 'electrician', 'plumber', 'services', 'cleaning', 'klining', 'farmer-market', 'food', 'vegetables', 'fruits', 'dairy', 'meat', 'fish', 'honey'];

    const uniqueQueries = new Map();

    // First, get fresh searches from SearchLog (last 24 hours) for immediate visibility
    const recentSearches = await SearchLog.aggregate([
      {
        $match: {
          createdAt: { $gte: hoursAgo },
          geoHash: { $regex: `^${geoHashPrefix}` },
        }
      },
      {
        $group: {
          _id: '$normalizedQuery',
          count: { $sum: 1 },
          lastSearch: { $max: '$createdAt' },
        }
      },
      { $match: { count: { $gte: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 30 }
    ]);

    for (const s of recentSearches) {
      const normalized = normalizeQuery(s._id);
      if (!normalized || normalized.length < 2) continue;
      if (containsStopWords(normalized)) continue;
      
      uniqueQueries.set(normalized, {
        id: `fresh_${normalized}`,
        query: normalized,
        displayQuery: capitalizeFirst(normalized),
        category: null,
        count: s.count,
        isHot: false,
        isFresh: true,
      });
    }

    // Then get aggregated stats from DemandStats
    const demands = await DemandStats.find({
      geoHash: { $regex: `^${geoHashPrefix}` },
      period: { $in: ['day', 'week'] },
      periodStart: { $gte: weekAgo },
      searchesCount: { $gte: 2 },
      detectedCategoryId: { $nin: excludeCategories },
    })
      .sort({ searchesCount: -1 })
      .limit(50)
      .lean();

    for (const d of demands) {
      const query = d.normalizedQuery || '';
      const normalized = normalizeQuery(query);
      
      if (!normalized || normalized.length < 2) continue;
      if (containsStopWords(normalized)) continue;
      
      if (!uniqueQueries.has(normalized)) {
        uniqueQueries.set(normalized, {
          id: d._id.toString(),
          query: normalized,
          displayQuery: capitalizeFirst(normalized),
          category: d.detectedCategoryId,
          count: d.searchesCount,
          isHot: d.isHighDemand || d.searchesCount >= 10,
        });
      } else {
        const existing = uniqueQueries.get(normalized);
        existing.count += d.searchesCount;
        if (d.isHighDemand || d.searchesCount >= 10) {
          existing.isHot = true;
        }
      }
    }

    let items = Array.from(uniqueQueries.values())
      .sort((a, b) => {
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
        return b.count - a.count;
      })
      .slice(0, 30);

    if (items.length < 5 && radiusKm < 20) {
      console.log(`[LocalDemand] Only ${items.length} items found, expanding search to country-wide`);
      
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const countryDemands = await DemandStats.find({
        period: { $in: ['week', 'month'] },
        periodStart: { $gte: monthAgo },
        searchesCount: { $gte: 5 },
        detectedCategoryId: { $nin: excludeCategories },
      })
        .sort({ searchesCount: -1 })
        .limit(30)
        .lean();

      for (const d of countryDemands) {
        const query = d.normalizedQuery || '';
        const normalized = normalizeQuery(query);
        
        if (!normalized || normalized.length < 2) continue;
        if (containsStopWords(normalized)) continue;
        if (uniqueQueries.has(normalized)) continue;
        
        uniqueQueries.set(normalized, {
          id: d._id.toString(),
          query: normalized,
          displayQuery: capitalizeFirst(normalized),
          category: d.detectedCategoryId,
          count: d.searchesCount,
          isHot: d.isHighDemand || d.searchesCount >= 15,
        });
      }

      items = Array.from(uniqueQueries.values())
        .sort((a, b) => {
          if (a.isHot && !b.isHot) return -1;
          if (!a.isHot && b.isHot) return 1;
          return b.count - a.count;
        })
        .slice(0, 30);
    }

    const totalSearches = items.reduce((sum, item) => sum + item.count, 0);

    console.log(`[LocalDemand] Returning ${items.length} items, ${items.filter(i => i.isHot).length} hot`);

    res.json({
      items,
      radius: radiusKm,
      totalSearches,
    });
  } catch (error) {
    console.error('[LocalDemand] Error:', error);
    res.status(500).json({ error: 'Failed to fetch local demand' });
  }
});

router.post('/log-search', async (req, res) => {
  try {
    const { query, lat, lng, resultsCount = 0 } = req.body;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: 'Query too short' });
    }

    const normalized = normalizeQuery(query);
    
    if (containsStopWords(normalized)) {
      console.log(`[LocalDemand] Blocked search query with stop words: ${query}`);
      return res.json({ logged: false, reason: 'blocked' });
    }

    const geoHash = lat && lng ? ngeohash.encode(lat, lng, 5) : 'unknown';

    const searchLog = new SearchLog({
      query: query.trim(),
      normalizedQuery: normalized,
      location: lat && lng ? {
        type: 'Point',
        coordinates: [lng, lat],
      } : undefined,
      geoHash,
      resultsCount,
    });

    await searchLog.save();

    res.json({ logged: true });
  } catch (error) {
    console.error('[LocalDemand] Error logging search:', error);
    res.status(500).json({ error: 'Failed to log search' });
  }
});

export default router;
