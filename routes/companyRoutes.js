const express = require('express');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const Student = require('../models/Student');
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

// Get company profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({
      company: company.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update company profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, description, website, location, industry, companySize } = req.body;
    
    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Update fields
    if (name) company.name = name;
    if (description) company.description = description;
    if (website) company.website = website;
    if (location) company.location = location;
    if (industry) company.industry = industry;
    if (companySize) company.companySize = companySize;

    await company.save();

    // Log activity
    await ActivityLog.logActivity({
      user: company._id,
      userModel: 'Company',
      action: 'update_profile',
      details: 'Company profile updated',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Profile updated successfully',
      company: company.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create internship
router.post('/internships', verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      requiredSkills,
      branchPreference,
      minCGPA,
      duration,
      stipend,
      location,
      mode,
      startDate,
      endDate,
      applicationDeadline,
      maxApplications,
      requirements,
      benefits
    } = req.body;

    // Validate required fields
    if (!title || !description || !duration || !stipend || !location || !startDate || !endDate || !applicationDeadline) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadline = new Date(applicationDeadline);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || isNaN(deadline.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    if (start >= end) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    if (deadline >= start) {
      return res.status(400).json({ error: 'Application deadline must be before start date' });
    }

    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const internship = new Internship({
      title,
      company: company._id,
      companyName: company.name,
      description,
      requiredSkills: requiredSkills || [],
      branchPreference: branchPreference || [],
      minCGPA: minCGPA || 0,
      duration,
      stipend,
      location,
      mode: mode || 'onsite',
      startDate: start,
      endDate: end,
      applicationDeadline: deadline,
      maxApplications: maxApplications || 100,
      requirements,
      benefits: benefits || []
    });

    await internship.save();

    // Add to company's internships
    company.internships.push(internship._id);
    await company.save();

    // Log activity
    await ActivityLog.logActivity({
      user: company._id,
      userModel: 'Company',
      action: 'create_internship',
      details: `Created internship: ${title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: 'Internship',
      resourceId: internship._id
    });

    res.status(201).json({
      message: 'Internship created successfully',
      internship
    });
  } catch (error) {
    console.error('Create internship error:', error);
    // Send more detailed error message for debugging
    res.status(500).json({ error: 'Failed to create internship: ' + error.message });
  }
});

// Get company's internships
router.get('/internships', verifyToken, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const internships = await Internship.find({ company: company._id })
      .sort({ createdAt: -1 });

    res.json({
      internships
    });
  } catch (error) {
    console.error('Get internships error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update internship
router.put('/internships/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const internship = await Internship.findOne({ 
      _id: id, 
      company: req.user.id 
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        internship[key] = updateData[key];
      }
    });

    await internship.save();

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Company',
      action: 'update_internship',
      details: `Updated internship: ${internship.title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: 'Internship',
      resourceId: internship._id
    });

    res.json({
      message: 'Internship updated successfully',
      internship
    });
  } catch (error) {
    console.error('Update internship error:', error);
    res.status(500).json({ error: 'Failed to update internship' });
  }
});

// Delete internship
router.delete('/internships/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await Internship.findOne({ 
      _id: id, 
      company: req.user.id 
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    await Internship.findByIdAndDelete(id);

    // Remove from company's internships
    await Company.findByIdAndUpdate(req.user.id, {
      $pull: { internships: id }
    });

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Company',
      action: 'delete_internship',
      details: `Deleted internship: ${internship.title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: 'Internship',
      resourceId: internship._id
    });

    res.json({
      message: 'Internship deleted successfully'
    });
  } catch (error) {
    console.error('Delete internship error:', error);
    res.status(500).json({ error: 'Failed to delete internship' });
  }
});

// Get applications for specific internship
router.get('/internships/:id/applications', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const internship = await Internship.findOne({ 
      _id: id, 
      company: req.user.id 
    }).populate('applications.student', 'name email branch cgpa skills resumePath');

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Format applications with resume info
    const formattedApplications = internship.applications.map(app => ({
      _id: app._id,
      student: app.student,
      appliedAt: app.appliedAt,
      status: app.status,
      coverLetter: app.coverLetter,
      resumePath: app.resumePath,
      internshipId: internship._id
    }));

    res.json({
      internship: {
        title: internship.title,
        _id: internship._id,
        applications: formattedApplications
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update application status
router.put('/applications/:internshipId/:studentId', verifyToken, async (req, res) => {
  try {
    const { internshipId, studentId } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const internship = await Internship.findOne({ 
      _id: internshipId, 
      company: req.user.id 
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Update application status
    const application = internship.applications.find(app => 
      app.student.toString() === studentId
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = status;
    await internship.save();

    // Update student's application status
    await Student.updateOne(
      { 
        _id: studentId, 
        'applications.internship': internshipId 
      },
      { 
        $set: { 'applications.$.status': status } 
      }
    );

    // Emit Socket.IO event to notify student
    const io = req.app.get('io');
    if (io) {
      io.to(`student_${studentId}`).emit('applicationStatusUpdate', {
        internshipId,
        internshipTitle: internship.title,
        companyName: internship.companyName,
        status,
        message: `Your application for ${internship.title} has been ${status}`
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Company',
      action: 'update_application_status',
      details: `Updated application status to ${status}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: 'Application',
      resourceId: studentId
    });

    res.json({
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Search students
router.get('/search-students', verifyToken, async (req, res) => {
  try {
    const { 
      branch, 
      skills, 
      minCGPA, 
      maxCGPA,
      page = 1, 
      limit = 10 
    } = req.query;

    const query = {};

    if (branch) {
      query.branch = { $regex: branch, $options: 'i' };
    }

    if (skills) {
      const skillArray = skills.split(',');
      query.skills = { $in: skillArray.map(skill => new RegExp(skill, 'i')) };
    }

    if (minCGPA) {
      query.cgpa = { $gte: parseFloat(minCGPA) };
    }

    if (maxCGPA) {
      query.cgpa = { ...query.cgpa, $lte: parseFloat(maxCGPA) };
    }

    const skip = (page - 1) * limit;

    const students = await Student.find(query)
      .select('name email branch cgpa skills interests')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Student.countDocuments(query);

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Company',
      action: 'search_students',
      details: `Searched students with filters: ${JSON.stringify(query)}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      students,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

// Get company dashboard stats
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const company = await Company.findById(req.user.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const internships = await Internship.find({ company: company._id });
    
    const stats = {
      totalInternships: internships.length,
      activeInternships: internships.filter(i => i.isActive).length,
      totalApplications: internships.reduce((sum, i) => sum + i.applications.length, 0),
      pendingApplications: internships.reduce((sum, i) => 
        sum + i.applications.filter(app => app.status === 'pending').length, 0
      ),
      acceptedApplications: internships.reduce((sum, i) => 
        sum + i.applications.filter(app => app.status === 'accepted').length, 0
      )
    };

    res.json({
      stats,
      recentInternships: internships
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all applications for company
router.get('/applications', verifyToken, async (req, res) => {
  try {
    const internships = await Internship.find({ 
      company: req.user.id 
    }).populate('applications.student', 'name email branch cgpa skills resumePath');

    let allApplications = [];
    internships.forEach(internship => {
      internship.applications.forEach(app => {
        allApplications.push({
          _id: app._id,
          student: app.student,
          internship: {
            _id: internship._id,
            title: internship.title,
            companyName: internship.companyName
          },
          appliedAt: app.appliedAt,
          status: app.status,
          coverLetter: app.coverLetter,
          resumePath: app.resumePath,
          internshipId: internship._id
        });
      });
    });

    // Sort by most recent
    allApplications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

    res.json({
      applications: allApplications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download student resume
router.get('/download-resume/:internshipId/:studentId', async (req, res) => {
  try {
    const { internshipId, studentId } = req.params;
    
    // Get token from query params or header
    const token = req.query.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const internship = await Internship.findOne({ 
      _id: internshipId, 
      company: decoded.id 
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Find the application
    const application = internship.applications.find(app => 
      app.student.toString() === studentId
    );

    if (!application || !application.resumePath) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Send file
    const path = require('path');
    const fs = require('fs');
    const resumePath = path.join(__dirname, '..', application.resumePath);

    if (fs.existsSync(resumePath)) {
      res.download(resumePath);
    } else {
      res.status(404).json({ error: 'Resume file not found' });
    }
  } catch (error) {
    console.error('Download resume error:', error);
    res.status(500).json({ error: 'Failed to download resume' });
  }
});

module.exports = router;
