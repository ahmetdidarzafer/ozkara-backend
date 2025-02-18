const Product = require('../models/Product');
const fs = require('fs').promises;
const path = require('path');

// Memory cache için basit bir Map
const productCache = {
  data: new Map(),
  timeout: new Map(),
};

// Cache temizleme fonksiyonu
const clearCache = (key) => {
  productCache.data.delete(key);
  productCache.timeout.delete(key);
};

// ✅ Ürün ekleme (Admin)
const addProduct = async (req, res) => {
  try {
    console.log('Gelen istek:', req.body, req.file); // Debug için

    const { name, description, price, category, stock } = req.body;
    
    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar zorunludur'
      });
    }

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      stock: Number(stock)
    };
    
    if (req.file) {
      const imageBuffer = req.file.buffer;
      const base64Image = imageBuffer.toString('base64');
      productData.image = {
        data: `data:${req.file.mimetype};base64,${base64Image}`,
        contentType: req.file.mimetype
      };
    }

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    invalidateCache(); // Cache'i temizle

    console.log('Kaydedilen ürün:', savedProduct); // Debug için

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla eklendi',
      data: savedProduct
    });
  } catch (error) {
    console.error('Ürün ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün eklenirken bir hata oluştu',
      error: error.message
    });
  }
};

// ✅ Tüm ürünleri listeleme - optimize edilmiş versiyon
const getProducts = async (req, res) => {
  try {
    const cacheKey = 'all_products';
    
    // Cache kontrolü
    if (productCache.data.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        data: productCache.data.get(cacheKey),
        fromCache: true
      });
    }

    // Veritabanından çek
    const products = await Product.find()
      .select('name description price category stock image')
      .sort({ createdAt: -1 })
      .lean()
      .limit(20);
    
    // Cache'e kaydet
    productCache.data.set(cacheKey, products);
    
    // 5 dakika sonra cache'i temizle
    const timeoutId = setTimeout(() => clearCache(cacheKey), 5 * 60 * 1000);
    productCache.timeout.set(cacheKey, timeoutId);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Ürün getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler yüklenirken bir hata oluştu'
    });
  }
};

// ✅ Belirli bir ürünü getirme
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ✅ Ürünü güncelleme (Admin)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, stock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    product.price = price;
    product.stock = stock;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: product
    });
  } catch (error) {
    console.error('Ürün güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün güncellenirken bir hata oluştu'
    });
  }
};

// ✅ Ürünü silme (Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }
    invalidateCache(); // Cache'i temizle

    res.status(200).json({
      success: true,
      message: 'Ürün başarıyla silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken bir hata oluştu',
      error: error.message
    });
  }
};

// Admin için ürünleri getir - optimize edilmiş
const getAdminProducts = async (req, res) => {
  try {
    const cacheKey = 'admin_products';
    
    // Cache kontrolü
    if (productCache.data.has(cacheKey)) {
      return res.status(200).json({
        success: true,
        data: productCache.data.get(cacheKey),
        fromCache: true
      });
    }

    // Veritabanından çek
    const products = await Product.find()
      .select('name description price category stock image')
      .sort({ createdAt: -1 })
      .lean();
    
    // Cache'e kaydet
    productCache.data.set(cacheKey, products);
    
    // 1 dakika sonra cache'i temizle
    const timeoutId = setTimeout(() => clearCache(cacheKey), 60 * 1000);
    productCache.timeout.set(cacheKey, timeoutId);

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Admin ürün getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler yüklenirken bir hata oluştu'
    });
  }
};

// Cache'i temizleme fonksiyonu - yeni ürün eklendiğinde veya silindiğinde çağrılacak
const invalidateCache = () => {
  for (const [key, timeoutId] of productCache.timeout.entries()) {
    clearTimeout(timeoutId);
    clearCache(key);
  }
};

// Tüm fonksiyonları tek bir objede export et
module.exports = { 
  addProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  getAdminProducts
};
