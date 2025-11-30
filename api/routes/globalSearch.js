import { Router } from 'express';
import SmartSearchService from '../../services/SmartSearchService.js';
import asyncHandler from '../middleware/asyncHandler.js';
import Ad from '../../models/Ad.js';

const router = Router();

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function matchesQuery(ad, regex) {
  return regex.test(ad.title) || (ad.description && regex.test(ad.description));
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { query, lat, lng, radiusKm = '10', limit = '50', sort = 'distance' } = req.query;

    console.log('🔍 [GlobalSearch] Запрос:', {
      query,
      lat: lat || 'НЕТ',
      lng: lng || 'НЕТ',
      radiusKm,
      sort
    });

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        ok: false,
        error: 'Query must be at least 2 characters',
      });
    }

    try {
      const result = await SmartSearchService.search({
        query: query.trim(),
        lat,
        lng,
        radiusKm: parseFloat(radiusKm) || 10,
        limit: Math.min(parseInt(limit) || 50, 100),
        sort,
      });

      res.set('Cache-Control', 'public, max-age=60');
      res.json({
        ok: true,
        ...result,
      });
    } catch (error) {
      console.error('Global search error:', error);
      res.status(500).json({
        ok: false,
        error: 'Search failed',
      });
    }
  })
);

router.get(
  '/suggest',
  asyncHandler(async (req, res) => {
    const { query, limit = '10' } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        ok: true,
        categories: [],
        brands: [],
        keywords: [],
      });
    }

    try {
      const suggestions = await SmartSearchService.getSuggestions(
        query.trim(),
        Math.min(parseInt(limit) || 10, 20)
      );

      res.set('Cache-Control', 'public, max-age=120');
      res.json({
        ok: true,
        query: query.trim(),
        ...suggestions,
      });
    } catch (error) {
      console.error('Search suggest error:', error);
      res.status(500).json({
        ok: false,
        error: 'Suggestions failed',
      });
    }
  })
);

router.get('/giveaways', async (req, res) => {
  try {
    const {
      q,
      lat,
      lng,
      subcategoryId,
      maxDistanceKm,
      sort = 'newest',
      limit = '50',
      offset = '0',
    } = req.query;

    const limitNumber = Math.min(parseNumber(limit) || 50, 100);
    const offsetNumber = parseNumber(offset) || 0;

    const baseQuery = {
      status: 'active',
      moderationStatus: 'approved',
      isFreeGiveaway: true,
    };

    if (subcategoryId && subcategoryId !== 'all') {
      baseQuery.giveawaySubcategoryId = subcategoryId;
    }

    const ads = await Ad.find(baseQuery)
      .sort({ createdAt: -1 })
      .limit(500)
      .select('_id title description photos location createdAt giveawaySubcategoryId')
      .lean();

    const regex = q ? new RegExp(q, 'i') : null;
    let filtered = regex ? ads.filter((ad) => matchesQuery(ad, regex)) : ads;

    const latNumber = parseNumber(lat);
    const lngNumber = parseNumber(lng);
    const hasGeo = Number.isFinite(latNumber) && Number.isFinite(lngNumber);
    const maxDistanceNumber = parseNumber(maxDistanceKm);

    if (hasGeo) {
      filtered = filtered
        .map((ad) => {
          if (!ad.location || ad.location.lat == null || ad.location.lng == null) {
            return { ...ad, distanceKm: null };
          }

          const distanceKm = haversineDistanceKm(
            latNumber,
            lngNumber,
            Number(ad.location.lat),
            Number(ad.location.lng)
          );

          return { ...ad, distanceKm };
        })
        .filter((ad) => {
          if (maxDistanceNumber != null && ad.distanceKm != null) {
            return ad.distanceKm <= maxDistanceNumber;
          }
          return true;
        })
        .sort((a, b) => {
          if (sort === 'distance') {
            const distA = a.distanceKm ?? Infinity;
            const distB = b.distanceKm ?? Infinity;
            return distA - distB;
          }
          return 0;
        });
    }

    const total = filtered.length;
    const paginated = filtered.slice(offsetNumber, offsetNumber + limitNumber);

    res.json({
      success: true,
      ads: paginated,
      total,
      hasMore: offsetNumber + limitNumber < total,
    });
  } catch (error) {
    console.error('GET /api/search/giveaways error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
