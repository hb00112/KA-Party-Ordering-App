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
document.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
});

// Disable context menu
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Disable copy
document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
});

// Disable cut
document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;});

// Disable paste
document.addEventListener('paste', function(e) {
    e.preventDefault();
    return false;
});

// Add these meta tags to your HTML head (programmatically to ensure they exist)
function addZoomDisablingMeta() {
    // Remove any existing viewport meta tags
    const existingViewportMeta = document.querySelector('meta[name="viewport"]');
    if (existingViewportMeta) {
        existingViewportMeta.remove();
    }

    // Add comprehensive viewport meta tag
    const viewportMeta = document.createElement('meta');
    viewportMeta.name = 'viewport';
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no';
    document.head.appendChild(viewportMeta);
}

// Disable various zoom methods
function disableZoom() {
    // Disable pinch zooming
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });

    // Disable double-tap zooming
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        if (now - lastTouchEnd < 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });

    // Disable keyboard zoom (Ctrl/Cmd + +/-)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && (
            e.key === '+' || 
            e.key === '-' || 
            e.key === '=' || 
            e.key === '_' ||
            e.which === 187 || 
            e.which === 189 ||
            e.which === 61 || 
            e.which === 173
        )) {
            e.preventDefault();
            return false;
        }
    }, { passive: false });

    // Disable mousewheel zoom (Ctrl/Cmd + mousewheel)
    document.addEventListener('wheel', function(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            return false;
        }
    }, { passive: false });

    // Add CSS to prevent touch callout and user select
    const style = document.createElement('style');
    style.textContent = `
        * {
            -webkit-touch-callout: none;
            -ms-touch-action: none;
            touch-action: manipulation;
        }
        
        html, body {
            touch-action: pan-x pan-y;
            overscroll-behavior: none;
        }
    `;
    document.head.appendChild(style);
}

// Initialize zoom prevention
function initZoomPrevention() {
    addZoomDisablingMeta();
    disableZoom();
    
    // Reapply on orientation change
    window.addEventListener('orientationchange', function() {
        addZoomDisablingMeta();
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', initZoomPrevention);

// If the page is already loaded, initialize immediately
if (document.readyState === 'complete') {
    initZoomPrevention();
}


// Haptic feedback function
// Haptic feedback function
// Haptic feedback and sound function
function playHapticFeedbackAndSound(type = 'medium') {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator;

    if ('vibrate' in navigator) {
        switch (type) {
            case 'light':
                navigator.vibrate(10);
                playSound(audioContext, 440, 100); // Light sound
                break;
            case 'medium':
                navigator.vibrate(25);
                playSound(audioContext, 440, 200); // Medium sound
                break;
            case 'heavy':
                navigator.vibrate(35);
                playSound(audioContext, 440, 300); // Heavy sound
                break;
            case 'double':
                navigator.vibrate([10, 30, 10]);
                playSound(audioContext, 440, 400); // Double sound
                break;
            case 'error':
                navigator.vibrate([50, 100, 50]);
                playSound(audioContext, 200, 500); // Error sound
                break;
        }
    }

    function playSound(audioContext, frequency, duration) {
        oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        gainNode.gain.value = 0.1; // Volume control

        oscillator.start();
        setTimeout(() => {
            oscillator.stop();
        }, duration);
    }
}

// Use playHapticFeedbackAndSound instead of playHapticFeedback in your event listeners


// Add global haptic feedback to all interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Function to add haptic feedback to an element
    function addHapticToElement(element) {
        element.addEventListener('touchstart', () => {
            playHapticFeedback('light');
        }, { passive: true });
        
        element.addEventListener('click', () => {
            playHapticFeedback('light');
        });
    }

    // Add haptic to all interactive elements
    const interactiveElements = document.querySelectorAll(`
        a, button, input, select, textarea,
        [role="button"],
        [role="link"],
        [role="tab"],
        [role="menuitem"],
        [role="checkbox"],
        [role="radio"],
        [role="switch"],
        [role="slider"],
        .clickable,
        .interactive,
        .home-btn,
        .footer-btn,
        .toggle-btn,
        .close-btn,
        .submit-btn,
        .login-btn,
        .got-it-btn,
        .ka-login-help-submit,
        .report-problem-btn,
        .add-to-cart-btn,
        .cart-empty-btn,
        .order-card,
        .suggestions div,
        .colors-container div,
        .sizes-container div
    `);

    interactiveElements.forEach(addHapticToElement);

    // Special feedback for forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', () => {
            playHapticFeedback('double');
        });
    });

    // Error state feedback
    const errorElements = document.querySelectorAll('.error-message, .invalid-message');
    errorElements.forEach(element => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (element.style.display !== 'none') {
                        playHapticFeedback('error');
                    }
                }
            });
        });
        
        observer.observe(element, {
            attributes: true
        });
    });

    // Add haptic to dynamically loaded elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    const newInteractiveElements = node.querySelectorAll(`
                        a, button, input, select, textarea,
                        [role="button"],
                        [role="link"],
                        [role="tab"],
                        [role="menuitem"],
                        [role="checkbox"],
                        [role="radio"],
                        [role="switch"],
                        [role="slider"],
                        .clickable,
                        .interactive
                    `);
                    newInteractiveElements.forEach(addHapticToElement);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Custom haptic feedback for specific interactions
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', () => {
            playHapticFeedback('double');
        });
    }

    const modalCloseBtns = document.querySelectorAll('.close-install-modal, .ka-login-help-close');
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playHapticFeedback('medium');
        });
    });

    // Add haptic to search interactions
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            playHapticFeedback('light');
        });
    }

    // Add haptic to order card expansions
    const orderCards = document.querySelectorAll('.order-card');
    orderCards.forEach(card => {
        const toggleBtn = card.querySelector('.toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                playHapticFeedback('medium');
            });
        }
    });
});
