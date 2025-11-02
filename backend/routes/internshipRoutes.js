const express = require('express');
const Internship = require('../models/Internship');
const ActivityLog = require('../models/ActivityLog');
const router = express.Router();

// Get all public internships (for landing page)
router.get('/public', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const internships = await Internship.find({ 
      isActive: true,
      applicationDeadline: { $gt: new Date() }
    })
    .populate('company', 'name location industry')
    .select('title companyName description location stipend duration mode startDate applicationDeadline')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Internship.countDocuments({ 
      isActive: true,
      applicationDeadline: { $gt: new Date() }
    });

    res.json({
      internships,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get public internships error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get internship details by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await Internship.findById(id)
      .populate('company', 'name description website location industry');

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Log view activity only if user is authenticated
    if (req.user) {
      await ActivityLog.logActivity({
        user: req.user.id,
        userModel: req.user.role,
        action: 'view_internship',
        details: `Viewed internship: ${internship.title}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        resource: 'Internship',
        resourceId: internship._id
      });
    }

    res.json({ internship });
  } catch (error) {
    console.error('Get internship error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search internships (public)
router.get('/search/public', async (req, res) => {
  try {
    const { 
      q, 
      location, 
      mode, 
      page = 1, 
      limit = 10 
    } = req.query;
    const skip = (page - 1) * limit;

    const query = { 
      isActive: true,
      applicationDeadline: { $gt: new Date() }
    };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } }
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    if (mode) {
      query.mode = mode;
    }

    const internships = await Internship.find(query)
      .populate('company', 'name location industry')
      .select('title companyName description location stipend duration mode startDate applicationDeadline')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Internship.countDocuments(query);

    res.json({
      internships,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search internships error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get featured internships (most applications in last 7 days)
router.get('/featured/trending', async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingInternships = await Internship.aggregate([
      {
        $match: {
          isActive: true,
          applicationDeadline: { $gt: new Date() }
        }
      },
      {
        $addFields: {
          recentApplications: {
            $size: {
              $filter: {
                input: '$applications',
                cond: { $gte: ['$$this.appliedAt', sevenDaysAgo] }
              }
            }
          }
        }
      },
      {
        $sort: { recentApplications: -1, createdAt: -1 }
      },
      {
        $limit: 6
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }
      },
      {
        $unwind: '$company'
      },
      {
        $project: {
          title: 1,
          companyName: 1,
          description: 1,
          location: 1,
          stipend: 1,
          duration: 1,
          mode: 1,
          startDate: 1,
          applicationDeadline: 1,
          recentApplications: 1,
          'company.name': 1,
          'company.location': 1,
          'company.industry': 1
        }
      }
    ]);

    res.json({ internships: trendingInternships });
  } catch (error) {
    console.error('Get trending internships error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get internships by company
router.get('/company/:companyId', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const internships = await Internship.find({ 
      company: companyId,
      isActive: true 
    })
    .populate('company', 'name location industry')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Internship.countDocuments({ 
      company: companyId,
      isActive: true 
    });

    res.json({
      internships,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get company internships error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get internship statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalInternships = await Internship.countDocuments({ isActive: true });
    const totalApplications = await Internship.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: { $size: '$applications' } } } }
    ]);

    const branchStats = await Internship.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$branchPreference' },
      { $group: { _id: '$branchPreference', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const locationStats = await Internship.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const modeStats = await Internship.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$mode', count: { $sum: 1 } } }
    ]);

    res.json({
      totalInternships,
      totalApplications: totalApplications[0]?.total || 0,
      branchStats,
      locationStats,
      modeStats
    });
  } catch (error) {
    console.error('Get internship stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;