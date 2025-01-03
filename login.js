

// Check for existing user function
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

// GST validation patterns and state codes
const gstPatterns = {
    stateCode: /^[0-9]{2}$/,
    panNumber: /^[A-Z]{5}$/,
    entityNumber: /^[0-9]{4}$/,
    lastPortion: /^[A-Z]{1}[0-9]{1}[Z]{1}[A-Z0-9]{1}$/,
    complete: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9]{1}[Z]{1}[A-Z0-9]{1}$/
};

const validStateCodes = {
    '27': 'MAHARASHTRA',
    '29': 'KARNATAKA',
    '30': 'GOA',
    '00': 'demo'
};

// Function to validate GST number
function validateGST(value) {
    if (!gstPatterns.complete.test(value)) {
        return {
            isValid: false,
            error: 'Invalid GST format'
        };
    }

    const stateCode = value.substring(0, 2);
    if (!validStateCodes[stateCode]) {
        return {
            isValid: false,
            error: 'Invalid state code (Only MH, KA, GA allowed)'
        };
    }

    return {
        isValid: true,
        error: ''
    };
}

// Function to set input type based on position
function setInputType(input, position) {
    // First 2 digits (state code)
    if (position < 2) {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
        return;
    }
    
    // Next 5 characters (PAN)
    if (position >= 2 && position < 7) {
        input.setAttribute('inputmode', 'text');
        input.setAttribute('pattern', '[A-Z]*');
        return;
    }
    
    // Next 4 digits (entity number)
    if (position >= 7 && position < 11) {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
        return;
    }
    
    // Last 4 characters (H1ZJ)
    if (position === 11) { // H
        input.setAttribute('inputmode', 'text');
        input.setAttribute('pattern', '[A-Z]*');
    } else if (position === 12) { // 1
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
    } else if (position >= 13) { // Z and J
        input.setAttribute('inputmode', 'text');
        input.setAttribute('pattern', '[A-Z]*');
    }
}

// Function to show loading state
function showLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

// Function to hide loading state
function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Function to show error
function showError(inputElement, message) {
    inputElement.classList.add('error');
    const errorElement = inputElement.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Function to reset errors
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

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    showLoading();
    
    const userId = document.getElementById('userId').value.trim().toUpperCase();
    const password = document.getElementById('password').value.trim().toUpperCase();
    const invalidMessage = document.getElementById('invalidMessage');
    
    // Add console logs for debugging
    console.log('Login attempt:', { userId, password });
    console.log('Valid users:', validUsers);
    console.log('Checking if user exists:', !!validUsers[userId]);
    
    // Reset error states
    resetErrors();
    
    // Validate fields are not empty
    if (!userId || !password) {
        console.log('Empty fields detected');
        hideLoading();
        if (!userId) showError(document.getElementById('userId'), 'Please fill out the above field');
        if (!password) showError(document.getElementById('password'), 'Please fill out the above field');
        return;
    }

    try {
        // Check if the credentials exist in validUsers
        if (!validUsers[userId]) {
            console.log('User not found in validUsers');
            hideLoading();
            invalidMessage.textContent = 'INVALID USERNAME OR PASSWORD';
            invalidMessage.classList.add('show');
            setTimeout(() => invalidMessage.classList.remove('show'), 4000);
            return;
        }

        if (validUsers[userId].password !== password) {
            console.log('Invalid password');
            hideLoading();
            invalidMessage.textContent = 'INVALID USERNAME OR PASSWORD';
            invalidMessage.classList.add('show');
            setTimeout(() => invalidMessage.classList.remove('show'), 4000);
            return;
        }

        console.log('Valid credentials found:', userId);
        const username = validUsers[userId].username;
        
        // If it's a GST format, validate and get state/keywords
        if (userId.length === 15) {
            console.log('Processing GST format login');
            const userIdValidation = validateGST(userId);
            if (!userIdValidation.isValid) {
                console.log('Invalid GST format:', userIdValidation.error);
                hideLoading();
                showError(document.getElementById('userId'), userIdValidation.error);
                return;
            }
            
            const userState = validStateCodes[userId.substring(0, 2)];
            const keywords = [
                userState,
                `ENTITY_${userId.substring(7, 11)}`,
                userId.charAt(12) === 'R' ? 'REGULAR' : 
                userId.charAt(12) === 'C' ? 'COMPOSITION' : 'OTHER'
            ];
            console.log('GST login successful, proceeding with keywords:', keywords);
            await handleLogin(userId, username, keywords);
        } else {
            // Non-GST format login (like USER1)
            console.log('Processing non-GST format login');
            try {
                console.log('Attempting login with USER1');
                await handleLogin(userId, username, ['ADMIN']);
                console.log('Non-GST login successful');
            } catch (error) {
                console.error('Error during non-GST login:', error);
                hideLoading();
                invalidMessage.textContent = 'LOGIN FAILED. PLEASE TRY AGAIN.';
                invalidMessage.classList.add('show');
                setTimeout(() => invalidMessage.classList.remove('show'), 4000);
            }
        }
    } catch (error) {
        console.error('Login process error:', error);
        hideLoading();
        invalidMessage.textContent = 'AN ERROR OCCURRED. PLEASE TRY AGAIN.';
        invalidMessage.classList.add('show');
        setTimeout(() => invalidMessage.classList.remove('show'), 4000);
    }
});

// Add input event listeners with GST validation and keyboard switching
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('input', (e) => {
        const position = e.target.selectionStart;
        let value = e.target.value.toUpperCase();
        
        // Keep the input in uppercase
        e.target.value = value;

        // Set appropriate input type based on position
        setInputType(e.target, position);

        // Remove error state
        input.classList.remove('error');
        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // Only validate GST format if length is 15 (GST number length)
        if (value.length === 15) {
            const validation = validateGST(value);
            if (!validation.isValid) {
                showError(input, validation.error);
            }
        }
    });
});

// Set initial input types
document.addEventListener('DOMContentLoaded', () => {
    setInputType(document.getElementById('userId'), 0);
    setInputType(document.getElementById('password'), 0);
});

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
