document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileNavMenu = document.getElementById('mobileNavMenu');
    
    // Toggle mobile menu
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNavMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    // Close mobile menu
    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', function() {
            mobileNavMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Close mobile menu when clicking on a link
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileNavMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Password toggle functionality
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    
    if (passwordToggle && passwordInput) {
        passwordToggle.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle eye icon
            const icon = this.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }
    
    // Form validation and submission
    const loginForm = document.querySelector('form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            let isValid = true;
            
            // Basic email validation
            if (!email.value || !isValidEmail(email.value)) {
                showFieldError(email, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearFieldError(email);
            }
            
            // Basic password validation
            if (!password.value) {
                showFieldError(password, 'Please enter your password');
                isValid = false;
            } else {
                clearFieldError(password);
            }
            
            if (!isValid) {
                e.preventDefault();
                
                // Add shake animation to invalid fields
                if (!email.value || !isValidEmail(email.value)) {
                    email.parentElement.classList.add('shake-animation');
                    setTimeout(() => {
                        email.parentElement.classList.remove('shake-animation');
                    }, 500);
                }
                
                if (!password.value) {
                    password.parentElement.classList.add('shake-animation');
                    setTimeout(() => {
                        password.parentElement.classList.remove('shake-animation');
                    }, 500);
                }
            } else {
                // Show loading state
                const submitBtn = this.querySelector('.submit-btn');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner loading mr-2"></i> Signing In...';
                submitBtn.disabled = true;
                
                // Re-enable after 3 seconds (in case of error)
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }
    
    // Social login buttons
    const googleBtn = document.querySelector('.google-btn');
    const githubBtn = document.querySelector('.github-btn');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            // Simulate Google login
            showToast('Redirecting to Google authentication...', 'info');
        });
    }
    
    if (githubBtn) {
        githubBtn.addEventListener('click', function() {
            // Simulate GitHub login
            showToast('Redirecting to GitHub authentication...', 'info');
        });
    }
    
    // Forgot password link
    const forgotPasswordLink = document.querySelector('a[href="#"]');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('Password reset feature coming soon!', 'info');
        });
    }
    
    // Helper functions
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function showFieldError(field, message) {
        // Remove any existing error
        clearFieldError(field);
        
        // Add error styling
        field.style.borderColor = '#ef4444';
        field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'text-red-400 text-xs mt-1 flex items-center';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i> ${message}`;
        
        field.parentElement.appendChild(errorDiv);
    }
    
    function clearFieldError(field) {
        // Reset styling
        field.style.borderColor = '';
        field.style.boxShadow = '';
        
        // Remove error message
        const errorDiv = field.parentElement.querySelector('.text-red-400');
        if (errorDiv) {
            errorDiv.remove();
        }
    }
    
    function showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
            type === 'info' ? 'bg-blue-500' : 
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white max-w-sm`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${
                    type === 'info' ? 'fa-info-circle' : 
                    type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'
                } mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .shake-animation {
            animation: shake 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(style);
    
    // Auto-focus email field on page load
    const emailField = document.getElementById('email');
    if (emailField) {
        setTimeout(() => {
            emailField.focus();
        }, 500);
    }
});