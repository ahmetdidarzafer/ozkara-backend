require('dotenv').config(); // Bu satır en üstte olmalı
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const mongoose = require('mongoose');

// const app = require('./app');

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Sunucu ${PORT} portunda çalışıyor...`);
// });
// filepath: /d:/Development/Web Development/Ozkara-Motor-Yaglari/backend/src/server.js
// filepath: /d:/Development/Web Development/Ozkara-Motor-Yaglari/backend/src/server.js
// filepath: /d:/Development/Web Development/Ozkara-Motor-Yaglari/backend/src/server.js

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes'); // Import your appointment routes

const app = express();

// Global hata yakalama
process.on('unhandledRejection', (err) => {
  console.error('Yakalanmamış Promise Hatası:', err);
});

// Connect to MongoDB
connectDB();

// Enable CORS for all routes
app.use(cors({
  origin: 'https://ozkara.onrender.com/', // Frontend'in çalıştığı adres
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Use your routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/appointments', appointmentRoutes); // Use your appointment routes

// Hata yakalama middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Bir hata oluştu'
  });
});

const PORT = process.env.PORT || 5001;

// Server başlatma öncesi log
console.log('Server başlatılıyor...');

// MongoDB bağlantı durumunu kontrol et
mongoose.connection.on('connected', () => {
  console.log('MongoDB bağlantısı başarılı');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

// Server'ı başlat
app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor!`);
  console.log(`API endpoint: http://localhost:${PORT}/api`);
});

// Hata yakalama
process.on('unhandledRejection', (err) => {
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  process.exit(1);
});
