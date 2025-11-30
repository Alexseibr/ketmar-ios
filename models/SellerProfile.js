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
    },
  },
  { _id: false }
);

const RatingsSchema = new mongoose.Schema(
  {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const AnalyticsSchema = new mongoose.Schema(
  {
    totalViews: {
      type: Number,
      default: 0,
    },
    totalProductViews: {
      type: Number,
      default: 0,
    },
    contactOpens: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const sellerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    telegramId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    avatar: {
      type: String,
      trim: true,
      default: null,
    },
    banner: {
      type: String,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
    isFarmer: {
      type: Boolean,
      default: false,
      index: true,
    },
    shopRole: {
      type: String,
      enum: ['SHOP', 'FARMER', 'BLOGGER', 'ARTISAN'],
      default: 'SHOP',
      index: true,
    },
    instagram: {
      type: String,
      trim: true,
      default: null,
    },
    telegramUsername: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    messengers: {
      telegram: {
        type: String,
        trim: true,
        default: null,
      },
      viber: {
        type: String,
        trim: true,
        default: null,
      },
      whatsapp: {
        type: String,
        trim: true,
        default: null,
      },
    },
    socials: {
      tiktok: {
        type: String,
        trim: true,
        default: null,
      },
      youtube: {
        type: String,
        trim: true,
        default: null,
      },
      website: {
        type: String,
        trim: true,
        default: null,
      },
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },
    geo: {
      type: GeoPointSchema,
      default: null,
    },
    city: {
      type: String,
      trim: true,
      default: null,
    },
    cityCode: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: null,
    },
    ratings: {
      type: RatingsSchema,
      default: () => ({ score: 0, count: 0 }),
    },
    subscribersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    productsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    analytics: {
      type: AnalyticsSchema,
      default: () => ({}),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    blockReason: {
      type: String,
      trim: true,
      default: null,
    },
    workingHours: {
      type: String,
      trim: true,
      default: null,
    },
    deliveryInfo: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    showPhone: {
      type: Boolean,
      default: true,
    },
    region: {
      type: String,
      trim: true,
      default: null,
    },
    tags: [{
      type: String,
      trim: true,
    }],

    // === Delivery & Roles ===
    // Primary role (legacy - for backward compatibility)
    role: {
      type: String,
      enum: ['SHOP', 'FARMER', 'BLOGGER', 'ARTISAN'],
      default: 'SHOP',
    },
    // Multiple roles support - one seller can be BLOGGER + ARTISAN
    roles: {
      type: [{
        type: String,
        enum: ['SHOP', 'FARMER', 'BLOGGER', 'ARTISAN'],
      }],
      default: ['SHOP'],
      validate: {
        validator: function(arr) {
          return arr && arr.length > 0 && arr.length <= 4;
        },
        message: 'Must have at least 1 role and max 4 roles',
      },
    },
    // Primary role index for sorting/display
    primaryRoleIndex: {
      type: Number,
      default: 0,
      min: 0,
    },
    canDeliver: {
      type: Boolean,
      default: false,
    },
    deliveryRadiusKm: {
      type: Number,
      min: 0,
      default: null,
    },
    defaultDeliveryPrice: {
      type: Number,
      min: 0,
      default: null,
    },

    // === Verification ===
    verificationLevel: {
      type: String,
      enum: ['basic', 'pro', null],
      default: null,
    },

    // === Route Planning ===
    baseLocation: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, trim: true, default: null },
    },
  },
  {
    timestamps: true,
  }
);

sellerProfileSchema.index({ name: 'text', description: 'text' });
sellerProfileSchema.index({ 'geo': '2dsphere' });
sellerProfileSchema.index({ subscribersCount: -1 });
sellerProfileSchema.index({ 'ratings.score': -1 });
sellerProfileSchema.index({ createdAt: -1 });
sellerProfileSchema.index({ roles: 1 });

// Virtual for getting primary role from roles array
sellerProfileSchema.virtual('primaryRole').get(function() {
  if (this.roles && this.roles.length > 0) {
    const idx = Math.min(this.primaryRoleIndex || 0, this.roles.length - 1);
    return this.roles[idx];
  }
  return this.role || 'SHOP';
});

// Middleware to sync role field with roles array (backward compatibility)
sellerProfileSchema.pre('save', function(next) {
  // If roles is empty but role exists, initialize roles from role
  if ((!this.roles || this.roles.length === 0) && this.role) {
    this.roles = [this.role];
  }
  
  // Sync role field with primary role from roles array
  if (this.roles && this.roles.length > 0) {
    const idx = Math.min(this.primaryRoleIndex || 0, this.roles.length - 1);
    this.role = this.roles[idx];
  }
  
  // Also sync legacy shopRole field if it exists
  if (this.shopRole !== undefined) {
    this.shopRole = this.role;
  }
  
  next();
});

// Helper methods for roles
sellerProfileSchema.methods.hasRole = function(role) {
  return this.roles && this.roles.includes(role);
};

sellerProfileSchema.methods.addRole = function(role) {
  if (!this.roles) this.roles = [];
  if (!this.roles.includes(role)) {
    this.roles.push(role);
  }
  return this;
};

sellerProfileSchema.methods.removeRole = function(role) {
  if (this.roles && this.roles.length > 1) {
    this.roles = this.roles.filter(r => r !== role);
    // Adjust primaryRoleIndex if needed
    if (this.primaryRoleIndex >= this.roles.length) {
      this.primaryRoleIndex = 0;
    }
  }
  return this;
};

sellerProfileSchema.methods.setPrimaryRole = function(role) {
  const idx = this.roles ? this.roles.indexOf(role) : -1;
  if (idx >= 0) {
    this.primaryRoleIndex = idx;
    this.role = role;
  }
  return this;
};

sellerProfileSchema.statics.generateSlug = async function(name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);
  
  let slug = baseSlug;
  let counter = 1;
  
  while (await this.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug || `shop-${Date.now().toString(36)}`;
};

sellerProfileSchema.statics.findBySlugOrId = async function(identifier) {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return this.findById(identifier);
  }
  return this.findOne({ slug: identifier.toLowerCase() });
};

sellerProfileSchema.methods.incrementView = async function() {
  this.analytics.totalViews = (this.analytics.totalViews || 0) + 1;
  this.analytics.lastViewedAt = new Date();
  return this.save();
};

sellerProfileSchema.methods.incrementContactOpen = async function() {
  this.analytics.contactOpens = (this.analytics.contactOpens || 0) + 1;
  return this.save();
};

sellerProfileSchema.methods.updateProductsCount = async function() {
  const Ad = mongoose.model('Ad');
  const count = await Ad.countDocuments({
    sellerTelegramId: this.telegramId,
    status: 'active',
  });
  this.productsCount = count;
  return this.save();
};

sellerProfileSchema.methods.updateRating = async function() {
  const Review = mongoose.model('SellerReview');
  const stats = await Review.aggregate([
    { $match: { sellerId: this._id } },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);
  
  if (stats.length > 0) {
    this.ratings.score = Math.round(stats[0].avgScore * 10) / 10;
    this.ratings.count = stats[0].count;
  } else {
    this.ratings.score = 0;
    this.ratings.count = 0;
  }
  
  return this.save();
};

const SellerProfile = mongoose.model('SellerProfile', sellerProfileSchema);

export default SellerProfile;
