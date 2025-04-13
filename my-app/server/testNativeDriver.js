const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI:', uri);

// Проста конфігурація для локальної MongoDB
const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Намагаюся підключитися до локальної MongoDB...");
    await client.connect();
    console.log("Підключено успішно!");
    
    await client.db("admin").command({ ping: 1 });
    console.log("Ping успішний!");
    
    const testDB = client.db("pet_rescue");
    console.log("База даних pet_rescue успішно створена");
    
    // Створення тестової колекції
    await testDB.createCollection("test_collection");
    console.log("Тестова колекція створена");
    
    const collections = await testDB.listCollections().toArray();
    console.log("Доступні колекції:");
    collections.forEach(coll => {
      console.log(` - ${coll.name}`);
    });
    
  } catch (error) {
    console.error("Помилка підключення:", error);
  } finally {
    await client.close();
    console.log("З'єднання закрито");
  }
}

run().catch(console.error);