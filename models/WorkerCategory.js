import mongoose from 'mongoose';

const workerCategorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: '🔧',
    },
    parentSlug: {
      type: String,
      default: null,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    keywords: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

workerCategorySchema.statics.getDefaultCategories = function() {
  return [
    { slug: 'construction', name: 'Стройка', icon: '🏗️', parentSlug: null, order: 1 },
    { slug: 'plaster', name: 'Штукатур', icon: '🧱', parentSlug: 'construction', order: 1, keywords: ['штукатурка', 'выравнивание'] },
    { slug: 'painter', name: 'Маляр', icon: '🎨', parentSlug: 'construction', order: 2, keywords: ['покраска', 'малярные'] },
    { slug: 'drywall', name: 'Гипсокартон', icon: '📐', parentSlug: 'construction', order: 3, keywords: ['гкл', 'перегородки'] },
    { slug: 'tiler', name: 'Плиточник', icon: '🔲', parentSlug: 'construction', order: 4, keywords: ['плитка', 'кафель', 'укладка'] },
    { slug: 'facade', name: 'Фасадчик', icon: '🏢', parentSlug: 'construction', order: 5, keywords: ['фасад', 'утепление'] },
    { slug: 'concrete', name: 'Бетонщик', icon: '🪨', parentSlug: 'construction', order: 6, keywords: ['бетон', 'заливка', 'стяжка'] },
    { slug: 'helper', name: 'Подсобный рабочий', icon: '👷', parentSlug: 'construction', order: 7, keywords: ['подсобник', 'разнорабочий'] },
    { slug: 'demolition', name: 'Демонтаж', icon: '🔨', parentSlug: 'construction', order: 8, keywords: ['демонтаж', 'снос'] },
    { slug: 'roofer', name: 'Кровельщик', icon: '🏠', parentSlug: 'construction', order: 9, keywords: ['кровля', 'крыша'] },
    
    { slug: 'plumbing', name: 'Сантехника', icon: '🚿', parentSlug: null, order: 2 },
    { slug: 'plumber', name: 'Сантехник', icon: '🔧', parentSlug: 'plumbing', order: 1, keywords: ['сантехник', 'трубы', 'краны'] },
    { slug: 'heating', name: 'Отопление', icon: '🌡️', parentSlug: 'plumbing', order: 2, keywords: ['котёл', 'радиаторы', 'тёплый пол'] },
    { slug: 'water-supply', name: 'Водоснабжение', icon: '💧', parentSlug: 'plumbing', order: 3, keywords: ['водопровод', 'насос', 'скважина'] },
    
    { slug: 'electrical', name: 'Электрика', icon: '⚡', parentSlug: null, order: 3 },
    { slug: 'electrician', name: 'Электрик', icon: '💡', parentSlug: 'electrical', order: 1, keywords: ['электрик', 'проводка', 'розетки'] },
    { slug: 'wiring', name: 'Разводка', icon: '🔌', parentSlug: 'electrical', order: 2, keywords: ['кабель', 'проводка'] },
    { slug: 'switchboard', name: 'Монтаж щитов', icon: '📦', parentSlug: 'electrical', order: 3, keywords: ['щит', 'автоматы'] },
    { slug: 'lighting', name: 'Освещение', icon: '✨', parentSlug: 'electrical', order: 4, keywords: ['светильники', 'люстры'] },
    
    { slug: 'carpentry', name: 'Плотник / Столяр', icon: '🪵', parentSlug: null, order: 4 },
    { slug: 'carpenter', name: 'Плотник', icon: '🪓', parentSlug: 'carpentry', order: 1, keywords: ['плотник', 'дерево'] },
    { slug: 'joiner', name: 'Столяр', icon: '🪑', parentSlug: 'carpentry', order: 2, keywords: ['столяр', 'мебель'] },
    { slug: 'furniture-assembly', name: 'Сборка мебели', icon: '🛋️', parentSlug: 'carpentry', order: 3, keywords: ['сборка', 'мебель', 'ikea'] },
    
    { slug: 'welding', name: 'Сварка', icon: '🔥', parentSlug: null, order: 5 },
    { slug: 'welder', name: 'Сварщик', icon: '⚙️', parentSlug: 'welding', order: 1, keywords: ['сварка', 'металл'] },
    { slug: 'fences', name: 'Заборы', icon: '🚧', parentSlug: 'welding', order: 2, keywords: ['забор', 'ограждение'] },
    { slug: 'frames', name: 'Каркасы', icon: '🏗️', parentSlug: 'welding', order: 3, keywords: ['каркас', 'конструкция'] },
    { slug: 'metal-structures', name: 'Металлоконструкции', icon: '🔩', parentSlug: 'welding', order: 4, keywords: ['металл', 'конструкции'] },
    
    { slug: 'home-services', name: 'Домашние услуги', icon: '🏡', parentSlug: null, order: 6 },
    { slug: 'cleaning', name: 'Клининг', icon: '🧹', parentSlug: 'home-services', order: 1, keywords: ['уборка', 'клининг'] },
    { slug: 'minor-repair', name: 'Мелкий ремонт', icon: '🛠️', parentSlug: 'home-services', order: 2, keywords: ['муж на час', 'мелочи'] },
    { slug: 'doors-repair', name: 'Ремонт дверей', icon: '🚪', parentSlug: 'home-services', order: 3, keywords: ['дверь', 'петли'] },
    { slug: 'locks', name: 'Замена замков', icon: '🔐', parentSlug: 'home-services', order: 4, keywords: ['замок', 'ключи'] },
    { slug: 'windows-doors', name: 'Окна / Двери', icon: '🪟', parentSlug: 'home-services', order: 5, keywords: ['окна', 'стеклопакет'] },
    
    { slug: 'renovation', name: 'Ремонт квартир', icon: '🏠', parentSlug: null, order: 7 },
    { slug: 'turnkey', name: 'Ремонт под ключ', icon: '🔑', parentSlug: 'renovation', order: 1, keywords: ['под ключ', 'капитальный'] },
    { slug: 'cosmetic', name: 'Косметический ремонт', icon: '🖌️', parentSlug: 'renovation', order: 2, keywords: ['косметический', 'обновление'] },
    { slug: 'design', name: 'Дизайн-проект', icon: '📝', parentSlug: 'renovation', order: 3, keywords: ['дизайн', 'проект', 'интерьер'] },
  ];
};

workerCategorySchema.statics.seedCategories = async function() {
  const categories = this.getDefaultCategories();
  for (const cat of categories) {
    await this.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, new: true }
    );
  }
  console.log('[WorkerCategory] Seeded', categories.length, 'categories');
};

const WorkerCategory = mongoose.model('WorkerCategory', workerCategorySchema);

export default WorkerCategory;
