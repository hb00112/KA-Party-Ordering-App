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

function playWelcomeSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const masterGain = audioContext.createGain();
    const reverb = audioContext.createConvolver();
    const filter = audioContext.createBiquadFilter();

    // Configure audio chain
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, audioContext.currentTime);
    filter.Q.setValueAtTime(0.5, audioContext.currentTime);

    masterGain.connect(filter);
    filter.connect(audioContext.destination);
    
    // Very low master volume
    masterGain.gain.setValueAtTime(0, audioContext.currentTime);

    // Create gentle ascending arpeggio
    const notes = [
        { freq: 261.63, time: 0.0 },     // C4
        { freq: 329.63, time: 0.2 },     // E4
        { freq: 392.00, time: 0.4 },     // G4
        { freq: 523.25, time: 0.6 }      // C5
    ];

    notes.forEach(note => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Soft sine wave
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.time);
        
        // Gentle envelope for each note
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + note.time + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + note.time + 1.5);
        
        osc.connect(gainNode);
        gainNode.connect(masterGain);
        
        osc.start(audioContext.currentTime + note.time);
        osc.stop(audioContext.currentTime + note.time + 1.5);
    });

    // Add soft pad in background
    const pad = audioContext.createOscillator();
    const padGain = audioContext.createGain();
    pad.type = 'sine';
    pad.frequency.setValueAtTime(523.25 / 2, audioContext.currentTime); // C4
    padGain.gain.setValueAtTime(0, audioContext.currentTime);
    padGain.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 0.5);
    padGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 4.5);
    pad.connect(padGain);
    padGain.connect(masterGain);
    pad.start();
    pad.stop(audioContext.currentTime + 4.5);

    // Master volume envelope
    masterGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
    masterGain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 3.5);
    masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 4.5);
}



//WORKING.JS
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
// working.js - Updated for OTP Authentication System

function showWelcomeScreen(businessName) {
    console.log('Showing welcome screen for:', businessName);
    
    // Hide login page
    document.getElementById('loginPage').classList.add('hidden');
    
    // Show welcome animation
    const welcomeScreen = document.getElementById('welcomeScreen');
    welcomeScreen.classList.remove('hidden');
    
    // Trigger animation
    setTimeout(() => {
        welcomeScreen.classList.add('active');
    }, 100);
    
    // After animation, show home screen
    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        welcomeScreen.classList.remove('active');
        initializeHomeScreen(businessName);
    }, 3000);
}

function initializeHomeScreen(businessName, city = '') {
    console.log('Initializing home screen for:', businessName);
    
    const homeScreen = document.getElementById('homeScreen');
    
    // Update header if needed
    const ka = document.getElementById('ka');
    if (ka) {
        ka.textContent = 'KAMBESHWAR AGENCIES';
    }
    
    // Get session data
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    
    // Remove existing firm section if present
    const existingFirmSection = document.querySelector('.firm-section');
    if (existingFirmSection) {
        existingFirmSection.remove();
    }
    
    // Add firm section
    const firmSection = document.createElement('div');
    firmSection.className = 'firm-section';
    firmSection.innerHTML = `FIRM: ${businessName}`;
    
    const homeScreenContainer = document.querySelector('.home-screen-container');
    const homeMain = document.querySelector('.home-main');
    if (homeScreenContainer && homeMain) {
        homeScreenContainer.insertBefore(firmSection, homeMain);
    }
    
    // Store current user info globally for other parts of the app
    window.currentUser = {
        businessName: businessName,
        city: city || sessionData.city,
        email: sessionData.email
    };
    
    // Show home screen
    homeScreen.classList.remove('hidden');
    updateDateTime();
}

// Handle login (called from login.js after OTP verification)
async function handleLogin(email, businessName) {
    console.log('Handling login for:', businessName);
    showWelcomeScreen(businessName);
}

// Update date and time display
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateTimeString = now.toLocaleDateString('en-US', options);
    
    const datetimeEl = document.getElementById('datetime');
    if (datetimeEl) {
        datetimeEl.textContent = dateTimeString;
    }
    
    const homeDateTimeEl = document.getElementById('homeDateTime');
    if (homeDateTimeEl) {
        homeDateTimeEl.textContent = dateTimeString;
    }
    
    // Update every minute
    setTimeout(updateDateTime, 60000);
}

