// Dashboard JavaScript
class DashboardManager {
    constructor() {
        this.apiBase = 'https://ai-internship-hub-backend.onrender.com/api';
        // Check both localStorage and sessionStorage for token and user data
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userStorage = localStorage.getItem('user') || sessionStorage.getItem('user');
        this.user = userStorage ? JSON.parse(userStorage) : null;
        this.currentSection = 'dashboard';
        this.socket = null;
        this.init();
    }

    init() {
        if (!this.token || !this.user) {
            window.location.href = 'login.html';
            return;
        }

        this.setupSocketIO();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupNavigation();
        this.setupProfileTabs();
        
        // Handle initial hash in URL
        const hash = window.location.hash.substring(1);
        if (hash && ['dashboard', 'recommendations', 'applications', 'profile'].includes(hash)) {
            this.showSection(hash);
        } else {
            this.showSection('dashboard');
        }
    }

    setupSocketIO() {
        // Initialize Socket.IO connection - Fix to connect to backend server
        if (typeof io !== 'undefined') {
            // Connect to the backend server where Socket.IO is running
            this.socket = io('https://ai-internship-hub-backend.onrender.com');
            
            this.socket.on('connect', () => {
                console.log('🔌 Connected to real-time server');
                
                // Join appropriate room based on user type
                if (this.user.role === 'student') {
                    this.socket.emit('join', {
                        userType: 'student',
                        studentId: this.user.id
                    });
                }
            });
            
            // Listen for application status updates
            this.socket.on('applicationStatusUpdate', (data) => {
                console.log('📬 Application status update:', data);
                this.showSuccess(`🎉 ${data.message}!`);
                
                // Refresh applications list
                if (this.currentSection === 'applications' || this.currentSection === 'dashboard') {
                    this.loadApplications();
                    this.loadDashboardData();
                }
            });
            
            this.socket.on('disconnect', () => {
                console.log('🔌 Disconnected from real-time server');
            });
        }
    }

