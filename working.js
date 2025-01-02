// working.js
function updateDateTime() {
    const now = new Date();
    const dateTimeString = now.toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    
    const elements = ['datetime', 'homeDateTime'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = dateTimeString;
        }
    });
}

function showLoading() {
    document.getElementById('loadingScreen').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingScreen').classList.add('hidden');
}

// Modified to handle the transition more explicitly
function showWelcomeScreen(username, isNewUser) {
    console.log('Showing welcome screen for:', username, 'New user:', isNewUser); // Debug log
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    // Hide login page
    document.getElementById('loginPage').classList.add('hidden');
    
    // Show welcome screen
    welcomeMessage.textContent = `Welcome, ${username}!`;
    welcomeScreen.classList.remove('hidden');
    
    // Set timeout to handle the next screen
    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        
        if (isNewUser) {
            console.log('Showing user details modal for new user'); // Debug log
            showUserDetailsModal(username);
        } else {
            console.log('Initializing home screen for existing user'); // Debug log
            initializeHomeScreen(username);
        }
    }, 3000);
}

function showUserDetailsModal(username) {
    console.log('Attempting to show user details modal'); // Debug log
    const modal = document.getElementById('userDetailsModal');
    const modalUsername = document.getElementById('modalUsername');
    
    if (!modal || !modalUsername) {
        console.error('Modal elements not found!');
        return;
    }
    
    modalUsername.textContent = username;
    modal.classList.remove('hidden');
    
    // Make sure the modal is visible
    modal.style.display = 'block';
    console.log('User details modal should be visible now'); // Debug log
}

// Modified login handler
async function handleLogin(userId, username) {
    console.log('Handling login for:', username); // Debug log
    
    try {
        // Check if user exists in Firebase
        const snapshot = await database.ref(`users/${userId}`).once('value');
        const userData = snapshot.val();
        
        // Store userId in localStorage
        localStorage.setItem('userId', userId);
        
        // Show welcome screen with isNewUser flag
        showWelcomeScreen(username, !userData);
        
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
}

function initializeHomeScreen(username) {
    console.log('Initializing home screen for:', username); // Debug log
    
    const homeScreen = document.getElementById('homeScreen');
    const ka = document.getElementById('ka');
    
    if (ka) {
        ka.textContent = 'KAMBESHWAR AGENCIES';
    }
    
    const userId = localStorage.getItem('userId');
    if (userId && validUsers[userId]) {
        const existingFirmSection = document.querySelector('.firm-section');
        if (existingFirmSection) {
            existingFirmSection.remove();
        }
        
        const firmSection = document.createElement('div');
        firmSection.className = 'firm-section';
        firmSection.innerHTML = `FIRM: ${validUsers[userId].username}`;
        
        const homeScreenContainer = document.querySelector('.home-screen-container');
        const homeMain = document.querySelector('.home-main');
        if (homeScreenContainer && homeMain) {
            homeScreenContainer.insertBefore(firmSection, homeMain);
        }
    }
    
    homeScreen.classList.remove('hidden');
    updateDateTime();
}

// User details form submission
document.getElementById('userDetailsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted'); // Debug log
    
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
        initializeHomeScreen(validUsers[userId].username);
    } catch (error) {
        console.error('Error saving user details:', error);
        alert('Error saving details. Please try again.');
    }
});

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    checkExistingUser();
});