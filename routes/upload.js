const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const verifyAdmin = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('صيغة الصورة غير مدعومة (jpg, jpeg, png, webp, gif فقط)'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// رفع صورة منتج (محمي - أدمن فقط)
router.post('/', verifyAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'حدث خطأ أثناء رفع الصورة' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم اختيار صورة' });
    }
    const imagePath = `/uploads/${req.file.filename}`;
    res.json({ message: 'تم رفع الصورة بنجاح', path: imagePath });
  });
});

// حذف صورة منتج (محمي - أدمن فقط)
router.delete('/', verifyAdmin, (req, res) => {
  const { path: imagePath } = req.body;
  if (!imagePath || !imagePath.startsWith('/uploads/')) {
    return res.status(400).json({ message: 'مسار الصورة غير صالح' });
  }
  const fullPath = path.join(__dirname, '..', 'public', imagePath);
  fs.unlink(fullPath, (err) => {
    // نتجاهل الخطأ لو الملف مش موجود أصلاً
    res.json({ message: 'تم حذف الصورة' });
  });
});

module.exports = router;
