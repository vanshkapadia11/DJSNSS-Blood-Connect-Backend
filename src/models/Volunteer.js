const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
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
      select: false, // never return password by default
    },
    phone_no: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [18, 'Volunteer must be at least 18 years old'],
      max: 100,
    },
    college: {
      type: String,
      trim: true,
      default: '',
    },
    blood_group: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: BLOOD_GROUPS,
    },
    health_conditions: {
      type: String,
      trim: true,
      default: 'None',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    role: {
      type: String,
      default: 'volunteer',
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true, // used for soft-ban by admin instead of hard delete
    },
  },
  { timestamps: true }
);


// Hash password before saving, only if it was modified
volunteerSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

volunteerSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Volunteer', volunteerSchema);
module.exports.BLOOD_GROUPS = BLOOD_GROUPS;
