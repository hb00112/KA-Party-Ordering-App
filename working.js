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
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.1, audioContext.currentTime); // Adjust volume

    // Create and configure oscillators for a richer sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();

    oscillator1.type = 'sine';
    oscillator2.type = 'triangle';
    oscillator3.type = 'sawtooth';

    oscillator1.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    oscillator2.frequency.setValueAtTime(220, audioContext.currentTime); // A3
    oscillator3.frequency.setValueAtTime(880, audioContext.currentTime); // A5

    oscillator1.connect(masterGain);
    oscillator2.connect(masterGain);
    oscillator3.connect(masterGain);

    oscillator1.start();
    oscillator2.start();
    oscillator3.start();

    // Gradually increase and decrease the volume for a smooth effect
    masterGain.gain.setValueAtTime(0.1, audioContext.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 1);
    masterGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 5);

    setTimeout(() => {
        oscillator1.stop();
        oscillator2.stop();
        oscillator3.stop();
    }, 5000); // 5 seconds duration
}

function showWelcomeScreen(username, isNewUser) {
    const welcomeScreen = document.getElementById('welcomeScreen');
    document.getElementById('loginPage').classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
    
    playWelcomeSound(); // Play professional welcome sound

    // Add parallax effect
    const logoStage = document.querySelector('.logo-stage');
    document.addEventListener('mousemove', (e) => {
        if (!welcomeScreen.classList.contains('hidden')) {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            const x = (clientX - innerWidth / 2) / 30;
            const y = (clientY - innerHeight / 2) / 30;
            
            logoStage.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
        }
    });

    // Precise timing for transition
    setTimeout(() => {
        welcomeScreen.classList.add('hidden');
        if (isNewUser) {
            showUserDetailsModal(username);
        } else {
            initializeHomeScreen(username);
        }
    }, 5000);
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
    checkExistingUser();

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

const modal = document.getElementById('helpModal');
const issueLink = document.getElementById('issueLink');
const closeBtn = document.querySelector('.ka-login-help-close');
const issueForm = document.getElementById('issueForm');
const issueType = document.getElementById('issueType');
const otherIssueGroup = document.getElementById('otherIssueGroup');

issueLink.onclick = (e) => {
    e.preventDefault();
    modal.style.display = 'block';
}

closeBtn.onclick = () => {
    modal.style.display = 'none';
}

window.onclick = (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
}

// Show/hide other issue textarea
issueType.onchange = () => {
    otherIssueGroup.style.display = issueType.value === '4' ? 'block' : 'none';
}

// Form validation and submission
issueForm.onsubmit = (e) => {
    e.preventDefault();
    
    // Reset error messages
    document.querySelectorAll('.ka-login-help-error').forEach(err => err.textContent = '');
    
    const firmName = document.getElementById('firmName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const email = document.getElementById('email').value.trim();
    const gstin = document.getElementById('gstin').value.trim();
    const selectedIssue = issueType.value;
    const otherIssue = document.getElementById('otherIssue').value.trim();

    let isValid = true;

    // Validation
    if (!firmName) {
        document.getElementById('firmNameError').textContent = 'Firm name is required';
        isValid = false;
    }

    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
        document.getElementById('mobileError').textContent = 'Valid 10-digit mobile number is required';
        isValid = false;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        document.getElementById('emailError').textContent = 'Valid email is required';
        isValid = false;
    }

    if (!selectedIssue) {
        document.getElementById('issueTypeError').textContent = 'Please select an issue';
        isValid = false;
    }

    if (selectedIssue === '4' && !otherIssue) {
        document.getElementById('otherIssueError').textContent = 'Please describe your issue';
        isValid = false;
    }

    if (isValid) {
        // Prepare WhatsApp message
        let issueText = selectedIssue === '4' ? otherIssue : issueType.options[issueType.selectedIndex].text;
        let message = `Issue in KA ORDER\n\n` +
            `Firm Name: ${firmName}\n` +
            `Mobile: ${mobile}\n` +
            `Email: ${email}\n` +
            `GSTIN: ${gstin}\n` +
            `Issue Type: ${issueText}`;

        // Encode the message for URL
        let encodedMessage = encodeURIComponent(message);
        
        // Open WhatsApp with the prepared message
        window.open(`https://wa.me/919284494154?text=${encodedMessage}`, '_blank');
        
        // Close the modal and reset form
        modal.style.display = 'none';
        issueForm.reset();
        otherIssueGroup.style.display = 'none';
    }
}
