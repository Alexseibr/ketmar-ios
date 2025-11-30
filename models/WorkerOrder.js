import mongoose from 'mongoose';

const GeoPointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
      default: undefined,
    },
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
    geo: { type: GeoPointSchema, default: undefined },
    city: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { _id: false }
);

const workerOrderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerTelegramId: {
      type: Number,
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
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
      required: true,
      trim: true,
      maxlength: 2000,
    },
    budgetFrom: {
      type: Number,
      min: 0,
    },
    budgetTo: {
      type: Number,
      min: 0,
    },
    budgetType: {
      type: String,
      enum: ['fixed', 'hourly', 'negotiable'],
      default: 'negotiable',
    },
    currency: {
      type: String,
      default: 'BYN',
    },
    location: LocationSchema,
    photos: [{
      type: String,
      trim: true,
    }],
    deadline: {
      type: Date,
    },
    urgency: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_progress', 'completed', 'cancelled', 'expired'],
      default: 'open',
      index: true,
    },
    assignedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      index: true,
    },
    assignedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    responsesCount: {
      type: Number,
      default: 0,
    },
    maxResponses: {
      type: Number,
      default: 10,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    chatId: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    reviewDetails: {
      quality: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    isRemoteOk: {
      type: Boolean,
      default: false,
    },
    materialsIncluded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

workerOrderSchema.index({ 'location.geo': '2dsphere' });
workerOrderSchema.index({ status: 1, category: 1, createdAt: -1 });
workerOrderSchema.index({ customerId: 1, status: 1 });
workerOrderSchema.index({ assignedWorkerId: 1, status: 1 });

workerOrderSchema.methods.assignWorker = async function(workerId) {
  this.assignedWorkerId = workerId;
  this.assignedAt = new Date();
  this.status = 'in_progress';
  await this.save();
};

workerOrderSchema.methods.complete = async function(rating, review, reviewDetails) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (rating) this.rating = rating;
  if (review) this.review = review;
  if (reviewDetails) this.reviewDetails = reviewDetails;
  await this.save();
};

workerOrderSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  await this.save();
};

workerOrderSchema.statics.findNearby = async function(lat, lng, radiusKm = 30, filters = {}) {
  const query = {
    status: 'open',
    'location.geo': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.urgency) {
    query.urgency = filters.urgency;
  }

  if (filters.maxBudget) {
    query.budgetTo = { $lte: filters.maxBudget };
  }

  return this.find(query)
    .sort({ urgency: -1, createdAt: -1 })
    .limit(filters.limit || 50);
};

const WorkerOrder = mongoose.model('WorkerOrder', workerOrderSchema);

export default WorkerOrder;
