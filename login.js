// login.js - Updated for OTP Authentication

// **IMPORTANT: Replace this with your actual Apps Script Web App URL**
const API_URL = 'https://script.google.com/macros/s/AKfycbwLtEPYhkoKpcWX5b-i41ZExoiydVB245-RaIOD_4L3B86HhdH3qNaFqX9IoKgWhFnsJw/exec';

let otpAttempts = 0;
const MAX_OTP_ATTEMPTS = 5;

// Check existing session on page load
async function checkExistingSession() {
    showLoading();
    
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    
    if (sessionData.email && sessionData.sessionToken && sessionData.sessionExpiry) {
        const expiryDate = new Date(sessionData.sessionExpiry);
        const now = new Date();
        
        // Check if session is still valid
        if (now < expiryDate) {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'checkSession',
                        email: sessionData.email,
                        sessionToken: sessionData.sessionToken
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    hideLoading();
                    initializeHomeScreen(result.data.businessName, result.data.city);
                    return true;
                }
            } catch (error) {
                console.error('Session check error:', error);
            }
        }
        
        // Clear expired session
        localStorage.removeItem('sessionData');
    }
    
    hideLoading();
    return false;
}

// Email login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('userId').value.trim();
    const invalidMessage = document.getElementById('invalidMessage');
    
    resetErrors();
    
    if (!email) {
        showError(document.getElementById('userId'), 'Please enter your email address');
        return;
    }
    
    // Admin bypass check
    if (email === '1231') {
        showOTPScreen(email, true);
        return;
    }
    
    // Basic email validation
    if (!isValidEmail(email) && email !== '1231') {
        showError(document.getElementById('userId'), 'Please enter a valid email address');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'generateOTP',
                email: email
            })
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            if (result.data && result.data.isAdmin) {
                // Admin - show OTP screen directly
                showOTPScreen(email, true);
            } else {
                // Regular user - OTP sent
                showOTPScreen(email, false, result.data.businessName);
                showSuccessMessage('OTP sent to your email!');
            }
        } else {
            invalidMessage.textContent = result.message;
            invalidMessage.classList.add('show');
            setTimeout(() => invalidMessage.classList.remove('show'), 5000);
        }
        
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        invalidMessage.textContent = 'Connection error. Please check your internet and try again.';
        invalidMessage.classList.add('show');
        setTimeout(() => invalidMessage.classList.remove('show'), 5000);
    }
});