// Check if user is logged in (for protecting routes)
function isUserLoggedIn() {
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    
    if (!sessionData.email || !sessionData.sessionToken || !sessionData.sessionExpiry) {
        return false;
    }
    
    const expiryDate = new Date(sessionData.sessionExpiry);
    const now = new Date();
    
    return now < expiryDate;
}

// Protect sections - redirect to login if not authenticated
function protectSection() {
    if (!isUserLoggedIn()) {
        const homeScreen = document.getElementById('homeScreen');
        const loginPage = document.getElementById('loginPage');
        
        if (homeScreen) homeScreen.classList.add('hidden');
        if (loginPage) loginPage.classList.remove('hidden');
        
        alert('Your session has expired. Please login again.');
        return false;
    }
    return true;
}

// Get current user info
function getCurrentUser() {
    if (window.currentUser) {
        return window.currentUser;
    }
    
    const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
    return {
        businessName: sessionData.businessName || 'Unknown',
        city: sessionData.city || '',
        email: sessionData.email || ''
    };
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Initialize on page load
window.addEventListener('load', function() {
    updateDateTime();
    
    // Set up logout functionality if logout button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
});

// Export functions for use in other files
window.showWelcomeScreen = showWelcomeScreen;
window.initializeHomeScreen = initializeHomeScreen;
window.handleLogin = handleLogin;
window.isUserLoggedIn = isUserLoggedIn;
window.protectSection = protectSection;
window.getCurrentUser = getCurrentUser;
window.formatDate = formatDate;


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
});

// Add this at the top with your other functions
function createOfflineModal() {
    const modal = document.createElement('div');
    modal.id = 'offlineModal';
    modal.innerHTML = `
        <div class="offline-backdrop"></div>
        <div class="offline-content">
            <div class="offline-icon">📡</div>
            <h2>You're Offline</h2>
            <p>Please check your internet connection</p>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add these styles to your CSS file
    const style = document.createElement('style');
    style.textContent = `
        .offline-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
            z-index: 9998;
        }
        .offline-content {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .offline-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
    `;
    document.head.appendChild(style);
}

// Add this to your existing event listeners section
// Add this to your existing event listeners section
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Add offline detection
    window.addEventListener('offline', () => {
        if (!document.getElementById('offlineModal')) {
            createOfflineModal();
        }
    });

    window.addEventListener('online', () => {
        const modal = document.getElementById('offlineModal');
        if (modal) {
            modal.remove();
            // Refresh the page when internet connection is restored
            window.location.reload();
        }
    });

    // Check initial state
    if (!navigator.onLine) {
        createOfflineModal();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const issueLink = document.getElementById('issueLink');
    const helpModal = document.getElementById('helpModal');
    const closeBtn = document.querySelector('.ka-login-help-close');
    const issueForm = document.getElementById('issueForm');
    const issueTypeSelect = document.getElementById('issueType');
    const otherIssueGroup = document.getElementById('otherIssueGroup');

    if (issueLink) {
        issueLink.addEventListener('click', function(e) {
            e.preventDefault();
            helpModal.style.display = 'block';
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            helpModal.style.display = 'none';
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });

    if (issueTypeSelect) {
        issueTypeSelect.addEventListener('change', function() {
            if (this.value === '5') {
                otherIssueGroup.style.display = 'block';
            } else {
                otherIssueGroup.style.display = 'none';
            }
        });
    }

    if (issueForm) {
        issueForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const firmName = document.getElementById('firmName').value;
            const mobile = document.getElementById('mobile').value;
            const email = document.getElementById('helpEmail').value;
            const city = document.getElementById('city').value;
            const issueType = document.getElementById('issueType');
            const issueText = issueType.options[issueType.selectedIndex].text;
            const otherIssue = document.getElementById('otherIssue').value;
            
            // Validate required fields
            if (!firmName || !mobile || !email || !issueType.value) {
                alert('Please fill all required fields');
                return;
            }
            
            // Create WhatsApp message
            let message = `*Login Help Request - Kambeshwar Agencies*\n\n`;
            message += `*Business Name:* ${firmName}\n`;
            message += `*Mobile:* ${mobile}\n`;
            message += `*Email:* ${email}\n`;
            if (city) message += `*City:* ${city}\n`;
            message += `*Issue:* ${issueText}\n`;
            if (otherIssue) message += `*Details:* ${otherIssue}\n`;
            
            const whatsappURL = `https://wa.me/919284494154?text=${encodeURIComponent(message)}`;
            window.open(whatsappURL, '_blank');
            
            helpModal.style.display = 'none';
            issueForm.reset();
        });
    }
});
