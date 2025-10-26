const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  branchPreference: [{
    type: String,
    trim: true
  }],
  minCGPA: {
    type: Number,
    min: [0, 'Minimum CGPA cannot be negative'],
    max: [10, 'Maximum CGPA cannot exceed 10'],
    default: 0
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  stipend: {
    type: String,
    required: [true, 'Stipend is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  mode: {
    type: String,
    enum: {
      values: ['remote', 'onsite', 'hybrid'],
      message: 'Mode must be remote, onsite, or hybrid'
    },
    default: 'onsite'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  applicationDeadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  maxApplications: {
    type: Number,
    default: 100,
    min: [1, 'Maximum applications must be at least 1']
  },
  currentApplications: {
    type: Number,
    default: 0,
    min: [0, 'Current applications cannot be negative']
  },
  applications: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    coverLetter: {
      type: String,
      trim: true
    },
    resumePath: {
      type: String,
      default: null
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  requirements: {
    type: String,
    trim: true
  },
  benefits: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Add method to check if student can apply
internshipSchema.methods.canStudentApply = function(student) {
  // Check if internship is active
  if (!this.isActive) return false;
  
  // Check if application deadline has passed
  if (this.applicationDeadline && new Date(this.applicationDeadline) < new Date()) return false;
  
  // Check if student has already applied
  const alreadyApplied = this.applications.some(app => 
    app.student && app.student.toString() === student._id.toString()
  );
  if (alreadyApplied) return false;
  
  // Check if maximum applications reached
  if (this.currentApplications >= this.maxApplications) return false;
  
  // Check CGPA requirement
  if (this.minCGPA && student.cgpa < this.minCGPA) return false;
  
  // Check branch preference (if specified)
  if (this.branchPreference && this.branchPreference.length > 0) {
    const studentBranch = student.branch.toLowerCase();
    const branchMatch = this.branchPreference.some(branch => 
      studentBranch.includes(branch.toLowerCase()) || 
      branch.toLowerCase().includes(studentBranch)
    );
    if (!branchMatch) return false;
  }
  
  // All checks passed
  return true;
};

module.exports = mongoose.model('Internship', internshipSchema);