// Show OTP input screen
// Show OTP input screen - UPDATED VERSION
function showOTPScreen(email, isAdmin = false, businessName = '') {
    const loginContainer = document.querySelector('.login-container');
    
    // Replace the entire login container content with OTP screen
    loginContainer.innerHTML = `
        <div class="otp-container">
            <button class="back-btn" onclick="backToLogin()">← Back</button>
            <h2>Enter OTP</h2>
            ${!isAdmin ? `<p class="otp-info">OTP sent to ${email}</p>` : `<p class="otp-info">Admin Login</p>`}
            ${!isAdmin && businessName ? `<p class="business-name">${businessName}</p>` : ''}
            
            <form id="otpForm" novalidate>
                <div class="otp-input-group">
                    <input type="text" id="otpInput" placeholder="Enter 6-digit OTP" maxlength="6" pattern="[0-9]{6}" required>
                    <span class="error-message" id="otpError"></span>
                </div>
                <div class="otp-attempts" id="otpAttempts"></div>
                <div id="otpInvalidMessage" class="invalid-message"></div>
                <button type="submit" class="login-btn">Verify OTP</button>
            </form>
            
            ${!isAdmin ? `
            <div class="resend-container">
                <button class="resend-btn" id="resendBtn" onclick="resendOTP('${email}')">
                    Resend OTP
                </button>
                <span class="resend-timer" id="resendTimer"></span>
            </div>
            ` : ''}
        </div>
    `;
    
    // Store email for verification
    window.currentLoginEmail = email;
    window.isAdminLogin = isAdmin;
    
    // Reset attempts counter
    otpAttempts = 0;
    updateAttemptsDisplay();
    
    // Start resend timer if not admin
    if (!isAdmin) {
        startResendTimer();
    }
    
    // OTP form submission
    document.getElementById('otpForm').addEventListener('submit', handleOTPSubmit);
    
    // Auto-focus OTP input
    document.getElementById('otpInput').focus();
}
// Handle OTP verification
async function handleOTPSubmit(e) {
    e.preventDefault();
    
    const otpInput = document.getElementById('otpInput');
    const otp = otpInput.value.trim();
    const otpInvalidMessage = document.getElementById('otpInvalidMessage');
    
    if (!otp || otp.length !== 6) {
        showError(otpInput, 'Please enter a 6-digit OTP');
        return;
    }
    
    if (otpAttempts >= MAX_OTP_ATTEMPTS) {
        otpInvalidMessage.innerHTML = `Maximum attempts exceeded. Please contact admin:<br>
            📧 hemantpb123@gmail.com<br>
            📱 <a href="https://wa.me/919284494154" target="_blank">+91 9284494154</a>`;
        otpInvalidMessage.classList.add('show');
        return;
    }
    
    otpAttempts++;
    updateAttemptsDisplay();
    
    showLoading();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'verifyOTP',
                email: window.currentLoginEmail,
                otp: otp
            })
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            // Save session data
            const sessionData = {
                email: result.data.email,
                businessName: result.data.businessName,
                city: result.data.city,
                sessionToken: result.data.sessionToken,
                sessionExpiry: result.data.sessionExpiry
            };
            
            localStorage.setItem('sessionData', JSON.stringify(sessionData));
            
            // Show welcome screen
            showWelcomeScreen(result.data.businessName);
            
        } else {
            otpInput.value = '';
            otpInput.focus();
            
            if (otpAttempts >= MAX_OTP_ATTEMPTS) {
                otpInvalidMessage.innerHTML = `Maximum attempts exceeded. Please contact admin:<br>
                    📧 hemantpb123@gmail.com<br>
                    📱 <a href="https://wa.me/919284494154" target="_blank">+91 9284494154</a>`;
            } else {
                otpInvalidMessage.textContent = result.message;
            }
            
            otpInvalidMessage.classList.add('show');
            setTimeout(() => otpInvalidMessage.classList.remove('show'), 5000);
        }
        
    } catch (error) {
        hideLoading();
        console.error('OTP verification error:', error);
        otpInvalidMessage.textContent = 'Connection error. Please try again.';
        otpInvalidMessage.classList.add('show');
        setTimeout(() => otpInvalidMessage.classList.remove('show'), 5000);
    }
}

// Resend OTP
async function resendOTP(email) {
    const resendBtn = document.getElementById('resendBtn');
    const otpInvalidMessage = document.getElementById('otpInvalidMessage');
    
    if (resendBtn.disabled) return;
    
    showLoading();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'generateOTP',
                email: email
            })
        });
        
        const result = await response.json();
        
        hideLoading();
        
        if (result.success) {
            showSuccessMessage('New OTP sent to your email!');
            otpAttempts = 0;
            updateAttemptsDisplay();
            document.getElementById('otpInput').value = '';
            startResendTimer();
        } else {
            otpInvalidMessage.textContent = result.message;
            otpInvalidMessage.classList.add('show');
            setTimeout(() => otpInvalidMessage.classList.remove('show'), 5000);
        }
        
    } catch (error) {
        hideLoading();
        console.error('Resend OTP error:', error);
        otpInvalidMessage.textContent = 'Connection error. Please try again.';
        otpInvalidMessage.classList.add('show');
        setTimeout(() => otpInvalidMessage.classList.remove('show'), 5000);
    }
}

