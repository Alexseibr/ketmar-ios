/**
 * Internationalization (i18n) module for MiniApp
 * Provides translation functionality with lazy loading
 */

type LanguageCode = 'ru' | 'en' | 'pl';

interface TranslationNamespace {
  [key: string]: string;
}

interface Translations {
  [namespace: string]: TranslationNamespace;
}

const translations: Record<LanguageCode, Translations> = {
  ru: {},
  en: {},
  pl: {},
};

let currentLanguage: LanguageCode = 'ru';
let isInitialized = false;

// Синхронизируем язык с сохранённым в localStorage при старте
try {
  // Сначала проверяем напрямую сохранённый язык (устанавливается при GPS-определении)
  const directLang = localStorage.getItem('ketmar-language');
  if (directLang && ['ru', 'en', 'pl'].includes(directLang)) {
    currentLanguage = directLang as LanguageCode;
    console.log('🌍 [i18n] Loaded language from ketmar-language:', currentLanguage);
  } else {
    // Fallback на regionStore
    const stored = localStorage.getItem('ketmar-region-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.state?.language && ['ru', 'en', 'pl'].includes(parsed.state.language)) {
        currentLanguage = parsed.state.language as LanguageCode;
        console.log('🌍 [i18n] Loaded language from region store:', currentLanguage);
      }
    }
  }
} catch (e) {
  // Ignore errors
}

const COMMON_RU: TranslationNamespace = {
  'app.name': 'KETMAR Market',
  'common.loading': 'Загрузка...',
  'common.error': 'Ошибка',
  'common.retry': 'Повторить',
  'common.cancel': 'Отмена',
  'common.save': 'Сохранить',
  'common.delete': 'Удалить',
  'common.edit': 'Редактировать',
  'common.close': 'Закрыть',
  'common.search': 'Поиск',
  'common.filter': 'Фильтр',
  'common.sort': 'Сортировка',
  'common.more': 'Ещё',
  'common.show_all': 'Показать все',
  'common.back': 'Назад',
  'common.next': 'Далее',
  'common.done': 'Готово',
  'common.yes': 'Да',
  'common.no': 'Нет',
  'common.price': 'Цена',
  'common.free': 'Бесплатно',
  'common.negotiable': 'Договорная',
  'common.cta.post': 'Разместить объявление',
  'common.cta.view_feed': 'Смотреть ленту',
  'common.cta.contact': 'Связаться',
  'common.cta.call': 'Позвонить',
  'common.cta.message': 'Написать',
  'common.banner.give_away': 'Есть что отдать?',
  'common.all': 'Все',
  'common.no_ads': 'Нет объявлений',
  'common.create_first': 'Создайте первое объявление, нажав кнопку выше',
  'feed.title': 'Объявления',
  'feed.empty': 'Объявлений пока нет',
  'feed.nearby': 'Рядом с вами',
  'feed.all': 'Все объявления',
  'feed.scope.local': 'Рядом',
  'feed.scope.country': 'Вся страна',
  'search.placeholder': 'Что ищете?',
  'search.recent': 'Недавние',
  'search.hot': 'Популярное',
  'search.no_results': 'Ничего не найдено',
  'favorites.title': 'Избранное',
  'favorites.empty': 'У вас пока нет избранных',
  'favorites.added': 'Добавлено в избранное',
  'favorites.removed': 'Удалено из избранного',
  'profile.title': 'Профиль',
  'profile.my_ads': 'Мои объявления',
  'profile.settings': 'Настройки',
  'profile.logout': 'Выйти',
  'ad.views': 'просмотров',
  'ad.contacts': 'контактов',
  'ad.distance': 'от вас',
  'ad.posted': 'Опубликовано',
  'ad.updated': 'Обновлено',
  'ad.status.active': 'Активно',
  'ad.status.sold': 'Продано',
  'ad.status.pending': 'На модерации',
  'ad.status.expired': 'Истекло',
  'create.title': 'Новое объявление',
  'create.step.photos': 'Фото',
  'create.step.details': 'Описание',
  'create.step.price': 'Цена',
  'create.step.location': 'Место',
  'create.step.confirm': 'Подтверждение',
  'create.photo.add': 'Добавить фото',
  'create.photo.main': 'Главное фото',
  'create.title_placeholder': 'Название товара',
  'create.description_placeholder': 'Описание...',
  'create.price_placeholder': 'Укажите цену',
  'create.publish': 'Опубликовать',
  'location.detecting': 'Определяем местоположение...',
  'location.change': 'Изменить',
  'location.radius': 'Радиус поиска',
  'location.your_area': 'Ваш район',
  'region.select': 'Выбор региона',
  'region.currency': 'Валюта',
  'region.language': 'Язык',
  'nav.home': 'Главная',
  'nav.feed': 'Лента',
  'nav.my_ads': 'Мои',
  'nav.chats': 'Чаты',
  'nav.favorites': 'Избранное',
  'nav.profile': 'Профиль',
  'my_ads.title': 'Мои объявления',
  'my_ads.create': 'Создать',
  'my_ads.active': 'Активные',
  'my_ads.archive': 'Архив',
  'cat.farmers': 'Фермеры',
  'cat.bakery': 'Выпечка',
  'cat.food': 'Еда',
  'cat.free': 'Даром',
  'cat.clothes': 'Одежда',
  'cat.shoes': 'Обувь',
  'cat.home': 'Дом',
  'cat.tech': 'Техника',
  'cat.agro': 'Сельхоз',
  'cat.services': 'Услуги',
  'cat.rental': 'Аренда',
  'cat.items': 'Вещи',
  'home.swipe_feed': 'Свайпай товары',
  'home.like_tiktok': 'Как в TikTok',
  'home.on_map': 'На карте',
  'home.near_you': 'Рядом с вами',
  'home.farmer_goods': 'Фермерские товары',
  'home.fresh_nearby': 'Свежее с фермы рядом',
};

