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
    lastPortion: /^[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/,
    complete: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$/
};

const validStateCodes = {
    '27': 'MAHARASHTRA',
    '29': 'KARNATAKA',
    '30': 'GOA'
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
    if ((position < 2) || (position >= 7 && position < 11)) {
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('pattern', '[0-9]*');
    } else {
        input.setAttribute('inputmode', 'text');
        input.setAttribute('pattern', '[A-Z]*');
    }
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value.trim().toUpperCase();
    const password = document.getElementById('password').value.trim().toUpperCase();
    const invalidMessage = document.getElementById('invalidMessage');
    
    // Reset error states
    resetErrors();
    
    // Validate fields
    if (!userId || !password) {
        if (!userId) showError(document.getElementById('userId'), 'Please fill out the above field');
        if (!password) showError(document.getElementById('password'), 'Please fill out the above field');
        return;
    }

    // Validate GST format
    const userIdValidation = validateGST(userId);
    const passwordValidation = validateGST(password);

    if (!userIdValidation.isValid) {
        showError(document.getElementById('userId'), userIdValidation.error);
        return;
    }

    if (!passwordValidation.isValid) {
        showError(document.getElementById('password'), passwordValidation.error);
        return;
    }

    // Check credentials
    if (validUsers[userId] && validUsers[userId].password === password) {
        const username = validUsers[userId].username;
        // Get state and keywords
        const userState = validStateCodes[userId.substring(0, 2)];
        const keywords = [
            userState,
            `ENTITY_${userId.substring(7, 11)}`,
            userId.charAt(12) === 'R' ? 'REGULAR' : 
            userId.charAt(12) === 'C' ? 'COMPOSITION' : 'OTHER'
        ];
        // Use the handleLogin function from working.js
        await handleLogin(userId, username, keywords);
    } else {
        invalidMessage.textContent = 'INVALID USERNAME OR PASSWORD';
        invalidMessage.classList.add('show');
        setTimeout(() => invalidMessage.classList.remove('show'), 4000);
    }
});

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

        // Validate GST format if length is 15
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