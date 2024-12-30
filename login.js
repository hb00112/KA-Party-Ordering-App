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
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId');
    const password = document.getElementById('password');
    const invalidMessage = document.getElementById('invalidMessage');
    
    // Reset error states
    resetErrors();
    
    // Validate fields
    let isValid = true;
    
    if (!userId.value.trim()) {
        showError(userId, 'Please fill out the above field');
        isValid = false;
    }
    
    if (!password.value.trim()) {
        showError(password, 'Please fill out the above field');
        isValid = false;
    }
    
    if (!isValid) return;

    // Check credentials
    if (validUsers[userId.value] && validUsers[userId.value].password === password.value) {
        const username = validUsers[userId.value].username;
        
        // Check if user exists in Firebase
        const snapshot = await database.ref(`users/${userId.value}`).once('value');
        const userData = snapshot.val();
        
        if (!userData) {
            // First time login
            showWelcomeScreen(username);
            setTimeout(() => {
                hideWelcomeScreen();
                showUserDetailsModal(username, userId.value);
            }, 3000);
        } else {
            // Existing user
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('homeScreen').classList.remove('hidden');
        }
        
        localStorage.setItem('userId', userId.value);
    } else {
        // Show invalid credentials message
        invalidMessage.textContent = 'INVALID USERNAME OR PASSWORD';
        invalidMessage.classList.add('show');
        
        // Hide message after 3 seconds
        setTimeout(() => {
            invalidMessage.classList.remove('show');
        }, 4000);
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
document.getElementById('userDetailsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = localStorage.getItem('userId');
    const userData = {
        name: document.getElementById('name').value,
        designation: document.getElementById('designation').value,
        mobile: document.getElementById('mobile').value,
        email: document.getElementById('email').value || null,
        username: validUsers[userId].username,
        firstLogin: new Date().toISOString()
    };

    try {
        await database.ref(`users/${userId}`).set(userData);
        document.getElementById('userDetailsModal').classList.add('hidden');
        document.getElementById('homeScreen').classList.remove('hidden');
    } catch (error) {
        console.error('Error saving user details:', error);
        alert('Error saving details. Please try again.');
    }
});
