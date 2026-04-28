import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Создание или подключение к базе данных
const db = new Database(join(__dirname, 'shop.db'));

// Включаем WAL режим для лучшей производительности
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Инициализация таблиц
function initializeDatabase() {
  db.exec(`
    -- Таблица товаров
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER NOT NULL CHECK(price >= 0),
      image TEXT DEFAULT '',
      category TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица администраторов
    CREATE TABLE IF NOT EXISTS admins (
      user_id INTEGER PRIMARY KEY,
      username TEXT,
      role TEXT DEFAULT 'admin' CHECK(role IN ('admin', 'superadmin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица заказов
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      username TEXT,
      items TEXT NOT NULL,
      total INTEGER NOT NULL CHECK(total >= 0),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      comment TEXT DEFAULT '',
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'processing', 'completed', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица контекста редактирования для бота
    CREATE TABLE IF NOT EXISTS edit_context (
      user_id INTEGER PRIMARY KEY,
      product_id INTEGER,
      field TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Индексы для оптимизации запросов
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
  `);

  console.log('Database initialized successfully');
}

// Добавление начальных данных
function seedDatabase() {
  // Добавление администраторов по умолчанию
  const defaultAdmins = process.env.ADMIN_IDS 
    ? process.env.ADMIN_IDS.split(',').map(id => ({
        user_id: parseInt(id.trim()),
        username: 'admin',
        role: 'superadmin'
      }))
    : [{ user_id: 327385749, username: 'admin', role: 'superadmin' }];

  const insertAdmin = db.prepare(
    'INSERT OR IGNORE INTO admins (user_id, username, role) VALUES (@user_id, @username, @role)'
  );

  const insertMany = db.transaction((admins) => {
    for (const admin of admins) {
      insertAdmin.run(admin);
    }
  });

  insertMany(defaultAdmins);

  // Добавление тестовых товаров, если таблица пуста
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  
  if (productCount.count === 0) {
    const defaultProducts = [
      {
        name: 'Беспроводные наушники',
        description: 'Bluetooth 5.0, активное шумоподавление, 30 часов работы',
        price: 4990,
        image: 'https://picsum.photos/seed/headphones/400/400',
        category: 'Электроника'
      },
      {
        name: 'Умные часы',
        description: 'Фитнес-трекер, пульсометр, водонепроницаемые',
        price: 8990,
        image: 'https://picsum.photos/seed/smartwatch/400/400',
        category: 'Электроника'
      },
      {
        name: 'Портативная колонка',
        description: '20W мощность, защита IPX7, 12 часов работы',
        price: 3490,
        image: 'https://picsum.photos/seed/speaker/400/400',
        category: 'Аудио'
      }
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (name, description, price, image, category) 
      VALUES (@name, @description, @price, @image, @category)
    `);

    const insertProducts = db.transaction((products) => {
      for (const product of products) {
        insertProduct.run(product);
      }
    });

    insertProducts(defaultProducts);
    console.log('Seed data inserted');
  }
}

// Инициализация
initializeDatabase();
seedDatabase();

export default db;