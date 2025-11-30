import geoZoneClassifier from './GeoZoneClassifier.js';
import Ad from '../models/Ad.js';
import SellerProfile from '../models/SellerProfile.js';
import Season from '../models/Season.js';
import ngeohash from 'ngeohash';
import { fetchAdsProgressiveRadius } from '../utils/fetchAdsProgressiveRadius.js';

const BLOCK_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const ZONE_BLOCK_PRIORITY = {
  village: [
    'banners',
    'darom',
    'second_hand',
    'garden_help',
    'machinery',
    'tractor_services',
    'farmer',
    'village_offers',
    'demand',
    'handmade',
    'seasonal_fairs',
  ],
  suburb: [
    'banners',
    'darom',
    'second_hand',
    'garden_help',
    'lawn_mowing',
    'cleaning_house',
    'repair_house',
    'snow_cleaning',
    'local_shops',
    'author_brands',
    'demand',
    'trending',
    'seasonal_fairs',
  ],
  city_center: [
    'banners',
    'darom',
    'second_hand',
    'tech_repair',
    'beauty',
    'cleaning',
    'home_services',
    'local_shops',
    'author_brands',
    'trending',
    'demand',
    'handmade',
    'seasonal_fairs',
  ],
};

const BLOCK_CONFIGS = {
  banners: {
    title: 'Акции',
    fetchData: async () => [],
  },
  darom: {
    title: 'Отдам даром',
    subtitle: 'Бесплатные вещи рядом',
    icon: 'gift',
    accentColor: '#ec4899',
    link: '/category/darom',
    categoryFilter: { isFreeGiveaway: true },
  },
  farmer: {
    title: 'Фермерские товары',
    subtitle: 'Свежее с фермы',
    icon: 'tractor',
    accentColor: '#059669',
    link: '/category/farmer-market',
    categoryFilter: { isFarmerAd: true },
  },
  services: {
    title: 'Услуги',
    subtitle: 'Мастера рядом',
    icon: 'wrench',
    accentColor: '#6366f1',
    link: '/category/uslugi',
    categoryFilter: { category: { $in: ['uslugi', 'remont', 'master'] } },
  },
  second_hand: {
    title: 'Из рук в руки',
    subtitle: 'Б/У товары от соседей',
    icon: 'hand',
    accentColor: '#f59e0b',
    link: '/feed?type=second_hand',
    categoryFilter: { 
      isFreeGiveaway: { $ne: true },
      isFarmerAd: { $ne: true },
      price: { $gt: 0 },
    },
    sortBy: { createdAt: -1 },
    filters: [
      { id: 'all', label: 'Все', icon: 'grid' },
      { id: 'electronics', label: 'Техника', icon: 'smartphone', keywords: ['телефон', 'ноутбук', 'планшет', 'компьютер', 'телевизор', 'наушники', 'колонка', 'iphone', 'samsung', 'xiaomi'] },
      { id: 'furniture', label: 'Мебель', icon: 'sofa', keywords: ['диван', 'кровать', 'шкаф', 'стол', 'стул', 'комод', 'кресло', 'тумба', 'полка'] },
      { id: 'clothing', label: 'Одежда', icon: 'shirt', keywords: ['куртка', 'платье', 'джинсы', 'пальто', 'обувь', 'кроссовки', 'сапоги', 'свитер', 'футболка'] },
      { id: 'kids', label: 'Детям', icon: 'baby', keywords: ['коляска', 'детская', 'игрушки', 'кроватка', 'манеж', 'автокресло', 'велосипед детский', 'самокат'] },
      { id: 'sports', label: 'Спорт', icon: 'dumbbell', keywords: ['велосипед', 'тренажер', 'гантели', 'лыжи', 'коньки', 'ролики', 'самокат', 'скейт', 'палатка'] },
      { id: 'home', label: 'Для дома', icon: 'home', keywords: ['посуда', 'микроволновка', 'пылесос', 'стиральная', 'холодильник', 'плита', 'утюг', 'чайник'] },
      { id: 'auto', label: 'Авто', icon: 'car', keywords: ['шины', 'диски', 'запчасти', 'аккумулятор', 'масло', 'автозапчасти', 'колеса'] },
    ],
  },
  garden_help: {
    title: 'Помощь в огороде',
    subtitle: 'Копка, вспашка, посадка',
    icon: 'shovel',
    accentColor: '#84cc16',
    link: '/category/ogorod',
    searchTerms: ['огород', 'вспашка', 'копка', 'посадка', 'грядки'],
  },
  lawn_mowing: {
    title: 'Покос травы',
    subtitle: 'Уход за газоном',
    icon: 'grass',
    accentColor: '#22c55e',
    link: '/search?q=покос',
    searchTerms: ['покос', 'газон', 'трава', 'триммер'],
  },
  tractor_services: {
    title: 'Вспашка и культивация',
    subtitle: 'Тракторные услуги',
    icon: 'tractor',
    accentColor: '#78716c',
    link: '/search?q=вспашка',
    searchTerms: ['вспашка', 'культивация', 'трактор', 'мотоблок', 'пахать'],
  },
  cleaning: {
    title: 'Клининг квартир',
    subtitle: 'Профессиональная уборка',
    icon: 'sparkles',
    accentColor: '#06b6d4',
    link: '/category/cleaning',
    categoryFilter: { category: { $in: ['cleaning', 'klining', 'uborka'] } },
    searchTerms: ['уборка квартиры', 'клининг', 'генеральная уборка'],
  },
  cleaning_house: {
    title: 'Уборка дома',
    subtitle: 'Клининг коттеджей и дач',
    icon: 'home',
    accentColor: '#0ea5e9',
    link: '/search?q=уборка+дома',
    searchTerms: ['уборка дома', 'уборка коттеджа', 'уборка дачи', 'генеральная уборка'],
  },
  repair_house: {
    title: 'Мастера рядом',
    subtitle: 'Ремонт и отделка',
    icon: 'hammer',
    accentColor: '#f97316',
    link: '/category/remont',
    categoryFilter: { category: { $in: ['remont', 'master', 'electrician', 'plumber'] } },
    searchTerms: ['ремонт', 'электрик', 'сантехник', 'мастер', 'отделка'],
  },
  local_shops: {
    title: 'Магазины рядом',
    subtitle: 'Локальные продавцы',
    icon: 'store',
    accentColor: '#8b5cf6',
    link: '/shops',
    fetchType: 'shops',
  },
  author_brands: {
    title: 'Авторские бренды',
    subtitle: 'Уникальные товары',
    icon: 'palette',
    accentColor: '#f472b6',
    link: '/brands',
    fetchType: 'bloggers',
  },
  beauty: {
    title: 'Красота',
    subtitle: 'Маникюр, макияж, уход',
    icon: 'lipstick',
    accentColor: '#f43f5e',
    link: '/category/beauty',
    categoryFilter: { category: { $in: ['beauty', 'manicure', 'barber', 'kosmetika'] } },
  },
  tech_repair: {
    title: 'Ремонт техники',
    subtitle: 'Телефоны, ноутбуки, ПК',
    icon: 'wrench',
    accentColor: '#3b82f6',
    link: '/search?q=ремонт+техники',
    searchTerms: ['ремонт телефона', 'ремонт ноутбука', 'ремонт компьютера', 'ремонт техники', 'сервис'],
  },
  home_services: {
    title: 'Домашние услуги',
    subtitle: 'Сантехник, электрик, мастер',
    icon: 'home',
    accentColor: '#10b981',
    link: '/category/uslugi',
    categoryFilter: { category: { $in: ['uslugi', 'remont', 'master', 'electrician', 'plumber'] } },
    searchTerms: ['сантехник', 'электрик', 'мастер на час', 'мелкий ремонт', 'муж на час'],
  },
  trending: {
    title: 'Популярное сейчас',
    subtitle: 'Тренды недели',
    icon: 'fire',
    accentColor: '#f59e0b',
    link: '/trending',
    sortBy: { views: -1, favorites: -1 },
  },
  demand: {
    title: 'Ищут рядом',
    subtitle: 'Спрос в вашем районе',
    icon: 'search',
    accentColor: '#3b82f6',
    link: '/demand',
    fetchType: 'demand',
  },
  machinery: {
    title: 'Техника',
    subtitle: 'Запчасти и оборудование',
    icon: 'tractor',
    accentColor: '#78716c',
    link: '/category/selhoztekhnika',
    categoryFilter: { category: { $in: ['selhoztekhnika', 'tekhnika', 'zapchasti'] } },
  },
  tools: {
    title: 'Инструменты',
    subtitle: 'Аренда и продажа',
    icon: 'hammer',
    accentColor: '#a3a3a3',
    link: '/category/arenda',
    categoryFilter: { category: { $in: ['arenda', 'instrumenty', 'tools'] } },
  },
  handmade: {
    title: 'Ручная работа',
    subtitle: 'Handmade товары',
    icon: 'heart',
    accentColor: '#e879f9',
    link: '/category/handmade',
    categoryFilter: { category: { $in: ['handmade', 'ruchnaya-rabota'] } },
    searchTerms: ['handmade', 'ручная работа', 'авторская'],
  },
  seasonal_fairs: {
    title: 'Сезонные ярмарки',
    subtitle: 'Актуальные события',
    icon: 'calendar',
    accentColor: '#14b8a6',
    fetchType: 'fairs',
  },
  snow_cleaning: {
    title: 'Уборка снега',
    subtitle: 'Чистка территории',
    icon: 'snowflake',
    accentColor: '#38bdf8',
    link: '/search?q=уборка+снега',
    searchTerms: ['снег', 'уборка снега', 'чистка снега', 'снегоуборка'],
    seasonal: { months: [11, 12, 1, 2, 3] },
  },
  village_offers: {
    title: 'Деревенские товары',
    subtitle: 'Местное производство',
    icon: 'home',
    accentColor: '#a78bfa',
    searchTerms: ['домашнее', 'деревенское', 'свежее', 'натуральное'],
  },
  new_arrivals: {
    title: 'Новинки',
    subtitle: 'Свежие объявления',
    icon: 'sparkles',
    accentColor: '#10b981',
    sortBy: { createdAt: -1 },
  },
  discounts: {
    title: 'Со скидкой',
    subtitle: 'Выгодные предложения',
    icon: 'tag',
    accentColor: '#f97316',
    link: '/feed?discount=true',
    categoryFilter: { 'priceHistory.0': { $exists: true } },
  },
};

