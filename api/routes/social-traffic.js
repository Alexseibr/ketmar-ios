import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import SocialTraffic from '../../models/SocialTraffic.js';
import Ad from '../../models/Ad.js';

const router = express.Router();

router.post('/track', async (req, res) => {
  try {
    const { adId, social, sellerId, sellerTelegramId } = req.body;
    
    if (!social || !['instagram', 'telegram', 'viber', 'whatsapp', 'tiktok', 'youtube', 'website'].includes(social)) {
      return res.status(400).json({ success: false, message: 'Invalid social platform' });
    }

    let targetSellerTelegramId = sellerTelegramId;
    let targetSellerId = sellerId;

    if (adId) {
      const ad = await Ad.findById(adId);
      if (ad) {
        targetSellerTelegramId = ad.sellerTelegramId;
        if (ad.sellerId) {
          targetSellerId = ad.sellerId;
        }
      }
    }

    if (!targetSellerTelegramId && !targetSellerId) {
      return res.status(400).json({ success: false, message: 'Seller not found' });
    }

    const userTelegramId = req.user?.telegramId || null;
    const userId = req.user?._id || null;
    
    const ipHash = crypto
      .createHash('sha256')
      .update(req.ip + 'salt')
      .digest('hex')
      .substring(0, 16);

    await SocialTraffic.trackClick({
      sellerId: targetSellerId,
      sellerTelegramId: targetSellerTelegramId,
      adId,
      social,
      userId,
      userTelegramId,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer'],
      ipHash,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking social click:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const sellerTelegramId = parseInt(req.query.sellerTelegramId);
    const period = req.query.period || 'week';

    if (!sellerTelegramId) {
      return res.status(400).json({ success: false, message: 'sellerTelegramId is required' });
    }

    const stats = await SocialTraffic.getStatsBySeller(sellerTelegramId, period);

    const totalClicks = stats.bySocial.reduce((sum, s) => sum + s.clicks, 0);
    const totalUnique = stats.bySocial.reduce((sum, s) => sum + s.uniqueClicks, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalClicks,
          totalUnique,
          period,
        },
        bySocial: stats.bySocial,
        daily: stats.daily,
        topProducts: stats.topProducts,
      },
    });
  } catch (error) {
    console.error('Error getting social stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats/product/:adId', async (req, res) => {
  try {
    const { adId } = req.params;
    const period = req.query.period || 'week';

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

    const stats = await SocialTraffic.aggregate([
      {
        $match: {
          adId: new mongoose.Types.ObjectId(adId),
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

    const daily = await SocialTraffic.aggregate([
      {
        $match: {
          adId: new mongoose.Types.ObjectId(adId),
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

    res.json({
      success: true,
      data: {
        bySocial: stats,
        daily,
        period,
      },
    });
  } catch (error) {
    console.error('Error getting product social stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
