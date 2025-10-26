const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    default: 'medium'
  },
  internships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Internship'
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
companySchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
companySchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without password)
companySchema.methods.getPublicProfile = function() {
  const company = this.toObject();
  delete company.password;
  return company;
};

module.exports = mongoose.model('Company', companySchema);
