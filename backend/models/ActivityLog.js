const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    required: true
  },
  userModel: {
    type: String,
    enum: ['Student', 'Company', 'Admin'],
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    trim: true
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  resource: {
    type: String,
    trim: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// Static method to log activity
activityLogSchema.statics.logActivity = function(data) {
  return this.create({
    user: data.user,
    userModel: data.userModel,
    action: data.action,
    details: data.details,
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    resource: data.resource,
    resourceId: data.resourceId,
    metadata: data.metadata
  });
};

// Static method to get analytics
activityLogSchema.statics.getAnalytics = function(startDate, endDate) {
  const pipeline = [
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: {
          action: '$action',
          userModel: '$userModel'
        },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $group: {
        _id: '$_id.userModel',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
