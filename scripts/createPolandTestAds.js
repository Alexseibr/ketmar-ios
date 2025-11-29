import Ad from '../models/Ad.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CENTER_POINT = {
  lat: 51.418808,
  lng: 16.465656,
  city: 'Iwno',
  region: 'Dolnośląskie',
};

const TEST_SELLER_ID = 604937542;

function offsetCoordinates(lat, lng, distanceKm, bearing = 45) {
  const R = 6371;
  const bearingRad = (bearing * Math.PI) / 180;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceKm / R) +
    Math.cos(latRad) * Math.sin(distanceKm / R) * Math.cos(bearingRad)
  );
  
  const newLngRad = lngRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distanceKm / R) * Math.cos(latRad),
    Math.cos(distanceKm / R) - Math.sin(latRad) * Math.sin(newLatRad)
  );
  
  return {
    lat: (newLatRad * 180) / Math.PI,
    lng: (newLngRad * 180) / Math.PI,
  };
}

const polandTestAds = [
  {
    distance: 0.5,
    bearing: 0,
    title: 'iPhone 15 Pro 256GB nowy',
    description: 'Nowy iPhone 15 Pro 256GB, Natural Titanium. Zafoliowany, paragon, gwarancja Apple. Sprzedam pilnie, cena do negocjacji.',
    price: 5200,
    categorySlug: 'smartfony',
    photos: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'],
  },
  {
    distance: 1.2,
    bearing: 45,
    title: 'MacBook Air M2 16GB/512GB',
    description: 'MacBook Air M2, konfiguracja 16/512. Kolor Midnight. Stan idealny, kupiony 2 miesiące temu. Pełen komplet.',
    price: 6500,
    categorySlug: 'noutbuki-kompyutery',
    photos: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
  },
  {
    distance: 2.5,
    bearing: 90,
    title: 'Rower górski Trek Marlin 7',
    description: 'Rower górski Trek Marlin 7, rama 19", koła 29". Stan bardzo dobry, serwisowany. Idealna na góry i teren.',
    price: 2800,
    categorySlug: 'velosipedy',
    photos: ['https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800'],
  },
  {
    distance: 3.8,
    bearing: 135,
    title: 'Sofa narożna skórzana',
    description: 'Luksusowa sofa narożna ze skóry naturalnej. Kolor brązowy, funkcja spania. Wymiary 280x200 cm. Stan idealny.',
    price: 4500,
    categorySlug: 'mebel',
    photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'],
  },
  {
    distance: 5.0,
    bearing: 180,
    title: 'Samsung Galaxy S24 Ultra 512GB',
    description: 'Samsung Galaxy S24 Ultra w idealnym stanie. Pamięć 512GB, kolor Titanium Black. Etui i szkło w zestawie.',
    price: 4800,
    categorySlug: 'smartfony',
    photos: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800'],
  },
  {
    distance: 6.5,
    bearing: 225,
    title: 'Wiertarko-wkrętarka Bosch Professional',
    description: 'Wiertarko-wkrętarka Bosch GSR 18V-60 FC. Dwa akumulatory 5Ah, ładowarka, walizka. Stan jak nowy.',
    price: 1200,
    categorySlug: 'elektroinstrument',
    photos: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800'],
  },
  {
    distance: 8.0,
    bearing: 270,
    title: 'Telewizor LG OLED 55" 4K',
    description: 'Telewizor LG OLED55C3 55 cali, 4K HDR, 120Hz. Idealny do filmów i gier. Gwarancja do 2025.',
    price: 3800,
    categorySlug: 'tv-foto-video',
    photos: ['https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800'],
  },
  {
    distance: 10.0,
    bearing: 315,
    title: 'Kurtka zimowa The North Face',
    description: 'Męska kurtka puchowa The North Face, rozmiar L. Kolor czarny. Ciepła, wodoodporna. Stan idealny.',
    price: 650,
    categorySlug: 'muzhskaya-odezhda',
    photos: ['https://images.unsplash.com/photo-1544923246-77307dd628b7?w=800'],
  },
  {
    distance: 12.0,
    bearing: 30,
    title: 'PlayStation 5 + 2 pady + 5 gier',
    description: 'Konsola PS5 z napędem w komplecie z 2 padami DualSense i 5 grami. Stan bardzo dobry, mało używana.',
    price: 2400,
    categorySlug: 'igry-igrovye-pristavki',
    photos: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800'],
  },
  {
    distance: 15.0,
    bearing: 60,
    title: 'Ekspres do kawy DeLonghi Magnifica',
    description: 'Automatyczny ekspres DeLonghi ECAM 22.110. Młynek, spieniacz mleka. Serwisowany, działa idealnie.',
    price: 1100,
    categorySlug: 'tehnika-dlya-kuhni',
    photos: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800'],
  },
  {
    distance: 3.0,
    bearing: 100,
    title: 'Buty Nike Air Max 90',
    description: 'Oryginalne Nike Air Max 90, rozmiar 43. Kolor biały. Noszone kilka razy, stan bardzo dobry.',
    price: 380,
    categorySlug: 'muzhskaya-obuv',
    photos: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
  },
  {
    distance: 7.5,
    bearing: 150,
    title: 'Gitara akustyczna Yamaha FG800',
    description: 'Gitara akustyczna Yamaha FG800, idealna dla początkujących i zaawansowanych. Futerał w komplecie.',
    price: 800,
    categorySlug: 'muzykalnye-instrumenty',
    photos: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800'],
  },
  {
    distance: 18.0,
    bearing: 200,
    title: 'Stolik kawowy dębowy',
    description: 'Elegancki stolik kawowy z litego drewna dębowego. Wymiary 120x60x45 cm. Ręczna robota, lakierowany.',
    price: 900,
    categorySlug: 'mebel',
    photos: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800'],
  },
  {
    distance: 20.0,
    bearing: 240,
    title: 'Słuchawki Sony WH-1000XM5',
    description: 'Flagowe słuchawki Sony z aktywną redukcją szumów. Kolor czarny. Stan idealny, pudełko i etui.',
    price: 1200,
    categorySlug: 'audio-tehnika',
    photos: ['https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800'],
  },
  {
    distance: 22.0,
    bearing: 280,
    title: 'Sukienka wieczorowa Zara',
    description: 'Elegancka sukienka wieczorowa Zara, rozmiar M. Kolor granatowy, z cekinami. Ubrana raz.',
    price: 250,
    categorySlug: 'zhenskaya-odezhda',
    photos: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
  },
  {
    distance: 4.5,
    bearing: 320,
    title: 'Opony zimowe Michelin 225/45 R17',
    description: 'Komplet 4 opon zimowych Michelin Alpin 6. Rozmiar 225/45 R17. Bieżnik 6mm, stan bardzo dobry.',
    price: 600,
    categorySlug: 'shiny-diski',
    photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'],
  },
  {
    distance: 9.0,
    bearing: 350,
    title: 'iPad Pro 12.9" M2 256GB',
    description: 'Apple iPad Pro 12.9 cala z chipem M2. Pamięć 256GB, WiFi. Stan idealny, Apple Pencil w komplecie.',
    price: 4200,
    categorySlug: 'planshety',
    photos: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'],
  },
  {
    distance: 14.0,
    bearing: 75,
    title: 'Lodówka Samsung No Frost',
    description: 'Lodówka Samsung RB38T674DSA, pojemność 385L. Kolor srebrny, No Frost. Klasa A++, stan bardzo dobry.',
    price: 1800,
    categorySlug: 'krupnaya-bytovaya-tehnika',
    photos: ['https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800'],
  },
  {
    distance: 16.0,
    bearing: 110,
    title: 'Zestaw garnków Tefal Ingenio',
    description: 'Kompletny zestaw garnków Tefal Ingenio, 10 elementów. Indukcja, odczepiane uchwyty. Nowy, zapakowany.',
    price: 450,
    categorySlug: 'posuda-kuhonnye-prinadlezhnosti',
    photos: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'],
  },
  {
    distance: 24.0,
    bearing: 160,
    title: 'Aparat Canon EOS R6 Mark II',
    description: 'Profesjonalny aparat Canon EOS R6 Mark II, body. Przebieg 5000 zdjęć. Stan idealny, pudełko i dokumenty.',
    price: 9500,
    categorySlug: 'tv-foto-video',
    photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'],
  },
];

