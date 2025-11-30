/**
 * Система умных бейджей для карточек объявлений
 * Определяет тип бейджа на основе данных объявления
 */

export type BadgeType = 'farmer' | 'garden' | 'secondhand' | 'free';

export interface BadgeConfig {
  text: string;
  background: string;
  color: string;
  icon?: string;
}

// Категории продуктов из огорода (от физлиц)
const GARDEN_CATEGORIES = [
  'sad-ogorod',
  'ogorod', 
  'fruits',
  'vegetables',
  'yagody',
  'zelen',
  'ovoschi',
  'frukty',
  'kartoshka',
  'morkov',
  'pomidory',
  'ogurtsy',
];

// Категории фермерских продуктов
const FARMER_CATEGORIES = [
  'farmer-market',
  'farmer-vegetables',
  'farmer-fruits',
  'farmer-dairy',
  'farmer-meat',
  'farmer-honey',
  'farmer-potato',
];

export const BADGE_CONFIGS: Record<BadgeType, BadgeConfig> = {
  farmer: { 
    text: 'Фермер', 
    background: '#22C55E', 
    color: '#FFFFFF',
  },
  garden: { 
    text: 'Из огорода', 
    background: '#84CC16', 
    color: '#FFFFFF',
  },
  secondhand: { 
    text: 'Б/У', 
    background: '#F59E0B', 
    color: '#FFFFFF',
  },
  free: { 
    text: 'Даром', 
    background: '#EC4899', 
    color: '#FFFFFF',
  },
};

interface AdForBadge {
  price?: number;
  isFreeGiveaway?: boolean;
  isFarmerAd?: boolean;
  categoryId?: string;
  subcategoryId?: string;
  sellerId?: string;
  sellerProfileId?: string;
}

/**
 * Определяет тип бейджа для объявления
 * @param ad - Объявление с необходимыми полями
 * @returns Тип бейджа
 */
export function getBadgeType(ad: AdForBadge): BadgeType {
  // 1. Бесплатно (Даром)
  if (ad.isFreeGiveaway || ad.price === 0) {
    return 'free';
  }
  
  // 2. От профессионального фермера (есть профиль или флаг)
  if (ad.isFarmerAd) {
    return 'farmer';
  }
  
  // 3. Проверяем категорию
  const category = ad.categoryId?.toLowerCase() || '';
  const subcategory = ad.subcategoryId?.toLowerCase() || '';
  
  // Категории фермерского рынка → Фермер
  if (FARMER_CATEGORIES.some(fc => category.includes(fc) || subcategory.includes(fc))) {
    // Если нет профиля фермера, считаем что это "Из огорода"
    if (!ad.sellerProfileId) {
      return 'garden';
    }
    return 'farmer';
  }
  
  // Категории огорода (от физлица) → Из огорода
  if (GARDEN_CATEGORIES.some(gc => category.includes(gc) || subcategory.includes(gc))) {
    return 'garden';
  }
  
  // 4. Б/У товары по умолчанию
  return 'secondhand';
}

/**
 * Получает конфигурацию бейджа для объявления
 * @param ad - Объявление с необходимыми полями
 * @returns Конфигурация бейджа (текст, цвета)
 */
export function getBadgeConfig(ad: AdForBadge): BadgeConfig {
  const badgeType = getBadgeType(ad);
  return BADGE_CONFIGS[badgeType];
}

/**
 * Проверяет, является ли объявление продуктом питания
 */
export function isFoodProduct(ad: AdForBadge): boolean {
  const badgeType = getBadgeType(ad);
  return badgeType === 'farmer' || badgeType === 'garden';
}
