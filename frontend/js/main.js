// Main JavaScript for the application
class InternshipApp {
    constructor() {
        // Use localhost when running locally, otherwise use the Render backend
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiBase = isLocal ? 'http://localhost:3000/api' : 'https://ai-internship-hub-backend.onrender.com/api';
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInternships();
        this.setupSmoothScrolling();
        this.setupMobileMenu();
    }

    setupEventListeners() {
        // Navigation scroll effect
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Form submissions
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        });
    }

    handleScroll() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    }

    setupSmoothScrolling() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    }

    async loadInternships() {
        try {
            const response = await fetch(`${this.apiBase}/internships/public?limit=6`);
            const data = await response.json();
            
            if (data.internships) {
                this.displayInternships(data.internships);
            }
        } catch (error) {
            console.error('Error loading internships:', error);
            this.showError('Failed to load internships');
        }
    }

    displayInternships(internships) {
        const grid = document.getElementById('internshipsGrid');
        if (!grid) return;

        if (internships.length === 0) {
            grid.innerHTML = `
                <div class="no-internships">
                    <i class="fas fa-search"></i>
                    <h3>No internships found</h3>
                    <p>Check back later for new opportunities!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = internships.map(internship => `
            <div class="internship-card">
                <div class="internship-header">
                    <div>
                        <h3 class="internship-title">${internship.title}</h3>
                        <p class="internship-company">${internship.companyName}</p>
                    </div>
                    <div class="internship-type">
                        <span class="type-badge ${internship.mode}">${internship.mode}</span>
                    </div>
                </div>
                
                <div class="internship-meta">
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${internship.location}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${internship.duration}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatDate(internship.startDate)}</span>
                    </div>
                </div>
                
                <div class="internship-description">
                    ${this.truncateText(internship.description, 120)}
                </div>
                
                <div class="internship-footer">
                    <div class="internship-stipend">${this.convertToINR(internship.stipend)}</div>
                    <div class="internship-deadline">
                        <i class="fas fa-calendar-alt"></i>
                        Apply by ${this.formatDate(internship.applicationDeadline)}
                    </div>
                </div>
                
                <div class="internship-actions">
                    <a href="login.html" class="btn btn-outline">
                        <i class="fas fa-eye"></i>
                        View Details
                    </a>
                    <a href="login.html" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i>
                        Apply Now
                    </a>
                </div>
            </div>
        `).join('');
    }

    convertToINR(stipend) {
        if (!stipend || typeof stipend !== 'string') return '₹0/month';
        
        // Extract amount and currency
        const usdMatch = stipend.match(/\$([\d,]+)/i);
        if (usdMatch) {
            const usdAmount = parseFloat(usdMatch[1].replace(/,/g, ''));
            const inrAmount = Math.round(usdAmount * 83); // 1 USD = 83 INR
            // Format with Indian numbering system (commas after every 2 digits from right, then every 2)
            const formattedINR = new Intl.NumberFormat('en-IN').format(inrAmount);
            return `₹${formattedINR}/month`;
        }
        
        // If already in INR format, ensure it has /month suffix
        if (stipend.includes('₹')) {
            if (stipend.includes('/month')) {
                return stipend;
            } else {
                // Extract amount and reformat
                const inrMatch = stipend.match(/[₹$]?([\d,]+)/);
                if (inrMatch) {
                    const amount = parseFloat(inrMatch[1].replace(/,/g, ''));
                    const formattedINR = new Intl.NumberFormat('en-IN').format(amount);
                    return `₹${formattedINR}/month`;
                }
            }
        }
        
        return '₹0/month';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const formData = new FormData(form);
        
        // Handle contact form or newsletter signup
        if (form.id === 'contactForm' || form.id === 'newsletterForm') {
            this.handleContactForm(formData);
        }
    }

    async handleContactForm(formData) {
        try {
            // Simulate form submission
            this.showSuccess('Thank you for your message! We\'ll get back to you soon.');
            form.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            this.showError('Failed to submit form. Please try again.');
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
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
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Utility methods for API calls
    async apiCall(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Authentication helpers
    isLoggedIn() {
        return !!this.token && !!this.user;
    }

    getCurrentUser() {
        return this.user;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
        this.user = null;
        window.location.href = 'index.html';
    }

    // Navigation helpers
    redirectToDashboard() {
        if (this.user) {
            const role = this.user.role || 'student';
            window.location.href = `${role}.html`;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new InternshipApp();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        min-width: 300px;
        animation: slideIn 0.3s ease;
    }

    .notification-success {
        border-left: 4px solid #4ade80;
    }

    .notification-error {
        border-left: 4px solid #ef4444;
    }

    .notification-info {
        border-left: 4px solid #3b82f6;
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }

    .notification-content i {
        font-size: 1.2rem;
    }

    .notification-success .notification-content i {
        color: #4ade80;
    }

    .notification-error .notification-content i {
        color: #ef4444;
    }

    .notification-info .notification-content i {
        color: #3b82f6;
    }

    .notification-close {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s ease;
    }

    .notification-close:hover {
        background: #f3f4f6;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
