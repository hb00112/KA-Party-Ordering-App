//USER.JS
const validUsers = {
    '1231': { password: '1231', username: 'admin' },
  
     '00BCDEF9012T1ZP': { password: '00BCDEF9012T1ZP', username: 'USER10' }
}
// Add this to your main JavaScript file

  // Wait for both DOM content and all resources (images, stylesheets, etc.) to load
  window.addEventListener('load', function() {
    const modal = document.getElementById('installGuideModal');
    const closeBtn = modal.querySelector('.close-install-modal');
    const gotItBtn = modal.querySelector('.got-it-btn');

    // Show modal after 2-second delay
    setTimeout(() => {
        modal.classList.remove('hidden');
        // Add fade-in animation
        modal.style.animation = 'fadeIn 0.3s ease-out';
    }, 2000);  // 2000 milliseconds = 2 seconds

    // Close modal functions
    const closeModal = () => {
        // Add fade-out animation
        modal.style.animation = 'fadeOut 0.3s ease-out';
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    closeBtn.addEventListener('click', closeModal);
    gotItBtn.addEventListener('click', closeModal);

    // Close when clicking outside the modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});
