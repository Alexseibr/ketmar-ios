import AdLifecycleService from '../../services/AdLifecycleService.js';
import AdStatsService from '../../services/AdStatsService.js';
import Ad from '../../models/Ad.js';

export default (bot) => {
  bot.command('extend', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const adId = args[1];
    
    if (!adId) {
      return ctx.reply('Использование: /extend <id объявления>');
    }
    
    try {
      const ad = await AdLifecycleService.extendAd(adId, Number(ctx.from.id));
      const statsData = await AdStatsService.getAdStats(adId);
      
      const message = `✅ Объявление продлено!\n` +
        `"${ad.title}"\n\n` +
        `📅 Новый срок: до ${new Date(ad.expiresAt).toLocaleDateString('ru-RU')}\n\n` +
        AdStatsService.formatForTelegram(statsData);
      
      await ctx.reply(message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✏️ Редактировать', callback_data: `edit_${adId}` },
              { text: '📊 Статистика', callback_data: `stats_${adId}` },
            ],
          ],
        },
      });
    } catch (error) {
      await ctx.reply(`❌ ${error.message}`);
    }
  });

  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const telegramId = Number(ctx.from.id);

    if (data.startsWith('extend_')) {
      const adId = data.replace('extend_', '');
      
      try {
        const ad = await AdLifecycleService.extendAd(adId, telegramId);
        
        await ctx.answerCbQuery('Объявление продлено!', { show_alert: true });
        
        const expiresDate = new Date(ad.expiresAt).toLocaleDateString('ru-RU');
        await ctx.editMessageText(
          ctx.callbackQuery.message.text + `\n\n✅ Продлено до ${expiresDate}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '📊 Статистика', callback_data: `stats_${adId}` },
                ],
              ],
            },
          }
        );
      } catch (error) {
        await ctx.answerCbQuery(`Ошибка: ${error.message}`, { show_alert: true });
      }
      return;
    }

    if (data.startsWith('stats_')) {
      const adId = data.replace('stats_', '');
      
      try {
        const statsData = await AdStatsService.getAdStats(adId);
        const message = AdStatsService.formatForTelegram(statsData);
        
        await ctx.answerCbQuery();
        await ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '🔄 Продлить', callback_data: `extend_${adId}` },
                { text: '✏️ Редактировать', callback_data: `edit_${adId}` },
              ],
            ],
          },
        });
      } catch (error) {
        await ctx.answerCbQuery(`Ошибка: ${error.message}`, { show_alert: true });
      }
      return;
    }

    if (data.startsWith('edit_')) {
      const adId = data.replace('edit_', '');
      
      try {
        const ad = await Ad.findById(adId).lean();
        if (!ad) {
          return ctx.answerCbQuery('Объявление не найдено', { show_alert: true });
        }
        
        if (Number(ad.sellerTelegramId) !== telegramId) {
          return ctx.answerCbQuery('Нет прав на редактирование', { show_alert: true });
        }
        
        const webAppUrl = process.env.WEBAPP_URL || 'https://ketmar.app';
        const editUrl = `${webAppUrl}/my-ads/${adId}/edit`;
        
        await ctx.answerCbQuery();
        await ctx.reply(
          `✏️ Для редактирования объявления перейдите по ссылке:\n\n` +
          `🔗 ${editUrl}\n\n` +
          `Что можно изменить:\n` +
          `• Фотографии\n` +
          `• Описание\n` +
          `• Цену\n` +
          `• Категорию`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🔗 Открыть редактор', url: editUrl }],
              ],
            },
          }
        );
      } catch (error) {
        await ctx.answerCbQuery(`Ошибка: ${error.message}`, { show_alert: true });
      }
      return;
    }

    if (data.startsWith('archive_')) {
      const adId = data.replace('archive_', '');
      
      try {
        const ad = await AdLifecycleService.archiveAd(adId, telegramId);
        await ctx.answerCbQuery('Объявление архивировано', { show_alert: true });
        
        await ctx.editMessageText(
          ctx.callbackQuery.message.text + '\n\n📦 Объявление архивировано'
        );
      } catch (error) {
        await ctx.answerCbQuery(`Ошибка: ${error.message}`, { show_alert: true });
      }
      return;
    }
  });

  bot.command('my_ads_stats', async (ctx) => {
    try {
      const dashboard = await AdStatsService.getSellerDashboard(Number(ctx.from.id));
      
      let message = `📊 Ваши объявления\n\n`;
      message += `Активных: ${dashboard.totals.activeAds}\n`;
      message += `Истекших: ${dashboard.totals.expiredAds}\n`;
      message += `Всего просмотров: ${dashboard.totals.totalViews}\n`;
      message += `Всего контактов: ${dashboard.totals.totalContacts}\n`;
      
      if (dashboard.totals.expiringToday > 0) {
        message += `\n⚠️ Истекает сегодня: ${dashboard.totals.expiringToday}\n`;
      }
      if (dashboard.totals.expiringTomorrow > 0) {
        message += `⚠️ Истекает завтра: ${dashboard.totals.expiringTomorrow}\n`;
      }
      
      if (dashboard.ads.length > 0) {
        message += `\n📋 Ваши объявления:\n`;
        for (const ad of dashboard.ads.slice(0, 5)) {
          const statusEmoji = ad.status === 'active' ? '🟢' : 
                             ad.status === 'expired' ? '🔴' : '⚪';
          message += `\n${statusEmoji} ${ad.title}\n`;
          message += `   👁 ${ad.views} | 📞 ${ad.contacts}`;
          if (ad.daysLeft !== null) {
            message += ` | ⏳ ${ad.daysLeft} дн.`;
          }
        }
      }
      
      await ctx.reply(message);
    } catch (error) {
      await ctx.reply(`❌ Ошибка: ${error.message}`);
    }
  });
};
