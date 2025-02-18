const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const {
  getProducts,
  getAdminProducts,
  addProduct,
  deleteProduct,
  updateProduct
} = require('../controllers/productController');

// Multer ayarları
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir.'), false);
    }
  }
});

// Performance middleware
router.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

// Debug middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Hata yakalama middleware'i
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Public routes
router.get('/', getProducts);

// Admin routes
router.get('/admin', protect, getAdminProducts);
router.post('/', protect, upload.single('image'), asyncHandler(addProduct));
router.delete('/:id', protect, asyncHandler(deleteProduct));
router.put('/:id', protect, asyncHandler(updateProduct));

module.exports = router;