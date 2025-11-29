import baseBot from '../bot/bot.js';
import favoritesCommand from './commands/favorites.js';
import notificationsCommand from './commands/notifications.js';
import lifecycleCommand from './commands/lifecycle.js';

favoritesCommand(baseBot);
notificationsCommand(baseBot);
lifecycleCommand(baseBot);

export const bot = baseBot;
export default bot;
