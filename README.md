# AI Internship Recommender System

A full-stack web application that uses AI to match students with perfect internship opportunities. Built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript.

## Features

### For Students
- AI-Powered Resume Analysis: Upload your resume and get automatic skill extraction
- Personalized Recommendations: Get internship matches based on your skills and preferences
- Easy Application Process: Apply to internships with one click
- Application Tracking: Monitor your application status in real-time
- Profile Management: Keep your information up-to-date

### For Companies
- Post Internships: Create detailed internship listings
- Student Search: Find candidates based on skills, branch, and CGPA
- Application Management: Review and manage student applications
- Analytics Dashboard: Track your internship performance

### For Admins
- User Management: Monitor students and companies
- Activity Logs: Track all platform activities
- Analytics: View comprehensive platform statistics
- Content Moderation: Manage internships and users

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **AI/ML**: Natural Language Processing with `natural` library
- **File Processing**: PDF parsing with `pdf-parse`, DOCX with `mammoth`
- **Authentication**: JWT tokens
- **Security**: Helmet, CORS, Rate limiting

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd internship-recommender
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with your configuration:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key_here
   SESSION_SECRET=your_super_secret_session_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB**
   - Local: Make sure MongoDB is running on your system
   - Atlas: Use your MongoDB Atlas connection string

5. **Seed the database with sample data**
   ```bash
   node scripts/seedData.js
   ```

6. **Start the application**
   ```bash
   npm start
   ```

7. **Access the application**
   - Open your browser and go to `http://localhost:3000`

## Project Structure

```
internship-recommender/
├── server.js                 # Main server file
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
├── public/                  # Frontend files
│   ├── index.html          # Landing page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── student.html        # Student dashboard
│   ├── company.html        # Company dashboard
│   ├── admin.html          # Admin dashboard
│   ├── css/                # Stylesheets
│   └── js/                 # JavaScript files
├── models/                 # Database models
├── routes/                 # API routes
├── utils/                  # Utility functions
├── scripts/                # Database scripts
└── uploads/                # File uploads directory
```

## API Endpoints

### Authentication
- `POST /api/auth/register/student` - Student registration
- `POST /api/auth/register/company` - Company registration
- `POST /api/auth/login/student` - Student login
- `POST /api/auth/login/company` - Company login
- `POST /api/auth/login/admin` - Admin login

### Student Routes
- `GET /api/student/profile` - Get student profile
- `PUT /api/student/profile` - Update profile
- `POST /api/student/upload-resume` - Upload and analyze resume
- `GET /api/student/recommendations` - Get AI recommendations
- `POST /api/student/apply/:id` - Apply to internship

### Company Routes
- `GET /api/company/profile` - Get company profile
- `POST /api/company/internships` - Create internship
- `GET /api/company/internships` - Get company internships
- `GET /api/company/search-students` - Search students

### Admin Routes
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/users` - Get all users
- `GET /api/admin/activity-logs` - Get activity logs

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## License

This project is licensed under the MIT License.
