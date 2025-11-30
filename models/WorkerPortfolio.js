import mongoose from 'mongoose';

const portfolioItemSchema = new mongoose.Schema(
  {
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    photos: [{
      type: String,
      trim: true,
    }],
    beforePhoto: {
      type: String,
      trim: true,
    },
    afterPhoto: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
    },
    cost: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BYN',
    },
    completedAt: {
      type: Date,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

portfolioItemSchema.index({ workerId: 1, createdAt: -1 });
portfolioItemSchema.index({ category: 1, isPublic: 1 });

const WorkerPortfolio = mongoose.model('WorkerPortfolio', portfolioItemSchema);

export default WorkerPortfolio;
