const express = require('express');
const router = express.Router();
const db = require('../config/db');
const db = require('better-sqlite3')('../store.db');

// ------------------- مسارات عامة (للعملاء) -------------------

// جلب كل المنتجات
router.get('/', (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(products);
});

// جلب منتج واحد
router.get('/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ message: 'المنتج غير موجود' });
  res.json(product);
});

// ------------------- مسارات الأدمن (محمية) -------------------

// إضافة منتج جديد
router.post('/', verifyAdmin, (req, res) => {
  const { name, description, price, image, stock, category } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'اسم المنتج والسعر مطلوبان' });
  }

  const result = db.prepare(`
    INSERT INTO products (name, description, price, image, stock, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, description || '', price, image || '', stock || 0, category || '');

  const newProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(newProduct);
});

// تعديل منتج
router.put('/:id', verifyAdmin, (req, res) => {
  const { name, description, price, image, stock, category } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

  if (!existing) return res.status(404).json({ message: 'المنتج غير موجود' });

  db.prepare(`
    UPDATE products
    SET name = ?, description = ?, price = ?, image = ?, stock = ?, category = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name ?? existing.name,
    description ?? existing.description,
    price ?? existing.price,
    image ?? existing.image,
    stock ?? existing.stock,
    category ?? existing.category,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// حذف منتج
router.delete('/:id', verifyAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'المنتج غير موجود' });

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف المنتج بنجاح' });
});

module.exports = router;
