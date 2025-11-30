import mongoose from 'mongoose';

const workerResponseSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    priceOffer: {
      type: Number,
      min: 0,
    },
    priceType: {
      type: String,
      enum: ['fixed', 'hourly', 'daily', 'per_m2'],
      default: 'fixed',
    },
    currency: {
      type: String,
      default: 'BYN',
    },
    estimatedDuration: {
      type: String,
      trim: true,
    },
    canStartAt: {
      type: Date,
    },
    materialsIncluded: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending', 'viewed', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending',
      index: true,
    },
    viewedAt: {
      type: Date,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

workerResponseSchema.index({ orderId: 1, workerId: 1 }, { unique: true });
workerResponseSchema.index({ workerId: 1, status: 1, createdAt: -1 });
workerResponseSchema.index({ orderId: 1, status: 1, createdAt: -1 });

workerResponseSchema.methods.accept = async function() {
  this.status = 'accepted';
  this.respondedAt = new Date();
  await this.save();
};

workerResponseSchema.methods.reject = async function() {
  this.status = 'rejected';
  this.respondedAt = new Date();
  await this.save();
};

workerResponseSchema.methods.markViewed = async function() {
  if (this.status === 'pending') {
    this.status = 'viewed';
    this.viewedAt = new Date();
    await this.save();
  }
};

workerResponseSchema.statics.getForOrder = async function(orderId) {
  return this.find({ orderId })
    .populate('workerId')
    .sort({ createdAt: -1 });
};

workerResponseSchema.statics.getForWorker = async function(workerId, status = null) {
  const query = { workerId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('orderId')
    .sort({ createdAt: -1 });
};

const WorkerResponse = mongoose.model('WorkerResponse', workerResponseSchema);

export default WorkerResponse;
