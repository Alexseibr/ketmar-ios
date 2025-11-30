import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    cityName: String,
    address: String,
    geoHash: String,
  },
  { _id: false }
);

const jobSeekerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    telegramId: {
      type: Number,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
    },
    age: {
      type: Number,
    },
    phone: {
      type: String,
    },
    skills: [{
      type: String,
      trim: true,
    }],
    category: {
      type: String,
      enum: [
        'cleaning',
        'repair',
        'garden',
        'driving',
        'childcare',
        'eldercare',
        'cooking',
        'tutoring',
        'construction',
        'moving',
        'beauty',
        'other',
      ],
      default: 'other',
    },
    description: {
      type: String,
      trim: true,
      maxLength: 1000,
    },
    experience: {
      type: String,
      trim: true,
    },
    hourlyRate: {
      type: Number,
    },
    currency: {
      type: String,
      default: 'BYN',
    },
    availability: {
      type: String,
      enum: ['fulltime', 'parttime', 'weekends', 'evenings', 'flexible'],
      default: 'flexible',
    },
    location: LocationSchema,
    radiusKm: {
      type: Number,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'hired', 'archived'],
      default: 'active',
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    contactsCount: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

jobSeekerSchema.index({ 'location.geoHash': 1 });
jobSeekerSchema.index({ category: 1, status: 1 });
jobSeekerSchema.index({ status: 1, createdAt: -1 });
jobSeekerSchema.index({ userId: 1 });
jobSeekerSchema.index({ isActive: 1, status: 1 });

const JobSeeker = mongoose.model('JobSeeker', jobSeekerSchema);

export default JobSeeker;
