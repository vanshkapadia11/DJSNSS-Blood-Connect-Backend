const mongoose = require('mongoose');

const URGENCY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];
const EVENT_STATUS = ['Active', 'Closed', 'Expired'];

const eventSchema = new mongoose.Schema(
  {
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    urgency: {
      type: String,
      enum: URGENCY_LEVELS,
      default: 'Medium',
    },
    requirements_count: {
      type: Number,
      required: [true, 'requirements_count (how many volunteers needed) is required'],
      min: [1, 'At least 1 volunteer must be required'],
    },
    start_date: {
      type: Date,
      required: [true, 'start_date is required'],
    },
    duration_days: {
      type: Number,
      required: [true, 'duration_days is required'],
      min: [1, 'Event must run at least 1 day'],
    },
    expiry_date: {
      type: Date, // auto-calculated in pre-save hook: start_date + duration_days
    },
    status: {
      type: String,
      enum: EVENT_STATUS,
      default: 'Active',
      index: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate expiry_date whenever start_date/duration_days change
eventSchema.pre('save', function calcExpiry(next) {
  if (this.isModified('start_date') || this.isModified('duration_days') || this.isNew) {
    const expiry = new Date(this.start_date);
    expiry.setDate(expiry.getDate() + Number(this.duration_days));
    this.expiry_date = expiry;
  }
  next();
});

// Instance helper - true if event's expiry_date has already passed
eventSchema.methods.isExpired = function isExpired() {
  return this.expiry_date && this.expiry_date.getTime() < Date.now();
};

eventSchema.index({ status: 1, expiry_date: 1 });

module.exports = mongoose.model('Event', eventSchema);
module.exports.URGENCY_LEVELS = URGENCY_LEVELS;
module.exports.EVENT_STATUS = EVENT_STATUS;
