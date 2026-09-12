const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ORG_TYPES = ['NGO', 'Hospital', 'BloodBank'];

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: 150,
    },
    type: {
      type: String,
      required: [true, 'Organization type is required'],
      enum: ORG_TYPES,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    contact_number: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      default: 'org',
      immutable: true,
    },
    isVerified: {
      type: Boolean,
      default: false, // could be flipped by admin after manual verification
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


organizationSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

organizationSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Organization', organizationSchema);
module.exports.ORG_TYPES = ORG_TYPES;
