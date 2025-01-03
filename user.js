const validUsers = {
    '123': { password: '123', username: 'ABC COMPANY' },
    '456': { password: '456', username: 'HC PVT LTD' },
    'HIMANSHU': { password: 'HIMANSHU', username: 'Hreenkar Creation' },
      'H': { password: 'H', username: 'HEMANT BORANA' }
};

// Add this to your main JavaScript file

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install prompt immediately if the app isn't installed
    if (deferredPrompt) {
        showInstallPrompt();
    }
});

function showInstallPrompt() {
    if (!deferredPrompt) {
        return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        // Clear the saved prompt since it can't be used again
        deferredPrompt = null;
    });
}

// Check if the app is already installed
window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed');
    // Clear the deferredPrompt since it's no longer needed
    deferredPrompt = null;
});

// Optional: Check if the app is running in standalone mode (already installed)
function isAppInstalled() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone || // for iOS
        document.referrer.includes('android-app://')
    );
}

// Only show the prompt if the app isn't already installed
if (!isAppInstalled()) {
    window.addEventListener('load', () => {
        // Small delay to ensure everything is loaded
        setTimeout(() => {
            if (deferredPrompt) {
                showInstallPrompt();
            }
        }, 1000);
    });
}
