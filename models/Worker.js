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

const ServiceAreaSchema = new mongoose.Schema(
  {
    city: { type: String, trim: true },
    radiusKm: { type: Number, default: 30 },
    geo: { type: GeoPointSchema, default: undefined },
  },
  { _id: false }
);

const ReviewSummarySchema = new mongoose.Schema(
  {
    quality: { type: Number, default: 0 },
    punctuality: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
  },
  { _id: false }
);

const workerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true,
    },
    telegramId: {
      type: Number,
      index: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    categories: [{
      type: String,
      trim: true,
      index: true,
    }],
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    priceFrom: {
      type: Number,
      min: 0,
    },
    priceTo: {
      type: Number,
      min: 0,
    },
    priceUnit: {
      type: String,
      enum: ['hour', 'day', 'project', 'm2'],
      default: 'hour',
    },
    currency: {
      type: String,
      default: 'BYN',
    },
    location: LocationSchema,
    serviceAreas: [ServiceAreaSchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
    reviewSummary: ReviewSummarySchema,
    completedOrdersCount: {
      type: Number,
      default: 0,
    },
    activeOrdersCount: {
      type: Number,
      default: 0,
    },
    responseRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    avgResponseTimeMinutes: {
      type: Number,
      default: null,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPro: {
      type: Boolean,
      default: false,
    },
    isTeam: {
      type: Boolean,
      default: false,
    },
    teamSize: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['active', 'busy', 'inactive', 'banned'],
      default: 'active',
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    contactsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

workerSchema.index({ 'location.geo': '2dsphere' });
workerSchema.index({ 'serviceAreas.geo': '2dsphere' });
workerSchema.index({ categories: 1, status: 1 });
workerSchema.index({ rating: -1, completedOrdersCount: -1 });
workerSchema.index({ lastActiveAt: -1 });

workerSchema.methods.updateRating = async function(newRating, reviewSummary) {
  const totalReviews = this.reviewsCount;
  const currentTotal = this.rating * totalReviews;
  this.reviewsCount = totalReviews + 1;
  this.rating = (currentTotal + newRating) / this.reviewsCount;
  
  if (reviewSummary) {
    if (!this.reviewSummary) {
      this.reviewSummary = { quality: 0, punctuality: 0, communication: 0 };
    }
    const oldSum = totalReviews;
    this.reviewSummary.quality = (this.reviewSummary.quality * oldSum + reviewSummary.quality) / this.reviewsCount;
    this.reviewSummary.punctuality = (this.reviewSummary.punctuality * oldSum + reviewSummary.punctuality) / this.reviewsCount;
    this.reviewSummary.communication = (this.reviewSummary.communication * oldSum + reviewSummary.communication) / this.reviewsCount;
  }
  
  await this.save();
};

workerSchema.methods.incrementCompleted = async function() {
  this.completedOrdersCount += 1;
  if (this.activeOrdersCount > 0) {
    this.activeOrdersCount -= 1;
  }
  await this.save();
};

workerSchema.statics.findNearby = async function(lat, lng, radiusKm = 30, filters = {}) {
  const query = {
    status: 'active',
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
    query.categories = filters.category;
  }

  if (filters.minRating) {
    query.rating = { $gte: filters.minRating };
  }

  if (filters.isVerified) {
    query.isVerified = true;
  }

  if (filters.isTeam) {
    query.isTeam = true;
  }

  return this.find(query)
    .sort({ rating: -1, completedOrdersCount: -1 })
    .limit(filters.limit || 50);
};

const Worker = mongoose.model('Worker', workerSchema);

export default Worker;
