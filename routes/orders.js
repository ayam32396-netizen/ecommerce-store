const express = require('express');
const router = express.Router();
const db = require('../config/db');
const verifyAdmin = require('../middleware/auth');

// ------------------- إنشاء طلب جديد (العميل) -------------------
router.post('/', (req, res) => {
  const { customer_name, customer_phone, customer_address, items } = req.body;

  if (!customer_name || !customer_phone || !customer_address || !items || !items.length) {
    return res.status(400).json({ message: 'الرجاء تعبئة كل البيانات المطلوبة واختيار منتجات' });
  }

  // التحقق من توفر المنتجات وحساب الإجمالي
  let total = 0;
  const validatedItems = [];

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
    if (!product) {
      return res.status(400).json({ message: `المنتج غير موجود: ${item.product_id}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `الكمية غير متوفرة للمنتج: ${product.name}` });
    }
    total += product.price * item.quantity;
    validatedItems.push({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      quantity: item.quantity
    });
  }

  const createOrder = () => {
    db.exec('BEGIN');
    try {
      const orderResult = db.prepare(`
        INSERT INTO orders (customer_name, customer_phone, customer_address, total, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(customer_name, customer_phone, customer_address, total);

      const orderId = orderResult.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `);
      const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

      for (const item of validatedItems) {
        insertItem.run(orderId, item.product_id, item.product_name, item.price, item.quantity);
        updateStock.run(item.quantity, item.product_id);
      }

      db.exec('COMMIT');
      return orderId;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };

  const orderId = createOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

  res.status(201).json({ ...order, items: orderItems });
});

// ------------------- مسارات الأدمن (محمية) -------------------

// جلب كل الطلبات
router.get('/', verifyAdmin, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const ordersWithItems = orders.map(order => {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    return { ...order, items };
  });
  res.json(ordersWithItems);
});

// جلب طلب واحد
router.get('/:id', verifyAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ message: 'الطلب غير موجود' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

// تحديث حالة الطلب
router.put('/:id/status', verifyAdmin, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'حالة الطلب غير صالحة' });
  }

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'الطلب غير موجود' });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// حذف طلب
router.delete('/:id', verifyAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ message: 'الطلب غير موجود' });

  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ message: 'تم حذف الطلب بنجاح' });
});

module.exports = router;
