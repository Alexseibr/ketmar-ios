import express from 'express';
import aiGateway from '../../services/ai/AiGateway.js';
import RecommendationEngine from '../../services/RecommendationEngine.js';
import { 
  fetchSimilarAdsProgressive, 
  fetchPeopleAlsoViewedProgressive,
  fetchTrendingAdsProgressive,
} from '../../utils/fetchAdsProgressiveRadius.js';
import Ad from '../../models/Ad.js';

const router = express.Router();

function getTelegramId(req) {
  return req.headers['x-telegram-id'] || req.query.telegramId || req.user?.telegramId;
}

router.get('/feed', async (req, res) => {
  try {
    const telegramId = getTelegramId(req);
    const { lat, lng, radiusKm = 10, cursor = 0, limit = 20 } = req.query;

    const result = await RecommendationEngine.getForYouFeed({
      telegramId: telegramId ? Number(telegramId) : null,
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
      radiusKm: parseFloat(radiusKm),
      cursor: parseInt(cursor),
      limit: parseInt(limit),
    });

    return res.json(result);
  } catch (error) {
    console.error('[Recommendations] feed error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка получения персональной ленты',
      items: [],
    });
  }
});

router.get('/similar/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const { limit = 15, lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const ad = await Ad.findById(adId).lean();
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Объявление не найдено',
        items: [],
      });
    }

    const adLat = ad.location?.lat || userLat;
    const adLng = ad.location?.lng || userLng;
    const categoryId = ad.categoryId || ad.category;
    const keywords = ad.title?.split(' ').filter(w => w.length > 3).slice(0, 3) || [];

    const items = await fetchSimilarAdsProgressive(adLat, adLng, adId, categoryId, keywords);

    return res.json({
      success: true,
      items: items.map(item => ({
        id: item._id.toString(),
        title: item.title,
        price: item.price,
        currency: item.currency || 'BYN',
        photo: item.photos?.[0] || null,
        distanceKm: item.distanceKm,
        distance: item.distanceMeters ? Math.round(item.distanceMeters / 100) / 10 : null,
        location: item.location?.cityName || null,
        isFarmer: item.isFarmerAd,
        isFree: item.isFreeGiveaway,
      })),
    });
  } catch (error) {
    console.error('[Recommendations] similar error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка получения похожих товаров',
      items: [],
    });
  }
});

router.get('/also-viewed/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const { lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const ad = await Ad.findById(adId).lean();
    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Объявление не найдено',
        items: [],
      });
    }

    const adLat = ad.location?.lat || userLat;
    const adLng = ad.location?.lng || userLng;

    const items = await fetchPeopleAlsoViewedProgressive(adLat, adLng, adId);

    return res.json({
      success: true,
      items: items.map(item => ({
        id: item._id.toString(),
        title: item.title,
        price: item.price,
        currency: item.currency || 'BYN',
        photo: item.photos?.[0] || null,
        distanceKm: item.distanceKm,
        distance: item.distanceMeters ? Math.round(item.distanceMeters / 100) / 10 : null,
        location: item.location?.cityName || null,
        isFarmer: item.isFarmerAd,
        isFree: item.isFreeGiveaway,
      })),
    });
  } catch (error) {
    console.error('[Recommendations] also-viewed error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка получения рекомендаций',
      items: [],
    });
  }
});

router.get('/trending-nearby', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const items = await fetchTrendingAdsProgressive(userLat, userLng);

    return res.json({
      success: true,
      items: items.map(item => ({
        id: item._id.toString(),
        title: item.title,
        price: item.price,
        currency: item.currency || 'BYN',
        photo: item.photos?.[0] || null,
        distanceKm: item.distanceKm,
        distance: item.distanceMeters ? Math.round(item.distanceMeters / 100) / 10 : null,
        location: item.location?.cityName || null,
        isFarmer: item.isFarmerAd,
        isFree: item.isFreeGiveaway,
      })),
    });
  } catch (error) {
    console.error('[Recommendations] trending-nearby error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка получения трендов',
      items: [],
    });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    const items = await fetchTrendingAdsProgressive(userLat, userLng);

    return res.json({
      success: true,
      items: items.map(item => ({
        id: item._id.toString(),
        title: item.title,
        price: item.price,
        currency: item.currency || 'BYN',
        photo: item.photos?.[0] || null,
        distanceKm: item.distanceKm,
        distance: item.distanceMeters ? Math.round(item.distanceMeters / 100) / 10 : null,
        location: item.location?.cityName || null,
        isFarmer: item.isFarmerAd,
        isFree: item.isFreeGiveaway,
      })),
    });
  } catch (error) {
    console.error('[Recommendations] trending error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка получения трендов',
      items: [],
    });
  }
});

router.post('/track', async (req, res) => {
  try {
    const { telegramId, action, adId, categoryId, searchQuery } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({
        success: false,
        error: 'telegramId is required'
      });
    }
    
    const result = await aiGateway.trackUserActivity({
      telegramId: Number(telegramId),
      action,
      adId,
      categoryId,
      searchQuery
    });
    
    return res.json(result);
  } catch (error) {
    console.error('[Recommendations] track error:', error);
    return res.status(500).json({
      success: false,
      error: 'Ошибка отслеживания активности'
    });
  }
});

export default router;
