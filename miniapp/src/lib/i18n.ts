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
  const stored = localStorage.getItem('region-storage');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed?.state?.language && ['ru', 'en', 'pl'].includes(parsed.state.language)) {
      currentLanguage = parsed.state.language as LanguageCode;
      console.log('🌍 [i18n] Loaded language from storage:', currentLanguage);
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
  'region.select': 'Выбор региона',
  'region.currency': 'Валюта',
  'region.language': 'Язык',
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
  'region.select': 'Select region',
  'region.currency': 'Currency',
  'region.language': 'Language',
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
  'region.select': 'Wybór regionu',
  'region.currency': 'Waluta',
  'region.language': 'Język',
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
