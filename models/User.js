import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'seller', 'buyer'],
    default: 'buyer',
  },
}, {
  timestamps: true,
});

export default mongoose.model('User', userSchema);
