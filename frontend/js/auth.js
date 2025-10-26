// Authentication JavaScript
class AuthManager {
    constructor() {
        this.apiBase = 'https://ai-internship-hub-backend.onrender.com/api';
        this.currentTab = 'student';
        this.init();
    }

    init() {
        console.log('Initializing AuthManager');
        this.setupTabSwitching();
        this.setupFormHandlers();
        this.setupPasswordToggles();
        this.setupValidation();
    }

    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.auth-form');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;
                console.log('Switching to tab:', tab);
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active form
                forms.forEach(form => form.classList.remove('active'));
                document.getElementById(`${tab}Form`).classList.add('active');
                
                this.currentTab = tab;
            });
        });
    }

    setupFormHandlers() {
        const forms = document.querySelectorAll('.auth-form');
        console.log('Setting up form handlers for', forms.length, 'forms');
        
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                console.log('Form submit event triggered for:', form.id);
                e.preventDefault();
                e.stopPropagation(); // Prevent event bubbling
                this.handleFormSubmit(form);
            });
        });
        
        // Add explicit click handlers for submit buttons
        const submitButtons = document.querySelectorAll('.auth-form .btn-primary');
        console.log('Setting up click handlers for', submitButtons.length, 'submit buttons');
        submitButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('Submit button clicked');
                e.preventDefault();
                e.stopPropagation();
                // Use button.closest instead of e.target.closest to ensure we get the button's parent form
                const form = button.closest('form');
                if (form) {
                    console.log('Found form for submission:', form.id);
                    this.handleFormSubmit(form);
                } else {
                    console.log('No form found for submission');
                }
            });
        });
    }

    setupPasswordToggles() {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.parentElement.querySelector('input');
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }

    setupValidation() {
        // Real-time validation
        const inputs = document.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });

        // Password confirmation validation
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            if (input.name === 'confirmPassword') {
                input.addEventListener('input', () => {
                    this.validatePasswordConfirmation(input);
                });
            }
        });
        
        // Terms checkbox validation
        const termsCheckboxes = document.querySelectorAll('input[name="terms"]');
        termsCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // Remove error styling when checkbox is checked
                if (checkbox.checked) {
                    const termsLabel = checkbox.closest('.checkbox');
                    if (termsLabel) {
                        termsLabel.style.border = '';
                        termsLabel.style.borderRadius = '';
                        termsLabel.style.padding = '';
                        
                        const existingError = termsLabel.querySelector('.terms-error');
                        if (existingError) existingError.remove();
                    }
                }
            });
        });
    }

    validateField(input) {
        console.log('Validating field:', input.name, 'Value:', input.value);
        const value = input.value.trim();
        const fieldName = input.name;
        let isValid = true;
        let message = '';

        // Remove existing error styling
        input.classList.remove('error');
        this.removeFieldError(input);

        if (!value) {
            isValid = false;
            message = `${this.getFieldLabel(input)} is required`;
        } else {
            switch (fieldName) {
                case 'email':
                    if (!this.isValidEmail(value)) {
                        isValid = false;
                        message = 'Please enter a valid email address';
                    }
                    break;
                case 'password':
                    if (value.length < 6) {
                        isValid = false;
                        message = 'Password must be at least 6 characters';
                    }
                    break;
                case 'name':
                    if (value.length < 2) {
                        isValid = false;
                        message = 'Name must be at least 2 characters';
                    }
                    break;
                case 'cgpa':
                    const cgpa = parseFloat(value);
                    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
                        isValid = false;
                        message = 'CGPA must be between 0 and 10';
                    }
                    break;
            }
        }

        if (!isValid) {
            console.log('Field validation failed:', message);
            this.showFieldError(input, message);
        } else {
            console.log('Field validation passed');
        }

        return isValid;
    }

    validatePasswordConfirmation(confirmInput) {
        const passwordInput = confirmInput.form.querySelector('input[name="password"]');
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        // Remove existing error styling
        confirmInput.classList.remove('error');
        this.removeFieldError(confirmInput);

        if (confirmPassword && password !== confirmPassword) {
            this.showFieldError(confirmInput, 'Passwords do not match');
            return false;
        }

        return true;
    }

    validateForm(form) {
        console.log('Validating form:', form.id);
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isValid = true;

        inputs.forEach(input => {
            console.log('Validating input:', input.name, input.value);
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        // Special validation for password confirmation
        const confirmPasswordInput = form.querySelector('input[name="confirmPassword"]');
        if (confirmPasswordInput && !this.validatePasswordConfirmation(confirmPasswordInput)) {
            isValid = false;
        }

        // Special validation for terms checkbox
        const termsCheckbox = form.querySelector('input[name="terms"]');
        if (termsCheckbox) {
            console.log('Validating terms checkbox:', termsCheckbox.checked);
            if (!termsCheckbox.checked) {
                isValid = false;
                console.log('Terms checkbox not checked - form invalid');
                // Show error for terms
                const termsLabel = termsCheckbox.closest('.checkbox');
                if (termsLabel) {
                    termsLabel.style.border = '1px solid #ef4444';
                    termsLabel.style.borderRadius = '4px';
                    termsLabel.style.padding = '5px';
                    
                    // Remove existing error
                    const existingError = termsLabel.querySelector('.terms-error');
                    if (existingError) existingError.remove();
                    
                    // Add error message
                    const errorElement = document.createElement('div');
                    errorElement.className = 'terms-error';
                    errorElement.textContent = 'You must agree to the terms and conditions';
                    errorElement.style.color = '#ef4444';
                    errorElement.style.fontSize = '0.875rem';
                    errorElement.style.marginTop = '0.5rem';
                    termsLabel.appendChild(errorElement);
                }
            } else {
                console.log('Terms checkbox checked - form valid');
                // Remove error styling if checkbox is checked
                const termsLabel = termsCheckbox.closest('.checkbox');
                if (termsLabel) {
                    termsLabel.style.border = '';
                    termsLabel.style.borderRadius = '';
                    termsLabel.style.padding = '';
                    
                    const existingError = termsLabel.querySelector('.terms-error');
                    if (existingError) existingError.remove();
                }
            }
        }

        console.log('Form validation result:', isValid);
        return isValid;
    }

    async handleFormSubmit(form) {
        console.log('Handling form submission for:', form.id);
        // Ensure form is valid before proceeding
        if (!this.validateForm(form)) {
            console.log('Form validation failed');
            this.showError('Please fix the errors above');
            return;
        }
        
        console.log('Form validation passed, proceeding with submission');

        this.showLoading();

        try {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log('Form data:', data);
            
            // Log all form data for debugging
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }
            
            let endpoint = '';
            // More reliable way to check if we're on login or register page
            const isLoginPage = window.location.pathname.includes('login');
            const isRegisterPage = window.location.pathname.includes('register');
            
            if (form.id === 'studentForm') {
                if (isLoginPage) {
                    endpoint = '/auth/login/student';
                } else {
                    // For registration, first send OTP
                    console.log('Sending OTP for student registration');
                    await this.sendOTP('student', data);
                    return;
                }
            } else if (form.id === 'companyForm') {
                if (isLoginPage) {
                    endpoint = '/auth/login/company';
                } else {
                    // For registration, first send OTP
                    console.log('Sending OTP for company registration');
                    await this.sendOTP('company', data);
                    return;
                }
            } else if (form.id === 'adminForm') {
                endpoint = '/auth/login/admin';
            } else if (form.id.includes('Form')) {
                const role = form.id.replace('Form', '');
                // Use more explicit check for registration vs login
                if (isLoginPage) {
                    endpoint = `/auth/login/${role}`;
                } else {
                    endpoint = `/auth/register/${role}`;
                }
            }

            // For login or direct registration
            console.log('Sending request to:', endpoint);
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            console.log('Response:', result);

            if (response.ok) {
                // Check if "Remember me" is checked
                const rememberCheckbox = form.querySelector('input[name="remember"]');
                const rememberMe = rememberCheckbox && rememberCheckbox.checked;
                
                // Store token and user data
                if (rememberMe) {
                    // Store in localStorage for persistent login
                    localStorage.setItem('token', result.token);
                    localStorage.setItem('user', JSON.stringify(result.user));
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    // Store in sessionStorage for session-only login
                    sessionStorage.setItem('token', result.token);
                    sessionStorage.setItem('user', JSON.stringify(result.user));
                    localStorage.removeItem('rememberMe'); // Remove rememberMe flag if it exists
                }
                
                this.showSuccess('Login successful! Redirecting...');
                
                // Redirect after delay
                setTimeout(() => {
                    const role = result.user.role || 'student';
                    if (role === 'company') {
                        window.location.href = 'company.html';
                    } else if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'student.html';
                    }
                }, 2000);
            } else {
                this.hideLoading();
                this.showError(result.error || 'Something went wrong');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.hideLoading();
            this.showError('Network error. Please try again.');
        }
    }

    // New method to handle OTP flow for registration
    async sendOTP(role, userData) {
        try {
            console.log('Sending OTP for', role, 'with data:', userData);
            const endpoint = `/auth/register/${role}/send-otp`;
            
            // Log the full URL we're sending to
            console.log('Sending request to:', `${this.apiBase}${endpoint}`);
            
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            console.log('OTP send response status:', response.status);
            
            // Handle case where response is not JSON
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                console.error('Error parsing JSON response:', jsonError);
                result = { error: 'Server error: Invalid response format' };
            }
            
            console.log('OTP send response body:', result);

            if (response.ok) {
                // Show OTP modal
                this.showOTPModal(role, userData.email);
            } else {
                this.hideLoading();
                this.showError(result.error || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            this.hideLoading();
            this.showError('Network error. Please check your connection and try again. Error: ' + error.message);
        }
    }

    showOTPModal(role, email) {
        this.hideLoading();
        
        // Remove any existing modal
        const existingModal = document.getElementById('otpModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create OTP modal
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.id = 'otpModal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <i class="fas fa-shield-alt success-icon"></i>
                    <h3>Verify Your Email</h3>
                </div>
                <div class="modal-body">
                    <p>We've sent a 6-digit OTP to <strong>${email}</strong>. Please enter it below to complete your registration.</p>
                    <div class="form-group">
                        <input type="text" id="otpInput" placeholder="Enter 6-digit OTP" maxlength="6" style="width: 100%; padding: 1rem; font-size: 1.2rem; text-align: center;">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="cancelOTP">Cancel</button>
                    <button class="btn btn-primary" id="verifyOTP">Verify OTP</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        const verifyBtn = document.getElementById('verifyOTP');
        const cancelBtn = document.getElementById('cancelOTP');
        const otpInput = document.getElementById('otpInput');
        
        if (verifyBtn) {
            verifyBtn.addEventListener('click', () => {
                this.verifyOTP(role, email);
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        if (otpInput) {
            // Also allow Enter key to submit
            otpInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.verifyOTP(role, email);
                }
            });
            
            // Focus on the OTP input field
            otpInput.focus();
        }
    }

    async verifyOTP(role, email) {
        const otpInput = document.getElementById('otpInput');
        const otp = otpInput.value.trim();
        
        if (!otp || otp.length !== 6) {
            this.showError('Please enter a valid 6-digit OTP');
            return;
        }
        
        this.showLoading();
        
        try {
            const endpoint = `/auth/register/${role}/verify-otp`;
            
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });

            const result = await response.json();

            if (response.ok) {
                // Hide modal
                const modal = document.getElementById('otpModal');
                if (modal) {
                    modal.remove();
                }
                
                // Store token and user data
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                this.showSuccess('Registration successful! Welcome to AI Internship Hub.');
                
                // Redirect after delay
                setTimeout(() => {
                    const role = result.user.role || 'student';
                    if (role === 'company') {
                        window.location.href = 'company.html';
                    } else {
                        window.location.href = 'student.html';
                    }
                }, 2000);
            } else {
                this.hideLoading();
                this.showError(result.error || 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            this.hideLoading();
            this.showError('Network error. Please try again.');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    getFieldLabel(input) {
        const label = input.closest('.form-group').querySelector('label');
        return label ? label.textContent : input.name;
    }

    showFieldError(input, message) {
        input.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        // Find the closest container (either form-group or form-options)
        const container = input.closest('.form-group, .form-options');
        if (container) {
            container.appendChild(errorElement);
        } else {
            // Fallback: append to the input's parent
            input.parentElement.appendChild(errorElement);
        }
    }

    removeFieldError(input) {
        // Find the closest container (either form-group or form-options)
        const container = input.closest('.form-group, .form-options');
        if (container) {
            const existingError = container.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
        }
    }

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
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Global functions for modal handling
function closeModal(modalId) {
    // Deprecated - using notifications now
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Add notification styles
const fieldErrorStyles = `
    .field-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .field-error::before {
        content: "⚠";
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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

    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .loading-spinner {
        background: white;
        padding: 2rem 3rem;
        border-radius: 10px;
        text-align: center;
    }

    .loading-spinner i {
        font-size: 2rem;
        color: #667eea;
        margin-bottom: 1rem;
    }

    /* Modal Styles */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .modal.show {
        display: flex;
    }

    .modal-content {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
        margin-bottom: 1rem;
    }

    .modal-header i {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .success-icon {
        color: #4ade80;
    }

    .error-icon {
        color: #ef4444;
    }

    .modal-header h3 {
        color: #333;
        margin-bottom: 0.5rem;
    }

    .modal-body p {
        color: #666;
        margin-bottom: 1rem;
    }

    .modal-footer {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = fieldErrorStyles;
document.head.appendChild(styleSheet);