// Start resend timer (30 minutes)
function startResendTimer() {
    const resendBtn = document.getElementById('resendBtn');
    const resendTimer = document.getElementById('resendTimer');
    
    if (!resendBtn || !resendTimer) return;
    
    resendBtn.disabled = true;
    resendBtn.style.opacity = '0.5';
    
    let timeLeft = 30 * 60; // 30 minutes in seconds
    
    const timerInterval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        resendTimer.textContent = `Resend available in ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            resendBtn.disabled = false;
            resendBtn.style.opacity = '1';
            resendTimer.textContent = '';
        }
    }, 1000);
}

// Update attempts display
function updateAttemptsDisplay() {
    const attemptsEl = document.getElementById('otpAttempts');
    if (attemptsEl && otpAttempts > 0) {
        const remaining = MAX_OTP_ATTEMPTS - otpAttempts;
        attemptsEl.textContent = `${otpAttempts} attempt(s) used. ${remaining} remaining.`;
        attemptsEl.style.color = remaining <= 2 ? '#e74c3c' : '#666';
    }
}

// Back to login
// Back to login - UPDATED VERSION
function backToLogin() {
    const loginContainer = document.querySelector('.login-container');
    
    // Restore original login form HTML
    loginContainer.innerHTML = `
        <h2>Welcome Back</h2>
        <p class="login-subtitle">Enter your registered email to receive OTP</p>
        
        <form id="loginForm" novalidate>
            <div class="input-group">
                <input 
                    type="email" 
                    id="userId" 
                    placeholder="Email Address" 
                    required 
                    autocomplete="email"
                >
                <span class="error-message" id="userIdError">Please enter a valid email</span>
            </div>
            
            <div id="invalidMessage" class="invalid-message"></div>
            
            <button type="submit" class="login-btn">Send OTP</button>
        </form>
        
        <div class="login-info">
            <p>💡 <strong>First time user?</strong><br> Contact admin to register your account</p>
        </div>
        
        <a href="#" class="ka-login-help-link" id="issueLink">Need Help?</a>
    `;
    
    // Re-attach event listeners
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('userId').value.trim();
        const invalidMessage = document.getElementById('invalidMessage');
        
        resetErrors();
        
        if (!email) {
            showError(document.getElementById('userId'), 'Please enter your email address');
            return;
        }
        
        // Admin bypass check
        if (email === '1231') {
            showOTPScreen(email, true);
            return;
        }
        
        // Basic email validation
        if (!isValidEmail(email) && email !== '1231') {
            showError(document.getElementById('userId'), 'Please enter a valid email address');
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'generateOTP',
                    email: email
                })
            });
            
            const result = await response.json();
            
            hideLoading();
            
            if (result.success) {
                if (result.data && result.data.isAdmin) {
                    // Admin - show OTP screen directly
                    showOTPScreen(email, true);
                } else {
                    // Regular user - OTP sent
                    showOTPScreen(email, false, result.data.businessName);
                    showSuccessMessage('OTP sent to your email!');
                }
            } else {
                invalidMessage.textContent = result.message;
                invalidMessage.classList.add('show');
                setTimeout(() => invalidMessage.classList.remove('show'), 5000);
            }
            
        } catch (error) {
            hideLoading();
            console.error('Login error:', error);
            invalidMessage.textContent = 'Connection error. Please check your internet and try again.';
            invalidMessage.classList.add('show');
            setTimeout(() => invalidMessage.classList.remove('show'), 5000);
        }
    });
    
    // Re-attach help modal functionality
    document.getElementById('issueLink').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('helpModal').style.display = 'block';
    });
    
    resetErrors();
    otpAttempts = 0;
}
// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// Form validation helpers
function showError(inputElement, message) {
    inputElement.classList.add('error');
    const errorElement = inputElement.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function resetErrors() {
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        if (!input) return;
        input.classList.remove('error');
        const errorElement = input.parentElement?.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });
    
    const invalidMessage = document.getElementById('invalidMessage');
    if (invalidMessage) {
        invalidMessage.classList.remove('show');
    }
}

// Add input event listeners
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('input', () => {
        input.classList.remove('error');
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });
});

// Loading screen functions
function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

// Initialize on page load
window.addEventListener('load', async function() {
    await checkExistingSession();
    
    // Install guide modal functionality
    const modal = document.getElementById('installGuideModal');
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.close-install-modal');
    const gotItBtn = modal.querySelector('.got-it-btn');

    setTimeout(() => {
        modal.classList.remove('hidden');
        modal.style.animation = 'fadeIn 0.3s ease-out';
    }, 2000);

    const closeModal = () => {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (gotItBtn) gotItBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});

// Logout function (to be called from other parts of the app)
function logout() {
    localStorage.removeItem('sessionData');
    location.reload();
}