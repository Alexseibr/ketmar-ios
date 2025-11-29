import { Router } from 'express';
import Ad from '../../models/Ad.js';
import AdView from '../../models/AdView.js';
import Season from '../../models/Season.js';
import { haversineDistanceKm } from '../../utils/distance.js';

const router = Router();

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

router.get('/', async (req, res) => {
  try {
    const { lat, lng, userId, radiusKm = 10 } = req.query;
    
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radius = parseFloat(radiusKm);
    
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);
    
    const blocks = [];
    
    blocks.push({
      type: 'banners',
      items: PROMO_BANNERS,
    });

    const baseQuery = {
      status: 'active',
      photos: { $exists: true, $ne: [] },
    };

    let farmerAds, freeAds, discountAds, popularAds, newAds;

    if (hasLocation) {
      const geoNearPipeline = (matchFilter, limit = 10) => [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [userLng, userLat] },
            distanceField: 'distanceMeters',
            maxDistance: radius * 1000,
            spherical: true,
            key: 'location.geo',
            query: { ...baseQuery, ...matchFilter },
          },
        },
        { $limit: limit },
      ];

      [farmerAds, freeAds, discountAds, popularAds, newAds] = await Promise.all([
        Ad.aggregate(geoNearPipeline({ isFarmerAd: true })),
        Ad.aggregate(geoNearPipeline({ isFreeGiveaway: true })),
        Ad.aggregate(geoNearPipeline({ 'priceHistory.0': { $exists: true } })),
        Ad.aggregate([
          ...geoNearPipeline({}),
          { $sort: { views: -1, favorites: -1 } },
        ]),
        Ad.aggregate([
          ...geoNearPipeline({}),
          { $sort: { createdAt: -1 } },
        ]),
      ]);
    } else {
      [farmerAds, freeAds, discountAds, popularAds, newAds] = await Promise.all([
        Ad.find({ ...baseQuery, isFarmerAd: true })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        
        Ad.find({ ...baseQuery, isFreeGiveaway: true })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        
        Ad.find({
          ...baseQuery,
          'priceHistory.0': { $exists: true },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        
        Ad.find(baseQuery)
          .sort({ views: -1, favorites: -1 })
          .limit(10)
          .lean(),
        
        Ad.find(baseQuery)
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);
    }

    const addDistanceToAds = (ads) => {
      if (!hasLocation) return ads;
      return ads.map(ad => {
        if (ad.distanceMeters !== undefined) {
          ad.distanceKm = ad.distanceMeters / 1000;
        } else if (ad.location?.lat && ad.location?.lng) {
          ad.distanceKm = haversineDistanceKm(
            userLat, userLng, 
            ad.location.lat, ad.location.lng
          );
        }
        return ad;
      });
    };

    const mapAdsToPreview = (ads) => ads.map(ad => ({
      _id: ad._id,
      title: ad.title,
      price: ad.price,
      currency: ad.currency || 'BYN',
      photos: ad.photos?.slice(0, 1) || [],
      city: ad.city,
      geoLabel: ad.geoLabel,
      distanceKm: ad.distanceKm,
      isFarmerAd: ad.isFarmerAd,
      isFreeGiveaway: ad.isFreeGiveaway,
      priceHistory: ad.priceHistory,
      createdAt: ad.createdAt,
    }));

    if (farmerAds.length > 0) {
      blocks.push({
        type: 'horizontal_list',
        id: 'farmers_nearby',
        title: 'Фермерские товары рядом',
        subtitle: 'Свежее с местных ферм',
        icon: 'tractor',
        link: '/category/farmer-market',
        items: mapAdsToPreview(addDistanceToAds(farmerAds)),
      });
    }

    if (popularAds.length > 0) {
      blocks.push({
        type: 'horizontal_list',
        id: 'popular_nearby',
        title: 'Популярное сейчас',
        subtitle: 'Чаще всего смотрят в вашем районе',
        icon: 'fire',
        link: '/feed?sort=popular',
        items: mapAdsToPreview(addDistanceToAds(popularAds)),
      });
    }

    if (freeAds.length > 0) {
      blocks.push({
        type: 'horizontal_list',
        id: 'free_nearby',
        title: 'Отдам даром рядом',
        subtitle: 'Бесплатные вещи в вашем районе',
        icon: 'gift',
        accentColor: '#EC4899',
        link: '/category/darom',
        items: mapAdsToPreview(addDistanceToAds(freeAds)),
      });
    }

    const adsWithDiscount = discountAds.filter(ad => {
      if (!ad.priceHistory || ad.priceHistory.length === 0) return false;
      const lastChange = ad.priceHistory[ad.priceHistory.length - 1];
      return lastChange.newPrice < lastChange.oldPrice;
    });

    if (adsWithDiscount.length > 0) {
      blocks.push({
        type: 'horizontal_list',
        id: 'discounts',
        title: 'Скидки рядом',
        subtitle: 'Товары с пониженной ценой',
        icon: 'tag',
        accentColor: '#F59E0B',
        link: '/feed?discount=true',
        items: mapAdsToPreview(addDistanceToAds(adsWithDiscount)),
      });
    }

    if (newAds.length > 0) {
      blocks.push({
        type: 'horizontal_list',
        id: 'new_nearby',
        title: 'Новое рядом',
        subtitle: 'Добавлено за последние 24 часа',
        icon: 'sparkles',
        link: '/feed?sort=new',
        items: mapAdsToPreview(addDistanceToAds(newAds)),
      });
    }

    let locationName = 'Ваш район';
    if (hasLocation) {
      const nearestAd = await Ad.findOne({
        'location.geo': {
          $near: {
            $geometry: { type: 'Point', coordinates: [userLng, userLat] },
            $maxDistance: 5000,
          },
        },
        geoLabel: { $exists: true, $ne: null },
      }).lean();
      
      if (nearestAd?.geoLabel) {
        locationName = nearestAd.geoLabel;
      } else if (nearestAd?.city) {
        locationName = nearestAd.city;
      }
    }

    res.json({
      success: true,
      location: locationName,
      blocks,
      meta: {
        hasLocation,
        radiusKm: radius,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[HomeFeed] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load home feed' 
    });
  }
});

export default router;
