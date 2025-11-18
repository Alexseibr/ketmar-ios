const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    categoryId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subcategoryId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BYN',
      trim: true,
    },
    photos: [{
      type: String,
      trim: true,
    }],
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    sellerTelegramId: {
      type: Number,
      required: true,
      index: true,
    },
    seasonCode: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'sold', 'archived'],
      default: 'active',
      index: true,
    },
    deliveryOptions: [{
      type: String,
      enum: ['pickup', 'delivery', 'shipping'],
    }],
    lifetimeDays: {
      type: Number,
      default: 30,
    },
    validUntil: {
      type: Date,
    },
    isLiveSpot: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Автоматический расчет validUntil при создании
adSchema.pre('save', function (next) {
  if (this.isNew && !this.validUntil) {
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (this.lifetimeDays || 30));
    this.validUntil = validUntil;
  }
  next();
});

// Составные индексы
adSchema.index({ status: 1, createdAt: -1 });
adSchema.index({ seasonCode: 1, status: 1 });

module.exports = mongoose.model('Ad', adSchema);
