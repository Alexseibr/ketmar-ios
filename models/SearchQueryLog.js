import mongoose from 'mongoose';

const searchQueryLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  query: {
    type: String,
    required: true,
    index: 'text',
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  district: {
    type: String,
    index: true,
  },
  city: {
    type: String,
    index: true,
  },
  resultsCount: {
    type: Number,
    default: 0,
  },
  matchCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  matchCategorySlug: {
    type: String,
    index: true,
  },
  matchKeywords: [{
    type: String,
  }],
  clickedAdId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
  },
  source: {
    type: String,
    enum: ['miniapp', 'web', 'bot', 'api'],
    default: 'miniapp',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

searchQueryLogSchema.index({ location: '2dsphere' });
searchQueryLogSchema.index({ createdAt: -1 });
searchQueryLogSchema.index({ matchCategorySlug: 1, createdAt: -1 });

searchQueryLogSchema.index({ createdAt: 1 }, { 
  expireAfterSeconds: 90 * 24 * 60 * 60 
});

searchQueryLogSchema.statics.logSearch = async function(data) {
  try {
    const log = new this({
      userId: data.userId || null,
      query: data.query,
      location: data.location ? {
        type: 'Point',
        coordinates: [data.location.lng, data.location.lat],
      } : undefined,
      district: data.district,
      city: data.city,
      resultsCount: data.resultsCount || 0,
      matchCategory: data.matchCategory,
      matchCategorySlug: data.matchCategorySlug,
      matchKeywords: data.matchKeywords || [],
      source: data.source || 'miniapp',
    });
    
    await log.save();
    return log;
  } catch (error) {
    console.error('[SearchQueryLog] Failed to log search:', error);
    return null;
  }
};

searchQueryLogSchema.statics.getSearchHeatmapData = async function(options = {}) {
  const { categorySlug, period = 30, sellerId } = options;
  
  const from = new Date();
  from.setDate(from.getDate() - period);
  
  const matchStage = {
    createdAt: { $gte: from },
    'location.coordinates.0': { $ne: 0 },
    'location.coordinates.1': { $ne: 0 },
  };
  
  if (categorySlug) {
    matchStage.matchCategorySlug = categorySlug;
  }
  
  const pipeline = [
    { $match: matchStage },
    {
      $project: {
        lat: { 
          $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] 
        },
        lng: { 
          $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] 
        },
        district: 1,
      },
    },
    {
      $group: {
        _id: { lat: '$lat', lng: '$lng' },
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
  ];
  
  const points = await this.aggregate(pipeline);
  
  const districtPipeline = [
    { $match: matchStage },
    { $match: { district: { $exists: true, $ne: null, $ne: '' } } },
    {
      $group: {
        _id: '$district',
        searches: { $sum: 1 },
      },
    },
    { $sort: { searches: -1 } },
    { $limit: 10 },
  ];
  
  const districtStats = await this.aggregate(districtPipeline);
  const totalSearches = districtStats.reduce((sum, d) => sum + d.searches, 0);
  
  const districts = districtStats.map(d => ({
    district: d._id,
    searches: d.searches,
    share: totalSearches > 0 ? d.searches / totalSearches : 0,
  }));
  
  return {
    totalSearches,
    points,
    districts,
    period,
    timeRange: {
      from: from.toISOString(),
      to: new Date().toISOString(),
    },
  };
};

const SearchQueryLog = mongoose.model('SearchQueryLog', searchQueryLogSchema);

export default SearchQueryLog;
