import cron from 'node-cron';
import AdLifecycleService from '../services/AdLifecycleService.js';
import AdStatsService from '../services/AdStatsService.js';

let notificationCallback = null;

export function setNotificationCallback(callback) {
  notificationCallback = callback;
}

async function sendNotification(sellerId, message, type = 'info', data = null) {
  if (notificationCallback) {
    try {
      await notificationCallback(sellerId, message, type, data);
    } catch (error) {
      console.error('[AdLifecycleWorker] Error sending notification:', error);
    }
  }
}

async function runFrequentTasks() {
  console.log('[AdLifecycleWorker] Running frequent tasks...');
  
  try {
    const expired = await AdLifecycleService.processExpiredAds();
    console.log(`[AdLifecycleWorker] Expired ${expired.length} ads`);
    
    for (const result of expired) {
      try {
        const statsData = await AdStatsService.getAdStats(result.adId);
        const statsText = AdStatsService.formatForTelegram(statsData);
        
        await sendNotification(
          result.sellerId,
          `⏰ Объявление истекло!\n"${result.title}"\n\n` +
          `${statsText}\n\n` +
          `Хотите продлить ещё на несколько дней?\n` +
          `Нажмите /extend_${result.adId}`,
          'expired',
          { adId: result.adId, stats: statsData.stats }
        );
      } catch (statsError) {
        await sendNotification(
          result.sellerId,
          `⏰ Объявление "${result.title}" истекло.\n\n` +
          `Хотите продлить? /extend_${result.adId}`,
          'expired'
        );
      }
    }
  } catch (error) {
    console.error('[AdLifecycleWorker] Error processing expired ads:', error);
  }
  
  try {
    const activated = await AdLifecycleService.processScheduledAds();
    console.log(`[AdLifecycleWorker] Activated ${activated.length} scheduled ads`);
    
    for (const result of activated) {
      await sendNotification(
        result.sellerId,
        `✅ Объявление "${result.title}" опубликовано!\n\n` +
        `Теперь покупатели могут его видеть.`,
        'activated'
      );
    }
  } catch (error) {
    console.error('[AdLifecycleWorker] Error processing scheduled ads:', error);
  }
  
  console.log('[AdLifecycleWorker] Frequent tasks completed');
}

async function runDailyTasks() {
  console.log('[AdLifecycleWorker] Running daily tasks...');
  
  try {
    const dailyAds = await AdLifecycleService.processDailyAds();
    console.log(`[AdLifecycleWorker] Created ${dailyAds.length} daily ads`);
    
    for (const result of dailyAds) {
      await sendNotification(
        result.sellerId,
        `🔄 Ежедневное объявление "${result.title}" автоматически опубликовано на сегодня.`,
        'daily'
      );
    }
  } catch (error) {
    console.error('[AdLifecycleWorker] Error processing daily ads:', error);
  }
  
  console.log('[AdLifecycleWorker] Daily tasks completed');
}

async function runReminderTasks() {
  console.log('[AdLifecycleWorker] Running reminder tasks...');
  
  try {
    const reminders = await AdLifecycleService.processReminders();
    console.log(`[AdLifecycleWorker] Sent ${reminders.length} expiry reminders`);
    
    for (const result of reminders) {
      try {
        const statsData = await AdStatsService.getAdStats(result.adId);
        const statsText = AdStatsService.formatForTelegram(statsData);
        
        let recText = '';
        if (statsData.recommendations.length > 0) {
          recText = '\n\n💡 Советы:\n';
          statsData.recommendations.slice(0, 2).forEach(rec => {
            recText += `${rec.icon} ${rec.message}\n`;
          });
        }
        
        await sendNotification(
          result.sellerId,
          `⚠️ Через ${result.daysLeft} дн. истекает объявление!\n"${result.title}"\n\n` +
          `${statsText}${recText}\n` +
          `Продлить: /extend_${result.adId}`,
          'reminder',
          { adId: result.adId, stats: statsData.stats, daysLeft: result.daysLeft }
        );
      } catch (statsError) {
        await sendNotification(
          result.sellerId,
          `⚠️ Через ${result.daysLeft} дн. объявление "${result.title}" истечёт.\n\n` +
          `Продлите его: /extend_${result.adId}`,
          'reminder'
        );
      }
    }
  } catch (error) {
    console.error('[AdLifecycleWorker] Error processing reminders:', error);
  }
  
  try {
    const midLifeReminders = await AdLifecycleService.processMidLifeReminders();
    console.log(`[AdLifecycleWorker] Sent ${midLifeReminders.length} mid-life reminders`);
    
    for (const result of midLifeReminders) {
      try {
        const statsData = await AdStatsService.getAdStats(result.adId);
        const statsText = AdStatsService.formatForTelegram(statsData);
        
        let tips = '';
        const photoRec = statsData.recommendations.find(r => r.type === 'photos');
        const descRec = statsData.recommendations.find(r => r.type === 'description');
        if (photoRec) tips += `\n${photoRec.icon} ${photoRec.message}`;
        if (descRec) tips += `\n${descRec.icon} ${descRec.message}`;
        
        await sendNotification(
          result.sellerId,
          `💡 Середина срока публикации\n"${result.title}"\n\n` +
          `${statsText}` +
          (tips ? `\n\n🎯 Что можно улучшить:${tips}` : '') +
          `\n\nОбновите объявление для большего интереса!`,
          'mid_life_reminder',
          { adId: result.adId, stats: statsData.stats }
        );
      } catch (statsError) {
        await sendNotification(
          result.sellerId,
          `💡 Совет для объявления "${result.title}":\n\n` +
          `Прошла половина срока. Добавьте фото или обновите описание!`,
          'mid_life_reminder'
        );
      }
    }
  } catch (error) {
    console.error('[AdLifecycleWorker] Error processing mid-life reminders:', error);
  }
  
  console.log('[AdLifecycleWorker] Reminder tasks completed');
}

export function startAdLifecycleWorker() {
  console.log('[AdLifecycleWorker] Starting ad lifecycle worker...');
  
  cron.schedule('*/5 * * * *', runFrequentTasks, {
    timezone: 'Europe/Minsk',
  });
  console.log('[AdLifecycleWorker] Frequent tasks scheduled - runs every 5 minutes');
  
  cron.schedule('5 0 * * *', runDailyTasks, {
    timezone: 'Europe/Minsk',
  });
  console.log('[AdLifecycleWorker] Daily tasks scheduled - runs at 00:05 AM (Europe/Minsk)');
  
  cron.schedule('0 9,18 * * *', runReminderTasks, {
    timezone: 'Europe/Minsk',
  });
  console.log('[AdLifecycleWorker] Reminder tasks scheduled - runs at 9:00 AM and 6:00 PM (Europe/Minsk)');
  
  console.log('[AdLifecycleWorker] All cron jobs scheduled successfully');
}

export async function runAdLifecycleTasksNow() {
  console.log('[AdLifecycleWorker] Running all tasks manually...');
  await runFrequentTasks();
  await runDailyTasks();
  await runReminderTasks();
  console.log('[AdLifecycleWorker] All tasks completed');
}
