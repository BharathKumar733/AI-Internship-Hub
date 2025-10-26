const express = require('express');
const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const ActivityLog = require('../models/ActivityLog');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Get admin dashboard stats
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Get basic stats
    const totalStudents = await Student.countDocuments();
    const totalCompanies = await Company.countDocuments();
    const totalInternships = await Internship.countDocuments();
    const activeInternships = await Internship.countDocuments({ isActive: true });

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentStudents = await Student.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    const recentCompanies = await Company.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get activity logs for analytics
    const activityStats = await ActivityLog.getAnalytics(sevenDaysAgo, new Date());

    // Get top companies by internship count
    const topCompanies = await Company.aggregate([
      {
        $lookup: {
          from: 'internships',
          localField: '_id',
          foreignField: 'company',
          as: 'internships'
        }
      },
      {
        $project: {
          name: 1,
          email: 1,
          internshipCount: { $size: '$internships' }
        }
      },
      {
        $sort: { internshipCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get popular skills
    const popularSkills = await Student.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const stats = {
      totalStudents,
      totalCompanies,
      totalInternships,
      activeInternships,
      recentStudents,
      recentCompanies,
      activityStats,
      topCompanies,
      popularSkills
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (students and companies)
router.get('/users', verifyToken, async (req, res) => {
  try {
    const { type, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let users = [];
    let total = 0;

    // Fetch students
    if (type === 'students' || !type) {
      const students = await Student.find()
        .select('name email branch cgpa skills createdAt lastLogin')
        .sort({ createdAt: -1 })
        .skip(!type ? skip : 0)
        .limit(!type ? parseInt(limit) : 1000);

      const studentUsers = students.map(student => ({
        ...student.toObject(),
        type: 'student'
      }));

      users = [...users, ...studentUsers];
      total += await Student.countDocuments();
    }

    // Fetch companies
    if (type === 'companies' || !type) {
      const companies = await Company.find()
        .select('name email industry location companySize createdAt lastLogin isVerified')
        .sort({ createdAt: -1 })
        .skip(!type ? skip : 0)
        .limit(!type ? parseInt(limit) : 1000);

      const companyUsers = companies.map(company => ({
        ...company.toObject(),
        type: 'company'
      }));

      users = [...users, ...companyUsers];
      total += await Company.countDocuments();
    }

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all internships
router.get('/internships', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const internships = await Internship.find(query)
      .populate('company', 'name email industry')
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
    console.error('Get internships error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get activity logs
router.get('/activity-logs', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, action, userType } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }
    if (userType) {
      query.userModel = userType;
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user status
router.put('/users/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, status } = req.body;

    let user;
    if (type === 'student') {
      user = await Student.findById(id);
    } else if (type === 'company') {
      user = await Company.findById(id);
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update status based on type
    if (type === 'company' && status === 'verified') {
      user.isVerified = true;
    } else if (type === 'company' && status === 'unverified') {
      user.isVerified = false;
    }

    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Admin',
      action: 'update_user_status',
      details: `Updated ${type} status to ${status}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: type === 'student' ? 'Student' : 'Company',
      resourceId: id
    });

    res.json({
      message: 'User status updated successfully'
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete user
router.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    let user;
    if (type === 'student') {
      user = await Student.findById(id);
    } else if (type === 'company') {
      user = await Company.findById(id);
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    if (type === 'student') {
      await Student.findByIdAndDelete(id);
    } else if (type === 'company') {
      // Also delete company's internships
      await Internship.deleteMany({ company: id });
      await Company.findByIdAndDelete(id);
    }

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Admin',
      action: 'delete_user',
      details: `Deleted ${type}: ${user.name}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: type === 'student' ? 'Student' : 'Company',
      resourceId: id
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Update internship status
router.put('/internships/:id/status', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    internship.isActive = isActive;
    await internship.save();

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Admin',
      action: 'update_internship_status',
      details: `Updated internship status to ${isActive ? 'active' : 'inactive'}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: 'Internship',
      resourceId: id
    });

    res.json({
      message: 'Internship status updated successfully'
    });
  } catch (error) {
    console.error('Update internship status error:', error);
    res.status(500).json({ error: 'Failed to update internship status' });
  }
});

// Delete internship
router.delete('/internships/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await Internship.findById(id);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    await Internship.findByIdAndDelete(id);

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Admin',
      action: 'delete_internship',
      details: `Deleted internship: ${internship.title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: 'Internship',
      resourceId: id
    });

    res.json({
      message: 'Internship deleted successfully'
    });
  } catch (error) {
    console.error('Delete internship error:', error);
    res.status(500).json({ error: 'Failed to delete internship' });
  }
});



module.exports = router;
