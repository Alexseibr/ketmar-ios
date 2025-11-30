import { 
  Package, PlusCircle, BarChart3, TrendingUp, Crown, Calendar, 
  ClipboardList, FileText, Image, Store, Tractor, Camera, Palette,
  Instagram, Send, MessageCircle
} from 'lucide-react';

export type ShopRole = 'SHOP' | 'FARMER' | 'BLOGGER' | 'ARTISAN';

export type TabType = 
  | 'products' 
  | 'orders' 
  | 'create' 
  | 'stats' 
  | 'demand' 
  | 'subscription' 
  | 'fairs'
  | 'requests'
  | 'posts'
  | 'social';

export interface TabConfig {
  key: TabType;
  label: string;
  icon: any;
  color: string;
  description?: string;
}

export interface FairConfig {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  bannerGradient: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  emoji: string;
  categories: string[];
}

export interface BusinessTypeConfig {
  tabs: TabType[];
  fairs: string[];
  categoryGroups: CategoryGroup[];
  enableSocialLinks: boolean;
  trackSocialClicks: boolean;
  features: {
    orders: boolean;
    requests: boolean;
    posts: boolean;
    socialStats: boolean;
    seasonStats: boolean;
    farmerTips: boolean;
  };
}

export const ALL_TABS: TabConfig[] = [
  { key: 'products', label: 'Товары', icon: Package, color: '#10B981', description: 'Ваши объявления' },
  { key: 'orders', label: 'Заказы', icon: ClipboardList, color: '#F97316', description: 'Управление заказами' },
  { key: 'requests', label: 'Заявки', icon: FileText, color: '#06B6D4', description: 'Входящие заявки' },
  { key: 'posts', label: 'Публикации', icon: Image, color: '#EC4899', description: 'Посты и контент' },
  { key: 'create', label: 'Подать', icon: PlusCircle, color: '#F59E0B', description: 'Новое объявление' },
  { key: 'stats', label: 'Статистика', icon: BarChart3, color: '#3B73FC', description: 'Аналитика продаж' },
  { key: 'demand', label: 'Спрос', icon: TrendingUp, color: '#8B5CF6', description: 'Что ищут покупатели' },
  { key: 'subscription', label: 'PRO', icon: Crown, color: '#F59E0B', description: 'Расширенные функции' },
  { key: 'fairs', label: 'Ярмарки', icon: Calendar, color: '#EC4899', description: 'Сезонные события' },
];

export const ALL_FAIRS: FairConfig[] = [
  {
    id: 'new_year',
    slug: 'new-year',
    name: 'Новогодняя ярмарка',
    emoji: '🎄',
    description: 'Подарки и украшения к Новому году',
    color: '#EF4444',
    bannerGradient: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
  },
  {
    id: 'gifts',
    slug: 'gifts',
    name: 'Подарки',
    emoji: '🎁',
    description: 'Уникальные подарки на любой случай',
    color: '#EC4899',
    bannerGradient: 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
  },
  {
    id: 'handmade',
    slug: 'handmade',
    name: 'Handmade',
    emoji: '✨',
    description: 'Изделия ручной работы',
    color: '#8B5CF6',
    bannerGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  },
  {
    id: 'tulips',
    slug: 'tulips',
    name: '8 Марта',
    emoji: '🌷',
    description: 'Цветы и подарки к 8 марта',
    color: '#F472B6',
    bannerGradient: 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)',
  },
  {
    id: 'harvest',
    slug: 'harvest',
    name: 'Урожай',
    emoji: '🌾',
    description: 'Свежий урожай с поля',
    color: '#F59E0B',
    bannerGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  },
  {
    id: 'autumn_fair',
    slug: 'autumn-fair',
    name: 'Осенняя ярмарка',
    emoji: '🍂',
    description: 'Осенние продукты и заготовки',
    color: '#EA580C',
    bannerGradient: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)',
  },
  {
    id: 'berries',
    slug: 'berries',
    name: 'Ягодный сезон',
    emoji: '🍓',
    description: 'Свежие ягоды',
    color: '#DC2626',
    bannerGradient: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
  },
  {
    id: 'honey',
    slug: 'honey',
    name: 'Медовый спас',
    emoji: '🍯',
    description: 'Мёд и продукты пчеловодства',
    color: '#D97706',
    bannerGradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
  },
];

