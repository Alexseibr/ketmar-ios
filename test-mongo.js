import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔍 Тестирование подключения к MongoDB...\n');
console.log('Connection string format:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'NOT SET');

const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 5000,
};

try {
  await mongoose.connect(MONGODB_URI, connectionOptions);
  console.log('\n✅ SUCCESS: Подключение к MongoDB установлено!');
  console.log('📊 Database:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
  await mongoose.connection.close();
  console.log('✅ Соединение закрыто');
  process.exit(0);
} catch (error) {
  console.error('\n❌ ОШИБКА ПОДКЛЮЧЕНИЯ:');
  console.error('Тип ошибки:', error.name);
  console.error('Сообщение:', error.message);
  
  if (error.message.includes('authentication')) {
    console.error('\n💡 Проблема с аутентификацией:');
    console.error('   - Проверьте username и password в connection string');
    console.error('   - Убедитесь что пользователь создан в MongoDB Atlas');
  } else if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
    console.error('\n💡 Сетевая проблема:');
    console.error('   - Проверьте что IP адрес добавлен в Network Access (0.0.0.0/0)');
    console.error('   - Убедитесь что кластер MongoDB запущен');
  } else if (error.message.includes('timeout')) {
    console.error('\n💡 Timeout:');
    console.error('   - MongoDB Atlas кластер может быть неактивен');
    console.error('   - Проверьте Network Access whitelist');
  }
  
  process.exit(1);
}