const COMMON_EN: TranslationNamespace = {
  'app.name': 'KETMAR Market',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.retry': 'Retry',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',
  'common.more': 'More',
  'common.show_all': 'Show all',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.done': 'Done',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.price': 'Price',
  'common.free': 'Free',
  'common.negotiable': 'Negotiable',
  'common.cta.post': 'Post an ad',
  'common.cta.view_feed': 'View feed',
  'common.cta.contact': 'Contact',
  'common.cta.call': 'Call',
  'common.cta.message': 'Message',
  'common.banner.give_away': 'Have something to give away?',
  'common.all': 'All',
  'common.no_ads': 'No ads',
  'common.create_first': 'Create your first ad using the button above',
  'feed.title': 'Listings',
  'feed.empty': 'No listings yet',
  'feed.nearby': 'Nearby',
  'feed.all': 'All listings',
  'feed.scope.local': 'Local',
  'feed.scope.country': 'Country',
  'search.placeholder': 'What are you looking for?',
  'search.recent': 'Recent',
  'search.hot': 'Popular',
  'search.no_results': 'No results found',
  'favorites.title': 'Favorites',
  'favorites.empty': 'No favorites yet',
  'favorites.added': 'Added to favorites',
  'favorites.removed': 'Removed from favorites',
  'profile.title': 'Profile',
  'profile.my_ads': 'My ads',
  'profile.settings': 'Settings',
  'profile.logout': 'Log out',
  'ad.views': 'views',
  'ad.contacts': 'contacts',
  'ad.distance': 'away',
  'ad.posted': 'Posted',
  'ad.updated': 'Updated',
  'ad.status.active': 'Active',
  'ad.status.sold': 'Sold',
  'ad.status.pending': 'Pending',
  'ad.status.expired': 'Expired',
  'create.title': 'New listing',
  'create.step.photos': 'Photos',
  'create.step.details': 'Details',
  'create.step.price': 'Price',
  'create.step.location': 'Location',
  'create.step.confirm': 'Confirm',
  'create.photo.add': 'Add photo',
  'create.photo.main': 'Main photo',
  'create.title_placeholder': 'Item title',
  'create.description_placeholder': 'Description...',
  'create.price_placeholder': 'Enter price',
  'create.publish': 'Publish',
  'location.detecting': 'Detecting location...',
  'location.change': 'Change',
  'location.radius': 'Search radius',
  'location.your_area': 'Your area',
  'region.select': 'Select region',
  'region.currency': 'Currency',
  'region.language': 'Language',
  'nav.home': 'Home',
  'nav.feed': 'Feed',
  'nav.my_ads': 'My Ads',
  'nav.chats': 'Chats',
  'nav.favorites': 'Favorites',
  'nav.profile': 'Profile',
  'my_ads.title': 'My ads',
  'my_ads.create': 'Create',
  'my_ads.active': 'Active',
  'my_ads.archive': 'Archive',
  'cat.farmers': 'Farmers',
  'cat.bakery': 'Bakery',
  'cat.food': 'Food',
  'cat.free': 'Free',
  'cat.clothes': 'Clothes',
  'cat.shoes': 'Shoes',
  'cat.home': 'Home',
  'cat.tech': 'Tech',
  'cat.agro': 'Agro',
  'cat.services': 'Services',
  'cat.rental': 'Rental',
  'cat.items': 'Items',
  'home.swipe_feed': 'Swipe products',
  'home.like_tiktok': 'Like TikTok',
  'home.on_map': 'On map',
  'home.near_you': 'Near you',
  'home.farmer_goods': 'Farmer goods',
  'home.fresh_nearby': 'Fresh from farm nearby',
};