export const CATEGORY_GROUPS: Record<string, CategoryGroup[]> = {
  retail: [
    { id: 'home', name: 'Товары для дома', emoji: '🏠', categories: ['furniture', 'decor', 'textile', 'lighting'] },
    { id: 'clothes', name: 'Одежда и обувь', emoji: '👗', categories: ['clothes', 'shoes', 'accessories'] },
    { id: 'tech', name: 'Техника', emoji: '📱', categories: ['phones', 'computers', 'appliances'] },
    { id: 'cosmetics', name: 'Косметика', emoji: '💄', categories: ['skincare', 'makeup', 'perfume'] },
    { id: 'food', name: 'Продукты', emoji: '🛒', categories: ['grocery', 'drinks', 'snacks'] },
  ],
  farmer: [
    { id: 'vegetables', name: 'Овощи', emoji: '🥕', categories: ['tomatoes', 'cucumbers', 'potatoes', 'carrots', 'onions'] },
    { id: 'fruits', name: 'Фрукты', emoji: '🍎', categories: ['apples', 'pears', 'plums', 'grapes'] },
    { id: 'berries', name: 'Ягоды', emoji: '🍓', categories: ['strawberries', 'raspberries', 'blueberries', 'currants'] },
    { id: 'dairy', name: 'Молочка', emoji: '🥛', categories: ['milk', 'cheese', 'sour_cream', 'cottage_cheese'] },
    { id: 'meat', name: 'Мясо и птица', emoji: '🥩', categories: ['beef', 'pork', 'chicken', 'rabbit'] },
    { id: 'eggs', name: 'Яйца', emoji: '🥚', categories: ['chicken_eggs', 'quail_eggs', 'duck_eggs'] },
    { id: 'honey', name: 'Мёд', emoji: '🍯', categories: ['flower_honey', 'buckwheat_honey', 'linden_honey'] },
    { id: 'preserves', name: 'Заготовки', emoji: '🫙', categories: ['pickles', 'jams', 'sauces'] },
  ],
  author_brand: [
    { id: 'baking', name: 'Авторская выпечка', emoji: '🧁', categories: ['cakes', 'pastries', 'cookies', 'bread'] },
    { id: 'bags', name: 'Сумки и аксессуары', emoji: '👜', categories: ['handbags', 'wallets', 'belts'] },
    { id: 'clothing', name: 'Пошив одежды', emoji: '👔', categories: ['dresses', 'suits', 'alterations'] },
    { id: 'pillows', name: 'Текстиль', emoji: '🛋️', categories: ['pillows', 'blankets', 'curtains'] },
    { id: 'premium', name: 'Handmade Premium', emoji: '💎', categories: ['luxury', 'exclusive', 'limited'] },
    { id: 'courses', name: 'Курсы и обучение', emoji: '📚', categories: ['workshops', 'masterclasses', 'tutorials'] },
    { id: 'beauty', name: 'Beauty-услуги', emoji: '💅', categories: ['manicure', 'makeup', 'hair'] },
  ],
  artisan: [
    { id: 'wood', name: 'Изделия из дерева', emoji: '🪵', categories: ['furniture', 'decor', 'toys', 'utensils'] },
    { id: 'ceramics', name: 'Керамика и глина', emoji: '🏺', categories: ['pottery', 'tiles', 'sculptures'] },
    { id: 'candles', name: 'Свечи', emoji: '🕯️', categories: ['decorative', 'aromatic', 'massage'] },
    { id: 'soap', name: 'Мыло', emoji: '🧼', categories: ['handmade', 'aromatic', 'gift_sets'] },
    { id: 'toys', name: 'Игрушки', emoji: '🧸', categories: ['soft_toys', 'wooden_toys', 'educational'] },
    { id: 'decor', name: 'Декор', emoji: '🎨', categories: ['wall_art', 'figurines', 'vases'] },
    { id: 'jewelry', name: 'Украшения', emoji: '💍', categories: ['rings', 'necklaces', 'earrings', 'bracelets'] },
  ],
};

