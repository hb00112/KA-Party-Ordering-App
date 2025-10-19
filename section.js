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
    // List of all possible sections
    const allSections = [
        'loginPage',
        'otpPage',
        'welcomeScreen',
        'homeScreen',
        'placeOrderScreen',
        'recentOrdersScreen',
        'stockCheckScreen'
    ];
    
    // Hide all sections first
    allSections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
    
    // Show the requested section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        
        // Scroll to top when switching sections
        window.scrollTo(0, 0);
        
        // Initialize section-specific functionality
        initializeSectionFunctionality(sectionId);
    }
}

function initializeSectionFunctionality(sectionId) {
    switch(sectionId) {
        case 'homeScreen':
            updateHomeDateTime();
            break;
        case 'placeOrderScreen':
            // Initialize place order functionality
            if (typeof initializePlaceOrder === 'function') {
                initializePlaceOrder();
            }
            break;
        case 'recentOrdersScreen':
            // Load recent orders
            if (typeof loadRecentOrders === 'function') {
                loadRecentOrders();
            }
            break;
        case 'stockCheckScreen':
            // Load stock data
            if (typeof loadStockData === 'function') {
                loadStockData();
            }
            break;
    }
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

document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers for section headers (back to home)
    const sectionHeaders = document.querySelectorAll('.section-header h2');
    sectionHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', goBackToHome);
    });
    
    // Initialize with login page visible
    showSection('loginPage');
});

// Export functions for use in other scripts
window.showSection = showSection;
window.showWelcomeScreen = showWelcomeScreen;
window.initializeHomeScreen = initializeHomeScreen;
window.goBackToHome = goBackToHome;

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
    // Prevent multiple audio contexts from being created
    if (!window.sharedAudioContext) {
        window.sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const audioContext = window.sharedAudioContext;
    
    if ('vibrate' in navigator) {
        switch (type) {
            case 'light':
                navigator.vibrate(10);
                playSound(300, 50, 0.03); // Higher frequency, shorter duration, lower volume
                break;
            case 'medium':
                navigator.vibrate(25);
                playSound(350, 100, 0.04);
                break;
            case 'heavy':
                navigator.vibrate(35);
                playSound(400, 150, 0.05);
                break;
            case 'double':
                navigator.vibrate([10, 30, 10]);
                playDoubleSound();
                break;
            case 'error':
                navigator.vibrate([50, 100, 50]);
                playErrorSound();
                break;
        }
    }

    function playSound(frequency, duration, maxVolume) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Create a subtle filter for softer sound
        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 0.7;

        // Connect nodes: oscillator -> filter -> gain -> destination
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine'; // Use sine wave for softer sound
        oscillator.frequency.value = frequency;

        // Smooth volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(maxVolume, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000 + 0.01);
    }

    function playDoubleSound() {
        playSound(400, 50, 0.03);
        setTimeout(() => playSound(450, 50, 0.03), 80);
    }

    function playErrorSound() {
        const frequency = 200;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'triangle';
        oscillator.frequency.value = frequency;

        // Error sound envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.04, audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0.02, audioContext.currentTime + 0.2);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}
// Use playHapticFeedbackAndSound instead of playHapticFeedbackAndSound in your event listeners


// Add global haptic feedback to all interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Function to add haptic feedback to an element
    function addHapticToElement(element) {
        element.addEventListener('touchstart', () => {
            playHapticFeedbackAndSound('light');
        }, { passive: true });
        
        element.addEventListener('click', () => {
            playHapticFeedbackAndSound('light');
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
            playHapticFeedbackAndSound('double');
        });
    });

    // Error state feedback
    const errorElements = document.querySelectorAll('.error-message, .invalid-message');
    errorElements.forEach(element => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (element.style.display !== 'none') {
                        playHapticFeedbackAndSound('error');
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
            playHapticFeedbackAndSound('double');
        });
    }

    const modalCloseBtns = document.querySelectorAll('.close-install-modal, .ka-login-help-close');
    modalCloseBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            playHapticFeedbackAndSound('medium');
        });
    });

    // Add haptic to search interactions
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            playHapticFeedbackAndSound('light');
        });
    }

    // Add haptic to order card expansions
    const orderCards = document.querySelectorAll('.order-card');
    orderCards.forEach(card => {
        const toggleBtn = card.querySelector('.toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                playHapticFeedbackAndSound('medium');
            });
        }
    });
});
