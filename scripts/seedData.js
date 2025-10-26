const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Student = require('../models/Student');
const Company = require('../models/Company');
const Internship = require('../models/Internship');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');

// Sample data
const sampleStudents = [
    {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        password: 'password123',
        cgpa: 8.5,
        branch: 'Computer Science',
        interests: ['Web Development', 'Machine Learning', 'Data Science'],
        skills: ['JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'Machine Learning'],
        profileCompleted: true
    },
    {
        name: 'Michael Chen',
        email: 'michael.chen@email.com',
        password: 'password123',
        cgpa: 9.2,
        branch: 'Information Technology',
        interests: ['Mobile Development', 'UI/UX Design', 'Cloud Computing'],
        skills: ['Java', 'Android', 'Kotlin', 'AWS', 'Docker', 'Kubernetes'],
        profileCompleted: true
    },
    {
        name: 'Emily Rodriguez',
        email: 'emily.rodriguez@email.com',
        password: 'password123',
        cgpa: 8.8,
        branch: 'Data Science',
        interests: ['Data Analytics', 'Business Intelligence', 'Statistics'],
        skills: ['Python', 'R', 'SQL', 'Tableau', 'Power BI', 'Statistics'],
        profileCompleted: true
    },
    {
        name: 'David Kim',
        email: 'david.kim@email.com',
        password: 'password123',
        cgpa: 7.9,
        branch: 'Electronics',
        interests: ['IoT', 'Embedded Systems', 'Hardware Design'],
        skills: ['C++', 'Arduino', 'Raspberry Pi', 'PCB Design', 'Microcontrollers'],
        profileCompleted: true
    },
    {
        name: 'Lisa Wang',
        email: 'lisa.wang@email.com',
        password: 'password123',
        cgpa: 9.0,
        branch: 'Computer Science',
        interests: ['Cybersecurity', 'Ethical Hacking', 'Network Security'],
        skills: ['Python', 'Linux', 'Network Security', 'Penetration Testing', 'Cryptography'],
        profileCompleted: true
    }
];

const sampleCompanies = [
    {
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        password: 'password123',
        description: 'Leading technology company specializing in cloud solutions and AI.',
        website: 'https://techcorp.com',
        location: 'San Francisco, CA',
        industry: 'Technology',
        companySize: 'large',
        isVerified: true
    },
    {
        name: 'DataFlow Analytics',
        email: 'careers@dataflow.com',
        password: 'password123',
        description: 'Data analytics company helping businesses make data-driven decisions.',
        website: 'https://dataflow.com',
        location: 'New York, NY',
        industry: 'Data Analytics',
        companySize: 'medium',
        isVerified: true
    },
    {
        name: 'StartupXYZ',
        email: 'team@startupxyz.com',
        password: 'password123',
        description: 'Innovative startup building the future of mobile applications.',
        website: 'https://startupxyz.com',
        location: 'Austin, TX',
        industry: 'Technology',
        companySize: 'startup',
        isVerified: false
    },
    {
        name: 'FinanceFirst',
        email: 'hr@financefirst.com',
        password: 'password123',
        description: 'Financial services company focused on digital banking solutions.',
        website: 'https://financefirst.com',
        location: 'Chicago, IL',
        industry: 'Finance',
        companySize: 'large',
        isVerified: true
    },
    {
        name: 'HealthTech Innovations',
        email: 'careers@healthtech.com',
        password: 'password123',
        description: 'Healthcare technology company developing medical software solutions.',
        website: 'https://healthtech.com',
        location: 'Boston, MA',
        industry: 'Healthcare',
        companySize: 'medium',
        isVerified: true
    }
];

const sampleInternships = [
    {
        title: 'Software Development Intern',
        description: 'Join our development team to work on cutting-edge web applications using React, Node.js, and cloud technologies. You\'ll gain hands-on experience in full-stack development and work with experienced developers.',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
        branchPreference: ['Computer Science', 'Information Technology'],
        minCGPA: 8.0,
        duration: '3 months',
        stipend: '₹2,49,000/month',
        location: 'San Francisco, CA',
        mode: 'hybrid',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        applicationDeadline: new Date('2025-11-15'),
        maxApplications: 50,
        requirements: 'Strong programming skills, familiarity with web technologies, good problem-solving abilities',
        benefits: ['Mentorship program', 'Flexible working hours', 'Learning budget', 'Team events']
    },
    {
        title: 'Data Science Intern',
        description: 'Work with our data science team to analyze large datasets and build machine learning models. You\'ll work on real-world problems and contribute to data-driven decision making.',
        requiredSkills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'],
        branchPreference: ['Data Science', 'Computer Science', 'Statistics'],
        minCGPA: 8.5,
        duration: '6 months',
        stipend: '₹2,90,500/month',
        location: 'New York, NY',
        mode: 'remote',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
        applicationDeadline: new Date('2025-12-01'),
        maxApplications: 30,
        requirements: 'Strong mathematical background, experience with data analysis tools, knowledge of ML algorithms',
        benefits: ['Access to premium datasets', 'Conference attendance', 'Research opportunities', 'Flexible schedule']
    },
    {
        title: 'Mobile App Development Intern',
        description: 'Develop mobile applications for iOS and Android platforms. You\'ll work with our mobile team to create user-friendly apps using modern development frameworks.',
        requiredSkills: ['Java', 'Kotlin', 'Swift', 'React Native', 'Mobile Development'],
        branchPreference: ['Computer Science', 'Information Technology'],
        minCGPA: 7.5,
        duration: '4 months',
        stipend: '₹2,32,400/month',
        location: 'Austin, TX',
        mode: 'onsite',
        startDate: new Date('2024-05-15'),
        endDate: new Date('2024-09-15'),
        applicationDeadline: new Date('2024-04-30'),
        maxApplications: 25,
        requirements: 'Mobile development experience, understanding of app lifecycle, UI/UX awareness',
        benefits: ['Latest devices for testing', 'App store publishing', 'Design collaboration', 'Performance optimization']
    },
    {
        title: 'Cybersecurity Intern',
        description: 'Learn about cybersecurity practices and help protect our systems from threats. You\'ll work with security experts to identify vulnerabilities and implement security measures.',
        requiredSkills: ['Python', 'Linux', 'Network Security', 'Penetration Testing', 'Cryptography'],
        branchPreference: ['Computer Science', 'Information Technology', 'Cybersecurity'],
        minCGPA: 8.0,
        duration: '5 months',
        stipend: '₹2,65,600/month',
        location: 'Boston, MA',
        mode: 'hybrid',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-11-15'),
        applicationDeadline: new Date('2025-11-30'),
        maxApplications: 20,
        requirements: 'Understanding of security concepts, programming skills, analytical thinking',
        benefits: ['Security certifications', 'Red team exercises', 'Industry conferences', 'Mentorship program']
    },
    {
        title: 'Business Analytics Intern',
        description: 'Analyze business data to provide insights and recommendations. You\'ll work with stakeholders to understand business needs and create data visualizations.',
        requiredSkills: ['SQL', 'Excel', 'Tableau', 'Power BI', 'Business Analysis'],
        branchPreference: ['Business', 'Data Science', 'Computer Science'],
        minCGPA: 7.8,
        duration: '3 months',
        stipend: '₹2,07,500/month',
        location: 'Chicago, IL',
        mode: 'remote',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-09-30'),
        applicationDeadline: new Date('2025-12-15'),
        maxApplications: 40,
        requirements: 'Strong analytical skills, business acumen, data visualization experience',
        benefits: ['Business training', 'Stakeholder interaction', 'Report creation', 'Industry insights']
    },
    {
        title: 'AI/ML Engineering Intern',
        description: 'Work on cutting-edge artificial intelligence and machine learning projects. You\'ll develop AI models, work with large datasets, and contribute to innovative AI solutions.',
        requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP'],
        branchPreference: ['Computer Science', 'Data Science', 'AI'],
        minCGPA: 8.2,
        duration: '6 months',
        stipend: '₹3,32,000/month',
        location: 'Seattle, WA',
        mode: 'hybrid',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-12-15'),
        applicationDeadline: new Date('2025-12-30'),
        maxApplications: 15,
        requirements: 'Strong mathematical background, experience with ML frameworks, research mindset',
        benefits: ['GPU access', 'Research publications', 'Conference presentations', 'Patent opportunities']
    },
    {
        title: 'DevOps Engineering Intern',
        description: 'Learn cloud infrastructure, automation, and deployment pipelines. You\'ll work with AWS, Docker, Kubernetes, and CI/CD tools to streamline development processes.',
        requiredSkills: ['AWS', 'Docker', 'Kubernetes', 'Jenkins', 'Linux', 'Python'],
        branchPreference: ['Computer Science', 'Information Technology'],
        minCGPA: 7.8,
        duration: '4 months',
        stipend: '₹2,65,600/month',
        location: 'Denver, CO',
        mode: 'remote',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-09-30'),
        applicationDeadline: new Date('2025-11-15'),
        maxApplications: 20,
        requirements: 'Cloud computing knowledge, automation skills, system administration experience',
        benefits: ['AWS certifications', 'Infrastructure projects', 'Monitoring tools', 'Scalability training']
    },
    {
        title: 'UI/UX Design Intern',
        description: 'Create beautiful and intuitive user interfaces. You\'ll work with design tools, conduct user research, and collaborate with developers to bring designs to life.',
        requiredSkills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping', 'HTML/CSS'],
        branchPreference: ['Design', 'Computer Science', 'Human-Computer Interaction'],
        minCGPA: 7.5,
        duration: '3 months',
        stipend: '₹2,15,800/month',
        location: 'Los Angeles, CA',
        mode: 'hybrid',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-10-31'),
        applicationDeadline: new Date('2024-07-15'),
        maxApplications: 25,
        requirements: 'Design portfolio, user-centered thinking, collaboration skills',
        benefits: ['Design mentorship', 'Portfolio development', 'User testing', 'Design system creation']
    },
    {
        title: 'Blockchain Development Intern',
        description: 'Explore the world of blockchain and cryptocurrency. You\'ll work on smart contracts, DeFi protocols, and learn about Web3 technologies.',
        requiredSkills: ['Solidity', 'JavaScript', 'Web3', 'Ethereum', 'Smart Contracts'],
        branchPreference: ['Computer Science', 'Cryptocurrency', 'Blockchain'],
        minCGPA: 8.0,
        duration: '5 months',
        stipend: '₹3,15,400/month',
        location: 'Miami, FL',
        mode: 'remote',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-11-30'),
        applicationDeadline: new Date('2025-12-15'),
        maxApplications: 12,
        requirements: 'Blockchain interest, programming skills, understanding of cryptography',
        benefits: ['Crypto projects', 'DeFi protocols', 'NFT development', 'Web3 community']
    },
    {
        title: 'Product Management Intern',
        description: 'Learn product strategy, user research, and feature prioritization. You\'ll work with cross-functional teams to define product requirements and roadmap.',
        requiredSkills: ['Product Strategy', 'User Research', 'Analytics', 'Communication', 'Leadership'],
        branchPreference: ['Business', 'Computer Science', 'Product Management'],
        minCGPA: 8.0,
        duration: '6 months',
        stipend: '₹2,49,000/month',
        location: 'Portland, OR',
        mode: 'hybrid',
        startDate: new Date('2024-06-15'),
        endDate: new Date('2024-12-15'),
        applicationDeadline: new Date('2025-11-30'),
        maxApplications: 18,
        requirements: 'Strategic thinking, user empathy, analytical skills, communication',
        benefits: ['Product strategy', 'Stakeholder management', 'Market research', 'Leadership development']
    },
    {
        title: 'Cloud Solutions Intern',
        description: 'Work with cloud platforms like AWS, Azure, and GCP to build scalable applications. You\'ll learn infrastructure as code and cloud architecture.',
        requiredSkills: ['AWS', 'Azure', 'Terraform', 'Python', 'Cloud Architecture'],
        branchPreference: ['Computer Science', 'Cloud Computing'],
        minCGPA: 7.8,
        duration: '4 months',
        stipend: '₹2,82,200/month',
        location: 'Phoenix, AZ',
        mode: 'remote',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-11-30'),
        applicationDeadline: new Date('2024-07-15'),
        maxApplications: 22,
        requirements: 'Cloud computing basics, infrastructure knowledge, automation skills',
        benefits: ['Cloud certifications', 'Infrastructure projects', 'Cost optimization', 'Security training']
    },
    {
        title: 'Game Development Intern',
        description: 'Create interactive games and immersive experiences. You\'ll work with Unity, Unreal Engine, and game design principles to build engaging games.',
        requiredSkills: ['Unity', 'C#', 'Game Design', '3D Modeling', 'Animation'],
        branchPreference: ['Game Development', 'Computer Science', 'Digital Arts'],
        minCGPA: 7.5,
        duration: '5 months',
        stipend: '₹2,40,700/month',
        location: 'Orlando, FL',
        mode: 'onsite',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-11-30'),
        applicationDeadline: new Date('2025-12-15'),
        maxApplications: 15,
        requirements: 'Game development experience, creativity, programming skills',
        benefits: ['Game engine access', 'Project portfolio', 'Industry mentorship', 'Creative freedom']
    }
];

const sampleAdmin = {
    username: 'admin',
    email: 'admin@internshiphub.com',
    password: 'admin123',
    role: 'super_admin',
    permissions: ['manage_users', 'manage_internships', 'view_analytics', 'manage_companies'],
    isActive: true
};

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internship_recommender');
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🧹 Clearing existing data...');
        await Student.deleteMany({});
        await Company.deleteMany({});
        await Internship.deleteMany({});
        await Admin.deleteMany({});
        await ActivityLog.deleteMany({});

    // Create students
    console.log('👥 Creating students...');
    const students = [];
    for (const studentData of sampleStudents) {
      const student = new Student(studentData);
      await student.save();
      students.push(student);
    }
    console.log(`✅ Created ${students.length} students`);

        // Create companies
        console.log('🏢 Creating companies...');
        const companies = [];
        for (const companyData of sampleCompanies) {
          const company = new Company(companyData);
          await company.save();
          companies.push(company);
        }
        console.log(`✅ Created ${companies.length} companies`);

        // Create internships
        console.log('💼 Creating internships...');
        const internships = [];
        for (let i = 0; i < sampleInternships.length; i++) {
            const internshipData = {
                ...sampleInternships[i],
                company: companies[i % companies.length]._id,
                companyName: companies[i % companies.length].name
            };
            const internship = new Internship(internshipData);
            await internship.save();
            internships.push(internship);

            // Add internship to company
            await Company.findByIdAndUpdate(
                companies[i % companies.length]._id,
                { $push: { internships: internship._id } }
            );
        }
        console.log(`✅ Created ${internships.length} internships`);

        // Create admin
        console.log('👨‍💼 Creating admin...');
        const admin = new Admin(sampleAdmin);
        await admin.save();
        console.log('✅ Created admin user');

        // Create some sample applications
        console.log('📝 Creating sample applications...');
        for (let i = 0; i < 3; i++) {
            const internship = internships[i];
            const student = students[i];
            
            // Add application to internship
            internship.applications.push({
                student: student._id,
                appliedAt: new Date(),
                status: 'pending',
                coverLetter: `I am very interested in this ${internship.title} position at ${internship.companyName}. I believe my skills in ${student.skills.slice(0, 3).join(', ')} make me a great fit for this role.`
            });
            internship.currentApplications += 1;
            await internship.save();

            // Add application to student
            student.applications.push({
                internship: internship._id,
                appliedAt: new Date(),
                status: 'pending'
            });
            await student.save();
        }
        console.log('✅ Created sample applications');

        // Create some activity logs
        console.log('📊 Creating activity logs...');
        const activities = [];
        
        // Student activities
        for (const student of students) {
            activities.push({
                user: student._id,
                userModel: 'Student',
                action: 'register',
                details: 'Student registered successfully',
                timestamp: new Date()
            });
        }

        // Company activities
        for (const company of companies) {
            activities.push({
                user: company._id,
                userModel: 'Company',
                action: 'register',
                details: 'Company registered successfully',
                timestamp: new Date()
            });
        }

        // Internship activities
        for (const internship of internships) {
            activities.push({
                user: internship.company,
                userModel: 'Company',
                action: 'create_internship',
                details: `Created internship: ${internship.title}`,
                resource: 'Internship',
                resourceId: internship._id,
                timestamp: new Date()
            });
        }

        await ActivityLog.insertMany(activities);
        console.log(`✅ Created ${activities.length} activity logs`);

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📋 Sample Accounts:');
        console.log('👨‍🎓 Students:');
        students.forEach(student => {
            console.log(`   - ${student.name} (${student.email}) - Password: password123`);
        });
        console.log('\n🏢 Companies:');
        companies.forEach(company => {
            console.log(`   - ${company.name} (${company.email}) - Password: password123`);
        });
        console.log('\n👨‍💼 Admin:');
        console.log(`   - Admin (${admin.email}) - Password: admin123`);
        
        console.log('\n🚀 You can now start the server with: npm start');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📡 Disconnected from MongoDB');
    }
}

// Run the seeding
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
