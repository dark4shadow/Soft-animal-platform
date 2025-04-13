const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Завантаження env змінних
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Моделі для бази даних
const User = require('./models/userModel');
const Shelter = require('./models/shelterModel');
const Animal = require('./models/animalModel');
const Review = require('./models/reviewModel');
const BlogCategory = require('./models/blogCategoryModel');
const BlogPost = require('./models/blogPostModel');
const BlogComment = require('./models/blogCommentModel');

console.log('MongoDB URI:', process.env.MONGODB_URI);

// Підключення до бази даних
mongoose.connect(process.env.MONGODB_URI);

// Початкові дані
const users = JSON.parse(fs.readFileSync(path.join(__dirname, '_data', 'users.json'), 'utf-8'));
const shelters = JSON.parse(fs.readFileSync(path.join(__dirname, '_data', 'shelters.json'), 'utf-8'));
const animals = JSON.parse(fs.readFileSync(path.join(__dirname, '_data', 'animals.json'), 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(path.join(__dirname, '_data', 'reviews.json'), 'utf-8'));

// Масив категорій блогу
const blogCategories = [
  {
    name: 'Новини',
    description: 'Останні події та новини зі світу захисту тварин',
    slug: 'news'
  },
  {
    name: 'Поради по догляду',
    description: 'Корисні поради щодо догляду за домашніми улюбленцями',
    slug: 'tips'
  },
  {
    name: 'Історії успіху',
    description: 'Історії про тварин, які знайшли новий дім',
    slug: 'success-stories'
  },
  {
    name: 'Ветеринарія',
    description: 'Статті та поради від ветеринарів',
    slug: 'veterinary'
  },
  {
    name: 'Події',
    description: 'Інформація про благодійні акції та події',
    slug: 'events'
  }
];

// Імпорт даних до бази
const importData = async () => {
  try {
    // Створюємо користувачів і чекаємо на результат, щоб отримати їх _id
    const createdUsers = await User.create(users);
    console.log(`Створено ${createdUsers.length} користувачів`);
    
    // Знаходимо адміністратора та модераторів, які будуть авторами постів
    const admin = createdUsers.find(user => user.email === 'admin@example.com');
    const moderators = createdUsers.filter(user => 
      user.userType === 'admin' || user.userType === 'shelter'
    );
    
    // Зіставляємо притулки з власниками по email
    const sheltersWithOwners = [];
    
    for (const shelter of shelters) {
      // Шукаємо користувача з типом 'shelter' та збігом за email
      const shelterOwner = createdUsers.find(user => 
        user.email === shelter.email && user.userType === 'shelter'
      );
      
      if (shelterOwner) {
        sheltersWithOwners.push({
          ...shelter,
          ownerId: shelterOwner._id // Встановлюємо MongoDB ObjectId користувача
        });
      } else {
        // Якщо відповідного користувача не знайдено, використовуємо першого адміністратора
        const admin = createdUsers.find(user => user.userType === 'admin');
        if (admin) {
          sheltersWithOwners.push({
            ...shelter,
            ownerId: admin._id
          });
          console.log(`Для притулку ${shelter.name} не знайдено відповідного користувача, прив'язуємо до адміна`);
        } else {
          console.error(`Неможливо імпортувати притулок ${shelter.name}: не знайдено підходящого власника`);
          continue;
        }
      }
    }
    
    // Створюємо притулки з правильно встановленими ownerId
    const createdShelters = await Shelter.create(sheltersWithOwners);
    console.log(`Створено ${createdShelters.length} притулків`);
    
    // Додаємо shelterId до тварин
    const animalsWithShelters = animals.map(animal => {
      const shelter = createdShelters.find(s => 
        s.location === animal.location && 
        (s.type === animal.type || s.type === 'mixed')
      );
      
      if (shelter) {
        return { ...animal, shelterId: shelter._id };
      }
      return null; // Відфільтруємо null нижче
    }).filter(Boolean); // Видаляємо null елементи
    
    const createdAnimals = await Animal.create(animalsWithShelters);
    console.log(`Створено ${createdAnimals.length} тварин`);
    
    // Додаємо shelterId до відгуків
    const reviewsWithShelters = [];

    // Отримаємо волонтерів для розподілу відгуків
    const volunteers = createdUsers.filter(user => user.userType === 'volunteer');
    const adminUser = createdUsers.find(user => user.userType === 'admin');

    reviews.forEach((review, index) => {
      // Розподіляємо відгуки по притулках
      const shelter = createdShelters[index % createdShelters.length];
      
      // Додаємо shelterId до відгука
      const reviewData = { 
        ...review, 
        shelterId: shelter._id 
      };
      
      // Додаємо userId до деяких відгуків для реалістичності
      if (index % 3 === 0) {
        // Залишаємо цей відгук анонімним (без userId)
      } else if (volunteers.length > 0) {
        // Використовуємо різних волонтерів для різних відгуків
        const volunteerIndex = index % volunteers.length;
        reviewData.userId = volunteers[volunteerIndex]._id;
      } else if (adminUser) {
        // Якщо немає волонтерів, використовуємо адміністратора
        reviewData.userId = adminUser._id;
      }
      
      reviewsWithShelters.push(reviewData);
    });

    const createdReviews = await Review.create(reviewsWithShelters);
    console.log(`Створено ${createdReviews.length} відгуків`);

    // Імпорт категорій блогу
    const createdCategories = await BlogCategory.create(blogCategories);
    console.log(`${createdCategories.length} категорій блогу додано`);

    // Створюємо блогпости, пов'язані з реальними користувачами
    const blogPosts = [
      {
        title: 'Відкриття нового притулку у Києві',
        excerpt: 'Минулого тижня у Києві відкрився новий сучасний притулок, який зможе прийняти до 150 тварин.',
        content: `
          <p>Минулого тижня у Києві відкрився новий сучасний притулок для тварин "Теплий дім", який зможе прийняти до 150 собак та котів. Урочисте відкриття відбулося за участі міського голови та відомих захисників тварин.</p>
          
          <p>Притулок обладнано за найсучаснішими стандартами: окремі просторі вольєри для собак, затишні кімнати для котів, ветеринарний кабінет, зона для занять з тваринами та територія для прогулянок.</p>
          
          <h3>Особливості нового притулку:</h3>
          <ul>
            <li>Сучасне ветеринарне обладнання</li>
            <li>Просторі вольєри з підігрівом підлоги</li>
            <li>Спеціально навчений персонал</li>
            <li>Програма реабілітації для тварин, що пережили жорстоке поводження</li>
          </ul>
          
          <p>Фінансування проєкту здійснювалося за рахунок благодійних внесків та міського бюджету. Загальна сума інвестицій склала понад 3 мільйони гривень.</p>
          
          <p>"Це важливий крок для нашого міста. Тепер ми зможемо надати гідні умови для безпритульних тварин і збільшити кількість успішних адопцій", - зазначила директорка притулку Олена Павленко.</p>
          
          <p>Запрошуємо всіх бажаючих завітати в гості до притулку, познайомитися з його мешканцями і, можливо, знайти нового пухнастого друга!</p>
        `,
        author: moderators[0]._id,
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        tags: ['притулок', 'новини', 'київ', 'допомога'],
        category: createdCategories[0]._id, // Категорія "Новини"
        status: 'published',
        slug: 'vidkrittya-novogo-pritulku-u-kievi',
        readTime: 5
      },
      {
        title: 'Як правильно годувати кошенят: 10 порад від експертів',
        excerpt: 'Правильне харчування є ключем до здоров\'я вашого кошеняти. Ми зібрали поради від ветеринарів щодо того, як правильно годувати кошеня.',
        content: `
          <p>Правильне харчування є ключем до здоров'я вашого кошеняти. Ми зібрали 10 найважливіших порад від ветеринарів, які допоможуть вам забезпечити найкращий старт у житті для вашого пухнастого друга.</p>
          
          <h3>1. Вибирайте корм за віком</h3>
          <p>Для кошенят віком до 12 місяців обирайте спеціальний корм із позначкою "для кошенят" або "kitten". Він містить більше білка та калорій, необхідних для росту.</p>
          
          <h3>2. Дотримуйтесь графіку годування</h3>
          <p>Кошенята віком до 6 місяців потребують годування 3-4 рази на день. З 6 до 12 місяців — 2-3 рази на день.</p>
          
          <h3>3. Контролюйте розмір порцій</h3>
          <p>Дотримуйтесь рекомендацій, вказаних на упаковці корму, але коригуйте їх залежно від активності та розміру вашого кошеняти.</p>
          
          <h3>4. Забезпечте доступ до свіжої води</h3>
          <p>Завжди має бути доступною чиста питна вода, яку слід міняти щонайменше двічі на день.</p>
          
          <h3>5. Уникайте молока для дорослих тварин</h3>
          <p>Більшість кошенят після відлучення від матері втрачають здатність перетравлювати лактозу. Коров'яче молоко може викликати розлад шлунка.</p>
          
          <h3>6. Поступово змінюйте корм</h3>
          <p>Будь-яку зміну раціону здійснюйте поступово протягом 7-10 днів, щоб уникнути проблем з травленням.</p>
          
          <h3>7. Не давайте людську їжу</h3>
          <p>Багато продуктів, які їдять люди, можуть бути токсичними для кошенят: шоколад, цибуля, часник, виноград тощо.</p>
          
          <h3>8. Використовуйте мілкі миски</h3>
          <p>Глибокі миски можуть натирати вусики кошеняти і викликати неприємні відчуття під час їжі.</p>
          
          <h3>9. Спостерігайте за вагою</h3>
          <p>Регулярно зважуйте кошеня, щоб переконатися в нормальному рості та розвитку.</p>
          
          <h3>10. Консультуйтеся з ветеринаром</h3>
          <p>Регулярні візити до ветеринара допоможуть вам коригувати раціон, враховуючи особливості здоров'я вашого кошеняти.</p>
          
          <p>Дотримуючись цих простих правил, ви забезпечите своєму кошеняті здоровий старт у житті та закладете основу для його довгого та щасливого майбутнього!</p>
        `,
        author: moderators[1]._id,
        image: 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        tags: ['кошенята', 'харчування', 'догляд', 'поради'],
        category: createdCategories[1]._id, // Категорія "Поради по догляду"
        status: 'published',
        slug: 'yak-pravilno-goduvati-koshenyat',
        readTime: 8
      }
    ];

    // Імпорт постів блогу
    const createdPosts = await BlogPost.create(blogPosts);
    console.log(`${createdPosts.length} постів блогу додано`);

    // Створення коментарів до блогу
    const blogComments = [];
    
    // Додаємо кілька коментарів до кожного посту
    for (const post of createdPosts) {
      // Вибираємо випадкових користувачів для коментарів
      const commenters = createdUsers
        .filter(user => user.userType === 'volunteer' || user._id.toString() !== post.author.toString())
        .sort(() => 0.5 - Math.random())
        .slice(0, 3); // Беремо до 3 коментаторів для кожного поста
        
      // Генеруємо коментарі
      commenters.forEach((commenter, index) => {
        const commentTexts = [
          "Дуже корисна інформація, дякую за статтю!",
          "Цікаво дізнатися більше про цю тему.",
          "Поділився з друзями, це дійсно важливо знати.",
          "Не знав про це раніше, буду враховувати.",
          "А є якісь додаткові ресурси, де можна почитати про це детальніше?",
          "Хотілося б побачити більше таких статей!",
          "Повністю згоден з автором!",
          "Класна стаття, дуже допомогла розібратися."
        ];
        
        blogComments.push({
          post: post._id,
          user: commenter._id,
          content: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000) // Рандомна дата в межах останніх 10 днів
        });
      });
    }
    
    if (blogComments.length > 0) {
      const createdComments = await BlogComment.create(blogComments);
      console.log(`${createdComments.length} коментарів до блогу додано`);
    }
    
    console.log('Дані успішно завантажено');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Видалення даних з бази
const deleteData = async () => {
  try {
    await Review.deleteMany();
    await Animal.deleteMany();
    await Shelter.deleteMany();
    await User.deleteMany();
    await BlogCategory.deleteMany();
    await BlogPost.deleteMany();
    await BlogComment.deleteMany();
    
    console.log('Дані успішно видалено');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

// Визначення команди з аргументів
if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Додайте прапорець -i для імпорту даних або -d для видалення');
  process.exit();
}