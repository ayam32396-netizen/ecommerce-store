const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();



const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ملفات الواجهة (Frontend) الثابتة
app.use(express.static(path.join(__dirname, 'public')));

// مسارات الـ API
app.use('/api/admin', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

// صفحة العملاء الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// لوحة تحكم الأدمن
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
});

app.listen(PORT,'0.0.0.0',() => {
  console.log(`🚀 الخادم يعمل على المنفذ ${PORT}`);
  console.log(`متجر العملاء: http://localhost:${PORT}`);
  console.log(`لوحة تحكم الأدمن: http://localhost:${PORT}/admin`);
});
