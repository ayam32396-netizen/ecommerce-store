const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const db = new DatabaseSync(path.join(__dirname, '..', 'store.db'));

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ------------------- إنشاء الجداول -------------------
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  image TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
`);

// ------------------- زرع بيانات أولية -------------------
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

const existingAdmin = db.prepare('SELECT * FROM admins WHERE email = ?').get(adminEmail);
if (!existingAdmin) {
  const hashed = bcrypt.hashSync(adminPassword, 10);
  db.prepare('INSERT INTO admins (email, password) VALUES (?, ?)').run(adminEmail, hashed);
  console.log(`تم إنشاء حساب أدمن افتراضي: ${adminEmail} / ${adminPassword}`);
}

const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
if (productCount === 0) {
  const insert = db.prepare(`
    INSERT INTO products (name, description, price, image, stock, category)
    VALUES (@name, @description, @price, @image, @stock, @category)
  `);
  const sample = [
    { name: 'سيروم فيتامين سي', description: 'سيروم مضاد للأكسدة لتفتيح وتوحيد لون البشرة', price: 280, image: '', stock: 25, category: 'بشرة' },
    { name: 'كريم مرطب للوجه', description: 'كريم ترطيب يومي مناسب لكل أنواع البشرة', price: 190, image: '', stock: 30, category: 'بشرة' },
    { name: 'غسول وجه منظف', description: 'غسول لطيف لتنظيف البشرة من الأتربة والزيوت', price: 140, image: '', stock: 35, category: 'بشرة' },
    { name: 'زيت الأرجان للشعر', description: 'زيت طبيعي لترطيب وتغذية الشعر الجاف', price: 220, image: '', stock: 20, category: 'شعر' },
    { name: 'شامبو خالي من الكبريتات', description: 'شامبو مناسب للشعر الحساس والمصبوغ', price: 165, image: '', stock: 28, category: 'شعر' },
    { name: 'ماسك ترطيب للشعر', description: 'ماسك عميق لعلاج تقصف وجفاف الشعر', price: 200, image: '', stock: 18, category: 'شعر' },
    { name: 'لوشن ترطيب الجسم', description: 'لوشن سريع الامتصاص لترطيب الجسم يوميًا', price: 175, image: '', stock: 30, category: 'جسم' },
    { name: 'سكراب الجسم الطبيعي', description: 'سكراب لتقشير وتنعيم البشرة بمكونات طبيعية', price: 155, image: '', stock: 22, category: 'جسم' }
  ];
  const insertMany = () => {
    db.exec('BEGIN');
    try {
      for (const item of sample) {
        insert.run({
          '@name': item.name,
          '@description': item.description,
          '@price': item.price,
          '@image': item.image,
          '@stock': item.stock,
          '@category': item.category
        });
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
  insertMany();
  console.log('تم إضافة منتجات تجريبية.');
}

module.exports = db;
