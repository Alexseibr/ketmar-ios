import mongoose from 'mongoose';

const workerReviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerOrder',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    quality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    punctuality: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    communication: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    photos: [{
      type: String,
      trim: true,
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    workerReply: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    workerRepliedAt: {
      type: Date,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

workerReviewSchema.index({ workerId: 1, createdAt: -1 });
workerReviewSchema.index({ orderId: 1 }, { unique: true });

workerReviewSchema.statics.getForWorker = async function(workerId, options = {}) {
  const query = { workerId, isHidden: false };
  
  return this.find(query)
    .populate('customerId', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

workerReviewSchema.statics.getStats = async function(workerId) {
  const result = await this.aggregate([
    { $match: { workerId: new mongoose.Types.ObjectId(workerId), isHidden: false } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        avgQuality: { $avg: '$quality' },
        avgPunctuality: { $avg: '$punctuality' },
        avgCommunication: { $avg: '$communication' },
        count: { $sum: 1 },
        rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
      },
    },
  ]);

  return result[0] || {
    avgRating: 0,
    avgQuality: 0,
    avgPunctuality: 0,
    avgCommunication: 0,
    count: 0,
    rating5: 0,
    rating4: 0,
    rating3: 0,
    rating2: 0,
    rating1: 0,
  };
};

const WorkerReview = mongoose.model('WorkerReview', workerReviewSchema);

export default WorkerReview;
