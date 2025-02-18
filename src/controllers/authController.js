const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Appointment = require('../models/Appointment');

// JWT oluşturma fonksiyonu
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Kullanıcı kaydı
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Zorunlu alanları kontrol et
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Lütfen tüm alanları doldurun'
      });
    }

    // Email formatını kontrol et
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir email adresi girin'
      });
    }

    // Telefon numarası formatını kontrol et
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir telefon numarası girin (10-11 rakam)'
      });
    }

    // Email'in benzersiz olduğunu kontrol et
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu e-posta adresi ile kayıtlı bir hesap bulunmaktadır'
      });
    }

    // Yeni kullanıcı oluştur
    const user = new User({
      name,
      email,
      phone,
      password,
      role: 'user'
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Kayıt başarılı'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyin.'
    });
  }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // Şifreyi kontrol et
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Giriş yapılırken bir hata oluştu'
    });
  }
};

// Hesap silme
exports.deleteAccount = async (req, res) => {
  try {
    // Kullanıcının randevularını sil
    await Appointment.deleteMany({ user: req.user._id });
    
    // Kullanıcıyı sil
    await User.findByIdAndDelete(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Hesabınız başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Hesap silinirken bir hata oluştu'
    });
  }
};
