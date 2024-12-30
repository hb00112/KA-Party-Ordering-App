// Navigation history stack
let currentSection = 'homeScreen';

// Show a specific section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section-screen, .home-screen-container');
    sections.forEach(section => section.classList.add('hidden'));

    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    targetSection.classList.remove('hidden');

    // Update current section
    currentSection = sectionId;

    // Push state to browser history
    history.pushState({ section: sectionId }, '', `#${sectionId}`);
}

// Handle browser back button
window.addEventListener('popstate', function(event) {
    // If we have state information
    if (event.state && event.state.section) {
        // If going back to home screen
        if (event.state.section === 'homeScreen') {
            const sections = document.querySelectorAll('.section-screen');
            sections.forEach(section => section.classList.add('hidden'));
            document.getElementById('homeScreen').classList.remove('hidden');
            currentSection = 'homeScreen';
        } else {
            showSection(event.state.section);
        }
    } else {
        // Default to home screen if no state
        const sections = document.querySelectorAll('.section-screen');
        sections.forEach(section => section.classList.add('hidden'));
        document.getElementById('homeScreen').classList.remove('hidden');
        currentSection = 'homeScreen';
    }
});

// Initialize history state for home screen
window.addEventListener('DOMContentLoaded', () => {
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