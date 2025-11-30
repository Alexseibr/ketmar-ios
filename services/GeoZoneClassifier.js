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
    
    this.majorCities = [
      'минск', 'minsk',
      'брест', 'brest',
      'гродно', 'grodno',
      'витебск', 'vitebsk',
      'могилёв', 'могилев', 'mogilev',
      'гомель', 'gomel',
      'бобруйск', 'bobruisk',
      'барановичи', 'baranovichi',
      'борисов', 'borisov',
      'пинск', 'pinsk',
      'орша', 'orsha',
      'мозырь', 'mozyr',
      'солигорск', 'soligorsk',
      'новополоцк', 'novopolotsk',
      'лида', 'lida',
      'молодечно', 'molodechno',
      'полоцк', 'polotsk',
      'жлобин', 'zhlobin',
      'светлогорск', 'svetlogorsk',
      'речица', 'rechitsa',
      'слуцк', 'slutsk',
      'жодино', 'zhodino',
      'кобрин', 'kobrin',
    ];
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

  isMajorCity(cityName) {
    if (!cityName) return false;
    const normalized = cityName.toLowerCase().trim();
    return this.majorCities.some(city => normalized.includes(city) || city.includes(normalized));
  }

  determineZone(osmData, adMetrics) {
    let villageScore = 0;
    let suburbScore = 0;
    let cityScore = 0;

    const cityName = osmData.city || osmData.raw?.city || osmData.raw?.town;
    const isMajorCity = this.isMajorCity(cityName);
    const metricsAvailable = adMetrics.totalAds > 0;

    if (isMajorCity) {
      cityScore += 50;
      
      if (osmData.hasSuburb) {
        suburbScore += 20;
      } else {
        cityScore += 10;
      }
      
      console.log(`[GeoZoneClassifier] Major city detected: ${cityName}`);
    } else {
      if (osmData.isVillage) {
        villageScore += 40;
      } else if (osmData.isCity && !osmData.hasSuburb) {
        cityScore += 30;
      } else if (osmData.hasSuburb) {
        suburbScore += 25;
        cityScore += 15;
      }
    }

    if (!isMajorCity) {
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
    }

    if (metricsAvailable) {
      if (adMetrics.adDensity > 50) {
        cityScore += 20;
      } else if (adMetrics.adDensity > 10) {
        suburbScore += 15;
        cityScore += 5;
      } else if (adMetrics.adDensity < 5) {
        villageScore += 10;
      }

      if (adMetrics.farmerRatio > 0.3) {
        villageScore += 20;
      } else if (adMetrics.farmerRatio > 0.15) {
        suburbScore += 8;
        villageScore += 8;
      }

      if (adMetrics.beautyRatio > 0.1) {
        cityScore += 15;
      } else if (adMetrics.beautyRatio > 0.05) {
        suburbScore += 8;
        cityScore += 4;
      }

      if (adMetrics.serviceRatio > 0.25) {
        suburbScore += 12;
        cityScore += 8;
      }
    }

    const maxScore = Math.max(villageScore, suburbScore, cityScore);
    const totalScore = villageScore + suburbScore + cityScore;
    const confidence = totalScore > 0 ? maxScore / totalScore : 0.33;

    let zone;
    if (isMajorCity && cityScore >= suburbScore) {
      zone = osmData.hasSuburb ? 'suburb' : 'city_center';
    } else if (villageScore > suburbScore && villageScore > cityScore) {
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
        isMajorCity,
        cityName,
        metricsAvailable,
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
