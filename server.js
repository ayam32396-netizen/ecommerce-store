const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ملفات الواجهة الثابتة (Frontend)
app.use(express.static(path.join(__dirname, 'public')));

// مسارات الـ API
app.use('/api/admin', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

app.listen(PORT,'0.0.0.0',() => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`متجر العملاء: http://localhost:${PORT}`);
  console.log(`لوحة تحكم الأدمن: http://localhost:${PORT}/admin`);
});
