const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const natural = require('natural');
const fs = require('fs');
const path = require('path');

class AIAnalyzer {
  constructor() {
    // Initialize NLP tools
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    
    // Common technical skills database
    this.technicalSkills = [
      // Web Development
      'javascript', 'js', 'typescript', 'html', 'html5', 'css', 'css3', 'sass', 'scss', 'less',
      'react', 'reactjs', 'react.js', 'angular', 'angularjs', 'vue', 'vuejs', 'vue.js', 'svelte',
      'nodejs', 'node.js', 'express', 'expressjs', 'express.js', 'nextjs', 'next.js', 'nuxt',
      'redux', 'mobx', 'vuex', 'jquery', 'bootstrap', 'tailwind', 'material-ui', 'mui',
      'webpack', 'vite', 'babel', 'gulp', 'grunt', 'npm', 'yarn', 'pnpm',
      
      // Backend & Languages
      'python', 'java', 'c++', 'cpp', 'c#', 'csharp', 'php', 'ruby', 'go', 'golang', 'rust', 'swift', 'kotlin',
      'django', 'flask', 'fastapi', 'spring', 'springboot', 'spring boot', 'laravel', 'rails',
      
      // Databases
      'mongodb', 'mongoose', 'mysql', 'postgresql', 'postgres', 'sqlite', 'redis', 'elasticsearch',
      'sql', 'nosql', 'database', 'db', 'firebase', 'supabase',
      
      // Cloud & DevOps
      'aws', 'amazon web services', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
      'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'bitbucket', 'terraform', 'ansible',
      
      // Mobile Development
      'mobile development', 'ios', 'android', 'flutter', 'react native', 'xamarin', 'ionic',
      
      // Data & AI
      'machine learning', 'ml', 'ai', 'artificial intelligence', 'data science', 'analytics', 'statistics',
      'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'pandas', 'numpy', 'jupyter',
      
      // Other Tech
      'blockchain', 'cryptocurrency', 'web3', 'solidity', 'ethereum',
      'cybersecurity', 'penetration testing', 'ethical hacking', 'security',
      'rest api', 'restful', 'graphql', 'api', 'microservices',
      
      // Design & Tools
      'ui/ux', 'ui', 'ux', 'figma', 'adobe', 'photoshop', 'illustrator', 'xd', 'sketch',
      
      // Soft Skills
      'project management', 'agile', 'scrum', 'kanban', 'jira',
      'communication', 'leadership', 'teamwork', 'problem solving'
    ];
    
    // Education keywords
    this.educationKeywords = [
      'bachelor', 'master', 'phd', 'degree', 'diploma', 'certificate',
      'university', 'college', 'institute', 'school', 'academy',
      'computer science', 'engineering', 'information technology',
      'business', 'management', 'economics', 'mathematics', 'statistics'
    ];
    
    // Branch mapping
    this.branchMapping = {
      'computer science': ['cs', 'computer science', 'cse', 'computer engineering'],
      'information technology': ['it', 'information technology', 'information systems'],
      'electronics': ['ece', 'electronics', 'electrical', 'electronics and communication'],
      'mechanical': ['me', 'mechanical', 'mechanical engineering'],
      'civil': ['ce', 'civil', 'civil engineering'],
      'business': ['bba', 'mba', 'business', 'management', 'commerce'],
      'data science': ['data science', 'analytics', 'statistics', 'mathematics']
    };
  }

