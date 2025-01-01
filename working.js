//date and time in login screen
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
    
    const dateTimeElement = document.getElementById('datetime');
    if (dateTimeElement) {
        dateTimeElement.textContent = dateTimeString;
    }
}

// Update every second
setInterval(updateDateTime, 1000);
updateDateTime();

function showLoading() {
    document.getElementById('loadingScreen').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingScreen').classList.add('hidden');
}

function showWelcomeScreen(username) {
    const welcomeScreen = document.getElementById('welcomeScreen');
    document.getElementById('welcomeMessage').textContent = `Welcome, ${username}!`;
    document.getElementById('loginPage').classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
}

function hideWelcomeScreen() {
    document.getElementById('welcomeScreen').classList.add('hidden');
}

function showUserDetailsModal(username, userId) {
    const modal = document.getElementById('userDetailsModal');
    document.getElementById('modalUsername').textContent = username;
    modal.classList.remove('hidden');
}

// Check for existing user on page load
window.addEventListener('load', checkExistingUser);
// Add this to your existing JavaScript
document.addEventListener('contextmenu', event => event.preventDefault());

// Prevent keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Prevent Ctrl+C, Ctrl+V, Ctrl+A
    if ((event.ctrlKey || event.metaKey) && 
        (event.key === 'c' || event.key === 'v' || event.key === 'a')) {
        event.preventDefault();
    }
    
    // Prevent zooming with Ctrl + +/- or Ctrl + scroll
    if ((event.ctrlKey || event.metaKey) && 
        (event.key === '+' || event.key === '-' || event.key === '=')) {
        event.preventDefault();
    }
});

// Prevent pinch zoom on touch devices

// Add this to your existing JavaScript
// Prevent zoom on desktop
document.addEventListener('wheel', function(event) {
    if (event.ctrlKey) {
        event.preventDefault();
    }
}, { passive: false });

// Prevent all touch zoom gestures
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchend', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Double tap zoom prevention
let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// Prevent zoom on keyboard shortcuts
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && 
        (event.key === '+' || 
         event.key === '-' || 
         event.key === '=' || 
         event.key === '0' ||
         event.which === 187 || 
         event.which === 189)) {
        event.preventDefault();
    }
});

// Additional zoom prevention for Firefox
document.body.style.MozTransform = 'scale(1)';
document.body.style.transform = 'scale(1)';

// Prevent zoom on iOS devices
document.addEventListener('gesturestart', function(event) {
    event.preventDefault();
});

document.addEventListener('gesturechange', function(event) {
    event.preventDefault();
});

document.addEventListener('gestureend', function(event) {
    event.preventDefault();
});
