const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı zorunludur'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Ürün açıklaması zorunludur']
  },
  price: {
    type: Number,
    required: [true, 'Ürün fiyatı zorunludur'],
    index: true
  },
  category: {
    type: String,
    required: [true, 'Ürün kategorisi zorunludur'],
    index: true
  },
  stock: {
    type: Number,
    required: [true, 'Stok miktarı zorunludur']
  },
  image: {
    data: String,
    contentType: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index
productSchema.index({ category: 1, price: 1 });

// Cache için
productSchema.set('autoIndex', true);

module.exports = mongoose.model('Product', productSchema);
