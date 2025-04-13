const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
const animalUploadsDir = path.join(uploadDir, 'animals');
const userUploadsDir = path.join(uploadDir, 'users');

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(animalUploadsDir)) {
    fs.mkdirSync(animalUploadsDir, { recursive: true });
}
if (!fs.existsSync(userUploadsDir)) {
    fs.mkdirSync(userUploadsDir, { recursive: true });
}

// Конфігурація для тварин
const animalStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, animalUploadsDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'animal-' + uniqueSuffix + ext);
    }
});

// Конфігурація для притулків
const shelterStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/shelters');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `shelter-${uniqueSuffix}${ext}`);
  }
});

// Додаємо конфігурацію для блогу
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/blog');
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `blog-${uniqueSuffix}${ext}`);
  }
});

// Додайте під іншими конфігураціями storage:
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, userUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

// Фільтр для перевірки типів файлів
const fileFilter = (req, file, cb) => {
  // Дозволені типи зображень
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Непідтримуваний формат файлу. Підтримуються лише JPEG, JPG, PNG та WEBP.'), false);
  }
};

// Обмеження розміру файлу: 5 MB
const limits = {
  fileSize: 5 * 1024 * 1024
};

// Експорт multer middleware
exports.uploadAnimalImage = multer({ 
  storage: animalStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Підтримуються лише файли зображень (jpeg, jpg, png, gif)!'));
    }
  }
}).single('image'); // Make sure this is 'image', not 'photos'

exports.uploadShelterImage = multer({
  storage: shelterStorage,
  fileFilter,
  limits
}).single('image');

exports.uploadShelterGallery = multer({
  storage: shelterStorage,
  fileFilter,
  limits
}).array('gallery', 10); // Максимум 10 зображень для галереї

// Додаємо експорт для завантаження зображень блогу
exports.uploadBlogImage = multer({
  storage: blogStorage,
  fileFilter,
  limits
}).single('image');

// Додайте під існуючими exports:
exports.uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Підтримуються лише зображення (jpeg, jpg, png)!'));
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
}).single('avatar');

// Configure upload middleware for animal images
exports.uploadAnimalImages = multer({ 
    storage: animalStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Підтримуються лише файли зображень (jpeg, jpg, png, gif)!'));
        }
    }
}).array('photos', 5); // Allow up to 5 photos