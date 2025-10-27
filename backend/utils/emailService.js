const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    console.log('Initializing EmailService');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '****' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Create transporter with Gmail or any SMTP service
    // Try multiple configuration options for better compatibility
    const emailConfig = {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Add timeout and security options for better reliability
      tls: {
        rejectUnauthorized: false
      },
      // Add timeout configuration
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,
      socketTimeout: 30000
    };
    
    // If we're in production/render environment, try alternative configuration
    if (process.env.NODE_ENV === 'production') {
      // Remove service and use direct SMTP configuration
      delete emailConfig.service;
      emailConfig.host = 'smtp.gmail.com';
      emailConfig.port = 587;
      emailConfig.secure = false; // true for 465, false for other ports
      emailConfig.requireTLS = true;
    }
    
    this.transporter = nodemailer.createTransport(emailConfig);
    
    // Verify transporter configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter configuration error:', error);
        // Try alternative configuration for Render
        if (process.env.NODE_ENV === 'production') {
          console.log('Trying alternative email configuration for production environment...');
          const alternativeConfig = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
            },
            tls: {
              rejectUnauthorized: false
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000
          };
          
          this.transporter = nodemailer.createTransport(alternativeConfig);
          
          this.transporter.verify((altError, altSuccess) => {
            if (altError) {
              console.error('❌ Alternative email transporter also failed:', altError);
              console.log('⚠️ Email service may not work in production. Consider using a dedicated email service like SendGrid.');
            } else {
              console.log('✅ Alternative email transporter is ready to send messages');
            }
          });
        }
      } else {
        console.log('✅ Email transporter is ready to send messages');
      }
    });
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP email
  async sendOTP(email, otp, name) {
    try {
      console.log('Sending OTP email to:', email);
      const mailOptions = {
        from: `"AI Internship Hub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - OTP Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Inter', Arial, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 700;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
              }
              .message {
                font-size: 16px;
                color: #666;
                line-height: 1.6;
                margin-bottom: 30px;
              }
              .otp-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
              }
              .otp-label {
                color: rgba(255, 255, 255, 0.9);
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
              }
              .otp-code {
                color: white;
                font-size: 48px;
                font-weight: 700;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .warning {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .warning p {
                margin: 0;
                color: #856404;
                font-size: 14px;
              }
              .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
              .footer a {
                color: #667eea;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 AI Internship Hub</h1>
              </div>
              <div class="content">
                <p class="greeting">Hello ${name || 'User'}!</p>
                <p class="message">
                  Thank you for registering with AI Internship Hub. To complete your registration, 
                  please verify your email address using the OTP code below:
                </p>
                
                <div class="otp-box">
                  <div class="otp-label">Your OTP Code</div>
                  <div class="otp-code">${otp}</div>
                </div>
                
                <p class="message">
                  Enter this code on the verification page to activate your account. 
                  This code will expire in <strong>10 minutes</strong>.
                </p>
                
                <div class="warning">
                  <p>
                    <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. 
                    Our team will never ask for your OTP via email or phone.
                  </p>
                </div>
                
                <p class="message">
                  If you didn't request this code, please ignore this email or contact our support team.
                </p>
              </div>
              <div class="footer">
                <p>Need help? Contact us at <a href="mailto:support@internshiphub.com">support@internshiphub.com</a></p>
                <p style="margin-top: 10px; color: #999; font-size: 12px;">
                  © 2024 AI Internship Hub. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending OTP email:', error);
      // Log additional error details for debugging
      console.error('Error code:', error.code);
      console.error('Error command:', error.command);
      
      // Instead of throwing an error, we'll return false to indicate failure
      return false;
    }
  }

  // Send welcome email after successful registration
  async sendWelcomeEmail(email, name, role) {
    try {
      const roleDisplay = role === 'student' ? 'Student' : 'Company';
      
      const mailOptions = {
        from: `"AI Internship Hub" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Welcome to AI Internship Hub! 🎉`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body {
                font-family: 'Inter', Arial, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 15px;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
              }
              .header h1 {
                margin: 0 0 10px 0;
                font-size: 32px;
              }
              .content {
                padding: 40px 30px;
              }
              .welcome-badge {
                background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
                color: white;
                padding: 10px 20px;
                border-radius: 20px;
                display: inline-block;
                font-weight: 600;
                margin-bottom: 20px;
              }
              .feature {
                display: flex;
                align-items: start;
                margin: 20px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 10px;
              }
              .feature-icon {
                font-size: 24px;
                margin-right: 15px;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px 30px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome Aboard!</h1>
                <p style="margin: 0; opacity: 0.9;">Your journey to the perfect internship starts here</p>
              </div>
              <div class="content">
                <div class="welcome-badge">✨ ${roleDisplay} Account Activated</div>
                
                <p style="font-size: 18px; color: #333;">Hello ${name}!</p>
                
                <p style="color: #666; line-height: 1.6;">
                  Congratulations! Your account has been successfully created and verified. 
                  You're now part of the AI Internship Hub community.
                </p>
                
                <h3 style="color: #333; margin-top: 30px;">What's Next?</h3>
                
                ${role === 'student' ? `
                  <div class="feature">
                    <div class="feature-icon">📄</div>
                    <div>
                      <strong>Upload Your Resume</strong>
                      <p style="margin: 5px 0 0 0; color: #666;">Our AI will analyze your skills and provide personalized recommendations</p>
                    </div>
                  </div>
                  
                  <div class="feature">
                    <div class="feature-icon">🎯</div>
                    <div>
                      <strong>Get Recommendations</strong>
                      <p style="margin: 5px 0 0 0; color: #666;">Browse AI-powered internship matches based on your profile</p>
                    </div>
                  </div>
                  
                  <div class="feature">
                    <div class="feature-icon">📧</div>
                    <div>
                      <strong>Apply with One Click</strong>
                      <p style="margin: 5px 0 0 0; color: #666;">Send applications instantly and track your progress</p>
                    </div>
                  </div>
                ` : `
                  <div class="feature">
                    <div class="feature-icon">💼</div>
                    <div>
                      <strong>Post Internships</strong>
                      <p style="margin: 5px 0 0 0; color: #666;">Create internship listings and reach qualified candidates</p>
                    </div>
                  </div>
                  
                  <div class="feature">
                    <div class="feature-icon">👥</div>
                    <div>
                      <strong>Find Talent</strong>
                      <p style="margin: 5px 0 0 0; color: #666;">Search and filter students by skills, CGPA, and branch</p>
                    </div>
                  </div>
                  
                  <div class="feature">
                    <div class="feature-icon">📊</div>
                    <div>
                      <strong>Manage Applications</strong>
                      <p style="margin: 5px 0 0 0; color: #666;">Review applications and manage your hiring pipeline</p>
                    </div>
                  </div>
                `}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="http://localhost:3000/login.html" class="cta-button">
                    🚀 Get Started
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; margin-top: 30px;">
                  Need help? Reply to this email or visit our help center.
                </p>
              </div>
              <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
                <p style="margin: 0;">© 2024 AI Internship Hub. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to:', email);
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      // Don't throw error, welcome email is not critical
    }
  }
}

module.exports = new EmailService();