async function createPolandTestAds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`📍 Center point: ${CENTER_POINT.city}, ${CENTER_POINT.region} (${CENTER_POINT.lat}, ${CENTER_POINT.lng})\n`);
    
    const categories = await Category.find({ isLeaf: true }).select('slug name');
    const categoryMap = Object.fromEntries(categories.map(c => [c.slug, c]));
    
    let created = 0;
    const summary = [];
    
    for (const adData of polandTestAds) {
      let category = categoryMap[adData.categorySlug];
      if (!category) {
        console.log(`⚠ Category ${adData.categorySlug} not found, using fallback...`);
        category = categoryMap['aksessuary'] || categories[0];
        if (!category) continue;
      }
      
      const coords = offsetCoordinates(
        CENTER_POINT.lat,
        CENTER_POINT.lng,
        adData.distance,
        adData.bearing
      );
      
      const ad = {
        title: adData.title,
        description: adData.description,
        categoryId: category.slug,
        subcategoryId: category.slug,
        price: adData.price,
        currency: 'PLN',
        sellerTelegramId: TEST_SELLER_ID,
        city: CENTER_POINT.city,
        cityCode: 'iwno',
        region: CENTER_POINT.region,
        countryCode: 'PL',
        location: {
          lat: coords.lat,
          lng: coords.lng,
          geo: {
            type: 'Point',
            coordinates: [coords.lng, coords.lat],
          },
        },
        status: 'active',
        moderationStatus: 'approved',
        photos: adData.photos || [],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      };
      
      const result = await Ad.create(ad);
      created++;
      
      const distanceText = adData.distance < 1 
        ? `${Math.round(adData.distance * 1000)}m` 
        : `${adData.distance.toFixed(1)}km`;
      
      console.log(`✓ [${distanceText}] ${ad.title} - ${ad.price} zł`);
      summary.push({
        id: result._id,
        distance: distanceText,
        title: ad.title,
        price: ad.price,
      });
    }
    
    console.log('\n========================================');
    console.log('📊 PODSUMOWANIE');
    console.log('========================================');
    console.log(`Utworzono ogłoszeń: ${created}`);
    console.log(`Punkt centralny: ${CENTER_POINT.city} (${CENTER_POINT.lat}, ${CENTER_POINT.lng})`);
    console.log(`Sprzedawca ID: ${TEST_SELLER_ID}`);
    console.log(`Waluta: PLN (polski złoty)`);
    console.log(`Promień: do 25km`);
    console.log('\n✅ Polskie ogłoszenia testowe utworzone pomyślnie!');
    console.log('\n🧪 Komendy testowe:');
    console.log(`GET /api/ads/search?lat=${CENTER_POINT.lat}&lng=${CENTER_POINT.lng}&radiusKm=5`);
    console.log(`GET /api/ads/search?lat=${CENTER_POINT.lat}&lng=${CENTER_POINT.lng}&radiusKm=15&sort=distance`);
    console.log(`GET /api/ads/search?lat=${CENTER_POINT.lat}&lng=${CENTER_POINT.lng}&radiusKm=25&sort=distance`);
    
    await mongoose.disconnect();
    console.log('\n✓ Połączenie z bazą danych zakończone');
    
  } catch (error) {
    console.error('❌ Błąd:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createPolandTestAds();
