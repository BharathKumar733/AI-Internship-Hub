const Internship = require('../models/Internship');
const Company = require('../models/Company');

class RecommendationEngine {
  constructor() {
    // Improve recommendation accuracy:
    // Increase weight for skill matches and CGPA slightly
    this.weights = {
      skills: 0.50,      // Increased from 0.45 to 0.50 for stronger skill matching
      cgpa: 0.25,        // Increased from 0.20 to 0.25 for stronger CGPA matching
      branch: 0.10,      // Decreased from 0.15 to 0.10
      interests: 0.10,   // 10% weight for interests
      location: 0.05     // Decreased from 0.10 to 0.05
    };
    
    // Minimum thresholds for recommendations
    this.minSkillsMatch = 0.30; // Increased from 0.25 to 0.30
    this.minOverallScore = 0.45; // Increased from 0.40 to 0.45
  }

  async recommendInternships(student, limit = 10) {
    try {
      // Filter out inactive or expired internships strictly
      const internships = await Internship.find({ 
        isActive: true,
        applicationDeadline: { $gt: new Date() },
        startDate: { $gt: new Date() } // Ensure internships haven't started yet
      }).populate('company', 'name location industry');

      if (!internships.length) {
        return [];
      }

      // Calculate match scores for each internship
      const scoredInternships = internships.map(internship => {
        const skillsScore = this.calculateSkillsMatch(student.skills, internship.requiredSkills);
        const matchScore = this.calculateMatchScore(student, internship);
        const canApply = internship.canStudentApply(student);
        
        return {
          ...internship.toObject(),
          matchScore,
          skillsScore, // Track individual skills score
          canApply,
          matchPercentage: Math.round(matchScore * 100) // Ensure match percentage calculation is accurate (round to nearest integer)
        };
      });

      // Filter out internships below minimum thresholds
      const recommendations = scoredInternships
        .filter(internship => 
          internship.canApply && 
          internship.skillsScore >= this.minSkillsMatch && // Must have minimum skills match
          internship.matchScore >= this.minOverallScore    // Must have minimum overall score
        )
        // Add randomization to ranking as per requirements
        .sort((a, b) => (b.matchScore - a.matchScore) + (Math.random() * 0.01))
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Error in recommendation engine:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  calculateMatchScore(student, internship) {
    let totalScore = 0;
    let totalWeight = 0;

    // Skills matching (50% weight)
    const skillsScore = this.calculateSkillsMatch(student.skills, internship.requiredSkills);
    totalScore += skillsScore * this.weights.skills;
    totalWeight += this.weights.skills;

    // CGPA matching (25% weight)
    const cgpaScore = this.calculateCGPAMatch(student.cgpa, internship.minCGPA);
    totalScore += cgpaScore * this.weights.cgpa;
    totalWeight += this.weights.cgpa;

    // Branch matching (10% weight)
    const branchScore = this.calculateBranchMatch(student.branch, internship.branchPreference);
    totalScore += branchScore * this.weights.branch;
    totalWeight += this.weights.branch;

    // Interests matching (10% weight)
    const interestsScore = this.calculateInterestsMatch(student.interests, internship);
    totalScore += interestsScore * this.weights.interests;
    totalWeight += this.weights.interests;

    // Location matching (5% weight)
    const locationScore = this.calculateLocationMatch(student, internship);
    totalScore += locationScore * this.weights.location;
    totalWeight += this.weights.location;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  calculateSkillsMatch(studentSkills, requiredSkills) {
    if (!requiredSkills || requiredSkills.length === 0) {
      return 0.3; // Give low score if no skills specified (not full score)
    }

    if (!studentSkills || studentSkills.length === 0) {
      return 0; // If student has no skills, no match
    }

    const studentSkillsLower = studentSkills.map(skill => skill.toLowerCase());
    const requiredSkillsLower = requiredSkills.map(skill => skill.toLowerCase());

    let matches = 0;
    let partialMatches = 0;

    requiredSkillsLower.forEach(requiredSkill => {
      // Exact match
      if (studentSkillsLower.includes(requiredSkill)) {
        matches++;
      } else {
        // Add better partial skill matching (substring match with >3 chars)
        // Must be at least 4 characters to avoid false matches
        const hasPartialMatch = studentSkillsLower.some(studentSkill => {
          if (studentSkill.length < 4 || requiredSkill.length < 4) return false;
          // Check for substring match in either direction
          return studentSkill.includes(requiredSkill) || requiredSkill.includes(studentSkill);
        });
        if (hasPartialMatch) {
          partialMatches++;
        }
      }
    });

    // Calculate score: exact matches get full points, partial matches get 50% points (enhanced from 40%)
    const exactMatchScore = matches / requiredSkills.length;
    // Make partial skill match slightly stronger as per requirements
    const partialMatchScore = (partialMatches * 0.5) / requiredSkills.length;
    
    return Math.min(exactMatchScore + partialMatchScore, 1);
  }

  calculateCGPAMatch(studentCGPA, minCGPA) {
    if (!minCGPA || minCGPA === 0) {
      return 1; // If no minimum CGPA required, give full score
    }

    if (studentCGPA >= minCGPA) {
      // Bonus for exceeding minimum CGPA
      const excess = studentCGPA - minCGPA;
      return Math.min(1 + (excess * 0.1), 1.5); // Cap at 1.5 for very high CGPA
    }

    return 0; // Below minimum CGPA
  }

  calculateBranchMatch(studentBranch, branchPreferences) {
    if (!branchPreferences || branchPreferences.length === 0) {
      return 1; // If no branch preference, give full score
    }

    const studentBranchLower = studentBranch.toLowerCase();
    const branchPreferencesLower = branchPreferences.map(branch => branch.toLowerCase());

    // Exact match
    if (branchPreferencesLower.includes(studentBranchLower)) {
      return 1;
    }

    // Partial match (branch contains preference or vice versa)
    const hasPartialMatch = branchPreferencesLower.some(preference => 
      studentBranchLower.includes(preference) || preference.includes(studentBranchLower)
    );

    return hasPartialMatch ? 0.7 : 0;
  }

  calculateInterestsMatch(studentInterests, internship) {
    if (!studentInterests || studentInterests.length === 0) {
      return 0; // No score if no interests specified (was 0.5 - too generous)
    }

    // Extract keywords from internship title, description, and skills
    const internshipText = `${internship.title} ${internship.description} ${internship.requiredSkills.join(' ')}`.toLowerCase();
    const internshipKeywords = internshipText.split(/\s+/).filter(word => word.length > 2);

    let matches = 0;
    let partialMatches = 0;
    
    studentInterests.forEach(interest => {
      const interestLower = interest.toLowerCase();
      const interestWords = interestLower.split(/\s+/);
      
      // Check for exact phrase match
      if (internshipText.includes(interestLower)) {
        matches += 1;
      } else {
        // Check for partial matches (individual words, must be 3+ chars)
        let wordMatches = 0;
        interestWords.forEach(word => {
          if (word.length > 2 && internshipKeywords.some(keyword => 
            keyword.includes(word) || word.includes(keyword)
          )) {
            wordMatches++;
          }
        });
        if (wordMatches > 0) {
          partialMatches += wordMatches / interestWords.length;
        }
      }
    });

    // Calculate score: full points for exact matches, 30% points for partial
    const totalScore = (matches + (partialMatches * 0.3)) / studentInterests.length;
    return Math.min(totalScore, 1);
  }

  calculateLocationMatch(student, internship) {
    // For now, return neutral score since we don't have student location preference
    // This can be enhanced later with student location preferences
    return 0.5;
  }

  // Get personalized recommendations based on student's application history
  async getPersonalizedRecommendations(student, limit = 10) {
    try {
      // Get student's application history
      const studentApplications = await Internship.find({
        'applications.student': student._id
      }).select('_id title companyName');

      const appliedInternshipIds = studentApplications.map(app => app._id);

      // Get recommendations excluding already applied internships
      const allRecommendations = await this.recommendInternships(student, limit * 2);
      
      const personalizedRecommendations = allRecommendations.filter(
        internship => !appliedInternshipIds.includes(internship._id)
      ).slice(0, limit);

      return personalizedRecommendations;
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Get trending internships (most applications in last 7 days)
  async getTrendingInternships(limit = 5) {
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
          $limit: limit
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
        }
      ]);

      return trendingInternships;
    } catch (error) {
      console.error('Error getting trending internships:', error);
      return [];
    }
  }

  // Search internships with filters
  async searchInternships(filters, page = 1, limit = 10) {
    try {
      const query = { isActive: true };
      
      // Apply filters
      if (filters.title) {
        query.$or = [
          { title: { $regex: filters.title, $options: 'i' } },
          { description: { $regex: filters.title, $options: 'i' } }
        ];
      }

      if (filters.skills && filters.skills.length > 0) {
        query.requiredSkills = { $in: filters.skills };
      }

      if (filters.branch && filters.branch.length > 0) {
        query.branchPreference = { $in: filters.branch };
      }

      if (filters.minCGPA) {
        query.minCGPA = { $lte: filters.minCGPA };
      }

      if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
      }

      if (filters.mode) {
        query.mode = filters.mode;
      }

      const skip = (page - 1) * limit;
      
      const internships = await Internship.find(query)
        .populate('company', 'name location industry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Internship.countDocuments(query);

      return {
        internships,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error searching internships:', error);
      throw new Error('Failed to search internships');
    }
  }
}

module.exports = new RecommendationEngine();