const COMMON_PL: TranslationNamespace = {
  'app.name': 'KETMAR Market',
  'common.loading': 'Ładowanie...',
  'common.error': 'Błąd',
  'common.retry': 'Ponów',
  'common.cancel': 'Anuluj',
  'common.save': 'Zapisz',
  'common.delete': 'Usuń',
  'common.edit': 'Edytuj',
  'common.close': 'Zamknij',
  'common.search': 'Szukaj',
  'common.filter': 'Filtr',
  'common.sort': 'Sortuj',
  'common.more': 'Więcej',
  'common.show_all': 'Pokaż wszystko',
  'common.back': 'Wstecz',
  'common.next': 'Dalej',
  'common.done': 'Gotowe',
  'common.yes': 'Tak',
  'common.no': 'Nie',
  'common.price': 'Cena',
  'common.free': 'Za darmo',
  'common.negotiable': 'Do negocjacji',
  'common.cta.post': 'Dodaj ogłoszenie',
  'common.cta.view_feed': 'Zobacz ogłoszenia',
  'common.cta.contact': 'Kontakt',
  'common.cta.call': 'Zadzwoń',
  'common.cta.message': 'Napisz',
  'common.banner.give_away': 'Masz coś do oddania?',
  'common.all': 'Wszystkie',
  'common.no_ads': 'Brak ogłoszeń',
  'common.create_first': 'Utwórz pierwsze ogłoszenie klikając przycisk powyżej',
  'feed.title': 'Ogłoszenia',
  'feed.empty': 'Brak ogłoszeń',
  'feed.nearby': 'W pobliżu',
  'feed.all': 'Wszystkie ogłoszenia',
  'feed.scope.local': 'Lokalne',
  'feed.scope.country': 'Cały kraj',
  'search.placeholder': 'Czego szukasz?',
  'search.recent': 'Ostatnie',
  'search.hot': 'Popularne',
  'search.no_results': 'Brak wyników',
  'favorites.title': 'Ulubione',
  'favorites.empty': 'Brak ulubionych',
  'favorites.added': 'Dodano do ulubionych',
  'favorites.removed': 'Usunięto z ulubionych',
  'profile.title': 'Profil',
  'profile.my_ads': 'Moje ogłoszenia',
  'profile.settings': 'Ustawienia',
  'profile.logout': 'Wyloguj',
  'ad.views': 'wyświetleń',
  'ad.contacts': 'kontaktów',
  'ad.distance': 'od Ciebie',
  'ad.posted': 'Dodano',
  'ad.updated': 'Aktualizacja',
  'ad.status.active': 'Aktywne',
  'ad.status.sold': 'Sprzedane',
  'ad.status.pending': 'W moderacji',
  'ad.status.expired': 'Wygasło',
  'create.title': 'Nowe ogłoszenie',
  'create.step.photos': 'Zdjęcia',
  'create.step.details': 'Szczegóły',
  'create.step.price': 'Cena',
  'create.step.location': 'Lokalizacja',
  'create.step.confirm': 'Potwierdź',
  'create.photo.add': 'Dodaj zdjęcie',
  'create.photo.main': 'Główne zdjęcie',
  'create.title_placeholder': 'Nazwa przedmiotu',
  'create.description_placeholder': 'Opis...',
  'create.price_placeholder': 'Podaj cenę',
  'create.publish': 'Opublikuj',
  'location.detecting': 'Wykrywanie lokalizacji...',
  'location.change': 'Zmień',
  'location.radius': 'Promień wyszukiwania',
  'location.your_area': 'Twoja okolica',
  'region.select': 'Wybór regionu',
  'region.currency': 'Waluta',
  'region.language': 'Język',
  'nav.home': 'Główna',
  'nav.feed': 'Lista',
  'nav.my_ads': 'Moje',
  'nav.chats': 'Czaty',
  'nav.favorites': 'Ulubione',
  'nav.profile': 'Profil',
  'my_ads.title': 'Moje ogłoszenia',
  'my_ads.create': 'Utwórz',
  'my_ads.active': 'Aktywne',
  'my_ads.archive': 'Archiwum',
  'cat.farmers': 'Rolnicy',
  'cat.bakery': 'Pieczywo',
  'cat.food': 'Jedzenie',
  'cat.free': 'Za darmo',
  'cat.clothes': 'Ubrania',
  'cat.shoes': 'Buty',
  'cat.home': 'Dom',
  'cat.tech': 'Technika',
  'cat.agro': 'Rolnictwo',
  'cat.services': 'Usługi',
  'cat.rental': 'Wynajem',
  'cat.items': 'Rzeczy',
  'home.swipe_feed': 'Przeglądaj',
  'home.like_tiktok': 'Jak w TikTok',
  'home.on_map': 'Na mapie',
  'home.near_you': 'W pobliżu',
  'home.farmer_goods': 'Produkty rolników',
  'home.fresh_nearby': 'Świeże z farmy w pobliżu',
};