const PROMO_BANNERS = [
  {
    id: 'seasonal_fair',
    title: 'Сезонная ярмарка',
    subtitle: 'Лучшие предложения недели',
    gradient: ['#6366f1', '#4f46e5'],
    link: '/feed?season=spring',
    icon: 'tulip',
  },
  {
    id: 'farmers_nearby',
    title: 'Фермерские товары',
    subtitle: 'Свежее с фермы рядом',
    gradient: ['#10b981', '#059669'],
    link: '/category/farmer-market',
    icon: 'farm',
  },
  {
    id: 'free_giveaway',
    title: 'Отдам даром',
    subtitle: 'Бесплатные вещи в вашем районе',
    gradient: ['#f472b6', '#ec4899'],
    link: '/category/darom',
    icon: 'gift',
  },
  {
    id: 'discounts',
    title: 'Скидки до -50%',
    subtitle: 'Товары со скидкой рядом',
    gradient: ['#f59e0b', '#d97706'],
    link: '/feed?discount=true',
    icon: 'percent',
  },
];

class HomeDynamicEngine {
  constructor() {
    this.maxItemsPerBlock = 30;
    this.minItemsForCarousel = 4;
  }

  getCacheKey(lat, lng, zone) {
    const geohash = ngeohash.encode(lat, lng, 5);
    return `${geohash}:${zone}`;
  }

