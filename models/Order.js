const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  sellerTelegramId: {
    type: Number,
    required: true,
  },
});

const orderSchema = new mongoose.Schema(
  {
    buyerTelegramId: {
      type: Number,
      required: true,
      index: true,
    },
    buyerName: {
      type: String,
      trim: true,
    },
    buyerUsername: {
      type: String,
      trim: true,
    },
    buyerPhone: {
      type: String,
      trim: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'completed', 'cancelled'],
      default: 'pending',
    },
    seasonCode: {
      type: String,
      trim: true,
      lowercase: true,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ buyerTelegramId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ seasonCode: 1 });

module.exports = mongoose.model('Order', orderSchema);
