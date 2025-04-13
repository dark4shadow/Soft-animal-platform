// filepath: c:\Users\SSS\Documents\for_fun\Soft-animal-platform\my-app\server\testConnection.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('MongoDB URI:', process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  // Не потрібно вказувати додаткові параметри для нових версій драйвера
})
.then(() => {
  console.log('MongoDB підключено успішно!');
  process.exit(0);
})
.catch(err => {
  console.error('Помилка підключення до MongoDB:', err);
  process.exit(1);
});