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
  'малина', 'клубника', 'черника', 'голубика', 'ежевика', 'смородина', 'крыжовник', 'вишня', 'черешня', 'слива', 'яблоки', 'груши', 'алыча',
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

// Role-specific keywords for demand filtering
const ROLE_KEYWORDS = {
  FARMER: [
    'малина', 'клубника', 'черника', 'голубика', 'ежевика', 'смородина', 'крыжовник', 'вишня', 'черешня', 'слива', 'яблоки', 'груши', 'алыча',
    'огурцы', 'помидоры', 'томаты', 'картофель', 'картошка', 'морковь', 'свекла', 'капуста', 'лук', 'чеснок',
    'перец', 'баклажаны', 'кабачки', 'тыква', 'арбуз', 'дыня', 'виноград', 'абрикосы', 'персики',
    'мёд', 'мед', 'молоко', 'сметана', 'творог', 'сыр', 'масло сливочное', 'яйца', 'яйцо',
    'мясо', 'свинина', 'говядина', 'баранина', 'курица', 'индейка', 'утка', 'гусь', 'кролик',
    'рыба', 'карп', 'щука', 'сом', 'форель', 'судак', 'окунь',
    'грибы', 'белые грибы', 'подберезовики', 'подосиновики', 'лисички', 'опята', 'маслята',
    'зелень', 'укроп', 'петрушка', 'салат', 'шпинат', 'базилик', 'мята', 'рассада', 'саженцы',
    'варенье', 'джем', 'компот', 'соленья', 'маринады', 'квашеная капуста', 'соки',
    'фермер', 'деревенское', 'домашнее', 'натуральное', 'органическое', 'эко',
  ],
  BLOGGER: [
    'книга', 'книги', 'курс', 'курсы', 'вебинар', 'тренинг', 'мастер-класс', 'мастеркласс',
    'мерч', 'футболка', 'худи', 'толстовка', 'кружка', 'чашка', 'постер', 'плакат',
    'блокнот', 'ежедневник', 'стикеры', 'наклейки', 'значки', 'брелок',
    'автограф', 'подпись', 'встреча', 'фотосессия', 'коллаборация',
    'подписка', 'доступ', 'контент', 'эксклюзив',
  ],
  ARTISAN: [
    'ручная работа', 'хендмейд', 'handmade', 'hand made', 'авторская', 'авторский',
    'украшение', 'украшения', 'бижутерия', 'серьги', 'кольцо', 'браслет', 'кулон', 'подвеска', 'колье',
    'керамика', 'глина', 'посуда ручной работы', 'ваза', 'горшок', 'тарелка ручной работы',
    'вязание', 'вязаное', 'вязаный', 'свитер ручной работы', 'шапка вязаная', 'шарф вязаный',
    'дерево', 'деревянное', 'резьба', 'мебель ручной работы', 'доска разделочная',
    'кожа', 'кожаное', 'сумка ручной работы', 'ремень ручной работы', 'кошелек ручной работы',
    'свечи', 'свеча ручной работы', 'мыло ручной работы', 'косметика ручной работы',
    'вышивка', 'вышитое', 'картина ручной работы', 'панно',
    'игрушка ручной работы', 'кукла ручной работы', 'мягкая игрушка',
  ],
  SHOP: [], // For SHOP role, we use the general demand (second-hand goods)
};

// Categories to include for each role
const ROLE_CATEGORIES = {
  FARMER: ['farmer-market', 'food', 'vegetables', 'fruits', 'dairy', 'meat', 'fish', 'honey', 'organic'],
  BLOGGER: ['books', 'courses', 'merch', 'digital', 'author-brand'],
  ARTISAN: ['handmade', 'jewelry', 'ceramics', 'woodwork', 'leather', 'textiles', 'art'],
  SHOP: [], // General goods
};

function matchesRoleKeywords(text, role) {
  if (!text || !role || role === 'SHOP') return false;
  const keywords = ROLE_KEYWORDS[role] || [];
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
}