  getFromCache(key) {
    const cached = BLOCK_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    BLOCK_CACHE.delete(key);
    return null;
  }

  setCache(key, data) {
    BLOCK_CACHE.set(key, { data, timestamp: Date.now() });
    if (BLOCK_CACHE.size > 500) {
      const oldestKey = BLOCK_CACHE.keys().next().value;
      BLOCK_CACHE.delete(oldestKey);
    }
  }

  async getHomeConfig(lat, lng, options = {}) {
    const { radiusKm = 50, userId = null, forceZone = null } = options;

    let zoneResult;
    if (forceZone && ['village', 'suburb', 'city_center'].includes(forceZone)) {
      zoneResult = geoZoneClassifier.forceZone(forceZone);
    } else {
      zoneResult = await geoZoneClassifier.classify(lat, lng);
    }

    const { zone, confidence, diagnostics } = zoneResult;
    
    const cacheKey = this.getCacheKey(lat, lng, zone);
    const cached = this.getFromCache(cacheKey);
    if (cached && !forceZone) {
      return { ...cached, zone, confidence, diagnostics };
    }

    const blockTypes = ZONE_BLOCK_PRIORITY[zone] || ZONE_BLOCK_PRIORITY.suburb;
    const currentMonth = new Date().getMonth() + 1;

    const filteredBlocks = blockTypes.filter(blockType => {
      const config = BLOCK_CONFIGS[blockType];
      if (config?.seasonal) {
        return config.seasonal.months.includes(currentMonth);
      }
      return true;
    });

    const blocks = await this.fetchBlocksData(filteredBlocks, lat, lng, radiusKm);

    const result = {
      zone,
      confidence,
      blocks: blocks.filter(b => b.items?.length > 0 || b.type === 'banners'),
      meta: {
        generatedAt: new Date().toISOString(),
        location: { lat, lng },
        radiusKm,
        diagnostics,
      },
    };

    this.setCache(cacheKey, result);
    return result;
  }

