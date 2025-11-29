import Ad from '../models/Ad.js';

const DAILY_AD_LIMIT = 5;
const FREE_GIVEAWAY_CATEGORY = 'darom';

class AdLimitService {
  static async checkLimit(telegramId, categoryId, isFreeGiveaway = false, isScheduled = false) {
    if (!telegramId) {
      return { allowed: true, reason: null, used: 0, limit: DAILY_AD_LIMIT, remaining: DAILY_AD_LIMIT };
    }

    if (isScheduled) {
      return { 
        allowed: true, 
        reason: null,
        used: 0,
        limit: DAILY_AD_LIMIT,
        remaining: DAILY_AD_LIMIT,
        scheduled: true,
        message: 'Отложенные объявления не учитываются в лимите',
      };
    }

    if (isFreeGiveaway || categoryId === FREE_GIVEAWAY_CATEGORY) {
      return { 
        allowed: true, 
        reason: null,
        unlimited: true,
        used: 0,
        limit: 0,
        remaining: 999,
        message: 'Раздел "Даром" - без ограничений',
      };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayAdsCount = await Ad.countDocuments({
      sellerTelegramId: telegramId,
      createdAt: { $gte: startOfDay },
      isFreeGiveaway: { $ne: true },
      status: { $in: ['active', 'pending'] },
      moderationStatus: { $in: ['approved', 'pending'] },
    });

    if (todayAdsCount < DAILY_AD_LIMIT) {
      return {
        allowed: true,
        reason: null,
        remaining: DAILY_AD_LIMIT - todayAdsCount - 1,
        used: todayAdsCount,
        limit: DAILY_AD_LIMIT,
      };
    }

    return {
      allowed: false,
      reason: 'daily_limit_exceeded',
      used: todayAdsCount,
      limit: DAILY_AD_LIMIT,
      remaining: 0,
      message: `Превышен лимит ${DAILY_AD_LIMIT} объявлений в день. Объявление будет отправлено на модерацию.`,
      requiresModeration: true,
    };
  }

  static async getTodayStats(telegramId) {
    if (!telegramId) {
      return { used: 0, limit: DAILY_AD_LIMIT, remaining: DAILY_AD_LIMIT, unlimited: false };
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayAdsCount = await Ad.countDocuments({
      sellerTelegramId: telegramId,
      createdAt: { $gte: startOfDay },
      isFreeGiveaway: { $ne: true },
      status: { $in: ['active', 'pending'] },
      moderationStatus: { $in: ['approved', 'pending'] },
    });

    return {
      used: todayAdsCount,
      limit: DAILY_AD_LIMIT,
      remaining: Math.max(0, DAILY_AD_LIMIT - todayAdsCount),
      unlimited: false,
    };
  }

  static async getGiveawayStats(telegramId) {
    if (!telegramId) {
      return { total: 0, used: 0, limit: 0, remaining: 999, unlimited: true };
    }

    const total = await Ad.countDocuments({
      sellerTelegramId: telegramId,
      isFreeGiveaway: true,
      status: 'active',
    });

    return {
      total,
      used: total,
      limit: 0,
      remaining: 999,
      unlimited: true,
      message: 'Раздел "Даром" - без ограничений',
    };
  }
}

export default AdLimitService;