// Seller-specific demand endpoint
router.get('/seller', async (req, res) => {
  try {
    const { lat, lng, radius = 5, role = 'SHOP' } = req.query;
    
    const latitude = parseFloat(lat) || 53.9;
    const longitude = parseFloat(lng) || 27.5667;
    const radiusKm = parseFloat(radius) || 5;
    const sellerRole = (role || 'SHOP').toUpperCase();

    console.log(`[SellerDemand] Fetching for role=${sellerRole}, lat=${latitude}, lng=${longitude}, radius=${radiusKm}km`);

    const geoHashPrecision = radiusKm <= 1 ? 5 : radiusKm <= 5 ? 4 : 3;
    const geoHash = ngeohash.encode(latitude, longitude, geoHashPrecision);
    const geoHashPrefix = geoHash.substring(0, geoHashPrecision - 1);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - 24);

    const uniqueQueries = new Map();

    // Get fresh searches from SearchLog
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
      { $limit: 50 }
    ]);

    for (const s of recentSearches) {
      const normalized = normalizeQuery(s._id);
      if (!normalized || normalized.length < 2) continue;
      
      // For non-SHOP roles, only include matching keywords
      if (sellerRole !== 'SHOP' && !matchesRoleKeywords(normalized, sellerRole)) continue;
      // For SHOP role, exclude farmer/artisan/blogger products
      if (sellerRole === 'SHOP' && containsStopWords(normalized)) continue;
      
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

    // Get aggregated stats from DemandStats
    const roleCategories = ROLE_CATEGORIES[sellerRole] || [];
    const query = {
      geoHash: { $regex: `^${geoHashPrefix}` },
      period: { $in: ['day', 'week'] },
      periodStart: { $gte: weekAgo },
      searchesCount: { $gte: 1 },
    };
    
    // For specific roles, filter by their categories if detected
    if (sellerRole !== 'SHOP' && roleCategories.length > 0) {
      query.$or = [
        { detectedCategoryId: { $in: roleCategories } },
        { detectedCategoryId: null }, // Also check null categories for keyword matching
      ];
    }

    const demands = await DemandStats.find(query)
      .sort({ searchesCount: -1 })
      .limit(100)
      .lean();

    for (const d of demands) {
      const queryText = d.normalizedQuery || '';
      const normalized = normalizeQuery(queryText);
      
      if (!normalized || normalized.length < 2) continue;
      if (uniqueQueries.has(normalized)) continue;
      
      // For non-SHOP roles, filter by keywords
      if (sellerRole !== 'SHOP' && !matchesRoleKeywords(normalized, sellerRole)) continue;
      // For SHOP role, exclude farmer/artisan/blogger products
      if (sellerRole === 'SHOP' && containsStopWords(normalized)) continue;
      
      uniqueQueries.set(normalized, {
        id: d._id.toString(),
        query: normalized,
        displayQuery: capitalizeFirst(normalized),
        category: d.detectedCategoryId,
        count: d.searchesCount,
        isHot: d.isHighDemand || d.searchesCount >= 5,
      });
    }

    // Expand to country-wide if not enough items
    if (uniqueQueries.size < 5) {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      
      const countryQuery = {
        period: { $in: ['week', 'month'] },
        periodStart: { $gte: monthAgo },
        searchesCount: { $gte: 3 },
      };
      
      if (sellerRole !== 'SHOP' && roleCategories.length > 0) {
        countryQuery.$or = [
          { detectedCategoryId: { $in: roleCategories } },
          { detectedCategoryId: null },
        ];
      }

      const countryDemands = await DemandStats.find(countryQuery)
        .sort({ searchesCount: -1 })
        .limit(50)
        .lean();

      for (const d of countryDemands) {
        const queryText = d.normalizedQuery || '';
        const normalized = normalizeQuery(queryText);
        
        if (!normalized || normalized.length < 2) continue;
        if (uniqueQueries.has(normalized)) continue;
        
        if (sellerRole !== 'SHOP' && !matchesRoleKeywords(normalized, sellerRole)) continue;
        if (sellerRole === 'SHOP' && containsStopWords(normalized)) continue;
        
        uniqueQueries.set(normalized, {
          id: d._id.toString(),
          query: normalized,
          displayQuery: capitalizeFirst(normalized),
          category: d.detectedCategoryId,
          count: d.searchesCount,
          isHot: d.isHighDemand || d.searchesCount >= 10,
        });
      }
    }

    const items = Array.from(uniqueQueries.values())
      .sort((a, b) => {
        if (a.isHot && !b.isHot) return -1;
        if (!a.isHot && b.isHot) return 1;
        return b.count - a.count;
      })
      .slice(0, 20);

    const totalSearches = items.reduce((sum, item) => sum + item.count, 0);

    console.log(`[SellerDemand] Returning ${items.length} items for ${sellerRole}`);

    res.json({
      items,
      radius: radiusKm,
      role: sellerRole,
      totalSearches,
    });
  } catch (error) {
    console.error('[SellerDemand] Error:', error);
    res.status(500).json({ error: 'Failed to fetch seller demand' });
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
