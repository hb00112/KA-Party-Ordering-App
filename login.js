//login.js
async function checkExistingUser() {
    showLoading();
    const userId = localStorage.getItem('userId');
    if (userId) {
        try {
            const snapshot = await database.ref(`users/${userId}`).once('value');
            const userData = snapshot.val();
            if (userData) {
                hideLoading();
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('homeScreen').classList.remove('hidden');
                return true;
            }
        } catch (error) {
            console.error('Error checking existing user:', error);
        }
    }
    hideLoading();
    return false;
}

// Login form submission
// Update this part in your login.js file
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;
    const invalidMessage = document.getElementById('invalidMessage');
    
    // Reset error states
    resetErrors();
    
    // Validate fields
    if (!userId.trim() || !password.trim()) {
        if (!userId.trim()) showError(document.getElementById('userId'), 'Please fill out the above field');
        if (!password.trim()) showError(document.getElementById('password'), 'Please fill out the above field');
        return;
    }

    // Check credentials
    if (validUsers[userId] && validUsers[userId].password === password) {
        const username = validUsers[userId].username;
        // Use the handleLogin function from working.js
        await handleLogin(userId, username);
    } else {
        invalidMessage.textContent = 'INVALID USERNAME OR PASSWORD';
        invalidMessage.classList.add('show');
        setTimeout(() => invalidMessage.classList.remove('show'), 4000);
    }
});
// Add these new functions for form validation
function showError(inputElement, message) {
    inputElement.classList.add('error');
    const errorElement = inputElement.parentElement.querySelector('.error-message');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function resetErrors() {
    // Reset all error states
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        if (!input) return;
        input.classList.remove('error');
        const errorElement = input.parentElement?.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    });
    
    // Reset invalid message
    const invalidMessage = document.getElementById('invalidMessage');
    if (invalidMessage) {
        invalidMessage.classList.remove('show');
    }
}

// Add input event listeners to remove error state when user starts typing
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('input', () => {
        input.classList.remove('error');
        const errorElement = input.parentElement.querySelector('.error-message');
        errorElement.style.display = 'none';
    });
});

// User details form submission


// Install guide modal functionality
window.addEventListener('load', function() {
    const modal = document.getElementById('installGuideModal');
    if (!modal) return; // Guard clause in case modal doesn't exist
    
    const closeBtn = modal.querySelector('.close-install-modal');
    const gotItBtn = modal.querySelector('.got-it-btn');

    // Show modal after 2-second delay
    setTimeout(() => {
        modal.classList.remove('hidden');
        // Add fade-in animation
        modal.style.animation = 'fadeIn 0.3s ease-out';
    }, 2000);

    // Close modal function
    const closeModal = () => {
        // Add fade-out animation
        modal.style.animation = 'fadeOut 0.3s ease-out';
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    // Add event listeners for closing modal
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (gotItBtn) gotItBtn.addEventListener('click', closeModal);

    // Close when clicking outside the modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});

function validateMobileNumber() { const mobile = document.getElementById('mobile').value; const mobileError = document.getElementById('mobileError'); const mobilePattern = /^[0-9]{10}$/; if (mobilePattern.test(mobile)) { mobileError.textContent = ''; return true; } else { mobileError.textContent = 'Please enter a valid 10-digit mobile number.'; return false; } }
