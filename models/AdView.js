import mongoose from 'mongoose';

const adViewSchema = new mongoose.Schema({
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true,
    index: true
  },
  
  viewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  
  viewerTelegramId: {
    type: Number,
    index: true
  },
  
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: null
    }
  },
  
  locationGrid: {
    lat: Number,
    lng: Number
  },
  
  city: {
    type: String,
    index: true
  },
  
  district: {
    type: String,
    index: true
  },
  
  geoHash: {
    type: String,
    index: true
  },
  
  source: {
    type: String,
    enum: ['feed', 'map', 'search', 'direct', 'category', 'favorite', 'notification', 'share', 'unknown'],
    default: 'unknown',
    index: true
  },
  
  userAgent: String,
  
  sessionId: String,
  
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: false
});

adViewSchema.index({ adId: 1, viewedAt: -1 });
adViewSchema.index({ location: '2dsphere' });
adViewSchema.index({ adId: 1, 'locationGrid.lat': 1, 'locationGrid.lng': 1 });
adViewSchema.index({ adId: 1, district: 1, viewedAt: -1 });
adViewSchema.index({ adId: 1, city: 1, viewedAt: -1 });
adViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 15552000 });

const GRID_SIZE = 0.003;

adViewSchema.statics.roundToGrid = function(value) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
};

adViewSchema.statics.logView = async function(data) {
  const {
    adId,
    viewerId,
    viewerTelegramId,
    lat,
    lng,
    city,
    district,
    source = 'unknown',
    userAgent,
    sessionId,
    meta
  } = data;
  
  let location = null;
  let locationGrid = null;
  let geoHash = null;
  
  if (lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)) {
    const gridLat = this.roundToGrid(lat);
    const gridLng = this.roundToGrid(lng);
    
    location = {
      type: 'Point',
      coordinates: [gridLng, gridLat]
    };
    
    locationGrid = {
      lat: gridLat,
      lng: gridLng
    };
    
    try {
      const ngeohash = await import('ngeohash');
      geoHash = ngeohash.default.encode(gridLat, gridLng, 6);
    } catch (e) {
    }
  }
  
  const view = new this({
    adId,
    viewerId: viewerId || null,
    viewerTelegramId: viewerTelegramId || null,
    viewedAt: new Date(),
    location,
    locationGrid,
    city,
    district,
    geoHash,
    source,
    userAgent,
    sessionId,
    meta
  });
  
  await view.save();
  return view;
};

adViewSchema.statics.getHeatmapData = async function(adId, options = {}) {
  const {
    from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to = new Date(),
    granularity = 'grid'
  } = options;
  
  const matchStage = {
    adId: new mongoose.Types.ObjectId(adId),
    viewedAt: { $gte: from, $lte: to },
    'locationGrid.lat': { $ne: null }
  };
  
  const pointsPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          lat: '$locationGrid.lat',
          lng: '$locationGrid.lng'
        },
        weight: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        lat: '$_id.lat',
        lng: '$_id.lng',
        weight: 1
      }
    },
    { $sort: { weight: -1 } },
    { $limit: 1000 }
  ];
  
  const areasPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: { $ifNull: ['$district', '$city'] },
        views: { $sum: 1 }
      }
    },
    { $sort: { views: -1 } },
    { $limit: 20 }
  ];
  
  const totalPipeline = [
    { 
      $match: { 
        adId: new mongoose.Types.ObjectId(adId),
        viewedAt: { $gte: from, $lte: to }
      } 
    },
    { $count: 'total' }
  ];
  
  const [points, areas, totalResult] = await Promise.all([
    this.aggregate(pointsPipeline),
    this.aggregate(areasPipeline),
    this.aggregate(totalPipeline)
  ]);
  
  const totalViews = totalResult[0]?.total || 0;
  
  const areasWithShare = areas.map(area => ({
    district: area._id || 'Неизвестно',
    views: area.views,
    share: totalViews > 0 ? Number((area.views / totalViews).toFixed(2)) : 0
  }));
  
  return {
    adId,
    totalViews,
    timeRange: { from, to },
    points,
    areas: areasWithShare
  };
};

