const fs = require('fs');
const path = require('path');

// Create .env file with your MongoDB Atlas URI
const envContent = `PORT=3000
MONGODB_URI=mongodb+srv://DP_1:DURGA%40123@all.ebnkgsw.mongodb.net/internship_recommender
JWT_SECRET=internship_hub_super_secret_jwt_key_2024_secure_and_long_enough_for_production
SESSION_SECRET=internship_hub_session_secret_key_2024
NODE_ENV=development`;

// Write .env file
fs.writeFileSync('.env', envContent);
console.log('✅ Created .env file with your MongoDB Atlas URI');

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
const resumesDir = path.join(uploadsDir, 'resumes');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

if (!fs.existsSync(resumesDir)) {
    fs.mkdirSync(resumesDir, { recursive: true });
    console.log('✅ Created uploads/resumes directory');
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Run: npm install');
console.log('2. Run: node scripts/seedData.js');
console.log('3. Run: npm start');
console.log('\n🌐 Your app will be available at: http://localhost:3000');
