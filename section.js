// Navigation history stack
let currentSection = 'homeScreen';

// Function to hide all sections and reset visibility
function hideAllSections() {
    // Hide all sections
    const sections = document.querySelectorAll('.section-screen');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

// Function to show home screen properly
function showHomeScreen() {
    hideAllSections();
    const homeScreen = document.getElementById('homeScreen');
    homeScreen.style.display = 'block';
    currentSection = 'homeScreen';
}

// Show a specific section
function showSection(sectionId) {
    if (sectionId === 'homeScreen') {
        showHomeScreen();
    } else {
        // Hide all sections including home
        hideAllSections();
        document.getElementById('homeScreen').style.display = 'none';

        // Show the requested section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            currentSection = sectionId;
        }
    }
    // Push state to browser history
    history.pushState({ section: sectionId }, '', `#${sectionId}`);
}

// Handle browser back button
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        if (event.state.section === 'homeScreen') {
            showHomeScreen();
        } else {
            showSection(event.state.section);
        }
    } else {
        // Default to home screen
        showHomeScreen();
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initially hide all sections
    hideAllSections();
    
    // Show home screen
    showHomeScreen();
    
    // Set initial history state
    history.replaceState({ section: 'homeScreen' }, '', '#homeScreen');
});


function handleSuccessfulLogin() {
    // Hide login page
    document.getElementById('loginPage').classList.add('hidden');
    
    // Show app container
    document.getElementById('appContainer').classList.remove('hidden');
    
    // Show welcome screen (if that's part of your flow)
    document.getElementById('welcomeScreen').classList.remove('hidden');
    
    // Rest of your login success logic...
}

// Add this CSS to your styles.css
