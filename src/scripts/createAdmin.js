require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const adminData = {
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    };

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Admin kullanıcısını oluştur
    await User.create(adminData);

    console.log('Admin kullanıcısı oluşturuldu');
    process.exit(0);
  } catch (error) {
    console.error('Hata:', error);
    process.exit(1);
  }
};

createAdmin(); 