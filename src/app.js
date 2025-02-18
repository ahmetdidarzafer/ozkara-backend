const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
require('dotenv').config();
const mongoose = require('mongoose');
const compression = require('compression');

const app = express();

// CORS options
const corsOptions = {
  origin: 'https://ozkara.onrender.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

// Ana CORS middleware
app.use(cors(corsOptions));

// Pre-flight istekleri için
app.options('*', cors(corsOptions));

// Temel middleware'ler
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware
app.use((req, res, next) => {
  console.log('İstek geldi:', {
    method: req.method,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  next();
});

// MongoDB bağlantısı
connectDB();

// Cache middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${duration}`);
    next();
  };
};

// Rotalar
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', appointmentRoutes);
app.use('/api/products', productRoutes);

// MongoDB bağlantı durumunu kontrol et
mongoose.connection.on('error', (err) => {
  console.error('MongoDB bağlantı hatası:', err);
});

mongoose.connection.once('open', () => {
  console.log('MongoDB bağlantısı başarılı');
});

// Hata yakalama middleware'i
app.use((err, req, res, next) => {
  console.error('Hata:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Sunucu hatası oluştu',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

module.exports = app;
