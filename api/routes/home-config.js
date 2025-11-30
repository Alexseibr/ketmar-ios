import { Router } from 'express';
import homeDynamicEngine from '../../services/HomeDynamicEngine.js';
import reverseGeocodingService from '../../services/ReverseGeocodingService.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { lat, lng, radiusKm = 10, userId, zone: forceZone } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({
        success: false,
        error: 'Valid lat and lng parameters are required',
      });
    }

    if (userLat < -90 || userLat > 90 || userLng < -180 || userLng > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates',
      });
    }

    const [homeConfig, geoData] = await Promise.all([
      homeDynamicEngine.getHomeConfig(userLat, userLng, {
        radiusKm: radius,
        userId,
        forceZone,
      }),
      reverseGeocodingService.reverseGeocode(userLat, userLng),
    ]);

    const locationName = geoData?.label || geoData?.city || 'Ваш район';

    res.json({
      success: true,
      zone: homeConfig.zone,
      confidence: homeConfig.confidence,
      location: locationName,
      blocks: homeConfig.blocks,
      uiConfig: homeDynamicEngine.getZoneUIConfig(homeConfig.zone),
      meta: homeConfig.meta,
    });
  } catch (error) {
    console.error('[HomeConfig] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate home configuration',
    });
  }
});

router.get('/zones', (req, res) => {
  res.json({
    success: true,
    zones: [
      {
        id: 'village',
        name: 'Деревня',
        description: 'Сельская местность, агрогородки',
        icon: 'home',
      },
      {
        id: 'suburb',
        name: 'Окраина',
        description: 'Частный сектор, пригород',
        icon: 'trees',
      },
      {
        id: 'city_center',
        name: 'Центр города',
        description: 'Многоэтажки, высокая плотность',
        icon: 'building',
      },
    ],
  });
});

router.post('/debug', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'lat and lng are required',
      });
    }

    const geoZoneClassifier = (await import('../../services/GeoZoneClassifier.js')).default;
    const classification = await geoZoneClassifier.classify(lat, lng);

    res.json({
      success: true,
      classification,
    });
  } catch (error) {
    console.error('[HomeConfig] Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
