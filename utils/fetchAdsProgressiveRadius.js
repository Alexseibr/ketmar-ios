import Ad from '../models/Ad.js';
import { haversineDistanceKm } from './distance.js';

const RADIUS_STEPS = [0.3, 0.5, 1, 5, 10, 20, 50]; // km

export async function fetchAdsProgressiveRadius({
  lat,
  lng,
  filter = {},
  minItems = 6,
  maxItems = 30,
  sortBy = { createdAt: -1 },
  radiusSteps = RADIUS_STEPS,
}) {
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    return fetchAdsGlobal({ filter, maxItems, sortBy });
  }

  const baseQuery = {
    status: 'active',
    photos: { $exists: true, $ne: [] },
    ...filter,
  };

  let allAds = [];
  const seenIds = new Set();

  for (const radiusKm of radiusSteps) {
    if (allAds.length >= maxItems) break;

    try {
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [lng, lat] },
            distanceField: 'distanceMeters',
            maxDistance: radiusKm * 1000,
            spherical: true,
            key: 'location.geo',
            query: baseQuery,
          },
        },
        { $sort: { distanceMeters: 1, ...sortBy } },
        { $limit: maxItems },
      ];

      const ads = await Ad.aggregate(pipeline);

      for (const ad of ads) {
        const idStr = ad._id.toString();
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          ad.distanceKm = ad.distanceMeters / 1000;
          allAds.push(ad);
        }
      }

      if (allAds.length >= minItems) {
        break;
      }
    } catch (error) {
      console.error(`[ProgressiveRadius] Error at ${radiusKm}km:`, error.message);
    }
  }

  if (allAds.length < minItems) {
    const globalAds = await fetchAdsGlobal({
      filter,
      maxItems: maxItems - allAds.length,
      sortBy,
      excludeIds: Array.from(seenIds),
    });

    for (const ad of globalAds) {
      if (ad.location?.lat && ad.location?.lng) {
        ad.distanceKm = haversineDistanceKm(lat, lng, ad.location.lat, ad.location.lng);
        ad.distanceMeters = ad.distanceKm * 1000;
      }
      allAds.push(ad);
    }
  }

  allAds.sort((a, b) => (a.distanceMeters || 999999) - (b.distanceMeters || 999999));

  return allAds.slice(0, maxItems);
}

async function fetchAdsGlobal({ filter = {}, maxItems = 30, sortBy = { createdAt: -1 }, excludeIds = [] }) {
  const baseQuery = {
    status: 'active',
    photos: { $exists: true, $ne: [] },
    ...filter,
  };

  if (excludeIds.length > 0) {
    baseQuery._id = { $nin: excludeIds };
  }

  return Ad.find(baseQuery)
    .sort(sortBy)
    .limit(maxItems)
    .lean();
}

export async function fetchNewAdsProgressive(lat, lng) {
  return fetchAdsProgressiveRadius({
    lat,
    lng,
    filter: {},
    sortBy: { createdAt: -1 },
    minItems: 6,
    maxItems: 30,
  });
}

export async function fetchTrendingAdsProgressive(lat, lng) {
  return fetchAdsProgressiveRadius({
    lat,
    lng,
    filter: {},
    sortBy: { views: -1, favorites: -1 },
    minItems: 6,
    maxItems: 25,
  });
}

export async function fetchFreeAdsProgressive(lat, lng) {
  return fetchAdsProgressiveRadius({
    lat,
    lng,
    filter: { isFreeGiveaway: true },
    sortBy: { createdAt: -1 },
    minItems: 4,
    maxItems: 20,
  });
}

export async function fetchFarmerAdsProgressive(lat, lng) {
  return fetchAdsProgressiveRadius({
    lat,
    lng,
    filter: { isFarmerAd: true },
    sortBy: { createdAt: -1 },
    minItems: 4,
    maxItems: 20,
  });
}

export async function fetchSimilarAdsProgressive(lat, lng, currentAdId, categoryId, keywords = []) {
  const filter = {
    _id: { $ne: currentAdId },
    $or: [
      { categoryId },
      { category: categoryId },
    ],
  };

  if (keywords.length > 0) {
    const keywordRegex = keywords.map(k => new RegExp(k, 'i'));
    filter.$or.push({ title: { $in: keywordRegex } });
  }

  return fetchAdsProgressiveRadius({
    lat,
    lng,
    filter,
    sortBy: { views: -1, createdAt: -1 },
    minItems: 4,
    maxItems: 15,
  });
}

export async function fetchPeopleAlsoViewedProgressive(lat, lng, currentAdId, viewerIds = []) {
  if (viewerIds.length === 0) {
    return fetchAdsProgressiveRadius({
      lat,
      lng,
      filter: { _id: { $ne: currentAdId } },
      sortBy: { views: -1, createdAt: -1 },
      minItems: 4,
      maxItems: 10,
    });
  }

  return fetchAdsProgressiveRadius({
    lat,
    lng,
    filter: { _id: { $ne: currentAdId } },
    sortBy: { views: -1, favorites: -1 },
    minItems: 4,
    maxItems: 10,
  });
}

export default {
  fetchAdsProgressiveRadius,
  fetchNewAdsProgressive,
  fetchTrendingAdsProgressive,
  fetchFreeAdsProgressive,
  fetchFarmerAdsProgressive,
  fetchSimilarAdsProgressive,
  fetchPeopleAlsoViewedProgressive,
};
