/**
 * Dashboard page functionality - simplified version
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get the logout button
  const logoutBtn = document.getElementById('logout-btn');
  
  // Add direct logout functionality - no complex logic
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      console.log('Logging out...');
      // Clear session data
      localStorage.removeItem('session');
      localStorage.removeItem('users');
      // Redirect immediately to login page
      window.location.href = 'login.html';
    });
  }
  
  // Check if user is logged in, redirect if not
  function checkLogin() {
    const session = localStorage.getItem('session');
    if (!session) {
      window.location.href = 'login.html';
    }
  }
  
  // Run login check
  checkLogin();
  
  // Simple background animation
  function addBackgroundStars() {
    const container = document.querySelector('.dashboard-container');
    if (container) {
      for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.classList.add('random-star');
        
        // Random size and position
        const size = 2 + Math.random() * 3;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Animation
        star.style.animation = `twinkle ${2 + Math.random() * 4}s infinite ease-in-out ${Math.random() * 2}s`;
        
        container.appendChild(star);
      }
    }
  }
  
  // Run animation
  addBackgroundStars();
});