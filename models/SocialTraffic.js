import mongoose from 'mongoose';

const socialTrafficSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SellerProfile',
    index: true,
  },
  sellerTelegramId: {
    type: Number,
    required: true,
    index: true,
  },
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    index: true,
  },
  social: {
    type: String,
    enum: ['instagram', 'telegram', 'viber', 'whatsapp', 'tiktok', 'youtube', 'website'],
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  userTelegramId: {
    type: Number,
    index: true,
  },
  userAgent: String,
  referrer: String,
  ipHash: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

socialTrafficSchema.index({ sellerTelegramId: 1, social: 1, createdAt: -1 });
socialTrafficSchema.index({ adId: 1, social: 1, createdAt: -1 });

socialTrafficSchema.statics.trackClick = async function(data) {
  return this.create({
    sellerId: data.sellerId,
    sellerTelegramId: data.sellerTelegramId,
    adId: data.adId,
    social: data.social,
    userId: data.userId,
    userTelegramId: data.userTelegramId,
    userAgent: data.userAgent,
    referrer: data.referrer,
    ipHash: data.ipHash,
  });
};

socialTrafficSchema.statics.getStatsBySeller = async function(sellerTelegramId, period = 'week') {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const stats = await this.aggregate([
    {
      $match: {
        sellerTelegramId,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$social',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userTelegramId' },
      },
    },
    {
      $project: {
        social: '$_id',
        clicks: '$count',
        uniqueClicks: { $size: '$uniqueUsers' },
      },
    },
  ]);

  const dailyStats = await this.aggregate([
    {
      $match: {
        sellerTelegramId,
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          social: '$social',
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.date': 1 },
    },
  ]);

  const topProducts = await this.aggregate([
    {
      $match: {
        sellerTelegramId,
        createdAt: { $gte: startDate },
        adId: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$adId',
        totalClicks: { $sum: 1 },
        bySocial: {
          $push: '$social',
        },
      },
    },
    {
      $lookup: {
        from: 'ads',
        localField: '_id',
        foreignField: '_id',
        as: 'ad',
      },
    },
    {
      $unwind: '$ad',
    },
    {
      $project: {
        adId: '$_id',
        title: '$ad.title',
        photo: { $arrayElemAt: ['$ad.photos', 0] },
        totalClicks: 1,
        instagram: {
          $size: {
            $filter: { input: '$bySocial', cond: { $eq: ['$$this', 'instagram'] } },
          },
        },
        telegram: {
          $size: {
            $filter: { input: '$bySocial', cond: { $eq: ['$$this', 'telegram'] } },
          },
        },
        viber: {
          $size: {
            $filter: { input: '$bySocial', cond: { $eq: ['$$this', 'viber'] } },
          },
        },
      },
    },
    {
      $sort: { totalClicks: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  return {
    bySocial: stats,
    daily: dailyStats,
    topProducts,
    period,
    startDate,
    endDate: now,
  };
};

export default mongoose.model('SocialTraffic', socialTrafficSchema);
