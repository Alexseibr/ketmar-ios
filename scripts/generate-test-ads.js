/**
 * Script to generate test ads in Brest and surrounding areas
 * Run: node scripts/generate-test-ads.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Ad Schema (simplified for seeding)
const adSchema = new mongoose.Schema({
  title: String,
  description: String,
  categoryId: String,
  subcategoryId: String,
  categoryName: String,
  subcategoryName: String,
  price: Number,
  currency: { type: String, default: 'BYN' },
  photos: [String],
  location: {
    lat: Number,
    lng: Number,
    geo: {
      type: { type: String, default: 'Point' },
      coordinates: [Number],
    },
  },
  cityName: String,
  districtName: String,
  sellerTelegramId: Number,
  sellerName: String,
  sellerPhone: String,
  status: { type: String, default: 'active' },
  moderationStatus: { type: String, default: 'approved' },
  isFreeGiveaway: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  favorites: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const Ad = mongoose.model('Ad', adSchema);

// Brest districts and surrounding villages with coordinates
const LOCATIONS = [
  // Brest City Districts
  { name: 'Центр Бреста', lat: 52.0975, lng: 23.6877, city: 'Брест', district: 'Центральный' },
  { name: 'Московский район', lat: 52.1123, lng: 23.7156, city: 'Брест', district: 'Московский' },
  { name: 'Ленинский район', lat: 52.0821, lng: 23.6543, city: 'Брест', district: 'Ленинский' },
  { name: 'Восток', lat: 52.1045, lng: 23.7342, city: 'Брест', district: 'Восточный' },
  { name: 'Юго-Запад', lat: 52.0765, lng: 23.6234, city: 'Брест', district: 'Юго-Западный' },
  { name: 'Граевка', lat: 52.1187, lng: 23.6789, city: 'Брест', district: 'Граевка' },
  { name: 'Ковалёво', lat: 52.0654, lng: 23.7123, city: 'Брест', district: 'Ковалёво' },
  { name: 'Речица', lat: 52.0543, lng: 23.6456, city: 'Брест', district: 'Речица' },
  { name: 'Южный городок', lat: 52.0432, lng: 23.6987, city: 'Брест', district: 'Южный' },
  { name: 'Вулька', lat: 52.1298, lng: 23.6543, city: 'Брест', district: 'Вулька' },
  
  // Brest suburbs
  { name: 'Задворцы', lat: 52.1456, lng: 23.7234, city: 'Брест', district: 'Пригород' },
  { name: 'Гершоны', lat: 52.0321, lng: 23.7456, city: 'Брест', district: 'Пригород' },
  { name: 'Тришин', lat: 52.1543, lng: 23.6123, city: 'Брест', district: 'Пригород' },
  
  // Villages near Brest
  { name: 'Черни', lat: 52.1876, lng: 23.5987, city: 'Черни', district: 'Брестский район' },
  { name: 'Чернавчицы', lat: 52.1654, lng: 23.5234, city: 'Чернавчицы', district: 'Брестский район' },
  { name: 'Медно', lat: 52.0123, lng: 23.5876, city: 'Медно', district: 'Брестский район' },
  { name: 'Остромечево', lat: 52.0765, lng: 23.5123, city: 'Остромечево', district: 'Брестский район' },
  { name: 'Знаменка', lat: 52.1987, lng: 23.7654, city: 'Знаменка', district: 'Брестский район' },
  { name: 'Томашовка', lat: 52.0234, lng: 23.8123, city: 'Томашовка', district: 'Брестский район' },
  { name: 'Мотыкалы', lat: 52.2123, lng: 23.6543, city: 'Мотыкалы', district: 'Брестский район' },
  { name: 'Радваничи', lat: 52.1543, lng: 23.8456, city: 'Радваничи', district: 'Брестский район' },
  { name: 'Вистычи', lat: 52.0654, lng: 23.4876, city: 'Вистычи', district: 'Брестский район' },
  { name: 'Збироги', lat: 52.0987, lng: 23.4234, city: 'Збироги', district: 'Брестский район' },
];

// Product categories with sample items
const PRODUCT_ADS = [
  // Bicycles
  { 
    category: 'transport', subcategory: 'velosipedy',
    categoryName: 'Транспорт', subcategoryName: 'Велосипеды',
    items: [
      { title: 'Горный велосипед Stels Navigator 610', price: 450, desc: 'Отличное состояние, 21 скорость, амортизационная вилка' },
      { title: 'Шоссейный велосипед Giant TCR', price: 1200, desc: 'Карбоновая рама, Shimano 105, размер M' },
      { title: 'Детский велосипед 16 дюймов', price: 120, desc: 'Для ребенка 4-6 лет, с дополнительными колёсами' },
      { title: 'BMX трюковой Mongoose', price: 380, desc: 'Для трюков и стрита, пеги в комплекте' },
      { title: 'Городской велосипед Forward Corsica', price: 280, desc: 'Удобный для города, корзина, багажник' },
      { title: 'Электровелосипед Xiaomi Qicycle', price: 1800, desc: 'Складной, запас хода 45 км, быстрая зарядка' },
      { title: 'Фэтбайк Love Freedom', price: 650, desc: 'Широкие колёса 4 дюйма, для снега и песка' },
      { title: 'Велосипед складной Stern', price: 220, desc: 'Компактный, помещается в багажник' },
      { title: 'Подростковый велосипед Stinger', price: 190, desc: '24 дюйма, 18 скоростей, синий цвет' },
      { title: 'Велосипед б/у на запчасти', price: 50, desc: 'Рама целая, нужен ремонт колёс' },
    ]
  },
  // Phones
  {
    category: 'elektronika', subcategory: 'telefony',
    categoryName: 'Электроника', subcategoryName: 'Телефоны',
    items: [
      { title: 'iPhone 13 Pro 256GB Sierra Blue', price: 1850, desc: 'Идеальное состояние, полный комплект, гарантия' },
      { title: 'Samsung Galaxy S23 Ultra', price: 2100, desc: '512GB, чёрный, камера 200MP, стилус' },
      { title: 'Xiaomi 13T Pro', price: 890, desc: 'Новый, Leica камера, быстрая зарядка 120W' },
      { title: 'iPhone 12 mini 128GB', price: 750, desc: 'Небольшие потертости, батарея 87%' },
      { title: 'Google Pixel 7 Pro', price: 1100, desc: 'Чистый Android, лучшая камера' },
      { title: 'OnePlus 11 256GB', price: 980, desc: 'Зелёный, Hasselblad камера, OxygenOS' },
      { title: 'Samsung Galaxy A54', price: 450, desc: 'Новый, запечатанный, гарантия 2 года' },
      { title: 'Redmi Note 12 Pro+', price: 380, desc: '200MP камера, AMOLED 120Hz, NFC' },
      { title: 'iPhone SE 2022 64GB', price: 520, desc: 'Компактный, A15 Bionic, хорошая камера' },
      { title: 'Huawei P60 Pro', price: 1400, desc: 'Leica камера, без Google но с AppGallery' },
    ]
  },
  // Household items
  {
    category: 'dom-i-sad', subcategory: 'bytovaya-tekhnika',
    categoryName: 'Дом и сад', subcategoryName: 'Бытовая техника',
    items: [
      { title: 'Стиральная машина Samsung', price: 320, desc: '7 кг загрузка, инверторный мотор, тихая работа' },
      { title: 'Холодильник LG No Frost', price: 580, desc: 'Двухкамерный, 380 литров, серебристый' },
      { title: 'Пылесос Dyson V15', price: 890, desc: 'Беспроводной, мощный, лазерная подсветка' },
      { title: 'Микроволновка Panasonic', price: 85, desc: '23 литра, гриль, конвекция' },
      { title: 'Кофемашина De\'Longhi', price: 750, desc: 'Автоматическая, зерновой кофе, капучинатор' },
      { title: 'Телевизор Samsung 55"', price: 680, desc: '4K Smart TV, голосовое управление' },
      { title: 'Посудомоечная машина Bosch', price: 420, desc: 'Встраиваемая, 60 см, энергоэффективная' },
      { title: 'Кондиционер Mitsubishi', price: 890, desc: 'Инверторный, на 25 кв.м, установка включена' },
    ]
  },
  // Clothes
  {
    category: 'odezhda', subcategory: 'muzhskaya',
    categoryName: 'Одежда', subcategoryName: 'Мужская одежда',
    items: [
      { title: 'Куртка зимняя Columbia', price: 180, desc: 'Размер L, пуховая, водонепроницаемая' },
      { title: 'Костюм деловой Hugo Boss', price: 450, desc: 'Размер 50, темно-синий, шерсть' },
      { title: 'Джинсы Levi\'s 501', price: 85, desc: 'Классические, размер 32/32, синие' },
      { title: 'Кроссовки Nike Air Max', price: 120, desc: 'Размер 43, новые, оригинал' },
      { title: 'Рубашка Ralph Lauren', price: 65, desc: 'Размер M, белая, 100% хлопок' },
    ]
  },
  // Kids items
  {
    category: 'detskie-tovary', subcategory: 'igrushki',
    categoryName: 'Детские товары', subcategoryName: 'Игрушки',
    items: [
      { title: 'Конструктор LEGO Technic', price: 120, desc: 'Большой набор, 1000+ деталей' },
      { title: 'Коляска детская 3в1 Adamex', price: 380, desc: 'Люлька, прогулка, автокресло' },
      { title: 'Велосипед детский трёхколёсный', price: 75, desc: 'С ручкой для родителей, навес' },
      { title: 'Кроватка детская с матрасом', price: 150, desc: 'Дерево, маятниковый механизм' },
      { title: 'Игровая приставка Nintendo Switch', price: 320, desc: 'С играми, два джойкона' },
    ]
  },
  // Sports
  {
    category: 'sport', subcategory: 'trenazhery',
    categoryName: 'Спорт', subcategoryName: 'Тренажёры',
    items: [
      { title: 'Беговая дорожка Horizon', price: 650, desc: 'Электрическая, до 16 км/ч, складная' },
      { title: 'Гантели разборные 2x20 кг', price: 120, desc: 'Металлические, резиновое покрытие' },
      { title: 'Эллиптический тренажёр', price: 380, desc: 'Магнитный, 8 уровней нагрузки' },
      { title: 'Скамья для жима со стойками', price: 180, desc: 'Регулируемый угол, надёжная' },
      { title: 'Турник настенный 3в1', price: 45, desc: 'Турник, брусья, пресс' },
    ]
  },
  // Tools
  {
    category: 'instrumenty', subcategory: 'elektroinstrument',
    categoryName: 'Инструменты', subcategoryName: 'Электроинструмент',
    items: [
      { title: 'Перфоратор Bosch GBH 2-26', price: 220, desc: 'SDS-Plus, 800W, с кейсом' },
      { title: 'Шуруповёрт Makita 18V', price: 180, desc: 'Два аккумулятора, зарядка, кейс' },
      { title: 'Болгарка DeWalt 125мм', price: 150, desc: '1400W, плавный пуск' },
      { title: 'Циркулярная пила Metabo', price: 280, desc: 'Диск 190мм, лазерный указатель' },
      { title: 'Сварочный аппарат инверторный', price: 190, desc: '200A, маска в комплекте' },
    ]
  },
];

// Services
const SERVICE_ADS = [
  {
    category: 'uslugi', subcategory: 'sad-ogorod',
    categoryName: 'Услуги', subcategoryName: 'Сад и огород',
    items: [
      { title: 'Копка огорода мотоблоком', price: 25, desc: 'Быстро и качественно, за сотку. Выезд по району.' },
      { title: 'Стрижка газона триммером', price: 15, desc: 'Профессиональное оборудование, уборка мусора включена' },
      { title: 'Обрезка деревьев и кустарников', price: 30, desc: 'Формирование кроны, санитарная обрезка, вывоз' },
      { title: 'Покос травы на участке', price: 20, desc: 'Бензокоса, быстро, чисто. От 5 соток' },
      { title: 'Уборка участка после стройки', price: 50, desc: 'Вывоз мусора, планировка территории' },
      { title: 'Посадка деревьев и кустов', price: 15, desc: 'Правильная посадка, удобрения, полив' },
      { title: 'Вспашка и культивация', price: 30, desc: 'Минитрактор, качественная обработка почвы' },
      { title: 'Уход за садом под ключ', price: 100, desc: 'Полный уход: полив, обрезка, удобрение' },
      { title: 'Борьба с вредителями', price: 40, desc: 'Опрыскивание от тли, клещей, грибков' },
      { title: 'Установка теплицы', price: 200, desc: 'Сборка поликарбонатной теплицы, фундамент' },
    ]
  },
  {
    category: 'uslugi', subcategory: 'remont',
    categoryName: 'Услуги', subcategoryName: 'Ремонт',
    items: [
      { title: 'Ремонт квартир под ключ', price: 0, desc: 'Все виды работ, опыт 15 лет, гарантия. Цена договорная.' },
      { title: 'Электрик - все виды работ', price: 30, desc: 'Замена проводки, розетки, люстры, щитки' },
      { title: 'Сантехник - вызов на дом', price: 25, desc: 'Установка, ремонт, прочистка труб' },
      { title: 'Укладка плитки', price: 15, desc: 'Стены, пол, ванная комната. За кв.м.' },
      { title: 'Штукатурка и шпаклевка', price: 10, desc: 'Выравнивание стен, потолков. За кв.м.' },
      { title: 'Поклейка обоев', price: 8, desc: 'Любые обои, подготовка стен. За кв.м.' },
      { title: 'Установка дверей', price: 50, desc: 'Межкомнатные, входные, с доборами' },
      { title: 'Ламинат, паркет - укладка', price: 12, desc: 'Профессионально, с подложкой. За кв.м.' },
    ]
  },
  {
    category: 'uslugi', subcategory: 'klining',
    categoryName: 'Услуги', subcategoryName: 'Уборка',
    items: [
      { title: 'Уборка квартиры', price: 50, desc: 'Генеральная уборка, мытьё окон, все комнаты' },
      { title: 'Уборка после ремонта', price: 80, desc: 'Вывоз мусора, мойка всех поверхностей' },
      { title: 'Мытьё окон', price: 10, desc: 'За окно, включая рамы и подоконники' },
      { title: 'Химчистка мебели', price: 40, desc: 'Диваны, кресла, матрасы на дому' },
      { title: 'Уборка офисов', price: 0, desc: 'Ежедневная, генеральная. Договор. Цена договорная.' },
    ]
  },
  {
    category: 'uslugi', subcategory: 'gruzoperevozki',
    categoryName: 'Услуги', subcategoryName: 'Грузоперевозки',
    items: [
      { title: 'Грузоперевозки по городу', price: 30, desc: 'Газель, грузчики, быстро и аккуратно' },
      { title: 'Переезд квартиры под ключ', price: 100, desc: 'Упаковка, погрузка, доставка, сборка мебели' },
      { title: 'Вывоз строительного мусора', price: 50, desc: 'Контейнер, погрузка включена' },
      { title: 'Доставка стройматериалов', price: 40, desc: 'Песок, щебень, кирпич, блоки' },
      { title: 'Грузчики почасово', price: 15, desc: 'За человека в час, опытные, аккуратные' },
    ]
  },
];

// Free giveaway items
const FREE_ADS = [
  {
    category: 'darom', subcategory: 'bytovaya-tekhnika',
    categoryName: 'Даром', subcategoryName: 'Бытовая техника',
    items: [
      { title: 'Отдам старый телевизор', desc: 'Работает, кинескопный, самовывоз' },
      { title: 'Микроволновка на запчасти', desc: 'Не греет, корпус целый' },
      { title: 'Старый пылесос', desc: 'Работает, но слабо тянет' },
      { title: 'Утюг рабочий', desc: 'Старая модель, но гладит хорошо' },
      { title: 'Электрочайник', desc: 'Немного протекает, можно починить' },
    ]
  },
  {
    category: 'darom', subcategory: 'mebel',
    categoryName: 'Даром', subcategoryName: 'Мебель',
    items: [
      { title: 'Диван старый', desc: 'Б/у, требует чистки, но крепкий' },
      { title: 'Шкаф советский', desc: 'Добротный, из дерева, самовывоз' },
      { title: 'Кресло мягкое', desc: 'Продавленное, но можно перетянуть' },
      { title: 'Стол обеденный', desc: 'Деревянный, требует реставрации' },
      { title: 'Стулья 4 штуки', desc: 'Разные, но крепкие' },
      { title: 'Комод с ящиками', desc: 'Советский, рабочий, самовывоз' },
      { title: 'Книжный шкаф', desc: 'Полки целые, стёкла на месте' },
    ]
  },
  {
    category: 'darom', subcategory: 'odezhda',
    categoryName: 'Даром', subcategoryName: 'Одежда',
    items: [
      { title: 'Пакет детской одежды 3-5 лет', desc: 'Мальчик, хорошее состояние' },
      { title: 'Женские вещи размер 46-48', desc: 'Разные, в хорошем состоянии' },
      { title: 'Мужские рубашки L', desc: '5 штук, б/у, чистые' },
      { title: 'Зимняя куртка мужская XL', desc: 'Порвана молния, можно починить' },
      { title: 'Обувь детская разная', desc: 'Размеры 25-30, несколько пар' },
    ]
  },
  {
    category: 'darom', subcategory: 'knigi',
    categoryName: 'Даром', subcategoryName: 'Книги',
    items: [
      { title: 'Книги советские, классика', desc: 'Толстой, Достоевский, около 20 книг' },
      { title: 'Учебники школьные', desc: 'Разные классы, математика, физика' },
      { title: 'Журналы старые', desc: 'Наука и жизнь, много годов' },
      { title: 'Детские книжки', desc: 'Сказки, рассказы, хорошее состояние' },
    ]
  },
  {
    category: 'darom', subcategory: 'raznoe',
    categoryName: 'Даром', subcategoryName: 'Разное',
    items: [
      { title: 'Банки стеклянные 3л', desc: 'Около 30 штук, для консервации' },
      { title: 'Горшки для цветов', desc: 'Пластик, разные размеры' },
      { title: 'Старые инструменты', desc: 'Молотки, отвертки, разное' },
      { title: 'Коробки картонные', desc: 'После переезда, разные размеры' },
      { title: 'Пластинки виниловые', desc: 'СССР, разные исполнители' },
    ]
  },
];

// Sample photo URLs (using placeholder images)
const PHOTO_URLS = {
  velosipedy: [
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400',
    'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  ],
  telefony: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
    'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400',
  ],
  'bytovaya-tekhnika': [
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400',
  ],
  muzhskaya: [
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
    'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400',
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400',
  ],
  igrushki: [
    'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400',
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400',
  ],
  trenazhery: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400',
  ],
  elektroinstrument: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400',
    'https://images.unsplash.com/photo-1426927308491-6380b6a9f882?w=400',
  ],
  'sad-ogorod': [
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    'https://images.unsplash.com/photo-1599629954294-14df9ec8dfe8?w=400',
    'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400',
  ],
  remont: [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400',
    'https://images.unsplash.com/photo-1517646331032-9e8563c520a4?w=400',
  ],
  klining: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
    'https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?w=400',
  ],
  gruzoperevozki: [
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=400',
  ],
  mebel: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400',
  ],
  odezhda: [
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400',
  ],
  knigi: [
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
  ],
  raznoe: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400',
  ],
};

// Test seller data
const TEST_SELLERS = [
  { id: 100001, name: 'Александр П.', phone: '+375291234567' },
  { id: 100002, name: 'Ирина К.', phone: '+375292345678' },
  { id: 100003, name: 'Сергей М.', phone: '+375293456789' },
  { id: 100004, name: 'Ольга В.', phone: '+375294567890' },
  { id: 100005, name: 'Дмитрий Н.', phone: '+375295678901' },
  { id: 100006, name: 'Анна Л.', phone: '+375296789012' },
  { id: 100007, name: 'Виктор С.', phone: '+375297890123' },
  { id: 100008, name: 'Мария Ф.', phone: '+375298901234' },
  { id: 100009, name: 'Павел Г.', phone: '+375299012345' },
  { id: 100010, name: 'Елена Р.', phone: '+375290123456' },
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPhotos(subcategory, count = 2) {
  const photos = PHOTO_URLS[subcategory] || PHOTO_URLS.raznoe;
  const result = [];
  for (let i = 0; i < Math.min(count, photos.length); i++) {
    result.push(photos[i % photos.length]);
  }
  return result;
}

function addRandomOffset(lat, lng, maxOffsetKm = 0.5) {
  const latOffset = (Math.random() - 0.5) * 2 * (maxOffsetKm / 111);
  const lngOffset = (Math.random() - 0.5) * 2 * (maxOffsetKm / (111 * Math.cos(lat * Math.PI / 180)));
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

async function generateAds() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  const adsToCreate = [];

  // Generate product ads
  console.log('\nGenerating product ads...');
  for (const category of PRODUCT_ADS) {
    for (const item of category.items) {
      // Create 2-3 copies in different locations
      const copies = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < copies; i++) {
        const location = getRandomElement(LOCATIONS);
        const offset = addRandomOffset(location.lat, location.lng, 0.3);
        const seller = getRandomElement(TEST_SELLERS);
        
        adsToCreate.push({
          title: item.title,
          description: item.desc,
          categoryId: category.category,
          subcategoryId: category.subcategory,
          categoryName: category.categoryName,
          subcategoryName: category.subcategoryName,
          price: item.price + Math.floor(Math.random() * 50) - 25,
          currency: 'BYN',
          photos: getRandomPhotos(category.subcategory, 2),
          location: {
            lat: offset.lat,
            lng: offset.lng,
            geo: {
              type: 'Point',
              coordinates: [offset.lng, offset.lat],
            },
          },
          cityName: location.city,
          districtName: location.district,
          sellerTelegramId: seller.id,
          sellerName: seller.name,
          sellerPhone: seller.phone,
          status: 'active',
          moderationStatus: 'approved',
          isFreeGiveaway: false,
          views: Math.floor(Math.random() * 100),
          favorites: Math.floor(Math.random() * 20),
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  // Generate service ads
  console.log('Generating service ads...');
  for (const category of SERVICE_ADS) {
    for (const item of category.items) {
      // Create 3-5 copies in different locations for services
      const copies = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < copies; i++) {
        const location = getRandomElement(LOCATIONS);
        const offset = addRandomOffset(location.lat, location.lng, 0.5);
        const seller = getRandomElement(TEST_SELLERS);
        
        adsToCreate.push({
          title: item.title,
          description: item.desc,
          categoryId: category.category,
          subcategoryId: category.subcategory,
          categoryName: category.categoryName,
          subcategoryName: category.subcategoryName,
          price: item.price,
          currency: 'BYN',
          photos: getRandomPhotos(category.subcategory, 2),
          location: {
            lat: offset.lat,
            lng: offset.lng,
            geo: {
              type: 'Point',
              coordinates: [offset.lng, offset.lat],
            },
          },
          cityName: location.city,
          districtName: location.district,
          sellerTelegramId: seller.id,
          sellerName: seller.name,
          sellerPhone: seller.phone,
          status: 'active',
          moderationStatus: 'approved',
          isFreeGiveaway: false,
          views: Math.floor(Math.random() * 150),
          favorites: Math.floor(Math.random() * 30),
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  // Generate free giveaway ads
  console.log('Generating free giveaway ads...');
  for (const category of FREE_ADS) {
    for (const item of category.items) {
      // Create 2-4 copies for free items
      const copies = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < copies; i++) {
        const location = getRandomElement(LOCATIONS);
        const offset = addRandomOffset(location.lat, location.lng, 0.4);
        const seller = getRandomElement(TEST_SELLERS);
        
        adsToCreate.push({
          title: item.title,
          description: item.desc,
          categoryId: category.category,
          subcategoryId: category.subcategory,
          categoryName: category.categoryName,
          subcategoryName: category.subcategoryName,
          price: 0,
          currency: 'BYN',
          photos: getRandomPhotos(category.subcategory, 1),
          location: {
            lat: offset.lat,
            lng: offset.lng,
            geo: {
              type: 'Point',
              coordinates: [offset.lng, offset.lat],
            },
          },
          cityName: location.city,
          districtName: location.district,
          sellerTelegramId: seller.id,
          sellerName: seller.name,
          sellerPhone: seller.phone,
          status: 'active',
          moderationStatus: 'approved',
          isFreeGiveaway: true,
          giveawaySubcategoryId: category.subcategory,
          views: Math.floor(Math.random() * 200),
          favorites: Math.floor(Math.random() * 50),
          createdAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  console.log(`\nTotal ads to create: ${adsToCreate.length}`);
  
  // Insert all ads
  console.log('Inserting ads into database...');
  const result = await Ad.insertMany(adsToCreate);
  console.log(`Successfully created ${result.length} ads!`);

  // Show stats
  const stats = {
    products: adsToCreate.filter(a => !a.isFreeGiveaway && a.categoryId !== 'uslugi').length,
    services: adsToCreate.filter(a => a.categoryId === 'uslugi').length,
    free: adsToCreate.filter(a => a.isFreeGiveaway).length,
  };
  
  console.log('\n=== Stats ===');
  console.log(`Products: ${stats.products}`);
  console.log(`Services: ${stats.services}`);
  console.log(`Free items: ${stats.free}`);
  console.log(`Total: ${adsToCreate.length}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

generateAds().catch(console.error);
