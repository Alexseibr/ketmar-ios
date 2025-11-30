import reverseGeocodingService from './ReverseGeocodingService.js';
import Ad from '../models/Ad.js';
import ngeohash from 'ngeohash';

const ZONE_CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

class GeoZoneClassifier {
  constructor() {
    this.villagePlaceTypes = ['village', 'hamlet', 'isolated_dwelling', 'farm', 'allotments'];
    this.suburbPlaceTypes = ['suburb', 'neighbourhood', 'residential', 'quarter'];
    this.cityPlaceTypes = ['city', 'town', 'borough', 'city_block'];
  }

  getCacheKey(lat, lng) {
    return ngeohash.encode(lat, lng, 5);
  }

  getFromCache(key) {
    const cached = ZONE_CACHE.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    ZONE_CACHE.delete(key);
    return null;
  }

  setCache(key, data) {
    ZONE_CACHE.set(key, { data, timestamp: Date.now() });
    if (ZONE_CACHE.size > 1000) {
      const oldestKey = ZONE_CACHE.keys().next().value;
      ZONE_CACHE.delete(oldestKey);
    }
  }

  async classify(lat, lng) {
    const cacheKey = this.getCacheKey(lat, lng);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const [osmData, adMetrics] = await Promise.all([
        this.getOSMData(lat, lng),
        this.getAdDensityMetrics(lat, lng),
      ]);

      const result = this.determineZone(osmData, adMetrics);
      this.setCache(cacheKey, result);
      
      console.log(`[GeoZoneClassifier] ${lat},${lng} => ${result.zone} (confidence: ${result.confidence})`);
      return result;
    } catch (error) {
      console.error('[GeoZoneClassifier] Classification error:', error);
      return {
        zone: 'suburb',
        confidence: 0.5,
        source: 'fallback',
        diagnostics: { error: error.message },
      };
    }
  }

  async getOSMData(lat, lng) {
    try {
      const geoData = await reverseGeocodingService.reverseGeocode(lat, lng);
      if (!geoData) {
        return { placeType: null, isVillage: false, isCity: false };
      }

      const addr = geoData.raw?.address || {};
      
      const placeType = addr.village ? 'village' :
                       addr.hamlet ? 'hamlet' :
                       addr.suburb ? 'suburb' :
                       addr.city_district ? 'city_district' :
                       addr.town ? 'town' :
                       addr.city ? 'city' : null;

      const isVillage = !!(addr.village || addr.hamlet);
      const isCity = !!(addr.city && !addr.village && !addr.hamlet);
      const hasSuburb = !!(addr.suburb || addr.neighbourhood);

      return {
        placeType,
        isVillage,
        isCity,
        hasSuburb,
        city: addr.city || addr.town || null,
        village: addr.village || addr.hamlet || null,
        suburb: addr.suburb || addr.neighbourhood || null,
        raw: addr,
      };
    } catch (error) {
      console.warn('[GeoZoneClassifier] OSM data fetch failed:', error.message);
      return { placeType: null, isVillage: false, isCity: false };
    }
  }

  async getAdDensityMetrics(lat, lng) {
    try {
      const radiusKm = 5;
      const radiusMeters = radiusKm * 1000;

      const [totalAds, farmerAds, serviceAds, beautyAds] = await Promise.all([
        Ad.countDocuments({
          status: 'active',
          'location.geo': {
            $nearSphere: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: radiusMeters,
            },
          },
        }),
        Ad.countDocuments({
          status: 'active',
          isFarmerAd: true,
          'location.geo': {
            $nearSphere: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: radiusMeters,
            },
          },
        }),
        Ad.countDocuments({
          status: 'active',
          category: { $in: ['uslugi', 'remont', 'cleaning'] },
          'location.geo': {
            $nearSphere: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: radiusMeters,
            },
          },
        }),
        Ad.countDocuments({
          status: 'active',
          category: { $in: ['beauty', 'barber', 'manicure'] },
          'location.geo': {
            $nearSphere: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              $maxDistance: radiusMeters,
            },
          },
        }),
      ]);

      const farmerRatio = totalAds > 0 ? farmerAds / totalAds : 0;
      const serviceRatio = totalAds > 0 ? serviceAds / totalAds : 0;
      const beautyRatio = totalAds > 0 ? beautyAds / totalAds : 0;

      return {
        totalAds,
        farmerAds,
        serviceAds,
        beautyAds,
        farmerRatio,
        serviceRatio,
        beautyRatio,
        adDensity: totalAds / (Math.PI * radiusKm * radiusKm),
      };
    } catch (error) {
      console.warn('[GeoZoneClassifier] Ad metrics fetch failed:', error.message);
      return {
        totalAds: 0,
        farmerAds: 0,
        serviceAds: 0,
        beautyAds: 0,
        farmerRatio: 0,
        serviceRatio: 0,
        beautyRatio: 0,
        adDensity: 0,
      };
    }
  }

  determineZone(osmData, adMetrics) {
    let villageScore = 0;
    let suburbScore = 0;
    let cityScore = 0;

    if (osmData.isVillage) {
      villageScore += 40;
    } else if (osmData.isCity && !osmData.hasSuburb) {
      cityScore += 30;
    } else if (osmData.hasSuburb) {
      suburbScore += 25;
      cityScore += 15;
    }

    if (osmData.placeType === 'village' || osmData.placeType === 'hamlet') {
      villageScore += 30;
    } else if (osmData.placeType === 'suburb' || osmData.placeType === 'neighbourhood') {
      suburbScore += 30;
    } else if (osmData.placeType === 'city' || osmData.placeType === 'city_district') {
      cityScore += 30;
    } else if (osmData.placeType === 'town') {
      suburbScore += 15;
      cityScore += 15;
    }

    if (adMetrics.adDensity > 50) {
      cityScore += 20;
    } else if (adMetrics.adDensity > 10) {
      suburbScore += 15;
      cityScore += 5;
    } else if (adMetrics.adDensity < 5) {
      villageScore += 15;
    }

    if (adMetrics.farmerRatio > 0.3) {
      villageScore += 25;
    } else if (adMetrics.farmerRatio > 0.15) {
      suburbScore += 10;
      villageScore += 10;
    }

    if (adMetrics.beautyRatio > 0.1) {
      cityScore += 20;
    } else if (adMetrics.beautyRatio > 0.05) {
      suburbScore += 10;
      cityScore += 5;
    }

    if (adMetrics.serviceRatio > 0.25) {
      suburbScore += 15;
      cityScore += 10;
    }

    const maxScore = Math.max(villageScore, suburbScore, cityScore);
    const totalScore = villageScore + suburbScore + cityScore;
    const confidence = totalScore > 0 ? maxScore / totalScore : 0.33;

    let zone;
    if (villageScore >= suburbScore && villageScore >= cityScore) {
      zone = 'village';
    } else if (cityScore >= suburbScore) {
      zone = 'city_center';
    } else {
      zone = 'suburb';
    }

    return {
      zone,
      confidence: Math.round(confidence * 100) / 100,
      source: 'classifier',
      scores: {
        village: villageScore,
        suburb: suburbScore,
        city_center: cityScore,
      },
      diagnostics: {
        osmPlaceType: osmData.placeType,
        isVillage: osmData.isVillage,
        isCity: osmData.isCity,
        hasSuburb: osmData.hasSuburb,
        adDensity: adMetrics.adDensity,
        farmerRatio: adMetrics.farmerRatio,
        beautyRatio: adMetrics.beautyRatio,
        serviceRatio: adMetrics.serviceRatio,
      },
    };
  }

  forceZone(zone) {
    if (!['village', 'suburb', 'city_center'].includes(zone)) {
      throw new Error(`Invalid zone: ${zone}`);
    }
    return {
      zone,
      confidence: 1.0,
      source: 'manual',
      scores: { [zone]: 100 },
      diagnostics: { forced: true },
    };
  }
}

const geoZoneClassifier = new GeoZoneClassifier();
export default geoZoneClassifier;
