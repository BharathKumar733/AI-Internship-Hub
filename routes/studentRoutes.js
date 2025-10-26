const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const Internship = require('../models/Internship');
const ActivityLog = require('../models/ActivityLog');
const aiAnalyzer = require('../utils/aiAnalyzer');
const recommend = require('../utils/recommend');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

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

// Get student profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      student: student.getPublicProfile()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update student profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, cgpa, branch, interests } = req.body;
    
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Update fields
    if (name) student.name = name;
    if (cgpa !== undefined) student.cgpa = cgpa;
    if (branch) student.branch = branch;
    if (interests) student.interests = interests;

    await student.save();

    // Log activity
    await ActivityLog.logActivity({
      user: student._id,
      userModel: 'Student',
      action: 'update_profile',
      details: 'Student profile updated',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      message: 'Profile updated successfully',
      student: student.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload resume and analyze
router.post('/upload-resume', verifyToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Determine file type
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileType = fileExt === '.pdf' ? 'pdf' : 'docx';

    // Analyze resume
    const analysis = await aiAnalyzer.analyzeResume(req.file.path, fileType);

    // Update student with extracted information
    student.resumePath = req.file.path;
    student.skills = analysis.skills;
    student.branch = analysis.branch || student.branch;
    student.profileCompleted = true;

    await student.save();

    // Log activity
    await ActivityLog.logActivity({
      user: student._id,
      userModel: 'Student',
      action: 'upload_resume',
      details: `Resume analyzed: ${analysis.skills.length} skills extracted`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: { skillsCount: analysis.skills.length, confidence: analysis.confidence }
    });

    res.json({
      message: 'Resume uploaded and analyzed successfully',
      analysis: {
        skills: analysis.skills,
        education: analysis.education,
        branch: analysis.branch,
        confidence: analysis.confidence
      },
      student: student.getPublicProfile()
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

// Get personalized recommendations
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const recommendations = await recommend.getPersonalizedRecommendations(student, 10);

    // Log activity
    await ActivityLog.logActivity({
      user: student._id,
      userModel: 'Student',
      action: 'view_recommendations',
      details: `Viewed ${recommendations.length} recommendations`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Apply for internship
router.post('/apply/:internshipId', verifyToken, async (req, res) => {
  try {
    const { internshipId } = req.params;
    const { coverLetter } = req.body;

    const student = await Student.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const internship = await Internship.findById(internshipId);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Check if student can apply
    if (!internship.canStudentApply(student)) {
      return res.status(400).json({ 
        error: 'Cannot apply for this internship. Check requirements or if already applied.' 
      });
    }

    // Add application to internship with resume path
    internship.applications.push({
      student: student._id,
      coverLetter: coverLetter || '',
      appliedAt: new Date(),
      status: 'pending',
      resumePath: student.resumePath || null
    });

    internship.currentApplications += 1;
    await internship.save();

    // Add to student's applications with resume snapshot
    student.applications.push({
      internship: internship._id,
      appliedAt: new Date(),
      status: 'pending',
      resumeSnapshot: student.resumePath || null
    });
    await student.save();

    // Emit Socket.IO event for real-time update to company
    const io = req.app.get('io');
    if (io) {
      // Populate student data for the notification
      const populatedInternship = await Internship.findById(internshipId)
        .populate('applications.student', 'name email branch cgpa skills resumePath');
      
      const latestApplication = populatedInternship.applications[populatedInternship.applications.length - 1];
      
      io.to(`company_${internship.company}`).emit('newApplication', {
        application: {
          _id: latestApplication._id,
          student: latestApplication.student,
          internship: {
            _id: internship._id,
            title: internship.title,
            companyName: internship.companyName
          },
          appliedAt: latestApplication.appliedAt,
          status: latestApplication.status,
          coverLetter: latestApplication.coverLetter,
          resumePath: latestApplication.resumePath,
          internshipId: internship._id
        },
        message: `New application from ${student.name} for ${internship.title}`
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      user: student._id,
      userModel: 'Student',
      action: 'apply_internship',
      details: `Applied for internship: ${internship.title}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      resource: 'Internship',
      resourceId: internship._id
    });

    res.json({
      message: 'Application submitted successfully',
      application: {
        internship: internship.title,
        company: internship.companyName,
        appliedAt: new Date(),
        status: 'pending',
        resumeAttached: !!student.resumePath
      }
    });
  } catch (error) {
    console.error('Apply internship error:', error);
    res.status(500).json({ error: 'Failed to apply for internship' });
  }
});

// Get student's applications
router.get('/applications', verifyToken, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .populate('applications.internship', 'title companyName description location stipend status');

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      applications: student.applications
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search internships
router.get('/search', verifyToken, async (req, res) => {
  try {
    const { 
      title, 
      skills, 
      branch, 
      minCGPA, 
      location, 
      mode, 
      page = 1, 
      limit = 10 
    } = req.query;

    const filters = {
      title,
      skills: skills ? skills.split(',') : undefined,
      branch: branch ? branch.split(',') : undefined,
      minCGPA: minCGPA ? parseFloat(minCGPA) : undefined,
      location,
      mode
    };

    const result = await recommend.searchInternships(filters, parseInt(page), parseInt(limit));

    // Log activity
    await ActivityLog.logActivity({
      user: req.user.id,
      userModel: 'Student',
      action: 'search_internships',
      details: `Searched with filters: ${JSON.stringify(filters)}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(result);
  } catch (error) {
    console.error('Search internships error:', error);
    res.status(500).json({ error: 'Failed to search internships' });
  }
});

// Get trending internships
router.get('/trending', verifyToken, async (req, res) => {
  try {
    const trending = await recommend.getTrendingInternships(5);

    res.json({
      trending
    });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
