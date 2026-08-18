const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../config/db');
require('dotenv').config();

// تسجيل دخول الأدمن
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
  if (!admin) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  const isMatch = bcrypt.compareSync(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'بيانات الدخول غير صحيحة' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET || 'change_this_secret_key_please',
    { expiresIn: '8h' }
  );

  res.json({ message: 'تم تسجيل الدخول بنجاح', token, admin: { id: admin.id, email: admin.email } });
});

module.exports = router;
