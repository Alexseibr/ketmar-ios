export type ZoneType = 'village' | 'suburb' | 'city_center';

export type BlockType = 
  | 'banners'
  | 'darom'
  | 'farmer'
  | 'services'
  | 'garden_help'
  | 'lawn_mowing'
  | 'cleaning'
  | 'local_shops'
  | 'author_brands'
  | 'beauty'
  | 'trending'
  | 'demand'
  | 'machinery'
  | 'tools'
  | 'handmade'
  | 'seasonal_fairs'
  | 'snow_cleaning'
  | 'village_offers'
  | 'new_arrivals'
  | 'discounts';

export interface BlockConfig {
  type: BlockType;
  title: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  link?: string;
  priority: number;
  maxItems?: number;
}

export interface ZoneConfig {
  blocks: BlockType[];
  excludeCategories: string[];
  includeCategories: string[];
  uiTheme: {
    buttonSize: 'large' | 'medium' | 'small';
    cardStyle: 'simple' | 'standard' | 'fancy';
    animations: boolean;
    colorAccent: string;
  };
}

export const ZONE_CONFIGS: Record<ZoneType, ZoneConfig> = {
  village: {
    blocks: [
      'banners',
      'darom',
      'garden_help',
      'machinery',
      'farmer',
      'village_offers',
      'demand',
      'handmade',
      'tools',
    ],
    excludeCategories: [
      'beauty',
      'fashion',
      'author-brands',
      'cleaning-city',
      'barber',
    ],
    includeCategories: [
      'farmer-market',
      'selhoztekhnika',
      'ogorod',
      'zhivotnye',
      'darom',
      'stroymaterialy',
      'bytovye-melochi',
    ],
    uiTheme: {
      buttonSize: 'large',
      cardStyle: 'simple',
      animations: false,
      colorAccent: '#059669',
    },
  },
  suburb: {
    blocks: [
      'banners',
      'garden_help',
      'lawn_mowing',
      'cleaning',
      'services',
      'snow_cleaning',
      'local_shops',
      'author_brands',
      'demand',
      'trending',
      'farmer',
    ],
    excludeCategories: [
      'selhoztekhnika',
      'traktora',
    ],
    includeCategories: [
      'uslugi',
      'remont',
      'cleaning',
      'garden',
      'bytovye-melochi',
      'elektronika',
      'farmer-market',
    ],
    uiTheme: {
      buttonSize: 'medium',
      cardStyle: 'standard',
      animations: true,
      colorAccent: '#6366f1',
    },
  },
  city_center: {
    blocks: [
      'banners',
      'author_brands',
      'beauty',
      'cleaning',
      'local_shops',
      'services',
      'trending',
      'demand',
      'handmade',
      'new_arrivals',
      'discounts',
    ],
    excludeCategories: [
      'selhoztekhnika',
      'traktora',
      'ogorod',
      'vspashka',
      'zhivotnye',
    ],
    includeCategories: [
      'beauty',
      'author-brands',
      'uslugi',
      'cleaning',
      'odezhda',
      'elektronika',
      'handmade',
    ],
    uiTheme: {
      buttonSize: 'small',
      cardStyle: 'fancy',
      animations: true,
      colorAccent: '#ec4899',
    },
  },
};

