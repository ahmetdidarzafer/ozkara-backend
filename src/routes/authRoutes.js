const express = require('express');
const { register, login, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Debug middleware ekleyelim
// router.use((req, res, next) => {
//   console.log('Auth Route - Request Body:', req.body);
//   next();
// });

// Kullanıcı kaydı
router.post('/register', register);

// Kullanıcı girişi
router.post('/login', login);

// Hesap silme
router.delete('/delete-account', protect, deleteAccount);

module.exports = router;