    setupEventListeners() {
        // Navigation clicks
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                
                // Scroll to top FIRST, then switch section
                window.scrollTo({ top: 0, behavior: 'instant' });
                
                // Small delay to ensure scroll completes
                setTimeout(() => {
                    this.showSection(section);
                }, 10);
            });
        });

        // User menu
        const userButton = document.querySelector('.user-button');
        const userDropdown = document.querySelector('.user-dropdown');
        
        if (userButton && userDropdown) {
            userButton.addEventListener('click', () => {
                userDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('show');
                }
            });
        }

        // Profile form submissions
        const personalForm = document.getElementById('personalForm');
        const preferencesForm = document.getElementById('preferencesForm');
        
        if (personalForm) {
            personalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile(personalForm);
            });
        }

        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updatePreferences(preferencesForm);
            });
        }

        // Resume upload
        this.setupResumeUpload();
    }

    setupNavigation() {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${this.currentSection}`) {
                link.classList.add('active');
            }
        });
        
        // Update URL hash
        if (this.currentSection && this.currentSection !== 'dashboard') {
            history.pushState(null, null, `#${this.currentSection}`);
        } else {
            history.pushState(null, null, window.location.pathname);
        }
    }

    setupProfileTabs() {
        const profileTabs = document.querySelectorAll('.profile-tab');
        const tabPanes = document.querySelectorAll('.tab-pane');

        profileTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                
                // Update active tab
                profileTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active pane
                tabPanes.forEach(pane => pane.classList.remove('active'));
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }

    setupResumeUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const modalUploadArea = document.getElementById('modalUploadArea');
        const resumeFile = document.getElementById('resumeFile');
        const modalResumeFile = document.getElementById('modalResumeFile');

        if (uploadArea && resumeFile) {
            uploadArea.addEventListener('click', () => resumeFile.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#667eea';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#e1e5e9';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#e1e5e9';
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleResumeUpload(files[0]);
                }
            });
        }

        if (modalUploadArea && modalResumeFile) {
            modalUploadArea.addEventListener('click', () => modalResumeFile.click());
        }

        if (resumeFile) {
            resumeFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleResumeUpload(e.target.files[0]);
                }
            });
        }

        if (modalResumeFile) {
            modalResumeFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleResumeUpload(e.target.files[0]);
                }
            });
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section, .recommendations-section, .applications-section, .profile-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
            this.setupNavigation();

            // Load section-specific data
            switch (sectionName) {
                case 'dashboard':
                    this.loadDashboardData();
                    break;
                case 'recommendations':
                    this.loadRecommendations();
                    break;
                case 'applications':
                    this.loadApplications();
                    break;
                case 'profile':
                    this.loadProfile();
                    break;
            }
        }
    }

    async loadDashboardData() {
        try {
            // Bind this context explicitly
            const showLoading = this.showLoading.bind(this);
            const hideLoading = this.hideLoading.bind(this);
            const showError = this.showError.bind(this);
            
            showLoading();
            
            // Load user stats
            const [profileResponse, applicationsResponse] = await Promise.all([
                fetch(`${this.apiBase}/student/profile`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }),
                fetch(`${this.apiBase}/student/applications`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
            ]);

            // Check if responses are OK
            if (!profileResponse.ok) {
                throw new Error(`Profile fetch failed: ${profileResponse.status}`);
            }
            if (!applicationsResponse.ok) {
                console.warn('Applications fetch failed:', applicationsResponse.status);
                // Continue with empty applications
            }

            const profile = await profileResponse.json();
            const applicationsData = applicationsResponse.ok ? await applicationsResponse.json() : { applications: [] };

            // Safely access student data
            const student = profile.student || profile;
            const applications = applicationsData.applications || [];

            // Update user info with safe fallbacks
            const studentName = student.name || 'Student';
            const studentNameEl = document.getElementById('studentName');
            const userNameEl = document.getElementById('userName');
            
            if (studentNameEl) studentNameEl.textContent = studentName;
            if (userNameEl) userNameEl.textContent = studentName;

            // Update stats with safe defaults
            const totalApplications = applications.length;
            const pendingApplications = applications.filter(app => app.status === 'pending').length;
            const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
            const avgMatchScore = 85; // This would be calculated from recommendations

            const totalAppsEl = document.getElementById('totalApplications');
            const pendingAppsEl = document.getElementById('pendingApplications');
            const acceptedAppsEl = document.getElementById('acceptedApplications');
            const matchScoreEl = document.getElementById('matchScore');

            if (totalAppsEl) totalAppsEl.textContent = totalApplications;
            if (pendingAppsEl) pendingAppsEl.textContent = pendingApplications;
            if (acceptedAppsEl) acceptedAppsEl.textContent = acceptedApplications;
            if (matchScoreEl) matchScoreEl.textContent = `${avgMatchScore}%`;

            // Load recent activity
            this.loadRecentActivity(applications);

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            // Bind this context explicitly
            const showError = this.showError.bind(this);
            showError('Failed to load dashboard data. Please try refreshing the page.');
        } finally {
            // Bind this context explicitly
            const hideLoading = this.hideLoading.bind(this);
            hideLoading();
        }
    }

    loadRecentActivity(applications) {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;

        // Ensure applications is an array
        const apps = Array.isArray(applications) ? applications : [];
        const recentApplications = apps.slice(0, 5);
        
        if (recentApplications.length === 0) {
            activityList.innerHTML = `
                <div class="no-activity">
                    <i class="fas fa-inbox"></i>
                    <h3>No recent activity</h3>
                    <p>Start by uploading your resume or applying to internships!</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = recentApplications.map(app => {
            // Safe access to nested properties
            const title = app.internship?.title || 'Internship';
            const companyName = app.internship?.companyName || 'Company';
            const status = app.status || 'pending';
            const appliedAt = app.appliedAt || new Date();
            
            return `
                <div class="activity-item">
                    <div class="activity-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="activity-content">
                        <h4>Applied to ${title}</h4>
                        <p>${companyName} • ${status}</p>
                    </div>
                    <div class="activity-time">
                        ${this.formatDate(appliedAt)}
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadRecommendations() {
        try {
            // Bind this context explicitly
            const showLoading = this.showLoading.bind(this);
            const hideLoading = this.hideLoading.bind(this);
            const showError = this.showError.bind(this);
            
            showLoading();
            
            const response = await fetch(`${this.apiBase}/student/recommendations`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error(`Recommendations fetch failed: ${response.status}`);
            }
            
            const data = await response.json();
            const recommendations = data.recommendations || [];
            this.displayRecommendations(recommendations);

        } catch (error) {
            console.error('Error loading recommendations:', error);
            // Bind this context explicitly
            const showError = this.showError.bind(this);
            showError('Failed to load recommendations. Please upload your resume first.');
            // Show empty state
            this.displayRecommendations([]);
        } finally {
            // Bind this context explicitly
            const hideLoading = this.hideLoading.bind(this);
            hideLoading();
        }
    }

    displayRecommendations(recommendations) {
        const grid = document.getElementById('recommendationsGrid');
        if (!grid) return;

        // Ensure recommendations is an array
        const recs = Array.isArray(recommendations) ? recommendations : [];

        if (recs.length === 0) {
            grid.innerHTML = `
                <div class="no-recommendations">
                    <i class="fas fa-lightbulb"></i>
                    <h3>No recommendations yet</h3>
                    <p>Upload your resume to get personalized internship recommendations!</p>
                    <button class="btn btn-primary" onclick="uploadResume()">
                        <i class="fas fa-upload"></i>
                        Upload Resume
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = recs.map(internship => {
            // Safe access to properties with defaults
            const title = internship.title || 'Internship';
            const companyName = internship.companyName || 'Company';
            const matchPercentage = internship.matchPercentage || 0;
            const location = internship.location || 'Not specified';
            const duration = internship.duration || 'Not specified';
            const startDate = internship.startDate || new Date();
            const requiredSkills = internship.requiredSkills || [];
            const description = internship.description || 'No description available';
            const stipend = internship.stipend || 'Not specified';
            const id = internship._id || '';

            return `
                <div class="recommendation-card">
                    <div class="recommendation-header">
                        <div>
                            <h3 class="recommendation-title">${title}</h3>
                            <p class="recommendation-company">${companyName}</p>
                        </div>
                        <div class="match-score" title="Based on your resume skills and interests">
                            ${matchPercentage}% Match
                        </div>
                    </div>
                    
                    <div class="recommendation-meta">
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${location}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>${duration}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(startDate)}</span>
                        </div>
                    </div>
                    
                    ${requiredSkills.length > 0 ? `
                        <div class="required-skills" style="margin: 0.5rem 0; padding: 0.5rem; background: #f0f7ff; border-radius: 5px; border-left: 3px solid #667eea;">
                            <strong style="color: #667eea;"><i class="fas fa-code"></i> Required Skills:</strong>
                            <div style="margin-top: 0.25rem;">
                                ${requiredSkills.slice(0, 5).map(skill => 
                                    `<span style="display: inline-block; background: white; padding: 0.2rem 0.5rem; margin: 0.2rem; border-radius: 3px; font-size: 0.85rem; border: 1px solid #667eea;">${skill}</span>`
                                ).join('')}
                                ${requiredSkills.length > 5 ? `<span style="color: #666;">+${requiredSkills.length - 5} more</span>` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="recommendation-description">
                        ${this.truncateText(description, 150)}
                    </div>
                    
                    <div class="recommendation-footer">
                        <div class="recommendation-stipend">${this.convertToINR(stipend)}</div>
                        <div class="recommendation-actions">
                            <button class="btn btn-outline btn-sm" onclick="viewInternship('${id}')">
                                <i class="fas fa-eye"></i>
                                View
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="applyToInternship('${id}')">
                                <i class="fas fa-paper-plane"></i>
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadApplications() {
        try {
            // Bind this context explicitly
            const showLoading = this.showLoading.bind(this);
            const hideLoading = this.hideLoading.bind(this);
            const showError = this.showError.bind(this);
            
            showLoading();
            const response = await fetch(`${this.apiBase}/student/applications`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                this.displayApplications(result.applications);
            } else {
                showError('Failed to load applications');
            }
        } catch (error) {
            console.error('Load applications error:', error);
            // Bind this context explicitly
            const showError = this.showError.bind(this);
            showError('Network error. Please try again.');
        } finally {
            // Bind this context explicitly
            const hideLoading = this.hideLoading.bind(this);
            hideLoading();
        }
    }

    displayApplications(applications) {
        const container = document.getElementById('applicationsList');
        if (!container) return;

        // Ensure applications is an array
        const apps = Array.isArray(applications) ? applications : [];

        if (apps.length === 0) {
            container.innerHTML = `
                <div class="no-applications">
                    <i class="fas fa-file-alt"></i>
                    <h3>No applications yet</h3>
                    <p>Start applying to internships to see them here!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = apps.map(app => {
            // Safe access to nested properties
            const title = app.internship?.title || 'Internship';
            const companyName = app.internship?.companyName || 'Company';
            const status = app.status || 'pending';
            const appliedAt = app.appliedAt || new Date();
            
            // Status badge styling
            const statusClass = status === 'accepted' ? 'accepted' : 
                              status === 'rejected' ? 'rejected' : 'pending';
            
            return `
                <div class="application-card">
                    <div class="application-header">
                        <div>
                            <h3 class="application-title">${title}</h3>
                            <p class="application-company">${companyName}</p>
                        </div>
                        <span class="application-status ${statusClass}">${status}</span>
                    </div>
                    
                    <div class="application-meta">
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>Applied: ${this.formatDate(appliedAt)}</span>
                        </div>
                    </div>
                    
                    <div class="application-footer">
                        <div class="application-date">
                            <i class="fas fa-clock"></i>
                            <span>${this.timeAgo(appliedAt)}</span>
                        </div>
                        <div class="application-actions">
                            <button class="btn btn-outline btn-sm" onclick="viewApplication('${app._id}')">
                                <i class="fas fa-eye"></i>
                                View
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utility function to format dates
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Utility function to show time ago
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        
        return Math.floor(seconds) + ' seconds ago';
    }

    // Utility function to truncate text
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Utility function to convert currency to INR format
    convertToINR(amount) {
        if (!amount) return 'Not specified';
        
        // If it's already in INR format with /month, return as is
        if (typeof amount === 'string' && amount.includes('₹') && amount.includes('/month')) {
            return amount;
        }
        
        // If it's a string with ₹ but no /month, add it
        if (typeof amount === 'string' && amount.includes('₹') && !amount.includes('/month')) {
            // Extract amount and reformat
            const inrMatch = amount.match(/[₹$]?([\d,]+)/);
            if (inrMatch) {
                const amt = parseFloat(inrMatch[1].replace(/,/g, ''));
                const formattedINR = new Intl.NumberFormat('en-IN').format(amt);
                return `₹${formattedINR}/month`;
            }
        }
        
        // If it's a string with $, convert to INR
        if (typeof amount === 'string' && amount.includes('$')) {
            const usdMatch = amount.match(/\$([\d,]+)/i);
            if (usdMatch) {
                const usdAmount = parseFloat(usdMatch[1].replace(/,/g, ''));
                const inrAmount = Math.round(usdAmount * 83); // 1 USD = 83 INR
                const formattedINR = new Intl.NumberFormat('en-IN').format(inrAmount);
                return `₹${formattedINR}/month`;
            }
        }
        
        // If it's a number or numeric string, format it as INR
        const num = parseFloat(amount);
        if (!isNaN(num)) {
            const formattedINR = new Intl.NumberFormat('en-IN').format(num);
            return `₹${formattedINR}/month`;
        }
        
        return 'Not specified';
    }

    // Utility functions for loading overlay
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Utility functions for notifications
    showSuccess(message) {
        this.hideLoading();
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.hideLoading();
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // View internship details
    async viewInternship(internshipId) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBase}/student/recommendations`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch internship details');
            }
            
            const data = await response.json();
            const recommendations = data.recommendations || [];
            const internship = recommendations.find(rec => rec._id === internshipId);
            
            if (!internship) {
                throw new Error('Internship not found');
            }
            
            this.showInternshipDetails(internship);
        } catch (error) {
            console.error('Error viewing internship:', error);
            this.showError('Failed to load internship details');
        } finally {
            this.hideLoading();
        }
    }

    // Show internship details in modal
    showInternshipDetails(internship) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay-modal';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 10000; overflow-y: auto; display: flex; align-items: center; justify-content: center;';
        
        // Create modal content
        const detailsHTML = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 650px; margin: 2rem; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">${internship.title}</h2>
                    <button class="close-btn" onclick="this.closest('.overlay-modal').remove()" style="background: none; border: none; font-size: 2rem; cursor: pointer;">&times;</button>
                </div>
                <hr style="margin: 1rem 0; border: none; border-top: 2px solid #f3f4f6;">
                
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Company</p>
                        <p style="margin: 0.25rem 0;"><strong>${internship.companyName}</strong></p>
                    </div>
                    
                    <div>
                        <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Description</p>
                        <p style="padding: 1rem; background: #f8f9fa; border-radius: 8px; line-height: 1.6;">${internship.description}</p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Location</p>
                            <p style="margin: 0.25rem 0;"><i class="fas fa-map-marker-alt" style="margin-right: 0.5rem;"></i>${internship.location}</p>
                        </div>
                        
                        <div>
                            <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Duration</p>
                            <p style="margin: 0.25rem 0;"><i class="fas fa-clock" style="margin-right: 0.5rem;"></i>${internship.duration}</p>
                        </div>
                        
                        <div>
                            <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Stipend</p>
                            <p style="margin: 0.25rem 0;"><i class="fas fa-dollar-sign" style="margin-right: 0.5rem;"></i>${internship.stipend}</p>
                        </div>
                        
                        <div>
                            <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Start Date</p>
                            <p style="margin: 0.25rem 0;"><i class="fas fa-calendar" style="margin-right: 0.5rem;"></i>${this.formatDate(internship.startDate)}</p>
                        </div>
                    </div>
                    
                    ${internship.requiredSkills && internship.requiredSkills.length > 0 ? `
                        <div>
                            <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Required Skills</p>
                            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                                ${internship.requiredSkills.map(skill => 
                                    `<span style="background: #f0f7ff; color: #667eea; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">${skill}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 2rem; display: flex; gap: 0.75rem; flex-wrap: wrap; border-top: 2px solid #f3f4f6; padding-top: 1.5rem;">
                    <button class="btn btn-primary" onclick="applyToInternship('${internship._id}'); this.closest('.overlay-modal').remove();">
                        <i class="fas fa-paper-plane"></i> Apply Now
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.overlay-modal').remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        overlay.innerHTML = detailsHTML;
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        document.body.appendChild(overlay);
    }

    // View application details
    async viewApplication(applicationId) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBase}/student/applications`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch application details');
            }
            
            const data = await response.json();
            const applications = data.applications || [];
            const application = applications.find(app => app._id === applicationId);
            
            if (!application) {
                throw new Error('Application not found');
            }
            
            this.showApplicationDetails(application);
        } catch (error) {
            console.error('Error viewing application:', error);
            this.showError('Failed to load application details');
        } finally {
            this.hideLoading();
        }
    }

    // Show application details in modal
    showApplicationDetails(application) {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.className = 'overlay-modal';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 10000; overflow-y: auto; display: flex; align-items: center; justify-content: center;';
        
        // Create modal content
        const detailsHTML = `
            <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 650px; margin: 2rem; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h2 style="margin: 0;">Application Details</h2>
                    <span class="status-badge ${application.status}" style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem;">${application.status}</span>
                </div>
                <hr style="margin: 1rem 0; border: none; border-top: 2px solid #f3f4f6;">
                
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Internship</p>
                        <p style="margin: 0.25rem 0;"><strong>${application.internship?.title || 'Internship'}</strong></p>
                        <p style="margin: 0.25rem 0;">${application.internship?.companyName || 'Company'}</p>
                    </div>
                    
                    <div>
                        <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Applied On</p>
                        <p style="margin: 0.25rem 0;"><i class="fas fa-calendar" style="margin-right: 0.5rem;"></i>${this.formatDate(application.appliedAt)}</p>
                    </div>
                    
                    ${application.coverLetter ? `
                        <div>
                            <p style="color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">Cover Letter</p>
                            <p style="padding: 1rem; background: #f8f9fa; border-radius: 8px; line-height: 1.6;">${application.coverLetter}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 2rem; display: flex; gap: 0.75rem; flex-wrap: wrap; border-top: 2px solid #f3f4f6; padding-top: 1.5rem;">
                    <button class="btn btn-outline" onclick="this.closest('.overlay-modal').remove()">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
            </div>
        `;
        
        overlay.innerHTML = detailsHTML;
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        document.body.appendChild(overlay);
    }

    // Apply to internship
    async applyToInternship(internshipId) {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBase}/student/apply/${internshipId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({})
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Application submitted successfully!');
                // Refresh applications list
                if (this.currentSection === 'applications') {
                    this.loadApplications();
                }
                // Refresh dashboard stats
                if (this.currentSection === 'dashboard') {
                    this.loadDashboardData();
                }
            } else {
                this.showError(result.error || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Apply error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Upload resume
    async uploadResume() {
        try {
            const resumeFile = document.getElementById('resumeFile');
            if (!resumeFile) {
                this.showError('Resume upload element not found');
                return;
            }
            
            resumeFile.click();
        } catch (error) {
            console.error('Upload resume error:', error);
            this.showError('Failed to initiate resume upload');
        }
    }

    // Download resume
    async downloadResume() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBase}/student/profile`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            
            const data = await response.json();
            const student = data.student || data;
            
            if (!student.resumePath) {
                this.showError('No resume found');
                return;
            }
            
            // Create download link
            const downloadUrl = `${this.apiBase}/student/download-resume?token=${encodeURIComponent(this.token)}`;
            window.open(downloadUrl, '_blank');
        } catch (error) {
            console.error('Download resume error:', error);
            this.showError('Failed to download resume');
        } finally {
            this.hideLoading();
        }
    }

    // Handle resume upload
    async handleResumeUpload(file) {
        try {
            this.showLoading();
            
            const formData = new FormData();
            formData.append('resume', file);
            
            const response = await fetch(`${this.apiBase}/student/upload-resume`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Resume uploaded and analyzed successfully!');
                // Refresh profile
                this.loadProfile();
                // Refresh recommendations
                if (this.currentSection === 'recommendations') {
                    this.loadRecommendations();
                }
            } else {
                this.showError(result.error || 'Failed to upload resume');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Update profile
    async updateProfile(form) {
        try {
            this.showLoading();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            const response = await fetch(`${this.apiBase}/student/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Profile updated successfully!');
                // Update local user data
                if (result.student) {
                    this.user = result.student;
                    localStorage.setItem('user', JSON.stringify(this.user));
                    // Store studentId in localStorage for recommendations
                    if (result.student._id) {
                        localStorage.setItem('studentId', result.student._id);
                    }
                }
                // Update UI
                const studentName = result.student?.name || 'Student';
                const studentNameEl = document.getElementById('studentName');
                const userNameEl = document.getElementById('userName');
                if (studentNameEl) studentNameEl.textContent = studentName;
                if (userNameEl) userNameEl.textContent = studentName;
                
                // Refresh recommendations after profile update
                refreshRecommendations();
            } else {
                this.showError(result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Update preferences
    async updatePreferences(form) {
        try {
            this.showLoading();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Convert interests to array if present
            if (data.interests) {
                data.interests = data.interests.split(',').map(i => i.trim()).filter(i => i);
            }
            
            const response = await fetch(`${this.apiBase}/student/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showSuccess('Preferences updated successfully!');
                // Update local user data
                if (result.student) {
                    this.user = result.student;
                    localStorage.setItem('user', JSON.stringify(this.user));
                }
            } else {
                this.showError(result.error || 'Failed to update preferences');
            }
        } catch (error) {
            console.error('Update preferences error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Load profile
    async loadProfile() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.apiBase}/student/profile`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch profile');
            }
            
            const data = await response.json();
            const student = data.student || data;
            
            // Update profile form fields
            const nameField = document.getElementById('name');
            const emailField = document.getElementById('email');
            const branchField = document.getElementById('branch');
            const cgpaField = document.getElementById('cgpa');
            const interestsField = document.getElementById('interests');
            const preferredLocationField = document.getElementById('preferredLocation');
            const preferredDurationField = document.getElementById('preferredDuration');
            const profileNameField = document.getElementById('profileName');
            const profileEmailField = document.getElementById('profileEmail');
            const profileCGPAField = document.getElementById('profileCGPA');
            const profileBranchField = document.getElementById('profileBranch');
            const skillsList = document.getElementById('skillsList');
            const currentResume = document.getElementById('currentResume');
            
            if (nameField) nameField.value = student.name || '';
            if (emailField) emailField.value = student.email || '';
            if (branchField) branchField.value = student.branch || '';
            if (cgpaField) cgpaField.value = student.cgpa || '';
            if (interestsField) interestsField.value = student.interests || '';
            if (preferredLocationField) preferredLocationField.value = student.preferredLocation || '';
            if (preferredDurationField) preferredDurationField.value = student.preferredDuration || '';
            if (profileNameField) profileNameField.textContent = student.name || 'Student';
            if (profileEmailField) profileEmailField.textContent = student.email || 'student@email.com';
            if (profileCGPAField) profileCGPAField.textContent = student.cgpa || 'N/A';
            if (profileBranchField) profileBranchField.textContent = student.branch || 'N/A';
            
            // Display skills
            if (skillsList) {
                if (student.skills && student.skills.length > 0) {
                    skillsList.innerHTML = student.skills.map(skill => 
                        `<span class="skill-tag">${skill}</span>`
                    ).join('');
                } else {
                    skillsList.innerHTML = '<p>No skills extracted yet. Upload your resume to get started!</p>';
                }
            }
            
            // Display resume info
            if (currentResume) {
                if (student.resumePath) {
                    currentResume.style.display = 'block';
                    const resumeInfo = currentResume.querySelector('.resume-info');
                    if (resumeInfo) {
                        resumeInfo.innerHTML = `
                            <i class="fas fa-file-pdf"></i>
                            <span>resume.pdf</span>
                            <button class="btn btn-outline btn-sm" onclick="downloadResume()">Download</button>
                        `;
                    }
                } else {
                    currentResume.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Load profile error:', error);
            this.showError('Failed to load profile');
        } finally {
            this.hideLoading();
        }
    }

    // View recommendations
    async viewRecommendations() {
        this.showSection('recommendations');
    }

    // Search internships
    async searchInternships() {
        this.showSection('recommendations');
    }

    // Update profile
    async updateProfile() {
        this.showSection('profile');
    }

    // Utility function to format dates
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    // Utility function to show time ago
    timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        
        return Math.floor(seconds) + ' seconds ago';
    }

    // Utility function to truncate text
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    }

    // Utility function to convert currency to INR format
    convertToINR(amount) {
        if (!amount) return 'Not specified';
        
        // If it's already in INR format with /month, return as is
        if (typeof amount === 'string' && amount.includes('₹') && amount.includes('/month')) {
            return amount;
        }
        
        // If it's a string with ₹ but no /month, add it
        if (typeof amount === 'string' && amount.includes('₹') && !amount.includes('/month')) {
            // Extract amount and reformat
            const inrMatch = amount.match(/[₹$]?([\d,]+)/);
            if (inrMatch) {
                const amt = parseFloat(inrMatch[1].replace(/,/g, ''));
                const formattedINR = new Intl.NumberFormat('en-IN').format(amt);
                return `₹${formattedINR}/month`;
            }
        }
        
        // If it's a string with $, convert to INR
        if (typeof amount === 'string' && amount.includes('$')) {
            const usdMatch = amount.match(/\$([\d,]+)/i);
            if (usdMatch) {
                const usdAmount = parseFloat(usdMatch[1].replace(/,/g, ''));
                const inrAmount = Math.round(usdAmount * 83); // 1 USD = 83 INR
                const formattedINR = new Intl.NumberFormat('en-IN').format(inrAmount);
                return `₹${formattedINR}/month`;
            }
        }
        
        // If it's a number or numeric string, format it as INR
        const num = parseFloat(amount);
        if (!isNaN(num)) {
            const formattedINR = new Intl.NumberFormat('en-IN').format(num);
            return `₹${formattedINR}/month`;
        }
        
        return 'Not specified';
    }

    // Utility functions for loading overlay
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Logout function
    logout() {
        // Check both localStorage and sessionStorage for token and user data (following best practices from memory)
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const userStorage = localStorage.getItem('user') || sessionStorage.getItem('user');
        
        // Remove all authentication data from both storage locations
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        
        // Redirect to index page
        window.location.href = 'index.html';
    }
}

// Global functions for HTML onclick attributes
function uploadResume() {
    if (window.dashboardManager) {
        window.dashboardManager.uploadResume();
    }
}

function downloadResume() {
    if (window.dashboardManager) {
        window.dashboardManager.downloadResume();
    }
}

function viewInternship(internshipId) {
    if (window.dashboardManager) {
        window.dashboardManager.viewInternship(internshipId);
    }
}

function viewApplication(applicationId) {
    if (window.dashboardManager) {
        window.dashboardManager.viewApplication(applicationId);
    }
}

function applyToInternship(internshipId) {
    if (window.dashboardManager) {
        window.dashboardManager.applyToInternship(internshipId);
    }
}

function viewRecommendations() {
    if (window.dashboardManager) {
        window.dashboardManager.viewRecommendations();
    }
}

function searchInternships() {
    if (window.dashboardManager) {
        window.dashboardManager.searchInternships();
    }
}

function updateProfile() {
    if (window.dashboardManager) {
        window.dashboardManager.updateProfile();
    }
}

// 2️⃣ In profile update form (updateProfile.js): Create function to handle profile updates
// Send PUT request to: https://ai-internship-hub-backend.onrender.com/api/students/${studentId}
// Include name, skills (split by commas), and interests (split by commas) in JSON body
// After success, show "Profile updated successfully!" alert
async function updateProfileForm() {
  try {
    // Get student ID from localStorage
    const studentId = localStorage.getItem('studentId');
    if (!studentId) {
      alert("Please log in again to update your profile.");
      window.location.href = "login.html";
      return;
    }

    // Get form data
    const name = document.getElementById('name').value;
    const skills = document.getElementById('skills').value;
    const interests = document.getElementById('interests').value;
    
    // Prepare data - split skills and interests by commas
    const data = {
      name: name,
      skills: skills ? skills.split(',').map(s => s.trim()).filter(s => s) : [],
      interests: interests ? interests.split(',').map(i => i.trim()).filter(i => i) : []
    };

    // Send PUT request to: https://ai-internship-hub-backend.onrender.com/api/students/${studentId}
    const response = await fetch(`https://ai-internship-hub-backend.onrender.com/api/students/${studentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      // After success, show "Profile updated successfully!" alert
      alert("Profile updated successfully!");
      // Refresh recommendations after profile update
      refreshRecommendations();
    } else {
      alert(result.message || "Failed to update profile.");
    }
  } catch (error) {
    console.error('Update profile error:', error);
    alert("Network error. Please try again.");
  }
}

// Add the refreshRecommendations function as requested
async function refreshRecommendations() {
  // 1️⃣ In frontend: Ensure refreshRecommendations() sends GET request to correct endpoint
  const studentId = localStorage.getItem('studentId') || (window.dashboardManager && window.dashboardManager.user && window.dashboardManager.user.id);
  const recommendationsContainer = document.getElementById('recommendations');
  
  // Check localStorage for studentId; if missing, redirect to login
  if (!studentId) {
    console.error("Student ID not found in localStorage");
    if (recommendationsContainer) {
      recommendationsContainer.innerHTML = '<p>Please log in again to view your recommendations.</p>';
    }
    // Redirect to login page
    alert("Please log in again to view your recommendations.");
    window.location.href = "login.html";
    return;
  }

  if (recommendationsContainer) {
    recommendationsContainer.innerHTML = '<p>Fetching recommendations...</p>';
  }

  try {
    // Send GET request to: https://ai-internship-hub-backend.onrender.com/api/recommendations/${studentId}
    const response = await fetch(`https://ai-internship-hub-backend.onrender.com/api/recommendations/${studentId}`);
    if (!response.ok) throw new Error('Failed to fetch recommendations');

    const data = await response.json();

    // Render internship cards correctly if data is returned
    if (!data || data.length === 0) {
      if (recommendationsContainer) {
        recommendationsContainer.innerHTML = '<p>No suitable recommendations found. Try updating your skills or interests!</p>';
      }
      return;
    }

    if (recommendationsContainer) {
      recommendationsContainer.innerHTML = data.map(internship => `
        <div class="internship-card">
          <h3>${internship.title}</h3>
          <p><strong>Company:</strong> ${internship.company?.name || 'N/A'}</p>
          <p><strong>Match:</strong> ${internship.matchPercentage || 0}%</p>
          <p><strong>Location:</strong> ${internship.company?.location || 'N/A'}</p>
          <p><strong>Required Skills:</strong> ${internship.requiredSkills ? internship.requiredSkills.join(', ') : 'N/A'}</p>
          <p>${internship.description ? internship.description.slice(0, 120) + '...' : 'No description available'}</p>
          <button onclick="applyToInternship('${internship._id}')">Apply Now</button>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading recommendations:', err);
    if (recommendationsContainer) {
      recommendationsContainer.innerHTML = '<p>Error fetching recommendations. Please try again later.</p>';
    }
  }
}

// Add applyForInternship function
function applyForInternship(internshipId) {
  if (window.dashboardManager) {
    window.dashboardManager.applyToInternship(internshipId);
  }
}

// Global logout function to make it accessible from HTML onclick
function logout() {
    if (window.dashboardManager) {
        window.dashboardManager.logout();
    } else {
        // Fallback: remove tokens and redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    // Call refreshRecommendations when the page loads
    refreshRecommendations();
});