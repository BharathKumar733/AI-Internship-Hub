const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Company = require('../models/Company');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');
const OTP = require('../models/OTP');
const emailService = require('../utils/emailService');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Send OTP for Student Registration
router.post('/register/student/send-otp', async (req, res) => {
  try {
    const { name, email, password, branch, cgpa, interests } = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student already exists with this email' });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email, role: 'student' });

    // Generate OTP
    const otp = emailService.generateOTP();

    // Store OTP and user data
    const otpDoc = new OTP({
      email: email,
      otp: otp,
      role: 'student',
      userData: {
        name: name,
        email: email,
        password: password,
        branch: branch,
        cgpa: cgpa || 0,
        interests: interests ? interests.split(',').map(i => i.trim()) : []
      }
    });

    await otpDoc.save();

    // Send OTP email
    const emailSent = await emailService.sendOTP(email, otp, name);
    
    if (!emailSent) {
      // If email failed to send, delete the OTP and return an error
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

// Verify OTP and Complete Student Registration
router.post('/register/student/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP document
    const otpDoc = await OTP.findOne({ email, role: 'student' }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    // Check if already verified
    if (otpDoc.verified) {
      return res.status(400).json({ error: 'OTP already used. Please request a new one.' });
    }

    // Increment attempts
    otpDoc.attempts += 1;
    await otpDoc.save();

    // Check max attempts
    if (otpDoc.attempts > 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpDoc.otp !== otp) {
      return res.status(400).json({ 
        error: `Invalid OTP. ${6 - otpDoc.attempts} attempts remaining.` 
      });
    }

    // OTP is correct - create student
    const { name, email: userEmail, password, branch, cgpa, interests } = otpDoc.userData;

    const student = new Student({
      name,
      email: userEmail,
      password,
      branch,
      cgpa,
      interests
    });

    await student.save();

    // Mark OTP as verified and delete
    await OTP.deleteOne({ _id: otpDoc._id });

    // Log activity
    await ActivityLog.logActivity({
      user: student._id,
      userModel: 'Student',
      action: 'register',
      details: 'Student registered successfully with OTP verification',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student._id, 
        email: student.email, 
        role: 'student' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    emailService.sendWelcomeEmail(student.email, student.name, 'student').catch(err => 
      console.error('Welcome email error:', err)
    );

    res.status(201).json({
      message: 'Student registered successfully! Welcome to AI Internship Hub.',
      token,
      user: student.getPublicProfile()
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

// Send OTP for Company Registration
router.post('/register/company/send-otp', async (req, res) => {
  try {
    const { name, email, password, description, website, location, industry, companySize } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ error: 'Company already exists with this email' });
    }

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email, role: 'company' });

    // Generate OTP
    const otp = emailService.generateOTP();

    // Store OTP and user data
    const otpDoc = new OTP({
      email: email,
      otp: otp,
      role: 'company',
      userData: {
        name: name,
        email: email,
        password: password,
        description: description || '',
        website: website || '',
        location: location || '',
        industry: industry || '',
        companySize: companySize || 'medium'
      }
    });

    await otpDoc.save();

    // Send OTP email
    const emailSent = await emailService.sendOTP(email, otp, name);
    
    if (!emailSent) {
      // If email failed to send, delete the OTP and return an error
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }

    res.status(200).json({
      message: 'OTP sent to your email. Please verify to complete registration.',
      email
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
});

// Verify OTP and Complete Company Registration
router.post('/register/company/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP document
    const otpDoc = await OTP.findOne({ email, role: 'company' }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }

    // Check if already verified
    if (otpDoc.verified) {
      return res.status(400).json({ error: 'OTP already used. Please request a new one.' });
    }

    // Increment attempts
    otpDoc.attempts += 1;
    await otpDoc.save();

    // Check max attempts
    if (otpDoc.attempts > 5) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new OTP.' });
    }

    // Verify OTP
    if (otpDoc.otp !== otp) {
      return res.status(400).json({ 
        error: `Invalid OTP. ${6 - otpDoc.attempts} attempts remaining.` 
      });
    }

    // OTP is correct - create company
    const { name, email: userEmail, password, description, website, location, industry, companySize } = otpDoc.userData;

    const company = new Company({
      name,
      email: userEmail,
      password,
      description,
      website,
      location,
      industry,
      companySize
    });

    await company.save();

    // Mark OTP as verified and delete
    await OTP.deleteOne({ _id: otpDoc._id });

    // Log activity
    await ActivityLog.logActivity({
      user: company._id,
      userModel: 'Company',
      action: 'register',
      details: 'Company registered successfully with OTP verification',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: company._id, 
        email: company.email, 
        role: 'company' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    emailService.sendWelcomeEmail(company.email, company.name, 'company').catch(err => 
      console.error('Welcome email error:', err)
    );

    res.status(201).json({
      message: 'Company registered successfully! Welcome to AI Internship Hub.',
      token,
      user: company.getPublicProfile()
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to verify OTP' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, role } = req.body;

    // Find existing OTP
    const otpDoc = await OTP.findOne({ email, role }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(400).json({ error: 'No registration found. Please start registration again.' });
    }

    // Generate new OTP
    const newOTP = emailService.generateOTP();

    // Update OTP
    otpDoc.otp = newOTP;
    otpDoc.attempts = 0;
    otpDoc.createdAt = new Date();
    await otpDoc.save();

    // Send new OTP
    await emailService.sendOTP(email, newOTP, otpDoc.userData.name);

    res.status(200).json({
      message: 'New OTP sent successfully to your email.'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// OLD Student Registration (keep for backwards compatibility, but deprecated)
router.post('/register/student', async (req, res) => {
  res.status(400).json({ 
    error: 'Please use /register/student/send-otp endpoint for registration with email verification' 
  });
});

// OLD Company Registration (keep for backwards compatibility, but deprecated)
router.post('/register/company', async (req, res) => {
  res.status(400).json({ 
    error: 'Please use /register/company/send-otp endpoint for registration with email verification' 
  });
});

// Student Login
router.post('/login/student', async (req, res) => {
  try {
    console.log('Student login attempt:', req.body);
    const { email, password } = req.body;

    // Find student
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await student.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Log activity
    await ActivityLog.logActivity({
      user: student._id,
      userModel: 'Student',
      action: 'login',
      details: 'Student logged in successfully',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: student._id, 
        email: student.email, 
        role: 'student' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = student.getPublicProfile();
    userProfile.role = 'student';
    
    res.json({
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Company Login
router.post('/login/company', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find company
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    company.lastLogin = new Date();
    await company.save();

    // Log activity
    await ActivityLog.logActivity({
      user: company._id,
      userModel: 'Company',
      action: 'login',
      details: 'Company logged in successfully',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: company._id, 
        email: company.email, 
        role: 'company' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = company.getPublicProfile();
    userProfile.role = 'company';
    
    res.json({
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Company login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Admin Login
router.post('/login/admin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Log activity
    await ActivityLog.logActivity({
      user: admin._id,
      userModel: 'Admin',
      action: 'login',
      details: 'Admin logged in successfully',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userProfile = admin.getPublicProfile();
    userProfile.role = 'admin';
    
    res.json({
      message: 'Login successful',
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const { role, id } = req.user;
    
    let user;
    if (role === 'student') {
      user = await Student.findById(id);
    } else if (role === 'company') {
      user = await Company.findById(id);
    } else if (role === 'admin') {
      user = await Admin.findById(id);
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      user: user.getPublicProfile(),
      role
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;