adViewSchema.statics.getSellerDemandHeatmap = async function(sellerId, options = {}) {
  const {
    period = 30,
    categorySlug = null
  } = options;
  
  const Ad = mongoose.model('Ad');
  
  const from = new Date();
  from.setDate(from.getDate() - period);
  
  const adQuery = { userId: new mongoose.Types.ObjectId(sellerId) };
  if (categorySlug) {
    adQuery.categorySlug = categorySlug;
  }
  
  const sellerAds = await Ad.find(adQuery).select('_id').lean();
  const adIds = sellerAds.map(a => a._id);
  
  if (adIds.length === 0) {
    return {
      totalViews: 0,
      points: [],
      districts: [],
      period,
      timeRange: { from: from.toISOString(), to: new Date().toISOString() },
    };
  }
  
  const matchStage = {
    adId: { $in: adIds },
    viewedAt: { $gte: from },
    'locationGrid.lat': { $ne: null },
  };
  
  const pointsPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          lat: '$locationGrid.lat',
          lng: '$locationGrid.lng',
        },
        weight: { $sum: 1 },
        district: { $first: '$district' },
      },
    },
    {
      $project: {
        _id: 0,
        lat: '$_id.lat',
        lng: '$_id.lng',
        weight: 1,
        district: 1,
      },
    },
    { $sort: { weight: -1 } },
    { $limit: 500 },
  ];
  
  const districtPipeline = [
    { $match: matchStage },
    { $match: { district: { $exists: true, $ne: null, $ne: '' } } },
    {
      $group: {
        _id: '$district',
        views: { $sum: 1 },
      },
    },
    { $sort: { views: -1 } },
    { $limit: 15 },
  ];
  
  const totalPipeline = [
    { $match: { adId: { $in: adIds }, viewedAt: { $gte: from } } },
    { $count: 'total' },
  ];
  
  const [points, districtStats, totalResult] = await Promise.all([
    this.aggregate(pointsPipeline),
    this.aggregate(districtPipeline),
    this.aggregate(totalPipeline),
  ]);
  
  const totalViews = totalResult[0]?.total || 0;
  
  const districts = districtStats.map(d => ({
    district: d._id,
    views: d.views,
    share: totalViews > 0 ? Number((d.views / totalViews).toFixed(3)) : 0,
  }));
  
  return {
    totalViews,
    points,
    districts,
    period,
    adsCount: adIds.length,
    timeRange: {
      from: from.toISOString(),
      to: new Date().toISOString(),
    },
  };
};

adViewSchema.statics.getDeficitMap = async function(options = {}) {
  const {
    categorySlug = null,
    period = 30,
    lat = 53.9,
    lng = 27.56,
    radiusKm = 50
  } = options;
  
  const Ad = mongoose.model('Ad');
  const from = new Date();
  from.setDate(from.getDate() - period);
  
  const adQuery = { status: 'active' };
  if (categorySlug) {
    adQuery.categorySlug = categorySlug;
  }
  
  const demandMatch = {
    viewedAt: { $gte: from },
    'locationGrid.lat': { $ne: null },
  };
  
  if (categorySlug) {
    const catAds = await Ad.find({ categorySlug }).select('_id').lean();
    demandMatch.adId = { $in: catAds.map(a => a._id) };
  }
  
  const demandPipeline = [
    { $match: demandMatch },
    {
      $group: {
        _id: {
          lat: { $round: ['$locationGrid.lat', 2] },
          lng: { $round: ['$locationGrid.lng', 2] },
        },
        demandScore: { $sum: 1 },
        district: { $first: '$district' },
      },
    },
  ];
  
  const [demandPoints, supplyAds] = await Promise.all([
    this.aggregate(demandPipeline),
    Ad.find(adQuery).select('location').lean(),
  ]);
  
  const supplyByGrid = {};
  for (const ad of supplyAds) {
    if (ad.location?.coordinates) {
      const gridLat = Math.round(ad.location.coordinates[1] * 100) / 100;
      const gridLng = Math.round(ad.location.coordinates[0] * 100) / 100;
      const key = `${gridLat}_${gridLng}`;
      supplyByGrid[key] = (supplyByGrid[key] || 0) + 1;
    }
  }
  
  const deficitPoints = [];
  const districtDeficits = {};
  
  for (const point of demandPoints) {
    const key = `${point._id.lat}_${point._id.lng}`;
    const supplyScore = supplyByGrid[key] || 0;
    const deficit = point.demandScore - supplyScore * 3;
    
    deficitPoints.push({
      lat: point._id.lat,
      lng: point._id.lng,
      deficit,
      demandScore: point.demandScore,
      supplyScore,
    });
    
    if (point.district) {
      if (!districtDeficits[point.district]) {
        districtDeficits[point.district] = { demand: 0, supply: 0 };
      }
      districtDeficits[point.district].demand += point.demandScore;
      districtDeficits[point.district].supply += supplyScore;
    }
  }
  
  const topDeficitDistricts = Object.entries(districtDeficits)
    .map(([district, stats]) => ({
      district,
      deficit: stats.demand - stats.supply * 3,
      demandScore: stats.demand,
      supplyScore: stats.supply,
    }))
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, 10);
  
  return {
    points: deficitPoints.sort((a, b) => b.deficit - a.deficit).slice(0, 300),
    topDeficitDistricts,
    period,
    categorySlug,
    timeRange: {
      from: from.toISOString(),
      to: new Date().toISOString(),
    },
  };
};

const AdView = mongoose.model('AdView', adViewSchema);
export default AdView;