export const BLOCK_CONFIGS: Record<BlockType, Omit<BlockConfig, 'priority'>> = {
  banners: {
    type: 'banners',
    title: 'Акции',
    maxItems: 5,
  },
  darom: {
    type: 'darom',
    title: 'Отдам даром',
    subtitle: 'Бесплатные вещи рядом',
    icon: 'gift',
    accentColor: '#ec4899',
    link: '/category/darom',
    maxItems: 10,
  },
  farmer: {
    type: 'farmer',
    title: 'Фермерские товары',
    subtitle: 'Свежее с фермы',
    icon: 'tractor',
    accentColor: '#059669',
    link: '/category/farmer-market',
    maxItems: 10,
  },
  services: {
    type: 'services',
    title: 'Услуги',
    subtitle: 'Мастера рядом',
    icon: 'wrench',
    accentColor: '#6366f1',
    link: '/category/uslugi',
    maxItems: 10,
  },
  garden_help: {
    type: 'garden_help',
    title: 'Помощь в огороде',
    subtitle: 'Копка, вспашка, посадка',
    icon: 'shovel',
    accentColor: '#84cc16',
    link: '/category/ogorod',
    maxItems: 8,
  },
  lawn_mowing: {
    type: 'lawn_mowing',
    title: 'Покос травы',
    subtitle: 'Уход за газоном',
    icon: 'grass',
    accentColor: '#22c55e',
    link: '/search?q=покос',
    maxItems: 8,
  },
  cleaning: {
    type: 'cleaning',
    title: 'Уборка',
    subtitle: 'Клининг домов и квартир',
    icon: 'sparkles',
    accentColor: '#06b6d4',
    link: '/category/cleaning',
    maxItems: 8,
  },
  local_shops: {
    type: 'local_shops',
    title: 'Магазины рядом',
    subtitle: 'Локальные продавцы',
    icon: 'store',
    accentColor: '#8b5cf6',
    link: '/shops',
    maxItems: 8,
  },
  author_brands: {
    type: 'author_brands',
    title: 'Авторские бренды',
    subtitle: 'Уникальные товары',
    icon: 'palette',
    accentColor: '#f472b6',
    link: '/brands',
    maxItems: 8,
  },
  beauty: {
    type: 'beauty',
    title: 'Красота',
    subtitle: 'Маникюр, макияж, уход',
    icon: 'lipstick',
    accentColor: '#f43f5e',
    link: '/category/beauty',
    maxItems: 8,
  },
  trending: {
    type: 'trending',
    title: 'Популярное сейчас',
    subtitle: 'Тренды недели',
    icon: 'fire',
    accentColor: '#f59e0b',
    link: '/trending',
    maxItems: 10,
  },
  demand: {
    type: 'demand',
    title: 'Ищут рядом',
    subtitle: 'Спрос в вашем районе',
    icon: 'search',
    accentColor: '#3b82f6',
    link: '/demand',
    maxItems: 6,
  },
  machinery: {
    type: 'machinery',
    title: 'Техника',
    subtitle: 'Запчасти и оборудование',
    icon: 'tractor',
    accentColor: '#78716c',
    link: '/category/selhoztekhnika',
    maxItems: 8,
  },
  tools: {
    type: 'tools',
    title: 'Инструменты',
    subtitle: 'Аренда и продажа',
    icon: 'hammer',
    accentColor: '#a3a3a3',
    link: '/category/arenda',
    maxItems: 8,
  },
  handmade: {
    type: 'handmade',
    title: 'Ручная работа',
    subtitle: 'Handmade товары',
    icon: 'heart',
    accentColor: '#e879f9',
    link: '/category/handmade',
    maxItems: 8,
  },
  seasonal_fairs: {
    type: 'seasonal_fairs',
    title: 'Сезонные ярмарки',
    subtitle: 'Актуальные события',
    icon: 'calendar',
    accentColor: '#14b8a6',
    maxItems: 4,
  },
  snow_cleaning: {
    type: 'snow_cleaning',
    title: 'Уборка снега',
    subtitle: 'Чистка территории',
    icon: 'snowflake',
    accentColor: '#38bdf8',
    link: '/search?q=уборка+снега',
    maxItems: 6,
  },
  village_offers: {
    type: 'village_offers',
    title: 'Деревенские товары',
    subtitle: 'Местное производство',
    icon: 'home',
    accentColor: '#a78bfa',
    maxItems: 10,
  },
  new_arrivals: {
    type: 'new_arrivals',
    title: 'Новинки',
    subtitle: 'Свежие объявления',
    icon: 'sparkles',
    accentColor: '#10b981',
    maxItems: 10,
  },
  discounts: {
    type: 'discounts',
    title: 'Со скидкой',
    subtitle: 'Выгодные предложения',
    icon: 'tag',
    accentColor: '#f97316',
    link: '/feed?discount=true',
    maxItems: 10,
  },
};

export function getBlocksForZone(zone: ZoneType): BlockConfig[] {
  const config = ZONE_CONFIGS[zone];
  return config.blocks.map((blockType, index) => ({
    ...BLOCK_CONFIGS[blockType],
    priority: index + 1,
  }));
}

export function getZoneUITheme(zone: ZoneType) {
  return ZONE_CONFIGS[zone].uiTheme;
}