function initializeTranslations() {
  if (isInitialized) return;
  
  translations.ru = { common: COMMON_RU };
  translations.en = { common: COMMON_EN };
  translations.pl = { common: COMMON_PL };
  
  isInitialized = true;
}

/**
 * Set current language
 */
export function setLanguage(lang: LanguageCode) {
  currentLanguage = lang;
}

/**
 * Get current language
 */
export function getLanguage(): LanguageCode {
  return currentLanguage;
}

/**
 * Translate key to current language
 * @param key - Translation key (e.g., 'common.loading')
 * @param params - Interpolation parameters
 */
export function t(key: string, params?: Record<string, string | number>): string {
  initializeTranslations();
  
  const allTranslations = Object.values(translations[currentLanguage] || {});
  let text: string | undefined;
  
  for (const namespace of allTranslations) {
    if (namespace[key]) {
      text = namespace[key];
      break;
    }
  }
  
  if (!text && currentLanguage !== 'en') {
    const fallbackTranslations = Object.values(translations.en || {});
    for (const namespace of fallbackTranslations) {
      if (namespace[key]) {
        text = namespace[key];
        break;
      }
    }
  }
  
  if (!text) {
    return key;
  }
  
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      text = text!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
      text = text!.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
    });
  }
  
  return text;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Array<{ code: LanguageCode; name: string }> {
  return [
    { code: 'ru', name: 'Русский' },
    { code: 'en', name: 'English' },
    { code: 'pl', name: 'Polski' },
  ];
}

export type { LanguageCode };
