// Initialize home page
function initHome() {
    const userId = localStorage.getItem('userId');
    if (userId && validUsers[userId]) {
        
        
        // Check if firm section already exists and remove it
        const existingFirmSection = document.querySelector('.firm-section');
        if (existingFirmSection) {
            existingFirmSection.remove();
        }
        
        // Create firm section
        const firmSection = document.createElement('div');
        firmSection.className = 'firm-section';
        firmSection.innerHTML = ` ${validUsers[userId].username}`;
        
        // Get the home screen container and the main content
        const homeScreen = document.querySelector('.home-screen-container');
        const homeMain = document.querySelector('.home-main');
        
        // Insert firm section between header and main content
        if (homeScreen && homeMain) {
            homeScreen.insertBefore(firmSection, homeMain);
        }
        
      
    }

    // Initialize date/time updates
    updateHomeDateTime();
    setInterval(updateHomeDateTime, 1000);
}


// Separate function for updating date/time in home screen
function updateHomeDateTime() {
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
    
    // Update footer datetime
    const footerDateTime = document.querySelector('.home-footer #datetime');
    if (footerDateTime) {
        footerDateTime.textContent = dateTimeString;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    initHome();

});