export const BUSINESS_CONFIG: Record<ShopRole, BusinessTypeConfig> = {
  SHOP: {
    tabs: ['products', 'orders', 'create', 'stats', 'demand', 'subscription', 'fairs'],
    fairs: ['new_year', 'gifts', 'tulips'],
    categoryGroups: CATEGORY_GROUPS.retail,
    enableSocialLinks: false,
    trackSocialClicks: false,
    features: {
      orders: true,
      requests: false,
      posts: false,
      socialStats: false,
      seasonStats: false,
      farmerTips: false,
    },
  },
  FARMER: {
    tabs: ['products', 'orders', 'create', 'stats', 'demand', 'subscription', 'fairs'],
    fairs: ['harvest', 'autumn_fair', 'berries', 'honey'],
    categoryGroups: CATEGORY_GROUPS.farmer,
    enableSocialLinks: false,
    trackSocialClicks: false,
    features: {
      orders: true,
      requests: false,
      posts: false,
      socialStats: false,
      seasonStats: true,
      farmerTips: true,
    },
  },
  BLOGGER: {
    tabs: ['products', 'requests', 'posts', 'create', 'stats', 'demand', 'subscription', 'fairs'],
    fairs: ['new_year', 'gifts', 'handmade'],
    categoryGroups: CATEGORY_GROUPS.author_brand,
    enableSocialLinks: true,
    trackSocialClicks: true,
    features: {
      orders: false,
      requests: true,
      posts: true,
      socialStats: true,
      seasonStats: false,
      farmerTips: false,
    },
  },
  ARTISAN: {
    tabs: ['products', 'orders', 'create', 'stats', 'demand', 'subscription', 'fairs'],
    fairs: ['new_year', 'gifts', 'handmade'],
    categoryGroups: CATEGORY_GROUPS.artisan,
    enableSocialLinks: true,
    trackSocialClicks: true,
    features: {
      orders: true,
      requests: true,
      posts: false,
      socialStats: true,
      seasonStats: false,
      farmerTips: false,
    },
  },
};

export const ROLE_LABELS: Record<ShopRole, { emoji: string; label: string; shortLabel: string }> = {
  SHOP: { emoji: '🏪', label: 'Магазин', shortLabel: 'Магазин' },
  FARMER: { emoji: '🌾', label: 'Фермер', shortLabel: 'Фермер' },
  BLOGGER: { emoji: '📸', label: 'Авторский бренд', shortLabel: 'Автор' },
  ARTISAN: { emoji: '🎨', label: 'Ремесленник', shortLabel: 'Мастер' },
};

export const ROLE_BADGES: Record<ShopRole, { label: string; emoji: string; color: string; bgColor: string }> = {
  FARMER: { label: 'Фермер', emoji: '🌾', color: '#047857', bgColor: '#D1FAE5' },
  SHOP: { label: 'Магазин', emoji: '🏪', color: '#1D4ED8', bgColor: '#DBEAFE' },
  BLOGGER: { label: 'Авторский бренд', emoji: '📸', color: '#BE185D', bgColor: '#FCE7F3' },
  ARTISAN: { label: 'Ремесленник', emoji: '🎨', color: '#6D28D9', bgColor: '#EDE9FE' },
};

export const ROLE_GRADIENTS: Record<ShopRole, { gradient: string; iconBgColor: string }> = {
  FARMER: {
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    iconBgColor: '#059669',
  },
  SHOP: {
    gradient: 'linear-gradient(135deg, #3B73FC 0%, #2563EB 100%)',
    iconBgColor: '#3B73FC',
  },
  BLOGGER: {
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
    iconBgColor: '#EC4899',
  },
  ARTISAN: {
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    iconBgColor: '#8B5CF6',
  },
};

export const ROLE_ICONS: Record<ShopRole, any> = {
  SHOP: Store,
  FARMER: Tractor,
  BLOGGER: Camera,
  ARTISAN: Palette,
};

export function getTabsForRole(role: ShopRole): TabConfig[] {
  const config = BUSINESS_CONFIG[role];
  return ALL_TABS.filter(tab => config.tabs.includes(tab.key));
}

export function getFairsForRole(role: ShopRole): FairConfig[] {
  const config = BUSINESS_CONFIG[role];
  return ALL_FAIRS.filter(fair => config.fairs.includes(fair.id));
}