  async fetchBlocksData(blockTypes, lat, lng, radiusKm) {
    const blocks = [];

    for (const blockType of blockTypes) {
      try {
        const config = BLOCK_CONFIGS[blockType];
        if (!config) continue;

        let items = [];

        if (blockType === 'banners') {
          items = PROMO_BANNERS;
        } else if (config.fetchType === 'shops') {
          items = await this.fetchShops(lat, lng, radiusKm);
        } else if (config.fetchType === 'bloggers') {
          items = await this.fetchBloggers(lat, lng, radiusKm);
        } else if (config.fetchType === 'demand') {
          items = await this.fetchDemand(lat, lng, radiusKm);
        } else if (config.fetchType === 'fairs') {
          items = await this.fetchFairs();
        } else {
          items = await this.fetchAds(lat, lng, radiusKm, config);
        }

        blocks.push({
          type: blockType === 'banners' ? 'banners' : 'horizontal_list',
          id: blockType,
          title: config.title,
          subtitle: config.subtitle,
          icon: config.icon,
          accentColor: config.accentColor,
          link: config.link,
          items: items.slice(0, this.maxItemsPerBlock),
          filters: config.filters || null,
        });
      } catch (error) {
        console.error(`[HomeDynamicEngine] Error fetching block ${blockType}:`, error.message);
      }
    }

    return blocks;
  }

  async fetchAds(lat, lng, radiusKm, config) {
    const filter = {};

    if (config.categoryFilter) {
      Object.assign(filter, config.categoryFilter);
    }

    if (config.searchTerms?.length) {
      const searchRegex = config.searchTerms.map(t => new RegExp(t, 'i'));
      filter.$or = [
        { title: { $in: searchRegex } },
        { description: { $in: searchRegex } },
      ];
    }

    const sortBy = config.sortBy || { createdAt: -1 };

    try {
      const ads = await fetchAdsProgressiveRadius({
        lat,
        lng,
        filter,
        minItems: this.minItemsForCarousel,
        maxItems: this.maxItemsPerBlock,
        sortBy,
      });

      return ads.map(ad => ({
        id: ad._id.toString(),
        title: ad.title,
        price: ad.price,
        currency: ad.currency || 'BYN',
        photo: ad.photos?.[0] || null,
        distance: ad.distanceMeters ? Math.round(ad.distanceMeters / 100) / 10 : null,
        distanceKm: ad.distanceKm,
        location: ad.location?.cityName || null,
        isFarmer: ad.isFarmerAd,
        isFree: ad.isFreeGiveaway,
        hasDiscount: ad.priceHistory?.length > 0,
      }));
    } catch (error) {
      console.error('[HomeDynamicEngine] fetchAds error:', error.message);
      return [];
    }
  }

