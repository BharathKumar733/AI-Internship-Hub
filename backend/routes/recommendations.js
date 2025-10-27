const express = require('express');
const Student = require('../models/Student');
const recommend = require('../utils/recommend');
const router = express.Router();

// GET /api/recommendations/:studentId
// Define GET /api/recommendations/:studentId
// Use RecommendationEngine.recommendInternships(student)
// Return JSON of recommendations
// Handle errors and missing students properly
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
    
    // 3️⃣ In backend (recommendation route): Make sure it returns proper JSON array of internships
    // Return proper JSON array of internships instead of empty data
    if (!recommendations || recommendations.length === 0) {
      return res.json([]); // Return empty array instead of null/undefined
    }
    
    // Return recommendations as JSON
    res.json(recommendations);
  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;