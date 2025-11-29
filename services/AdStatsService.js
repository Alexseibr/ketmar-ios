import Ad from '../models/Ad.js';
import ContactEvent from '../models/ContactEvent.js';
import AdView from '../models/AdView.js';

class AdStatsService {
  static async getAdStats(adId) {
    const ad = await Ad.findById(adId).lean();
    if (!ad) {
      throw new Error('Объявление не найдено');
    }

    const contactStats = await ContactEvent.getContactStats(adId);

    const stats = {
      adId: ad._id,
      title: ad.title,
      views: ad.views || 0,
      viewsTotal: ad.viewsTotal || 0,
      viewsToday: ad.viewsToday || 0,
      impressions: ad.impressionsTotal || 0,
      impressionsToday: ad.impressionsToday || 0,
      contactClicks: ad.contactClicks || 0,
      contacts: contactStats,
      favoritesCount: ad.favoritesCount || 0,
      daysActive: this.getDaysActive(ad),
      expiresAt: ad.expiresAt,
      daysLeft: this.getDaysLeft(ad.expiresAt),
    };

    const recommendations = this.generateRecommendations(ad, stats);
    
    return {
      stats,
      recommendations,
      summary: this.generateSummary(stats),
    };
  }

  static getDaysActive(ad) {
    const createdAt = ad.createdAt || ad._id.getTimestamp();
    const now = new Date();
    return Math.floor((now - new Date(createdAt)) / (24 * 60 * 60 * 1000));
  }

  static getDaysLeft(expiresAt) {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const daysLeft = Math.ceil((expires - now) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  }

  static generateRecommendations(ad, stats) {
    const recommendations = [];
    const photosCount = ad.photos?.length || 0;
    const descriptionLength = ad.description?.length || 0;

    if (photosCount < 3) {
      recommendations.push({
        type: 'photos',
        priority: 'high',
        icon: '📷',
        title: 'Добавьте больше фото',
        message: photosCount === 0
          ? 'Объявления с фото получают в 5 раз больше просмотров'
          : `У вас ${photosCount} фото. Добавьте ещё ${3 - photosCount} для лучшей продажи`,
        action: 'edit_photos',
      });
    }

    if (descriptionLength < 50) {
      recommendations.push({
        type: 'description',
        priority: 'high',
        icon: '✏️',
        title: 'Дополните описание',
        message: descriptionLength === 0
          ? 'Добавьте описание - покупатели хотят знать детали'
          : 'Расширьте описание: состояние, размеры, особенности',
        action: 'edit_description',
      });
    }

    if (stats.daysActive > 3 && stats.views < 10) {
      recommendations.push({
        type: 'visibility',
        priority: 'medium',
        icon: '🔄',
        title: 'Мало просмотров',
        message: 'Попробуйте обновить фото или снизить цену',
        action: 'refresh_ad',
      });
    }

    if (stats.views > 20 && stats.contacts.total === 0) {
      recommendations.push({
        type: 'conversion',
        priority: 'medium',
        icon: '💬',
        title: 'Много просмотров, мало контактов',
        message: 'Возможно цена высокая или описание неубедительное',
        action: 'check_price',
      });
    }

    if (stats.daysLeft !== null && stats.daysLeft <= 2 && stats.daysLeft > 0) {
      recommendations.push({
        type: 'expiry',
        priority: 'high',
        icon: '⏰',
        title: 'Скоро истекает',
        message: `Осталось ${stats.daysLeft} дн. - продлите объявление`,
        action: 'extend_ad',
      });
    }

    return recommendations;
  }

  static generateSummary(stats) {
    const lines = [];

    lines.push(`👁 Просмотров: ${stats.viewsTotal} (сегодня: ${stats.viewsToday})`);
    lines.push(`📞 Показали контакты: ${stats.contacts.total} раз`);

    if (stats.contacts.byChannel) {
      const channels = [];
      if (stats.contacts.byChannel.phone > 0) channels.push(`тел: ${stats.contacts.byChannel.phone}`);
      if (stats.contacts.byChannel.telegram > 0) channels.push(`TG: ${stats.contacts.byChannel.telegram}`);
      if (stats.contacts.byChannel.chat > 0) channels.push(`чат: ${stats.contacts.byChannel.chat}`);
      if (channels.length > 0) {
        lines.push(`   (${channels.join(', ')})`);
      }
    }

    lines.push(`❤️ В избранном: ${stats.favoritesCount}`);
    lines.push(`📅 Активно: ${stats.daysActive} дн.`);

    if (stats.daysLeft !== null) {
      if (stats.daysLeft === 0) {
        lines.push('⚠️ Истекает сегодня!');
      } else if (stats.daysLeft === 1) {
        lines.push('⚠️ Истекает завтра!');
      } else {
        lines.push(`⏳ Осталось: ${stats.daysLeft} дн.`);
      }
    }

    return lines.join('\n');
  }

  static formatForTelegram(data) {
    const { stats, recommendations, summary } = data;
    
    let message = `📊 Статистика объявления\n"${stats.title}"\n\n`;
    message += summary;

    if (recommendations.length > 0) {
      message += '\n\n💡 Рекомендации:\n';
      recommendations.forEach((rec, i) => {
        message += `${rec.icon} ${rec.message}\n`;
      });
    }

    return message;
  }

  static async getSellerDashboard(telegramId) {
    const normalizedId = Number(telegramId);
    const ads = await Ad.find({
      sellerTelegramId: normalizedId,
      status: { $in: ['active', 'expired'] },
    }).lean();

    const totals = {
      activeAds: 0,
      expiredAds: 0,
      totalViews: 0,
      totalContacts: 0,
      expiringToday: 0,
      expiringTomorrow: 0,
    };

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    for (const ad of ads) {
      if (ad.status === 'active') {
        totals.activeAds++;
        if (ad.expiresAt) {
          const expires = new Date(ad.expiresAt);
          if (expires <= now) {
            totals.expiringToday++;
          } else if (expires <= tomorrow) {
            totals.expiringTomorrow++;
          }
        }
      } else {
        totals.expiredAds++;
      }
      totals.totalViews += ad.viewsTotal || 0;
      totals.totalContacts += ad.contactClicks || 0;
    }

    return {
      totals,
      ads: ads.map(ad => ({
        _id: ad._id,
        title: ad.title,
        status: ad.status,
        views: ad.viewsTotal || 0,
        contacts: ad.contactClicks || 0,
        daysLeft: this.getDaysLeft(ad.expiresAt),
        expiresAt: ad.expiresAt,
      })),
    };
  }
}

export default AdStatsService;