  async fetchShops(lat, lng, radiusKm) {
    try {
      // Support both single role and multiple roles using $in for array match
      const shops = await SellerProfile.find({
        isActive: true,
        $or: [
          { role: 'SHOP' },
          { roles: { $in: ['SHOP'] } },
        ],
        'location.geo': {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      })
        .limit(this.maxItemsPerBlock)
        .lean();

      return shops.map(shop => ({
        id: shop._id.toString(),
        name: shop.storeName || shop.displayName || shop.name,
        logo: shop.storeLogo || shop.avatar,
        category: shop.categories?.[0] || 'Магазин',
        rating: shop.rating || shop.ratings?.score || 0,
        reviewCount: shop.reviewCount || shop.ratings?.count || 0,
        roles: shop.roles || [shop.role],
      }));
    } catch (error) {
      console.error('[HomeDynamicEngine] fetchShops error:', error.message);
      return [];
    }
  }

  async fetchBloggers(lat, lng, radiusKm) {
    try {
      // Support both single role and multiple roles using $in for array match
      const bloggers = await SellerProfile.find({
        isActive: true,
        $or: [
          { role: 'BLOGGER' },
          { roles: { $in: ['BLOGGER'] } },
        ],
        'location.geo': {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      })
        .limit(this.maxItemsPerBlock)
        .lean();

      return bloggers.map(blogger => ({
        id: blogger._id.toString(),
        name: blogger.storeName || blogger.displayName || blogger.name,
        avatar: blogger.storeLogo || blogger.avatar,
        specialty: blogger.categories?.[0] || 'Авторский бренд',
        socialLinks: blogger.socialLinks || {},
        roles: blogger.roles || [blogger.role],
      }));
    } catch (error) {
      console.error('[HomeDynamicEngine] fetchBloggers error:', error.message);
      return [];
    }
  }

  async fetchArtisans(lat, lng, radiusKm) {
    try {
      // Support both single role and multiple roles using $in for array match
      const artisans = await SellerProfile.find({
        isActive: true,
        $or: [
          { role: 'ARTISAN' },
          { roles: { $in: ['ARTISAN'] } },
        ],
        'location.geo': {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      })
        .limit(this.maxItemsPerBlock)
        .lean();

      return artisans.map(artisan => ({
        id: artisan._id.toString(),
        name: artisan.storeName || artisan.displayName || artisan.name,
        avatar: artisan.storeLogo || artisan.avatar,
        specialty: artisan.categories?.[0] || 'Ремесленник',
        roles: artisan.roles || [artisan.role],
      }));
    } catch (error) {
      console.error('[HomeDynamicEngine] fetchArtisans error:', error.message);
      return [];
    }
  }

  async fetchDemand(lat, lng, radiusKm) {
    try {
      const DemandStats = (await import('../models/DemandStats.js')).default;
      
      const demands = await DemandStats.find({
        'location.geo': {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: radiusKm * 1000,
          },
        },
      })
        .sort({ searchCount: -1 })
        .limit(6)
        .lean();

      return demands.map(d => ({
        id: d._id.toString(),
        query: d.query,
        category: d.category,
        count: d.searchCount,
      }));
    } catch (error) {
      console.error('[HomeDynamicEngine] fetchDemand error:', error.message);
      return [];
    }
  }

  async fetchFairs() {
    try {
      const now = new Date();
      const seasons = await Season.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .limit(4)
        .lean();

      return seasons.map(s => ({
        id: s._id.toString(),
        name: s.name,
        description: s.description,
        emoji: s.emoji,
        color: s.color,
        daysRemaining: Math.ceil((new Date(s.endDate) - now) / (1000 * 60 * 60 * 24)),
      }));
    } catch (error) {
      console.error('[HomeDynamicEngine] fetchFairs error:', error.message);
      return [];
    }
  }

  getZoneUIConfig(zone) {
    const configs = {
      village: {
        buttonSize: 'large',
        cardStyle: 'simple',
        animations: false,
        colorAccent: '#059669',
        categoryGridCols: 3,
      },
      suburb: {
        buttonSize: 'medium',
        cardStyle: 'standard',
        animations: true,
        colorAccent: '#6366f1',
        categoryGridCols: 4,
      },
      city_center: {
        buttonSize: 'small',
        cardStyle: 'fancy',
        animations: true,
        colorAccent: '#ec4899',
        categoryGridCols: 4,
      },
    };
    return configs[zone] || configs.suburb;
  }
}

const homeDynamicEngine = new HomeDynamicEngine();
export default homeDynamicEngine;