  async analyzeResume(filePath, fileType) {
    try {
      let text = '';
      
      if (fileType === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        text = data.text;
      } else if (fileType === 'docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        text = result.value;
      } else if (fileType === 'txt') {
        text = fs.readFileSync(filePath, 'utf8');
      } else {
        throw new Error('Unsupported file type');
      }

      const analysis = {
        skills: this.extractSkills(text),
        education: this.extractEducation(text),
        branch: this.extractBranch(text),
        experience: this.extractExperience(text),
        keywords: this.extractKeywords(text),
        confidence: this.calculateConfidence(text)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw new Error('Failed to analyze resume');
    }
  }

  extractSkills(text) {
    const lowerText = text.toLowerCase();
    const foundSkills = new Set(); // Use Set to avoid duplicates
    
    // Direct skill matching with better normalization
    this.technicalSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      // Use word boundaries to avoid partial matches like "go" in "going"
      const regex = new RegExp(`\\b${skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(lowerText)) {
        // Normalize skill name (use common variant)
        const normalizedSkill = this.normalizeSkillName(skill);
        foundSkills.add(normalizedSkill);
      }
    });
    
    // Pattern-based skill extraction (more specific patterns)
    const skillPatterns = [
      /(?:proficient in|experienced with|skilled in|expertise in|knowledge of)\s+([^.,\n]+)/gi,
      /(?:technologies?|tech stack|tools?|languages?|frameworks?):\s*([^.,\n]+)/gi,
      /(?:programming languages?|coding languages?):\s*([^.,\n]+)/gi,
      /(?:familiar with|worked with|used)\s+([^.,\n]+)/gi
    ];
    
    skillPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const skillText = match[1];
        // Split by common separators
        const skills = skillText.split(/[,;|/]/).map(s => s.trim());
        skills.forEach(skill => {
          // Clean up the skill name
          const cleaned = skill.replace(/[^a-zA-Z0-9\s+#.]/g, '').trim();
          if (cleaned.length > 1 && cleaned.length < 50) {
            const normalizedSkill = this.normalizeSkillName(cleaned);
            foundSkills.add(normalizedSkill);
          }
        });
      }
    });
    
    return Array.from(foundSkills); // Convert Set back to Array
  }
  
  normalizeSkillName(skill) {
    const skillLower = skill.toLowerCase().trim();
    
    // Normalize common variations
    const normalizationMap = {
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'react.js': 'React',
      'reactjs': 'React',
      'node.js': 'Node.js',
      'nodejs': 'Node.js',
      'express.js': 'Express',
      'expressjs': 'Express',
      'vue.js': 'Vue',
      'vuejs': 'Vue',
      'angular.js': 'Angular',
      'angularjs': 'Angular',
      'typescript': 'TypeScript',
      'html5': 'HTML5',
      'css3': 'CSS3',
      'mongodb': 'MongoDB',
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'python': 'Python',
      'java': 'Java',
      'c++': 'C++',
      'cpp': 'C++',
      'c#': 'C#',
      'csharp': 'C#',
      'sql': 'SQL',
      'rest api': 'REST API',
      'restful': 'RESTful API',
      'graphql': 'GraphQL',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'k8s': 'Kubernetes',
      'aws': 'AWS',
      'git': 'Git',
      'github': 'GitHub'
    };
    
    return normalizationMap[skillLower] || skill.charAt(0).toUpperCase() + skill.slice(1);
  }

  extractEducation(text) {
    const lowerText = text.toLowerCase();
    const education = {
      degree: '',
      field: '',
      institution: '',
      year: ''
    };
    
    // Extract degree
    const degreePatterns = [
      /(bachelor|master|phd|diploma|certificate)/gi,
      /(b\.?s\.?|m\.?s\.?|ph\.?d\.?|b\.?tech|m\.?tech)/gi
    ];
    
    degreePatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        education.degree = match[0];
      }
    });
    
    // Extract field of study
    this.educationKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        education.field = keyword;
      }
    });
    
    // Extract year
    const yearMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4}|\d{2})/);
    if (yearMatch) {
      education.year = yearMatch[0];
    }
    
    return education;
  }

  extractBranch(text) {
    const lowerText = text.toLowerCase();
    
    for (const [branch, keywords] of Object.entries(this.branchMapping)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return branch;
        }
      }
    }
    
    return 'computer science'; // Default fallback
  }

  extractExperience(text) {
    const experience = {
      years: 0,
      positions: [],
      companies: []
    };
    
    // Extract years of experience
    const yearPatterns = [
      /(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/gi,
      /(?:experience|exp):\s*(\d+)\s*(?:years?|yrs?)/gi
    ];
    
    yearPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        experience.years = parseInt(match[1]) || 0;
      }
    });
    
    // Extract job positions
    const positionPatterns = [
      /(?:worked as|position|role):\s*([^.,\n]+)/gi,
      /(?:intern|internship|trainee|developer|engineer|analyst)/gi
    ];
    
    positionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        experience.positions.push(...matches);
      }
    });
    
    return experience;
  }

  extractKeywords(text) {
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    const stopWords = natural.stopwords;
    
    // Remove stop words and short words
    const filteredTokens = tokens.filter(token => 
      token.length > 3 && 
      !stopWords.includes(token) &&
      !/^\d+$/.test(token) // Remove pure numbers
    );
    
    // Get word frequency
    const wordFreq = {};
    filteredTokens.forEach(token => {
      const stemmed = this.stemmer.stem(token);
      wordFreq[stemmed] = (wordFreq[stemmed] || 0) + 1;
    });
    
    // Sort by frequency and return top keywords
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }

  calculateConfidence(text) {
    let confidence = 0;
    const textLength = text.length;
    
    // Length factor (longer resumes are usually more detailed)
    if (textLength > 1000) confidence += 20;
    else if (textLength > 500) confidence += 10;
    
    // Skills factor
    const skills = this.extractSkills(text);
    if (skills.length > 5) confidence += 30;
    else if (skills.length > 2) confidence += 20;
    else if (skills.length > 0) confidence += 10;
    
    // Education factor
    const education = this.extractEducation(text);
    if (education.degree && education.field) confidence += 25;
    else if (education.degree || education.field) confidence += 15;
    
    // Experience factor
    const experience = this.extractExperience(text);
    if (experience.years > 0) confidence += 15;
    if (experience.positions.length > 0) confidence += 10;
    
    return Math.min(confidence, 100);
  }

  // Method to analyze multiple files (resume + certificates)
  async analyzeMultipleFiles(files) {
    const results = {
      combinedSkills: new Set(),
      combinedEducation: {},
      combinedExperience: { years: 0, positions: [], companies: [] },
      confidence: 0,
      fileCount: files.length
    };
    
    for (const file of files) {
      try {
        const analysis = await this.analyzeResume(file.path, file.type);
        
        // Combine skills
        analysis.skills.forEach(skill => results.combinedSkills.add(skill));
        
        // Combine education (take the most complete one)
        if (analysis.education.degree && !results.combinedEducation.degree) {
          results.combinedEducation = analysis.education;
        }
        
        // Combine experience
        results.combinedExperience.years = Math.max(
          results.combinedExperience.years, 
          analysis.experience.years
        );
        results.combinedExperience.positions.push(...analysis.experience.positions);
        
        // Average confidence
        results.confidence += analysis.confidence;
      } catch (error) {
        console.error(`Error analyzing file ${file.name}:`, error);
      }
    }
    
    results.combinedSkills = Array.from(results.combinedSkills);
    results.confidence = Math.round(results.confidence / files.length);
    
    return results;
  }
}

module.exports = new AIAnalyzer();
