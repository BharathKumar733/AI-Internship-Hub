const express = require('express');
const Student = require('../models/Student');
const recommend = require('../utils/recommend');
const router = express.Router();

// GET /api/recommendations/:studentId
router.get('/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Validate student ID
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Find student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get recommendations using the recommendation engine
    const recommendations = await recommend.recommendInternships(student);
    
    // Return recommendations as JSON
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;