export function getCategoriesForRole(role: ShopRole): CategoryGroup[] {
  return BUSINESS_CONFIG[role].categoryGroups;
}

export function canAccessFeature(role: ShopRole, feature: keyof BusinessTypeConfig['features']): boolean {
  return BUSINESS_CONFIG[role].features[feature];
}

export function shouldShowSocialLinks(role: ShopRole): boolean {
  return BUSINESS_CONFIG[role].enableSocialLinks;
}

export function shouldTrackSocialClicks(role: ShopRole): boolean {
  return BUSINESS_CONFIG[role].trackSocialClicks;
}

// === Multi-Role Support Functions ===

export function getTabsForRoles(roles: ShopRole[]): TabConfig[] {
  if (!roles || roles.length === 0) return getTabsForRole('SHOP');
  
  const allTabKeys = new Set<TabType>();
  roles.forEach(role => {
    const config = BUSINESS_CONFIG[role];
    config.tabs.forEach(tab => allTabKeys.add(tab));
  });
  
  return ALL_TABS.filter(tab => allTabKeys.has(tab.key));
}

export function getFairsForRoles(roles: ShopRole[]): FairConfig[] {
  if (!roles || roles.length === 0) return getFairsForRole('SHOP');
  
  const allFairIds = new Set<string>();
  roles.forEach(role => {
    const config = BUSINESS_CONFIG[role];
    config.fairs.forEach(fairId => allFairIds.add(fairId));
  });
  
  return ALL_FAIRS.filter(fair => allFairIds.has(fair.id));
}

export function getCategoriesForRoles(roles: ShopRole[]): CategoryGroup[] {
  if (!roles || roles.length === 0) return getCategoriesForRole('SHOP');
  
  const allCategories: CategoryGroup[] = [];
  const seenIds = new Set<string>();
  
  roles.forEach(role => {
    const groups = BUSINESS_CONFIG[role].categoryGroups;
    groups.forEach(group => {
      if (!seenIds.has(group.id)) {
        seenIds.add(group.id);
        allCategories.push(group);
      }
    });
  });
  
  return allCategories;
}

export function canAccessFeatureWithRoles(roles: ShopRole[], feature: keyof BusinessTypeConfig['features']): boolean {
  if (!roles || roles.length === 0) return canAccessFeature('SHOP', feature);
  return roles.some(role => BUSINESS_CONFIG[role].features[feature]);
}

export function shouldShowSocialLinksForRoles(roles: ShopRole[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some(role => BUSINESS_CONFIG[role].enableSocialLinks);
}

export function shouldTrackSocialClicksForRoles(roles: ShopRole[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some(role => BUSINESS_CONFIG[role].trackSocialClicks);
}

export function getMergedConfigForRoles(roles: ShopRole[]): BusinessTypeConfig {
  if (!roles || roles.length === 0) return BUSINESS_CONFIG['SHOP'];
  if (roles.length === 1) return BUSINESS_CONFIG[roles[0]];
  
  const allTabKeys = new Set<TabType>();
  const allFairIds = new Set<string>();
  const allCategoryGroups: CategoryGroup[] = [];
  const seenGroupIds = new Set<string>();
  let enableSocialLinks = false;
  let trackSocialClicks = false;
  const features = {
    orders: false,
    requests: false,
    posts: false,
    socialStats: false,
    seasonStats: false,
    farmerTips: false,
  };
  
  roles.forEach(role => {
    const config = BUSINESS_CONFIG[role];
    config.tabs.forEach(tab => allTabKeys.add(tab));
    config.fairs.forEach(fairId => allFairIds.add(fairId));
    config.categoryGroups.forEach(group => {
      if (!seenGroupIds.has(group.id)) {
        seenGroupIds.add(group.id);
        allCategoryGroups.push(group);
      }
    });
    if (config.enableSocialLinks) enableSocialLinks = true;
    if (config.trackSocialClicks) trackSocialClicks = true;
    Object.keys(features).forEach(key => {
      if (config.features[key as keyof typeof features]) {
        features[key as keyof typeof features] = true;
      }
    });
  });
  
  return {
    tabs: Array.from(allTabKeys),
    fairs: Array.from(allFairIds),
    categoryGroups: allCategoryGroups,
    enableSocialLinks,
    trackSocialClicks,
    features,
  };
}
